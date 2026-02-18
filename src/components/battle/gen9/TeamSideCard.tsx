import { ChevronRight, HeartPulse, ShieldAlert } from 'lucide-react';
import type { BattleTeam, BattlePokemon } from '@/lib/team-battle-engine';
import { TypePillList } from './TypePill';
import { StatusSummary } from './StatusSummary';
import { ScreenStatusChips } from './ScreenStatusChips';
import { cn, formatPokemonName, getPokemonImageWithFallbacks, getPokemonBattleSpriteUrl } from '@/lib/utils';

interface TeamSideCardProps {
  team: BattleTeam;
  side: 'player' | 'opponent';
  title: string;
}

function renderBenchSlot(pokemon: BattlePokemon | undefined, index: number, isActive: boolean) {
  if (!pokemon) return null;
  const currentHpPct = Math.max(0, Math.round((pokemon.currentHp / Math.max(1, pokemon.maxHp)) * 100));
  const isFainted = pokemon.currentHp <= 0;
  const spriteUrl = getPokemonBattleSpriteUrl(pokemon.pokemon.id);

  return (
    <div
      key={pokemon.pokemon.name + index}
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm transition-all',
        isFainted ? 'opacity-50 grayscale bg-surface/50 cursor-not-allowed' : 'hover:bg-surface/80',
        isActive && 'ring-1 ring-poke-blue/50 bg-poke-blue/5'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Pixel Sprite */}
        <div className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl}
            alt={pokemon.pokemon.name}
            className="w-full h-full object-contain pixelated"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        <div className="flex flex-col">
          <span className={cn("font-semibold", isFainted ? "text-muted" : "text-slate-100")}>
            {formatPokemonName(pokemon.pokemon.name)}
          </span>
          {!isFainted && (
            <TypePillList types={pokemon.pokemon.types.map(entry => typeof entry === 'string' ? entry : entry.type?.name)} />
          )}
        </div>
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

  // Determine image variant based on side
  // Player side = back view, Opponent side = front view
  const imageVariant = side === 'player' ? 'back' : 'front';
  const activeImage = getPokemonImageWithFallbacks(active.pokemon.id, active.pokemon.name, imageVariant);

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100" data-testid={`pokemon-name-${side}`}>{formatPokemonName(active.pokemon.name)}</h3>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted">
                Lv {active.level}
              </span>
            </div>
            <TypePillList types={active.pokemon.types.map(entry => typeof entry === 'string' ? entry : entry.type?.name)} />

            {/* Active Pokemon Image */}
            <div className="my-2 flex justify-center h-32 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.primary}
                alt={active.pokemon.name}
                className="max-h-full object-contain drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-green-700" data-testid={`hp-bar-${side}`}>
                <HeartPulse className="h-3 w-3" />
                {active.currentHp} / {active.maxHp}
              </span>

              {/* Stats Display */}
              <div className="col-span-2 grid grid-cols-3 gap-1 mt-1">
                {Object.entries(active.statModifiers).map(([stat, value]) => {
                  if (value === 0) return null;
                  return (
                    <span key={stat} className={cn(
                      "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium",
                      value > 0 ? "bg-blue-500/10 text-blue-300 border border-blue-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"
                    )}>
                      {stat.slice(0, 3).toUpperCase()} {value > 0 ? '+' : ''}{value}
                    </span>
                  );
                })}
              </div>
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

