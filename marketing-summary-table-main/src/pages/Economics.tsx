import { useState, useEffect, useRef } from "react";
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
interface ProductCalc {
  id?: number;
  name: string;
  price: number;
  vc: number;
  cac: number;
  fc: number;
  qty: number;
  ltv: number;
}

// ─── DB ↔ UI mapping ──────────────────────────────────────────────────────────
function fromApi(raw: Record<string, unknown>): ProductCalc {
  return {
    id:    raw.id as number,
    name:  (raw.name as string) ?? "",
    price: Number(raw.price) || 0,
    vc:    Number(raw.variable_cost) || 0,
    cac:   Number(raw.cac) || 0,
    fc:    Number(raw.fixed_cost) || 0,
    qty:   Number(raw.qty) || 0,
    ltv:   Number(raw.ltv) || 0,
  };
}

function toApi(p: ProductCalc) {
  return {
    name:          p.name,
    price:         p.price,
    variable_cost: p.vc,
    cac:           p.cac,
    fixed_cost:    p.fc,
    qty:           p.qty,
    ltv:           p.ltv,
  };
}

// ─── Calculations ─────────────────────────────────────────────────────────────
function calcProduct(p: ProductCalc) {
  const cm         = p.price - p.vc;
  const cmWithCAC  = p.cac > 0 ? p.price - p.vc - p.cac / (p.qty || 1) : cm;
  const bep        = p.fc > 0 ? Math.ceil(p.fc / (cm || 1)) : 0;
  const revenue    = p.price * p.qty;
  const varCosts   = p.vc * p.qty;
  const marginTotal = cm * p.qty;
  const opProfit   = marginTotal - p.fc;
  const payback    = p.cac > 0 && cm > 0 ? +(p.cac / cm).toFixed(1) : 0;
  const ltvCacRatio = p.cac > 0 ? +(p.ltv / p.cac).toFixed(2) : 0;
  return { cm, cmWithCAC, bep, revenue, varCosts, marginTotal, opProfit, payback, ltvCacRatio };
}

function calcClient(p: ProductCalc) {
  const qpc          = 5;
  const bepClient    = p.cac > 0 && p.price - p.vc > 0 ? Math.ceil(p.cac / (p.price - p.vc)) : 0;
  const revenueClient = qpc * p.price;
  const varClient    = p.vc * qpc + p.cac;
  const cmClient     = p.ltv - varClient;
  const bepPeriod    = p.fc > 0 && p.ltv > 0 ? Math.ceil(p.fc / p.ltv) : 0;
  return { qpc, bepClient, revenueClient, varClient, cmClient, bepPeriod };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, prefix = "") {
  if (isNaN(n) || !isFinite(n)) return "—";
  return prefix + n.toLocaleString("ru-RU");
}

