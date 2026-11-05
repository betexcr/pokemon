// Per-side battle statistics for the end-of-battle screen (multiplayer). The server accumulates HP lost
// each turn (`state.battleStats`, persisted with the engine extras) and publishes a summary under
// `public/stats` every turn.

import type { BattleState, BattleTeam } from './team-battle-engine';

export type SideTotals = { damageTaken: number };
export type BattleTotals = { p1: SideTotals; p2: SideTotals };

export type PublicSideStats = {
  /** Opposing Pokémon knocked out. */
  kos: number;
  /** Own Pokémon still able to battle. */
  remaining: number;
  teamSize: number;
  /** HP dealt to the opposing team, as a percentage of its total max HP. */
  damageDealtPct: number;
  /** HP lost by this team, as a percentage of its total max HP. */
  damageTakenPct: number;
};
export type PublicBattleStats = { p1: PublicSideStats; p2: PublicSideStats };

/** HP of every team member, to compare before and after a turn. */
export function hpSnapshot(state: Pick<BattleState, 'player' | 'opponent'>): { p1: number[]; p2: number[] } {
  return { p1: state.player.pokemon.map((p) => p.currentHp), p2: state.opponent.pokemon.map((p) => p.currentHp) };
}

/** HP lost since the snapshot (healing does not offset damage). */
function hpLost(team: BattleTeam, before: number[]): number {
  return team.pokemon.reduce((sum, p, i) => sum + Math.max(0, (before[i] ?? p.currentHp) - p.currentHp), 0);
}

export function accumulateBattleTotals(
  state: Pick<BattleState, 'player' | 'opponent' | 'battleStats'>,
  before: { p1: number[]; p2: number[] },
): BattleTotals {
  const prev = state.battleStats ?? { p1: { damageTaken: 0 }, p2: { damageTaken: 0 } };
  const next = {
    p1: { damageTaken: prev.p1.damageTaken + hpLost(state.player, before.p1) },
    p2: { damageTaken: prev.p2.damageTaken + hpLost(state.opponent, before.p2) },
  };
  state.battleStats = next;
  return next;
}

const totalMaxHp = (team: BattleTeam) => Math.max(1, team.pokemon.reduce((s, p) => s + p.maxHp, 0));
const pct = (n: number, d: number) => Math.round((n / d) * 1000) / 10;

export function publicBattleStats(state: Pick<BattleState, 'player' | 'opponent' | 'battleStats'>): PublicBattleStats {
  const totals = state.battleStats ?? { p1: { damageTaken: 0 }, p2: { damageTaken: 0 } };
  const side = (own: BattleTeam, foe: BattleTeam, ownTaken: number, foeTaken: number): PublicSideStats => ({
    kos: foe.pokemon.filter((p) => p.currentHp <= 0).length,
    remaining: own.pokemon.filter((p) => p.currentHp > 0).length,
    teamSize: own.pokemon.length,
    damageDealtPct: pct(foeTaken, totalMaxHp(foe)),
    damageTakenPct: pct(ownTaken, totalMaxHp(own)),
  });
  return {
    p1: side(state.player, state.opponent, totals.p1.damageTaken, totals.p2.damageTaken),
    p2: side(state.opponent, state.player, totals.p2.damageTaken, totals.p1.damageTaken),
  };
}
