"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Zap, Leaf, Flame, Gem } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "gold", icon: Zap, label: "Gold" },
    { id: "red", icon: Flame, label: "Red" },
    { id: "ruby", icon: Gem, label: "Ruby" },
  ] as const;

  const getThemeButtonStyle = (themeId: string) => {
    if (theme === themeId) {
      switch (themeId) {
        case 'gold':
          return 'bg-gold-accent text-black shadow-gold-button';
        case 'red':
          return 'bg-red-accent text-white shadow-red-button';
        case 'ruby':
          return 'bg-ruby-accent text-white shadow-ruby-button';
        default:
          return 'bg-poke-blue text-white shadow-md';
      }
    }
    return 'text-muted hover:text-text hover:bg-white/50 dark:hover:bg-white/10';
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg">
      {themes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${getThemeButtonStyle(id)}
          `}
          title={`Switch to ${label} theme`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
