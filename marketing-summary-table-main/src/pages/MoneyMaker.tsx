import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
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
    { path: "/money",     label: "Money Maker",  icon: "Coins" },
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
type Stage = "idea" | "test" | "scale" | "factory" | "stop";

interface Profile {
  skills: string;
  assets: string;
  budget: number;      // ₽ на старт
  hours: number;       // часов в неделю
  city: string;
}

interface Idea {
  id: string;
  name: string;
  channel: string;
  model: string;       // как зарабатываем
  stage: Stage;
  startCost: number;   // ₽ до первой продажи
  daysToMoney: number; // дней до первых денег
  margin: number;      // % маржи
  ai: number;          // 1–5 насколько ИИ ускоряет
  competition: number; // 1–5 (5 — красный океан)
  notes: string;
}

interface TestCalc {
  price: number;
  cost: number;        // себестоимость / закупка на заводе
  delivery: number;    // логистика + упаковка на единицу
  listings: number;    // объявлений / креативов в тесте
  adPerListing: number;
  views: number;       // просмотров на объявление
  ctrContact: number;  // % просмотр → контакт
  crSale: number;      // % контакт → продажа
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const LS_KEY = "money-maker-v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${LS_KEY}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(`${LS_KEY}:${key}`, JSON.stringify(value));
    } catch {
      /* storage недоступен — работаем в памяти */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: Profile = {
  skills: "маркетинг, РНП, воронки, работа с блогерами, контент",
  assets: "дашборд РНП, опыт запусков, доступ к ИИ-инструментам",
  budget: 50000,
  hours: 15,
  city: "Москва",
};

const SEED_IDEAS: Idea[] = [
  { id: "s1", name: "Мебель под заказ на Авито (ИИ-рендеры → завод)", channel: "Авито", model: "Товар без склада: продаём по рендеру, предоплата → заказ на фабрике", stage: "idea", startCost: 15000, daysToMoney: 10, margin: 35, ai: 5, competition: 3, notes: "Шкафы/кухни/столы из массива. Рендер в интерьере за 5 минут, 30–50 объявлений, мерим контакты/просмотры." },
  { id: "s2", name: "ИИ-контент для селлеров WB/Ozon", channel: "Telegram / холодные", model: "Услуга: инфографика + ИИ-видео для карточек, пакет 10–30 тыс ₽", stage: "idea", startCost: 3000, daysToMoney: 7, margin: 80, ai: 5, competition: 3, notes: "Портфолио из 5 карточек конкурентов «до/после». Пишем селлерам с плохими карточками и большим оборотом." },
  { id: "s3", name: "РНП-дашборд как сервис для онлайн-школ", channel: "Telegram / нетворкинг", model: "Продаём свой продукт: внедрение 30–80 тыс ₽ + подписка", stage: "idea", startCost: 5000, daysToMoney: 14, margin: 85, ai: 3, competition: 2, notes: "У тебя уже есть продукт — этот дашборд. Упаковать кейс, 20 касаний продюсерам в неделю." },
  { id: "s4", name: "ИИ-аватары / UGC-ролики для локального бизнеса", channel: "Reels / Авито услуги", model: "Пакет 8 роликов в месяц, 15–40 тыс ₽", stage: "idea", startCost: 5000, daysToMoney: 10, margin: 75, ai: 5, competition: 3, notes: "Стоматологии, салоны, застройщики. Демо-ролик на их бренде как оффер." },
  { id: "s5", name: "Перепродажа трендовых товаров из Китая (1688) на Авито", channel: "Авито", model: "Тест спроса объявлениями до закупки, потом малая партия", stage: "idea", startCost: 30000, daysToMoney: 21, margin: 40, ai: 4, competition: 4, notes: "Тестить 10 SKU объявлениями без товара, закупать только то, что дало контакты." },
  { id: "s6", name: "Telegram-канал в нише + продажа рекламы", channel: "Telegram", model: "ИИ-контент, закупка подписчиков посевами, монетизация рекламой", stage: "idea", startCost: 40000, daysToMoney: 45, margin: 60, ai: 5, competition: 4, notes: "Медленнее, но актив. Брать нишу с дорогой рекламой (недвижимость, финансы, B2B)." },
  { id: "s7", name: "Лидогенерация для подрядчиков (ремонт, окна, бани)", channel: "Авито / Директ", model: "Продаём заявки по 500–2000 ₽ или % со сделки", stage: "idea", startCost: 20000, daysToMoney: 14, margin: 50, ai: 4, competition: 3, notes: "Свои объявления/лендинги, заявки отдаём партнёрам. Воронки и РНП — твоя сильная сторона." },
  { id: "s8", name: "Цифровые шаблоны: Notion/таблицы/РНП для маркетологов", channel: "Telegram / Boosty / маркетплейсы", model: "Инфопродукт 990–4990 ₽", stage: "idea", startCost: 2000, daysToMoney: 10, margin: 95, ai: 4, competition: 3, notes: "Нарезать дашборд на шаблоны, продавать через свой контент и посевы." },
];

const DEFAULT_TEST: TestCalc = {
  price: 45000, cost: 26000, delivery: 3000,
  listings: 30, adPerListing: 500,
  views: 150, ctrContact: 2, crSale: 4,
};

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "idea",    label: "Идея",         color: "bg-muted text-muted-foreground" },
  { id: "test",    label: "Тест",         color: "bg-blue-500/15 text-blue-500" },
  { id: "scale",   label: "Масштаб",      color: "bg-[#b5f23d]/20 text-[#7fae1c] dark:text-[#b5f23d]" },
  { id: "factory", label: "Производство", color: "bg-purple-500/15 text-purple-500" },
  { id: "stop",    label: "Стоп",         color: "bg-red-500/15 text-red-500" },
];

