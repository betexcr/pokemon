"use client";

import type { SimplePokemon } from '@/lib/battle/sampleData';

export default function PokemonCard({ p, onRemove }: { p: SimplePokemon; onRemove?: () => void }) {
  return (
    <div className="rounded border p-2 bg-white/70 dark:bg-gray-900/50">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{p.name}</div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs px-2 py-0.5 rounded border hover:bg-red-50 dark:hover:bg-red-900/30">Remove</button>
        )}
      </div>
      <div className="mt-1 flex gap-1 flex-wrap">
        {p.types.map((t) => (
          <span key={t} className="text-[10px] rounded-full border bg-gray-50 dark:bg-gray-800 px-2 py-0.5">{t}</span>
        ))}
      </div>
    </div>
  );
}

