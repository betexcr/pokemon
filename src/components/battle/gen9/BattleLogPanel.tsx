import type { BattleLogEntry } from '@/lib/team-battle-engine';
import { cn } from '@/lib/utils';

interface BattleLogPanelProps {
  log: BattleLogEntry[];
}

export function BattleLogPanel({ log }: BattleLogPanelProps) {
  if (!log?.length) return null;
  const recent = log.slice(-12).reverse();

  return (
    <div className="h-full rounded-3xl border border-border bg-surface/80 p-4 shadow-card backdrop-blur">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Battle Log</h3>
      <ol className="space-y-2 text-sm text-text">
        {recent.map((entry, index) => (
          <li
            key={`${entry.turn ?? 'turn'}-${index}-${entry.message}`}
            className={cn(
              'rounded-2xl border border-border/60 bg-surface px-3 py-2 shadow-sm',
              entry.type === 'damage_dealt' && 'border-red-500/20 bg-red-500/10 text-red-100',
              entry.type === 'healing' && 'border-green-500/20 bg-green-500/10 text-green-100',
              entry.type === 'status_effect' && 'border-amber-500/20 bg-amber-500/10 text-amber-100'
            )}
          >
            <div className="text-xs uppercase tracking-wide text-muted">
              {entry.turn ? `Turn ${entry.turn}` : entry.type?.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-text">{entry.message}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