// ─── Calculations ─────────────────────────────────────────────────────────────
// 0–100: чем быстрее деньги, выше маржа, дешевле вход, сильнее ИИ-рычаг и ниже конкуренция — тем выше
function scoreIdea(i: Idea, budget: number) {
  const speed  = Math.max(0, 1 - i.daysToMoney / 60);
  const margin = Math.min(1, Math.max(0, i.margin / 100));
  const cost   = budget > 0 ? Math.max(0, 1 - i.startCost / budget) : 0;
  const ai     = (i.ai - 1) / 4;
  const comp   = 1 - (i.competition - 1) / 4;
  return Math.round((speed * 0.3 + margin * 0.2 + cost * 0.2 + ai * 0.15 + comp * 0.15) * 100);
}

function calcTest(t: TestCalc) {
  const adSpend   = t.listings * t.adPerListing;
  const views     = t.listings * t.views;
  const contacts  = views * (t.ctrContact / 100);
  const sales     = contacts * (t.crSale / 100);
  const unitProfit = t.price - t.cost - t.delivery;
  const gross     = sales * unitProfit;
  const profit    = gross - adSpend;
  const cpl       = contacts > 0 ? adSpend / contacts : 0;
  const cac       = sales > 0 ? adSpend / sales : 0;
  const romi      = adSpend > 0 ? (profit / adSpend) * 100 : 0;
  const maxCac    = unitProfit;
  const verdict: { label: string; tone: "good" | "mid" | "bad"; text: string } =
    sales < 1
      ? { label: "СТОП / ПЕРЕУПАКОВКА", tone: "bad", text: "Тест не даёт продаж. Меняй оффер, фото или цену — не масштабируй." }
      : cac > maxCac
      ? { label: "ДОРАБОТАТЬ", tone: "mid", text: "Продажи есть, но привлечение съедает маржу. Поднимай конверсию в контакт и цену." }
      : romi >= 100
      ? { label: "МАСШТАБ", tone: "good", text: "Окупается ×2+. Удваивай объявления/города, договаривайся с заводом об объёме." }
      : { label: "ОСТОРОЖНЫЙ МАСШТАБ", tone: "mid", text: "В плюсе, но запас тонкий. +50% объявлений и параллельно режь себестоимость." };
  return { adSpend, views, contacts, sales, unitProfit, gross, profit, cpl, cac, romi, maxCac, verdict };
}

