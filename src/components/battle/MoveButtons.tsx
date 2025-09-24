"use client";

import type { Move } from '@/lib/battle/sampleData';
import { useReducedMotion, motion } from 'framer-motion';

export default function MoveButtons({ moves, onChoose, disabled }: { moves: Move[]; onChoose: (m: Move) => void; disabled?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {moves.map((m) => (
        <motion.button
          key={m.name}
          type="button"
          className="rounded border p-2 text-left bg-white/70 dark:bg-gray-900/50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          disabled={disabled}
          onClick={() => onChoose(m)}
        >
          <div className="font-medium">{m.name}</div>
          <div className="text-xs text-gray-600">Type: {m.type} • Power: {m.power}</div>
        </motion.button>
      ))}
    </div>
  );
}

