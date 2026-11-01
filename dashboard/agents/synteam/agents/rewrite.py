"""Rewrite Agent: виральный оригинал → разбор → эксперимент с хуками → победитель → масштаб.

Цикл, который продаёт Syneps, только на собственном аккаунте Ника:
  1. source   ссылка или текст (дашборд или CLI), метрики и транскрипт через yt-dlp
  2. analyze  паттерн, формула хука, оценка «стоит ли брать», x к медиане автора
  3. experiment  3–5 вариантов с разными хуками на одном теле → очередь на апрув
  4. evaluate через 24–48 ч: победитель по вовлечению (при минимуме просмотров)
  5. scale    новые единицы по формуле победителя, уже на другие темы
"""
from datetime import datetime

from pydantic import BaseModel
from psycopg2.extras import Json

from .. import db, llm, utm
from ..integrations import media
from .writer import Draft

ROLE = """Роль: Rewrite Agent. Работаешь с одним виральным оригиналом за раз.
Рерайт строго уровня 2–3 (red_lines.md): берёшь механику (хук, структуру, удержание, триггер),
пишешь новую единицу про Syneps / AI-маркетинг соло / кейсы. Ни одной фразы оригинала дословно.
Если паттерн нельзя перенести без нарушения красных линий или он не про нашу аудиторию,
честно ставь низкий score."""


class Analysis(BaseModel):
    summary: str
    why_viral: str
    hook_formula: str          # шаблон хука с переменными, например «Я [сделал X] за [срок]. Вот [N] шагов»
    structure: list[str]       # блоки по порядку
    retention_mechanic: str
    trigger: str
    audience_fit: str
    red_line_risk: str
    score: int                 # 1–10: брать ли в работу


class Variant(BaseModel):
    label: str                 # A, B, C...
    hook_angle: str            # чем этот хук отличается от остальных
    draft: Draft


class Experiment(BaseModel):
    hypothesis: str
    variants: list[Variant]


def add_source(url: str = "", text: str = "", channels: str = "threads,instagram_reels",
               language: str = "RU") -> dict:
    return db.insert("rewrite_sources", {
        "url": url or None, "original_text": text or None, "platform": media.platform_of(url) if url else "text",
        "channels": channels, "language": language, "status": "new"})


def analyze(source_id: int) -> dict:
    src = db.query("SELECT * FROM rewrite_sources WHERE id=%s", (source_id,))[0]
    fields = {}
    if src["url"] and not src["original_text"]:
        meta = media.fetch(src["url"])
        fields = {k: meta[k] for k in ("platform", "author", "title", "views", "likes", "comments",
                                       "author_median_views")}
        fields["original_text"] = meta["text"] or None
        if meta["views"] and meta["author_median_views"]:
            fields["virality_x"] = round(meta["views"] / max(meta["author_median_views"], 1), 2)
        src.update(fields)
    if not src.get("original_text"):
        raise RuntimeError("Нет текста оригинала: платформа не отдала данные, вставь текст или транскрипт вручную")

    task = (f"Оригинал ({src['platform']}, автор {src.get('author') or '—'}):\n<original>\n{src['original_text']}\n</original>\n"
            f"Метрики: просмотры {src.get('views')}, лайки {src.get('likes')}, комментарии {src.get('comments')}, "
            f"медиана автора {src.get('author_median_views')}, x к медиане {src.get('virality_x')}.\n"
            "Разбери паттерн.")
    analysis = llm.run(ROLE, task, Analysis, effort="medium")
    fields.update(pattern=Json(analysis.model_dump()), score=analysis.score, status="analyzed", error=None)
    db.update("rewrite_sources", source_id, fields)
    db.log_run("rewrite.analyze", task, analysis.summary)
    return analysis.model_dump()


def start_experiment(source_id: int, variants: int = 4, account: str = "nickromanov") -> int:
    src = db.query("SELECT * FROM rewrite_sources WHERE id=%s", (source_id,))[0]
    channels = [c.strip() for c in (src["channels"] or "threads").split(",") if c.strip()]
    task = (f"Паттерн оригинала:\n{src['pattern']}\n\n"
            f"Сделай эксперимент: {variants} варианта для каждого канала ({', '.join(channels)}), язык {src['language']}. "
            "Внутри канала тело и CTA почти одинаковые, отличается хук (разный угол: цифра, боль, провокация, "
            "история, вопрос), чтобы A/B показал, какой хук работает. Метки вариантов A, B, C...")
    exp = llm.run(ROLE, task, Experiment, effort="high")
    row = db.insert("experiments", {"source_id": source_id, "hypothesis": exp.hypothesis,
                                    "hook_formula": src["pattern"].get("hook_formula") if src["pattern"] else None})
    _save_variants(row["id"], exp.variants, account, src["url"] or "")
    db.update("rewrite_sources", source_id, {"status": "experiment"})
    db.log_run("rewrite.experiment", task, f"эксперимент #{row['id']}: {len(exp.variants)} вариантов")
    return row["id"]


def _save_variants(experiment_id: int, variants: list[Variant], account: str, source_url: str) -> None:
    for v in variants:
        d = v.draft
        item = db.insert("content_items", {
            "channel": d.channel, "account": account, "format": d.format, "rubric": d.rubric,
            "language": d.language, "hook": d.hook, "body": d.body, "cta": d.cta,
            "visual_brief": d.visual_brief, "pattern": f"{v.label}: {v.hook_angle}", "source_url": source_url,
            "status": "draft", "created_by_agent": "rewrite", "experiment_id": experiment_id, "variant": v.label})
        db.update("content_items", item["id"], {
            "utm_url": utm.build(d.channel, utm.slug(d.format), f"exp{experiment_id}", f"{v.label}-c{item['id']}")})