// ─── Prompts ──────────────────────────────────────────────────────────────────
function buildPrompts(idea: Idea, p: Profile) {
  const ctx = `Контекст обо мне: навыки — ${p.skills}; активы — ${p.assets}; бюджет на старт — ${p.budget.toLocaleString("ru-RU")} ₽; время — ${p.hours} ч/нед; город — ${p.city}.`;
  return [
    {
      title: "1. Проверка ниши и спроса",
      icon: "Search",
      text: `${ctx}\n\nИдея: «${idea.name}». Модель: ${idea.model}. Канал: ${idea.channel}.\n\nДействуй как маркетолог-аналитик. Дай:\n1) 5 самых востребованных подкатегорий/SKU в этой нише сейчас и почему;\n2) как проверить спрос за 48 часов без вложений (конкретные поисковые запросы, фильтры Авито/WB, Wordstat);\n3) типичный чек, маржу и сезонность;\n4) 3 главных риска и как их закрыть;\n5) критерии «стоп/масштаб» в цифрах для теста за 7 дней.`,
    },
    {
      title: "2. Объявления / офферы (30 вариантов для теста)",
      icon: "FileText",
      text: `${ctx}\n\nСгенерируй 30 разных заголовков и 10 текстов объявлений для «${idea.name}» на площадке ${idea.channel}. Разные углы: цена, срок, качество, гарантия, индивидуальность, соцдоказательство, срочность. Каждый текст до 900 знаков, с триггером к контакту в конце. Оформи таблицей: угол | заголовок | текст.`,
    },
    {
      title: "3. ИИ-визуал (рендеры / креативы)",
      icon: "Image",
      text: `Сделай 10 промптов для генерации фотореалистичных изображений (Midjourney / Flux / GPT-image) для «${idea.name}». Для каждого: объект, материал, интерьер/сцена, свет, ракурс, стиль съёмки «как фото с телефона для Авито» и «как студийная съёмка». Добавь негативные промпты, чтобы не было артефактов. Формат: английский промпт + пояснение на русском.`,
    },
    {
      title: "4. Поиск и переговоры с заводом / подрядчиком",
      icon: "Factory",
      text: `${ctx}\n\nНапиши: 1) где искать производителя/подрядчика для «${idea.name}» (площадки, запросы, фильтры); 2) первое сообщение на 500 знаков с запросом прайса, сроков, MOQ, возможности работать под заказ без склада; 3) 10 вопросов для проверки надёжности; 4) как договориться об отсрочке/работе по предоплате клиента.`,
    },
    {
      title: "5. Скрипт продаж и ответы на возражения",
      icon: "MessageCircle",
      text: `Напиши скрипт переписки для «${idea.name}» от первого сообщения клиента до предоплаты. Включи: квалификацию за 3 вопроса, презентацию в 3 предложениях, 8 частых возражений («дорого», «подумаю», «а гарантии?», «почему так долго?» и др.) с ответами, закрытие на предоплату 30–50%.`,
    },
    {
      title: "6. Контент-завод: Reels / Shorts",
      icon: "Film",
      text: `${ctx}\n\nСделай контент-план на 14 дней для продвижения «${idea.name}»: 14 сценариев коротких видео (хук 2 сек, суть, CTA), какие можно сделать полностью ИИ (аватар, генерация видео), а какие снять на телефон. Плюс 5 идей для посевов у блогеров с бюджетом до ${Math.round(p.budget * 0.2).toLocaleString("ru-RU")} ₽.`,
    },
  ];
}

