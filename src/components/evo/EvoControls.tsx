"use client";

import { useCallback } from 'react';
import type { EvoFilters } from '@/lib/evo/types';

type Props = {
  filters: EvoFilters;
  onFiltersChange: (filters: EvoFilters) => void;
};

const GENS = Array.from({ length: 9 }, (_, i) => String(i + 1));
const METHODS = ['level', 'stone', 'trade', 'friendship', 'location', 'special'];

export default function EvoControls({ filters, onFiltersChange }: Props) {
  const { search, gens, methods, branchingOnly } = filters;

  const setSearch = useCallback(
    (value: string) => onFiltersChange({ ...filters, search: value }),
    [filters, onFiltersChange]
  );

  const toggleGen = useCallback(
    (g: string) =>
      onFiltersChange({
        ...filters,
        gens: gens.includes(g) ? gens.filter((x) => x !== g) : [...gens, g],
      }),
    [filters, gens, onFiltersChange]
  );

  const toggleMethod = useCallback(
    (m: string) =>
      onFiltersChange({
        ...filters,
        methods: methods.includes(m) ? methods.filter((x) => x !== m) : [...methods, m],
      }),
    [filters, methods, onFiltersChange]
  );

  const toggleBranching = useCallback(
    (checked: boolean) => onFiltersChange({ ...filters, branchingOnly: checked }),
    [filters, onFiltersChange]
  );

  return (
    <form className="flex flex-col gap-4" aria-label="Evolution filters" role="search">
      <div>
        <label htmlFor="evo-search" className="block text-sm font-medium">Search species</label>
        <input
          id="evo-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Eevee..."
          className="mt-1 w-full rounded-md border px-3 py-2 bg-white/80 dark:bg-gray-900/60"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Generations</legend>
        <div className="flex flex-wrap gap-2">
          {GENS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGen(g)}
              aria-pressed={gens.includes(g)}
              className={
                gens.includes(g)
                  ? 'px-2.5 py-1.5 rounded-md border text-sm bg-blue-600 border-blue-600 text-white hover:bg-blue-600/90 transition'
                  : 'px-2.5 py-1.5 rounded-md border text-sm bg-white/80 dark:bg-gray-900/60 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition'
              }
            >
              Gen {g}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Methods</legend>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Method filters">
          {METHODS.map((m) => (
            <label key={m} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={methods.includes(m)}
                onChange={() => toggleMethod(m)}
                aria-label={m}
              />
              <span className="capitalize">{m}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={branchingOnly} onChange={(e) => toggleBranching(e.target.checked)} />
          <span>Branching only</span>
        </label>
      </div>
    </form>
  );
}
