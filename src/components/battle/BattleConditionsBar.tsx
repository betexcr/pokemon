'use client';

import type { BattleConditions, ConditionTag } from '@/lib/battle-conditions';

const TONE: Record<ConditionTag['tone'], string> = {
  good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  bad: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200',
  neutral: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200',
};

function Chips({ tags, label, testId }: { tags: ConditionTag[]; label: string; testId: string }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" data-testid={testId}>
      <span className="text-[11px] font-semibold text-muted mr-1">{label}</span>
      {tags.map((t) => (
        <span
          key={t.id}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[t.tone]}`}
          title={typeof t.turns === 'number' ? `${t.label} (${t.turns} turn${t.turns === 1 ? '' : 's'} left)` : t.label}
        >
          {t.label}
          {typeof t.turns === 'number' && <span className="ml-1 opacity-70">{t.turns}</span>}
        </span>
      ))}
    </div>
  );
}

/**
 * Weather, terrain, rooms, side conditions and each active Pokémon's visible conditions.
 * `mySide` puts the viewer's side first and labels it "You".
 */
export default function BattleConditionsBar({
  conditions,
  mySide = 'p1',
}: {
  conditions: BattleConditions | null | undefined;
  mySide?: 'p1' | 'p2';
}) {
  if (!conditions) return null;
  const foeSide = mySide === 'p1' ? 'p2' : 'p1';
  const mine = conditions[mySide] ?? [];
  const theirs = conditions[foeSide] ?? [];
  const field = conditions.field ?? [];
  if (!mine.length && !theirs.length && !field.length) return null;
  return (
    <div className="px-3 py-2 space-y-1 border-b border-border bg-surface/60" aria-label="Battle conditions" data-testid="battle-conditions">
      <Chips tags={field} label="Field" testId="conditions-field" />
      <Chips tags={mine} label="You" testId="conditions-mine" />
      <Chips tags={theirs} label="Foe" testId="conditions-foe" />
    </div>
  );
}
