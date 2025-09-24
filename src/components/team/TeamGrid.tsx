"use client";

import { useMemo, useState } from 'react';
import { POKEMON_LIST, type SimplePokemon } from '@/lib/battle/sampleData';
import PokemonCard from './PokemonCard';

type Props = {
  team: (SimplePokemon | null)[];
  onChange: (team: (SimplePokemon | null)[]) => void;
};

export default function TeamGrid({ team, onChange }: Props) {
  const [addName, setAddName] = useState<string>('');
  const emptyIdx = team.findIndex((t) => t === null);
  const options = useMemo(() => POKEMON_LIST.map((p) => p.name), []);

  function addByName(name: string) {
    const p = POKEMON_LIST.find((x) => x.name === name);
    if (!p) return;
    const next = [...team];
    const idx = emptyIdx >= 0 ? emptyIdx : team.length < 6 ? team.length : -1;
    if (idx >= 0) {
      next[idx] = p;
      onChange(next);
    }
  }

  function removeAt(idx: number) {
    const next = [...team];
    next[idx] = null;
    onChange(next);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, idx: number) {
    const name = e.dataTransfer.getData('text/plain');
    const p = POKEMON_LIST.find((x) => x.name === name);
    if (!p) return;
    const next = [...team];
    next[idx] = p;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm font-medium">Add Pokémon</label>
          <input list="team-names" value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 rounded border px-3 py-2 bg-white/80 dark:bg-gray-900/60" placeholder="Charizard…" />
          <datalist id="team-names">
            {options.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <button type="button" className="px-3 py-2 rounded border" onClick={() => { addByName(addName); setAddName(''); }}>Add</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="list" aria-label="Team slots">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            role="listitem"
            className="rounded border min-h-[72px] p-2 bg-white/60 dark:bg-gray-900/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, i)}
          >
            {team[i] ? (
              <PokemonCard p={team[i]!} onRemove={() => removeAt(i)} />
            ) : (
              <div className="h-full grid place-items-center text-xs text-gray-500">Drop here or use Add</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium">Available</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {POKEMON_LIST.map((p) => (
            <button
              key={p.id}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', p.name)}
              onClick={() => addByName(p.name)}
              className="badge text-xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
