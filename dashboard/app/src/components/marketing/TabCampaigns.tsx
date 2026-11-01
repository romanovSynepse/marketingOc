import { useState } from "react";
import Icon from "@/components/ui/icon";
import { InputCell, ColHead, TD } from "./TablePrimitives";

// ─── CAMPAIGNS ──────────────────────────────────────────────────────────────
type CampaignRow = {
  name: string; channel: string; start: string; end: string;
  goal: string; budget: string; status: string; kpi: string; note: string;
};

const STATUSES = ["Не начато", "В работе", "Выполнено", "Провалено", "Пауза"];

const initCampaigns = (): CampaignRow[] => [
  { name: "", channel: "", start: "", end: "", goal: "", budget: "", status: "Не начато", kpi: "", note: "" },
  { name: "", channel: "", start: "", end: "", goal: "", budget: "", status: "Не начато", kpi: "", note: "" },
  { name: "", channel: "", start: "", end: "", goal: "", budget: "", status: "Не начато", kpi: "", note: "" },
];

export function TabCampaigns() {
  const [rows, setRows] = useState<CampaignRow[]>(initCampaigns());
  const update = (i: number, key: keyof CampaignRow, val: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addRow = () => setRows((r) => [...r, { name: "", channel: "", start: "", end: "", goal: "", budget: "", status: "Не начато", kpi: "", note: "" }]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Кампании и планы</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Постановка целей и планирование маркетинговых кампаний</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60">
            <tr>
              <ColHead className="w-8">#</ColHead>
              <ColHead className="min-w-48">Название кампании</ColHead>
              <ColHead className="w-36">Канал</ColHead>
              <ColHead className="w-28">Дата старта</ColHead>
              <ColHead className="w-28">Дата финиша</ColHead>
              <ColHead className="min-w-48">Цель кампании</ColHead>
              <ColHead className="w-32">Бюджет, ₽</ColHead>
              <ColHead className="w-28">Статус</ColHead>
              <ColHead className="min-w-40">KPI / Метрики</ColHead>
              <ColHead className="min-w-40">Примечание</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <TD><span className="text-xs text-muted-foreground px-2">{i + 1}</span></TD>
                <TD><InputCell value={row.name} onChange={(v) => update(i, "name", v)} align="left" mono={false} placeholder="Название…" /></TD>
                <TD><InputCell value={row.channel} onChange={(v) => update(i, "channel", v)} align="left" mono={false} placeholder="Канал…" /></TD>
                <TD><InputCell value={row.start} onChange={(v) => update(i, "start", v)} placeholder="дд.мм.гг" /></TD>
                <TD><InputCell value={row.end} onChange={(v) => update(i, "end", v)} placeholder="дд.мм.гг" /></TD>
                <TD><InputCell value={row.goal} onChange={(v) => update(i, "goal", v)} align="left" mono={false} placeholder="Цель…" /></TD>
                <TD><InputCell value={row.budget} onChange={(v) => update(i, "budget", v)} placeholder="0" /></TD>
                <TD>
                  <select
                    className="w-full bg-transparent border-0 outline-none text-xs px-2 py-1 focus:bg-accent rounded cursor-pointer"
                    value={row.status}
                    onChange={(e) => update(i, "status", e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </TD>
                <TD><InputCell value={row.kpi} onChange={(v) => update(i, "kpi", v)} align="left" mono={false} placeholder="Лиды, охват…" /></TD>
                <TD><InputCell value={row.note} onChange={(v) => update(i, "note", v)} align="left" mono={false} placeholder="Примечание…" /></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="Plus" size={14} /> Добавить кампанию
      </button>
    </div>
  );
}

// ─── CHANNELS ───────────────────────────────────────────────────────────────
type ChannelRow = {
  channel: string; impressions: string; clicks: string; ctr: string;
  leads: string; conv: string; spend: string; revenue: string; roas: string;
};

const initChannels = (): ChannelRow[] => [
  { channel: "Яндекс.Директ", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
  { channel: "ВКонтакте Ads", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
  { channel: "Telegram Ads", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
  { channel: "SEO (органика)", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
  { channel: "Email", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
  { channel: "SMM", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" },
];

function calcChannel(row: ChannelRow) {
  const imp = parseFloat(row.impressions.replace(/\s/g, "")) || 0;
  const clk = parseFloat(row.clicks.replace(/\s/g, "")) || 0;
  const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) + "%" : row.ctr;
  const spend = parseFloat(row.spend.replace(/\s/g, "")) || 0;
  const revenue = parseFloat(row.revenue.replace(/\s/g, "")) || 0;
  const roas = spend > 0 ? (revenue / spend).toFixed(2) + "x" : row.roas;
  return { ctr, roas };
}

export function TabChannels() {
  const [rows, setRows] = useState<ChannelRow[]>(initChannels());
  const update = (i: number, key: keyof ChannelRow, val: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addRow = () => setRows((r) => [...r, { channel: "", impressions: "", clicks: "", ctr: "", leads: "", conv: "", spend: "", revenue: "", roas: "" }]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Анализ по каналам</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Сравнение эффективности маркетинговых каналов. CTR и ROAS считаются автоматически.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60">
            <tr>
              <ColHead className="w-8">#</ColHead>
              <ColHead className="min-w-44">Канал</ColHead>
              <ColHead className="w-28">Показы</ColHead>
              <ColHead className="w-28">Клики</ColHead>
              <ColHead className="w-20">CTR</ColHead>
              <ColHead className="w-24">Лиды</ColHead>
              <ColHead className="w-24">Конверсия</ColHead>
              <ColHead className="w-32">Расход, ₽</ColHead>
              <ColHead className="w-32">Выручка, ₽</ColHead>
              <ColHead className="w-20">ROAS</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const { ctr, roas } = calcChannel(row);
              return (
                <tr key={i} className="hover:bg-muted/30">
                  <TD><span className="text-xs text-muted-foreground px-2">{i + 1}</span></TD>
                  <TD><InputCell value={row.channel} onChange={(v) => update(i, "channel", v)} align="left" mono={false} placeholder="Канал…" /></TD>
                  <TD><InputCell value={row.impressions} onChange={(v) => update(i, "impressions", v)} placeholder="0" /></TD>
                  <TD><InputCell value={row.clicks} onChange={(v) => update(i, "clicks", v)} placeholder="0" /></TD>
                  <TD><span className="font-mono text-xs px-2 text-muted-foreground">{ctr || "—"}</span></TD>
                  <TD><InputCell value={row.leads} onChange={(v) => update(i, "leads", v)} placeholder="0" /></TD>
                  <TD><InputCell value={row.conv} onChange={(v) => update(i, "conv", v)} placeholder="%" /></TD>
                  <TD><InputCell value={row.spend} onChange={(v) => update(i, "spend", v)} placeholder="0" /></TD>
                  <TD><InputCell value={row.revenue} onChange={(v) => update(i, "revenue", v)} placeholder="0" /></TD>
                  <TD><span className="font-mono text-xs px-2 text-muted-foreground">{roas || "—"}</span></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="Plus" size={14} /> Добавить канал
      </button>
    </div>
  );
}

// ─── REPORT ─────────────────────────────────────────────────────────────────
type ReportRow = { campaign: string; result: string; status: string; kpiReach: string; roi: string; conclusion: string };

const initReport = (): ReportRow[] => [
  { campaign: "", result: "", status: "Выполнено", kpiReach: "", roi: "", conclusion: "" },
  { campaign: "", result: "", status: "В работе", kpiReach: "", roi: "", conclusion: "" },
];

export function TabReport() {
  const [rows, setRows] = useState<ReportRow[]>(initReport());
  const [summary, setSummary] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const update = (i: number, key: keyof ReportRow, val: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addRow = () => setRows((r) => [...r, { campaign: "", result: "", status: "Выполнено", kpiReach: "", roi: "", conclusion: "" }]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Финальный отчёт</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Итоги кампаний, выводы и следующие шаги</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card mb-4">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60">
            <tr>
              <ColHead className="w-8">#</ColHead>
              <ColHead className="min-w-44">Кампания</ColHead>
              <ColHead className="min-w-48">Результат</ColHead>
              <ColHead className="w-28">Статус</ColHead>
              <ColHead className="w-28">Вып. KPI</ColHead>
              <ColHead className="w-24">ROI</ColHead>
              <ColHead className="min-w-56">Вывод / рекомендация</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <TD><span className="text-xs text-muted-foreground px-2">{i + 1}</span></TD>
                <TD><InputCell value={row.campaign} onChange={(v) => update(i, "campaign", v)} align="left" mono={false} placeholder="Название…" /></TD>
                <TD><InputCell value={row.result} onChange={(v) => update(i, "result", v)} align="left" mono={false} placeholder="Описание результата…" /></TD>
                <TD>
                  <select
                    className="w-full bg-transparent border-0 outline-none text-xs px-2 py-1 focus:bg-accent rounded cursor-pointer"
                    value={row.status}
                    onChange={(e) => update(i, "status", e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </TD>
                <TD><InputCell value={row.kpiReach} onChange={(v) => update(i, "kpiReach", v)} placeholder="%" /></TD>
                <TD><InputCell value={row.roi} onChange={(v) => update(i, "roi", v)} placeholder="%" /></TD>
                <TD><InputCell value={row.conclusion} onChange={(v) => update(i, "conclusion", v)} align="left" mono={false} placeholder="Вывод…" /></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="mb-5 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="Plus" size={14} /> Добавить кампанию
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="bg-muted/60 px-4 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Общие выводы по периоду</span>
          </div>
          <textarea
            className="w-full p-4 text-sm bg-transparent border-0 outline-none resize-none min-h-28 placeholder:text-muted-foreground/50"
            placeholder="Напишите ключевые выводы по итогам периода…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="bg-muted/60 px-4 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Следующие шаги</span>
          </div>
          <textarea
            className="w-full p-4 text-sm bg-transparent border-0 outline-none resize-none min-h-28 placeholder:text-muted-foreground/50"
            placeholder="Задачи и инициативы на следующий период…"
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
