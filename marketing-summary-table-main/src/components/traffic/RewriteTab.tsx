import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";

// Rewrite Agent: оригинал → разбор → эксперимент хуков → победитель → масштаб.
// Агент (traffic-team worker) подхватывает новые источники и запросы на масштаб сам, раз в 15 минут.

const SYN_BLUE = "#2f80ff";

type Pattern = { summary?: string; why_viral?: string; hook_formula?: string; red_line_risk?: string; structure?: string[] };
type Source = {
  id: number; url: string | null; platform: string | null; author: string | null; title: string | null;
  views: number | null; author_median_views: number | null; virality_x: string | null; score: number | null;
  pattern: Pattern | null; channels: string; language: string; status: string; error: string | null; created_at: string;
};
type VariantRow = {
  id: number; variant: string; channel: string; hook: string | null; status: string; permalink: string | null;
  views: number | null; likes: number | null; replies: number | null; reposts: number | null; shares: number | null; saves: number | null;
};
type Exp = {
  id: number; source_id: number | null; parent_experiment_id: number | null; hypothesis: string | null;
  hook_formula: string | null; status: string; winner_content_id: number | null; decision: string | null;
  source_url: string | null; source_author: string | null; variants: VariantRow[];
};

const CHANNELS = [
  ["threads", "Threads"], ["instagram_reels", "Reels"], ["tiktok", "TikTok"],
  ["youtube_shorts", "Shorts"], ["instagram_carousel", "Карусель"], ["telegram", "Telegram"],
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "ждёт разбора", analyzed: "разобран", experiment: "в эксперименте", skipped: "пропущен", failed: "ошибка",
  running: "идёт тест", decided: "есть победитель", scale_requested: "масштаб запрошен", scaled: "масштабирован",
};

// тот же порог, что у агента (rewrite.evaluate): меньше просмотров — вариант не участвует в решении
const MIN_VIEWS = 300;

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("ru-RU");
const er = (v: VariantRow) => {
  if (!v.views) return null;
  const eng = (v.likes ?? 0) + (v.replies ?? 0) + (v.reposts ?? 0) + (v.shares ?? 0) + (v.saves ?? 0);
  return eng / v.views;
};

