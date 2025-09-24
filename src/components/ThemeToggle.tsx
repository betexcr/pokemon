"use client";

import { useTheme } from "./ThemeProvider";
import type React from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";
  const nextThemeLabel = isDark ? "light" : "dark";
  const srLabel = `Switch to ${nextThemeLabel} theme`;
  
  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={srLabel}
      title={srLabel}
      onClick={toggleTheme}
      onKeyDown={onKeyDown}
      className="relative inline-flex items-center h-8 w-14 sm:h-10 sm:w-20 rounded-full border-2 border-gray-300 bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:from-slate-700 dark:to-slate-800"
    >
      <span className="sr-only">{srLabel}</span>
      {/* Track base design */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10 dark:ring-white/10 [box-shadow:inset_0_2px_6px_rgba(0,0,0,0.25)] dark:[box-shadow:inset_0_2px_8px_rgba(0,0,0,0.45)]"
      />
      {/* Sun (left) and Moon (right) icons as background elements */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span
          className={`absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 bg-[url('/header-icons/theme_switcher_dark.png')] bg-no-repeat bg-contain bg-left ${
            isDark ? "opacity-100" : "opacity-40"
          }`}
        />
        <span
          className={`absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 bg-[url('/header-icons/theme_switcher_light.png')] bg-no-repeat bg-contain bg-right ${
            isDark ? "opacity-40" : "opacity-100"
          }`}
        />
      </span>
      {/* Thumb */}
      <span
        aria-hidden="true"
        className={`relative inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white dark:bg-gray-200 shadow ring-1 ring-black/10 transform transition-transform duration-300 ${
          isDark ? "translate-x-6 sm:translate-x-10" : "translate-x-1 sm:translate-x-1"
        }`}
      />
    </button>
  );
}
