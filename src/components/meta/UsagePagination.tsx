"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function UsagePagination({ total, pageSize, page, sort }: { total: number; pageSize: number; page: number; sort: 'usage' | 'winrate' }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function setParam(key: string, val: string) {
    const usp = new URLSearchParams(sp.toString());
    usp.set(key, val);
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center justify-between p-2 text-sm border-t">
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>Prev</button>
        <span>
          Page {page} / {pages}
        </span>
        <button className="px-2 py-1 border rounded" disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}>Next</button>
      </div>
      <div className="flex items-center gap-2">
        <span>Sort:</span>
        <button className={`px-2 py-1 border rounded ${sort === 'usage' ? 'bg-blue-600 text-white border-blue-600' : ''}`} onClick={() => setParam('sort', 'usage')}>Usage</button>
        <button className={`px-2 py-1 border rounded ${sort === 'winrate' ? 'bg-blue-600 text-white border-blue-600' : ''}`} onClick={() => setParam('sort', 'winrate')}>Winrate</button>
      </div>
    </div>
  );
}

