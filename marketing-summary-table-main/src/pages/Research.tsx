import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SwotItem {
  id: number;
  quadrant: "S" | "W" | "O" | "T";
  content: string;
  sort_order?: number;
}

interface PestItem {
  id: number;
  factor: string;
  content: string;
}

interface SmartGoal {
  id: number;
  goal: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
  status: string;
}

interface TaSegment {
  id: number;
  name: string;
  age: string;
  geo: string;
  pain: string;
  income: string;
  channel: string;
  size: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
const RESEARCH_TABS = [
  { id: "swot",        label: "SWOT-анализ",     icon: "Grid2X2" },
  { id: "pest",        label: "PEST-анализ",      icon: "Globe" },
  { id: "smart",       label: "SMART-цели",       icon: "Target" },
  { id: "ta",          label: "Анализ ЦА",        icon: "UserCircle" },
  { id: "brief",       label: "Брифование",       icon: "ClipboardList" },
  { id: "competitors", label: "Конкуренты",       icon: "Swords" },
] as const;
type RTabId = typeof RESEARCH_TABS[number]["id"];

// ─── SWOT quadrant config (dark/lime) ─────────────────────────────────────────
const SWOT_QUADS = [
  {
    key:   "S" as const,
    label: "Сильные стороны",
    icon:  "ThumbsUp",
    border: "border-l-[#b5f23d]",
    head:   "text-[#b5f23d]",
    dot:    "bg-[#b5f23d]",
  },
  {
    key:   "W" as const,
    label: "Слабые стороны",
    icon:  "ThumbsDown",
    border: "border-l-red-500",
    head:   "text-red-400",
    dot:    "bg-red-500",
  },
  {
    key:   "O" as const,
    label: "Возможности",
    icon:  "Lightbulb",
    border: "border-l-blue-500",
    head:   "text-blue-400",
    dot:    "bg-blue-500",
  },
  {
    key:   "T" as const,
    label: "Угрозы",
    icon:  "AlertTriangle",
    border: "border-l-orange-500",
    head:   "text-orange-400",
    dot:    "bg-orange-500",
  },
];

// ─── PEST accent palette (dark-friendly) ──────────────────────────────────────
const PEST_ACCENTS = [
  { border: "border-l-blue-500",   head: "text-blue-400",   dot: "bg-blue-500" },
  { border: "border-l-[#b5f23d]",  head: "text-[#b5f23d]",  dot: "bg-[#b5f23d]" },
  { border: "border-l-violet-500", head: "text-violet-400", dot: "bg-violet-500" },
  { border: "border-l-orange-500", head: "text-orange-400", dot: "bg-orange-500" },
];

// ─── SMART status badge ────────────────────────────────────────────────────────
function SmartStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Выполнено":   "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",
    "В работе":    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Планируется": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Новый":       "bg-muted text-muted-foreground border border-border",
    "Пауза":       "bg-red-500/10 text-red-400 border border-red-500/20",
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Research() {
  const [activeTab, setActiveTab] = useState<RTabId>("swot");

  // ── State ──────────────────────────────────────────────────────────────────
  const [swotItems, setSwotItems]     = useState<SwotItem[]>([]);
  const [swotLoading, setSwotLoading] = useState(false);

  const [pestItems, setPestItems]     = useState<PestItem[]>([]);
  const [pestLoading, setPestLoading] = useState(false);

  const [smartGoals, setSmartGoals]   = useState<SmartGoal[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);

  const [taSegments, setTaSegments]   = useState<TaSegment[]>([]);
  const [taLoading, setTaLoading]     = useState(false);

  // ── Lazy load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "swot" && swotItems.length === 0 && !swotLoading) {
      setSwotLoading(true);
      api.get("swot")
        .then((data) => setSwotItems(Array.isArray(data) ? data : []))
        .catch(() => setSwotItems([]))
        .finally(() => setSwotLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "pest" && pestItems.length === 0 && !pestLoading) {
      setPestLoading(true);
      api.get("pest")
        .then((data) => setPestItems(Array.isArray(data) ? data : []))
        .catch(() => setPestItems([]))
        .finally(() => setPestLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "smart" && smartGoals.length === 0 && !smartLoading) {
      setSmartLoading(true);
      api.get("smart")
        .then((data) => setSmartGoals(Array.isArray(data) ? data : []))
        .catch(() => setSmartGoals([]))
        .finally(() => setSmartLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ta" && taSegments.length === 0 && !taLoading) {
      setTaLoading(true);
      api.get("target-audience")
        .then((data) => setTaSegments(Array.isArray(data) ? data : []))
        .catch(() => setTaSegments([]))
        .finally(() => setTaLoading(false));
    }
  }, [activeTab]);

  // ── SWOT actions ──────────────────────────────────────────────────────────
  const handleAddSwot = async (quadrant: "S" | "W" | "O" | "T") => {
    const content = prompt(`Добавить в «${quadrant}»:`);
    if (!content?.trim()) return;
    const created = await api.post("swot", { quadrant, content: content.trim() });
    if (created && created.id) {
      setSwotItems((prev) => [...prev, created]);
    }
  };

  const handleDeleteSwot = async (id: number) => {
    await api.delete("swot", id);
    setSwotItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── SMART actions ─────────────────────────────────────────────────────────
  const handleAddSmart = async () => {
    const goal = prompt("Цель (название):");
    if (!goal?.trim()) return;
    const specific   = prompt("Specific (конкретность):") ?? "";
    const measurable = prompt("Measurable (измеримость):") ?? "";
    const achievable = prompt("Achievable (достижимость):") ?? "";
    const relevant   = prompt("Relevant (актуальность):") ?? "";
    const time_bound = prompt("Time-bound (срок):") ?? "";
    const created = await api.post("smart", {
      goal: goal.trim(),
      specific,
      measurable,
      achievable,
      relevant,
      time_bound,
      status: "Новый",
    });
    if (created && created.id) {
      setSmartGoals((prev) => [...prev, created]);
    }
  };

  const handleDeleteSmart = async (id: number) => {
    await api.delete("smart", id);
    setSmartGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // ── Group helpers ─────────────────────────────────────────────────────────
  const swotByQuadrant = (key: "S" | "W" | "O" | "T") =>
    swotItems.filter((item) => item.quadrant === key);

  const pestByFactor = (): { factor: string; items: PestItem[] }[] => {
    const map = new Map<string, PestItem[]>();
    for (const item of pestItems) {
      if (!map.has(item.factor)) map.set(item.factor, []);
      map.get(item.factor)!.push(item);
    }
    return Array.from(map.entries()).map(([factor, items]) => ({ factor, items }));
  };

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
              <span className="text-xs text-muted-foreground hidden sm:block">Исследование</span>
            </div>
            <div className="flex items-center gap-1"><TopNav active="/research" /><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {RESEARCH_TABS.map((tab) => (
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

        {/* ── SWOT ───────────────────────────────────────────────────────────── */}
        {activeTab === "swot" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-base font-bold text-foreground">SWOT-анализ</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Сильные и слабые стороны, возможности и угрозы
              </p>
            </div>
            {swotLoading ? (
              <LoadingText />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SWOT_QUADS.map((q) => {
                  const items = swotByQuadrant(q.key);
                  return (
                    <div
                      key={q.key}
                      className={`bg-card border border-border rounded-xl overflow-hidden card-hover border-l-2 ${q.border}`}
                    >
                      {/* Header */}
                      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
                        <Icon
                          name={q.icon as "Activity"}
                          size={14}
                          className={q.head}
                        />
                        <span className={`font-semibold text-sm ${q.head}`}>
                          {q.key} — {q.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="p-4 flex flex-col gap-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2 text-sm group"
                          >
                            <span
                              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 opacity-60 ${q.dot}`}
                            />
                            <span className="text-foreground flex-1 text-xs leading-relaxed">
                              {item.content}
                            </span>
                            <button
                              onClick={() => handleDeleteSwot(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                              title="Удалить"
                            >
                              <Icon name="Trash2" size={12} />
                            </button>
                          </div>
                        ))}
                        {items.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            Нет данных
                          </span>
                        )}
                        <button
                          onClick={() => handleAddSwot(q.key)}
                          className={`flex items-center gap-1 text-xs mt-1 transition-colors ${q.head} opacity-60 hover:opacity-100`}
                        >
                          <Icon name="Plus" size={11} />
                          Добавить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PEST ───────────────────────────────────────────────────────────── */}
        {activeTab === "pest" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-base font-bold text-foreground">PEST-анализ бренда</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Политические, экономические, социальные и технологические факторы
              </p>
            </div>
            {pestLoading ? (
              <LoadingText />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pestByFactor().map((group, i) => {
                  const accent = PEST_ACCENTS[i % PEST_ACCENTS.length];
                  return (
                    <div
                      key={group.factor}
                      className={`bg-card border border-border rounded-xl overflow-hidden card-hover border-l-2 ${accent.border}`}
                    >
                      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
                        <span className={`font-semibold text-sm ${accent.head}`}>
                          {group.factor}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm">
                            <span
                              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 opacity-50 ${accent.dot}`}
                            />
                            <span className="text-foreground text-xs leading-relaxed">
                              {item.content}
                            </span>
                          </div>
                        ))}
                        {group.items.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            Нет данных
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {pestByFactor().length === 0 && (
                  <div className="col-span-2 bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                    Нет данных PEST-анализа
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SMART ──────────────────────────────────────────────────────────── */}
        {activeTab === "smart" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-base font-bold text-foreground">SMART-цели</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Конкретные, измеримые, достижимые, актуальные и ограниченные по времени цели
                </p>
              </div>
              <button
                onClick={handleAddSmart}
                className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
              >
                <Icon name="Plus" size={13} />
                Добавить цель
              </button>
            </div>

            {smartLoading ? (
              <LoadingText />
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[850px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {["Цель", "Specific", "Measurable", "Achievable", "Relevant", "Time", "Статус", ""].map(
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
                      {smartGoals.map((g) => (
                        <tr
                          key={g.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-3 py-3 font-semibold text-foreground">{g.goal}</td>
                          <td className="px-3 py-3 text-foreground">{g.specific}</td>
                          <td className="px-3 py-3 font-mono text-foreground">{g.measurable}</td>
                          <td className="px-3 py-3 text-foreground">{g.achievable}</td>
                          <td className="px-3 py-3 text-foreground">{g.relevant}</td>
                          <td className="px-3 py-3 font-mono text-[#b5f23d]">{g.time_bound}</td>
                          <td className="px-3 py-3">
                            <SmartStatusBadge status={g.status} />
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleDeleteSmart(g.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Удалить цель"
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {smartGoals.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                            Нет целей. Добавьте первую SMART-цель.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ЦА ────────────────────────────────────────────────────────────── */}
        {activeTab === "ta" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-base font-bold text-foreground">Анализ целевой аудитории</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Сегменты ЦА — портреты, боли, каналы
                </p>
              </div>
              <button className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg">
                <Icon name="Plus" size={13} />
                Добавить сегмент
              </button>
            </div>

            {taLoading ? (
              <LoadingText />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {taSegments.map((seg) => (
                  <div
                    key={seg.id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 card-hover"
                  >
                    {/* Segment header */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#b5f23d]/15 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={15} className="text-[#b5f23d]" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{seg.name}</span>
                    </div>

                    {/* Fields */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      {[
                        { label: "Возраст", value: seg.age },
                        { label: "Гео",     value: seg.geo },
                        { label: "Доход",   value: seg.income },
                        { label: "Каналы",  value: seg.channel },
                      ].map((f) => (
                        <div key={f.label} className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">{f.label}:</span>
                          <span className="text-foreground font-medium text-right">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pain block */}
                    <div className="bg-red-500/8 border border-red-500/15 rounded-lg p-2.5">
                      <div className="text-xs font-medium text-red-400 mb-0.5">Боль:</div>
                      <div className="text-xs text-red-300/80">{seg.pain}</div>
                    </div>

                    {/* Size */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-2">
                      <span className="text-xs text-muted-foreground">Объём сегмента</span>
                      <span className="text-xs font-semibold metric-lime">{seg.size}</span>
                    </div>
                  </div>
                ))}

                {taSegments.length === 0 && (
                  <div className="col-span-3 bg-card border border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-2 text-center">
                    <Icon name="UserCircle" size={28} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Нет сегментов ЦА</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Placeholders ───────────────────────────────────────────────────── */}
        {activeTab === "brief" && (
          <PlaceholderSection
            icon="ClipboardList"
            title="Брифование"
            desc="Шаблоны брифов для клиентов и проектов"
          />
        )}
        {activeTab === "competitors" && (
          <PlaceholderSection
            icon="Swords"
            title="Анализ конкурентов"
            desc="Конкурентный анализ, матрица типов конкурентов, ключевые решения"
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
            РнП Маркетинг · Исследование · 2025
          </div>
          <span>Данные обновляются из базы</span>
        </div>
      </footer>
    </div>
  );
}