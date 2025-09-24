"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function SearchBar({ names, initial }: { names: string[]; initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(initial || '');

  const filtered = useMemo(() => {
    if (!q) return names.slice(0, 8);
    return names.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }, [q, names]);

  useEffect(() => {
    const t = setTimeout(() => {
      const usp = new URLSearchParams(sp.toString());
      if (q) usp.set('poke', q);
      else usp.delete('poke');
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="relative">
      <label htmlFor="trend-search" className="block text-sm font-medium">Search Pokémon</label>
      <input id="trend-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Umbreon…" className="mt-1 w-full rounded border px-3 py-2 bg-white/80 dark:bg-gray-900/60" />
      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded border bg-white dark:bg-gray-900 text-sm max-h-48 overflow-auto">
          {filtered.map((n) => (
            <li key={n}>
              <button type="button" className="w-full text-left px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setQ(n)}>{n}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

