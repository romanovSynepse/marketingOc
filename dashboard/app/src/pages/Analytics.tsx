import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: number;
  name: string;
  segment: string;
  status: string;
  project: string;
  budget: number;
  leads: number;
  ltv: number;
  manager: string;
}

interface RfmSegment {
  id?: number;
  segment: string;
  clients_count: number;
  revenue: number;
  color: string;
  desc: string;
}

interface CjmStage {
  id?: number;
  stage: string;
  touchpoint: string;
  emotion: string;
  action: string;
  problem: string;
  solution: string;
  metric: string;
}

// ─── RFM segment color map (dark/lime style) ──────────────────────────────────
const RFM_COLOR_MAP: Record<string, { badge: string; accent: string }> = {
  "Чемпионы":     { badge: "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",   accent: "#b5f23d" },
  "Лояльные":     { badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",       accent: "#60a5fa" },
  "Потенциальные":{ badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20", accent: "#a78bfa" },
  "Под угрозой":  { badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20", accent: "#fb923c" },
  "Потерянные":   { badge: "bg-red-500/10 text-red-400 border border-red-500/20",          accent: "#f87171" },
};

const DEFAULT_RFM = { badge: "bg-muted text-muted-foreground border border-border", accent: "#555" };

const ANALYTICS_TABS = [
  { id: "clients", label: "Клиенты и проекты", icon: "Users" },
  { id: "rfm",     label: "RFM-анализ",        icon: "BarChart3" },
  { id: "cjm",     label: "CJM",               icon: "GitBranch" },
] as const;
type ATabId = typeof ANALYTICS_TABS[number]["id"];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Активный": "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",
    "Новый":    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Завершён": "bg-muted text-muted-foreground border border-border",
    "Пауза":    "bg-red-500/10 text-red-400 border border-red-500/20",
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

// ─── Add Client Form ──────────────────────────────────────────────────────────
interface AddClientFormProps {
  onAdd: (client: Omit<Client, "id">) => void;
  onCancel: () => void;
}

function AddClientForm({ onAdd, onCancel }: AddClientFormProps) {
  const [form, setForm] = useState({
    name: "",
    segment: "B2B",
    status: "Новый",
    project: "",
    budget: "",
    leads: "",
    ltv: "",
    manager: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      name:    form.name.trim(),
      segment: form.segment,
      status:  form.status,
      project: form.project.trim(),
      budget:  Number(form.budget) || 0,
      leads:   Number(form.leads) || 0,
      ltv:     Number(form.ltv) || 0,
      manager: form.manager.trim(),
    });
  };

  const inputCls =
    "px-2 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#b5f23d]/50 focus:ring-0 w-full transition-colors";

  const field = (key: keyof typeof form, placeholder: string, type = "text") => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      className={inputCls}
    />
  );

  return (
    <tr className="bg-[#b5f23d]/5 border-b border-[#b5f23d]/20">
      <td className="px-2 py-2">{field("name", "Название *")}</td>
      <td className="px-2 py-2">
        <select
          value={form.segment}
          onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
          className={inputCls}
        >
          <option>B2B</option>
          <option>B2C</option>
        </select>
      </td>
      <td className="px-2 py-2">{field("project", "Проект")}</td>
      <td className="px-2 py-2">
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className={inputCls}
        >
          <option>Новый</option>
          <option>Активный</option>
          <option>Пауза</option>
          <option>Завершён</option>
        </select>
      </td>
      <td className="px-2 py-2">{field("budget",  "Бюджет",  "number")}</td>
      <td className="px-2 py-2">{field("leads",   "Лиды",    "number")}</td>
      <td className="px-2 py-2">{field("ltv",     "LTV",     "number")}</td>
      <td className="px-2 py-2">{field("manager", "Менеджер")}</td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <button
            onClick={handleSubmit}
            className="btn-lime px-2 py-1 text-xs rounded transition-all"
          >
            Сохранить
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded hover:bg-muted/70 transition-colors"
          >
            Отмена
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── CJM stage accent colors ──────────────────────────────────────────────────
const CJM_STAGE_COLORS = [
  { left: "border-l-blue-500",   dot: "bg-blue-500" },
  { left: "border-l-violet-500", dot: "bg-violet-500" },
  { left: "border-l-[#b5f23d]",  dot: "bg-[#b5f23d]" },
  { left: "border-l-orange-500", dot: "bg-orange-500" },
  { left: "border-l-cyan-500",   dot: "bg-cyan-500" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [activeTab, setActiveTab] = useState<ATabId>("clients");

  // Clients
  const [clients, setClients]             = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [search, setSearch]               = useState("");

  // RFM
  const [rfmData, setRfmData]     = useState<RfmSegment[]>([]);
  const [rfmLoading, setRfmLoading] = useState(false);

  // CJM
  const [cjmStages, setCjmStages]   = useState<CjmStage[]>([]);
  const [cjmLoading, setCjmLoading] = useState(false);

  // ── Load data on tab change ────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "clients" && clients.length === 0) {
      setClientsLoading(true);
      api.get("clients")
        .then((data) => setClients(Array.isArray(data) ? data : []))
        .catch(() => setClients([]))
        .finally(() => setClientsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "rfm" && rfmData.length === 0) {
      setRfmLoading(true);
      api.get("rfm")
        .then((data) => setRfmData(Array.isArray(data) ? data : []))
        .catch(() => setRfmData([]))
        .finally(() => setRfmLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "cjm" && cjmStages.length === 0) {
      setCjmLoading(true);
      api.get("cjm")
        .then((data) => setCjmStages(Array.isArray(data) ? data : []))
        .catch(() => setCjmStages([]))
        .finally(() => setCjmLoading(false));
    }
  }, [activeTab]);

  // ── Client actions ─────────────────────────────────────────────────────────
  const handleAddClient = async (body: Omit<Client, "id">) => {
    const created = await api.post("clients", body);
    setClients((prev) => [...prev, created]);
    setShowAddForm(false);
  };

  const handleDeleteClient = async (id: number) => {
    await api.delete("clients", id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Filtered clients ───────────────────────────────────────────────────────
  const filteredClients = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.project.toLowerCase().includes(search.toLowerCase()) ||
      c.manager.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Aggregate KPIs ─────────────────────────────────────────────────────────
  const totalBudget = clients.reduce((s, c) => s + (c.budget || 0), 0);
  const totalLTV    = clients.reduce((s, c) => s + (c.ltv || 0), 0);
  const totalLeads  = clients.reduce((s, c) => s + (c.leads || 0), 0);
  const activeCount = clients.filter((c) => c.status === "Активный").length;

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
              <span className="text-xs text-muted-foreground hidden sm:block">Аналитика</span>
            </div>
            <div className="flex items-center gap-1"><TopNav active="/analytics" /><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {ANALYTICS_TABS.map((tab) => (
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

        {/* ── Clients tab ────────────────────────────────────────────────────── */}
        {activeTab === "clients" && (
          <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-base font-bold text-foreground">Клиенты и проекты</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Сводная таблица по всем клиентам
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-muted">
                  <Icon name="Search" size={12} className="text-muted-foreground flex-shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск клиента..."
                    className="text-xs outline-none bg-transparent w-36 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
                >
                  <Icon name="Plus" size={13} />
                  Добавить
                </button>
              </div>
            </div>

            {clientsLoading ? (
              <div className="text-xs text-muted-foreground py-8 text-center">Загрузка...</div>
            ) : (
              <>
                {/* KPI summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Всего клиентов", value: String(clients.length),                                         icon: "Users",      lime: false },
                    { label: "Активных",        value: String(activeCount),                                            icon: "CheckCircle", lime: true  },
                    { label: "Общий бюджет",    value: `${(totalBudget / 1000).toFixed(0)} тыс ₽`,                    icon: "Wallet",     lime: false },
                    { label: "Совокупный LTV",  value: `${(totalLTV / 1_000_000).toFixed(1)} млн ₽`,                  icon: "TrendingUp", lime: true  },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-card border border-border rounded-xl p-3 card-hover"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Icon
                          name={kpi.icon as "Activity"}
                          size={11}
                          className={kpi.lime ? "text-[#b5f23d]" : "text-muted-foreground"}
                        />
                        {kpi.label}
                      </div>
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

                {/* Clients table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Клиент</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Сегмент</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Проект</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Статус</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Бюджет</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Лиды</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">LTV</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Менеджер</th>
                          <th className="px-4 py-3 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {showAddForm && (
                          <AddClientForm
                            onAdd={handleAddClient}
                            onCancel={() => setShowAddForm(false)}
                          />
                        )}
                        {filteredClients.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.segment}</td>
                            <td className="px-4 py-3 text-foreground">{c.project}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-foreground">
                              {(c.budget || 0).toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-foreground">
                              {c.leads}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold metric-lime">
                              {(c.ltv || 0).toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{c.manager}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDeleteClient(c.id)}
                                className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Удалить клиента"
                              >
                                <Icon name="Trash2" size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredClients.length === 0 && !showAddForm && (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-4 py-8 text-center text-muted-foreground text-xs"
                            >
                              {search ? "Клиенты не найдены" : "Нет данных"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/20">
                          <td colSpan={4} className="px-4 py-2.5 font-semibold text-xs text-muted-foreground">
                            Итого
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                            {totalBudget.toLocaleString("ru-RU")} ₽
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                            {totalLeads}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold metric-lime">
                            {totalLTV.toLocaleString("ru-RU")} ₽
                          </td>
                          <td />
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RFM tab ────────────────────────────────────────────────────────── */}
        {activeTab === "rfm" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-base font-bold text-foreground">RFM-анализ</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Сегментация клиентов по Recency · Frequency · Monetary
              </p>
            </div>

            {rfmLoading ? (
              <div className="text-xs text-muted-foreground py-8 text-center">Загрузка...</div>
            ) : (
              <>
                {/* Segment cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rfmData.map((seg) => {
                    const { badge, accent } = RFM_COLOR_MAP[seg.segment] ?? DEFAULT_RFM;
                    return (
                      <div
                        key={seg.segment}
                        className="bg-card border border-border rounded-xl p-4 card-hover flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${badge}`}>
                            {seg.segment}
                          </span>
                          <span className="font-mono text-sm font-bold text-foreground">
                            {seg.clients_count} клиентов
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {seg.desc}
                        </p>
                        {/* Mini progress bar */}
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(seg.clients_count * 4, 100)}%`,
                              backgroundColor: accent,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-2">
                          <span className="text-xs text-muted-foreground">Выручка</span>
                          <span
                            className="font-mono text-sm font-bold"
                            style={{ color: accent }}
                          >
                            {(seg.revenue || 0).toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add segment placeholder */}
                  <div className="bg-card border border-dashed border-border rounded-xl p-4 flex flex-col justify-center items-center gap-2 text-center card-hover cursor-pointer hover:border-[#b5f23d]/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon name="Plus" size={16} className="text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Добавить сегмент</span>
                  </div>
                </div>

                {/* RFM detail table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Icon name="BarChart3" size={14} className="text-[#b5f23d]" />
                    <span className="font-semibold text-sm text-foreground">
                      Детализация по сегментам
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Сегмент</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Клиентов</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Выручка</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Доля</th>
                        <th className="px-4 py-2.5 w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {rfmData.map((seg) => {
                        const totalRevenue = rfmData.reduce((s, r) => s + (r.revenue || 0), 0);
                        const pct = totalRevenue > 0
                          ? Math.round(((seg.revenue || 0) / totalRevenue) * 100)
                          : 0;
                        const { badge, accent } = RFM_COLOR_MAP[seg.segment] ?? DEFAULT_RFM;
                        return (
                          <tr
                            key={seg.segment}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badge}`}>
                                {seg.segment}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-foreground">
                              {seg.clients_count}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                              {(seg.revenue || 0).toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-4 py-3 text-right font-mono" style={{ color: accent }}>
                              {pct}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden ml-auto">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: accent, opacity: 0.7 }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CJM tab ────────────────────────────────────────────────────────── */}
        {activeTab === "cjm" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-base font-bold text-foreground">Customer Journey Map</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Путь клиента от осведомлённости до удержания
              </p>
            </div>

            {cjmLoading ? (
              <div className="text-xs text-muted-foreground py-8 text-center">Загрузка...</div>
            ) : (
              <>
                {/* CJM table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[900px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {["Этап", "Точка касания", "Эмоция", "Действие", "Проблема", "Решение", "Метрика"].map(
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
                        {cjmStages.map((row, i) => {
                          const col = CJM_STAGE_COLORS[i % CJM_STAGE_COLORS.length];
                          return (
                            <tr
                              key={row.id ?? i}
                              className={`border-b border-border hover:bg-muted/30 transition-colors border-l-2 ${col.left}`}
                            >
                              <td className="px-3 py-3 font-semibold text-foreground whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.dot}`} />
                                  {row.stage}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-foreground">{row.touchpoint}</td>
                              <td className="px-3 py-3 text-foreground">{row.emotion}</td>
                              <td className="px-3 py-3 text-foreground">{row.action}</td>
                              <td className="px-3 py-3 text-red-400">{row.problem}</td>
                              <td className="px-3 py-3 text-[#b5f23d]">{row.solution}</td>
                              <td className="px-3 py-3 font-mono font-semibold text-foreground">
                                {row.metric}
                              </td>
                            </tr>
                          );
                        })}
                        {cjmStages.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                              Нет данных CJM
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CJM legend */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Этап пути",      color: "bg-muted",        text: "text-foreground" },
                    { label: "Проблема",        color: "bg-red-500/20",   text: "text-red-400" },
                    { label: "Решение",         color: "bg-[#b5f23d]/10", text: "text-[#b5f23d]" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                      <span className={item.text}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#b5f23d]/20 flex items-center justify-center">
              <Icon name="Activity" size={9} className="text-[#b5f23d]" />
            </div>
            РнП Маркетинг · Аналитика · 2025
          </div>
          <span>Данные обновляются из базы</span>
        </div>
      </footer>
    </div>
  );
}