"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const FORMATS = ['OU', 'VGC', 'UU'] as const;

export default function Filters({ initialFormat, initialMonth }: { initialFormat: string; initialMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [format, setFormat] = useState<string>(initialFormat);
  const [month, setMonth] = useState<string>(initialMonth);

  useEffect(() => {
    const usp = new URLSearchParams(sp.toString());
    usp.set('format', format);
    usp.set('month', month);
    const t = setTimeout(() => router.replace(`${pathname}?${usp.toString()}`, { scroll: false }), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, month]);

  return (
    <form className="flex flex-col gap-3" aria-label="Meta filters">
      <div>
        <label className="block text-sm font-medium">Format</label>
        <div className="mt-1 flex gap-2">
          {FORMATS.map((f) => (
            <button key={f} type="button" onClick={() => setFormat(f)} aria-pressed={format === f} className={`${format === f ? 'btn-primary' : 'btn'}`}>{f}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 w-full rounded border bg-white/80 dark:bg-gray-900/60" />
      </div>
    </form>
  );
}
