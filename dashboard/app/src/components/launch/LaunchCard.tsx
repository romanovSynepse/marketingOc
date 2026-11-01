import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Launch, PlanRow, RegRow, TrafficRow, makeId, sumReg, sumRegFact } from "./LaunchTypes";
import { In, PlanIn, FactIn, TH, TD } from "./LaunchCells";

// ─── LAUNCH CARD ─────────────────────────────────────────────────────────────

export function LaunchCard({ launch, onUpdate, onRemove }: {
  launch: Launch;
  onUpdate: (l: Launch) => void;
  onRemove: () => void;
}) {
  const [section, setSection] = useState<"plan" | "regs" | "funnel" | "traffic">("plan");
  const [collapsed, setCollapsed] = useState(false);

  const u = <T extends keyof Launch>(key: T, val: Launch[T]) => onUpdate({ ...launch, [key]: val });

  // Plan rows
  const updatePlan = (id: string, field: keyof PlanRow, val: string) =>
    u("planRows", launch.planRows.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const addPlan = () => u("planRows", [...launch.planRows, { id: makeId(), date: "", stage: "", plan: "" }]);
  const removePlan = (id: string) => u("planRows", launch.planRows.filter((r) => r.id !== id));

  // Reg rows
  const updateReg = (id: string, field: keyof RegRow, val: string) =>
    u("regRows", launch.regRows.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const addReg = () => u("regRows", [...launch.regRows, { id: makeId(), source: "", plan: "", fact: "" }]);
  const removeReg = (id: string) => u("regRows", launch.regRows.filter((r) => r.id !== id));

  // Funnel
  const updateFunnel = (id: string, val: string) =>
    u("funnelSteps", launch.funnelSteps.map((s) => s.id === id ? { ...s, value: val } : s));
  const addFunnelStep = () =>
    u("funnelSteps", [...launch.funnelSteps, { id: makeId(), label: "Новый шаг", value: "", isConversion: false }]);
  const removeFunnelStep = (id: string) =>
    u("funnelSteps", launch.funnelSteps.filter((s) => s.id !== id));
  const updateFunnelLabel = (id: string, label: string) =>
    u("funnelSteps", launch.funnelSteps.map((s) => s.id === id ? { ...s, label } : s));

  // Traffic
  const updateTraffic = (id: string, field: keyof TrafficRow, val: string) =>
    u("trafficRows", launch.trafficRows.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const addTraffic = () =>
    u("trafficRows", [...launch.trafficRows, { id: makeId(), dates: "", budget: "", audience: "", price: "", subsCount: "", payback: "" }]);
  const removeTraffic = (id: string) =>
    u("trafficRows", launch.trafficRows.filter((r) => r.id !== id));

  const planTotal = sumReg(launch.regRows);
  const factTotal = sumRegFact(launch.regRows);

  const SECTIONS = [
    { key: "plan", label: "План запуска", icon: "CalendarCheck" },
    { key: "regs", label: "Декомп. регистраций", icon: "Users" },
    { key: "funnel", label: "Декомп. воронки", icon: "GitBranch" },
    { key: "traffic", label: "Декомп. трафика", icon: "TrendingUp" },
  ] as const;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6">
      {/* Header */}
      <div className="bg-[#1a3557] text-white px-4 py-2.5 flex items-center gap-3">
        <button onClick={() => setCollapsed((v) => !v)}>
          <Icon name={collapsed ? "ChevronRight" : "ChevronDown"} size={13} className="text-white/60" />
        </button>
        <input
          value={launch.name}
          onChange={(e) => u("name", e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none font-semibold text-sm placeholder:text-white/40 focus:bg-white/10 rounded px-1"
          placeholder="Название запуска"
        />
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span>Цель:</span>
          <input
            value={launch.goalRevenue}
            onChange={(e) => u("goalRevenue", e.target.value)}
            placeholder="0 ₽"
            className="bg-transparent border-0 outline-none text-white/80 font-mono w-28 focus:bg-white/10 rounded px-1 text-right text-xs"
          />
        </div>
        <button onClick={onRemove} className="text-white/30 hover:text-red-300 transition-colors">
          <Icon name="Trash2" size={14} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Sub-tabs */}
          <div className="flex border-b border-border bg-muted/20 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${section === s.key ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Icon name={s.icon} size={12} />
                {s.label}
              </button>
            ))}
          </div>

          {/* ── ПЛАН ЗАПУСКА ── */}
          {section === "plan" && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Этапы запуска: даты, что делаем, план результата</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <TH ch="#" cls="w-8 text-muted-foreground" />
                      <TH ch="Дата" cls="w-32 text-muted-foreground" />
                      <TH ch="Этап воронки / что делаем" cls="min-w-64 text-muted-foreground" />
                      <TH ch="План / цель" cls="min-w-40 text-blue-600 dark:text-blue-400" />
                      <TH ch="" cls="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {launch.planRows.map((row, i) => (
                      <tr key={row.id} className={`group/r ${i % 2 === 0 ? "bg-background" : "bg-muted/10"} hover:bg-accent/20`}>
                        <TD ch={<span className="text-muted-foreground/30 px-2">{i + 1}</span>} />
                        <TD ch={<In value={row.date} onChange={(v) => updatePlan(row.id, "date", v)} placeholder="дд.мм — дд.мм" />} />
                        <TD ch={<In value={row.stage} onChange={(v) => updatePlan(row.id, "stage", v)} placeholder="Описание этапа…" />} />
                        <TD ch={<PlanIn value={row.plan} onChange={(v) => updatePlan(row.id, "plan", v)} placeholder="план…" />} />
                        <TD ch={
                          <button onClick={() => removePlan(row.id)} className="opacity-0 group-hover/r:opacity-40 hover:!opacity-100 transition-opacity text-red-400 px-1">
                            <Icon name="X" size={10} />
                          </button>
                        } />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addPlan} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Plus" size={11} /> добавить этап
              </button>
            </div>
          )}

          {/* ── ДЕКОМПОЗИЦИЯ РЕГИСТРАЦИЙ ── */}
          {section === "regs" && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Откуда придут регистрации — источник, план, факт</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <TH ch="Откуда?" cls="min-w-40 text-muted-foreground" />
                        <TH ch={<span className="text-blue-600 dark:text-blue-400">Сколько? (план)</span>} cls="w-32" />
                        <TH ch="Факт?" cls="w-32 text-muted-foreground" />
                        <TH ch="" cls="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {launch.regRows.map((row, i) => (
                        <tr key={row.id} className={`group/r ${i % 2 === 0 ? "bg-background" : "bg-muted/10"} hover:bg-accent/20`}>
                          <TD ch={<In value={row.source} onChange={(v) => updateReg(row.id, "source", v)} placeholder="Источник…" />} />
                          <TD ch={<PlanIn value={row.plan} onChange={(v) => updateReg(row.id, "plan", v)} />} />
                          <TD ch={<FactIn value={row.fact} onChange={(v) => updateReg(row.id, "fact", v)} />} />
                          <TD ch={
                            <button onClick={() => removeReg(row.id)} className="opacity-0 group-hover/r:opacity-40 hover:!opacity-100 transition-opacity text-red-400 px-1">
                              <Icon name="X" size={10} />
                            </button>
                          } />
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-2 py-1.5 text-xs">Итого</td>
                        <td className="px-2 py-1.5 text-right text-xs font-mono text-blue-700 dark:text-blue-300">{planTotal > 0 ? planTotal.toLocaleString("ru") : "—"}</td>
                        <td className="px-2 py-1.5 text-right text-xs font-mono">{factTotal > 0 ? factTotal.toLocaleString("ru") : "—"}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded-lg border border-border p-4 bg-muted/10">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Целевые регистрации</p>
                  <input
                    value={launch.regTotal}
                    onChange={(e) => u("regTotal", e.target.value)}
                    placeholder="0"
                    className="text-3xl font-bold bg-transparent border-0 outline-none w-full text-primary focus:bg-accent/30 rounded px-1"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Введите общий план — или он посчитается из строк выше ({planTotal > 0 ? planTotal.toLocaleString("ru") : "0"})</p>
                  <button onClick={addReg} className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    <Icon name="Plus" size={11} /> добавить источник
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ДЕКОМПОЗИЦИЯ ВОРОНКИ ── */}
          {section === "funnel" && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">
                Путь клиента: ключевые показатели воронки от регистрации до оплаты
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-3xl">
                {launch.funnelSteps.map((step) => {
                  const isResult = step.isResult;
                  const isConv = step.isConversion;
                  return (
                    <div
                      key={step.id}
                      className={`group/fs rounded-lg border px-3 py-2 flex items-center gap-2 ${
                        isResult
                          ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                          : isConv
                          ? "border-violet-200 bg-violet-50/40 dark:bg-violet-950/10"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          value={step.label}
                          onChange={(e) => updateFunnelLabel(step.id, e.target.value)}
                          className="bg-transparent border-0 outline-none text-[10px] text-muted-foreground w-full focus:bg-accent/30 rounded px-0.5 mb-0.5"
                        />
                        <input
                          value={step.value}
                          onChange={(e) => updateFunnel(step.id, e.target.value)}
                          placeholder={isConv ? "%" : "0"}
                          className={`bg-transparent border-0 outline-none text-sm font-bold w-full focus:bg-accent/30 rounded px-0.5 ${isResult ? "text-emerald-700 dark:text-emerald-400" : isConv ? "text-violet-700 dark:text-violet-400" : ""}`}
                        />
                      </div>
                      <button
                        onClick={() => removeFunnelStep(step.id)}
                        className="opacity-0 group-hover/fs:opacity-40 hover:!opacity-100 transition-opacity text-red-400 shrink-0"
                      >
                        <Icon name="X" size={10} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={addFunnelStep}
                  className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                  <Icon name="Plus" size={12} /> шаг
                </button>
              </div>
            </div>
          )}

          {/* ── ДЕКОМПОЗИЦИЯ ТРАФИКА ── */}
          {section === "traffic" && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Разбивка трафика по периодам и каналам — бюджет, аудитория, подписчики, окупаемость</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs border-collapse" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="bg-[#1a3557] text-white">
                      <TH ch="Даты" cls="min-w-28 text-white/80" />
                      <TH ch={<span className="text-blue-200">Бюджет</span>} cls="w-32" />
                      <TH ch="Аудитория" cls="w-28 text-white/80" />
                      <TH ch="ЦП (цена)" cls="w-24 text-white/80" />
                      <TH ch="Подписчиков общ." cls="w-32 text-white/80" />
                      <TH ch="Окупаемость план" cls="w-36 text-emerald-300" />
                      <TH ch="" cls="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {launch.trafficRows.map((row, i) => (
                      <tr key={row.id} className={`group/r ${i % 2 === 0 ? "bg-background" : "bg-muted/10"} hover:bg-accent/20`}>
                        <TD ch={<In value={row.dates} onChange={(v) => updateTraffic(row.id, "dates", v)} placeholder="дд — дд мес." />} />
                        <TD ch={<PlanIn value={row.budget} onChange={(v) => updateTraffic(row.id, "budget", v)} />} />
                        <TD ch={<FactIn value={row.audience} onChange={(v) => updateTraffic(row.id, "audience", v)} />} />
                        <TD ch={<FactIn value={row.price} onChange={(v) => updateTraffic(row.id, "price", v)} />} />
                        <TD ch={<FactIn value={row.subsCount} onChange={(v) => updateTraffic(row.id, "subsCount", v)} />} />
                        <TD ch={
                          <input
                            value={row.payback}
                            onChange={(e) => updateTraffic(row.id, "payback", e.target.value)}
                            placeholder="0"
                            className="w-full bg-emerald-50/60 dark:bg-emerald-950/20 border-0 outline-none font-mono px-1.5 py-[3px] text-right focus:bg-emerald-100 rounded text-xs text-emerald-800 dark:text-emerald-300"
                          />
                        } />
                        <TD ch={
                          <button onClick={() => removeTraffic(row.id)} className="opacity-0 group-hover/r:opacity-40 hover:!opacity-100 transition-opacity text-red-400 px-1">
                            <Icon name="X" size={10} />
                          </button>
                        } />
                      </tr>
                    ))}
                    {launch.trafficRows.length > 0 && (() => {
                      const totalBudget = launch.trafficRows.reduce((s, r) =>
                        s + (parseFloat(r.budget.replace(/\s/g, "").replace(",", ".")) || 0), 0);
                      return (
                        <tr className="bg-muted/30 font-semibold">
                          <td className="px-2 py-1.5 text-xs">Итого</td>
                          <td className="px-2 py-1.5 text-right text-xs font-mono text-blue-700 dark:text-blue-300">
                            {totalBudget > 0 ? totalBudget.toLocaleString("ru") + " ₽" : "—"}
                          </td>
                          <td colSpan={5} />
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <button onClick={addTraffic} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Plus" size={11} /> добавить период
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
