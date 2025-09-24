"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function ClickableRow({ id, children }: { id: number; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  function select() {
    const usp = new URLSearchParams(sp.toString());
    usp.set('p', String(id));
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
  }
  return (
    <tr
      tabIndex={0}
      onClick={select}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && select()}
      className="cursor-pointer odd:bg-white even:bg-gray-50/50 dark:odd:bg-gray-900 dark:even:bg-gray-900/50 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </tr>
  );
}