const SPRINT = [
  { day: "День 1", task: "Выбрать 1 темку с лучшим скором. Промпт №1 — проверка ниши. Найти 10 конкурентов, выписать цены и офферы." },
  { day: "День 2", task: "Промпты №3 и №2: 20–30 ИИ-визуалов и 30 вариантов объявлений. Цена — чуть ниже медианы рынка." },
  { day: "День 3", task: "Запуск: 20–50 объявлений / креативов с разными углами. Завести таблицу: просмотры, контакты, продажи по каждому." },
  { day: "День 4", task: "Промпт №4: написать 10 производителям/подрядчикам. Получить прайс, сроки, MOQ. Обновить себестоимость в калькуляторе." },
  { day: "День 5", task: "Промпт №5: отвечать по скрипту, брать предоплату. Выключить 50% объявлений с худшей конверсией, размножить лучшие." },
  { day: "День 6", task: "Внести реальные цифры в «Тест-калькулятор». Смотрим CAC против прибыли с единицы." },
  { day: "День 7", task: "Решение по вердикту: МАСШТАБ → x2 объявлений, новые города, договор с заводом. СТОП → следующая темка из списка." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, suffix = "") {
  if (isNaN(n) || !isFinite(n)) return "—";
  return Math.round(n).toLocaleString("ru-RU") + suffix;
}

function NumInput({ label, value, onChange, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
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
          <span className="px-2 text-xs text-muted-foreground bg-card border-l border-border shrink-0">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  const cls = "w-full px-2 py-1.5 text-sm text-foreground bg-muted border border-border rounded-md outline-none focus:border-[#b5f23d]/50 transition-colors";
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {multiline
        ? <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} resize-y`} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold font-mono mt-0.5 ${accent ? "text-[#7fae1c] dark:text-[#b5f23d]" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function scoreColor(s: number) {
  if (s >= 70) return "bg-[#b5f23d] text-black";
  if (s >= 50) return "bg-amber-400/80 text-black";
  return "bg-muted text-muted-foreground";
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const MM_TABS = [
  { id: "ideas",   label: "Темки",            icon: "Lightbulb" },
  { id: "test",    label: "Тест-калькулятор", icon: "FlaskConical" },
  { id: "prompts", label: "ИИ-промпты",       icon: "Sparkles" },
  { id: "sprint",  label: "Спринт 7 дней",    icon: "Timer" },
  { id: "profile", label: "Профиль",          icon: "User" },
] as const;
type MmTabId = typeof MM_TABS[number]["id"];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MoneyMaker() {
  const [activeTab, setActiveTab] = useState<MmTabId>("ideas");
  const [profile, setProfile]     = usePersisted<Profile>("profile", DEFAULT_PROFILE);
  const [ideas, setIdeas]         = usePersisted<Idea[]>("ideas", SEED_IDEAS);
  const [test, setTest]           = usePersisted<TestCalc>("test", DEFAULT_TEST);
  const [sprintDone, setSprintDone] = usePersisted<boolean[]>("sprint", SPRINT.map(() => false));
  const [selectedId, setSelectedId] = useState<string>(ideas[0]?.id ?? "");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [copied, setCopied]       = useState<number | null>(null);

  const ranked = useMemo(
    () => ideas
      .map((i) => ({ ...i, score: scoreIdea(i, profile.budget) }))
      .sort((a, b) => b.score - a.score),
    [ideas, profile.budget],
  );
  const visible  = stageFilter === "all" ? ranked : ranked.filter((i) => i.stage === stageFilter);
  const selected = ideas.find((i) => i.id === selectedId) ?? ranked[0];
  const t        = calcTest(test);
  const prompts  = selected ? buildPrompts(selected, profile) : [];

  function updateIdea(id: string, patch: Partial<Idea>) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function addIdea() {
    const id = `u${Date.now()}`;
    setIdeas((prev) => [...prev, {
      id, name: "Новая темка", channel: "Авито", model: "", stage: "idea",
      startCost: 10000, daysToMoney: 14, margin: 40, ai: 3, competition: 3, notes: "",
    }]);
    setSelectedId(id);
  }

  function removeIdea(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  }

  async function copy(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard недоступен */
    }
  }

  const sprintProgress = Math.round((sprintDone.filter(Boolean).length / SPRINT.length) * 100);

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
              <span className="text-xs text-muted-foreground hidden sm:block">Money Maker</span>
            </div>
            <div className="flex items-center gap-1"><TopNav active="/money" /><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {MM_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-[#b5f23d] text-[#b5f23d]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon name={tab.icon as "Activity"} size={14} className={activeTab === tab.id ? "text-[#b5f23d]" : ""} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">

        {/* Цикл */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-5">
          {["ИИ генерит контент", "Быстрый тест спроса", "Цифры → вердикт", "Масштаб", "Заказ на заводе"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-card border border-border text-foreground">{s}</span>
              {i < arr.length - 1 && <Icon name="ArrowRight" size={12} />}
            </span>
          ))}
        </div>

        {/* ── Ideas ─────────────────────────────────────────────────────────── */}
        {activeTab === "ideas" && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground mr-2">Темки по скору</span>
                {(["all", ...STAGES.map((s) => s.id)] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStageFilter(s)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${stageFilter === s ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {s === "all" ? "Все" : STAGES.find((x) => x.id === s)!.label}
                  </button>
                ))}
                <button onClick={addIdea} className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#b5f23d] text-black font-medium">
                  <Icon name="Plus" size={12} /> Темка
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left px-4 py-2 font-medium">Скор</th>
                      <th className="text-left px-2 py-2 font-medium">Темка</th>
                      <th className="text-left px-2 py-2 font-medium">Этап</th>
                      <th className="text-right px-2 py-2 font-medium">Вход</th>
                      <th className="text-right px-2 py-2 font-medium">До ₽</th>
                      <th className="text-right px-4 py-2 font-medium">Маржа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((i) => {
                      const st = STAGES.find((s) => s.id === i.stage)!;
                      return (
                        <tr
                          key={i.id}
                          onClick={() => setSelectedId(i.id)}
                          className={`border-b border-border last:border-0 cursor-pointer transition-colors ${selected?.id === i.id ? "bg-muted" : "hover:bg-muted/50"}`}
                        >
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex w-9 justify-center py-0.5 rounded-md text-xs font-bold font-mono ${scoreColor(i.score)}`}>{i.score}</span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="text-foreground font-medium">{i.name}</div>
                            <div className="text-xs text-muted-foreground">{i.channel}</div>
                          </td>
                          <td className="px-2 py-2.5"><span className={`px-2 py-0.5 rounded-md text-xs ${st.color}`}>{st.label}</span></td>
                          <td className="px-2 py-2.5 text-right font-mono text-xs">{fmt(i.startCost, " ₽")}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-xs">{i.daysToMoney} дн</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{i.margin}%</td>
                        </tr>
                      );
                    })}
                    {visible.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">Нет темок на этом этапе</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selected && (
              <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 h-fit">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Карточка темки</span>
                  <button onClick={() => removeIdea(selected.id)} title="Удалить" className="text-muted-foreground hover:text-red-500">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
                <TextInput label="Название" value={selected.name} onChange={(v) => updateIdea(selected.id, { name: v })} />
                <TextInput label="Канал" value={selected.channel} onChange={(v) => updateIdea(selected.id, { channel: v })} />
                <TextInput label="Модель заработка" value={selected.model} onChange={(v) => updateIdea(selected.id, { model: v })} multiline />
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-muted-foreground">Этап</label>
                  <div className="flex flex-wrap gap-1">
                    {STAGES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateIdea(selected.id, { stage: s.id })}
                        className={`px-2 py-1 rounded-md text-xs transition-opacity ${s.color} ${selected.stage === s.id ? "ring-1 ring-foreground/30" : "opacity-50 hover:opacity-100"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="Вход до 1-й продажи" value={selected.startCost} suffix="₽" onChange={(v) => updateIdea(selected.id, { startCost: v })} />
                  <NumInput label="Дней до денег" value={selected.daysToMoney} suffix="дн" onChange={(v) => updateIdea(selected.id, { daysToMoney: v })} />
                  <NumInput label="Маржа" value={selected.margin} suffix="%" onChange={(v) => updateIdea(selected.id, { margin: v })} />
                  <NumInput label="ИИ-рычаг 1–5" value={selected.ai} onChange={(v) => updateIdea(selected.id, { ai: Math.min(5, Math.max(1, v)) })} />
                  <NumInput label="Конкуренция 1–5" value={selected.competition} onChange={(v) => updateIdea(selected.id, { competition: Math.min(5, Math.max(1, v)) })} />
                </div>
                <TextInput label="Заметки / гипотеза" value={selected.notes} onChange={(v) => updateIdea(selected.id, { notes: v })} multiline />
                <button
                  onClick={() => setActiveTab("prompts")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md bg-[#b5f23d] text-black font-medium"
                >
                  <Icon name="Sparkles" size={13} /> ИИ-промпты для этой темки
                </button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Скор = скорость до денег 30% · маржа 20% · вход vs твой бюджет 20% · ИИ-рычаг 15% · низкая конкуренция 15%.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Test calculator ───────────────────────────────────────────────── */}
        {activeTab === "test" && (
          <div className="grid lg:grid-cols-[340px_1fr] gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 h-fit">
              <span className="text-sm font-semibold text-foreground">Вводные теста</span>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="Цена продажи" value={test.price} suffix="₽" onChange={(v) => setTest({ ...test, price: v })} />
                <NumInput label="Себестоимость (завод)" value={test.cost} suffix="₽" onChange={(v) => setTest({ ...test, cost: v })} />
                <NumInput label="Логистика / ед." value={test.delivery} suffix="₽" onChange={(v) => setTest({ ...test, delivery: v })} />
                <NumInput label="Объявлений" value={test.listings} onChange={(v) => setTest({ ...test, listings: v })} />
                <NumInput label="Продвижение / объявл." value={test.adPerListing} suffix="₽" onChange={(v) => setTest({ ...test, adPerListing: v })} />
                <NumInput label="Просмотров / объявл." value={test.views} onChange={(v) => setTest({ ...test, views: v })} />
                <NumInput label="Просмотр → контакт" value={test.ctrContact} suffix="%" onChange={(v) => setTest({ ...test, ctrContact: v })} />
                <NumInput label="Контакт → продажа" value={test.crSale} suffix="%" onChange={(v) => setTest({ ...test, crSale: v })} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Подставь реальные цифры после 3–5 дней теста. Пока нет данных — бенчмарк Авито: 2–4% в контакт, 5–15% контактов в продажу.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className={`rounded-xl p-4 border ${
                t.verdict.tone === "good" ? "bg-[#b5f23d]/15 border-[#b5f23d]/40"
                : t.verdict.tone === "mid" ? "bg-amber-400/10 border-amber-400/40"
                : "bg-red-500/10 border-red-500/40"
              }`}>
                <div className="text-xs text-muted-foreground">Вердикт</div>
                <div className="text-xl font-bold text-foreground mt-0.5">{t.verdict.label}</div>
                <div className="text-sm text-foreground/80 mt-1">{t.verdict.text}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Бюджет теста" value={fmt(t.adSpend, " ₽")} />
                <Stat label="Контактов" value={fmt(t.contacts)} />
                <Stat label="Продаж" value={t.sales.toFixed(1)} />
                <Stat label="Чистая прибыль" value={fmt(t.profit, " ₽")} accent={t.profit > 0} />
                <Stat label="Цена контакта (CPL)" value={fmt(t.cpl, " ₽")} />
                <Stat label="Цена продажи (CAC)" value={fmt(t.cac, " ₽")} />
                <Stat label="Макс. допустимый CAC" value={fmt(t.maxCac, " ₽")} />
                <Stat label="ROMI" value={fmt(t.romi, "%")} accent={t.romi >= 100} />
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Модель «продай → закажи»: </span>
                берёшь предоплату 30–50% с клиента, и только после этого размещаешь заказ на заводе. Деньги на производство
                даёт клиент, твой риск — только бюджет теста ({fmt(t.adSpend, " ₽")}).
              </div>
            </div>
          </div>
        )}

        {/* ── Prompts ───────────────────────────────────────────────────────── */}
        {activeTab === "prompts" && selected && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Темка:</span>
              <select
                value={selected.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-2 py-1.5 text-sm bg-card border border-border rounded-md text-foreground outline-none"
              >
                {ranked.map((i) => <option key={i.id} value={i.id}>{i.score} · {i.name}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">Скопируй и вставь в Claude / ChatGPT / генератор картинок. Профиль подставляется автоматически.</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {prompts.map((pr, idx) => (
                <div key={pr.title} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon name={pr.icon as "Activity"} size={14} className="text-[#b5f23d]" />
                      {pr.title}
                    </span>
                    <button
                      onClick={() => copy(pr.text, idx)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/70 text-foreground"
                    >
                      <Icon name={copied === idx ? "Check" : "Copy"} size={12} />
                      {copied === idx ? "Скопировано" : "Копировать"}
                    </button>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">{pr.text}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sprint ────────────────────────────────────────────────────────── */}
        {activeTab === "sprint" && (
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Спринт: от идеи до первых денег</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#b5f23d] transition-all" style={{ width: `${sprintProgress}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{sprintProgress}%</span>
              <button onClick={() => setSprintDone(SPRINT.map(() => false))} className="text-xs text-muted-foreground hover:text-foreground">Сброс</button>
            </div>
            {SPRINT.map((s, idx) => (
              <label
                key={s.day}
                className={`flex gap-3 items-start bg-card border border-border rounded-xl p-3 cursor-pointer transition-opacity ${sprintDone[idx] ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={!!sprintDone[idx]}
                  onChange={() => setSprintDone(sprintDone.map((d, i) => (i === idx ? !d : d)))}
                  className="mt-1 accent-[#b5f23d]"
                />
                <div>
                  <div className="text-xs font-semibold text-[#7fae1c] dark:text-[#b5f23d]">{s.day}</div>
                  <div className={`text-sm text-foreground ${sprintDone[idx] ? "line-through" : ""}`}>{s.task}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* ── Profile ───────────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="max-w-xl bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">Чем ты занимаешься — от этого строятся темки и промпты</span>
            <TextInput label="Навыки" value={profile.skills} onChange={(v) => setProfile({ ...profile, skills: v })} multiline />
            <TextInput label="Активы (аудитория, аккаунты, продукты, связи)" value={profile.assets} onChange={(v) => setProfile({ ...profile, assets: v })} multiline />
            <div className="grid grid-cols-3 gap-2">
              <NumInput label="Бюджет на старт" value={profile.budget} suffix="₽" onChange={(v) => setProfile({ ...profile, budget: v })} />
              <NumInput label="Часов в неделю" value={profile.hours} onChange={(v) => setProfile({ ...profile, hours: v })} />
              <TextInput label="Город" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
            </div>
            <button
              onClick={() => { setIdeas(SEED_IDEAS); setSelectedId(SEED_IDEAS[0].id); }}
              className="self-start text-xs text-muted-foreground hover:text-foreground underline"
            >
              Сбросить темки к стартовому списку
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
