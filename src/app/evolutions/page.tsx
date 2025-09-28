import type { Metadata } from 'next';
import type { NormalizedEvoGraph } from '@/lib/evo/types';
import { buildEvoGraph } from '@/lib/evo/build';
import EvoLegend from '@/components/evo/EvoLegend';
import EvolutionsPageClient from './EvolutionsPageClient';
import EvoClient from './EvoClient';

export const metadata: Metadata = {
  title: 'Evolution Journeys',
  description: 'Interactive visualization of Pokémon evolution families with filters and accessibility-first design.',
  alternates: { canonical: 'https://pokemon.ultharcr.com/evolutions' },
  openGraph: {
    title: 'Evolution Journeys',
    description: 'Explore Pokémon evolution families with interactive graphs and filters.',
    url: 'https://pokemon.ultharcr.com/evolutions',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evolution Journeys',
    description: 'Explore Pokémon evolution families with interactive graphs and filters.',
  }
};

// Revalidate the static page periodically to keep data fresh
export const revalidate = 3600; // 1 hour
// Remove force-static to allow search parameters to work properly

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function EvolutionsPage() {
  // Default values for static export
  const gens = undefined;
  const methods = undefined;
  const limit = 20;
  const offset = 0;
  
  // Build directly on the server to avoid an internal network roundtrip
  const normalized: NormalizedEvoGraph = await buildEvoGraph({ gens, methods, offset, limit });
  
  // Debug logging
  console.log('Evolutions API response:', {
    familiesCount: normalized.families.length,
    firstFamily: normalized.families[0] ? {
      familyId: normalized.families[0].familyId,
      speciesCount: normalized.families[0].species.length,
      edgesCount: normalized.families[0].edges?.length || 0
    } : null
  });

  const initialSearch = '';
  const initialGen: string[] = [];
  const initialMethod: string[] = [];
  const initialOpen: number[] = [];
  const branchingOnly = false;

  // No-JS progressive enhancement fallback: list base forms with evolution counts
  const serverList = normalized.families.map((fam) => {
    const count = fam.edges?.length ?? 0;
    const bases = fam.bases
      .map((id) => fam.species.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return { id: fam.familyId as unknown as number, bases, count };
  });

  return (
    <EvolutionsPageClient title="Evolution Journeys">
      <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <header className="lg:col-span-2 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight heading-gradient">Evolution Journeys</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Explore Pokémon evolution families. Filter by generation or method. Keyboard accessible and motion-aware.</p>
        <div className="mt-2">
          <EvoLegend />
        </div>
      </header>

      <EvoClient
        data={normalized}
        serverList={serverList}
        initialSearch={initialSearch}
        initialGen={initialGen}
        initialMethod={initialMethod}
        initialOpen={initialOpen}
        branchingOnly={branchingOnly}
      />

      <footer className="lg:col-span-2 mt-8 text-xs text-gray-500">
        <p>Accessibility: Full keyboard nav, visible focus rings, prefers-reduced-motion respected. Data powered by PokeAPI with caching.</p>
      </footer>
    </main>
    </EvolutionsPageClient>
  );
}
