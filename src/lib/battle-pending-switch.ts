// Multiplayer protocol for player-chosen pivot replacements (U-turn, Volt Switch, Flip Turn,
// Parting Shot, Baton Pass).
//
// When a pivot needs a pick, resolveTurn persists the half-finished turn and sets
// `meta.pendingSwitch` while staying on the same turn number, bumps `meta.version` and clears that
// turn's choices. Only the pivoting player then submits, and the submission must be a switch to one
// of the stored options. The rest of the turn (hidden from clients, since it holds the other
// player's queued action) waits under the Admin-only `battles/{id}/server/pendingTurn`.

import type { BattleAction, BattleState } from './team-battle-engine';

export type PendingSwitchMeta = { uid: string; reason: 'pivot' | 'baton-pass' };

/** Server-only snapshot of a paused turn. */
export type StoredPendingTurn = {
  turn: number;
  side: 'player' | 'opponent';
  reason: 'pivot' | 'baton-pass';
  options: number[];
  remainingQueue: BattleState['actionQueue'];
  activeAtTurnStart?: { player: number; opponent: number };
  /** Log of the turn so far, so the finished turn shows in full. */
  battleLog: BattleState['battleLog'];
  p1Action: BattleAction;
  p2Action: BattleAction;
  validation: { p1: string | null; p2: string | null; normalized: boolean };
};

type MetaLike = {
  players: { p1: { uid: string }; p2: { uid: string } };
  pendingSwitch?: PendingSwitchMeta | null;
};

/** UIDs whose choice this turn (or turn segment) needs before it can resolve. */
export function requiredChoiceUids(meta: MetaLike): string[] {
  if (meta.pendingSwitch?.uid) return [meta.pendingSwitch.uid];
  return [meta.players.p1.uid, meta.players.p2.uid];
}

export function allRequiredChoicesPresent(meta: MetaLike, choices: Record<string, unknown> | null | undefined): boolean {
  if (!choices) return false;
  return requiredChoiceUids(meta).every((uid) => !!choices[uid]);
}

/** RTDB rejects `undefined`; round-trip through JSON to drop it. */
export function toRtdbValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
