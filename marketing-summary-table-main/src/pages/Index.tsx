import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/hooks/useTheme";
import { TabKPI } from "@/components/marketing/TabKPI";
import { TabReport } from "@/components/marketing/TabCampaigns";
import { TabPulse } from "@/components/marketing/TabPulse";
import { TabFunnels } from "@/components/marketing/TabFunnels";
import { TabInfluencers } from "@/components/marketing/TabInfluencers";
import { TabLaunch } from "@/components/marketing/TabLaunch";

const TABS = [
  { id: "pulse",       label: "РНП",        icon: "Activity",       desc: "Рука на Пульсе" },
  { id: "influencers", label: "Инфлюенс",   icon: "Star",           desc: "Блогеры / Reels" },
  { id: "funnels",     label: "Воронки",     icon: "GitBranch",      desc: "Оцифровка пути" },
  { id: "launch",      label: "Запуск",      icon: "Rocket",         desc: "Декомпозиция" },
  { id: "kpi",         label: "Итоги",       icon: "BarChart2",      desc: "Итоги периода" },
  { id: "report",      label: "Отчёт",       icon: "FileText",       desc: "Итоги периода" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("pulse");
  const [title, setTitle] = useState("РНП Маркетинг");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 h-12">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-7 h-7 rounded bg-[#b5f23d] flex items-center justify-center flex-shrink-0">
                <Icon name="Activity" size={14} className="text-black" />
              </div>
              <input
                className="font-semibold text-sm bg-transparent border-0 outline-none focus:bg-muted rounded px-1 py-0.5 min-w-0 w-36 transition-colors text-foreground"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <nav className="flex items-center gap-0.5 overflow-x-auto flex-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="LayoutDashboard" size={13} />
                Дашборд
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground font-medium rounded-md bg-muted transition-colors whitespace-nowrap">
                <Icon name="Table2" size={13} />
                Основное
              </button>
              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="LineChart" size={13} />
                Аналитика
              </button>
              <button
                onClick={() => navigate("/economics")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="Calculator" size={13} />
                Экономика
              </button>
              <button
                onClick={() => navigate("/research")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="Search" size={13} />
                Исследование
              </button>
              <button
                onClick={() => navigate("/content")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="Film" size={13} />
                Контент
              </button>
              <button
                onClick={() => navigate("/data")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Icon name="Database" size={13} />
                Данные
              </button>
            </nav>
            {/* Settings gear — вне nav чтобы дропдаун не обрезался */}
            <div className="relative flex-shrink-0" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  title="Настройки"
                  className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${settingsOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  <Icon name="Settings" size={15} />
                </button>
                {settingsOpen && (
                  <div className="absolute right-0 top-10 w-64 bg-card border border-border rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-xs font-semibold text-foreground">Настройки системы</div>
                    </div>
                    {/* Theme */}
                    <div className="px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon name={dark ? "Moon" : "Sun"} size={14} className="text-muted-foreground" />
                        <span className="text-xs text-foreground">Тема интерфейса</span>
                      </div>
                      <button
                        onClick={toggle}
                        className={`relative w-9 h-5 rounded-full transition-colors ${dark ? "bg-[#b5f23d]/80" : "bg-muted-foreground/30"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dark ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </div>
                    {/* Separator */}
                    <div className="border-t border-border mx-3 my-1" />
                    {/* Future settings placeholder */}
                    <div className="px-3 py-2.5 flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <Icon name="Upload" size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Загрузка данных</span>
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Скоро</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <Icon name="Link" size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Интеграции</span>
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Скоро</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <Icon name="LayoutDashboard" size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Виджеты дашборда</span>
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Скоро</span>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-[#b5f23d] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon name={tab.icon} size={14} className={activeTab === tab.id ? "text-[#b5f23d]" : ""} />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="text-xs font-normal text-muted-foreground hidden sm:inline">{tab.desc}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "pulse"       && <TabPulse />}
        {activeTab === "influencers" && <TabInfluencers />}
        {activeTab === "funnels"     && <TabFunnels />}
        {activeTab === "launch"      && <TabLaunch />}
        {activeTab === "kpi"         && <TabKPI />}
        {activeTab === "report"      && <TabReport />}
      </main>

      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>{title}</span>
          <span>Данные не сохраняются автоматически</span>
        </div>
      </footer>
    </div>
  );
}