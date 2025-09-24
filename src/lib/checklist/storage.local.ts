import type { ProgressState } from "./types";

const KEY = "pokedex.progress.v1";
const STREAK_KEY = "pokedex.streak.v1";

export function loadLocal(): ProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocal(state: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function nowState(): ProgressState {
  return { caught: {}, seen: {}, updatedAt: Date.now() };
}

export type StreakState = { lastDay: string; streak: number };

export function loadStreak(): StreakState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStreak(streak: StreakState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {}
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

