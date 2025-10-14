"use client";

import { FieldWeatherBanner } from './FieldWeatherBanner';
import { TeamSideCard } from './TeamSideCard';
import { ActionQueueCard } from './ActionQueueCard';
import { BattleLogPanel } from './BattleLogPanel';
import { HazardRow } from './HazardIcon';
import { ResidualEffectsPanel } from './ResidualEffectsPanel';
import type { BattleState } from '@/lib/team-battle-engine';
import { cn } from '@/lib/utils';

interface BattleViewportProps {
  state: BattleState | null;
  className?: string;
}

export function BattleViewport({ state, className }: BattleViewportProps) {
  if (!state) {
    return (
      <div className={cn('rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-center text-sm text-slate-300', className)}>
        Waiting for battle state…
      </div>
    );
  }

  const trickRoomActive = Boolean(state.field?.rooms?.trickRoom);

  return (
    <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]', className)}>
      <div className="space-y-4">
        <FieldWeatherBanner weather={state.field?.weather as any} terrain={state.field?.terrain as any} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <TeamSideCard team={state.player} side="player" title="Your Side" />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Our Hazards</h4>
              <HazardRow hazards={state.player.sideConditions?.hazards as any} />
            </div>
          </div>
          <div className="space-y-3">
            <TeamSideCard team={state.opponent} side="opponent" title="Opposing Side" />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Their Hazards</h4>
              <HazardRow hazards={state.opponent.sideConditions?.hazards as any} />
            </div>
          </div>
        </div>

        <ResidualEffectsPanel pokemon={state.player.pokemon[state.player.currentIndex]} />

        <ActionQueueCard queue={state.actionQueue} trickRoomActive={trickRoomActive} />
      </div>

      <BattleLogPanel log={state.battleLog} />
    </div>
  );
}


