import { useState } from "react";
import Icon from "@/components/ui/icon";
import { InputCell, ColHead, TD } from "./TablePrimitives";

type BudgetRow = { channel: string; category: string; plan: string; fact: string; note: string };

const initBudget = (): BudgetRow[] => [
  { channel: "Контекстная реклама", category: "Digital", plan: "", fact: "", note: "" },
  { channel: "Таргетированная реклама", category: "Digital", plan: "", fact: "", note: "" },
  { channel: "SEO / контент", category: "Digital", plan: "", fact: "", note: "" },
  { channel: "Email-маркетинг", category: "Digital", plan: "", fact: "", note: "" },
  { channel: "SMM", category: "Digital", plan: "", fact: "", note: "" },
  { channel: "Наружная реклама", category: "Офлайн", plan: "", fact: "", note: "" },
  { channel: "Мероприятия / PR", category: "Офлайн", plan: "", fact: "", note: "" },
  { channel: "Агентское вознаграждение", category: "Услуги", plan: "", fact: "", note: "" },
];

export function TabBudget() {
  const [rows, setRows] = useState<BudgetRow[]>(initBudget());
  const update = (i: number, key: keyof BudgetRow, val: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addRow = () => setRows((r) => [...r, { channel: "", category: "", plan: "", fact: "", note: "" }]);

  const totalPlan = rows.reduce((s, r) => s + (parseFloat(r.plan.replace(/\s/g, "").replace(",", ".")) || 0), 0);
  const totalFact = rows.reduce((s, r) => s + (parseFloat(r.fact.replace(/\s/g, "").replace(",", ".")) || 0), 0);
  const fmt = (n: number) => n > 0 ? n.toLocaleString("ru-RU") + " ₽" : "—";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Бюджет и расходы</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Плановые и фактические расходы по каналам</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Бюджет план</div>
            <div className="font-mono font-semibold text-sm text-primary">{fmt(totalPlan)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Факт расход</div>
            <div className={`font-mono font-semibold text-sm ${totalFact > totalPlan && totalPlan > 0 ? "text-red-500" : "text-green-600"}`}>{fmt(totalFact)}</div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60">
            <tr>
              <ColHead className="w-8">#</ColHead>
              <ColHead className="min-w-52">Канал / статья</ColHead>
              <ColHead className="w-36">Категория</ColHead>
              <ColHead className="w-36">Бюджет план, ₽</ColHead>
              <ColHead className="w-36">Факт расход, ₽</ColHead>
              <ColHead className="w-24">Остаток</ColHead>
              <ColHead className="min-w-40">Примечание</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const p = parseFloat(row.plan.replace(/\s/g, "").replace(",", ".")) || 0;
              const f = parseFloat(row.fact.replace(/\s/g, "").replace(",", ".")) || 0;
              const rem = p - f;
              return (
                <tr key={i} className="hover:bg-muted/30">
                  <TD><span className="text-xs text-muted-foreground px-2">{i + 1}</span></TD>
                  <TD><InputCell value={row.channel} onChange={(v) => update(i, "channel", v)} align="left" mono={false} placeholder="Название канала" /></TD>
                  <TD><InputCell value={row.category} onChange={(v) => update(i, "category", v)} align="left" mono={false} placeholder="Категория" /></TD>
                  <TD><InputCell value={row.plan} onChange={(v) => update(i, "plan", v)} placeholder="0" /></TD>
                  <TD><InputCell value={row.fact} onChange={(v) => update(i, "fact", v)} placeholder="0" /></TD>
                  <TD>
                    <span className={`font-mono text-sm px-2 font-medium ${p === 0 ? "text-muted-foreground" : rem >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {p > 0 ? rem.toLocaleString("ru-RU") + " ₽" : "—"}
                    </span>
                  </TD>
                  <TD><InputCell value={row.note} onChange={(v) => update(i, "note", v)} align="left" mono={false} placeholder="Примечание…" /></TD>
                </tr>
              );
            })}
            <tr className="bg-muted/40 font-semibold">
              <TD></TD>
              <TD><span className="text-xs font-semibold text-muted-foreground px-2">ИТОГО</span></TD>
              <TD></TD>
              <TD><span className="font-mono text-sm px-2 text-primary">{fmt(totalPlan)}</span></TD>
              <TD><span className={`font-mono text-sm px-2 ${totalFact > totalPlan && totalPlan > 0 ? "text-red-500" : "text-foreground"}`}>{fmt(totalFact)}</span></TD>
              <TD><span className={`font-mono text-sm px-2 font-medium ${totalPlan > 0 && (totalPlan - totalFact) < 0 ? "text-red-500" : "text-green-600"}`}>{totalPlan > 0 ? (totalPlan - totalFact).toLocaleString("ru-RU") + " ₽" : "—"}</span></TD>
              <TD></TD>
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="Plus" size={14} /> Добавить статью
      </button>
    </div>
  );
}
