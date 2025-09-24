"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function useDexData() {
  const [dex, setDex] = useState<DexEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadedGens, setLoadedGens] = useState<Set<number>>(new Set());
  const loadingGensRef = useRef<Set<number>>(new Set());

  const gens = useMemo(() => Object.keys(GEN_RANGES).map((n) => parseInt(n, 10)), []);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const d of dex) for (const t of d.types) set.add(t);
    return Array.from(set).sort();
  }, [dex]);

  const loadGeneration = useCallback(async (gen: number) => {
    if (loadedGens.has(gen) || loadingGensRef.current.has(gen)) return;
    loadingGensRef.current.add(gen);
    setLoading(true);
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
      setLoadedGens((prev) => new Set(prev).add(gen));
    } finally {
      loadingGensRef.current.delete(gen);
      setLoading(false);
    }
  }, [loadedGens]);

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


