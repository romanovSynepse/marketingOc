import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { RewriteTab } from "@/components/traffic/RewriteTab";

// Синий акцент Syneps (как на доске продукта)
const SYN_BLUE = "#2f80ff";

type ContentItem = {
  id: number; channel: string; account: string; format: string | null; rubric: string | null;
  language: string; hook: string | null; body: string | null; cta: string | null;
  visual_brief: string | null; utm_url: string | null; status: string; permalink: string | null;
  error: string | null; created_at: string;
};
type Activity = {
  id: number; date: string; channel: string; activity: string; campaign: string | null; cost: number;
  reach: number; clicks: number; leads: number; signups: number; payments: number; revenue: number;
};
type Daily = { id: number; date: string; channel: string; account: string; followers: number; views: number; reach: number; engagement: number };
type Lead = { id: number; brand: string; website: string | null; fit_score: number; why_fit: string | null; contact: string | null; subject: string | null; message: string | null; status: string };

const TABS = [
  { id: "queue", label: "Очередь", icon: "Inbox" },
  { id: "rewrite", label: "Rewrite", icon: "Repeat2" },
  { id: "funnel", label: "Оцифровка", icon: "GitBranch" },
  { id: "channels", label: "Каналы", icon: "BarChart3" },
  { id: "outreach", label: "Аутрич", icon: "Send" },
] as const;
type TabId = typeof TABS[number]["id"];