def evaluate(experiment_id: int, min_views: int = 300, min_age_hours: int = 24) -> dict:
    """Победитель = лучший engagement rate среди опубликованных вариантов, набравших min_views."""
    rows = db.query("""
        SELECT c.id, c.variant, c.channel, c.hook, c.published_at, m.views,
               (m.likes + m.replies + m.reposts + m.shares + m.saves) AS eng
        FROM content_items c
        JOIN LATERAL (SELECT * FROM content_metrics WHERE content_id=c.id ORDER BY collected_at DESC LIMIT 1) m ON true
        WHERE c.experiment_id=%s AND c.status='published'""", (experiment_id,))
    ripe = [r for r in rows if r["views"] >= min_views
            and (datetime.now() - r["published_at"]).total_seconds() >= min_age_hours * 3600]
    if len(ripe) < 2:
        return {"decided": False, "reason": f"готовых вариантов {len(ripe)} из {len(rows)} (нужно 2+, ≥{min_views} просмотров, ≥{min_age_hours} ч)"}
    for r in ripe:
        r["er"] = r["eng"] / r["views"]
    ripe.sort(key=lambda r: r["er"], reverse=True)
    win, second = ripe[0], ripe[1]
    lift = (win["er"] / second["er"] - 1) * 100 if second["er"] else 100.0
    decision = (f"Победил {win['variant']} ({win['channel']}): ER {win['er']:.1%} на {win['views']} просмотрах, "
                f"+{lift:.0f}% к {second['variant']}. Хук: {win['hook']}")
    db.query("UPDATE experiments SET status='decided', winner_content_id=%s, decision=%s, decided_at=NOW() WHERE id=%s",
             (win["id"], decision, experiment_id))
    return {"decided": True, "decision": decision, "winner_id": win["id"]}


class ScaleBatch(BaseModel):
    variants: list[Variant]


def scale(experiment_id: int, count: int = 6, account: str = "nickromanov") -> int:
    """Новые единицы по формуле хука победителя, но на другие темы: масштабируем механику, а не текст."""
    exp = db.query("SELECT * FROM experiments WHERE id=%s", (experiment_id,))[0]
    win = db.query("SELECT * FROM content_items WHERE id=%s", (exp["winner_content_id"],))[0] if exp["winner_content_id"] else None
    if not win:
        raise RuntimeError("У эксперимента ещё нет победителя: сначала evaluate")
    task = (f"Победивший вариант:\nХук: {win['hook']}\nТекст: {win['body']}\nКанал: {win['channel']}\n"
            f"Решение: {exp['decision']}\nФормула хука: {exp['hook_formula']}\n\n"
            f"Сделай {count} новых единиц по той же механике хука, но на разные темы из product.md и voice.md "
            f"(кейсы, build in public, AI-маркетинг соло, горячие мнения). Канал {win['channel']}, язык {win['language']}.")
    batch = llm.run(ROLE, task, ScaleBatch, effort="medium")
    child = db.insert("experiments", {"source_id": exp["source_id"], "parent_experiment_id": experiment_id,
                                      "hypothesis": f"Масштаб победителя эксперимента #{experiment_id}",
                                      "hook_formula": exp["hook_formula"]})
    _save_variants(child["id"], batch.variants, account, win.get("source_url") or "")
    db.update("experiments", experiment_id, {"status": "scaled"})
    db.log_run("rewrite.scale", task, f"#{experiment_id} → #{child['id']}: {len(batch.variants)} единиц")
    return child["id"]


def tick() -> list[str]:
    """Один проход автопилота: новые источники, решения по экспериментам, запросы на масштаб из дашборда."""
    events = []
    for src in db.query("SELECT id FROM rewrite_sources WHERE status='new' ORDER BY id LIMIT 3"):
        try:
            a = analyze(src["id"])
            if a["score"] >= 6:
                exp_id = start_experiment(src["id"])
                events.append(f"🧪 Источник #{src['id']} (score {a['score']}): эксперимент #{exp_id} в очереди на апрув")
            else:
                db.update("rewrite_sources", src["id"], {"status": "skipped"})
                events.append(f"⏭ Источник #{src['id']} пропущен: score {a['score']}. {a['red_line_risk']}")
        except Exception as e:
            db.update("rewrite_sources", src["id"], {"status": "failed", "error": str(e)[:1000]})
            events.append(f"⚠️ Источник #{src['id']}: {e}")
    for exp in db.query("SELECT id FROM experiments WHERE status='running'"):
        result = evaluate(exp["id"])
        if result["decided"]:
            events.append(f"🏆 Эксперимент #{exp['id']}: {result['decision']}")
    for exp in db.query("SELECT id FROM experiments WHERE status='scale_requested'"):
        try:
            events.append(f"📈 Эксперимент #{exp['id']} масштабирован → #{scale(exp['id'])}")
        except Exception as e:
            db.update("experiments", exp["id"], {"status": "decided"})
            events.append(f"⚠️ Масштаб #{exp['id']}: {e}")
    return events
