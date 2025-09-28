import type { Metadata } from 'next';
import type { MetaDataset, PokemonMeta } from '@/lib/meta/types';
import UsageTable from '@/components/meta/UsageTable';
import MetaPodium from '@/components/meta/MetaPodium';
import MoveHeatmap from '@/components/meta/MoveHeatmap';
import TrendChart from '@/components/meta/TrendChart';
import UsageWinScatter from '@/components/meta/UsageWinScatter';
import Filters from '@/components/meta/Filters';
import MetaPageClient from './MetaPageClient';

export const metadata: Metadata = {
  title: 'Competitive Meta Dashboard',
  description: 'Usage trends, win rates, and moves for competitive play with server-first tables and light animations.',
};

export const revalidate = 3600;

export default async function Page() {
  // Default values for static export
  const format = 'OU';
  const month = '2024-08';
  const page = 1;
  const sort = 'usage' as 'usage' | 'winrate';

  // For static export, show a placeholder message
  return (
    <MetaPageClient title="Competitive Meta">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-800 dark:bg-blue-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800/30">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-blue-800 dark:text-blue-200">Meta Dashboard</h3>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">
            The competitive meta dashboard requires server-side functionality that is not available in static export mode.
          </p>
          <p className="mt-2 text-xs text-blue-500 dark:text-blue-400">
            Please use the full application with server-side rendering to access meta data features.
          </p>
        </div>
      </main>
    </MetaPageClient>
  );
}
