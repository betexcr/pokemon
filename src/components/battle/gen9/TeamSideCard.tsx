import { ChevronRight, HeartPulse, ShieldAlert } from 'lucide-react';
import type { BattleTeam, BattlePokemon } from '@/lib/team-battle-engine';
import { TypePillList } from './TypePill';
import { StatusSummary } from './StatusSummary';
import { ScreenStatusChips } from './ScreenStatusChips';
import { cn, formatPokemonName } from '@/lib/utils';

interface TeamSideCardProps {
  team: BattleTeam;
  side: 'player' | 'opponent';
  title: string;
}

function renderBenchSlot(pokemon: BattlePokemon | undefined, index: number, isActive: boolean) {
  if (!pokemon) return null;
  const currentHpPct = Math.max(0, Math.round((pokemon.currentHp / Math.max(1, pokemon.maxHp)) * 100));
  return (
    <div
      key={pokemon.pokemon.name + index}
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm',
        pokemon.currentHp <= 0 && 'opacity-40 grayscale'
      )}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-slate-100">#{index + 1} · {formatPokemonName(pokemon.pokemon.name)}</span>
        <TypePillList types={pokemon.pokemon.types.map(entry => typeof entry === 'string' ? entry : entry.type?.name)} />
      </div>
      <div className="flex flex-col items-end text-xs">
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
            pokemon.currentHp > 0
              ? 'border-green-500/40 bg-green-500/10 text-green-700'
              : 'border-red-500/40 bg-red-500/10 text-red-700'
          )}
        >
          {pokemon.currentHp > 0 ? `${currentHpPct}%` : 'Fainted'}
        </span>
        {isActive && (
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted">
            Active <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );
}

export function TeamSideCard({ team, side, title }: TeamSideCardProps) {
  const active = team.pokemon[team.currentIndex];
  if (!active) return null;

  const bench = team.pokemon.map((p, idx) => renderBenchSlot(p, idx, idx === team.currentIndex)).filter(Boolean);

  const hazardCount = Object.values(team.sideConditions?.hazards ?? {}).some(value => {
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'object' && value !== null) return (value as any).turns > 0;
    return Boolean(value);
  });

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-surface/80 p-4 shadow-card backdrop-blur">
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
        <span>{title}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
          {side === 'player' ? 'You' : 'Opponent'}
        </span>
      </header>

      <section className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100">{formatPokemonName(active.pokemon.name)}</h3>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted">
                Lv {active.level}
              </span>
            </div>
            <TypePillList types={active.pokemon.types.map(entry => typeof entry === 'string' ? entry : entry.type?.name)} />
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-green-700">
                <HeartPulse className="h-3 w-3" />
                {active.currentHp} / {active.maxHp}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">
                Spe {Math.round(active.statModifiers.speed ?? 0)}
              </span>
            </div>
          </div>
          {active.status && <StatusSummary pokemon={active} />}
        </div>

        {team.sideConditions?.screens && (
          <div className="mt-2">
            <ScreenStatusChips screens={team.sideConditions.screens as any} />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
          <ShieldAlert className="h-4 w-4" />
          Party Status
        </div>
        <div className="space-y-2">
          {bench}
        </div>
      </section>
    </div>
  );
}

