"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

type Props = {
  initialSearch?: string;
  initialGen?: string[];
  initialMethod?: string[];
  initialOpen?: number[];
  initialBranchingOnly?: boolean;
};

const GENS = Array.from({ length: 9 }, (_, i) => String(i + 1));
const METHODS = ['level', 'stone', 'trade', 'friendship', 'location', 'special'];

export default function EvoControls(props: Props) {
  const { initialSearch = '', initialGen = [], initialMethod = [], initialBranchingOnly = false } = props;
  const [search, setSearch] = useState(initialSearch);
  const [gens, setGens] = useState<string[]>(initialGen);
  const [methods, setMethods] = useState<string[]>(initialMethod);
  const [branchingOnly, setBranchingOnly] = useState(initialBranchingOnly);
  const [isFiltering, setIsFiltering] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Debounce search updates
  useEffect(() => {
    const id = setTimeout(() => syncUrl(), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Show loading state when filters change
  useEffect(() => {
    const hasFilters = gens.length > 0 || methods.length > 0 || branchingOnly;
    if (hasFilters) {
      setIsFiltering(true);
      // Show loading state briefly to indicate processing
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 500); // Show loading for 500ms to indicate processing
      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [gens, methods, branchingOnly]);

  useEffect(() => {
    syncUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gens, methods, branchingOnly]);

  function syncUrl() {
    const sp = new URLSearchParams(searchParams.toString());
    if (search) sp.set('search', search);
    else sp.delete('search');
    if (gens.length) sp.set('gen', gens.join(','));
    else sp.delete('gen');
    if (methods.length) sp.set('method', methods.join(','));
    else sp.delete('method');
    if (branchingOnly) sp.set('branchingOnly', '1');
    else sp.delete('branchingOnly');
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function toggle<T extends string>(value: T, list: T[], setList: (v: T[]) => void) {
    setList(list.includes(value) ? list.filter((g) => g !== value) : [...list, value]);
  }

  const motionReduce = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  return (
    <form className="flex flex-col gap-4" aria-label="Evolution filters" role="search">
      <div>
        <label htmlFor="evo-search" className="block text-sm font-medium">Search species</label>
        <input
          id="evo-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Eevee…"
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
              onClick={() => toggle(g, gens, setGens)}
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
                onChange={() => toggle(m, methods, setMethods)}
                aria-label={m}
              />
              <span className="capitalize">{m}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={branchingOnly} onChange={(e) => setBranchingOnly(e.target.checked)} />
          <span>Branching only</span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        {!motionReduce && (
          <p className="text-[10px] text-gray-500" aria-live="polite">Animations enabled. Respecting OS motion preferences.</p>
        )}
        {isFiltering && (
          <div className="ml-auto flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent"
            />
            Processing filters...
          </div>
        )}
      </div>
    </form>
  );
}
