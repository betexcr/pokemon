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
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';

type SearchParams = { [k: string]: string | string[] | undefined };

export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = (searchParams ? await searchParams : {}) || {};
  const format = (sp.format as string) || 'OU';
  const month = (sp.month as string) || '2024-08';
  const page = Number(sp.page || 1);
  const sort = (sp.sort as 'usage' | 'winrate') || 'usage';

  // Fetch validated meta dataset via API proxy
  let data: MetaDataset | null = null;
  let error: string | null = null;
  
  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') || 'http';
    const host = h.get('host') || 'localhost:3000';
    const baseUrl = `${proto}://${host}`;
    const res = await fetch(`${baseUrl}/api/meta?format=${encodeURIComponent(format)}&month=${encodeURIComponent(month)}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object' && Array.isArray(json.top)) {
        data = json as MetaDataset;
      } else {
        error = 'Invalid data format received';
      }
    } else {
      const errorData = await res.json();
      error = errorData.message || `Failed to fetch meta data (${res.status})`;
    }
  } catch (e) {
    error = 'Network error while fetching meta data';
  }

  // If no data available, show error state
  if (!data || error) {
    return (
      <MetaPageClient title="Competitive Meta">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-800/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">Meta Data Unavailable</h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error || 'Unable to load competitive meta data at this time.'}
            </p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">
              Please try again later or check back when the data service is available.
            </p>
          </div>
        </main>
      </MetaPageClient>
    );
  }

  const selected = Number(sp.p || data.top[0]?.id);
  const selectedRow: PokemonMeta | undefined = data.top.find((p) => p.id === selected);

  return (
    <MetaPageClient title="Competitive Meta">
      <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <header className="lg:col-span-2">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">Competitive Meta Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Real-time looking insights into usage, win rates, and move sets. Server-first with minimal hydration.</p>
      </header>

      <aside className="lg:sticky lg:top-4 lg:self-start rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
        <Filters initialFormat={format} initialMonth={month} />
        <div className="mt-4 bg-gradient-to-br from-blue-500/30 via-fuchsia-500/30 to-rose-500/30 p-[1px] rounded-lg">
          <div className="rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <MetaPodium top3={data.top.slice(0, 3)} />
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <UsageTable rows={data.top} page={Number.isFinite(page) && page > 0 ? page : 1} pageSize={10} sort={sort} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoveHeatmap pokemon={selectedRow || null} />
          <TrendChart series={data.top.slice(0, 3)} />
        </div>
        <UsageWinScatter rows={data.top.slice(0, 20)} />
      </section>
    </main>
    </MetaPageClient>
  );
}
