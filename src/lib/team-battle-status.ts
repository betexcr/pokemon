import { BattlePokemon, BattleTeam } from './team-battle-engine';
import { FieldTerrain } from './team-battle-types';
import type { BattleState } from './team-battle-engine';
import { BattleRng, rngNextInt, rngRollChance } from './battle-rng';
import { isGrounded } from './team-battle-hazards';
export { isGrounded } from './team-battle-hazards';

/** Per-turn chance to wake at start of turn while asleep (Gen 1–4 style early wake). */
export const SLEEP_EARLY_WAKE_CHANCE = 0.3;

export type ApplyStatusOptions = {
  /** Remaining sleep turns (Rest uses 2). */
  sleepTurns?: number;
  /** Assign random sleep duration 1–3 when applying sleep. */
  rng?: BattleRng;
};

const STATUS_CURE_PHRASE: Record<NonNullable<BattlePokemon['status']>, string> = {
  paralyzed: 'paralysis',
  burned: 'its burn',
  poisoned: 'poison',
  'badly-poisoned': 'poison',
  asleep: 'sleep',
  frozen: 'freeze',
};

export function formatStatusCurePhrase(status: NonNullable<BattlePokemon['status']>): string {
  return STATUS_CURE_PHRASE[status] ?? status;
}

export function applyStatus(
  pokemon: BattlePokemon,
  status: BattlePokemon['status'],
  options?: ApplyStatusOptions,
): void {
  pokemon.status = status;
  if (status === 'asleep') {
    if (options?.sleepTurns != null) {
      pokemon.statusTurns = options.sleepTurns;
    } else if (options?.rng) {
      pokemon.statusTurns = 1 + rngNextInt(options.rng, 3);
    } else {
      pokemon.statusTurns = 2;
    }
  } else {
    pokemon.statusTurns = undefined;
  }
  if (status === 'badly-poisoned') {
    pokemon.volatile.toxicCounter = 1;
  } else if (status !== 'poisoned') {
    pokemon.volatile.toxicCounter = undefined;
  }
}

export function clearStatus(pokemon: BattlePokemon): void {
  pokemon.status = undefined;
  pokemon.statusTurns = undefined;
  pokemon.volatile.toxicCounter = undefined;
}

function logStatusCure(state: BattleState, pokemon: BattlePokemon, status: NonNullable<BattlePokemon['status']>): void {
  state.battleLog.push({
    type: 'status_effect',
    message: `${pokemon.pokemon.name} was cured of ${formatStatusCurePhrase(status)}!`,
    pokemon: pokemon.pokemon.name,
  });
}

/** Cure non-volatile status on all Pokémon in a team (Heal Bell / Aromatherapy). Returns count cured. */
export function cureTeamStatuses(
  state: BattleState,
  team: BattleTeam,
  move: 'heal-bell' | 'aromatherapy',
  userName: string,
): number {
  const toCure = team.pokemon.filter((p) => p.status);
  if (toCure.length === 0) return 0;

  if (move === 'heal-bell') {
    state.battleLog.push({ type: 'status_effect', message: 'A bell chimed!' });
  } else {
    state.battleLog.push({
      type: 'status_effect',
      message: `${userName} cured its team's status problems!`,
      pokemon: userName,
    });
  }

  let count = 0;
  for (const mon of toCure) {
    const oldStatus = mon.status!;
    clearStatus(mon);
    count += 1;
    if (move === 'heal-bell') {
      logStatusCure(state, mon, oldStatus);
    }
  }
  return count;
}

export function terrainPreventsStatus(terrain: FieldTerrain['kind'] | undefined, pokemon: BattlePokemon, status: BattlePokemon['status']): boolean {
  if (!terrain) return false;
  if (!isGrounded(pokemon)) return false;

  if (terrain === 'electric' && status === 'asleep') {
    return true;
  }

  if (terrain === 'misty' && ['poisoned', 'badly-poisoned', 'burned', 'paralyzed', 'asleep', 'frozen'].includes(status ?? '')) {
    return true;
  }

  return false;
}

function tryWakeFromSleep(state: BattleState, pokemon: BattlePokemon): boolean {
  if (pokemon.status !== 'asleep') return false;
  clearStatus(pokemon);
  state.battleLog.push({
    type: 'status_effect',
    message: `${pokemon.pokemon.name} woke up!`,
    pokemon: pokemon.pokemon.name,
  });
  return true;
}

export function applyStartOfTurnStatus(state: BattleState, pokemon: BattlePokemon, rng: BattleRng): void {
  if (pokemon.status === 'asleep') {
    if (rngRollChance(rng, SLEEP_EARLY_WAKE_CHANCE)) {
      tryWakeFromSleep(state, pokemon);
    }
  }

  if (pokemon.status === 'frozen') {
    if (rngRollChance(rng, 0.2)) {
      clearStatus(pokemon);
      state.battleLog.push({
        type: 'status_effect',
        message: `${pokemon.pokemon.name} thawed out!`,
        pokemon: pokemon.pokemon.name,
      });
    }
  }
}

export function applyEndOfTurnStatus(state: BattleState, pokemon: BattlePokemon): void {
  if (pokemon.currentAbility?.toLowerCase() === 'magic-guard') {
    return;
  }
  switch (pokemon.status) {
    case 'poisoned':
    case 'badly-poisoned': {
      // Poison Heal heals in processEndOfTurnAbilities instead of taking residual damage
      if (pokemon.currentAbility?.toLowerCase() === 'poison-heal') {
        if (pokemon.status === 'badly-poisoned') {
          if (!pokemon.volatile.toxicCounter) pokemon.volatile.toxicCounter = 1;
          pokemon.volatile.toxicCounter += 1;
        }
        break;
      }
      if (!pokemon.volatile.toxicCounter) {
        pokemon.volatile.toxicCounter = pokemon.status === 'badly-poisoned' ? 1 : 0;
      }
      const fraction = pokemon.status === 'badly-poisoned'
        ? Math.min(16, pokemon.volatile.toxicCounter) / 16
        : 1 / 8;
      const damage = Math.floor(pokemon.maxHp * fraction);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: 'status_damage',
          message: `${pokemon.pokemon.name} was hurt by poison!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round((damage / pokemon.maxHp) * 100),
        });
      }
      if (pokemon.status === 'badly-poisoned') {
        pokemon.volatile.toxicCounter += 1;
      }
      break;
    }
    case 'burned': {
      const damage = Math.floor(pokemon.maxHp / 16);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: 'status_damage',
          message: `${pokemon.pokemon.name} was hurt by its burn!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round((damage / pokemon.maxHp) * 100),
        });
      }
      break;
    }
    case 'asleep': {
      const remaining = pokemon.statusTurns ?? 1;
      pokemon.statusTurns = remaining - 1;
      if (pokemon.statusTurns <= 0) {
        tryWakeFromSleep(state, pokemon);
      }
      break;
    }
    default:
      break;
  }
}