function NumInput({
  label,
  value,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center border border-border rounded-md overflow-hidden bg-muted focus-within:border-[#b5f23d]/50 transition-colors">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-2 py-1.5 text-sm font-mono text-foreground bg-transparent outline-none min-w-0"
        />
        {suffix && (
          <span className="px-2 text-xs text-muted-foreground bg-card border-l border-border shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function PlaceholderTab({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="bg-card border border-dashed border-border rounded-xl w-16 h-16 flex items-center justify-center">
        <Icon name={icon as "Activity"} size={26} className="text-muted-foreground" />
      </div>
      <div>
        <div className="font-semibold text-foreground text-base">{title}</div>
        <div className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
        <Icon name="Clock" size={11} />
        Скоро
      </span>
    </div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const ECON_TABS = [
  { id: "unit",           label: "Юнит-экономика",  icon: "Calculator" },
  { id: "finmodel",       label: "Финмодель",        icon: "TrendingUp" },
  { id: "budget",         label: "Бюджеты",          icon: "Wallet" },
  { id: "content_budget", label: "Бюджет съёмок",   icon: "Film" },
] as const;
type EconTabId = typeof ECON_TABS[number]["id"];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Economics() {
  const [activeTab, setActiveTab]     = useState<EconTabId>("unit");
  const [products, setProducts]       = useState<ProductCalc[]>([]);
  const [activeProduct, setActiveProduct] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [saveStatus, setSaveStatus]   = useState<"idle" | "saving" | "saved">("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load products ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api.get("products")
      .then((data) => {
        const rows = Array.isArray(data) ? data.map(fromApi) : [];
        setProducts(rows);
        setActiveProduct(0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const p      = products[activeProduct];
  const prod   = p ? calcProduct(p) : null;
  const client = p ? calcClient(p) : null;

  // ── Update field + debounce save ──────────────────────────────────────────
  function updateField(field: keyof ProductCalc, value: number | string) {
    setProducts((prev) => {
      const updated = prev.map((item, i) =>
        i === activeProduct ? { ...item, [field]: value } : item,
      );
      const updatedProduct = updated[activeProduct];
      if (updatedProduct?.id !== undefined) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSaveStatus("idle");
        debounceRef.current = setTimeout(async () => {
          setSaveStatus("saving");
          try {
            await api.put("products", updatedProduct.id!, toApi(updatedProduct));
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          } catch {
            setSaveStatus("idle");
          }
        }, 1500);
      }
      return updated;
    });
  }

  // ── Add product ───────────────────────────────────────────────────────────
  async function addProduct() {
    const newProduct: Omit<ProductCalc, "id"> = {
      name:  `Продукт ${products.length + 1}`,
      price: 1000,
      vc:    500,
      cac:   0,
      fc:    50000,
      qty:   100,
      ltv:   3000,
    };
    try {
      const created = await api.post("products", toApi(newProduct as ProductCalc));
      if (created && created.id) {
        setProducts((prev) => [...prev, fromApi(created)]);
        setActiveProduct(products.length);
      }
    } catch {
      setProducts((prev) => [...prev, newProduct as ProductCalc]);
      setActiveProduct(products.length);
    }
  }

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
              <span className="text-xs text-muted-foreground hidden sm:block">Экономика</span>
            </div>
            <div className="flex items-center gap-1"><TopNav active="/economics" /><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {ECON_TABS.map((tab) => (
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

        {/* Placeholders */}
        {activeTab === "finmodel" && (
          <PlaceholderTab
            icon="TrendingUp"
            title="Финансовая модель"
            desc="Планирование доходов, расходов и денежного потока на период"
          />
        )}
        {activeTab === "budget" && (
          <PlaceholderTab
            icon="Wallet"
            title="Бюджеты"
            desc="Управление маркетинговыми и операционными бюджетами"
          />
        )}
        {activeTab === "content_budget" && (
          <PlaceholderTab
            icon="Film"
            title="Бюджет съёмок"
            desc="Планирование бюджетов на создание контента и производство"
          />
        )}

        {/* ── Юнит-экономика ─────────────────────────────────────────────── */}
        {activeTab === "unit" && (
          <div className="flex flex-col gap-6">

            {/* Page header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-foreground">Юнит-экономика</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Мы зарабатываем или бегаем по кругу?
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon name="Loader" size={12} className="animate-spin" />
                    Сохранение...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-xs text-[#b5f23d] flex items-center gap-1.5">
                    <Icon name="CheckCircle" size={12} />
                    Сохранено
                  </span>
                )}
                <button
                  onClick={addProduct}
                  className="btn-lime flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
                >
                  <Icon name="Plus" size={13} />
                  Добавить продукт
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-xs text-muted-foreground py-10 text-center">Загрузка...</div>
            ) : products.length === 0 ? (
              <div className="text-xs text-muted-foreground py-10 text-center">
                Нет данных. Добавьте первый продукт.
              </div>
            ) : (
              <>
                {/* Product selector tabs */}
                <div className="flex gap-2 flex-wrap">
                  {products.map((prod, i) => (
                    <button
                      key={prod.id ?? i}
                      onClick={() => setActiveProduct(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        activeProduct === i
                          ? "bg-[#b5f23d]/15 text-[#b5f23d] border-[#b5f23d]/30"
                          : "bg-card text-foreground border-border hover:border-[#b5f23d]/25 hover:text-foreground"
                      }`}
                    >
                      {prod.name}
                    </button>
                  ))}
                </div>

                {p && prod && client && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* ── Inputs ─────────────────────────────────────────── */}
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 card-hover">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Icon name="Settings2" size={15} className="text-[#b5f23d]" />
                        <span className="font-semibold text-sm text-foreground">Входные данные</span>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Название продукта</label>
                        <input
                          className="mt-1 w-full px-2 py-1.5 text-sm border border-border rounded-md bg-muted text-foreground outline-none focus:border-[#b5f23d]/50 transition-colors"
                          value={p.name}
                          onChange={(e) => updateField("name", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <NumInput label="Цена (Rp)"                value={p.price} onChange={(v) => updateField("price", v)} suffix="₽" />
                        <NumInput label="Перем. затраты (VCp)"    value={p.vc}    onChange={(v) => updateField("vc", v)}    suffix="₽" />
                        <NumInput label="CAC (стоим. привлеч.)"   value={p.cac}   onChange={(v) => updateField("cac", v)}   suffix="₽" />
                        <NumInput label="LTV (ценность клиента)"  value={p.ltv}   onChange={(v) => updateField("ltv", v)}   suffix="₽" />
                        <NumInput label="Пост. затраты (FCpt)"    value={p.fc}    onChange={(v) => updateField("fc", v)}    suffix="₽" />
                        <NumInput label="Кол-во продаж (Qpt)"    value={p.qty}   onChange={(v) => updateField("qty", v)}   suffix="шт." />
                      </div>

                      {/* Status banner */}
                      {(prod.ltvCacRatio < 3 && p.cac > 0) || prod.opProfit < 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                            <Icon name="AlertTriangle" size={13} />
                            Красные флаги
                          </div>
                          {prod.opProfit < 0 && (
                            <div className="text-xs text-red-400">
                              · Операционный убыток: {fmt(prod.opProfit)} ₽
                            </div>
                          )}
                          {prod.ltvCacRatio < 3 && p.cac > 0 && (
                            <div className="text-xs text-red-400">
                              · LTV/CAC = {prod.ltvCacRatio} — нужно ≥ 3
                            </div>
                          )}
                          {prod.cm < p.cac && p.cac > 0 && (
                            <div className="text-xs text-red-400">
                              · Маржа ({fmt(prod.cm)} ₽) &lt; CAC ({fmt(p.cac)} ₽)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#b5f23d]/10 border border-[#b5f23d]/20 rounded-lg p-3 flex items-center gap-1.5">
                          <Icon name="CheckCircle" size={13} className="text-[#b5f23d]" />
                          <span className="text-xs font-medium text-[#b5f23d]">
                            Юнит-экономика положительная
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── По продукту ────────────────────────────────────── */}
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 card-hover">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Icon name="Package" size={15} className="text-blue-400" />
                        <span className="font-semibold text-sm text-foreground">По единице продукта</span>
                      </div>

                      <div className="rounded-lg overflow-hidden border border-border/50">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Метрика</th>
                              <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">CAC=0</th>
                              <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">CAC&gt;0</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              {
                                label: "Цена (Rp)",
                                cac0:  fmt(p.price, ""),
                                cacN:  fmt(p.price, ""),
                                suffix: "₽",
                                highlight: false,
                              },
                              {
                                label: "Перем. затраты (VCp)",
                                cac0:  fmt(p.vc, ""),
                                cacN:  fmt(p.vc + (p.cac > 0 ? p.cac / (p.qty || 1) : 0), ""),
                                suffix: "₽",
                                highlight: false,
                              },
                              {
                                label: "Маржинальная прибыль",
                                cac0:  fmt(prod.cm, ""),
                                cacN:  fmt(Math.round(prod.cmWithCAC), ""),
                                suffix: "₽",
                                highlight: true,
                              },
                            ].map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-border ${row.highlight ? "bg-[#b5f23d]/5" : ""}`}
                              >
                                <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                                  {row.cac0} {row.suffix}
                                </td>
                                <td className={`px-3 py-2 text-right font-mono font-semibold ${row.highlight ? "metric-lime" : "text-foreground"}`}>
                                  {row.cacN} {row.suffix}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center gap-2 pb-2 border-b border-border/50 pt-2">
                        <Icon name="Calendar" size={14} className="text-violet-400" />
                        <span className="font-semibold text-sm text-foreground">По периоду</span>
                      </div>

                      <div className="rounded-lg overflow-hidden border border-border/50">
                        <table className="w-full text-xs">
                          <tbody>
                            {[
                              { label: "Пост. затраты (FCpt)",    value: fmt(p.fc, ""),            suffix: "₽",   highlight: false, red: false },
                              { label: "Безубыт. (BEPpt)",        value: fmt(prod.bep, ""),         suffix: "шт.", highlight: false, red: false },
                              { label: "Кол-во продаж (Qpt)",    value: fmt(p.qty, ""),            suffix: "шт.", highlight: p.qty > prod.bep, red: false },
                              { label: "Выручка (Rt)",            value: fmt(prod.revenue, ""),     suffix: "₽",   highlight: false, red: false },
                              { label: "Перем. затраты (VCt)",    value: fmt(prod.varCosts, ""),    suffix: "₽",   highlight: false, red: false },
                              { label: "Маржинальная прибыль",    value: fmt(prod.marginTotal, ""), suffix: "₽",   highlight: true,  red: false },
                              { label: "Операц. прибыль (OPt)",  value: fmt(prod.opProfit, ""),    suffix: "₽",   highlight: prod.opProfit > 0, red: prod.opProfit < 0 },
                            ].map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-border last:border-0 ${
                                  row.red ? "bg-red-500/5" : row.highlight ? "bg-[#b5f23d]/5" : ""
                                }`}
                              >
                                <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                                <td
                                  className={`px-3 py-2 text-right font-mono font-semibold ${
                                    row.red ? "text-red-400" : row.highlight ? "metric-lime" : "text-foreground"
                                  }`}
                                >
                                  {row.value} {row.suffix}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── По клиенту ─────────────────────────────────────── */}
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 card-hover">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Icon name="User" size={15} className="text-[#b5f23d]" />
                        <span className="font-semibold text-sm text-foreground">По клиенту</span>
                      </div>

                      {/* KPI tiles */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "LTV/CAC",  value: p.cac > 0 ? prod.ltvCacRatio : "—", good: prod.ltvCacRatio >= 3, suffix: "x" },
                          { label: "Payback",  value: prod.payback || "—", good: prod.payback <= 3 && prod.payback > 0, suffix: "ед." },
                          { label: "LTV",      value: fmt(p.ltv), good: p.ltv > p.cac, suffix: "₽" },
                          { label: "CAC",      value: fmt(p.cac), good: false, suffix: "₽" },
                        ].map((kpi) => (
                          <div
                            key={kpi.label}
                            className={`rounded-lg p-3 border ${
                              kpi.good
                                ? "bg-[#b5f23d]/8 border-[#b5f23d]/20"
                                : "bg-muted/30 border-border"
                            }`}
                          >
                            <div className="text-xs text-muted-foreground">{kpi.label}</div>
                            <div
                              className={`font-mono text-xl font-bold mt-0.5 ${
                                kpi.good ? "metric-lime" : "text-foreground"
                              }`}
                            >
                              {kpi.value}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                {kpi.suffix}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg overflow-hidden border border-border/50">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">По клиенту</th>
                              <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Значение</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: "Ед. продукта на клиента (Qpc)", value: fmt(client.qpc, ""),           suffix: "шт.", highlight: false, red: false },
                              { label: "Безубыт. по кол-ву прод.",       value: fmt(client.bepClient, ""),     suffix: "шт.", highlight: false, red: false },
                              { label: "Доход на клиента (Rc)",          value: fmt(client.revenueClient, ""), suffix: "₽",   highlight: false, red: false },
                              { label: "Перем. затраты + CAC",           value: fmt(client.varClient, ""),     suffix: "₽",   highlight: false, red: false },
                              { label: "Маржа на клиента (CMcc)",        value: fmt(client.cmClient, ""),      suffix: "₽",   highlight: client.cmClient > 0, red: client.cmClient < 0 },
                              { label: "Безубыт. по клиентам",           value: fmt(client.bepPeriod, ""),     suffix: "чел.", highlight: false, red: false },
                            ].map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-border last:border-0 ${
                                  row.red ? "bg-red-500/5" : row.highlight ? "bg-[#b5f23d]/5" : ""
                                }`}
                              >
                                <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                                <td
                                  className={`px-3 py-2 text-right font-mono font-semibold ${
                                    row.red ? "text-red-400" : row.highlight ? "metric-lime" : "text-foreground"
                                  }`}
                                >
                                  {row.value} {row.suffix}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
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
            РнП Маркетинг · Экономика · 2025
          </div>
          <span>
            {saveStatus === "saving" && "Сохранение..."}
            {saveStatus === "saved" && "Изменения сохранены"}
            {saveStatus === "idle" && "Автосохранение через 1.5 с после изменения"}
          </span>
        </div>
      </footer>
    </div>
  );
}