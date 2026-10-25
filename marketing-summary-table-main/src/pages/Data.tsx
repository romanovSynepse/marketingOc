import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/api";
import { DataMapper, MappingResult } from "@/components/data/DataMapper";
import { useMappedData } from "@/store/mappedDataStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataImport {
  id: number;
  name: string;
  source: string;
  status: string;
  row_count: number;
  columns: string[];
  preview: Record<string, string>[];
  raw_data: Record<string, string>[];
  created_at: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function TopNav() {
  const navigate = useNavigate();
  const items = [
    { path: "/dashboard", label: "Дашборд",     icon: "LayoutDashboard" },
    { path: "/",          label: "Основное",     icon: "Table2" },
    { path: "/analytics", label: "Аналитика",    icon: "LineChart" },
    { path: "/economics", label: "Экономика",    icon: "Calculator" },
    { path: "/research",  label: "Исследование", icon: "Search" },
    { path: "/content",   label: "Контент",      icon: "Film" },
    { path: "/data",      label: "Данные",       icon: "Database" },
    { path: "/money",      label: "Money Maker",       icon: "Coins" },
  ] as const;
  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap font-medium ${
            item.path === "/data"
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

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { columns: [], rows: [] };
  const delimiters = [";", ",", "\t"];
  const delimiter = delimiters.find((d) => lines[0].includes(d)) ?? ",";
  const columns = lines[0].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(columns.map((col, i) => [col, vals[i] ?? ""]));
  });
  return { columns, rows };
}

// ─── Source badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string; icon: string }> = {
    csv:    { label: "CSV",           cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20",       icon: "FileSpreadsheet" },
    sheets: { label: "Google Sheets", cls: "bg-[#b5f23d]/10 text-[#b5f23d] border border-[#b5f23d]/20",  icon: "Table" },
    manual: { label: "Вручную",       cls: "bg-muted text-muted-foreground border border-border",          icon: "Pencil" },
  };
  const s = map[source] ?? map.manual;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      <Icon name={s.icon as "Activity"} size={11} />
      {s.label}
    </span>
  );
}

