import Icon from "@/components/ui/icon";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
    >
      <Icon name={dark ? "Sun" : "Moon"} size={15} />
    </button>
  );
}

export default ThemeToggle;
