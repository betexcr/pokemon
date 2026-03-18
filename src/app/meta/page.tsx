import type { Metadata } from 'next';
import { fetchMetaData } from '@/lib/meta/fetchMetaData';
import UsageTable from '@/components/meta/UsageTable';
import MetaPodium from '@/components/meta/MetaPodium';
import MoveHeatmap from '@/components/meta/MoveHeatmap';
import MetaPageClient from './MetaPageClient';

export const metadata: Metadata = {
  title: 'Competitive Meta Dashboard',
  description: 'Usage trends, win rates, and moves for competitive play.',
};

export const revalidate = 3600;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; month?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const format = params.format || 'OU';
  const month = params.month || '2024-08';
  const sort = (params.sort as 'usage' | 'winrate') || 'usage';

  const dataset = await fetchMetaData(format, month);

  const sorted = [...dataset.top].sort((a, b) =>
    sort === 'winrate' ? b.winrate - a.winrate : b.usage - a.usage,
  );

  return (
    <MetaPageClient title="Competitive Meta">
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Format / Month selectors */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm text-muted">Format:</span>
          {['OU', 'UU', 'VGC'].map(f => (
            <a
              key={f}
              href={`/meta?format=${f}&month=${month}&sort=${sort}`}
              className={`px-3 py-1 text-sm rounded-full border ${
                f === format
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-muted hover:bg-surface/60'
              }`}
            >
              {f}
            </a>
          ))}
          <span className="ml-4 text-sm text-muted">Sort:</span>
          {(['usage', 'winrate'] as const).map(s => (
            <a
              key={s}
              href={`/meta?format=${format}&month=${month}&sort=${s}`}
              className={`px-3 py-1 text-sm rounded-full border ${
                s === sort
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-muted hover:bg-surface/60'
              }`}
            >
              {s === 'usage' ? 'Usage %' : 'Win Rate'}
            </a>
          ))}
        </div>

        {/* Podium */}
        {sorted.length >= 3 && (
          <MetaPodium top3={sorted.slice(0, 3)} />
        )}

        {/* Table */}
        <UsageTable rows={sorted} />

        {/* Move Heatmaps for top 3 */}
        {sorted.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-text">Top Moves</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.slice(0, 3).map(p => (
                <MoveHeatmap key={p.name} pokemon={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </MetaPageClient>
  );
}
