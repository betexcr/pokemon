import type { BattlePokemon, BattleState } from './team-battle-engine';
import type { BattleRng } from './battle-rng';
import { rngNextInt } from './battle-rng';
import {
  RAMPAGE_MOVES,
  RECHARGE_MOVES,
  TWO_TURN_MOVES,
  TWO_TURN_WEATHER_SKIP,
} from './battle-move-constants';

export const RECHARGE_MOVE_ID = '__recharge__';

/** Forced action when locked into rampage / charge-complete / recharge. */
export function getForcedBattleMoveId(pokemon: BattlePokemon): string | null {
  if (pokemon.volatile.mustRecharge) return RECHARGE_MOVE_ID;
  if (pokemon.volatile.twoTurn?.kind === 'pending') return pokemon.volatile.twoTurn.move;
  if (pokemon.volatile.rampage && pokemon.volatile.rampage.turnsLeft > 0) {
    return pokemon.volatile.rampage.move;
  }
  return null;
}

export function isRampageMove(moveId: string): boolean {
  return RAMPAGE_MOVES.has(moveId.toLowerCase());
}

export function isRechargeMove(moveId: string): boolean {
  return RECHARGE_MOVES.has(moveId.toLowerCase());
}

export function getTwoTurnKind(moveId: string): 'semi' | 'charge' | null {
  return TWO_TURN_MOVES[moveId.toLowerCase()] ?? null;
}

export function shouldSkipTwoTurnCharge(moveId: string, weatherKind?: string | null): boolean {
  const need = TWO_TURN_WEATHER_SKIP[moveId.toLowerCase()];
  if (!need) return false;
  return weatherKind === need;
}

/** After a successful damaging hit of a rampage move — start or continue the lock. */
export function applyRampageAfterHit(
  state: BattleState,
  attacker: BattlePokemon,
  moveId: string,
  rng: BattleRng
): void {
  const id = moveId.toLowerCase();
  if (!RAMPAGE_MOVES.has(id)) return;

  if (!attacker.volatile.rampage || attacker.volatile.rampage.move !== id) {
    // Total duration 2–3 turns including this turn → remaining after this hit: 1–2
    const remaining = 1 + rngNextInt(rng, 2);
    attacker.volatile.rampage = { move: id, turnsLeft: remaining };
    return;
  }

  attacker.volatile.rampage.turnsLeft -= 1;
  if (attacker.volatile.rampage.turnsLeft <= 0) {
    endRampageWithConfusion(state, attacker);
  }
}

/** End rampage early (flinch / status fail / switch) and confuse. */
export function endRampageWithConfusion(state: BattleState, pokemon: BattlePokemon): void {
  if (!pokemon.volatile.rampage) return;
  pokemon.volatile.rampage = undefined;
  if (!pokemon.volatile.confusion && pokemon.currentHp > 0) {
    pokemon.volatile.confusion = { turns: 2 + rngNextInt(state.rng, 4) };
    state.battleLog.push({
      type: 'status_applied',
      message: `${pokemon.pokemon.name} became confused due to fatigue!`,
      pokemon: pokemon.pokemon.name,
      status: 'CONFUSED',
    });
  }
}

export function beginTwoTurnCharge(
  state: BattleState,
  attacker: BattlePokemon,
  moveId: string
): void {
  const id = moveId.toLowerCase();
  const kind = getTwoTurnKind(id);
  if (!kind) return;
  attacker.volatile.twoTurn = { move: id, kind: 'charging' };
  attacker.volatile.semiInvulnerable = kind === 'semi' ? id : undefined;
  const messages: Record<string, string> = {
    dig: `${attacker.pokemon.name} dug underground!`,
    fly: `${attacker.pokemon.name} flew up high!`,
    dive: `${attacker.pokemon.name} hid underwater!`,
    bounce: `${attacker.pokemon.name} sprang up!`,
    'phantom-force': `${attacker.pokemon.name} vanished instantly!`,
    'shadow-force': `${attacker.pokemon.name} vanished instantly!`,
  };
  state.battleLog.push({
    type: 'status_effect',
    message: messages[id] || `${attacker.pokemon.name} is preparing to attack!`,
    pokemon: attacker.pokemon.name,
  });
}

export function completeTwoTurnCharge(attacker: BattlePokemon): void {
  if (attacker.volatile.twoTurn?.kind === 'charging') {
    attacker.volatile.twoTurn = { move: attacker.volatile.twoTurn.move, kind: 'pending' };
  }
}

export function clearTwoTurnState(attacker: BattlePokemon): void {
  attacker.volatile.twoTurn = undefined;
  attacker.volatile.semiInvulnerable = undefined;
}

export function scheduleRecharge(attacker: BattlePokemon, moveId: string): void {
  if (!isRechargeMove(moveId)) return;
  attacker.volatile.mustRecharge = true;
}

export function clearForcedLocksOnSwitch(pokemon: BattlePokemon): void {
  pokemon.volatile.rampage = undefined;
  pokemon.volatile.mustRecharge = undefined;
  pokemon.volatile.twoTurn = undefined;
  pokemon.volatile.semiInvulnerable = undefined;
}
