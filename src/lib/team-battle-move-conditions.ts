// Move "onTry" conditions: checks that make a move fail before its accuracy roll.
//
// - Fake Out / First Impression: only on the user's first move action since entering the field.
// - Sucker Punch / Thunderclap: only when the target is about to use a damaging move this turn.
// - Counter / Mirror Coat / Metal Burst: only when the user took qualifying damage earlier this turn.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { getCachedMove, getMove } from './moveCache';
import { RECHARGE_MOVE_ID } from './battle-multiturn';

type QueueAction = BattleState['actionQueue'][number];

/** Moves that fail unless this is the user's first move action since it entered the field. */
export const FIRST_TURN_ONLY_MOVES = new Set(['fake-out', 'first-impression']);

/** Moves that fail unless the target has a damaging move queued after the user this turn. */
export const TARGET_MUST_ATTACK_MOVES = new Set(['sucker-punch', 'thunderclap']);

/** Damage-returning moves: which damage category they reflect and the multiplier applied. */
export const COUNTER_MOVES: Record<string, { category: 'Physical' | 'Special' | 'any'; multiplier: number }> = {
  counter: { category: 'Physical', multiplier: 2 },
  'mirror-coat': { category: 'Special', multiplier: 2 },
  'metal-burst': { category: 'any', multiplier: 1.5 },
  comeuppance: { category: 'any', multiplier: 1.5 },
};

/**
 * Damage a Counter-family move deals, or null when it has nothing to return
 * (user was not hit this turn, or was hit by the wrong category).
 */
export function getCounterDamage(user: BattlePokemon, moveId: string): number | null {
  const rule = COUNTER_MOVES[moveId.toLowerCase()];
  if (!rule) return null;
  const taken = user.volatile.lastDamageTaken;
  if (!taken || taken.amount <= 0) return null;
  if (rule.category !== 'any' && taken.category !== rule.category) return null;
  return Math.max(1, Math.floor(taken.amount * rule.multiplier));
}

/** Record HP damage a Pokémon took from an opposing attack this turn (Counter / Mirror Coat / Metal Burst). */
export function recordDamageTaken(target: BattlePokemon, amount: number, category: unknown): void {
  if (amount <= 0) return;
  if (category !== 'Physical' && category !== 'Special') return;
  target.volatile.lastDamageTaken = { amount, category };
}

async function isDamagingMove(moveId: string): Promise<boolean> {
  const id = moveId.toLowerCase();
  if (id === RECHARGE_MOVE_ID) return false;
  let move = getCachedMove(id);
  if (!move) {
    try {
      move = (await getMove(id)) ?? undefined;
    } catch {
      move = undefined;
    }
  }
  // Unknown move data: assume it attacks rather than failing the user's move on a cache miss.
  if (!move) return true;
  return move.category !== 'Status';
}

/** Actions still to run after `action` in this turn's queue. */
function remainingActions(state: BattleState, action: QueueAction): QueueAction[] {
  const queue = state.actionQueue ?? [];
  const idx = queue.indexOf(action);
  return idx >= 0 ? queue.slice(idx + 1) : queue.filter((a) => a !== action);
}

/**
 * Returns true when the move fails its pre-accuracy condition.
 * Expects `attacker.volatile.moveActionsSinceEntry` to already count the current action.
 */
export async function moveFailsTryCondition(
  state: BattleState,
  action: QueueAction,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
): Promise<boolean> {
  const id = moveId.toLowerCase();

  if (FIRST_TURN_ONLY_MOVES.has(id)) {
    return (attacker.volatile.moveActionsSinceEntry ?? 1) > 1;
  }

  if (TARGET_MUST_ATTACK_MOVES.has(id)) {
    if (defender.currentHp <= 0 || defender.volatile.mustRecharge) return true;
    const targetSide = action.user === 'player' ? 'opponent' : 'player';
    const pending = remainingActions(state, action).find(
      (a) => a.user === targetSide && (a.type === 'move' || a.type === 'pursuit') && a.moveId,
    );
    if (!pending?.moveId) return true;
    return !(await isDamagingMove(pending.moveId));
  }

  if (COUNTER_MOVES[id]) {
    return getCounterDamage(attacker, id) === null;
  }

  return false;
}