// ─── Preview table ────────────────────────────────────────────────────────────
function PreviewTable({ columns, rows }: { columns: string[]; rows: Record<string, string>[] }) {
  if (!columns.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left text-muted-foreground uppercase tracking-wider text-[10px] font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-foreground font-mono whitespace-nowrap max-w-[180px] truncate">
                  {row[col] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
          + ещё {rows.length - 5} строк
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Data() {
  const [imports, setImports] = useState<DataImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"csv" | "sheets" | "history">("csv");

  // CSV state
  const [csvParsed, setCsvParsed] = useState<{ columns: string[]; rows: Record<string, string>[] } | null>(null);
  const [csvName, setCsvName] = useState("");
  const [csvSaving, setCsvSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Google Sheets state
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsName, setSheetsName] = useState("");
  const [sheetsParsed, setSheetsParsed] = useState<{ columns: string[]; rows: Record<string, string>[] } | null>(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsSaving, setSheetsSaving] = useState(false);

  // Selected import for detail
  const [selected, setSelected] = useState<DataImport | null>(null);

  // Mapper state
  const [mapperTarget, setMapperTarget] = useState<DataImport | null>(null);
  const { applyMapping } = useMappedData();

  useEffect(() => {
    api.get("data-imports")
      .then((d) => setImports(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  // ── CSV upload ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setCsvParsed(parsed);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleSaveCSV = async () => {
    if (!csvParsed || !csvName.trim()) return;
    setCsvSaving(true);
    const created = await api.post("data-imports", {
      name: csvName.trim(),
      source: "csv",
      status: "ready",
      row_count: csvParsed.rows.length,
      columns: csvParsed.columns,
      preview: csvParsed.rows.slice(0, 10),
      raw_data: csvParsed.rows,
    });
    if (created?.id) {
      setImports((prev) => [created, ...prev]);
      setCsvParsed(null);
      setCsvName("");
      if (fileRef.current) fileRef.current.value = "";
      setActiveTab("history");
    }
    setCsvSaving(false);
  };

  // ── Google Sheets ───────────────────────────────────────────────────────────
  const extractSheetId = (url: string) => {
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return m?.[1] ?? null;
  };

  const handleLoadSheets = async () => {
    const id = extractSheetId(sheetsUrl);
    if (!id) { alert("Неверная ссылка на Google Sheets. Убедитесь, что таблица открыта для всех по ссылке."); return; }
    setSheetsLoading(true);
    setSheetsParsed(null);
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("Нет доступа");
      const text = await res.text();
      const parsed = parseCSV(text);
      setSheetsParsed(parsed);
      if (!sheetsName) setSheetsName("Google Sheets импорт");
    } catch {
      alert("Не удалось загрузить таблицу.\n\nПроверьте:\n1. Таблица открыта для всех по ссылке (Доступ → Все, у кого есть ссылка)\n2. Ссылка скопирована из адресной строки браузера");
    }
    setSheetsLoading(false);
  };

  const handleSaveSheets = async () => {
    if (!sheetsParsed || !sheetsName.trim()) return;
    setSheetsSaving(true);
    const created = await api.post("data-imports", {
      name: sheetsName.trim(),
      source: "sheets",
      status: "ready",
      row_count: sheetsParsed.rows.length,
      columns: sheetsParsed.columns,
      preview: sheetsParsed.rows.slice(0, 10),
      raw_data: sheetsParsed.rows,
    });
    if (created?.id) {
      setImports((prev) => [created, ...prev]);
      setSheetsParsed(null);
      setSheetsUrl("");
      setSheetsName("");
      setActiveTab("history");
    }
    setSheetsSaving(false);
  };

  // ── Delete import ───────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    await api.delete("data-imports", id);
    setImports((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#b5f23d] flex items-center justify-center flex-shrink-0">
                <Icon name="Activity" size={14} className="text-black" />
              </div>
              <span className="font-semibold text-sm text-foreground">РнП Маркетинг</span>
              <span className="text-muted-foreground text-xs hidden sm:block">·</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Данные</span>
            </div>
            <div className="flex items-center gap-1">
              <TopNav />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        <div className="flex flex-col gap-6">

          {/* Title */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">Центр данных</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Загружайте данные из CSV или Google Sheets — затем используйте их в РНП, Воронках и Дашборде
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
              <Icon name="Database" size={13} className="text-[#b5f23d]" />
              <span>{imports.length} импортов сохранено</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left: upload panel */}
            <div className="xl:col-span-2 flex flex-col gap-4">

              {/* Tabs */}
              <div className="flex gap-0 border-b border-border">
                {([
                  { id: "csv",     label: "CSV / Excel",      icon: "FileSpreadsheet" },
                  { id: "sheets",  label: "Google Sheets",    icon: "Table" },
                  { id: "history", label: `История (${imports.length})`, icon: "History" },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all ${
                      activeTab === t.id
                        ? "border-[#b5f23d] text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon name={t.icon as "Activity"} size={14} className={activeTab === t.id ? "text-[#b5f23d]" : ""} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── CSV tab ── */}
              {activeTab === "csv" && (
                <div className="flex flex-col gap-4">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-[#b5f23d]/40 hover:bg-[#b5f23d]/3 transition-all"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const reader = new FileReader();
                        setCsvName(file.name.replace(/\.[^.]+$/, ""));
                        reader.onload = (ev) => {
                          const parsed = parseCSV(ev.target?.result as string);
                          setCsvParsed(parsed);
                        };
                        reader.readAsText(file, "utf-8");
                      }
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Icon name="Upload" size={22} className="text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">Перетащите файл или нажмите</div>
                      <div className="text-xs text-muted-foreground mt-1">CSV, TSV — разделители ; , или Tab</div>
                    </div>
                    <span className="text-xs text-[#b5f23d] font-medium">Выбрать файл</span>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileChange} />

                  {csvParsed && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs text-[#b5f23d] font-medium">
                        <Icon name="CheckCircle" size={14} />
                        Распознано {csvParsed.rows.length} строк · {csvParsed.columns.length} колонок
                      </div>
                      <PreviewTable columns={csvParsed.columns} rows={csvParsed.rows} />
                      <div className="flex items-center gap-2">
                        <input
                          value={csvName}
                          onChange={(e) => setCsvName(e.target.value)}
                          placeholder="Название набора данных"
                          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#b5f23d]/50"
                        />
                        <button
                          onClick={handleSaveCSV}
                          disabled={csvSaving || !csvName.trim()}
                          className="btn-lime flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                        >
                          {csvSaving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                          Сохранить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Google Sheets tab ── */}
              {activeTab === "sheets" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
                    <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Icon name="Info" size={13} className="text-[#b5f23d]" />
                      Как подключить Google Sheets
                    </div>
                    <ol className="text-xs text-muted-foreground flex flex-col gap-1.5 list-decimal list-inside">
                      <li>Откройте таблицу в Google Sheets</li>
                      <li>Нажмите <span className="text-foreground font-medium">«Поделиться»</span> → <span className="text-foreground font-medium">«Все, у кого есть ссылка»</span></li>
                      <li>Скопируйте ссылку из адресной строки браузера</li>
                      <li>Вставьте ссылку ниже и нажмите «Загрузить»</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#b5f23d]/50 font-mono text-xs"
                    />
                    <button
                      onClick={handleLoadSheets}
                      disabled={sheetsLoading || !sheetsUrl.trim()}
                      className="btn-lime flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg disabled:opacity-50 whitespace-nowrap"
                    >
                      {sheetsLoading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Download" size={14} />}
                      Загрузить
                    </button>
                  </div>

                  {sheetsParsed && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs text-[#b5f23d] font-medium">
                        <Icon name="CheckCircle" size={14} />
                        Загружено {sheetsParsed.rows.length} строк · {sheetsParsed.columns.length} колонок
                      </div>
                      <PreviewTable columns={sheetsParsed.columns} rows={sheetsParsed.rows} />
                      <div className="flex items-center gap-2">
                        <input
                          value={sheetsName}
                          onChange={(e) => setSheetsName(e.target.value)}
                          placeholder="Название набора данных"
                          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#b5f23d]/50"
                        />
                        <button
                          onClick={handleSaveSheets}
                          disabled={sheetsSaving || !sheetsName.trim()}
                          className="btn-lime flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                        >
                          {sheetsSaving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                          Сохранить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Mapper modal ── */}
              {mapperTarget && (
                <DataMapper
                  importName={mapperTarget.name}
                  columns={mapperTarget.columns}
                  rows={mapperTarget.raw_data || mapperTarget.preview || []}
                  onClose={() => setMapperTarget(null)}
                  onApply={(result: MappingResult) => {
                    applyMapping(result.aggregated);
                    setMapperTarget(null);
                    alert(`✅ Данные применены в РНП!\n\nЗаполнено полей: ${Object.keys(result.aggregated).length}\n\nПерейди в раздел «Основное → Запуск» чтобы увидеть результат.`);
                  }}
                />
              )}

              {/* ── History tab ── */}
              {activeTab === "history" && (
                <div className="flex flex-col gap-3">
                  {loading && (
                    <div className="text-xs text-muted-foreground py-8 text-center">Загрузка...</div>
                  )}
                  {!loading && imports.length === 0 && (
                    <div className="bg-card border border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 text-center">
                      <Icon name="Database" size={28} className="text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">Нет загруженных данных</div>
                      <div className="text-xs text-muted-foreground">Загрузите CSV или подключите Google Sheets</div>
                    </div>
                  )}
                  {imports.map((imp) => (
                    <div
                      key={imp.id}
                      className={`bg-card border rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all card-hover ${selected?.id === imp.id ? "border-[#b5f23d]/40" : "border-border"}`}
                      onClick={() => setSelected(selected?.id === imp.id ? null : imp)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon name="FileText" size={15} className="text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-sm text-foreground truncate">{imp.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <SourceBadge source={imp.source} />
                          <span className="text-xs text-muted-foreground">{imp.row_count} строк</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMapperTarget(imp); }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-[#b5f23d]/10 text-[#7aaa1a] hover:bg-[#b5f23d]/20 transition-all border border-[#b5f23d]/20"
                            title="Использовать в РНП"
                          >
                            <Icon name="Zap" size={11} />
                            В РНП
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(imp.id); }}
                            className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Удалить"
                          >
                            <Icon name="Trash2" size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(imp.columns || []).slice(0, 8).map((col) => (
                          <span key={col} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">
                            {col}
                          </span>
                        ))}
                        {(imp.columns || []).length > 8 && (
                          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                            +{imp.columns.length - 8}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">
                        {new Date(imp.created_at).toLocaleString("ru-RU")}
                      </div>
                      {selected?.id === imp.id && imp.preview && (
                        <div className="mt-2 animate-fade-in">
                          <PreviewTable columns={imp.columns} rows={imp.preview} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: help panel */}
            <div className="flex flex-col gap-4">
              <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                <div className="text-sm font-semibold text-foreground">Что можно загружать</div>
                {[
                  { icon: "TrendingUp", label: "Рекламные кабинеты", desc: "Яндекс.Директ, VK Ads, Google Ads — выгрузите отчёт в CSV" },
                  { icon: "Users", label: "CRM / лиды", desc: "AmoCRM, Битрикс, SalesBot — экспорт сделок и лидов" },
                  { icon: "BarChart2", label: "Аналитика сайта", desc: "Яндекс.Метрика, Google Analytics — отчёты по трафику" },
                  { icon: "MessageSquare", label: "Мессенджеры", desc: "Откудаподписка, Senler — статистика по воронкам" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name={item.icon as "Activity"} size={13} className="text-[#b5f23d]" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-[#b5f23d]/30 rounded-xl p-4 flex flex-col gap-3">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon name="Zap" size={14} className="text-[#b5f23d]" />
                  Как использовать данные
                </div>
                <ol className="text-xs text-muted-foreground flex flex-col gap-2 list-decimal list-inside">
                  <li>Загрузите CSV или Google Sheets</li>
                  <li>В «Истории» нажмите <span className="font-medium text-foreground">«В РНП»</span></li>
                  <li>Привяжите колонки к полям воронки</li>
                  <li>Нажмите <span className="font-medium text-foreground">«Применить в РНП»</span></li>
                  <li>Перейдите в <span className="font-medium text-foreground">Основное → Запуск</span> — факты заполнятся автоматически</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}