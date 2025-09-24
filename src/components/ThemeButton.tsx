"use client";
import { useThemeRipple } from "@/hooks/useThemeRipple";

interface ThemeButtonProps {
  label: string;
  theme: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ThemeButton({ label, theme, className = "", children }: ThemeButtonProps) {
  const ripple = useThemeRipple();
  
  return (
    <button
      onClick={(e) => ripple(e, theme)}
      className={`rounded-xl border border-border bg-surface hover:shadow transition-colors ${className}`}
      aria-label={`Switch theme to ${label}`}
    >
      {children || label}
    </button>
  );
}

