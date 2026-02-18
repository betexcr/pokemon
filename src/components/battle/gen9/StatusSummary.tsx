import { Droplets, Flame, Skull, MoonStar, Zap } from 'lucide-react';
import type { BattlePokemon } from '@/lib/team-battle-engine';
import { cn } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  poisoned: { label: 'Poisoned', icon: Skull, tone: 'border-purple-400/40 bg-purple-500/10 text-purple-100' },
  'badly-poisoned': { label: 'Badly Poisoned', icon: Skull, tone: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100' },
  burned: { label: 'Burned', icon: Flame, tone: 'border-orange-400/40 bg-orange-500/10 text-orange-100' },
  paralyzed: { label: 'Paralyzed', icon: Zap, tone: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-100' },
  asleep: { label: 'Asleep', icon: MoonStar, tone: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100' },
  frozen: { label: 'Frozen', icon: Droplets, tone: 'border-blue-400/40 bg-blue-500/10 text-blue-100' },
};

interface StatusSummaryProps {
  pokemon: BattlePokemon;
}

export function StatusSummary({ pokemon }: StatusSummaryProps) {
  const primaryStatus = pokemon.status;
  if (!primaryStatus) return null;
  const meta = STATUS_META[primaryStatus] ?? STATUS_META.poisoned;
  const Icon = meta.icon;

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', meta.tone)} data-testid={`status-icon-${primaryStatus}`}>
      <Icon className="h-4 w-4" />
      {meta.label}
    </div>
  );
}


