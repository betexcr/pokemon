"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDexData } from "@/lib/checklist/dex.client";
import { useChecklist } from "./ChecklistProvider";
import { useSearchParams } from "next/navigation";
import DexCard from "./DexCard";
import { useInView } from "@/hooks/useInView";

function parseCsv(v: string | null): number[] {
  if (!v) return [];
  return v.split(",").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
}

export default function DexGrid() {
  const INITIAL_VISIBLE = 120;
  const LOAD_MORE_STEP = 180;
  const { state, toggleCaught } = useChecklist();
  const { dex, loading, loadedGens, loadGeneration } = useDexData();
  const params = useSearchParams();
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView<HTMLDivElement>({ rootMargin: "900px" });

  const selectedGens = useMemo(() => new Set(parseCsv(params.get("gen"))), [params]);

  // Load generations specified in URL parameters
  useEffect(() => {
    for (const gen of selectedGens) {
      if (!loadedGens.has(gen)) {
        void loadGeneration(gen);
      }
    }
  }, [selectedGens, loadedGens, loadGeneration]);
  const selectedType = params.get("type") ?? "";
  const caughtFilter = params.get("caught") ?? "all"; // all | caught | uncaught
  const q = (params.get("q") ?? "").toLowerCase().trim();
  const caughtFilterState = caughtFilter === "all" ? null : state.caught;

  const list = useMemo(() => {
    const source = dex;
    return source.filter((d) => {
      if (selectedGens.size && !selectedGens.has(d.gen)) return false;
      if (selectedType && !d.types.includes(selectedType)) return false;
      const isCaught = !!state.caught[d.id];
      if (caughtFilter === "caught" && !isCaught) return false;
      if (caughtFilter === "uncaught" && isCaught) return false;
      if (q && !(d.name.toLowerCase().includes(q) || String(d.id) === q)) return false;
      return true;
    });
  }, [dex, selectedGens, selectedType, caughtFilter, q, caughtFilterState, state.caught]);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE, Math.max(1, list.length)));
  }, [list.length]);

  useEffect(() => {
    if (!loadMoreInView) return;
    setVisibleCount((prev) => Math.min(list.length, prev + LOAD_MORE_STEP));
  }, [loadMoreInView, list.length]);

  const visibleList = useMemo(() => list.slice(0, visibleCount), [list, visibleCount]);
  const hiddenCount = Math.max(0, list.length - visibleList.length);

  const skeletonCount = useMemo(() => {
    if (!loading || list.length > 0) return 0;
    const base = 12;
    const perGen = 12;
    const count = selectedGens.size ? Math.min(48, Math.max(base, selectedGens.size * perGen)) : 18;
    return count;
  }, [loading, selectedGens, list.length]);

  function SkeletonCard({ i }: { i: number }) {
    return (
      <div key={`skeleton-${i}`} className="border rounded-lg p-2 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-pulse" aria-hidden>
        <div className="flex items-center justify-between">
          <span className="h-3 w-10 rounded bg-gray-200 dark:bg-gray-700" />
          <span className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="aspect-square rounded bg-gray-100 dark:bg-gray-900" />
        <div className="flex items-center justify-between">
          <span className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <span className="h-3 w-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-1">
          <span className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
          <span className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-1 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading && skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} i={i} />)}
        {visibleList.map((d) => (
          <DexCard
            key={d.id}
            entry={d}
            isCaught={!!state.caught[d.id]}
            onToggleCaught={toggleCaught}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-4 flex items-center justify-center">
          <div ref={loadMoreRef} className="h-2 w-full" aria-hidden />
          <button
            onClick={() => setVisibleCount((prev) => Math.min(list.length, prev + LOAD_MORE_STEP))}
            className="text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1"
          >
            Load more ({hiddenCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

