import { BattlePokemon, BattleTeam, getCurrentPokemon } from './team-battle-engine';
import { SideHazards } from './team-battle-types';

export function calculateStealthRockDamage(pokemon: BattlePokemon): number {
  const types = pokemon.pokemon.types.map(t => (typeof t === 'string' ? t : t.type?.name || ''));
  const rockEffectiveness = types.reduce((multiplier, type) => {
    switch (type) {
      case 'Bug':
      case 'Fire':
      case 'Flying':
      case 'Ice':
        return multiplier * 2;
      case 'Fighting':
      case 'Ground':
      case 'Steel':
        return multiplier * 0.5;
      default:
        return multiplier;
    }
  }, 1);

  const fraction = 1 / 8 * rockEffectiveness;
  return Math.floor(pokemon.maxHp * fraction);
}

export function calculateSpikesDamage(pokemon: BattlePokemon, layers: number): number {
  if (layers <= 0) return 0;
  const types = pokemon.pokemon.types.map(t => (typeof t === 'string' ? t : t.type?.name || ''));
  if (types.includes('Flying') || types.includes('Levitate')) return 0;
  const fractions = [0, 1 / 8, 1 / 6, 1 / 4];
  const fraction = fractions[Math.max(0, Math.min(3, layers))];
  return Math.floor(pokemon.maxHp * fraction);
}

export function applyHazards(pokemon: BattlePokemon, hazards: SideHazards): { damage: number; poisoned?: 'poisoned' | 'badly-poisoned'; speedDrop?: boolean } {
  let damage = 0;
  let poisoned: 'poisoned' | 'badly-poisoned' | undefined;
  let speedDrop = false;

  if (hazards.stealthRock) {
    damage += calculateStealthRockDamage(pokemon);
  }

  if (hazards.spikes > 0) {
    damage += calculateSpikesDamage(pokemon, hazards.spikes);
  }

  if (hazards.toxicSpikes > 0) {
    const types = pokemon.pokemon.types.map(t => (typeof t === 'string' ? t : t.type?.name || ''));
    const grounded = !types.includes('Flying');
    if (grounded && !pokemon.status) {
      if (types.includes('Poison')) {
        // Absorb toxic spikes
        hazards.toxicSpikes = 0;
      } else {
        poisoned = hazards.toxicSpikes === 2 ? 'badly-poisoned' : 'poisoned';
      }
    }
  }

  if (hazards.stickyWeb) {
    const types = pokemon.pokemon.types.map(t => (typeof t === 'string' ? t : t.type?.name || ''));
    const grounded = !types.includes('Flying');
    if (grounded) {
      speedDrop = true;
    }
  }

  return { damage, poisoned, speedDrop };
}


