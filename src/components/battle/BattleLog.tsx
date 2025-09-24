"use client";

import { useEffect, useRef } from 'react';

export type LogEntry = { id: number; text: string };

export default function BattleLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="rounded border p-2 bg-white/60 dark:bg-gray-900/40 h-40 overflow-auto" aria-live="polite" aria-relevant="additions" ref={ref}>
      <ul className="text-sm space-y-1">
        {entries.map((e) => (
          <li key={e.id}>• {e.text}</li>
        ))}
      </ul>
    </div>
  );
}

