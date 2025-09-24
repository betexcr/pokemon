import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import UsagePageClient from './UsagePageClient';
import UsageOverview from '@/components/usage/UsageOverview';
import UsagePhaseBook from '@/components/usage/UsagePhaseBook';
import { UsageFilters } from '@/types/usage';

export const metadata: Metadata = {
  title: 'Usage Meta Dashboard',
  description: 'Comprehensive competitive usage statistics across all major platforms and generations',
  alternates: { canonical: 'https://pokemon.ultharcr.com/usage' },
  openGraph: {
    title: 'Usage Meta Dashboard',
    description: 'Comprehensive competitive usage statistics across Smogon, VGC, and more.',
    url: 'https://pokemon.ultharcr.com/usage',
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
};

export default async function UsagePage({ 
  searchParams 
}: { 
  searchParams?: Promise<SearchParams> 
}) {
  const params = searchParams ? await searchParams : {};
  
  // Parse search parameters
  const platform = Array.isArray(params.platform) ? params.platform : 
    (params.platform ? [params.platform] : []);
  const generation = Array.isArray(params.generation) ? params.generation : 
    (params.generation ? [params.generation] : []);
  const format = Array.isArray(params.format) ? params.format : 
    (params.format ? [params.format] : []);
  const month = params.month || '';
  const phase = params.phase || 'snapshot';
  const top50Only = params.top50Only === 'true';
  
  const filters: UsageFilters = {
    platforms: platform.length > 0 ? platform as any : ['SMOGON_SINGLES'],
    generations: generation.length > 0 ? generation as any : ['GEN9'],
    formats: format.length > 0 ? format as any : ['OU'],
    month: month || new Date().toISOString().slice(0, 7),
    top50Only: top50Only,
    sortBy: 'rank',
    sortOrder: 'asc'
  };

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
            url: 'https://pokemon.ultharcr.com/usage',
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
          <UsagePhaseBook initialFilters={filters} initialPhase={phase as any} />
        </Suspense>
        </main>
      </UsagePageClient>
    </>
  );
}
