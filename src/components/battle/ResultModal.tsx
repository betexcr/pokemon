"use client";

import { motion, useReducedMotion } from 'framer-motion';

export default function ResultModal({ open, winner, onClose }: { open: boolean; winner: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <motion.div
        initial={reduce ? undefined : { scale: 0.9, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1 }}
        className="rounded-lg border bg-white dark:bg-gray-900 p-6 w-[min(90vw,420px)] text-center"
      >
        <h2 className="text-xl font-bold">{winner} Wins!</h2>
        <p className="mt-2 text-sm text-gray-600">Super effective plays always pay off.</p>
        <div className="mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Try Again</button>
        </div>
      </motion.div>
    </div>
  );
}

