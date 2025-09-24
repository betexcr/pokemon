"use client";

import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
const TypeTooltip = dynamic(() => import('@/components/type/TypeTooltip'), { ssr: false });
import Image from 'next/image';
import type { PokemonMeta } from '@/lib/meta/types';

export default function MetaPodium({ top3 }: { top3: PokemonMeta[] }) {
  const reduce = useReducedMotion();
  const sorted = [...top3].sort((a, b) => b.usage - a.usage).slice(0, 3);

  const max = Math.max(...sorted.map((p) => p.usage));

  return (
    <div className="grid grid-cols-3 gap-3 items-end h-56" role="list" aria-label="Top 3 podium">
      {sorted.map((p, idx) => {
        const height = 40 + (p.usage / max) * 140;
        return (
          <div key={p.id} role="listitem" aria-label={`Rank ${idx + 1}: ${p.name}, usage ${p.usage}%`} className="flex flex-col items-center">
            <TypeTooltip label={`${p.name} details`} content={<PodiumTooltip name={p.name} usage={p.usage} winrate={p.winrate} topMoves={p.topMoves.map(m=>`${m.move} ${m.usage}%`).join(', ')} />}>
              <motion.div
                initial={{ height: 40 }}
                animate={{ height }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
                className={`w-full rounded-t-md ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-300' : 'bg-orange-400'}`}
                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.15)' }}
              />
            </TypeTooltip>
            <div className="mt-2 text-center text-sm">
              <div className="flex items-center justify-center gap-2 font-semibold">
                <Image
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                  alt={p.name}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full bg-white/80 ring-1 ring-gray-200 object-contain"
                />
                <span>#{idx + 1} {p.name}</span>
              </div>
              <div className="text-xs text-gray-600">{p.usage}% usage • {p.winrate}% win</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PodiumTooltip({ name, usage, winrate, topMoves }: { name: string; usage: number; winrate: number; topMoves: string }) {
  return (
    <div className="text-xs space-y-1">
      <div className="font-semibold">{name}</div>
      <div>Usage: {usage}%</div>
      <div>Winrate: {winrate}%</div>
      <div className="text-[11px] text-gray-600">Moves: {topMoves}</div>
    </div>
  );
}
