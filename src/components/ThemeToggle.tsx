"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Zap, Leaf, Flame, Gem } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", icon: Sun, label: "Light", color: "from-blue-400 to-cyan-400" },
    { id: "dark", icon: Moon, label: "Dark", color: "from-slate-600 to-slate-800" },
    { id: "gold", icon: Zap, label: "Gold", color: "from-amber-400 to-yellow-500" },
    { id: "red", icon: Flame, label: "Red", color: "from-red-500 to-pink-500" },
    { id: "ruby", icon: Gem, label: "Ruby", color: "from-purple-500 to-pink-500" },
  ] as const;

  const getThemeButtonStyle = (themeId: string) => {
    if (theme === themeId) {
      return 'bg-gradient-to-r from-poke-blue to-poke-blue/80 text-white shadow-lg scale-105 ring-2 ring-poke-blue/20';
    }
    return 'bg-surface/60 backdrop-blur-sm border border-border/50 text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 hover:shadow-md transition-all duration-200';
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-surface/40 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm">
      {themes.map(({ id, icon: Icon, label, color }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${getThemeButtonStyle(id)}
          `}
          title={`Switch to ${label} theme`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
