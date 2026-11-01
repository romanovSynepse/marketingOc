import { useState } from "react";
import Icon from "@/components/ui/icon";
import { InputCell, ColHead, TD } from "./TablePrimitives";

type KPIRow = { metric: string; unit: string; plan: string; fact: string; note: string };

const initKPI = (): KPIRow[] => [
  { metric: "Охват аудитории", unit: "чел.", plan: "", fact: "", note: "" },
  { metric: "Показы рекламы", unit: "шт.", plan: "", fact: "", note: "" },
  { metric: "Клики", unit: "шт.", plan: "", fact: "", note: "" },
  { metric: "CTR", unit: "%", plan: "", fact: "", note: "" },
  { metric: "Лиды", unit: "шт.", plan: "", fact: "", note: "" },
  { metric: "Конверсия лидов", unit: "%", plan: "", fact: "", note: "" },
  { metric: "Стоимость лида (CPL)", unit: "₽", plan: "", fact: "", note: "" },
  { metric: "Стоимость клика (CPC)", unit: "₽", plan: "", fact: "", note: "" },
  { metric: "Выручка с канала", unit: "₽", plan: "", fact: "", note: "" },
  { metric: "ROAS", unit: "x", plan: "", fact: "", note: "" },
  { metric: "ROI", unit: "%", plan: "", fact: "", note: "" },
];

export function TabKPI() {
  const [rows, setRows] = useState<KPIRow[]>(initKPI());
  const [period, setPeriod] = useState("Q1 2025");

  const update = (i: number, key: keyof KPIRow, val: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  };

  const addRow = () => setRows((r) => [...r, { metric: "", unit: "", plan: "", fact: "", note: "" }]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">KPI и аналитические показатели</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Плановые и фактические значения ключевых метрик</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Период:</span>
          <input
            className="border border-border rounded px-2 py-1 text-sm font-mono w-28 focus:outline-none focus:ring-1 focus:ring-primary"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60">
            <tr>
              <ColHead className="w-8">#</ColHead>
              <ColHead className="min-w-52">Метрика</ColHead>
              <ColHead className="w-20">Ед. изм.</ColHead>
              <ColHead className="w-32">План</ColHead>
              <ColHead className="w-32">Факт</ColHead>
              <ColHead className="w-24">Выполнение</ColHead>
              <ColHead className="min-w-48">Примечание</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const pv = parseFloat(row.plan.replace(/\s/g, "").replace(",", "."));
              const fv = parseFloat(row.fact.replace(/\s/g, "").replace(",", "."));
              const pct = !isNaN(pv) && !isNaN(fv) && pv !== 0 ? Math.round((fv / pv) * 100) : null;
              const color = pct === null ? "" : pct >= 100 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-red-500";
              return (
                <tr key={i} className="hover:bg-muted/30 group">
                  <TD><span className="text-xs text-muted-foreground px-2">{i + 1}</span></TD>
                  <TD><InputCell value={row.metric} onChange={(v) => update(i, "metric", v)} align="left" mono={false} placeholder="Название метрики" /></TD>
                  <TD><InputCell value={row.unit} onChange={(v) => update(i, "unit", v)} align="center" placeholder="шт." /></TD>
                  <TD><InputCell value={row.plan} onChange={(v) => update(i, "plan", v)} placeholder="0" /></TD>
                  <TD><InputCell value={row.fact} onChange={(v) => update(i, "fact", v)} placeholder="0" /></TD>
                  <TD>
                    <span className={`font-mono text-sm px-2 font-medium ${color}`}>
                      {pct !== null ? `${pct}%` : "—"}
                    </span>
                  </TD>
                  <TD><InputCell value={row.note} onChange={(v) => update(i, "note", v)} align="left" mono={false} placeholder="Комментарий…" /></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="Plus" size={14} /> Добавить метрику
      </button>
    </div>
  );
}
