"use client";

import type { PokemonMeta } from '@/lib/meta/types';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import Tooltip from '@/components/Tooltip';

export default function MoveHeatmap({ pokemon }: { pokemon: PokemonMeta | null }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  if (!pokemon) return <div className="text-sm text-gray-500">Select a Pokémon to view its top moves.</div>;
  const moves = pokemon.topMoves.slice(0, 6);

  return (
    <div>
      <h3 className="font-semibold mb-2">Top Moves — {pokemon.name}</h3>
      <div className="grid grid-cols-3 gap-2">
        {moves.map((m) => {
          const intensity = Math.min(1, m.usage / 100);
          const bg = `rgba(59,76,255,${0.15 + intensity * 0.5})`;
          return (
            <Tooltip key={m.move} content={`${m.move}. Usage: ${m.usage}%`} variant="move" type={undefined} damageClass="status">
              <motion.button
                type="button"
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={() => setActive(active === m.move ? null : m.move)}
                className="rounded border p-2 text-left"
                style={{ background: bg }}
                title={`${m.move}: ${m.usage}%`}
              >
                <div className="text-sm font-medium">{m.move}</div>
                <div className="text-xs text-gray-700">{m.usage}% usage</div>
                {active === m.move && (
                  <div className="mt-2 text-xs text-gray-800 dark:text-gray-200">Click to dismiss.</div>
                )}
              </motion.button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

