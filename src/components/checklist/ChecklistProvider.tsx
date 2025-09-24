"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ProgressState } from "@/lib/checklist/types";
import { hydrateState, toggleCaught as toggleCaughtHelper } from "@/lib/checklist/state";
import { saveLocal, loadLocal, nowState, loadStreak, saveStreak, todayKey } from "@/lib/checklist/storage.local";
import { saveCloud } from "@/lib/checklist/storage.firebase";

type Ctx = {
  state: ProgressState;
  setState: React.Dispatch<React.SetStateAction<ProgressState>>;
  uid: string | null;
  setUid: (uid: string | null) => void;
  toggleCaught: (id: number, on: boolean) => void;
  streak: number;
};

const ChecklistCtx = createContext<Ctx | null>(null);

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadLocal() ?? nowState());
  const [uid, setUid] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(() => loadStreak()?.streak ?? 0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When uid changes (sign-in/out), hydrate merged state if signed in
  useEffect(() => {
    let mounted = true;
    (async () => {
      const merged = await hydrateState(uid);
      if (mounted) setState(merged);
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // Persist local immediately and debounce cloud writes while signed in
  useEffect(() => {
    saveLocal(state);
    if (!uid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveCloud(uid, state).catch(() => {});
    }, 1000);
  }, [state, uid]);

  // Track simple daily streak in localStorage
  const updateStreak = useCallback(() => {
    try {
      const today = todayKey();
      const s = loadStreak();
      if (!s) {
        const init = { lastDay: today, streak: 1 };
        saveStreak(init);
        setStreak(1);
        return;
      }
      if (s.lastDay === today) {
        setStreak(s.streak);
        return;
      }
      const last = new Date(s.lastDay);
      const now = new Date(today);
      const diff = Math.round((+now - +last) / 86400000);
      const next = diff === 1 ? s.streak + 1 : 1;
      const upd = { lastDay: today, streak: next };
      saveStreak(upd);
      setStreak(next);
    } catch {}
  }, []);

  const toggleCaught = useCallback((id: number, on: boolean) => {
    setState((prev) => {
      const next = toggleCaughtHelper(prev, id, on);
      // Update streak when making a change
      updateStreak();
      return next;
    });
  }, [updateStreak]);

  const value = useMemo<Ctx>(() => ({ state, setState, uid, setUid, toggleCaught, streak }), [state, uid, toggleCaught, streak]);

  return <ChecklistCtx.Provider value={value}>{children}</ChecklistCtx.Provider>;
}

export function useChecklist() {
  const ctx = useContext(ChecklistCtx);
  if (!ctx) throw new Error("useChecklist must be used within ChecklistProvider");
  return ctx;
}
