export type InputCellProps = {
  value: string;
  onChange: (v: string) => void;
  align?: "left" | "right" | "center";
  placeholder?: string;
  mono?: boolean;
};

export function InputCell({ value, onChange, align = "right", placeholder = "", mono = true }: InputCellProps) {
  return (
    <input
      className={`w-full bg-transparent border-0 outline-none text-sm px-2 py-1 focus:bg-accent rounded transition-colors ${mono ? "font-mono" : "font-sans"} text-${align}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function ColHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2 border-b border-border whitespace-nowrap text-left ${className}`}>
      {children}
    </th>
  );
}

export function TD({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`border-b border-border px-1 py-0.5 ${className}`}>
      {children}
    </td>
  );
}
