import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type BloggerRow = {
  id: string;
  dates: string;
  link: string;
  price: string;
  comment: string;
  status: string;
  topic: string;
  contact: string;
  scenario: string;
  payStatus: string;
  reachPlanPer: string;
  reelsCount: string;
  reachPlanTotal: string;
  cpmPlan: string;
  cpmPerViewPlan: string;
  // факт по роликам (5 слотов)
  r1: string; r2: string; r3: string; r4: string; r5: string;
  reachFactTotal: string;
  cpmFact: string;
  cpmPerViewFact: string;
  // условия
  payment: string;
  barter: string;
  delivery: string;
  totalCost: string;
  adLink: string;
  refund: string;
};

const STATUSES = ["Не начато", "Отправлено", "Согласовано", "В работе", "Опубликовано", "Отказ"];
const PAY_STATUSES = ["—", "Счёт выставлен", "Оплачено", "Бартер", "Возврат"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeRow(): BloggerRow {
  return {
    id: `b_${Date.now()}_${Math.random()}`,
    dates: "", link: "", price: "", comment: "", status: "Не начато",
    topic: "", contact: "", scenario: "", payStatus: "—",
    reachPlanPer: "", reelsCount: "", reachPlanTotal: "",
    cpmPlan: "", cpmPerViewPlan: "",
    r1: "", r2: "", r3: "", r4: "", r5: "",
    reachFactTotal: "", cpmFact: "", cpmPerViewFact: "",
    payment: "", barter: "", delivery: "", totalCost: "", adLink: "", refund: "",
  };
}

function calcReachTotal(row: BloggerRow): string {
  const per = parseFloat(row.reachPlanPer.replace(/\s/g, "").replace(",", "."));
  const cnt = parseFloat(row.reelsCount.replace(/\s/g, "").replace(",", "."));
  if (isNaN(per) || isNaN(cnt) || cnt === 0) return "";
  return Math.round(per * cnt).toLocaleString("ru");
}

function calcCpmPlan(row: BloggerRow): string {
  const total = parseFloat(calcReachTotal(row).replace(/\s/g, "")) || 0;
  const price = parseFloat(row.price.replace(/\s/g, "").replace(",", "."));
  if (!total || isNaN(price)) return "";
  return Math.round((price / total) * 1000).toLocaleString("ru") + " ₽";
}

function calcFactTotal(row: BloggerRow): string {
  const vals = [row.r1, row.r2, row.r3, row.r4, row.r5].map((v) =>
    parseFloat(v.replace(/\s/g, "").replace(",", ".")) || 0
  );
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum > 0 ? sum.toLocaleString("ru") : "";
}

function calcCpmFact(row: BloggerRow): string {
  const total = parseFloat(calcFactTotal(row).replace(/\s/g, "")) || 0;
  const price = parseFloat(row.price.replace(/\s/g, "").replace(",", "."));
  if (!total || isNaN(price)) return "";
  return Math.round((price / total) * 1000).toLocaleString("ru") + " ₽";
}

function calcCpmPerView(price: string, factTotal: string): string {
  const p = parseFloat(price.replace(/\s/g, "").replace(",", "."));
  const t = parseFloat(factTotal.replace(/\s/g, "")) || 0;
  if (isNaN(p) || !t) return "";
  return (p / t).toFixed(2).replace(".", ",") + " ₽";
}

function calcTotal(row: BloggerRow): string {
  const pay = parseFloat(row.payment.replace(/\s/g, "").replace(",", ".")) || 0;
  const bar = parseFloat(row.barter.replace(/\s/g, "").replace(",", ".")) || 0;
  const del = parseFloat(row.delivery.replace(/\s/g, "").replace(",", ".")) || 0;
  const s = pay + bar + del;
  return s > 0 ? s.toLocaleString("ru") + " ₽" : "";
}

// ─── CELLS ────────────────────────────────────────────────────────────────────

function Input({
  value, onChange, placeholder = "", className = "", align = "left",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; align?: "left" | "right" | "center";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 outline-none text-xs px-1.5 py-[3px] focus:bg-accent/50 rounded transition-colors placeholder:text-muted-foreground/20 text-${align} ${className}`}
    />
  );
}

function AutoVal({ value }: { value: string }) {
  return (
    <div className="px-1.5 py-[3px] text-right text-xs font-mono text-muted-foreground/70 bg-muted/20 rounded italic select-none">
      {value || "—"}
    </div>
  );
}

function Select({
  value, onChange, options, className = "",
}: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent border-0 outline-none text-xs px-1 py-[3px] focus:bg-accent/50 rounded cursor-pointer ${className}`}
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function TH({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-2 py-1.5 text-left text-[10px] font-semibold text-white/80 whitespace-nowrap border-b border-white/10 ${className}`}>
      {children}
    </th>
  );
}

function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`border-b border-border/30 px-0.5 py-0.5 ${className}`}>
      {children}
    </td>
  );
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

function CampaignSummary({ rows }: { rows: BloggerRow[] }) {
  const totalBudget = rows.reduce((s, r) => s + (parseFloat(r.price.replace(/\s/g, "").replace(",", ".")) || 0), 0);
  const totalReach = rows.reduce((s, r) => {
    const f = parseFloat(calcFactTotal(r).replace(/\s/g, "")) || 0;
    return s + f;
  }, 0);
  const published = rows.filter((r) => r.status === "Опубликовано").length;
  const avgCpm = totalReach > 0 && totalBudget > 0
    ? Math.round((totalBudget / totalReach) * 1000)
    : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Блогеров всего", value: rows.length, unit: "" },
        { label: "Опубликовано", value: published, unit: "" },
        { label: "Бюджет", value: totalBudget > 0 ? totalBudget.toLocaleString("ru") : "—", unit: totalBudget > 0 ? "₽" : "" },
        { label: "CPM факт (общий)", value: avgCpm ? avgCpm.toLocaleString("ru") : "—", unit: avgCpm ? "₽" : "" },
      ].map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
          <div className="text-lg font-bold">
            {c.value} <span className="text-sm font-normal text-muted-foreground">{c.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CAMPAIGN TAB ─────────────────────────────────────────────────────────────

type Campaign = {
  id: string;
  name: string;
  rows: BloggerRow[];
};

function CampaignTable({ campaign, onUpdate }: { campaign: Campaign; onUpdate: (c: Campaign) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateRow = (rowId: string, field: keyof BloggerRow, val: string) =>
    onUpdate({
      ...campaign,
      rows: campaign.rows.map((r) => r.id === rowId ? { ...r, [field]: val } : r),
    });

  const addRow = () =>
    onUpdate({ ...campaign, rows: [...campaign.rows, makeRow()] });

  const removeRow = (rowId: string) =>
    onUpdate({ ...campaign, rows: campaign.rows.filter((r) => r.id !== rowId) });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-5">
      {/* Campaign header */}
      <div
        className="bg-[#1a3557] text-white px-4 py-2.5 flex items-center gap-3 cursor-pointer"
        onClick={() => setCollapsed((v) => !v)}
      >
        <Icon name={collapsed ? "ChevronRight" : "ChevronDown"} size={13} className="text-white/60 shrink-0" />
        <input
          value={campaign.name}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate({ ...campaign, name: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-0 outline-none font-semibold text-sm placeholder:text-white/40 focus:bg-white/10 rounded px-1"
          placeholder="Название кампании"
        />
        <span className="text-white/40 text-xs">{campaign.rows.length} блогеров</span>
      </div>

      {!collapsed && (
        <>
          <div className="px-4 pt-3 pb-2">
            <CampaignSummary rows={campaign.rows} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 1400 }}>
              <thead>
                {/* Group headers */}
                <tr className="bg-[#1a3557] text-white">
                  <TH className="w-7">#</TH>
                  <TH className="min-w-24">Даты публ.</TH>
                  <TH className="min-w-36">Ссылка на блогера</TH>
                  <TH className="w-24">Цена</TH>
                  <TH className="min-w-32">Комментарий</TH>
                  <TH className="w-28">Статус</TH>
                  <TH className="min-w-32">Тема обзора</TH>
                  <TH className="min-w-28">Контакт</TH>
                  <TH className="w-24">Сценарий</TH>
                  <TH className="w-28">Статус оплаты</TH>
                  {/* Охват план */}
                  <TH className="w-24 bg-blue-900/40">Охват/1 ролик</TH>
                  <TH className="w-20 bg-blue-900/40">Роликов</TH>
                  <TH className="w-28 bg-blue-900/40">Охват план общий</TH>
                  <TH className="w-24 bg-blue-900/40">CPM план</TH>
                  <TH className="w-24 bg-blue-900/40">₽/просм план</TH>
                  {/* Факт по роликам */}
                  <TH className="w-20 bg-emerald-900/30">Ролик 1</TH>
                  <TH className="w-20 bg-emerald-900/30">Ролик 2</TH>
                  <TH className="w-20 bg-emerald-900/30">Ролик 3</TH>
                  <TH className="w-20 bg-emerald-900/30">Ролик 4</TH>
                  <TH className="w-20 bg-emerald-900/30">Ролик 5</TH>
                  <TH className="w-28 bg-emerald-900/30">Охват факт общий</TH>
                  <TH className="w-24 bg-emerald-900/30">CPM факт</TH>
                  <TH className="w-24 bg-emerald-900/30">₽/просм факт</TH>
                  {/* Условия */}
                  <TH className="w-24 bg-amber-900/30">Оплата</TH>
                  <TH className="w-24 bg-amber-900/30">Бартер</TH>
                  <TH className="w-24 bg-amber-900/30">Доставка</TH>
                  <TH className="w-28 bg-amber-900/30">Итого стоим.</TH>
                  <TH className="min-w-36 bg-amber-900/30">Ссылка на рекламу</TH>
                  <TH className="w-20 bg-amber-900/30">Возврат</TH>
                </tr>
              </thead>
              <tbody>
                {campaign.rows.map((row, idx) => {
                  const reachTotal = calcReachTotal(row);
                  const cpmPlan = calcCpmPlan(row);
                  const factTotal = calcFactTotal(row);
                  const cpmFact = calcCpmFact(row);
                  const cpmPerViewFact = calcCpmPerView(row.price, factTotal);
                  const totalCost = calcTotal(row);
                  const isEven = idx % 2 === 0;
                  const statusColor =
                    row.status === "Опубликовано" ? "text-emerald-600"
                      : row.status === "Отказ" ? "text-red-500"
                      : row.status === "Согласовано" ? "text-blue-600"
                      : "";

                  return (
                    <tr key={row.id} className={`group/row ${isEven ? "bg-background" : "bg-muted/10"} hover:bg-accent/20 transition-colors`}>
                      <TD className="px-2 text-muted-foreground/30 text-center">{idx + 1}</TD>
                      <TD><Input value={row.dates} onChange={(v) => updateRow(row.id, "dates", v)} placeholder="дд.мм" /></TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Input value={row.link} onChange={(v) => updateRow(row.id, "link", v)} placeholder="https://…" className="text-blue-600 dark:text-blue-400" />
                          {row.link && (
                            <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 shrink-0">
                              <Icon name="ExternalLink" size={10} />
                            </a>
                          )}
                        </div>
                      </TD>
                      <TD><Input value={row.price} onChange={(v) => updateRow(row.id, "price", v)} placeholder="0 ₽" align="right" className="font-mono" /></TD>
                      <TD><Input value={row.comment} onChange={(v) => updateRow(row.id, "comment", v)} placeholder="Комментарий…" /></TD>
                      <TD>
                        <Select value={row.status} onChange={(v) => updateRow(row.id, "status", v)} options={STATUSES} className={statusColor} />
                      </TD>
                      <TD><Input value={row.topic} onChange={(v) => updateRow(row.id, "topic", v)} placeholder="Тема…" /></TD>
                      <TD><Input value={row.contact} onChange={(v) => updateRow(row.id, "contact", v)} placeholder="@handle" /></TD>
                      <TD><Input value={row.scenario} onChange={(v) => updateRow(row.id, "scenario", v)} placeholder="Сценарий" /></TD>
                      <TD>
                        <Select value={row.payStatus} onChange={(v) => updateRow(row.id, "payStatus", v)} options={PAY_STATUSES}
                          className={row.payStatus === "Оплачено" ? "text-emerald-600" : row.payStatus === "Счёт выставлен" ? "text-amber-600" : ""} />
                      </TD>
                      {/* план */}
                      <TD className="bg-blue-50/30 dark:bg-blue-950/10"><Input value={row.reachPlanPer} onChange={(v) => updateRow(row.id, "reachPlanPer", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-blue-50/30 dark:bg-blue-950/10"><Input value={row.reelsCount} onChange={(v) => updateRow(row.id, "reelsCount", v)} placeholder="1" align="right" className="font-mono" /></TD>
                      <TD className="bg-blue-50/30 dark:bg-blue-950/10"><AutoVal value={reachTotal} /></TD>
                      <TD className="bg-blue-50/30 dark:bg-blue-950/10"><AutoVal value={cpmPlan} /></TD>
                      <TD className="bg-blue-50/30 dark:bg-blue-950/10"><AutoVal value={calcCpmPerView(row.price, reachTotal.replace(/\s/g, ""))} /></TD>
                      {/* факт */}
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><Input value={row.r1} onChange={(v) => updateRow(row.id, "r1", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><Input value={row.r2} onChange={(v) => updateRow(row.id, "r2", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><Input value={row.r3} onChange={(v) => updateRow(row.id, "r3", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><Input value={row.r4} onChange={(v) => updateRow(row.id, "r4", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><Input value={row.r5} onChange={(v) => updateRow(row.id, "r5", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><AutoVal value={factTotal} /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><AutoVal value={cpmFact} /></TD>
                      <TD className="bg-emerald-50/30 dark:bg-emerald-950/10"><AutoVal value={cpmPerViewFact} /></TD>
                      {/* условия */}
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10"><Input value={row.payment} onChange={(v) => updateRow(row.id, "payment", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10"><Input value={row.barter} onChange={(v) => updateRow(row.id, "barter", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10"><Input value={row.delivery} onChange={(v) => updateRow(row.id, "delivery", v)} placeholder="0" align="right" className="font-mono" /></TD>
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10"><AutoVal value={totalCost} /></TD>
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10">
                        <div className="flex items-center gap-1">
                          <Input value={row.adLink} onChange={(v) => updateRow(row.id, "adLink", v)} placeholder="https://…" className="text-blue-600 dark:text-blue-400" />
                          {row.adLink && (
                            <a href={row.adLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 shrink-0">
                              <Icon name="ExternalLink" size={10} />
                            </a>
                          )}
                        </div>
                      </TD>
                      <TD className="bg-amber-50/30 dark:bg-amber-950/10">
                        <Select value={row.refund || "—"} onChange={(v) => updateRow(row.id, "refund", v)} options={["—", "Да", "Нет", "Частичный"]} />
                      </TD>
                      {/* delete */}
                      <td className="px-1 border-b border-border/30">
                        <button onClick={() => removeRow(row.id)} className="opacity-0 group-hover/row:opacity-40 hover:!opacity-100 transition-opacity text-red-400">
                          <Icon name="X" size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-border/20 bg-muted/5">
            <button onClick={addRow} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
              <Icon name="Plus" size={11} /> добавить блогера
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function TabInfluencers() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: "c1", name: "Март 2025 — Reels / Инфлюенс", rows: [makeRow(), makeRow()] },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const updateCampaign = (id: string, c: Campaign) =>
    setCampaigns((cs) => cs.map((cc) => cc.id === id ? c : cc));

  const removeCampaign = (id: string) =>
    setCampaigns((cs) => cs.filter((c) => c.id !== id));

  const createCampaign = () => {
    if (!newName.trim()) return;
    setCampaigns((cs) => [...cs, { id: `c_${Date.now()}`, name: newName.trim(), rows: [makeRow()] }]);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Контент-трафик / Инфлюенс</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Детальный трекинг по каждому блогеру — охваты, CPM, условия, ссылки
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60" />Охват план</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60" />Охват факт</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60" />Условия сотрудничества</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-10 h-3 rounded bg-muted/30 border border-border italic" />Авто</span>
      </div>

      {campaigns.map((c) => (
        <div key={c.id} className="relative group/camp">
          <CampaignTable
            campaign={c}
            onUpdate={(updated) => updateCampaign(c.id, updated)}
          />
          <button
            onClick={() => removeCampaign(c.id)}
            className="absolute top-2.5 right-3 opacity-0 group-hover/camp:opacity-40 hover:!opacity-100 transition-opacity text-red-300 z-10"
            title="Удалить кампанию"
          >
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      ))}

      <div className="mt-2">
        {showAdd ? (
          <div className="border border-border rounded-lg p-4 bg-card shadow-sm max-w-md">
            <p className="text-sm font-semibold mb-3">Новая кампания</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCampaign()}
              placeholder="Апрель 2025 — Инфлюенс"
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-3"
            />
            <div className="flex gap-2">
              <button onClick={createCampaign} disabled={!newName.trim()} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors">
                Создать
              </button>
              <button onClick={() => { setShowAdd(false); setNewName(""); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            <Icon name="Plus" size={14} /> Добавить кампанию
          </button>
        )}
      </div>
    </div>
  );
}
