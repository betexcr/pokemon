"use client";

import { useTheme } from "./ThemeProvider";
import Image from "next/image";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '50%',
        width: '64px',
        height: '64px',
        minWidth: '64px',
        minHeight: '64px',
        maxWidth: '64px',
        maxHeight: '64px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-muted)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
      }}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <Image
        src={isDark ? "/header-icons/theme_switcher_dark.png" : "/header-icons/theme_switcher_light.png"}
        alt={isDark ? "Switch to light theme" : "Switch to dark theme"}
        width={48}
        height={48}
        className="w-12 h-12 object-contain"
      />
    </button>
  );
}
