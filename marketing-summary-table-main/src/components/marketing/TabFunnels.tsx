import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FunnelStep = {
  id: string;
  label: string;
  plan: string;
  fact: string;
  unit: string;
};

type Funnel = {
  id: string;
  name: string;
  source: string;
  steps: FunnelStep[];
};

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

const FUNNEL_TEMPLATES: Record<string, { source: string; steps: Omit<FunnelStep, "id" | "plan" | "fact">[] }> = {
  "Классическая воронка": {
    source: "",
    steps: [
      { label: "Охват", unit: "чел." },
      { label: "Клики", unit: "шт." },
      { label: "Лиды", unit: "шт." },
      { label: "Квал лиды", unit: "шт." },
      { label: "Продажи", unit: "шт." },
    ],
  },
  "Telegram Посев → АП": {
    source: "Telegram",
    steps: [
      { label: "Охват поста", unit: "чел." },
      { label: "Клики на ссылку", unit: "шт." },
      { label: "Подписчики", unit: "шт." },
      { label: "Заявки в АП", unit: "шт." },
      { label: "Участники АП", unit: "шт." },
      { label: "Продажи", unit: "шт." },
    ],
  },
  "Лид-магнит → Вебинар": {
    source: "Трафик",
    steps: [
      { label: "Показы", unit: "чел." },
      { label: "Клики", unit: "шт." },
      { label: "Регистрации на вебинар", unit: "шт." },
      { label: "Доходимость", unit: "шт." },
      { label: "Заявки с вебинара", unit: "шт." },
      { label: "Продажи", unit: "шт." },
    ],
  },
  "Подписка → Прогрев": {
    source: "Органика",
    steps: [
      { label: "Новые подписчики", unit: "шт." },
      { label: "Открытий писем", unit: "шт." },
      { label: "Переходов на сайт", unit: "шт." },
      { label: "Лиды", unit: "шт." },
      { label: "Продажи", unit: "шт." },
    ],
  },
  "Пустая воронка": {
    source: "",
    steps: [
      { label: "Шаг 1", unit: "шт." },
      { label: "Шаг 2", unit: "шт." },
      { label: "Шаг 3", unit: "шт." },
    ],
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeStep(label: string, unit: string): FunnelStep {
  return { id: `s_${Date.now()}_${Math.random()}`, label, plan: "", fact: "", unit };
}

function makeFunnel(name: string, templateKey: string): Funnel {
  const tpl = FUNNEL_TEMPLATES[templateKey] ?? FUNNEL_TEMPLATES["Пустая воронка"];
  return {
    id: `f_${Date.now()}`,
    name,
    source: tpl.source,
    steps: tpl.steps.map((s) => makeStep(s.label, s.unit)),
  };
}

function cvPct(from: string, to: string): string | null {
  const a = parseFloat(from.replace(/\s/g, "").replace(",", "."));
  const b = parseFloat(to.replace(/\s/g, "").replace(",", "."));
  if (isNaN(a) || isNaN(b) || a === 0) return null;
  return ((b / a) * 100).toFixed(1) + "%";
}

function pctColor(plan: string, fact: string): { label: string; cls: string } | null {
  const p = parseFloat(plan.replace(/\s/g, "").replace(",", "."));
  const f = parseFloat(fact.replace(/\s/g, "").replace(",", "."));
  if (isNaN(p) || isNaN(f) || p === 0) return null;
  const v = Math.round((f / p) * 100);
  const cls = v >= 100 ? "text-emerald-600 font-bold" : v >= 70 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold";
  return { label: `${v}%`, cls };
}

// ─── FUNNEL CARD ──────────────────────────────────────────────────────────────

function FunnelCard({
  funnel,
  onUpdate,
  onRemove,
}: {
  funnel: Funnel;
  onUpdate: (f: Funnel) => void;
  onRemove: () => void;
}) {
  const setName = (name: string) => onUpdate({ ...funnel, name });
  const setSource = (source: string) => onUpdate({ ...funnel, source });

  const updateStep = (sIdx: number, field: keyof FunnelStep, val: string) =>
    onUpdate({
      ...funnel,
      steps: funnel.steps.map((s, i) => i !== sIdx ? s : { ...s, [field]: val }),
    });

  const addStep = () =>
    onUpdate({ ...funnel, steps: [...funnel.steps, makeStep(`Шаг ${funnel.steps.length + 1}`, "шт.")] });

  const removeStep = (sIdx: number) =>
    onUpdate({ ...funnel, steps: funnel.steps.filter((_, i) => i !== sIdx) });

  // bar widths based on fact values
  const facts = funnel.steps.map((s) => parseFloat(s.fact.replace(/\s/g, "").replace(",", ".")) || 0);
  const maxFact = Math.max(...facts, 1);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#1a3557] text-white px-4 py-3 flex items-center gap-3">
        <Icon name="GitBranch" size={14} className="text-blue-300 shrink-0" />
        <input
          value={funnel.name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none font-semibold text-sm placeholder:text-white/40 focus:bg-white/10 rounded px-1"
          placeholder="Название воронки"
        />
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Icon name="ArrowRight" size={11} />
          <input
            value={funnel.source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-transparent border-0 outline-none text-white/70 w-28 focus:bg-white/10 rounded px-1 text-xs"
            placeholder="Источник"
          />
        </div>
        <button
          onClick={onRemove}
          className="text-white/30 hover:text-red-300 transition-colors"
          title="Удалить воронку"
        >
          <Icon name="Trash2" size={14} />
        </button>
      </div>

      {/* Steps table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 560 }}>
          <thead>
            <tr className="bg-muted/40 text-muted-foreground">
              <th className="text-left px-4 py-2 font-medium w-8">#</th>
              <th className="text-left px-3 py-2 font-medium min-w-40">Шаг воронки</th>
              <th className="text-center px-3 py-2 font-medium w-28 text-blue-600 dark:text-blue-400">
                <div className="flex items-center justify-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/40 border border-blue-300" />
                  План
                </div>
              </th>
              <th className="text-center px-3 py-2 font-medium w-28">
                <div className="flex items-center justify-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-white dark:bg-background border border-border" />
                  Факт
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium w-16">%</th>
              <th className="text-center px-2 py-2 font-medium w-20">CV →</th>
              <th className="text-left px-3 py-2 font-medium min-w-32">Визуал</th>
              <th className="w-8 py-2" />
            </tr>
          </thead>
          <tbody>
            {funnel.steps.map((step, sIdx) => {
              const prevFact = sIdx > 0 ? funnel.steps[sIdx - 1].fact : null;
              const cv = prevFact !== null ? cvPct(prevFact, step.fact) : null;
              const pct = pctColor(step.plan, step.fact);
              const barW = maxFact > 0 ? Math.round((facts[sIdx] / maxFact) * 100) : 0;
              const isEven = sIdx % 2 === 0;

              return (
                <tr
                  key={step.id}
                  className={`group/step ${isEven ? "bg-background" : "bg-muted/10"} hover:bg-accent/20 transition-colors`}
                >
                  <td className="px-4 py-1 border-b border-border/30 text-muted-foreground/40">{sIdx + 1}</td>
                  <td className="px-3 py-1 border-b border-border/30">
                    <div className="flex items-center gap-1">
                      <input
                        value={step.label}
                        onChange={(e) => updateStep(sIdx, "label", e.target.value)}
                        className="bg-transparent border-0 outline-none flex-1 focus:bg-accent/40 px-1 py-0.5 rounded"
                        placeholder="Название шага"
                      />
                      <input
                        value={step.unit}
                        onChange={(e) => updateStep(sIdx, "unit", e.target.value)}
                        className="bg-transparent border-0 outline-none w-10 text-muted-foreground/50 focus:bg-accent/40 px-1 rounded text-center"
                        placeholder="шт."
                      />
                    </div>
                  </td>
                  {/* plan */}
                  <td className="px-1.5 py-1 border-b border-border/30">
                    <input
                      value={step.plan}
                      onChange={(e) => updateStep(sIdx, "plan", e.target.value)}
                      placeholder="план"
                      className="w-full bg-blue-50/70 dark:bg-blue-950/20 border-0 outline-none font-mono px-1.5 py-[3px] text-right focus:bg-blue-100 dark:focus:bg-blue-900/30 rounded transition-colors placeholder:text-blue-300/50 text-blue-900 dark:text-blue-200"
                    />
                  </td>
                  {/* fact */}
                  <td className="px-1.5 py-1 border-b border-border/30">
                    <input
                      value={step.fact}
                      onChange={(e) => updateStep(sIdx, "fact", e.target.value)}
                      placeholder="факт"
                      className="w-full bg-white dark:bg-background border-0 outline-none font-mono px-1.5 py-[3px] text-right focus:bg-accent/60 rounded transition-colors placeholder:text-muted-foreground/25"
                    />
                  </td>
                  {/* % выполнения */}
                  <td className="px-2 py-1 border-b border-border/30 text-center">
                    {pct ? (
                      <span className={`font-mono ${pct.cls}`}>{pct.label}</span>
                    ) : (
                      <span className="text-muted-foreground/25">—</span>
                    )}
                  </td>
                  {/* CV → следующий шаг */}
                  <td className="px-2 py-1 border-b border-border/30 text-center">
                    {sIdx === 0 ? (
                      <span className="text-muted-foreground/20">—</span>
                    ) : cv ? (
                      <span className="text-violet-600 dark:text-violet-400 font-mono font-semibold">{cv}</span>
                    ) : (
                      <span className="text-muted-foreground/25">—</span>
                    )}
                  </td>
                  {/* Bar */}
                  <td className="px-3 py-1 border-b border-border/30">
                    <div className="h-4 bg-muted/30 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/40 rounded transition-all duration-300"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </td>
                  {/* Remove step */}
                  <td className="px-1 py-1 border-b border-border/30 text-center">
                    <button
                      onClick={() => removeStep(sIdx)}
                      className="opacity-0 group-hover/step:opacity-40 hover:!opacity-100 transition-opacity text-red-400"
                    >
                      <Icon name="X" size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/30 bg-muted/5 flex items-center justify-between">
        <button
          onClick={addStep}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon name="Plus" size={11} /> добавить шаг
        </button>
        {/* Summary */}
        {funnel.steps.length >= 2 && (() => {
          const first = funnel.steps[0].fact;
          const last = funnel.steps[funnel.steps.length - 1].fact;
          const total = cvPct(first, last);
          return total ? (
            <span className="text-xs text-muted-foreground">
              Общая конверсия воронки: <span className="text-violet-600 dark:text-violet-400 font-semibold">{total}</span>
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function TabFunnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([
    makeFunnel("Основная воронка", "Классическая воронка"),
    makeFunnel("Telegram Посев → АП", "Telegram Посев → АП"),
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTemplate, setNewTemplate] = useState("Классическая воронка");

  const updateFunnel = (id: string, f: Funnel) =>
    setFunnels((fs) => fs.map((ff) => ff.id === id ? f : ff));

  const removeFunnel = (id: string) =>
    setFunnels((fs) => fs.filter((f) => f.id !== id));

  const createFunnel = () => {
    if (!newName.trim()) return;
    setFunnels((fs) => [...fs, makeFunnel(newName.trim(), newTemplate)]);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold">Воронки</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Оцифровка пути клиента — любая воронка, любые шаги
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-12 h-4 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80" />
          Ввод плана
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-12 h-4 rounded bg-white dark:bg-background border border-border" />
          Ввод факта
        </div>
        <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          CV → конверсия между шагами (авто)
        </div>
      </div>

      {/* Funnels */}
      <div className="space-y-5">
        {funnels.map((f) => (
          <FunnelCard
            key={f.id}
            funnel={f}
            onUpdate={(updated) => updateFunnel(f.id, updated)}
            onRemove={() => removeFunnel(f.id)}
          />
        ))}
      </div>

      {/* Add funnel */}
      <div className="mt-5">
        {showAdd ? (
          <div className="border border-border rounded-lg p-4 bg-card shadow-sm max-w-xl">
            <p className="text-sm font-semibold mb-3">Новая воронка</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFunnel()}
                  placeholder="Например: Лид-магнит → Продажа"
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Шаблон</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(FUNNEL_TEMPLATES).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewTemplate(t)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${newTemplate === t ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={createFunnel}
                  disabled={!newName.trim()}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Создать
                </button>
                <button
                  onClick={() => { setShowAdd(false); setNewName(""); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Icon name="Plus" size={14} /> Добавить воронку
          </button>
        )}
      </div>
    </div>
  );
}
