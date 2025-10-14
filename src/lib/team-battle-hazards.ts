import { BattlePokemon } from './team-battle-engine';
import { SideHazards } from './team-battle-types';
import { calculateTypeEffectiveness, TypeName } from './damage-calculator';

export function getPokemonTypes(pokemon: BattlePokemon): TypeName[] {
  return pokemon.pokemon.types
    .map(entry => (typeof entry === 'string' ? entry : entry.type?.name || ''))
    .filter((t): t is TypeName => Boolean(t)) as TypeName[];
}

export function stealthRockDamage(pokemon: BattlePokemon): number {
  const effectiveness = calculateTypeEffectiveness('Rock', getPokemonTypes(pokemon));
  const fraction = (1 / 8) * effectiveness;
  return Math.max(1, Math.floor(pokemon.maxHp * fraction));
}

export function isGrounded(pokemon: BattlePokemon): boolean {
  return !pokemon.pokemon.types.some(typeEntry => {
    const type = typeof typeEntry === 'string' ? typeEntry : typeEntry.type?.name || '';
    return type === 'Flying';
  });
}

export function spikesDamage(pokemon: BattlePokemon, layers: number): number {
  if (!isGrounded(pokemon)) {
    return 0;
  }

  const fractions = [0, 1 / 8, 1 / 6, 1 / 4];
  const fraction = fractions[Math.max(0, Math.min(layers, 3))];
  return Math.max(1, Math.floor(pokemon.maxHp * fraction));
}

export type HazardApplicationResult = {
  damage: number;
  absorbedToxicSpikes?: boolean;
  poisonStatus?: 'poisoned' | 'badly-poisoned';
  applyStickyWeb?: boolean;
};

export function applyEntryHazards(pokemon: BattlePokemon, hazards: SideHazards): HazardApplicationResult {
  let damage = 0;
  let absorbedToxicSpikes = false;
  let poisonStatus: 'poisoned' | 'badly-poisoned' | undefined;
  let applyStickyWeb = false;

  if (hazards.stealthRock) {
    damage += stealthRockDamage(pokemon);
  }

  if (hazards.spikes > 0) {
    damage += spikesDamage(pokemon, hazards.spikes);
  }

  if (hazards.toxicSpikes > 0 && isGrounded(pokemon)) {
    const isPoisonType = pokemon.pokemon.types.some(typeEntry => {
      const type = typeof typeEntry === 'string' ? typeEntry : typeEntry.type?.name || '';
      return type === 'Poison';
    });

    if (isPoisonType) {
      hazards.toxicSpikes = 0;
      absorbedToxicSpikes = true;
    } else if (!pokemon.status) {
      poisonStatus = hazards.toxicSpikes === 2 ? 'badly-poisoned' : 'poisoned';
      pokemon.volatile.toxicCounter = poisonStatus === 'badly-poisoned' ? 1 : 0;
    }
  }

  if (hazards.stickyWeb && isGrounded(pokemon)) {
    applyStickyWeb = true;
  }

  return { damage, absorbedToxicSpikes, poisonStatus, applyStickyWeb };
}

