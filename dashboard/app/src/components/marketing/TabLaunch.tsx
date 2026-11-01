import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Launch, makeLaunch } from "@/components/launch/LaunchTypes";
import { LaunchCard } from "@/components/launch/LaunchCard";
import { useMappedData } from "@/store/mappedDataStore";

// Маппинг rnp-ключей к полям Launch
const REG_SOURCE_MAP: Record<string, string> = {
  reg_instagram:  "Инст сторис",
  reg_tg_channel: "Телеграм канал",
  reg_tg_bot:     "Телеграм бот",
  reg_vk:         "ВК блог + база",
  reg_tg_spam:    "Спам тг",
  reg_wa:         "Вотс ап спам по базе",
  reg_sms:        "СМС",
  reg_bloggers:   "Покупка блогеры",
};

const FUNNEL_LABEL_MAP: Record<string, string> = {
  reach:            "Средние охваты",
  webinar_attended: "Были на вебинаре",
  peak:             "Пик",
  banner_clicks:    "Нажали на баннер",
  leads:            "Отставили заявку (чел)",
  paid:             "Оплат",
  avg_check:        "Средний чек",
  revenue:          "Сумма оплат",
  cv_reg_reach:     "CV рег → охват",
  cv_reach_lead:    "CV из участника → заявка",
  cv_lead_paid:     "CV заявка → оплата",
};

function applyMappedToLaunch(launch: Launch, values: Record<string, number | string>): Launch {
  const updated = { ...launch };

  // Заполняем regRows (факт)
  updated.regRows = launch.regRows.map((row) => {
    const matchKey = Object.entries(REG_SOURCE_MAP).find(
      ([, label]) => label.toLowerCase() === row.source.toLowerCase()
    )?.[0];
    if (matchKey && values[matchKey] !== undefined) {
      return { ...row, fact: String(values[matchKey]) };
    }
    return row;
  });

  // Заполняем reg_total
  if (values.reg_total !== undefined) {
    updated.regTotal = String(values.reg_total);
  }

  // Заполняем funnelSteps (значение)
  updated.funnelSteps = launch.funnelSteps.map((step) => {
    const matchKey = Object.entries(FUNNEL_LABEL_MAP).find(
      ([, label]) => step.label.toLowerCase().includes(label.toLowerCase().slice(0, 8))
    )?.[0];
    if (matchKey && values[matchKey] !== undefined) {
      return { ...step, value: String(values[matchKey]) };
    }
    return step;
  });

  // Заполняем trafficRows (первая строка)
  if (updated.trafficRows.length > 0) {
    const first = { ...updated.trafficRows[0] };
    if (values.traffic_budget !== undefined) first.budget = String(values.traffic_budget);
    if (values.traffic_audience !== undefined) first.audience = String(values.traffic_audience);
    if (values.traffic_price !== undefined) first.price = String(values.traffic_price);
    if (values.subs_count !== undefined) first.subsCount = String(values.subs_count);
    if (values.payback !== undefined) first.payback = String(values.payback);
    updated.trafficRows = [first, ...updated.trafficRows.slice(1)];
  }

  return updated;
}

export function TabLaunch() {
  const [launches, setLaunches] = useState<Launch[]>([
    makeLaunch("Запуск Март–Апрель 2025"),
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const { values, appliedAt, sourceName, clearMapping } = useMappedData();
  const navigate = useNavigate();

  const hasMappedData = Object.keys(values).length > 0;

  const updateLaunch = (id: string, l: Launch) =>
    setLaunches((ls) => ls.map((ll) => ll.id === id ? l : ll));
  const removeLaunch = (id: string) =>
    setLaunches((ls) => ls.filter((l) => l.id !== id));
  const createLaunch = () => {
    if (!newName.trim()) return;
    setLaunches((ls) => [...ls, makeLaunch(newName.trim())]);
    setNewName("");
    setShowAdd(false);
  };

  const applyToLaunch = (id: string) => {
    setLaunches((ls) => ls.map((l) => l.id === id ? applyMappedToLaunch(l, values) : l));
  };

  const applyToAll = () => {
    setLaunches((ls) => ls.map((l) => applyMappedToLaunch(l, values)));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold">Планирование запуска</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Декомпозиция: план этапов, источники регистраций, воронка, трафик
          </p>
        </div>
        <button
          onClick={() => navigate("/data")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          <Icon name="Database" size={12} />
          Центр данных
        </button>
      </div>

      {/* Баннер с загруженными данными */}
      {hasMappedData && (
        <div className="mb-5 rounded-xl border border-[#b5f23d]/40 bg-[#b5f23d]/5 px-4 py-3 flex items-center gap-3 flex-wrap animate-fade-in">
          <Icon name="Zap" size={15} className="text-[#7aaa1a] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground">
              Данные готовы к применению
              {sourceName && <span className="ml-1 font-normal text-muted-foreground">· «{sourceName}»</span>}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {Object.keys(values).length} полей из импорта ·{" "}
              {appliedAt && new Date(appliedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyToAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#b5f23d] text-black font-semibold hover:bg-[#a0d930] transition-colors"
            >
              <Icon name="Zap" size={12} />
              Применить во все запуски
            </button>
            <button
              onClick={clearMapping}
              className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors px-2"
            >
              <Icon name="X" size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80" />Ввод плана</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white dark:bg-background border border-border" />Ввод факта</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-50 dark:bg-violet-950/20 border border-violet-200" />Конверсия (CV)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300" />Итоговый результат</span>
      </div>

      {launches.map((l) => (
        <div key={l.id}>
          {hasMappedData && (
            <div className="flex justify-end mb-1">
              <button
                onClick={() => applyToLaunch(l.id)}
                className="flex items-center gap-1 text-[11px] text-[#7aaa1a] hover:text-[#5a8a0a] font-medium transition-colors"
              >
                <Icon name="Zap" size={11} />
                Заполнить этот запуск из данных
              </button>
            </div>
          )}
          <LaunchCard
            launch={l}
            onUpdate={(updated) => updateLaunch(l.id, updated)}
            onRemove={() => removeLaunch(l.id)}
          />
        </div>
      ))}

      <div className="mt-2">
        {showAdd ? (
          <div className="border border-border rounded-lg p-4 bg-card shadow-sm max-w-md">
            <p className="text-sm font-semibold mb-3">Новый запуск</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createLaunch()}
              placeholder="Запуск Май 2025"
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-3"
            />
            <div className="flex gap-2">
              <button onClick={createLaunch} disabled={!newName.trim()} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors">
                Создать
              </button>
              <button onClick={() => { setShowAdd(false); setNewName(""); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            <Icon name="Plus" size={14} /> Добавить запуск
          </button>
        )}
      </div>
    </div>
  );
}
