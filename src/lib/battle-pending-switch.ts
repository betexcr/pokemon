// Multiplayer protocol for player-chosen pivot replacements (U-turn, Volt Switch, Flip Turn,
// Parting Shot, Baton Pass).
//
// When a pivot needs a pick, resolveTurn persists the half-finished turn and sets
// `meta.pendingSwitch` while staying on the same turn number, bumps `meta.version` and clears that
// turn's choices. Only the pivoting player then submits, and the submission must be a switch to one
// of the stored options. The rest of the turn (hidden from clients, since it holds the other
// player's queued action) waits under the Admin-only `battles/{id}/server/pendingTurn`.

import type { BattleAction, BattleState, PendingSwitchReason } from './team-battle-engine';

export type PendingSwitchMeta = { uid: string; reason: PendingSwitchReason; options?: number[] };

/** End-of-turn faint replacements: every listed player picks (simultaneously) before choosing moves. */
export type PendingReplacementMeta = { uids: string[] };

/** Server-only snapshot of a paused turn. */
export type StoredPendingTurn = {
  turn: number;
  side: 'player' | 'opponent';
  reason: PendingSwitchReason;
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
  pendingReplacement?: PendingReplacementMeta | null;
};

/** UIDs whose choice this turn (or turn segment) needs before it can resolve. */
export function requiredChoiceUids(meta: MetaLike): string[] {
  if (meta.pendingSwitch?.uid) return [meta.pendingSwitch.uid];
  if (meta.pendingReplacement?.uids?.length) return [...meta.pendingReplacement.uids];
  return [meta.players.p1.uid, meta.players.p2.uid];
}

/** True while the battle waits on a switch-only pick (pivot or faint replacement). */
export function hasPendingPick(meta: MetaLike): boolean {
  return !!meta.pendingSwitch?.uid || !!meta.pendingReplacement?.uids?.length;
}

export function allRequiredChoicesPresent(meta: MetaLike, choices: Record<string, unknown> | null | undefined): boolean {
  if (!choices) return false;
  return requiredChoiceUids(meta).every((uid) => !!choices[uid]);
}

/** RTDB rejects `undefined`; round-trip through JSON to drop it. */
export function toRtdbValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
