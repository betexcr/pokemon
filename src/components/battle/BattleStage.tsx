"use client";

import { useMemo, useState } from 'react';
import type { SimplePokemon, Move } from '@/lib/battle/sampleData';
import { calcDamage, effectivenessText } from '@/lib/battle/engine';
import { motion, useReducedMotion } from 'framer-motion';
import MoveButtons from './MoveButtons';
import BattleLog, { type LogEntry } from './BattleLog';

export default function BattleStage({ attacker, defender, onReset }: { attacker: SimplePokemon; defender: SimplePokemon; onReset: () => void }) {
  const reduce = useReducedMotion();
  const [hpA, setHpA] = useState(attacker.hp);
  const [hpD, setHpD] = useState(defender.hp);
  const [log, setLog] = useState<LogEntry[]>([{ id: 1, text: `${attacker.name} challenges ${defender.name}!` }]);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [seq, setSeq] = useState(2);
  const [lastMoveType, setLastMoveType] = useState<string | null>(null);

  const percent = (cur: number, max: number) => Math.max(0, Math.min(1, cur / max));

  const onChoose = async (move: Move) => {
    if (busy || winner) return;
    setBusy(true);
    const { damage, effectiveness } = calcDamage(attacker, defender, move);
    setLastMoveType(move.type);
    setLog((l) => [...l, { id: seq, text: `${attacker.name} used ${move.name}!` }]);
    setSeq((s) => s + 1);
    if (!reduce) await delay(350);
    setLog((l) => [...l, { id: seq + 1, text: effectivenessText(effectiveness) }]);
    setSeq((s) => s + 1);
    setHpD((h) => Math.max(0, h - damage));
    if (!reduce) await delay(450);
    if (hpD - damage <= 0) {
      setWinner(attacker.name);
      setLog((l) => [...l, { id: seq + 1, text: `${defender.name} fainted!` }]);
      setSeq((s) => s + 1);
    }
    setBusy(false);
  };

  const hpBar = (label: string, cur: number, max: number, align: 'left' | 'right') => (
    <div className={`w-64 ${align === 'left' ? '' : 'ml-auto'}`} aria-label={`${label} HP ${cur}/${max}`}>
      <div className="text-xs mb-1">{label} — {cur}/{max}</div>
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${percent(cur, max) * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.4 }}
          className="h-full bg-green-500"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4" role="region" aria-label="Battle stage">
      <div className="relative rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm min-h-[260px] overflow-hidden">
        <div className="flex justify-between">
          {hpBar(attacker.name, hpA, attacker.hp, 'left')}
          {hpBar(defender.name, hpD, defender.hp, 'right')}
        </div>
        <div className="mt-8 grid grid-cols-2 items-end">
          <motion.div
            initial={false}
            animate={busy && !reduce ? { x: [0, 12, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="justify-self-start"
          >
            <Sprite name={attacker.name} facing="right" />
          </motion.div>
          <motion.div
            initial={false}
            animate={busy && !reduce ? { x: [0, -12, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="justify-self-end"
          >
            <Sprite name={defender.name} facing="left" />
          </motion.div>
        </div>
      </div>

      <MoveButtons moves={attacker.moves} onChoose={onChoose} disabled={busy || !!winner} />
      <BattleLog entries={log} />

      <AttackEffect active={busy && !winner && !reduce} type={lastMoveType} />

      {winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Battle Result</h2>
            <p className="text-lg mb-4">{winner} wins!</p>
            <button 
              onClick={onReset}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sprite({ name, facing }: { name: string; facing: 'left' | 'right' }) {
  const src = '/placeholder-pokemon.png';
  const flip = useMemo(() => (facing === 'left' ? 'scale-x-[-1]' : ''), [facing]);
  return (
    <div className={`w-32 h-32 rounded bg-gray-100 dark:bg-gray-800 grid place-items-center border ${flip}`} aria-label={`${name} sprite`}>
      <span className="text-xs text-gray-600">{name}</span>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function AttackEffect({ active, type }: { active: boolean; type: string | null }) {
  const reduce = useReducedMotion();
  if (!active || reduce) return null;
  const map: Record<string, string> = {
    Fire: 'radial-gradient(circle at 70% 30%, rgba(255,120,0,0.25), rgba(255,255,255,0) 60%)',
    Water: 'radial-gradient(circle at 70% 30%, rgba(0,140,255,0.25), rgba(255,255,255,0) 60%)',
    Electric: 'radial-gradient(circle at 70% 30%, rgba(255,220,0,0.3), rgba(255,255,255,0) 60%)',
    Grass: 'radial-gradient(circle at 70% 30%, rgba(40,180,90,0.25), rgba(255,255,255,0) 60%)',
    Ice: 'radial-gradient(circle at 70% 30%, rgba(150,220,255,0.25), rgba(255,255,255,0) 60%)',
    Psychic: 'radial-gradient(circle at 70% 30%, rgba(220,120,255,0.25), rgba(255,255,255,0) 60%)',
    Dark: 'radial-gradient(circle at 70% 30%, rgba(30,30,30,0.35), rgba(255,255,255,0) 60%)',
    Steel: 'radial-gradient(circle at 70% 30%, rgba(160,160,180,0.3), rgba(255,255,255,0) 60%)',
  };
  const bg = (type && map[type]) || 'radial-gradient(circle at 70% 30%, rgba(255,200,0,0.2), rgba(255,255,255,0) 60%)';
  return (
    <motion.div
      className="pointer-events-none fixed inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.35, 0] }}
      transition={{ duration: 0.45 }}
      style={{ background: bg }}
    />
  );
}
