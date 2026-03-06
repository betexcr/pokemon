"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { DexEntry } from "./types";
import { getPokemonWithPagination, getPokemonFallbackImage } from "@/lib/api";

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Inclusive ID ranges per generation
const GEN_RANGES: Record<number, { start: number; end: number }> = {
  1: { start: 1, end: 151 },
  2: { start: 152, end: 251 },
  3: { start: 252, end: 386 },
  4: { start: 387, end: 493 },
  5: { start: 494, end: 649 },
  6: { start: 650, end: 721 },
  7: { start: 722, end: 809 },
  8: { start: 810, end: 905 },
  9: { start: 906, end: 1017 }, // adjust if new mons added
};

function getGenerationById(id: number): number {
  for (const gen of Object.keys(GEN_RANGES).map((n) => parseInt(n, 10))) {
    const r = GEN_RANGES[gen];
    if (id >= r.start && id <= r.end) return gen;
  }
  return 9;
}

function getRangeForGen(gen: number) {
  return GEN_RANGES[gen] ?? GEN_RANGES[9];
}

function useDexDataStore() {
  const [dex, setDex] = useState<DexEntry[]>([]);
  const [loadingCount, setLoadingCount] = useState<number>(0);
  const [loadedGens, setLoadedGens] = useState<Set<number>>(new Set());
  const loadedGensRef = useRef<Set<number>>(new Set());
  const loadingGensRef = useRef<Set<number>>(new Set());
  const loading = loadingCount > 0;

  useEffect(() => {
    loadedGensRef.current = loadedGens;
  }, [loadedGens]);

  const gens = useMemo(() => Object.keys(GEN_RANGES).map((n) => parseInt(n, 10)), []);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const d of dex) for (const t of d.types) set.add(t);
    return Array.from(set).sort();
  }, [dex]);

  const loadGeneration = useCallback(async (gen: number) => {
    if (loadedGensRef.current.has(gen) || loadingGensRef.current.has(gen)) return;
    loadingGensRef.current.add(gen);
    setLoadingCount((c) => c + 1);
    try {
      const { start, end } = getRangeForGen(gen);
      const limit = end - start + 1;
      const offset = start - 1; // API is zero-indexed by national dex order
      const batch = await getPokemonWithPagination(limit, offset);
      const mapped: DexEntry[] = batch.map((p) => ({
        id: p.id,
        name: capitalize(p.name),
        gen: getGenerationById(p.id),
        types: (p.types || []).map((t) => capitalize(t.type.name)),
        sprite: getPokemonFallbackImage(p.id),
      }));
      setDex((prev) => {
        // Avoid duplicates if called twice
        const seen = new Set(prev.map((d) => d.id));
        const merged = [...prev, ...mapped.filter((m) => !seen.has(m.id))];
        // Keep list sorted by id for stable UI
        merged.sort((a, b) => a.id - b.id);
        return merged;
      });
      setLoadedGens((prev) => {
        if (prev.has(gen)) return prev;
        const next = new Set(prev);
        next.add(gen);
        return next;
      });
    } finally {
      loadingGensRef.current.delete(gen);
      setLoadingCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const loadAll = useCallback(async () => {
    // Load all generations sequentially to avoid overwhelming API
    for (const g of gens) {
      // eslint-disable-next-line no-await-in-loop
      await loadGeneration(g);
    }
  }, [gens, loadGeneration]);

  // Initial: load only Gen 1
  useEffect(() => {
    loadGeneration(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dex, gens, types, loading, loadedGens, loadGeneration, loadAll } as const;
}

type DexDataContextValue = ReturnType<typeof useDexDataStore>;

const DexDataContext = createContext<DexDataContextValue | null>(null);

export function DexDataProvider({ children }: { children: React.ReactNode }) {
  const value = useDexDataStore();
  return React.createElement(DexDataContext.Provider, { value }, children);
}

export function useDexData() {
  const ctx = useContext(DexDataContext);
  if (!ctx) {
    throw new Error("useDexData must be used within DexDataProvider");
  }
  return ctx;
}


