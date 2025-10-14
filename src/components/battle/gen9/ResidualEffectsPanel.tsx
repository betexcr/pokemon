import type { BattlePokemon } from '@/lib/team-battle-engine';
import { Droplets, Flame, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResidualEffectsPanelProps {
  pokemon: BattlePokemon;
}

const VOLATILE_DISPLAY: Array<{
  key: keyof BattlePokemon['volatile'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}> = [
  { key: 'leechSeed', label: 'Leech Seed', icon: Droplets, tone: 'border-border bg-surface text-text' },
  { key: 'binding', label: 'Bound', icon: Wind, tone: 'border-border bg-surface text-text' },
  { key: 'yawn', label: 'Drowsy', icon: Wind, tone: 'border-border bg-surface text-text' },
  { key: 'aquaRing', label: 'Aqua Ring', icon: Droplets, tone: 'border-border bg-surface text-text' },
  { key: 'wish', label: 'Wish', icon: Wind, tone: 'border-border bg-surface text-text' },
  { key: 'damageDealtThisTurn', label: 'Damage Tracker', icon: Flame, tone: 'border-border bg-surface text-text' },
];

export function ResidualEffectsPanel({ pokemon }: ResidualEffectsPanelProps) {
  const entries = VOLATILE_DISPLAY
    .map(entry => {
      const value = pokemon.volatile?.[entry.key];
      if (!value) return null;
      let badge: string | null = null;
      if (typeof value === 'object' && 'turns' in value && typeof value.turns === 'number') {
        badge = String(value.turns);
      } else if (entry.key === 'damageDealtThisTurn' && typeof value === 'number') {
        badge = `${value}`;
      }
      return { ...entry, badge };
    })
    .filter(Boolean) as Array<{
      key: keyof BattlePokemon['volatile'];
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      tone: string;
      badge: string | null;
    }>;

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-3 shadow-card backdrop-blur">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Residual Effects</h4>
      <div className="flex flex-wrap gap-2 text-sm text-text">
        {entries.map(({ key, label, icon: Icon, tone, badge }) => (
          <span
            key={String(key)}
            className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90', tone)}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && <span className="rounded-full bg-white/20 px-1 text-[10px] text-white/90">{badge}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

