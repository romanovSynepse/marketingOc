"""Writer / Rewriter: пишет посты, сценарии Reels/Shorts, карусели и посты в TG.

Рерайт («клонирование») = берём паттерн чужого вирального контента и пишем новую единицу под Syneps.
"""
from typing import Literal

from pydantic import BaseModel

from .. import db, llm, utm

ROLE = """Роль: Writer / Rewriter команды. Пишешь от лица Ника Романова (voice.md) по рубрикам.
Правила:
- Threads: пост до 450 символов, первая строка = хук, без хэштегов-простыней, максимум 1 эмодзи.
- Reels / Shorts / TikTok: сценарий 20–45 с. Хук на 0–3 с, таймкоды, текст на экране, что в кадре
  (скринкаст доски Syneps, лицо Ника, B-roll). Отдельно CTA с кодовым словом.
- Карусель: 6–10 слайдов, слайд 1 = хук, последний = CTA. Визуальный бриф в стиле тёмный фон + синий акцент.
- Telegram: 600–1200 символов, можно глубже и честнее.
- Рерайт: используй паттерн, а не текст оригинала. Ни одной фразы оригинала дословно.
- Цифры только из product.md. Каждая единица ведёт к целевому действию (демо, регистрация, DM по кодовому слову)."""

Channel = Literal["threads", "instagram_reels", "instagram_carousel", "instagram_stories",
                  "tiktok", "youtube_shorts", "telegram", "linkedin", "x"]


class Draft(BaseModel):
    channel: Channel
    format: str
    rubric: str
    language: Literal["RU", "EN"]
    hook: str
    body: str
    cta: str
    visual_brief: str
    pattern_used: str


class Batch(BaseModel):
    drafts: list[Draft]


def _save(drafts: list[Draft], account: str, source_url: str = "") -> list[dict]:
    saved = []
    for d in drafts:
        row = db.insert("content_items", {
            "channel": d.channel, "account": account, "format": d.format, "rubric": d.rubric,
            "language": d.language, "hook": d.hook, "body": d.body, "cta": d.cta,
            "visual_brief": d.visual_brief, "pattern": d.pattern_used, "source_url": source_url,
            "status": "draft", "created_by_agent": "writer",
        })
        link = utm.build(d.channel, utm.slug(d.format), utm.slug(d.rubric), f"c{row['id']}")
        db.update("content_items", row["id"], {"utm_url": link})
        row["utm_url"] = link
        saved.append(row)
    return saved


def write(channel: str, count: int, brief: str = "", language: str = "RU",
          account: str = "nickromanov") -> list[dict]:
    task = (f"Напиши {count} единиц контента для канала {channel} на языке {language}. "
            f"Распредели по разным рубрикам из voice.md.\n")
    if brief:
        task += f"Бриф на сегодня:\n{brief}\n"
    batch = llm.run(ROLE, task, Batch, effort="medium")
    db.log_run("writer", task, f"{len(batch.drafts)} черновиков для {channel}")
    return _save(batch.drafts, account)


def rewrite(original: str, channels: list[str], variants: int = 3, language: str = "RU",
            account: str = "nickromanov", source_url: str = "") -> list[dict]:
    task = (f"Вот виральный оригинал (текст, транскрипт или описание ролика):\n<original>\n{original}\n</original>\n"
            f"1) Разложи паттерн. 2) Напиши по {variants} новых единиц для каждого канала: {', '.join(channels)}. "
            f"Язык: {language}. Хуки в вариантах должны отличаться, чтобы их можно было A/B-тестировать.")
    batch = llm.run(ROLE, task, Batch, effort="high")
    db.log_run("rewriter", task, f"{len(batch.drafts)} вариаций из оригинала")
    return _save(batch.drafts, account, source_url)
