// Ability lookups that depend on who is acting (Mold Breaker family).

import type { BattlePokemon } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';

/** Abilities that let the user's moves ignore the target's "breakable" abilities. */
export const MOLD_BREAKER_ABILITIES = new Set(['mold-breaker', 'teravolt', 'turboblaze']);

/**
 * Abilities Mold Breaker ignores (Showdown's `breakable` flag), limited to those that matter
 * when a move hits: immunities, damage reducers, stat-drop / status blockers, Contrary, Magic Bounce.
 */
export const BREAKABLE_ABILITIES = new Set([
  'aroma-veil', 'armor-tail', 'battle-armor', 'big-pecks', 'bulletproof', 'clear-body', 'contrary',
  'damp', 'dazzling', 'disguise', 'dry-skin', 'earth-eater', 'filter', 'flash-fire', 'flower-veil',
  'fluffy', 'friend-guard', 'fur-coat', 'good-as-gold', 'guard-dog', 'heatproof', 'heavy-metal',
  'hyper-cutter', 'ice-face', 'ice-scales', 'immunity', 'inner-focus', 'insomnia', 'keen-eye',
  'leaf-guard', 'levitate', 'light-metal', 'lightning-rod', 'limber', 'magic-bounce', 'magma-armor',
  'marvel-scale', 'mirror-armor', 'motor-drive', 'multiscale', 'oblivious', 'overcoat', 'own-tempo',
  'pastel-veil', 'punk-rock', 'purifying-salt', 'queenly-majesty', 'sand-veil', 'sap-sipper',
  'shell-armor', 'shield-dust', 'simple', 'snow-cloak', 'solid-rock', 'soundproof', 'sticky-hold',
  'storm-drain', 'sturdy', 'suction-cups', 'sweet-veil', 'tangled-feet', 'telepathy', 'thick-fat',
  'unaware', 'vital-spirit', 'volt-absorb', 'water-absorb', 'water-bubble', 'water-veil',
  'well-baked-body', 'white-smoke', 'wind-rider', 'wonder-guard', 'wonder-skin',
]);

export function abilityOf(pokemon: BattlePokemon | undefined): string | undefined {
  return pokemon?.currentAbility?.toLowerCase() || undefined;
}

export function hasMoldBreaker(pokemon: BattlePokemon | undefined): boolean {
  // Sunsteel Strike / Moongeist Beam / Photon Geyser act like Mold Breaker for that move
  if (pokemon?.volatile?.moldBreakerMove) return true;
  const ability = abilityOf(pokemon);
  return !!ability && MOLD_BREAKER_ABILITIES.has(ability);
}

/**
 * The target's ability as seen by an attack from `attacker`: undefined when the attacker has
 * Mold Breaker / Teravolt / Turboblaze and the target's ability is breakable.
 */
export function targetAbility(attacker: BattlePokemon | undefined, target: BattlePokemon): string | undefined {
  const ability = abilityOf(target);
  if (!ability) return undefined;
  // Ability Shield keeps the holder's ability from being ignored
  if (attacker && attacker !== target && hasMoldBreaker(attacker) && BREAKABLE_ABILITIES.has(ability) && effectiveItem(target) !== 'ability-shield') {
    return undefined;
  }
  return ability;
}