export function RewriteTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [exps, setExps] = useState<Exp[]>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [channels, setChannels] = useState<string[]>(["threads", "instagram_reels"]);
  const [language, setLanguage] = useState("RU");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([api.get("rewrite-sources"), api.get("experiments-board")]);
    setSources(Array.isArray(s) ? s : []);
    setExps(Array.isArray(e) ? e : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!url.trim() && !text.trim()) return;
    setSaving(true);
    await api.post("rewrite-sources", {
      url: url.trim() || null, original_text: text.trim() || null,
      channels: channels.join(","), language, status: "new",
    });
    setUrl(""); setText(""); setSaving(false);
    load();
  };
  const toggle = (c: string) => setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const requestScale = async (id: number) => {
    await api.put("experiments", id, { status: "scale_requested" });
    setExps((prev) => prev.map((e) => (e.id === id ? { ...e, status: "scale_requested" } : e)));
  };

  const input = "bg-background border border-border rounded-md px-2.5 py-2 text-xs text-foreground w-full";

  return (
    <section className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <div className="text-sm font-medium text-foreground">Новый оригинал на разбор</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Ссылка на виральный Reels / Shorts / TikTok / пост или сам текст. Для Instagram лучше вставить текст или транскрипт:
            он часто не отдаёт данные без входа. Агент разберёт паттерн и, если score ≥ 6, сделает эксперимент с хуками в «Очередь».
          </div>
        </div>
        <input className={input} placeholder="https://www.youtube.com/shorts/..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <textarea className={`${input} min-h-[90px]`} placeholder="Текст поста или транскрипт ролика (необязательно, если ссылка отдаётся)"
          value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap items-center gap-1.5">
          {CHANNELS.map(([id, label]) => (
            <button key={id} onClick={() => toggle(id)}
              className={`px-2.5 py-1 text-xs rounded-md border ${channels.includes(id) ? "border-transparent text-white" : "border-border text-muted-foreground hover:text-foreground"}`}
              style={channels.includes(id) ? { background: SYN_BLUE } : undefined}>
              {label}
            </button>
          ))}
          <select className="ml-2 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="RU">RU</option><option value="EN">EN</option>
          </select>
          <button onClick={add} disabled={saving || !channels.length}
            className="ml-auto px-4 py-1.5 text-xs rounded-md text-white disabled:opacity-50" style={{ background: SYN_BLUE }}>
            {saving ? "Добавляю…" : "Отдать агенту"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Эксперименты</div>
        {!exps.length && <div className="text-xs text-muted-foreground">Пока нет. Появятся после разбора первого оригинала.</div>}
        <div className="grid gap-3 xl:grid-cols-2">
          {exps.map((e) => {
            return (
              <article key={e.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Эксперимент #{e.id}</span>
                  {e.parent_experiment_id && <span>масштаб #{e.parent_experiment_id}</span>}
                  {e.source_author && <span>· по мотивам {e.source_author}</span>}
                  <span className="ml-auto px-1.5 py-0.5 rounded bg-muted">{STATUS_LABEL[e.status] ?? e.status}</span>
                </div>
                {e.hypothesis && <div className="text-xs text-foreground">{e.hypothesis}</div>}
                {e.hook_formula && <div className="text-[11px] text-muted-foreground">Формула хука: {e.hook_formula}</div>}
                <table className="w-full text-xs">
                  <thead><tr className="text-muted-foreground text-left">
                    <th className="font-medium py-1 pr-2">Вар.</th><th className="font-medium py-1 pr-2">Хук</th>
                    <th className="font-medium py-1 pr-2 text-right">Просм.</th><th className="font-medium py-1 text-right">ER</th>
                  </tr></thead>
                  <tbody>{e.variants.map((v) => {
                    const rate = er(v);
                    const winner = v.id === e.winner_content_id;
                    return (
                      <tr key={v.id} className="border-t border-border/50 align-top">
                        <td className="py-1.5 pr-2 whitespace-nowrap text-foreground">{winner ? "🏆 " : ""}{v.variant} <span className="text-muted-foreground">{v.channel}</span></td>
                        <td className="py-1.5 pr-2 text-foreground/90">
                          {v.permalink ? <a href={v.permalink} target="_blank" rel="noreferrer" className="hover:underline">{v.hook}</a> : v.hook}
                          {v.status !== "published" && <span className="ml-1 text-[10px] text-muted-foreground">({v.status})</span>}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums text-foreground">{v.views ? fmt(v.views) : "—"}</td>
                        <td className={`py-1.5 text-right tabular-nums ${(v.views ?? 0) < MIN_VIEWS ? "text-muted-foreground" : "text-foreground"}`}
                          style={winner ? { color: SYN_BLUE, fontWeight: 600 } : undefined}
                          title={(v.views ?? 0) < MIN_VIEWS ? `меньше ${MIN_VIEWS} просмотров: в решении не участвует` : undefined}>
                          {rate === null ? "—" : `${(rate * 100).toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
                {e.status === "running" && e.variants.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">Победитель определится сам: 2+ опубликованных варианта, ≥{MIN_VIEWS} просмотров, ≥24 ч.</div>
                )}
                {e.decision && <div className="text-[11px] text-foreground border-t border-border pt-2">{e.decision}</div>}
                {e.status === "decided" && (
                  <button onClick={() => requestScale(e.id)} className="w-full text-xs py-1.5 rounded-md text-white" style={{ background: SYN_BLUE }}>
                    📈 Масштабировать победителя
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Оригиналы</div>
        {!sources.length && <div className="text-xs text-muted-foreground">Пока пусто.</div>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((s) => (
            <article key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">#{s.id} {s.platform}</span>
                {s.author && <span className="truncate">@{s.author}</span>}
                <span className="ml-auto px-1.5 py-0.5 rounded bg-muted">{STATUS_LABEL[s.status] ?? s.status}</span>
              </div>
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="block text-[11px] text-muted-foreground truncate hover:underline">{s.url}</a>}
              <div className="flex gap-3 text-[11px] text-muted-foreground tabular-nums">
                {s.views !== null && <span>{fmt(s.views)} просм.</span>}
                {s.virality_x && <span style={{ color: SYN_BLUE }}>×{Number(s.virality_x).toFixed(1)} к медиане</span>}
                {s.score !== null && <span>score {s.score}/10</span>}
              </div>
              {s.pattern?.hook_formula && <div className="text-xs text-foreground">Хук: {s.pattern.hook_formula}</div>}
              {s.pattern?.why_viral && <div className="text-[11px] text-muted-foreground">{s.pattern.why_viral}</div>}
              {s.error && <div className="text-[11px] text-red-500">{s.error}</div>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
