import { BattlePokemon } from './team-battle-engine';
import { FieldTerrain } from './team-battle-types';
import type { BattleState } from './team-battle-engine';
import { BattleRng, rngRollChance } from './battle-rng';

export function applyStatus(pokemon: BattlePokemon, status: BattlePokemon['status']): void {
  pokemon.status = status;
  pokemon.statusTurns = 0;
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

export function incrementStatusTurns(pokemon: BattlePokemon): void {
  if (pokemon.status != null) {
    pokemon.statusTurns = (pokemon.statusTurns ?? 0) + 1;
  }
}

export function isGrounded(pokemon: BattlePokemon): boolean {
  const types = pokemon.pokemon.types.map(t => typeof t === 'string' ? t : t.type?.name || '');
  return !types.includes('flying');
}

export function terrainPreventsStatus(terrain: FieldTerrain['kind'] | undefined, pokemon: BattlePokemon, status: BattlePokemon['status']): boolean {
  if (!terrain) return false;
  if (!isGrounded(pokemon)) return false;

  if (terrain === 'electric' && status === 'asleep') {
    return true;
  }

  if (terrain === 'misty' && ['poisoned', 'badly-poisoned', 'burned', 'paralyzed', 'asleep'].includes(status ?? '')) {
    return true;
  }

  return false;
}

export function applyStartOfTurnStatus(state: BattleState, pokemon: BattlePokemon, rng: BattleRng): void {
  if (pokemon.status === 'asleep') {
    incrementStatusTurns(pokemon);
    if ((pokemon.statusTurns ?? 0) >= 3) {
      clearStatus(pokemon);
      state.battleLog.push({
        type: 'status_effect',
        message: `${pokemon.pokemon.name} woke up!`,
        pokemon: pokemon.pokemon.name,
      });
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
      pokemon.volatile.toxicCounter = pokemon.volatile.toxicCounter || (pokemon.status === 'badly-poisoned' ? 1 : 0);
      if (pokemon.status === 'badly-poisoned') {
        pokemon.volatile.toxicCounter += 1;
      }
      const fraction = pokemon.status === 'badly-poisoned'
        ? Math.min(16, pokemon.volatile.toxicCounter ?? 1) / 16
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
    default:
      break;
  }
}


