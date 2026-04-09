import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── ADD ROW DIALOG ────────────────────────────────────────────────────────────

type AutoCalcType = "percent" | "ratio" | "subtract" | "multiply";

const AUTO_CALC_TYPES: { value: AutoCalcType; label: string; formula: string }[] = [
  { value: "percent", label: "Конверсия (%)", formula: "(A / B) × 100" },
  { value: "ratio",   label: "Доля (%)",      formula: "A / B × 100" },
  { value: "subtract", label: "Разница",      formula: "A − B" },
  { value: "multiply", label: "Произведение", formula: "A × B" },
];

function computeAuto(n: number, d: number, type: AutoCalcType): string | null {
  if (isNaN(n) || isNaN(d)) return null;
  if ((type === "percent" || type === "ratio") && d === 0) return null;
  switch (type) {
    case "percent":  return ((n / d) * 100).toFixed(1) + "%";
    case "ratio":    return ((n / d) * 100).toFixed(1) + "%";
    case "subtract": return String(n - d);
    case "multiply": return String(n * d);
  }
}

function AddRowDialog({
  sectionId,
  rows,
  initialMode = "normal",
  onAdd,
  onClose,
}: {
  sectionId: string;
  rows: { def: { id: string; label: string } }[];
  initialMode?: "normal" | "auto";
  onAdd: (sId: string, def: { id: string; label: string; unit: string; isConversion?: boolean; autoFrom?: [string, string]; autoCalcType?: AutoCalcType }) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"normal" | "auto">(initialMode);
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("шт.");
  const [numId, setNumId] = useState(rows[0]?.def.id ?? "");
  const [denId, setDenId] = useState(rows[1]?.def.id ?? rows[0]?.def.id ?? "");
  const [calcType, setCalcType] = useState<AutoCalcType>("percent");

  const autoUnit = calcType === "percent" || calcType === "ratio" ? "%" : unit;

  const handleAdd = () => {
    const id = `row_${Date.now()}`;
    if (mode === "normal") {
      onAdd(sectionId, { id, label: label.trim() || "Новая метрика", unit });
    } else {
      onAdd(sectionId, {
        id,
        label: label.trim() || `${rows.find(r => r.def.id === numId)?.def.label ?? "A"} → авторасчёт`,
        unit: autoUnit,
        isConversion: calcType === "percent" || calcType === "ratio",
        autoFrom: [numId, denId],
        autoCalcType: calcType,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Добавить строку</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          {[
            { v: "normal" as const, icon: "Minus", label: "Обычная метрика" },
            { v: "auto" as const,   icon: "Zap",   label: "Авторасчёт" },
          ].map(({ v, icon, label: lbl }) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border transition-colors font-medium
                ${mode === v
                  ? v === "auto" ? "bg-[#b5f23d]/10 border-[#b5f23d]/50 text-[#7aaa1a]" : "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name={icon as "Zap"} size={12} />
              {lbl}
            </button>
          ))}
        </div>

        {/* Name + unit */}
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={mode === "auto" ? "Название (напр. ДРР)" : "Название метрики"}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-background"
          />
          <input
            value={mode === "auto" && (calcType === "percent" || calcType === "ratio") ? "%" : unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={mode === "auto" && (calcType === "percent" || calcType === "ratio")}
            placeholder="шт."
            className="w-16 border border-border rounded-lg px-2 py-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary bg-background disabled:opacity-40"
          />
        </div>

        {/* Auto settings */}
        {mode === "auto" && (
          <div className="border border-[#b5f23d]/20 rounded-lg p-3 bg-[#b5f23d]/3 mb-4">
            <p className="text-[11px] text-muted-foreground mb-2 font-medium">Формула авторасчёта</p>

            {/* Calc type */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {AUTO_CALC_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setCalcType(ct.value)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[10px] border transition-colors
                    ${calcType === ct.value ? "border-[#b5f23d]/60 bg-[#b5f23d]/10 text-[#7aaa1a] font-semibold" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  <div className="font-semibold">{ct.label}</div>
                  <div className="font-mono opacity-60 mt-0.5">{ct.formula}</div>
                </button>
              ))}
            </div>

            {/* A / B pickers */}
            {rows.length < 2 ? (
              <p className="text-[10px] text-muted-foreground/60 italic">Добавьте хотя бы 2 строки в секцию, чтобы настроить формулу</p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">A (числитель)</label>
                  <select
                    value={numId}
                    onChange={(e) => setNumId(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-[11px] bg-background focus:outline-none focus:ring-1 focus:ring-[#b5f23d]/60"
                  >
                    {rows.map((r) => (
                      <option key={r.def.id} value={r.def.id}>{r.def.label}</option>
                    ))}
                  </select>
                </div>
                <div className="text-muted-foreground text-xs mt-4 shrink-0">÷</div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">B (знаменатель)</label>
                  <select
                    value={denId}
                    onChange={(e) => setDenId(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-[11px] bg-background focus:outline-none focus:ring-1 focus:ring-[#b5f23d]/60"
                  >
                    {rows.map((r) => (
                      <option key={r.def.id} value={r.def.id}>{r.def.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
              Считается автоматически по факту. Вручную не вводится.
            </p>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={mode === "auto" && rows.length < 2}
          className="w-full py-2 text-xs rounded-lg font-semibold transition-colors disabled:opacity-40
            bg-primary text-white hover:bg-primary/90"
        >
          Добавить строку
        </button>
      </div>
    </div>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type WeekData = { plan: string; fact: string };

type RowDef = {
  id: string;
  label: string;
  unit: string;
  isConversion?: boolean;
  autoFrom?: [string, string]; // [numeratorId, denominatorId] → auto %
  autoCalcType?: AutoCalcType;
};

type RowState = {
  def: RowDef;
  monthPlan: string;
  monthFact: string;
  weeks: WeekData[];
};

type SectionState = {
  id: string;
  title: string;
  rows: RowState[];
  collapsed: boolean;
};

// ─── SECTION TEMPLATES ────────────────────────────────────────────────────────

const GENERAL_ROWS: RowDef[] = [
  { id: "budget", label: "Рекламный бюджет", unit: "₽" },
  { id: "reach", label: "Охваты", unit: "чел." },
  { id: "shows", label: "Показы посадочной", unit: "шт." },
  { id: "cv_click", label: "CV → клик", unit: "%", isConversion: true, autoFrom: ["clicks", "shows"] },
  { id: "clicks", label: "Клики", unit: "шт." },
  { id: "cv_lead", label: "CV → лид", unit: "%", isConversion: true, autoFrom: ["leads", "clicks"] },
  { id: "leads", label: "Лиды", unit: "шт." },
  { id: "cv_qual", label: "CV → квал", unit: "%", isConversion: true, autoFrom: ["ql", "leads"] },
  { id: "ql", label: "Квал лиды", unit: "шт." },
  { id: "cv_sale", label: "CV → продажа", unit: "%", isConversion: true, autoFrom: ["sales", "ql"] },
  { id: "sales", label: "Продажи", unit: "шт." },
  { id: "revenue", label: "Оборот с рекламы", unit: "₽" },
  { id: "avg_check", label: "Средний чек", unit: "₽" },
  { id: "cpc", label: "Цена клика", unit: "₽" },
  { id: "cpl", label: "Цена лида", unit: "₽" },
  { id: "cpql", label: "Цена квал лида", unit: "₽" },
  { id: "romi", label: "ROMI", unit: "%" },
  { id: "roi", label: "ROI", unit: "%" },
];

const CONTENT_TRAFFIC_ROWS: RowDef[] = [
  { id: "ct_budget", label: "Бюджет (инфлюенс)", unit: "₽" },
  { id: "ct_bloggers", label: "Кол-во блогеров", unit: "чел." },
  { id: "ct_reels", label: "Reels / Сторис (кол-во)", unit: "шт." },
  { id: "ct_reach", label: "Охваты общие", unit: "чел." },
  { id: "ct_reach_per", label: "Охват на 1 ролик (план)", unit: "чел." },
  { id: "ct_cpm", label: "CPM", unit: "₽" },
  { id: "ct_cv_click", label: "CV → клик", unit: "%", isConversion: true, autoFrom: ["ct_clicks", "ct_reach"] },
  { id: "ct_clicks", label: "Клики", unit: "шт." },
  { id: "ct_cv_lead", label: "CV → лид", unit: "%", isConversion: true, autoFrom: ["ct_leads", "ct_clicks"] },
  { id: "ct_leads", label: "Лиды", unit: "шт." },
  { id: "ct_cv_sale", label: "CV → продажа", unit: "%", isConversion: true, autoFrom: ["ct_sales", "ct_leads"] },
  { id: "ct_sales", label: "Продажи", unit: "шт." },
  { id: "ct_revenue", label: "Выручка", unit: "₽" },
  { id: "ct_cpl", label: "Цена лида", unit: "₽" },
  { id: "ct_cps", label: "Цена продажи", unit: "₽" },
  { id: "ct_drr", label: "ДРР", unit: "%" },
  { id: "ct_roi", label: "ROI", unit: "%" },
];

const CHANNEL_TEMPLATES: Record<string, RowDef[]> = {
  "Telegram — Посевы": [
    { id: "budget", label: "Рекламный бюджет", unit: "₽" },
    { id: "cpm", label: "CPM", unit: "₽" },
    { id: "reach", label: "Охваты", unit: "чел." },
    { id: "cv_click", label: "CV → клик", unit: "%", isConversion: true, autoFrom: ["clicks", "reach"] },
    { id: "clicks", label: "Клики", unit: "шт." },
    { id: "cv_lead", label: "CV → лид", unit: "%", isConversion: true, autoFrom: ["leads", "clicks"] },
    { id: "leads", label: "Лиды", unit: "шт." },
    { id: "cv_qual", label: "CV → квал", unit: "%", isConversion: true, autoFrom: ["qual", "leads"] },
    { id: "qual", label: "Квалы", unit: "шт." },
    { id: "cv_sale", label: "CV → продажа", unit: "%", isConversion: true, autoFrom: ["sales", "qual"] },
    { id: "sales", label: "Продажи", unit: "шт." },
    { id: "avg_check", label: "Средний чек", unit: "₽" },
    { id: "sum_sales", label: "Сумма продаж", unit: "₽" },
    { id: "cpc", label: "Цена клика", unit: "₽" },
    { id: "cpl", label: "Цена лида", unit: "₽" },
    { id: "cpq", label: "Цена квала", unit: "₽" },
    { id: "cps", label: "Цена продажи", unit: "₽" },
    { id: "drr", label: "ДРР", unit: "%" },
    { id: "cv_sub", label: "CV → подписка", unit: "%", isConversion: true },
    { id: "subs", label: "Подписчики", unit: "шт." },
  ],
  "Telegram Ads": [
    { id: "budget", label: "Рекламный бюджет", unit: "₽" },
    { id: "reach", label: "Охваты", unit: "чел." },
    { id: "cv_sub", label: "CV → подписка", unit: "%", isConversion: true, autoFrom: ["subs", "reach"] },
    { id: "subs", label: "Подписчики", unit: "шт." },
    { id: "cps", label: "Цена подписчика", unit: "₽" },
    { id: "new_reach", label: "Новые охваты", unit: "чел." },
    { id: "apps", label: "Заявки в АП", unit: "шт." },
    { id: "reach_pct", label: "% доходимости до канала", unit: "%" },
    { id: "do_count", label: "Доходимость (кол-во)", unit: "шт." },
    { id: "ap_pct", label: "% в АП от подписчиков", unit: "%" },
  ],
  "YouTube": [
    { id: "budget", label: "Рекламный бюджет", unit: "₽" },
    { id: "views", label: "Просмотры", unit: "шт." },
    { id: "reach", label: "Охват", unit: "чел." },
    { id: "cv_click", label: "CV → клик", unit: "%", isConversion: true, autoFrom: ["clicks", "views"] },
    { id: "clicks", label: "Клики", unit: "шт." },
    { id: "cv_lead", label: "CV → лид", unit: "%", isConversion: true, autoFrom: ["leads", "clicks"] },
    { id: "leads", label: "Лиды", unit: "шт." },
    { id: "cpl", label: "Цена лида", unit: "₽" },
  ],
  "Яндекс.Директ": [
    { id: "budget", label: "Рекламный бюджет", unit: "₽" },
    { id: "shows", label: "Показы", unit: "шт." },
    { id: "clicks", label: "Клики", unit: "шт." },
    { id: "ctr", label: "CTR", unit: "%", isConversion: true, autoFrom: ["clicks", "shows"] },
    { id: "cpc", label: "Цена клика", unit: "₽" },
    { id: "cv_lead", label: "CV → лид", unit: "%", isConversion: true, autoFrom: ["leads", "clicks"] },
    { id: "leads", label: "Лиды", unit: "шт." },
    { id: "cpl", label: "Цена лида", unit: "₽" },
  ],
  "ВКонтакте": [
    { id: "budget", label: "Рекламный бюджет", unit: "₽" },
    { id: "reach", label: "Охваты", unit: "чел." },
    { id: "clicks", label: "Клики", unit: "шт." },
    { id: "ctr", label: "CTR", unit: "%", isConversion: true, autoFrom: ["clicks", "reach"] },
    { id: "cpc", label: "Цена клика", unit: "₽" },
    { id: "leads", label: "Лиды", unit: "шт." },
    { id: "cpl", label: "Цена лида", unit: "₽" },
  ],
  "SEO / Органика": [
    { id: "traffic", label: "Органический трафик", unit: "чел." },
    { id: "top10", label: "Позиций в топ-10", unit: "шт." },
    { id: "leads", label: "Лиды из органики", unit: "шт." },
    { id: "cpl", label: "Цена лида", unit: "₽" },
    { id: "articles", label: "Публикаций контента", unit: "шт." },
  ],
  "Email / Рассылки": [
    { id: "sent", label: "Отправлено писем", unit: "шт." },
    { id: "open_rate", label: "Open Rate", unit: "%", isConversion: true, autoFrom: ["opened", "sent"] },
    { id: "opened", label: "Открытий", unit: "шт." },
    { id: "click_rate", label: "Click Rate", unit: "%", isConversion: true, autoFrom: ["clicks", "opened"] },
    { id: "clicks", label: "Кликов", unit: "шт." },
    { id: "leads", label: "Лиды", unit: "шт." },
  ],
  "Пустой канал": [
    { id: "budget", label: "Бюджет", unit: "₽" },
    { id: "reach", label: "Охват", unit: "чел." },
    { id: "leads", label: "Лиды", unit: "шт." },
    { id: "sales", label: "Продажи", unit: "шт." },
  ],
};

const CHANNEL_LIST = Object.keys(CHANNEL_TEMPLATES);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeWeeks(): WeekData[] {
  return Array.from({ length: 4 }, () => ({ plan: "", fact: "" }));
}

function makeSection(id: string, title: string, defs: RowDef[]): SectionState {
  return {
    id,
    title,
    rows: defs.map((def) => ({ def, monthPlan: "", monthFact: "", weeks: makeWeeks() })),
    collapsed: false,
  };
}

function calcAuto(rows: RowState[], def: RowDef, field: "month" | { wi: number }): string | null {
  if (!def.autoFrom) return null;
  const [numId, denId] = def.autoFrom;
  const num = rows.find((r) => r.def.id === numId);
  const den = rows.find((r) => r.def.id === denId);
  if (!num || !den) return null;
  let n: number, d: number;
  if (field === "month") {
    n = parseFloat(num.monthFact.replace(/\s/g, "").replace(",", "."));
    d = parseFloat(den.monthFact.replace(/\s/g, "").replace(",", "."));
  } else {
    const wi = field.wi;
    n = parseFloat((num.weeks[wi]?.fact ?? "").replace(/\s/g, "").replace(",", "."));
    d = parseFloat((den.weeks[wi]?.fact ?? "").replace(/\s/g, "").replace(",", "."));
  }
  return computeAuto(n, d, def.autoCalcType ?? "percent");
}

function pctBadge(plan: string, fact: string): { label: string; color: string } | null {
  const p = parseFloat(plan.replace(/\s/g, "").replace(",", "."));
  const f = parseFloat(fact.replace(/\s/g, "").replace(",", "."));
  if (isNaN(p) || isNaN(f) || p === 0) return null;
  const v = Math.round((f / p) * 100);
  const color = v >= 100 ? "text-emerald-600 font-bold" : v >= 70 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold";
  return { label: `${v}%`, color };
}

const WEEK_LABELS = ["Нед 1", "Нед 2", "Нед 3", "Нед 4"];

// ─── CELLS ────────────────────────────────────────────────────────────────────

function PlanCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="план"
      className="w-full bg-blue-500/10 border-0 outline-none text-xs font-mono px-1.5 py-[3px] text-right focus:bg-blue-500/18 rounded transition-colors placeholder:text-muted-foreground/30 text-blue-200/70"
    />
  );
}

function FactCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="факт"
      className="w-full bg-transparent border-0 outline-none text-xs font-mono px-1.5 py-[3px] text-right focus:bg-[#b5f23d]/5 rounded transition-colors placeholder:text-muted-foreground/25 text-foreground"
    />
  );
}

function AutoCell({ value }: { value: string | null }) {
  return (
    <div
      className="px-1.5 py-[3px] text-right text-xs font-mono text-muted-foreground/70 bg-muted/25 rounded italic select-none"
      title="Считается автоматически из введённых данных"
    >
      {value ?? "—"}
    </div>
  );
}

function PctCell({ plan, fact }: { plan: string; fact: string }) {
  const r = pctBadge(plan, fact);
  if (!r) return <span className="text-muted-foreground/25 text-xs">—</span>;
  return <span className={`text-xs font-mono ${r.color}`}>{r.label}</span>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function initSections(): SectionState[] {
  return [
    makeSection("general", "Маркетинг общий", GENERAL_ROWS),
    makeSection("content", "Контент-трафик / Инфлюенс", CONTENT_TRAFFIC_ROWS),
    makeSection("tg_sevy", "Telegram — Посевы", CHANNEL_TEMPLATES["Telegram — Посевы"]),
    makeSection("tg_ads", "Telegram Ads", CHANNEL_TEMPLATES["Telegram Ads"]),
    makeSection("yt", "YouTube", CHANNEL_TEMPLATES["YouTube"]),
    makeSection("yandex", "Яндекс.Директ", CHANNEL_TEMPLATES["Яндекс.Директ"]),
    makeSection("seo", "SEO / Органика", CHANNEL_TEMPLATES["SEO / Органика"]),
  ];
}

export function TabPulse() {
  const [month, setMonth] = useState("Март 2025");
  const [sections, setSections] = useState<SectionState[]>(initSections);
  const [showWeeks, setShowWeeks] = useState(true);
  const [activeWeek, setActiveWeek] = useState(0);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [addRowDialog, setAddRowDialog] = useState<{ sId: string; mode: "normal" | "auto" } | null>(null);

  const toggleCollapse = (id: string) =>
    setSections((ss) => ss.map((s) => s.id === id ? { ...s, collapsed: !s.collapsed } : s));

  const updateMonth = (sId: string, rIdx: number, field: "monthPlan" | "monthFact", val: string) =>
    setSections((ss) =>
      ss.map((s) => s.id !== sId ? s : {
        ...s,
        rows: s.rows.map((r, i) => i !== rIdx ? r : { ...r, [field]: val }),
      })
    );

  const updateWeek = (sId: string, rIdx: number, wi: number, field: "plan" | "fact", val: string) =>
    setSections((ss) =>
      ss.map((s) => s.id !== sId ? s : {
        ...s,
        rows: s.rows.map((r, i) =>
          i !== rIdx ? r : {
            ...r,
            weeks: r.weeks.map((w, wi2) => wi2 !== wi ? w : { ...w, [field]: val }),
          }
        ),
      })
    );

  const addRow = (sId: string, def?: RowDef) =>
    setSections((ss) =>
      ss.map((s) => s.id !== sId ? s : {
        ...s,
        rows: [...s.rows, {
          def: def ?? { id: `row_${Date.now()}`, label: "Новая метрика", unit: "шт." },
          monthPlan: "", monthFact: "", weeks: makeWeeks(),
        }],
      })
    );

  const removeRow = (sId: string, rIdx: number) =>
    setSections((ss) =>
      ss.map((s) => s.id !== sId ? s : { ...s, rows: s.rows.filter((_, i) => i !== rIdx) })
    );

  const removeSection = (id: string) =>
    setSections((ss) => ss.filter((s) => s.id !== id));

  const renameSection = (id: string, title: string) =>
    setSections((ss) => ss.map((s) => s.id === id ? { ...s, title } : s));

  const updateLabel = (sId: string, rIdx: number, label: string) =>
    setSections((ss) =>
      ss.map((s) => s.id !== sId ? s : {
        ...s,
        rows: s.rows.map((r, i) => i !== rIdx ? r : { ...r, def: { ...r.def, label } }),
      })
    );

  const addChannel = (templateName: string) => {
    const defs = CHANNEL_TEMPLATES[templateName] ?? CHANNEL_TEMPLATES["Пустой канал"];
    setSections((ss) => [...ss, makeSection(`ch_${Date.now()}`, templateName, defs)]);
    setShowAddChannel(false);
  };

  const weekColSpan = showWeeks ? 4 * 3 : 0;
  const totalSpan = 3 + weekColSpan; // plan+fact+% for month, then weeks

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold">Рука на Пульсе</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Все каналы — план / факт / % выполнения</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="border border-border rounded px-2 py-1.5 text-sm font-medium w-32 focus:outline-none focus:ring-1 focus:ring-primary bg-card"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="Месяц год"
          />
          <button
            onClick={() => setShowWeeks((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${showWeeks ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name="CalendarDays" size={13} />
            Недели
          </button>
          {showWeeks && WEEK_LABELS.map((l, i) => (
            <button
              key={i}
              onClick={() => setActiveWeek(i)}
              className={`px-2.5 py-1 text-xs rounded transition-colors border ${activeWeek === i ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-12 h-4 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80" />
          Ввод плана
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-12 h-4 rounded bg-white dark:bg-background border border-border" />
          Ввод факта
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-12 h-4 rounded bg-muted/30 border border-border" />
          <Icon name="Zap" size={10} className="text-muted-foreground/50" />
          Автоматически
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#b5f23d]">
          <span className="w-2 h-2 rounded-full bg-[#b5f23d]" />
          Конверсия (CV)
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table
          className="w-full text-xs border-collapse bg-card"
          style={{ minWidth: showWeeks ? 1080 : 580 }}
        >
          <thead>
            <tr className="bg-muted/60 text-foreground border-b border-border">
              <th className="w-7 py-2" rowSpan={2} />
              <th className="text-left px-3 py-2 font-semibold min-w-52 text-muted-foreground text-xs uppercase tracking-wider" rowSpan={2}>
                Метрика
              </th>
              {/* Month group */}
              <th
                colSpan={3}
                className="text-center px-2 py-1.5 font-semibold border-l border-border text-sm text-[#b5f23d]"
              >
                {month}
              </th>
              {/* Week groups */}
              {showWeeks && WEEK_LABELS.map((l, i) => (
                <th
                  key={i}
                  colSpan={3}
                  className={`text-center px-2 py-1.5 font-medium border-l border-border text-xs ${i === activeWeek ? "text-foreground" : "text-muted-foreground/40"}`}
                >
                  {l}
                </th>
              ))}
              <th className="w-7 py-2" rowSpan={2} />
            </tr>
            <tr className="bg-muted/40 text-muted-foreground text-[11px] border-b border-border">
              <th className="w-24 px-1.5 py-1 text-center border-l border-border border-t border-border/50 text-blue-400/80">
                План
              </th>
              <th className="w-24 px-1.5 py-1 text-center border-t border-border/50">Факт</th>
              <th className="w-12 px-1 py-1 text-center border-t border-border/50 text-muted-foreground/50">%</th>
              {showWeeks && WEEK_LABELS.map((_, i) => (
                <>
                  <th key={`${i}p`} className={`w-20 px-1.5 py-1 text-center border-l border-border border-t border-border/50 text-blue-400/80 ${i === activeWeek ? "" : "opacity-40"}`}>П</th>
                  <th key={`${i}f`} className={`w-20 px-1.5 py-1 text-center border-t border-border/50 ${i === activeWeek ? "" : "opacity-40"}`}>Ф</th>
                  <th key={`${i}pct`} className={`w-10 px-1 py-1 text-center border-t border-border/50 text-muted-foreground/50 ${i === activeWeek ? "" : "opacity-40"}`}>%</th>
                </>
              ))}
            </tr>
          </thead>

          <tbody>
            {sections.map((section) => (
              <>
                {/* Section header */}
                <tr key={`h_${section.id}`} className="bg-muted/30 border-y border-border text-foreground group/sec">
                  <td
                    className="px-2 py-1.5 text-center cursor-pointer"
                    onClick={() => toggleCollapse(section.id)}
                  >
                    <Icon
                      name={section.collapsed ? "ChevronRight" : "ChevronDown"}
                      size={12}
                      className="text-white/60 inline"
                    />
                  </td>
                  <td colSpan={totalSpan + 1} className="py-1.5">
                    <div className="flex items-center gap-2 pr-3">
                      {editingTitle === section.id ? (
                        <input
                          autoFocus
                          className="bg-white/10 text-white text-sm font-semibold px-2 py-0.5 rounded outline-none border border-white/20 w-64"
                          value={section.title}
                          onChange={(e) => renameSection(section.id, e.target.value)}
                          onBlur={() => setEditingTitle(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)}
                        />
                      ) : (
                        <span
                          className="text-sm font-semibold cursor-pointer flex-1"
                          onClick={() => toggleCollapse(section.id)}
                        >
                          {section.title}
                        </span>
                      )}
                      <button
                        title="Переименовать"
                        onClick={() => setEditingTitle(section.id)}
                        className="opacity-0 group-hover/sec:opacity-50 hover:!opacity-100 transition-opacity"
                      >
                        <Icon name="Pencil" size={11} />
                      </button>
                      {section.id !== "general" && (
                        <button
                          title="Удалить канал"
                          onClick={() => removeSection(section.id)}
                          className="opacity-0 group-hover/sec:opacity-50 hover:!opacity-100 transition-opacity text-red-300"
                        >
                          <Icon name="Trash2" size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td />
                </tr>

                {/* Data rows */}
                {!section.collapsed && section.rows.map((row, rIdx) => {
                  const isAuto = !!row.def.autoFrom;
                  const isConv = row.def.isConversion;
                  const autoMonth = isAuto ? calcAuto(section.rows, row.def, "month") : null;
                  const isEven = rIdx % 2 === 0;

                  return (
                    <tr
                      key={`${section.id}_${rIdx}`}
                      className={`group/row transition-colors ${isEven ? "bg-background" : "bg-muted/10"} hover:bg-accent/25`}
                    >
                      {/* row # */}
                      <td className="py-0.5 px-1 text-center text-[10px] text-muted-foreground/25 border-b border-border/30">
                        {rIdx + 1}
                      </td>

                      {/* label */}
                      <td className={`py-0.5 border-b border-border/30 ${isConv ? "text-[#b5f23d]" : ""}`}>
                        <div className="flex items-center gap-1 pl-4 pr-1">
                          {isAuto && (
                            <Icon name="Zap" size={10} className="text-[#b5f23d]/40 shrink-0" title="Считается автоматически" />
                          )}
                          <input
                            value={row.def.label}
                            onChange={(e) => updateLabel(section.id, rIdx, e.target.value)}
                            className={`bg-transparent border-0 outline-none flex-1 min-w-0 focus:bg-[#b5f23d]/5 px-1 py-0.5 rounded text-xs ${isConv ? "text-[#b5f23d]" : ""}`}
                          />
                          <span className="text-muted-foreground/40 text-[10px] shrink-0">{row.def.unit}</span>
                          <button
                            title="Удалить строку"
                            onClick={() => removeRow(section.id, rIdx)}
                            className="opacity-0 group-hover/row:opacity-40 hover:!opacity-100 transition-opacity text-red-400 shrink-0 ml-1"
                          >
                            <Icon name="X" size={10} />
                          </button>
                        </div>
                      </td>

                      {/* month plan */}
                      <td className="border-b border-border/30 border-l border-l-border/30 py-0.5 px-0.5">
                        {isAuto ? <AutoCell value={autoMonth} /> : (
                          <PlanCell value={row.monthPlan} onChange={(v) => updateMonth(section.id, rIdx, "monthPlan", v)} />
                        )}
                      </td>
                      {/* month fact */}
                      <td className="border-b border-border/30 py-0.5 px-0.5">
                        {isAuto ? <AutoCell value={autoMonth} /> : (
                          <FactCell value={row.monthFact} onChange={(v) => updateMonth(section.id, rIdx, "monthFact", v)} />
                        )}
                      </td>
                      {/* month % */}
                      <td className="border-b border-border/30 py-0.5 px-1.5 text-center">
                        {isAuto
                          ? <span className="text-[9px] text-muted-foreground/30 italic flex items-center justify-center gap-0.5"><Icon name="Zap" size={8} />авто</span>
                          : <PctCell plan={row.monthPlan} fact={row.monthFact} />
                        }
                      </td>

                      {/* weeks */}
                      {showWeeks && row.weeks.map((w, wi) => {
                        const wAuto = isAuto ? calcAuto(section.rows, row.def, { wi }) : null;
                        const isActive = wi === activeWeek;
                        return (
                          <>
                            <td key={`${wi}p`} className={`border-b border-border/30 border-l border-l-border/30 py-0.5 px-0.5 ${isActive ? "" : "opacity-40"}`}>
                              {isAuto ? <AutoCell value={wAuto} /> : <PlanCell value={w.plan} onChange={(v) => updateWeek(section.id, rIdx, wi, "plan", v)} />}
                            </td>
                            <td key={`${wi}f`} className={`border-b border-border/30 py-0.5 px-0.5 ${isActive ? "" : "opacity-40"}`}>
                              {isAuto ? <AutoCell value={wAuto} /> : <FactCell value={w.fact} onChange={(v) => updateWeek(section.id, rIdx, wi, "fact", v)} />}
                            </td>
                            <td key={`${wi}pct`} className={`border-b border-border/30 py-0.5 px-1.5 text-center ${isActive ? "" : "opacity-40"}`}>
                              {isAuto
                                ? <span className="text-[9px] text-muted-foreground/30 italic">авто</span>
                                : <PctCell plan={w.plan} fact={w.fact} />
                              }
                            </td>
                          </>
                        );
                      })}

                      <td className="border-b border-border/30" />
                    </tr>
                  );
                })}

                {/* Add row */}
                {!section.collapsed && (
                  <tr key={`addrow_${section.id}`} className="bg-muted/5 border-b border-border/20">
                    <td />
                    <td colSpan={totalSpan + 1} className="py-1.5 pl-9">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAddRowDialog({ sId: section.id, mode: "normal" })}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
                        >
                          <Icon name="Plus" size={11} /> добавить строку
                        </button>
                        <button
                          onClick={() => setAddRowDialog({ sId: section.id, mode: "auto" })}
                          className="flex items-center gap-1 text-[11px] text-[#b5f23d]/40 hover:text-[#b5f23d] transition-colors"
                          title="Добавить строку с авторасчётом"
                        >
                          <Icon name="Zap" size={11} /> авторасчёт
                        </button>
                      </div>
                    </td>
                    <td />
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row dialog */}
      {addRowDialog && (
        <AddRowDialog
          sectionId={addRowDialog.sId}
          initialMode={addRowDialog.mode}
          rows={sections.find(s => s.id === addRowDialog.sId)?.rows ?? []}
          onAdd={(sId, def) => addRow(sId, def)}
          onClose={() => setAddRowDialog(null)}
        />
      )}

      {/* Add channel button */}
      <div className="mt-4">
        {showAddChannel ? (
          <div className="border border-border rounded-lg p-4 bg-card shadow-sm">
            <p className="text-sm font-semibold mb-3">Выберите шаблон канала</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {CHANNEL_LIST.map((name) => (
                <button
                  key={name}
                  onClick={() => addChannel(name)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddChannel(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddChannel(true)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Icon name="Plus" size={14} /> Добавить канал
          </button>
        )}
      </div>
    </div>
  );
}