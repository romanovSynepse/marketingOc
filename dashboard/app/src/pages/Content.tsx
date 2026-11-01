import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaplanItem {
  id: number;
  week: string;
  channel: string;
  format: string;
  theme: string;
  responsible: string;
  budget: number;
  reach: number;
  status: string;
}

interface ContentMatrixItem {
  id: number;
  type: string;
  formats: string;
  goal: string;
  frequency: string;
  examples: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function TopNav({ active }: { active: string }) {
  const navigate = useNavigate();
  const items = [
    { path: "/dashboard", label: "Дашборд",     icon: "LayoutDashboard" },
    { path: "/",          label: "Основное",     icon: "Table2" },
    { path: "/analytics", label: "Аналитика",    icon: "LineChart" },
    { path: "/economics", label: "Экономика",    icon: "Calculator" },
    { path: "/research",  label: "Исследование", icon: "Search" },
    { path: "/content",   label: "Контент",      icon: "Film" },
    { path: "/data",      label: "Данные",        icon: "Database" },
  ] as const;
  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap font-medium ${
            active === item.path
              ? "tab-active bg-[#b5f23d]/8"
              : "tab-inactive hover:bg-muted"
          }`}
        >
          <Icon name={item.icon as "Activity"} size={13} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Опубликовано": "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",
    "В работе":     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Планируется":  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Отменено":     "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
        map[status] ?? "bg-muted text-muted-foreground border border-border"
      }`}
    >
      {status}
    </span>
  );
}

function PlaceholderSection({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="bg-card border border-dashed border-border rounded-xl w-14 h-14 flex items-center justify-center">
        <Icon name={icon as "Activity"} size={22} className="text-muted-foreground" />
      </div>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 max-w-xs">{desc}</div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
        <Icon name="Clock" size={11} />
        Скоро
      </span>
    </div>
  );
}

