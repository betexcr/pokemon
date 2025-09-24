"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function SortableHeader({ label, param }: { label: string; param: 'usage' | 'winrate' }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = (sp.get('sort') || 'usage') === param;
  function setSort() {
    const usp = new URLSearchParams(sp.toString());
    usp.set('sort', param);
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
  }
  return (
    <th className="p-2 text-right">
      <button type="button" className={`underline-offset-2 ${active ? 'underline' : ''}`} onClick={setSort}>{label}</button>
    </th>
  );
}


