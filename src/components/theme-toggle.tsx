import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable; the choice still applies for this page view
    }
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="relative overflow-hidden group hover:border-amber-400/60"
    >
      {/* Sun/Moon icon morph transition */}
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-300 transform",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100 text-amber-500"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300 transform",
          isDark
            ? "rotate-0 scale-100 opacity-100 text-amber-400"
            : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </Button>
  );
}
