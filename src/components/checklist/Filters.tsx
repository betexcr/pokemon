"use client";
import React, { useMemo, useState } from "react";
import { useDexData } from "@/lib/checklist/dex.client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useChecklist } from "./ChecklistProvider";

function parseCsv(v: string | null): number[] {
  if (!v) return [];
  return v.split(",").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
}

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState<string>(params.get("q") ?? "");
  const { gens, types, loading, loadedGens, loadGeneration, loadAll } = useDexData();
  const { state } = useChecklist();

  const selectedGens = useMemo(() => {
    const fromParams = new Set(parseCsv(params.get("gen")));
    // If no generation is selected, default to Gen 1 since it's loaded initially
    if (fromParams.size === 0) {
      return new Set([1]);
    }
    return fromParams;
  }, [params]);
  const selectedType = params.get("type") ?? "";
  const caughtFilter = params.get("caught") ?? "all"; // all | caught | uncaught

  function updateParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  }

  function toggleGen(gen: number) {
    const arr = new Set(parseCsv(params.get("gen")));
    if (arr.has(gen)) arr.delete(gen);
    else arr.add(gen);
    const v = Array.from(arr).sort((a, b) => a - b).join(",");
    updateParam("gen", v || null);
  }

  function onGenClick(gen: number) {
    if (!loadedGens.has(gen)) {
      void loadGeneration(gen);
    }
    toggleGen(gen);
  }

  function setType(t: string) {
    updateParam("type", t || null);
  }

  function setCaught(v: string) {
    updateParam("caught", v === "all" ? null : v);
  }

  function onSearchInput(v: string) {
    setSearch(v);
    const p = new URLSearchParams(params.toString());
    if (v) p.set("q", v);
    else p.delete("q");
    router.replace(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Gen</span>
        {gens.map((g) => {
          const start = g === 1 ? 1 : g === 2 ? 152 : g === 3 ? 252 : g === 4 ? 387 : g === 5 ? 494 : g === 6 ? 650 : g === 7 ? 722 : g === 8 ? 810 : 906;
          const end   = g === 1 ? 151 : g === 2 ? 251 : g === 3 ? 386 : g === 4 ? 493 : g === 5 ? 649 : g === 6 ? 721 : g === 7 ? 809 : g === 8 ? 905 : 1017;
          let caughtInGen = 0;
          for (let id = start; id <= end; id++) {
            if (state.caught[id]) caughtInGen++;
          }
          const totalInGen = end - start + 1;
          const isSelected = selectedGens.has(g);
          const isLoaded = loadedGens.has(g);
          return (
            <button
              key={g}
              onClick={() => onGenClick(g)}
              className={`text-xs rounded border px-2 py-1 transition-colors ${
                isSelected ? "bg-blue-600 text-white border-blue-700" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              }`}
              aria-pressed={isSelected}
              aria-label={`Toggle Gen ${g}`}
            >
              <span className="font-medium">Gen {g}</span>
              <span className="ml-2 opacity-80">{caughtInGen}/{totalInGen}</span>
              {!isLoaded && <span className="ml-2 text-[10px] opacity-70">Load</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium" htmlFor="typeFilter">Type</label>
        <select
          id="typeFilter"
          value={selectedType}
          onChange={(e) => setType(e.target.value)}
          className="text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
        >
          <option value="">All</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium" htmlFor="caughtFilter">Caught</label>
        <select
          id="caughtFilter"
          value={caughtFilter}
          onChange={(e) => setCaught(e.target.value)}
          className="text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
        >
          <option value="all">All</option>
          <option value="caught">Caught</option>
          <option value="uncaught">Uncaught</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label htmlFor="search" className="text-sm font-medium">Search</label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="Name or ID"
          className="text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
        />
        <button
          onClick={() => void loadAll()}
          className="text-xs rounded bg-blue-600 text-white px-2 py-1 hover:bg-blue-700"
        >
          Load all Pokémon
        </button>
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
      </div>
    </div>
  );
}

