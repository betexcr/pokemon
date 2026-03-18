'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { fetchMetaData } from '@/lib/meta/fetchMetaData';
import UsageTable from '@/components/meta/UsageTable';
import MetaPodium from '@/components/meta/MetaPodium';
import MoveHeatmap from '@/components/meta/MoveHeatmap';
import MetaPageClient from './MetaPageClient';

function MetaContent() {
  const searchParams = useSearchParams();
  const format = searchParams.get('format') || 'OU';
  const month = searchParams.get('month') || '2024-08';
  const sort = (searchParams.get('sort') as 'usage' | 'winrate') || 'usage';

  const [sorted, setSorted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMetaData(format, month).then(dataset => {
      if (cancelled) return;
      const s = [...dataset.top].sort((a, b) =>
        sort === 'winrate' ? b.winrate - a.winrate : b.usage - a.usage,
      );
      setSorted(s);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [format, month, sort]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
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

      {loading ? (
        <div className="text-center text-muted py-12">Loading meta data...</div>
      ) : (
        <>
          {sorted.length >= 3 && <MetaPodium top3={sorted.slice(0, 3)} />}
          <UsageTable rows={sorted} />
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
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <MetaPageClient title="Competitive Meta">
      <Suspense fallback={<div className="text-center text-muted py-12">Loading...</div>}>
        <MetaContent />
      </Suspense>
    </MetaPageClient>
  );
}
