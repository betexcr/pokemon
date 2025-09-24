"use client";

import { POKEMON_LIST, SAMPLE_POKEMON, type SimplePokemon } from '@/lib/battle/sampleData';
import { useState } from 'react';

export default function TeamSelector({ onStart }: { onStart: (attacker: SimplePokemon, defender: SimplePokemon) => void }) {
  const [a, setA] = useState<string>('Charizard');
  const [d, setD] = useState<string>('Blastoise');

  const attacker = SAMPLE_POKEMON[a];
  const defender = SAMPLE_POKEMON[d];

  return (
    <div className="space-y-4" role="form" aria-label="Select Pokémon for battle">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectorCard title="Attacker" value={a} onChange={setA} />
        <SelectorCard title="Defender" value={d} onChange={setD} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => onStart(attacker, defender)}
        >
          Start Battle
        </button>
        <div className="text-xs text-gray-600 dark:text-gray-300">Tip: You attack first. Try move types against defender types to learn matchups.</div>
      </div>
    </div>
  );
}

function SelectorCard({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) {
  const mon = SAMPLE_POKEMON[value];
  return (
    <div className="rounded border p-3 bg-white/60 dark:bg-gray-900/40">
      <div className="mb-2 font-semibold">{title}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border bg-white/80 dark:bg-gray-900/60 mb-3"
        aria-label={`${title} Pokémon`}
      >
        {POKEMON_LIST.map((p) => (
          <option key={p.id} value={p.name}>{p.name}</option>
        ))}
      </select>
      <div className="flex items-center justify-between text-sm">
        <div>
          <div className="font-medium">{mon.name}</div>
          <div className="mt-1 flex gap-1 flex-wrap">
            {mon.types.map((t) => (
              <span key={t} className="text-[10px] rounded-full border bg-gray-50 dark:bg-gray-800 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div>HP: {mon.hp}</div>
          <div className="text-xs text-gray-500">Moves: {mon.moves.map((m) => m.name).join(', ')}</div>
        </div>
      </div>
    </div>
  );
}

