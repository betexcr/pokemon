"use client";

import dynamic from 'next/dynamic';
import type { NormalizedEvoGraph, NormalizedFamily, Edge, Species } from '@/lib/evo/types';
// Rebuild Map fields client-side when data came through JSON

const EvoControls = dynamic(() => import('@/components/evo/EvoControls'), { ssr: false });
const EvoTree = dynamic(() => import('@/components/evo/EvoTree'), { ssr: false });

type Props = {
  data: NormalizedEvoGraph;
  serverList: Array<{ id: number; bases: string; count: number }>;
  initialSearch: string;
  initialGen: string[];
  initialMethod: string[];
  initialOpen: number[];
  branchingOnly: boolean;
};

export default function EvoClient(props: Props) {
  const {
    data,
    serverList,
    initialSearch,
    initialGen,
    initialMethod,
    initialOpen,
    branchingOnly,
  } = props;

  const inflated: NormalizedEvoGraph = {
    families: (data.families as any[]).map((f: any) => {
      const species: Species[] = f.species;
      const edges: Edge[] = f.edges ?? [];
      const speciesById = new Map<number, Species>();
      species.forEach((s) => speciesById.set(s.id, s));
      const incoming = new Map<number, Edge[]>();
      const outgoing = new Map<number, Edge[]>();
      for (const e of edges) {
        if (!outgoing.has(e.from)) outgoing.set(e.from, []);
        if (!incoming.has(e.to)) incoming.set(e.to, []);
        outgoing.get(e.from)!.push(e);
        incoming.get(e.to)!.push(e);
      }
      const fam: NormalizedFamily = {
        familyId: String(f.familyId),
        species,
        edges,
        speciesById,
        incoming,
        outgoing,
        bases: f.bases ?? [],
        isBranched: !!f.isBranched,
      };
      return fam;
    }),
  };

  return (
    <>
      <aside className="lg:sticky lg:top-4 lg:self-start rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
        <EvoControls
          initialSearch={initialSearch}
          initialGen={initialGen}
          initialMethod={initialMethod}
          initialOpen={initialOpen}
          initialBranchingOnly={branchingOnly}
        />
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

        {/* Hydrated interactive trees */}
        <EvoTree data={inflated} />
      </section>
    </>
  );
}
