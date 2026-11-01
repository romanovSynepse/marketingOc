// ─── CELLS ────────────────────────────────────────────────────────────────────

export function In({ value, onChange, placeholder = "", className = "", align = "left" as "left" | "right" | "center" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 outline-none text-xs px-1.5 py-[3px] focus:bg-accent/50 rounded transition-colors placeholder:text-muted-foreground/20 text-${align} ${className}`}
    />
  );
}

export function PlanIn({ value, onChange, placeholder = "0" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-blue-50/70 dark:bg-blue-950/20 border-0 outline-none text-xs font-mono px-1.5 py-[3px] text-right focus:bg-blue-100 dark:focus:bg-blue-900/30 rounded placeholder:text-blue-300/50 text-blue-900 dark:text-blue-200"
    />
  );
}

export function FactIn({ value, onChange, placeholder = "0" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white dark:bg-background border-0 outline-none text-xs font-mono px-1.5 py-[3px] text-right focus:bg-accent/60 rounded placeholder:text-muted-foreground/25"
    />
  );
}

export function TH({ ch, cls = "" }: { ch: React.ReactNode; cls?: string }) {
  return <th className={`px-2.5 py-1.5 text-left text-[10px] font-semibold whitespace-nowrap ${cls}`}>{ch}</th>;
}

export function TD({ ch, cls = "" }: { ch: React.ReactNode; cls?: string }) {
  return <td className={`border-b border-border/30 px-0.5 py-0.5 ${cls}`}>{ch}</td>;
}
