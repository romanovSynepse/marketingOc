import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeeklyStat {
  week: string;
  budget: number;
  leads: number;
  conversions: number;
  reach: number;
  cpl: number;
  romi: number;
}

interface KpiItem {
  id?: number;
  name: string;
  plan: number;
  fact: number;
  unit: string;
}

interface ChannelItem {
  id?: number;
  name: string;
  value: number;
  color: string;
}

interface InfluencerItem {
  id?: number;
  name: string;
  reach: number;
  cpm: number;
  leads: number;
  status: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FUNNEL_DATA = [
  { stage: "Охват",    value: 64500, pct: 100 },
  { stage: "Клики",   value: 3870,  pct: 6 },
  { stage: "Лиды",    value: 209,   pct: 0.3 },
  { stage: "Квал.",   value: 84,    pct: 0.13 },
  { stage: "Продажи", value: 41,    pct: 0.06 },
];

const PERIODS = ["Нед 1–4 (март)", "Март 2025", "Q1 2025", "2025"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Trend({ pct, positive = true }: { pct: string; positive?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        positive ? "metric-lime" : "text-red-400"
      }`}
    >
      <Icon name={positive ? "TrendingUp" : "TrendingDown"} size={11} />
      {pct}
    </span>
  );
}

interface TooltipItem {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
      <div className="font-semibold mb-1.5 text-foreground">{label}</div>
      {payload.map((p: TooltipItem) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold text-foreground">
            {p.value?.toLocaleString("ru-RU")}
          </span>
        </div>
      ))}
    </div>
  );
};

function DashCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 flex flex-col gap-3 card-hover ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          )}
        </div>
        <Icon
          name="MoreHorizontal"
          size={16}
          className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        />
      </div>
      {children}
    </div>
  );
}

function StatPill({
  label,
  value,
  trend,
  up = true,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  up?: boolean;
  icon?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
        {icon && (
          <Icon
            name={icon as "Activity"}
            size={10}
            className="text-muted-foreground"
          />
        )}
        {label}
      </div>
      <div className="font-mono text-xl font-bold leading-none text-foreground">
        {value}
      </div>
      <Trend pct={trend} positive={up} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Опубликовано:
      "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",
    Активно:
      "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",
    "В работе":
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Согласовано:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Пауза:
      "bg-red-500/10 text-red-400 border border-red-500/20",
    Отменено:
      "bg-red-500/10 text-red-400 border border-red-500/20",
    "Не начато":
      "bg-muted/60 text-muted-foreground border border-border",
    Отправлено:
      "bg-muted/60 text-muted-foreground border border-border",
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

function LoadingText() {
  return (
    <div className="text-xs text-muted-foreground py-6 text-center">
      Загрузка...
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function TopNav({ active }: { active: string }) {
  const navigate = useNavigate();
  const items = [
    { path: "/dashboard",  label: "Дашборд",      icon: "LayoutDashboard" },
    { path: "/",           label: "Основное",      icon: "Table2" },
    { path: "/analytics",  label: "Аналитика",     icon: "LineChart" },
    { path: "/economics",  label: "Экономика",     icon: "Calculator" },
    { path: "/research",   label: "Исследование",  icon: "Search" },
    { path: "/content",    label: "Контент",       icon: "Film" },
    { path: "/data",       label: "Данные",         icon: "Database" },
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

// ─── KPI metric card icons ────────────────────────────────────────────────────
const METRIC_ICONS: Record<string, string> = {
  Wallet: "Wallet",
  Eye: "Eye",
  Users: "Users",
  ShoppingCart: "ShoppingCart",
  Tag: "Tag",
  TrendingUp: "TrendingUp",
};

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { dark } = useTheme();

  // ── Adaptive chart colours ─────────────────────────────────────────────────
  const CHART_PRIMARY   = dark ? "#b5f23d" : "#2563eb";
  const CHART_SECONDARY = dark ? "#3b3b3b" : "#e2e8f0";
  const CHART_DANGER    = dark ? "#ef4444" : "#dc2626";

  const [period, setPeriod] = useState(0);

  // ── State ──────────────────────────────────────────────────────────────────
  const [weeklyData, setWeeklyData]           = useState<WeeklyStat[]>([]);
  const [weeklyLoading, setWeeklyLoading]     = useState(true);

  const [kpiData, setKpiData]                 = useState<KpiItem[]>([]);
  const [kpiLoading, setKpiLoading]           = useState(true);

  const [channelData, setChannelData]         = useState<ChannelItem[]>([]);
  const [channelLoading, setChannelLoading]   = useState(true);

  const [influencerData, setInfluencerData]   = useState<InfluencerItem[]>([]);
  const [influencerLoading, setInfluencerLoading] = useState(true);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("weekly-stats")
      .then((data) => setWeeklyData(Array.isArray(data) ? data : []))
      .catch(() => setWeeklyData([]))
      .finally(() => setWeeklyLoading(false));

    api.get("kpi")
      .then((data) => setKpiData(Array.isArray(data) ? data : []))
      .catch(() => setKpiData([]))
      .finally(() => setKpiLoading(false));

    api.get("channels")
      .then((data) => setChannelData(Array.isArray(data) ? data : []))
      .catch(() => setChannelData([]))
      .finally(() => setChannelLoading(false));

    api.get("influencers")
      .then((data) => setInfluencerData(Array.isArray(data) ? data : []))
      .catch(() => setInfluencerData([]))
      .finally(() => setInfluencerLoading(false));
  }, []);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalBudget = weeklyData.reduce((s, w) => s + (w.budget || 0), 0);
  const totalLeads  = weeklyData.reduce((s, w) => s + (w.leads || 0), 0);
  const totalSales  = weeklyData.reduce((s, w) => s + (w.conversions || 0), 0);
  const totalReach  = weeklyData.reduce((s, w) => s + (w.reach || 0), 0);
  const avgCPL      = totalLeads > 0 ? Math.round(totalBudget / totalLeads) : 0;
  const avgROMI     = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + (w.romi || 0), 0) / weeklyData.length)
    : 0;
  const bestRomi     = weeklyData.length > 0 ? Math.max(...weeklyData.map((w) => w.romi || 0)) : 0;
  const bestRomiWeek = weeklyData.find((w) => w.romi === bestRomi)?.week ?? "—";

  const cplTrend = weeklyData.map((w) => ({
    week: w.week,
    cpl: w.cpl,
    ltv: Math.round(w.cpl * 7.2),
  }));

  // ── Summary KPI row ────────────────────────────────────────────────────────
  const summaryCards = [
    { label: "Бюджет",  value: `${(totalBudget / 1000).toFixed(0)} тыс ₽`, trend: "+12%", up: true,  icon: "Wallet" },
    { label: "Охват",   value: `${(totalReach / 1000).toFixed(1)}К`,        trend: "+18%", up: true,  icon: "Eye" },
    { label: "Лиды",    value: String(totalLeads),                           trend: "+76%", up: true,  icon: "Users" },
    { label: "Продажи", value: String(totalSales),                           trend: "+46%", up: true,  icon: "ShoppingCart" },
    { label: "Ср. CPL", value: `${avgCPL.toLocaleString("ru-RU")} ₽`,       trend: "-30%", up: true,  icon: "Tag" },
    { label: "ROMI",    value: `${avgROMI}%`,                                trend: "+36%", up: true,  icon: "TrendingUp" },
  ];

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
              <span className="font-semibold text-sm text-foreground">
                РнП Маркетинг
              </span>
              <span className="text-muted-foreground text-xs hidden sm:block">·</span>
              <span className="text-xs text-muted-foreground hidden sm:block">2025</span>
            </div>
            <div className="flex items-center gap-1">
              <TopNav active="/dashboard" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ── Period selector ────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {PERIODS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(i)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === i
                    ? dark
                      ? "bg-[#b5f23d]/15 text-[#b5f23d] border border-[#b5f23d]/25"
                      : "bg-blue-100 text-blue-700 border border-blue-300 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="Clock" size={11} />
            Обновлено 13 мар, 09:00
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 animate-fade-in">

        {/* ── KPI summary row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
          {weeklyLoading ? (
            <div className="col-span-full">
              <LoadingText />
            </div>
          ) : (
            summaryCards.map((item) => (
              <div
                key={item.label}
                className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1.5 card-hover"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon
                    name={METRIC_ICONS[item.icon] as "Activity"}
                    size={11}
                    className="text-[#b5f23d]"
                  />
                  {item.label}
                </div>
                <div className="font-mono text-lg font-bold text-foreground leading-none">
                  {item.value}
                </div>
                <Trend pct={item.trend} positive={item.up} />
              </div>
            ))
          )}
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Бюджет + Лиды по неделям */}
          <DashCard
            title="Бюджет и лиды по неделям"
            subtitle={PERIODS[period]}
            className="xl:col-span-2"
          >
            {weeklyLoading ? (
              <LoadingText />
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyData}
                    margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                    barGap={4}
                  >
                    <defs>
                      <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={CHART_PRIMARY} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={CHART_SECONDARY} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_SECONDARY} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="budget"
                      orientation="left"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`}
                    />
                    <YAxis
                      yAxisId="leads"
                      orientation="right"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      yAxisId="budget"
                      dataKey="budget"
                      name="Бюджет ₽"
                      fill="url(#gradBudget)"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      yAxisId="leads"
                      dataKey="leads"
                      name="Лиды"
                      fill="url(#gradLeads)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashCard>

          {/* Каналы привлечения */}
          <DashCard title="Каналы привлечения" subtitle="Доля лидов, %">
            {channelLoading ? (
              <LoadingText />
            ) : (
              <div className="flex flex-col gap-2.5">
                {channelData.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_PRIMARY }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground truncate">
                          {c.name}
                        </span>
                        <span className="text-xs font-mono font-semibold metric-lime ml-2">
                          {c.value}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${c.value}%`,
                            background: dark
                              ? `linear-gradient(90deg, #b5f23d 0%, #8bc22a 100%)`
                              : `linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashCard>

          {/* Воронка конверсии */}
          <DashCard title="Воронка конверсии" subtitle="Охват → Продажи">
            <div className="flex flex-col gap-1.5">
              {FUNNEL_DATA.map((s, i) => {
                const widths  = [100, 60, 32, 20, 14];
                // gradient of opacity on lime for funnel stages
                const opacities = [0.9, 0.7, 0.5, 0.35, 0.2];
                const opacity   = opacities[i];
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                      {s.stage}
                    </span>
                    <div className="flex-1 h-6 relative flex items-center">
                      <div
                        className="h-full rounded flex items-center justify-end pr-2 transition-all"
                        style={{
                          width: `${widths[i]}%`,
                          backgroundColor: `rgba(181,242,61,${opacity * 0.15})`,
                          border: `1px solid rgba(181,242,61,${opacity * 0.35})`,
                        }}
                      >
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: `rgba(181,242,61,${0.5 + opacity * 0.5})` }}
                        >
                          {s.value.toLocaleString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 shrink-0">
                      {s.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Конверсия{" "}
                <span className="font-mono font-semibold metric-lime">0.06%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                CR лид→продажа{" "}
                <span className="font-mono font-semibold metric-lime">19.6%</span>
              </div>
            </div>
          </DashCard>

          {/* CPL vs LTV тренд */}
          <DashCard
            title="CPL vs LTV по неделям"
            subtitle="Стоимость привлечения и ценность клиента"
          >
            {weeklyLoading ? (
              <LoadingText />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={cplTrend}
                    margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradCPL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_DANGER} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={CHART_DANGER} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradLTV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_PRIMARY} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cpl"
                      name="CPL ₽"
                      stroke={CHART_DANGER}
                      strokeWidth={1.5}
                      fill="url(#gradCPL)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="ltv"
                      name="LTV ₽"
                      stroke={CHART_PRIMARY}
                      strokeWidth={1.5}
                      fill="url(#gradLTV)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashCard>

          {/* KPI план/факт */}
          <DashCard title="KPI: план vs факт" subtitle={PERIODS[period]}>
            {kpiLoading ? (
              <LoadingText />
            ) : (
              <div className="flex flex-col gap-2.5">
                {kpiData.map((k) => {
                  const pct   = k.plan > 0 ? Math.round((k.fact / k.plan) * 100) : 0;
                  const color =
                    pct >= 100 ? CHART_PRIMARY : pct >= 70 ? "#f59e0b" : CHART_DANGER;
                  return (
                    <div key={k.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{k.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {(k.plan || 0).toLocaleString("ru-RU")} {k.unit}
                          </span>
                          <span className="font-mono font-semibold" style={{ color }}>
                            {(k.fact || 0).toLocaleString("ru-RU")}
                          </span>
                          <span className="font-mono text-xs" style={{ color }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashCard>

          {/* ROMI тренд */}
          <DashCard
            title="ROMI по неделям"
            subtitle="Возврат на маркетинговые инвестиции"
          >
            {weeklyLoading ? (
              <LoadingText />
            ) : (
              <>
                <div className="flex gap-5 flex-wrap">
                  <StatPill
                    label="Ср. ROMI"
                    value={`${avgROMI}%`}
                    trend="+36%"
                    up
                    icon="Percent"
                  />
                  <StatPill
                    label="Лучшая неделя"
                    value={`${bestRomi}%`}
                    trend={bestRomiWeek}
                    up
                    icon="Star"
                  />
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weeklyData}
                      margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradROMI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={CHART_PRIMARY} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="romi"
                        name="ROMI %"
                        stroke={CHART_PRIMARY}
                        strokeWidth={2}
                        fill="url(#gradROMI)"
                        dot={{ fill: CHART_PRIMARY, r: 3, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </DashCard>

          {/* Инфлюенсеры */}
          <DashCard
            title="Инфлюенсеры"
            subtitle="Результаты размещений"
            className="xl:col-span-2"
          >
            {influencerLoading ? (
              <LoadingText />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        Блогер
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        Охват
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        CPM ₽
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        Лиды
                      </th>
                      <th className="text-center py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencerData.map((inf) => (
                      <tr
                        key={inf.id ?? inf.name}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2 font-medium text-foreground">
                          {inf.name}
                        </td>
                        <td className="py-2 text-right font-mono text-foreground">
                          {(inf.reach || 0).toLocaleString("ru-RU")}
                        </td>
                        <td className="py-2 text-right font-mono text-foreground">
                          {(inf.cpm || 0).toLocaleString("ru-RU")}
                        </td>
                        <td className="py-2 text-right font-mono font-semibold metric-lime">
                          {inf.leads}
                        </td>
                        <td className="py-2 text-center">
                          <StatusBadge status={inf.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td className="py-2 font-semibold text-xs text-muted-foreground">
                        Итого
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-foreground">
                        {influencerData
                          .reduce((s, r) => s + (r.reach || 0), 0)
                          .toLocaleString("ru-RU")}
                      </td>
                      <td className="py-2 text-right font-mono text-muted-foreground">
                        —
                      </td>
                      <td className="py-2 text-right font-mono font-bold metric-lime">
                        {influencerData.reduce((s, r) => s + (r.leads || 0), 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </DashCard>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#b5f23d]/20 flex items-center justify-center">
              <Icon name="Activity" size={9} className="text-[#b5f23d]" />
            </div>
            РнП Маркетинг · 2025
          </div>
          <span>Данные обновляются из базы</span>
        </div>
      </footer>
    </div>
  );
}