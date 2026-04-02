import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import UsagePageClient from './UsagePageClient';
import UsagePhaseBook from '@/components/usage/UsagePhaseBook';
import { UsageFilters, UsagePhase, Platform, Generation, Format } from '@/types/usage';

export const metadata: Metadata = {
  title: 'Usage Meta Dashboard',
  description: 'Comprehensive competitive usage statistics across all major platforms and generations',
  alternates: { canonical: '/usage' },
  openGraph: {
    title: 'Usage Meta Dashboard',
    description: 'Comprehensive competitive usage statistics across Smogon, VGC, and more.',
    url: '/usage',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Usage Meta Dashboard',
    description: 'Comprehensive competitive usage statistics across Smogon, VGC, and more.'
  }
};

export const revalidate = 3600; // Revalidate every hour

type SearchParams = {
  [key: string]: string | string[] | undefined;
  platform?: string | string[];
  generation?: string | string[];
  format?: string | string[];
  month?: string;
  phase?: string;
  top50Only?: string;
  sortBy?: string;
  sortOrder?: string;
  pokemonId?: string;
};

const PLATFORM_VALUES: Platform[] = ['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL', 'OTHER'];
const GENERATION_VALUES: Generation[] = ['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'];
const FORMAT_VALUES: Format[] = [
  'OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE',
  'VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I',
  'BSS_SERIES_8', 'BSS_SERIES_9', 'BSS_SERIES_12', 'BSS_SERIES_13', 'BSS_REG_C', 'BSS_REG_D', 'BSS_REG_E', 'BSS_REG_I',
  'UNKNOWN'
];
const PHASE_VALUES: UsagePhase[] = ['snapshot', 'trends', 'deepdive'];

function pickSingle(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

export default async function UsagePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const platform = pickSingle(params.platform);
  const generation = pickSingle(params.generation);
  const format = pickSingle(params.format);
  const month = pickSingle(params.month);
  const phaseParam = pickSingle(params.phase);
  const sortByParam = pickSingle(params.sortBy);
  const sortOrderParam = pickSingle(params.sortOrder);
  const pokemonIdParam = pickSingle(params.pokemonId);

  const filters: UsageFilters = {
    platforms: platform && PLATFORM_VALUES.includes(platform as Platform) ? [platform as Platform] : ['SMOGON_SINGLES'],
    generations: generation && GENERATION_VALUES.includes(generation as Generation) ? [generation as Generation] : ['GEN9'],
    formats: format && FORMAT_VALUES.includes(format as Format) ? [format as Format] : ['OU'],
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7),
    top50Only: pickSingle(params.top50Only) === 'true',
    sortBy: sortByParam === 'usage' || sortByParam === 'name' ? sortByParam : 'rank',
    sortOrder: sortOrderParam === 'desc' ? 'desc' : 'asc'
  };

  const phase: UsagePhase =
    phaseParam && PHASE_VALUES.includes(phaseParam as UsagePhase)
      ? (phaseParam as UsagePhase)
      : 'snapshot';
  const initialSelectedPokemonId = pokemonIdParam ? Number.parseInt(pokemonIdParam, 10) : undefined;

  return (
    <>
      <Script
        id="jsonld-usage-dataset"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'Pokémon Competitive Usage Dataset',
            description: 'Aggregated competitive Pokémon usage statistics across Smogon, VGC, and other platforms by generation and format.',
            url: 'https://pokemon-indol-tau.vercel.app/usage',
            license: 'https://creativecommons.org/licenses/by/4.0/',
            creator: {
              '@type': 'Organization',
              name: 'PokéDex'
            }
          })
        }}
      />
      <UsagePageClient title="Usage Meta Dashboard">
        <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">
            Usage Meta Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive competitive usage statistics across Smogon, VGC, and Battle Stadium Singles
          </p>
        </header>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <UsagePhaseBook
            initialFilters={filters}
            initialPhase={phase}
            initialSelectedPokemonId={Number.isFinite(initialSelectedPokemonId) ? initialSelectedPokemonId : undefined}
          />
        </Suspense>
        </main>
      </UsagePageClient>
    </>
  );
}
