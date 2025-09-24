"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Filters({ regions, years, initialRegion, initialYear }: { regions: string[]; years: number[]; initialRegion: string; initialYear: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [region, setRegion] = useState<string>(initialRegion);
  const [year, setYear] = useState<number>(initialYear);

  useEffect(() => {
    const t = setTimeout(() => {
      const usp = new URLSearchParams(sp.toString());
      usp.set('region', region);
      usp.set('year', String(year));
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, year]);

  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Trend filters">
      <div>
        <label className="block text-sm font-medium">Region</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {regions.map((r) => (
            <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)} className={`px-3 py-1 rounded border ${region === r ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{r}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Year</label>
        <input
          type="range"
          min={years[0]}
          max={years[years.length - 1]}
          step={1}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full"
          aria-valuemin={years[0]}
          aria-valuemax={years[years.length - 1]}
          aria-valuenow={year}
        />
        <div className="text-xs text-gray-600 mt-1">{year}</div>
      </div>
    </div>
  );
}

