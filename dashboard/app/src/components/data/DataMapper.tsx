import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RnpField = {
  key: string;
  label: string;
  group: string;
  hint?: string;
};

export type ColumnMapping = Record<string, string>; // importColumn → rnpFieldKey

export type MappingResult = {
  mapping: ColumnMapping;
  aggregated: Record<string, number | string>;
};

// ─── РНП FIELDS REGISTRY ──────────────────────────────────────────────────────

export const RNP_FIELDS: RnpField[] = [
  // Регистрации
  { key: "reg_instagram",    label: "Рег. Инстаграм сторис",    group: "Регистрации" },
  { key: "reg_tg_channel",   label: "Рег. Телеграм канал",      group: "Регистрации" },
  { key: "reg_tg_bot",       label: "Рег. Телеграм бот",        group: "Регистрации" },
  { key: "reg_vk",           label: "Рег. ВК блог/база",        group: "Регистрации" },
  { key: "reg_tg_spam",      label: "Рег. Спам ТГ",             group: "Регистрации" },
  { key: "reg_wa",           label: "Рег. ВотсАп спам",         group: "Регистрации" },
  { key: "reg_sms",          label: "Рег. СМС",                 group: "Регистрации" },
  { key: "reg_bloggers",     label: "Рег. Покупка блогеры",     group: "Регистрации" },
  { key: "reg_total",        label: "Регистраций всего",        group: "Регистрации" },
  // Воронка
  { key: "reach",            label: "Охваты",                   group: "Воронка" },
  { key: "webinar_attended", label: "Были на вебинаре",         group: "Воронка" },
  { key: "peak",             label: "Пик",                      group: "Воронка" },
  { key: "banner_clicks",    label: "Нажали баннер",            group: "Воронка" },
  { key: "leads",            label: "Заявок",                   group: "Воронка" },
  { key: "paid",             label: "Оплат (шт.)",              group: "Воронка" },
  { key: "avg_check",        label: "Средний чек",              group: "Воронка" },
  { key: "revenue",          label: "Сумма оплат",              group: "Воронка" },
  // Трафик
  { key: "traffic_budget",   label: "Бюджет трафика",           group: "Трафик" },
  { key: "traffic_audience", label: "Аудитория (охват рекл.)",  group: "Трафик" },
  { key: "traffic_price",    label: "Цена подписчика / лида",   group: "Трафик" },
  { key: "subs_count",       label: "Подписчиков всего",        group: "Трафик" },
  { key: "payback",          label: "Окупаемость",              group: "Трафик" },
  // Конверсии
  { key: "cv_reg_reach",     label: "CV рег → охват (%)",       group: "Конверсии", hint: "%" },
  { key: "cv_reach_lead",    label: "CV охват → заявка (%)",    group: "Конверсии", hint: "%" },
  { key: "cv_lead_paid",     label: "CV заявка → оплата (%)",   group: "Конверсии", hint: "%" },
];

const GROUPS = [...new Set(RNP_FIELDS.map((f) => f.group))];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^а-яa-z0-9]/gi, "");
}

