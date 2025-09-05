"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "gold" | "red" | "ruby";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "gold", "red", "ruby"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Remove all theme classes
    document.documentElement.classList.remove("dark", "theme-gold", "theme-red", "theme-ruby");
    
    // Add appropriate theme class
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "gold") {
      document.documentElement.classList.add("theme-gold");
    } else if (newTheme === "red") {
      document.documentElement.classList.add("theme-red");
    } else if (newTheme === "ruby") {
      document.documentElement.classList.add("theme-ruby");
    }
  };

  useEffect(() => {
    if (mounted) {
      // Remove all theme classes
      document.documentElement.classList.remove("dark", "theme-gold", "theme-red", "theme-ruby");
      
      // Add appropriate theme class
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "gold") {
        document.documentElement.classList.add("theme-gold");
      } else if (theme === "red") {
        document.documentElement.classList.add("theme-red");
      } else if (theme === "ruby") {
        document.documentElement.classList.add("theme-ruby");
      }
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
