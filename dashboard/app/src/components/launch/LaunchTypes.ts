// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PlanRow = { id: string; date: string; stage: string; plan: string };
export type RegRow = { id: string; source: string; plan: string; fact: string };
export type DecompStep = { id: string; label: string; value: string; isConversion?: boolean; isResult?: boolean };
export type TrafficRow = { id: string; dates: string; budget: string; audience: string; price: string; subsCount: string; payback: string };

export type Launch = {
  id: string;
  name: string;
  goalRevenue: string;
  planRows: PlanRow[];
  regRows: RegRow[];
  regTotal: string;
  funnelSteps: DecompStep[];
  trafficRows: TrafficRow[];
};

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

export const DEFAULT_FUNNEL: Omit<DecompStep, "id">[] = [
  { label: "Кол-во подписчиков / база", value: "" },
  { label: "Средние охваты", value: "" },
  { label: "Регистраций", value: "" },
  { label: "CV рег → охват", value: "", isConversion: true },
  { label: "Доходимость (%)", value: "", isConversion: true },
  { label: "Были на вебинаре", value: "" },
  { label: "Пик", value: "" },
  { label: "Нажали на баннер", value: "" },
  { label: "CV из пика → заявка", value: "", isConversion: true },
  { label: "CV из участника → заявка", value: "", isConversion: true },
  { label: "Отставили заявку (чел)", value: "" },
  { label: "Сумма заказов", value: "" },
  { label: "Оплат", value: "" },
  { label: "CV заявка → оплата", value: "", isConversion: true },
  { label: "Средний чек", value: "" },
  { label: "Сумма оплат", value: "", isResult: true },
  { label: "Предоплат шт", value: "" },
  { label: "Сумма предоплат", value: "" },
  { label: "Вложено в трафик", value: "" },
  { label: "Окупаемость воронки", value: "", isResult: true },
  { label: "Итоговая сумма", value: "", isResult: true },
];

export function makeId() {
  return `_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function makeLaunch(name: string): Launch {
  return {
    id: makeId(),
    name,
    goalRevenue: "",
    planRows: [
      { id: makeId(), date: "", stage: "Автомарафон + база + канал тг + платная реклама 9 марта реги", plan: "Получить анкеты" },
      { id: makeId(), date: "", stage: "Закрытая продажа по анкете предзаписи", plan: "" },
      { id: makeId(), date: "", stage: "Большое мероприятие марафон", plan: "" },
      { id: makeId(), date: "", stage: "Дожим", plan: "" },
    ],
    regRows: [
      { id: makeId(), source: "Инст сторис", plan: "5000", fact: "" },
      { id: makeId(), source: "Телеграм канал", plan: "5000", fact: "" },
      { id: makeId(), source: "Телеграм бот", plan: "1000", fact: "" },
      { id: makeId(), source: "ВК блог + база", plan: "500", fact: "" },
      { id: makeId(), source: "Спам тг", plan: "1000", fact: "" },
      { id: makeId(), source: "Вотс ап спам по базе", plan: "1000", fact: "" },
      { id: makeId(), source: "СМС", plan: "500", fact: "" },
      { id: makeId(), source: "Покупка блогеры", plan: "4000", fact: "" },
    ],
    regTotal: "18000",
    funnelSteps: DEFAULT_FUNNEL.map((s) => ({ ...s, id: makeId() })),
    trafficRows: [
      { id: makeId(), dates: "14-16 марта", budget: "3 000 000", audience: "25000", price: "120", subsCount: "100000", payback: "10 000 000" },
      { id: makeId(), dates: "до 10 апреля", budget: "4 000 000", audience: "33333", price: "120", subsCount: "110000", payback: "" },
    ],
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function sumReg(rows: RegRow[]): number {
  return rows.reduce((s, r) => s + (parseFloat(r.plan.replace(/\s/g, "").replace(",", ".")) || 0), 0);
}

export function sumRegFact(rows: RegRow[]): number {
  return rows.reduce((s, r) => s + (parseFloat(r.fact.replace(/\s/g, "").replace(",", ".")) || 0), 0);
}