// Автоматический подбор поля по имени колонки
function autoMatch(col: string): string {
  const n = normalize(col);
  const RULES: [string[], string][] = [
    [["инстаграм", "instagram", "insta", "сторис", "stories"], "reg_instagram"],
    [["тгканал", "телеграмканал", "tgchannel", "tgканал", "каналтг"], "reg_tg_channel"],
    [["тгбот", "bot", "tlbot", "бот"], "reg_tg_bot"],
    [["вк", "вкблог", "vk", "вконтакте"], "reg_vk"],
    [["спамтг", "tgspam", "спам"], "reg_tg_spam"],
    [["вотсап", "whatsapp", "wa", "ватсап"], "reg_wa"],
    [["смс", "sms"], "reg_sms"],
    [["блогер", "blogger", "покупкаблогер", "influencer"], "reg_bloggers"],
    [["регитого", "региallTotal", "регвсего", "totalreg", "регистрацийвсего", "итого"], "reg_total"],
    [["охват", "reach", "охваты"], "reach"],
    [["вебинар", "webinar", "были"], "webinar_attended"],
    [["пик", "peak"], "peak"],
    [["баннер", "banner", "нажали"], "banner_clicks"],
    [["заявок", "lead", "leads", "заявки"], "leads"],
    [["оплат", "paid", "покупок", "payments"], "paid"],
    [["среднийчек", "avgcheck", "чек", "avgorder"], "avg_check"],
    [["суммаоплат", "revenue", "сумма", "выручка"], "revenue"],
    [["бюджет", "budget", "расход"], "traffic_budget"],
    [["аудитория", "audience"], "traffic_audience"],
    [["ценаподп", "цена", "price", "cpl", "cpc"], "traffic_price"],
    [["подписчиков", "subscribers", "subscount"], "subs_count"],
    [["окупаем", "payback", "roas", "roi"], "payback"],
    [["cvрег", "convreg"], "cv_reg_reach"],
    [["cvохват", "convreach"], "cv_reach_lead"],
    [["cvзаявка", "cvlead"], "cv_lead_paid"],
  ];
  for (const [keys, field] of RULES) {
    if (keys.some((k) => n.includes(k))) return field;
  }
  return "";
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

interface Props {
  importName: string;
  columns: string[];
  rows: Record<string, string>[];
  onApply: (result: MappingResult) => void;
  onClose: () => void;
}

export function DataMapper({ importName, columns, rows, onApply, onClose }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    const m: ColumnMapping = {};
    columns.forEach((col) => {
      const match = autoMatch(col);
      if (match) m[col] = match;
    });
    return m;
  });
  const [aggMode, setAggMode] = useState<"sum" | "last">("sum");
  const [filterGroup, setFilterGroup] = useState<string>("all");

  const setMap = (col: string, field: string) =>
    setMapping((m) => ({ ...m, [col]: field }));

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  // Агрегируем данные из строк по маппингу
  const aggregated = useMemo((): Record<string, number | string> => {
    const result: Record<string, number | string> = {};
    Object.entries(mapping).forEach(([col, fieldKey]) => {
      if (!fieldKey) return;
      const vals = rows.map((r) => {
        const raw = r[col] ?? "";
        return parseFloat(raw.replace(/\s/g, "").replace(",", ".")) || 0;
      });
      result[fieldKey] = aggMode === "sum"
        ? vals.reduce((a, b) => a + b, 0)
        : vals[vals.length - 1] ?? 0;
    });
    return result;
  }, [mapping, rows, aggMode]);

  const visibleCols = filterGroup === "all"
    ? columns
    : columns.filter((col) => {
        const fk = mapping[col];
        const field = RNP_FIELDS.find((f) => f.key === fk);
        return field?.group === filterGroup;
      });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#1a3557] text-white rounded-t-2xl">
          <div>
            <div className="font-semibold text-sm">Маппинг данных → РНП</div>
            <div className="text-xs text-white/50 mt-0.5">«{importName}» · {columns.length} колонок · {rows.length} строк</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Sub-header */}
        <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Zap" size={12} className="text-[#b5f23d]" />
            <span>Авто-распознано: <strong className="text-foreground">{mappedCount}</strong> из {columns.length}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Агрегация:</span>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["sum", "last"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAggMode(m)}
                  className={`px-3 py-1 transition-colors ${aggMode === m ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  {m === "sum" ? "Σ Сумма" : "↓ Последнее"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Group filter */}
          <div className="flex gap-1 flex-wrap mb-4">
            {["all", ...GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  filterGroup === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "all" ? "Все колонки" : g}
              </button>
            ))}
          </div>

          {/* Mapping rows */}
          <div className="flex flex-col gap-2">
            {columns.map((col) => {
              const selectedField = mapping[col] || "";
              const field = RNP_FIELDS.find((f) => f.key === selectedField);
              const sampleVals = rows.slice(0, 3).map((r) => r[col] ?? "").filter(Boolean);
              const isVisible = filterGroup === "all" || (field?.group === filterGroup) || !selectedField;

              if (!isVisible) return null;

              return (
                <div
                  key={col}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                    selectedField ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  {/* Column name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{col}</div>
                    {sampleVals.length > 0 && (
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                        {sampleVals.join(" · ")}
                      </div>
                    )}
                  </div>

                  <Icon name="ArrowRight" size={12} className="text-muted-foreground/40 shrink-0" />

                  {/* РНП field selector */}
                  <select
                    value={selectedField}
                    onChange={(e) => setMap(col, e.target.value)}
                    className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-52 shrink-0"
                  >
                    <option value="">— не использовать —</option>
                    {GROUPS.map((group) => (
                      <optgroup key={group} label={group}>
                        {RNP_FIELDS.filter((f) => f.group === group).map((f) => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Aggregated preview */}
                  {selectedField && aggregated[selectedField] !== undefined && (
                    <div className="text-xs font-mono text-primary font-semibold w-20 text-right shrink-0">
                      {typeof aggregated[selectedField] === "number"
                        ? (aggregated[selectedField] as number).toLocaleString("ru")
                        : aggregated[selectedField]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview of aggregated result */}
          {mappedCount > 0 && (
            <div className="mt-5 rounded-lg border border-[#b5f23d]/30 bg-[#b5f23d]/5 p-4">
              <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                <Icon name="Eye" size={13} className="text-[#b5f23d]" />
                Что попадёт в РНП
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(aggregated).map(([key, val]) => {
                  const field = RNP_FIELDS.find((f) => f.key === key);
                  if (!field) return null;
                  return (
                    <div key={key} className="bg-background rounded-md border border-border px-2.5 py-2">
                      <div className="text-[10px] text-muted-foreground">{field.label}</div>
                      <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {typeof val === "number" ? val.toLocaleString("ru") : val}
                        {field.hint && <span className="text-xs font-normal ml-0.5 text-muted-foreground">{field.hint}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {mappedCount === 0
              ? "Привяжите хотя бы одну колонку"
              : `${mappedCount} полей готовы к применению`}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Отмена
            </button>
            <button
              onClick={() => onApply({ mapping, aggregated })}
              disabled={mappedCount === 0}
              className="px-5 py-2 text-sm rounded-lg bg-[#b5f23d] text-black font-semibold hover:bg-[#a0d930] disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              <Icon name="Zap" size={14} />
              Применить в РНП
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
