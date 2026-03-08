"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { NormalizedEvoGraph, NormalizedFamily, Edge, Species, EvoFilters } from '@/lib/evo/types';

const DEFAULT_GENS = ['1'];

const EvoControls = dynamic(() => import('@/components/evo/EvoControls'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-md border bg-gray-100/60 dark:bg-gray-900/20 animate-pulse" />,
});
const EvoTree = dynamic(() => import('@/components/evo/EvoTree'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-md border bg-gray-100/60 dark:bg-gray-900/20 animate-pulse" />
      ))}
    </div>
  ),
});

type Props = {
  data: NormalizedEvoGraph;
  serverList: Array<{ id: number; bases: string; count: number }>;
};

function inflateFamily(f: any): NormalizedFamily {
  const species: Species[] = f.species;
  const edges: Edge[] = f.edges ?? [];
  const speciesById = new Map<number, Species>();
  for (const s of species) speciesById.set(s.id, s);
  const incoming = new Map<number, Edge[]>();
  const outgoing = new Map<number, Edge[]>();
  for (const e of edges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    outgoing.get(e.from)!.push(e);
    incoming.get(e.to)!.push(e);
  }
  return {
    familyId: String(f.familyId),
    species,
    edges,
    speciesById,
    incoming,
    outgoing,
    bases: f.bases ?? [],
    isBranched: !!f.isBranched,
  };
}

function readFiltersFromParams(sp: URLSearchParams): EvoFilters {
  const genParam = sp.get('gen');
  const methodParam = sp.get('method');
  return {
    search: sp.get('search') || '',
    gens: genParam ? genParam.split(',').filter(Boolean) : DEFAULT_GENS,
    methods: methodParam ? methodParam.split(',').filter(Boolean) : [],
    branchingOnly: sp.get('branchingOnly') === '1' || sp.get('branchingOnly') === 'true',
  };
}

export default function EvoClient({ data, serverList }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<EvoFilters>(() => readFiltersFromParams(searchParams));

  // Track whether we initiated the URL change so we don't loop
  const weUpdatedUrl = useRef(false);

  // Sync from URL → state only on external navigation (back/forward)
  useEffect(() => {
    if (weUpdatedUrl.current) {
      weUpdatedUrl.current = false;
      return;
    }
    setFilters(readFiltersFromParams(searchParams));
  }, [searchParams]);

  // Sync state → URL as a non-blocking side effect
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.search) sp.set('search', filters.search);
    if (filters.gens.length) sp.set('gen', filters.gens.join(','));
    if (filters.methods.length) sp.set('method', filters.methods.join(','));
    if (filters.branchingOnly) sp.set('branchingOnly', '1');
    weUpdatedUrl.current = true;
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [filters, pathname, router]);

  const onFiltersChange = useCallback((next: EvoFilters) => {
    setFilters(next);
  }, []);

  const inflated = useMemo<NormalizedEvoGraph>(
    () => ({ families: (data.families as any[]).map(inflateFamily) }),
    [data.families]
  );

  return (
    <>
      <aside className="lg:sticky lg:top-4 lg:self-start rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
        <EvoControls filters={filters} onFiltersChange={onFiltersChange} />
      </aside>

      <section className="min-h-[50vh]">
        <noscript>
          <div className="mb-4 rounded-md border p-3 bg-yellow-50 text-yellow-800">JavaScript disabled: showing base forms only.</div>
          <ul className="space-y-2">
            {serverList.map((f) => (
              <li key={f.id} className="flex justify-between border rounded p-2">
                <span className="font-medium">{f.bases}</span>
                <span className="text-sm text-gray-600">{f.count} evolution link(s)</span>
              </li>
            ))}
          </ul>
        </noscript>

        <EvoTree data={inflated} filters={filters} />
      </section>
    </>
  );
}
