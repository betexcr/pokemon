"use client";
import { useCallback } from "react";

export function useThemeRipple() {
  return useCallback((e: React.MouseEvent, nextTheme: string) => {
    const x = e.clientX, y = e.clientY;
    const el = document.createElement("div");
    el.className = "fixed inset-0 z-[70] pointer-events-none";
    el.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    el.style.background = "var(--ripple-bg, white)";
    el.style.transition = "clip-path 420ms ease-out, opacity 600ms ease";
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      const max = Math.hypot(window.innerWidth, window.innerHeight);
      el.style.clipPath = `circle(${max}px at ${x}px ${y}px)`;
    });

    // actually switch theme underneath
    document.documentElement.dataset.theme = nextTheme;

    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 620);
    }, 430);
  }, []);
}

