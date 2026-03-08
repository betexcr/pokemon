import type { Metadata } from 'next';
import type { NormalizedEvoGraph } from '@/lib/evo/types';
import { buildEvoGraph } from '@/lib/evo/build';
import EvoLegend from '@/components/evo/EvoLegend';
import EvolutionsPageClient from './EvolutionsPageClient';
import EvoClient from './EvoClient';

export const metadata: Metadata = {
  title: 'Evolution Journeys',
  description: 'Interactive visualization of Pokémon evolution families with filters and accessibility-first design.',
  alternates: { canonical: 'https://pokemon-indol-tau.vercel.app/evolutions' },
  openGraph: {
    title: 'Evolution Journeys',
    description: 'Explore Pokémon evolution families with interactive graphs and filters.',
    url: 'https://pokemon-indol-tau.vercel.app/evolutions',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evolution Journeys',
    description: 'Explore Pokémon evolution families with interactive graphs and filters.',
  }
};

export const revalidate = 3600;

export default async function EvolutionsPage() {
  const normalized: NormalizedEvoGraph = await buildEvoGraph({
    gens: [1],
    offset: 0,
    limit: 80,
  });

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

      <EvoClient data={normalized} serverList={serverList} />

      <footer className="lg:col-span-2 mt-8 text-xs text-gray-500">
        <p>Accessibility: Full keyboard nav, visible focus rings, prefers-reduced-motion respected. Data powered by PokeAPI with caching.</p>
      </footer>
    </main>
    </EvolutionsPageClient>
  );
}
