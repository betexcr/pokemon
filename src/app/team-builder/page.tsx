import type { Metadata } from 'next';
import TeamBuilderApp from '@/components/team/TeamBuilderApp';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Team Builder & Synergy Analyzer',
  description: 'Build a 6-Pokémon team and visualize type coverage, weaknesses, and suggestions. Server-first with sparse hydration.',
};

type SearchParams = { [k: string]: string | string[] | undefined };

export default function Page() {
  // Default empty team for static export
  const initialNames: string[] = [];
  return (
    <>
      <AppHeader title="Team Builder" backLink="/" backLabel="Back to PokéDex" showToolbar={false} />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Team Builder & Synergy Analyzer</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag Pokémon into slots, then see coverage and suggestions update live. Motion respects system preferences.</p>
        </header>
        <TeamBuilderApp initialNames={initialNames} />
      </main>
    </>
  );
}

