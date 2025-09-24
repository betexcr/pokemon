"use client";
import React, { useMemo } from "react";
import { useDexData } from "@/lib/checklist/dex.client";
import { useChecklist } from "./ChecklistProvider";
import { motion, useReducedMotion } from "framer-motion";

export default function ProgressBar() {
  const { state } = useChecklist();
  const prefersReducedMotion = useReducedMotion();
  const { dex, gens, loading } = useDexData();

  // Fixed generation ranges to compute totals regardless of loaded data
  const GEN_RANGES: Record<number, { start: number; end: number }> = {
    1: { start: 1, end: 151 },
    2: { start: 152, end: 251 },
    3: { start: 252, end: 386 },
    4: { start: 387, end: 493 },
    5: { start: 494, end: 649 },
    6: { start: 650, end: 721 },
    7: { start: 722, end: 809 },
    8: { start: 810, end: 905 },
    9: { start: 906, end: 1017 },
  };

  const total = useMemo(() => {
    // Sum of all generation totals
    return gens.reduce((acc, g) => acc + (GEN_RANGES[g].end - GEN_RANGES[g].start + 1), 0);
  }, [gens]);

  const caught = useMemo(() => Object.keys(state.caught).length, [state.caught]);
  const percent = Math.round((caught / Math.max(1, total)) * 100);

  const perGen = useMemo(() => {
    const map: Record<number, { total: number; caught: number }> = {};
    for (const g of gens) map[g] = { total: GEN_RANGES[g].end - GEN_RANGES[g].start + 1, caught: 0 };
    // Count caught per generation from state without needing dex loaded
    for (const g of gens) {
      const { start, end } = GEN_RANGES[g];
      let c = 0;
      for (let id = start; id <= end; id++) {
        if (state.caught[id]) c++;
      }
      map[g].caught = c;
    }
    return map;
  }, [state.caught, gens]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm">Loading...</span>
          </div>
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className="h-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Loading Pokémon data...
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
            <div key={g} className="rounded border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium">Gen {g}</span>
                <span className="text-xs">Loading...</span>
              </div>
              <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Loading...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm">{percent}%</span>
        </div>
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {prefersReducedMotion ? (
            <div className="h-full bg-green-500" style={{ width: `${percent}%` }} />
          ) : (
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6 }}
            />
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {caught} / {total || 151} caught
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {gens.map((g) => {
          const data = perGen[g];
          const pct = Math.round((data.caught / Math.max(1, data.total)) * 100);
          return (
            <div key={g} className="rounded border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium">Gen {g}</span>
                <span className="text-xs">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {prefersReducedMotion ? (
                  <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                ) : (
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.caught}/{data.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