function LoadingText() {
  return (
    <div className="text-xs text-muted-foreground py-10 text-center">Загрузка...</div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const CONTENT_TABS = [
  { id: "mediaplan", label: "Медиаплан",             icon: "CalendarDays" },
  { id: "matrix",    label: "Матрица контента",       icon: "Grid3X3" },
  { id: "shoots",    label: "Съёмки и производство",  icon: "Clapperboard" },
] as const;
type CTabId = typeof CONTENT_TABS[number]["id"];

// ─── Matrix card accent palette (dark-friendly) ───────────────────────────────
const MATRIX_ACCENTS = [
  { border: "border-l-blue-500",    dot: "bg-blue-500",    head: "text-blue-400" },
  { border: "border-l-violet-500",  dot: "bg-violet-500",  head: "text-violet-400" },
  { border: "border-l-[#b5f23d]",   dot: "bg-[#b5f23d]",   head: "text-[#b5f23d]" },
  { border: "border-l-orange-500",  dot: "bg-orange-500",  head: "text-orange-400" },
  { border: "border-l-cyan-500",    dot: "bg-cyan-500",    head: "text-cyan-400" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Content() {
  const [activeTab, setActiveTab] = useState<CTabId>("mediaplan");

  const [mediaplan, setMediaplan]           = useState<MediaplanItem[]>([]);
  const [mediaplanLoading, setMediaplanLoading] = useState(false);

  const [contentMatrix, setContentMatrix]   = useState<ContentMatrixItem[]>([]);
  const [matrixLoading, setMatrixLoading]   = useState(false);

  // ── Lazy load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "mediaplan" && mediaplan.length === 0 && !mediaplanLoading) {
      setMediaplanLoading(true);
      api.get("mediaplan")
        .then((data) => setMediaplan(Array.isArray(data) ? data : []))
        .catch(() => setMediaplan([]))
        .finally(() => setMediaplanLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "matrix" && contentMatrix.length === 0 && !matrixLoading) {
      setMatrixLoading(true);
      api.get("content-matrix")
        .then((data) => setContentMatrix(Array.isArray(data) ? data : []))
        .catch(() => setContentMatrix([]))
        .finally(() => setMatrixLoading(false));
    }
  }, [activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAddMediaplan = async () => {
    const week = prompt("Неделя (например, Нед 1):");
    if (!week?.trim()) return;
    const channel     = prompt("Канал (например, Instagram Reels):") ?? "";
    const theme       = prompt("Тема публикации:") ?? "";
    const responsible = prompt("Ответственный:") ?? "";
    const created = await api.post("mediaplan", {
      week:        week.trim(),
      channel:     channel.trim(),
      theme:       theme.trim(),
      responsible: responsible.trim(),
      format:      "",
      budget:      0,
      reach:       0,
      status:      "Планируется",
    });
    if (created && created.id) {
      setMediaplan((prev) => [...prev, created]);
    }
  };

  const handleDeleteMediaplan = async (id: number) => {
    await api.delete("mediaplan", id);
    setMediaplan((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Derived summary ───────────────────────────────────────────────────────
  const totalBudget    = mediaplan.reduce((s, m) => s + (m.budget || 0), 0);
  const totalReach     = mediaplan.reduce((s, m) => s + (m.reach || 0), 0);
  const publishedCount = mediaplan.filter((m) => m.status === "Опубликовано").length;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#b5f23d] flex items-center justify-center flex-shrink-0">
                <Icon name="Activity" size={14} className="text-black" />
              </div>
              <span className="font-semibold text-sm text-foreground">РнП Маркетинг</span>
              <span className="text-muted-foreground text-xs hidden sm:block">·</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Контент</span>
            </div>
            <div className="flex items-center gap-1"><TopNav active="/content" /><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-[#b5f23d] text-[#b5f23d]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon
                  name={tab.icon as "Activity"}
                  size={14}
                  className={activeTab === tab.id ? "text-[#b5f23d]" : ""}
                />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">

        {/* ── Медиаплан ──────────────────────────────────────────────────────── */}
        {activeTab === "mediaplan" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-base font-bold text-foreground">Медиаплан</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Расписание публикаций по каналам и форматам
                </p>
              </div>
              <button
                onClick={handleAddMediaplan}
                className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
              >
                <Icon name="Plus" size={13} />
                Добавить
              </button>
            </div>

            {mediaplanLoading ? (
              <LoadingText />
            ) : (
              <>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Всего материалов",  value: String(mediaplan.length),                   lime: false },
                    { label: "Опубликовано",       value: String(publishedCount),                     lime: true  },
                    { label: "Бюджет на контент",  value: `${totalBudget.toLocaleString("ru-RU")} ₽`, lime: false },
                    { label: "Охват (факт)",        value: totalReach.toLocaleString("ru-RU"),         lime: true  },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-card border border-border rounded-xl p-3 card-hover"
                    >
                      <div className="text-xs text-muted-foreground mb-1.5">{kpi.label}</div>
                      <div
                        className={`font-mono text-lg font-bold leading-none ${
                          kpi.lime ? "metric-lime" : "text-foreground"
                        }`}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[900px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {["Неделя", "Канал", "Формат", "Тема", "Ответственный", "Бюджет", "Охват", "Статус", ""].map(
                            (h) => (
                              <th
                                key={h}
                                className="text-left px-3 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {mediaplan.map((m) => (
                          <tr
                            key={m.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                              {m.week}
                            </td>
                            <td className="px-3 py-3 text-foreground">{m.channel}</td>
                            <td className="px-3 py-3 text-muted-foreground">{m.format}</td>
                            <td className="px-3 py-3 text-foreground">{m.theme}</td>
                            <td className="px-3 py-3 text-muted-foreground">{m.responsible}</td>
                            <td className="px-3 py-3 font-mono text-foreground">
                              {(m.budget || 0) > 0
                                ? `${m.budget.toLocaleString("ru-RU")} ₽`
                                : "—"}
                            </td>
                            <td className="px-3 py-3 font-mono text-foreground">
                              {(m.reach || 0) > 0 ? m.reach.toLocaleString("ru-RU") : "—"}
                            </td>
                            <td className="px-3 py-3">
                              <StatusBadge status={m.status} />
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => handleDeleteMediaplan(m.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Удалить"
                              >
                                <Icon name="Trash2" size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {mediaplan.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-3 py-8 text-center text-muted-foreground"
                            >
                              Нет данных медиаплана
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Матрица контента ───────────────────────────────────────────────── */}
        {activeTab === "matrix" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-base font-bold text-foreground">Матрица контента</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Типы, форматы и цели контента
                </p>
              </div>
              <button className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg">
                <Icon name="Plus" size={13} />
                Добавить тип
              </button>
            </div>

            {matrixLoading ? (
              <LoadingText />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {contentMatrix.map((c, i) => {
                  const accent    = MATRIX_ACCENTS[i % MATRIX_ACCENTS.length];
                  const formatTags = c.formats
                    ? c.formats.split(",").map((f) => f.trim()).filter(Boolean)
                    : [];
                  return (
                    <div
                      key={c.id}
                      className={`bg-card border border-border rounded-xl overflow-hidden card-hover border-l-2 ${accent.border}`}
                    >
                      {/* Card header */}
                      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/20">
                        <span className={`font-semibold text-sm ${accent.head}`}>
                          {c.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.frequency}</span>
                      </div>

                      <div className="p-4 flex flex-col gap-3">
                        {/* Formats */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5">Форматы</div>
                          <div className="flex flex-wrap gap-1">
                            {formatTags.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 bg-muted border border-border rounded text-xs text-foreground"
                              >
                                {f}
                              </span>
                            ))}
                            {formatTags.length === 0 && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>

                        {/* Goal */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">Цель</div>
                          <div className="text-sm font-medium text-foreground">{c.goal}</div>
                        </div>

                        {/* Example */}
                        <div className="border-t border-border/50 pt-2">
                          <div className="text-xs text-muted-foreground mb-0.5">Пример</div>
                          <div className="text-xs text-muted-foreground italic">{c.examples}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add placeholder */}
                {contentMatrix.length === 0 && !matrixLoading && (
                  <div className="bg-card border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center col-span-full">
                    <Icon name="Grid3X3" size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Нет данных матрицы контента</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Съёмки placeholder ──────────────────────────────────────────────── */}
        {activeTab === "shoots" && (
          <PlaceholderSection
            icon="Clapperboard"
            title="Съёмки и производство"
            desc="Бюджеты и планирование производства видеоконтента, фотосессий и материалов"
          />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#b5f23d]/20 flex items-center justify-center">
              <Icon name="Activity" size={9} className="text-[#b5f23d]" />
            </div>
            РнП Маркетинг · Контент · 2025
          </div>
          <span>Данные обновляются из базы</span>
        </div>
      </footer>
    </div>
  );
}