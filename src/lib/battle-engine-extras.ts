// Engine state the RTDB public/private projections do not carry (Tailwind, Safeguard, Mist, Lucky Chant,
// Healing Wish, Future Sight, Fairy Lock, Retaliate / Copycat bookkeeping). Stored Admin-only under
// `battles/{id}/server/engineExtras` and restored by `fetchBattleState` before each resolution.

import type { BattleState, BattleTeam } from './team-battle-engine';

type SideExtras = {
  tailwind?: number;
  safeguard?: number;
  mist?: number;
  luckyChant?: number;
  healingWish?: 'healing-wish' | 'lunar-dance';
  futureAttack?: NonNullable<BattleTeam['sideConditions']['futureAttack']>;
  lastFaintTurn?: number;
  faintTally?: number;
};

export type EngineExtras = {
  p1: SideExtras;
  p2: SideExtras;
  fairyLock?: number;
  lastMoveInBattle?: string;
  /** HP lost per side (end-of-battle stats). */
  battleStats?: { p1: { damageTaken: number }; p2: { damageTaken: number } };
};

/** RTDB rejects `undefined`: keep only defined keys. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function captureSide(team: BattleTeam): SideExtras {
  const sc = team.sideConditions;
  return compact({
    tailwind: sc.tailwind?.turns ?? sc.screens.tailwind?.turns,
    safeguard: sc.screens.safeguard?.turns,
    mist: sc.screens.mist?.turns,
    luckyChant: sc.luckyChant?.turns,
    healingWish: sc.healingWish,
    futureAttack: sc.futureAttack ? compact({ ...sc.futureAttack }) : undefined,
    lastFaintTurn: team.lastFaintTurn,
    faintTally: team.faintTally,
  });
}

export function captureEngineExtras(state: BattleState): EngineExtras {
  return compact({
    p1: captureSide(state.player),
    p2: captureSide(state.opponent),
    fairyLock: state.field.rooms?.fairyLock?.turns,
    lastMoveInBattle: state.lastMoveInBattle,
    battleStats: state.battleStats,
  });
}

function applySide(team: BattleTeam, extras: SideExtras | undefined): void {
  if (!extras) return;
  const sc = team.sideConditions;
  // Tailwind lives on screens.tailwind
  if (extras.tailwind) sc.screens.tailwind = { turns: extras.tailwind };
  if (extras.safeguard) sc.screens.safeguard = { turns: extras.safeguard };
  if (extras.mist) sc.screens.mist = { turns: extras.mist };
  if (extras.luckyChant) sc.luckyChant = { turns: extras.luckyChant };
  if (extras.healingWish) sc.healingWish = extras.healingWish;
  if (extras.futureAttack) sc.futureAttack = { ...extras.futureAttack, attackerTypes: [...(extras.futureAttack.attackerTypes ?? [])] };
  if (typeof extras.lastFaintTurn === 'number') team.lastFaintTurn = extras.lastFaintTurn;
  if (typeof extras.faintTally === 'number') team.faintTally = extras.faintTally;
}

export function applyEngineExtras(state: BattleState, extras: EngineExtras | null | undefined): void {
  if (!extras) return;
  applySide(state.player, extras.p1);
  applySide(state.opponent, extras.p2);
  if (extras.fairyLock) {
    if (!state.field.rooms) state.field.rooms = {};
    state.field.rooms.fairyLock = { turns: extras.fairyLock };
  }
  if (extras.lastMoveInBattle) state.lastMoveInBattle = extras.lastMoveInBattle;
  if (extras.battleStats?.p1 && extras.battleStats?.p2) {
    state.battleStats = {
      p1: { damageTaken: Number(extras.battleStats.p1.damageTaken) || 0 },
      p2: { damageTaken: Number(extras.battleStats.p2.damageTaken) || 0 },
    };
  }
}
