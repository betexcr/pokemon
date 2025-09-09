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
      className="pk-btn"
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <Image
        src={isDark ? "/header-icons/theme_switcher_dark.png" : "/header-icons/theme_switcher_light.png"}
        alt={isDark ? "Switch to light theme" : "Switch to dark theme"}
        width={32}
        height={32}
        className="w-full h-full object-contain"
      />
    </button>
  );
}