const CHANNEL_LABEL: Record<string, string> = {
  threads: "Threads", instagram: "Instagram", instagram_reels: "Reels", instagram_carousel: "Карусель",
  instagram_stories: "Stories", tiktok: "TikTok", youtube_shorts: "Shorts", telegram: "Telegram",
  linkedin: "LinkedIn", x: "X", outreach: "Аутрич",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", approved: "bg-[#2f80ff]/15 text-[#2f80ff]",
  published: "bg-emerald-500/15 text-emerald-500", rejected: "bg-muted text-muted-foreground line-through",
  failed: "bg-red-500/15 text-red-500", drafted: "bg-muted text-muted-foreground", sent: "bg-emerald-500/15 text-emerald-500",
};

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("ru-RU");

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

export default function Traffic() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("queue");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("draft");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, a, d, l] = await Promise.all([
        api.get("content-items"), api.get("traffic-activities"), api.get("channel-daily"), api.get("outreach-leads"),
      ]);
      setItems(Array.isArray(c) ? c : []); setActivities(Array.isArray(a) ? a : []);
      setDaily(Array.isArray(d) ? d : []); setLeads(Array.isArray(l) ? l : []);
      setError("");
    } catch {
      setError("Бэкенд недоступен: запусти docker compose up");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setItemStatus = async (id: number, status: string) => {
    await api.put("content-items", id, { status });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };
  const setLeadStatus = async (id: number, status: string) => {
    await api.put("outreach-leads", id, { status });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const totals = useMemo(() => activities.reduce(
    (t, a) => ({ reach: t.reach + a.reach, clicks: t.clicks + a.clicks, leads: t.leads + a.leads,
      signups: t.signups + a.signups, payments: t.payments + a.payments, revenue: t.revenue + a.revenue, cost: t.cost + a.cost }),
    { reach: 0, clicks: 0, leads: 0, signups: 0, payments: 0, revenue: 0, cost: 0 }), [activities]);

  const queueCounts = useMemo(() => items.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1; return acc;
  }, {}), [items]);

  const igDaily = useMemo(() => daily
    .filter((d) => d.channel === "instagram")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ date: d.date.slice(5), views: d.views, reach: d.reach, engagement: d.engagement })), [daily]);
  const followers = Math.max(0, ...daily.filter((d) => d.channel === "instagram").map((d) => d.followers));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center gap-2 h-12">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: SYN_BLUE }}>
            <Icon name="Zap" size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground mr-2">Traffic HQ</span>
          <nav className="flex items-center gap-0.5 overflow-x-auto flex-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${tab === t.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon name={t.icon} size={13} />{t.label}
              </button>
            ))}
          </nav>
          <button onClick={load} title="Обновить" className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
            <Icon name="RefreshCw" size={14} />
          </button>
          <button onClick={() => navigate("/")} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            РНП
          </button>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {error && <div className="text-xs text-red-500 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Stat label="На апруве" value={fmt(queueCounts.draft)} hint={`одобрено ${fmt(queueCounts.approved)}`} />
          <Stat label="Опубликовано" value={fmt(queueCounts.published)} hint={queueCounts.failed ? `ошибок ${queueCounts.failed}` : undefined} />
          <Stat label="Охват (оцифровка)" value={fmt(totals.reach)} />
          <Stat label="Клики" value={fmt(totals.clicks)} />
          <Stat label="Заявки / DM" value={fmt(totals.leads)} />
          <Stat label="Регистрации" value={fmt(totals.signups)} />
          <Stat label="Оплаты" value={fmt(totals.payments)} hint={totals.revenue ? `$${fmt(totals.revenue)}` : undefined} />
        </div>

        {tab === "queue" && (
          <section className="space-y-3">
            <div className="flex items-center gap-1">
              {["draft", "approved", "published", "failed", "rejected"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs rounded-md ${statusFilter === s ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {s} {queueCounts[s] ? `· ${queueCounts[s]}` : ""}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.filter((i) => i.status === statusFilter).map((i) => (
                <article key={i.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{CHANNEL_LABEL[i.channel] ?? i.channel}</span>
                    <span>@{i.account}</span><span>{i.language}</span>
                    {i.rubric && <span className="truncate">· {i.rubric}</span>}
                    <span className="ml-auto"><Badge status={i.status} /></span>
                  </div>
                  {i.hook && <div className="text-sm font-semibold text-foreground">{i.hook}</div>}
                  <div className="text-xs text-foreground/80 whitespace-pre-wrap max-h-56 overflow-auto">{i.body}</div>
                  {i.cta && <div className="text-xs" style={{ color: SYN_BLUE }}>{i.cta}</div>}
                  {i.visual_brief && <div className="text-[11px] text-muted-foreground border-t border-border pt-2">🎬 {i.visual_brief}</div>}
                  {i.error && <div className="text-[11px] text-red-500">{i.error}</div>}
                  {i.permalink && <a href={i.permalink} target="_blank" rel="noreferrer" className="text-[11px] underline text-muted-foreground">открыть пост</a>}
                  <div className="flex gap-2 mt-auto pt-2">
                    {(i.status === "draft" || i.status === "failed") && (
                      <button onClick={() => setItemStatus(i.id, "approved")} className="flex-1 text-xs py-1.5 rounded-md text-white" style={{ background: SYN_BLUE }}>✓ Approve</button>
                    )}
                    {i.status !== "published" && i.status !== "rejected" && (
                      <button onClick={() => setItemStatus(i.id, "rejected")} className="flex-1 text-xs py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground">✕ Reject</button>
                    )}
                    {i.status === "approved" && (
                      <button onClick={() => setItemStatus(i.id, "draft")} className="flex-1 text-xs py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground">↺ В черновики</button>
                    )}
                  </div>
                </article>
              ))}
              {!items.some((i) => i.status === statusFilter) && (
                <div className="text-xs text-muted-foreground">Пусто. Черновики создаёт команда: <code>python -m synteam write --channel threads --count 5</code></div>
              )}
            </div>
          </section>
        )}

        {tab === "funnel" && <FunnelTab activities={activities} onAdded={load} />}

        {tab === "channels" && (
          <section className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Instagram: подписчики" value={fmt(followers)} hint="@nickromanov" />
              <Stat label="Просмотры за период" value={fmt(igDaily.reduce((s, d) => s + d.views, 0))} />
              <Stat label="Охват за период" value={fmt(igDaily.reduce((s, d) => s + d.reach, 0))} />
              <Stat label="Взаимодействия" value={fmt(igDaily.reduce((s, d) => s + d.engagement, 0))} />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-sm font-medium text-foreground mb-1">Instagram @nickromanov: охват по дням</div>
              <div className="text-[11px] text-muted-foreground mb-3">Источник: Metricool. Наведи на столбец, чтобы увидеть значение.</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={igDaily} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [fmt(v), "Охват"]} />
                    <Bar dataKey="reach" fill={SYN_BLUE} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <Table head={["Дата", "Канал", "Аккаунт", "Подписчики", "Просмотры", "Охват", "Взаимодействия"]}
              rows={[...daily].sort((a, b) => b.date.localeCompare(a.date)).map((d) => [
                d.date, CHANNEL_LABEL[d.channel] ?? d.channel, d.account, d.followers ? fmt(d.followers) : "—", fmt(d.views), fmt(d.reach), fmt(d.engagement)])} />
          </section>
        )}

        {tab === "rewrite" && <RewriteTab />}

        {tab === "outreach" && (
          <section className="grid gap-3 md:grid-cols-2">
            {leads.map((l) => (
              <article key={l.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{l.brand}</span>
                  <span className="text-[11px] text-muted-foreground">fit {l.fit_score}/10</span>
                  <span className="ml-auto"><Badge status={l.status} /></span>
                </div>
                {l.why_fit && <div className="text-[11px] text-muted-foreground">{l.why_fit}</div>}
                <div className="text-xs text-foreground font-medium">{l.subject}</div>
                <div className="text-xs text-foreground/80 whitespace-pre-wrap">{l.message}</div>
                <div className="text-[11px] text-muted-foreground">Контакт: {l.contact || "не найден"}</div>
                {l.status === "drafted" && (
                  <div className="flex gap-2">
                    <button onClick={() => setLeadStatus(l.id, "approved")} className="flex-1 text-xs py-1.5 rounded-md text-white" style={{ background: SYN_BLUE }}>✓ Отправить</button>
                    <button onClick={() => setLeadStatus(l.id, "lost")} className="flex-1 text-xs py-1.5 rounded-md bg-muted text-muted-foreground">✕ Не подходит</button>
                  </div>
                )}
              </article>
            ))}
            {!leads.length && <div className="text-xs text-muted-foreground">Лидов пока нет: <code>python -m synteam outreach --csv brands.csv</code></div>}
          </section>
        )}
      </main>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-muted-foreground border-b border-border">{head.map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className="border-b border-border/50 last:border-0">{r.map((c, j) => <td key={j} className="px-3 py-2 tabular-nums whitespace-nowrap text-foreground">{c}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

const EMPTY = { channel: "threads", activity: "", campaign: "", reach: 0, clicks: 0, leads: 0, signups: 0, payments: 0, revenue: 0, cost: 0 };

function FunnelTab({ activities, onAdded }: { activities: Activity[]; onAdded: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const num = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) || 0 });
  const save = async () => {
    if (!form.activity) return;
    await api.post("traffic-activities", form);
    setForm(EMPTY);
    onAdded();
  };
  const input = "bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground w-full";
  return (
    <section className="space-y-3">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-sm font-medium text-foreground mb-3">Записать активность</div>
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-11 gap-2 items-end">
          <select className={input} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            {Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className={`${input} md:col-span-2`} placeholder="Что сделали (пост, эфир, рассылка)" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} />
          <input className={input} placeholder="Кампания" value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} />
          {(["cost", "reach", "clicks", "leads", "signups", "payments"] as const).map((k) => (
            <label key={k} className="text-[10px] text-muted-foreground">
              {{ cost: "Затраты", reach: "Охват", clicks: "Клики", leads: "Заявки", signups: "Регистр.", payments: "Оплаты" }[k]}
              <input type="number" className={input} value={form[k] || ""} onChange={num(k)} />
            </label>
          ))}
          <button onClick={save} className="text-xs py-1.5 rounded-md text-white" style={{ background: SYN_BLUE }}>Добавить</button>
        </div>
      </div>
      <Table head={["Дата", "Канал", "Активность", "Кампания", "Затраты", "Охват", "Клики", "Заявки", "Регистр.", "Оплаты", "Конв. в заявку"]}
        rows={activities.map((a) => [
          a.date, CHANNEL_LABEL[a.channel] ?? a.channel, a.activity, a.campaign ?? "", fmt(a.cost), fmt(a.reach), fmt(a.clicks),
          fmt(a.leads), fmt(a.signups), fmt(a.payments), a.clicks ? `${((a.leads / a.clicks) * 100).toFixed(1)}%` : "—"])} />
    </section>
  );
}
