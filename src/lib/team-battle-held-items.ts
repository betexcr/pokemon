// Held-item effects that hook into turn order, accuracy, crits, power, contact and multi-hit counts.
// Kept free of runtime imports from the engine so team-battle-engine.ts can use it too.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';
import { abilityOf } from './team-battle-ability-rules';
import type { BattleRng } from './battle-rng';
import { rngNextInt, rngRollChance } from './battle-rng';

export const PUNCHING_MOVES: ReadonlySet<string> = new Set([
  'bullet-punch', 'comet-punch', 'dizzy-punch', 'double-iron-bash', 'drain-punch', 'dynamic-punch', 'fire-punch',
  'focus-punch', 'hammer-arm', 'headlong-rush', 'ice-hammer', 'ice-punch', 'jet-punch', 'mach-punch', 'mega-punch',
  'meteor-mash', 'plasma-fists', 'power-up-punch', 'rage-fist', 'shadow-punch', 'sky-uppercut', 'surging-strikes',
  'thunder-punch', 'wicked-blow',
]);

export const SOUND_MOVES: ReadonlySet<string> = new Set([
  'alluring-voice', 'boomburst', 'bug-buzz', 'chatter', 'clanging-scales', 'clangorous-soul', 'confide', 'disarming-voice',
  'echoed-voice', 'eerie-spell', 'grass-whistle', 'growl', 'heal-bell', 'howl', 'hyper-voice', 'metal-sound', 'noble-roar',
  'overdrive', 'parting-shot', 'perish-song', 'psychic-noise', 'relic-song', 'roar', 'round', 'screech', 'sing', 'snarl',
  'snore', 'sparkling-aria', 'supersonic', 'torch-song', 'uproar',
]);

/** Quick Claw (20%) / Custap Berry (at 1/4 HP or less) let the holder act first within its priority bracket. */
export function rollMoveFirst(mon: BattlePokemon, rng: BattleRng, berriesBlocked: boolean): 'quick-claw' | 'custap-berry' | null {
  const item = effectiveItem(mon);
  if (item === 'quick-claw' && rngRollChance(rng, 0.2)) return 'quick-claw';
  if (item === 'custap-berry' && !berriesBlocked && mon.currentHp > 0 && mon.currentHp <= mon.maxHp / 4) return 'custap-berry';
  return null;
}

/** Contact after Punching Glove (punches) and Protective Pads (all moves) on the attacker. */
export function makesContactFor(attacker: BattlePokemon, move: { makesContact?: boolean }, moveLower: string): boolean {
  if (!move.makesContact) return false;
  const item = effectiveItem(attacker);
  if (item === 'protective-pads') return false;
  if (item === 'punching-glove' && PUNCHING_MOVES.has(moveLower)) return false;
  return true;
}

/** Power multiplier from the attacker's item (Muscle Band, Wise Glasses, Punching Glove, Metronome). */
export function itemPowerMultiplier(attacker: BattlePokemon, category: string, moveLower: string): number {
  const item = effectiveItem(attacker);
  if (item === 'muscle-band' && category === 'Physical') return 1.1;
  if (item === 'wise-glasses' && category === 'Special') return 1.1;
  if (item === 'punching-glove' && PUNCHING_MOVES.has(moveLower)) return 1.1;
  if (item === 'metronome') return 1 + Math.min(5, attacker.volatile.metronomeStreak ?? 0) * 0.2;
  return 1;
}

/**
 * Accuracy multiplier from items: Wide Lens x1.1, Zoom Lens x1.2 when moving after the target,
 * Micle Berry boost x1.2 (one move); the target's Bright Powder / Lax Incense x0.9.
 */
export function itemAccuracyMultiplier(attacker: BattlePokemon, defender: BattlePokemon, targetAlreadyMoved: boolean): number {
  let mult = 1;
  const item = effectiveItem(attacker);
  if (item === 'wide-lens') mult *= 1.1;
  if (item === 'zoom-lens' && targetAlreadyMoved) mult *= 1.2;
  if (attacker.volatile.micleBoost) mult *= 1.2;
  const defItem = effectiveItem(defender);
  if (defItem === 'bright-powder' || defItem === 'lax-incense') mult *= 0.9;
  return mult;
}

/** Extra critical-hit stages: Scope Lens / Razor Claw +1, Lansat Berry +2. */
export function itemCritStages(attacker: BattlePokemon): number {
  const item = effectiveItem(attacker);
  const lens = item === 'scope-lens' || item === 'razor-claw' ? 1 : 0;
  return lens + (attacker.volatile.critBoost ?? 0) + speciesItemCritStages(attacker);
}

/** Loaded Dice: 2-5 hit moves hit 4-5 times; 10-hit moves (Population Bomb) at least 4. */
export function loadedDiceHits(attacker: BattlePokemon, min: number, max: number, rng: BattleRng): number | null {
  if (effectiveItem(attacker) !== 'loaded-dice' || abilityOf(attacker) === 'skill-link') return null;
  if (min === 2 && max === 5) return 4 + rngNextInt(rng, 2);
  if (max >= 10) return 4 + rngNextInt(rng, max - 3);
  return null;
}

/** Bound by a binding move and cannot switch out (Ghost types and Shed Shell holders always can). */
export function isTrapped(mon: BattlePokemon): boolean {
  if (!mon.volatile?.binding || mon.currentHp <= 0) return false;
  if (effectiveItem(mon) === 'shed-shell') return false;
  const types = (mon.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? '').toLowerCase());
  return !types.includes('ghost');
}

/** Utility Umbrella: sun / rain do not affect moves the holder uses or takes. */
export function umbrellaBlocksWeather(state: Pick<BattleState, 'field'>, attacker: BattlePokemon, defender: BattlePokemon): boolean {
  const weather = state.field.weather?.kind;
  if (weather !== 'sun' && weather !== 'rain') return false;
  return effectiveItem(attacker) === 'utility-umbrella' || effectiveItem(defender) === 'utility-umbrella';
}

// ---------------------------------------------------------------------------
// Plates, Gems and species-specific items
// ---------------------------------------------------------------------------

/** Plates: x1.2 to one type; Arceus (Multitype) and its Judgment take the Plate's type. */
export const PLATE_TYPES: Readonly<Record<string, string>> = {
  'flame-plate': 'fire', 'splash-plate': 'water', 'zap-plate': 'electric', 'meadow-plate': 'grass',
  'icicle-plate': 'ice', 'fist-plate': 'fighting', 'toxic-plate': 'poison', 'earth-plate': 'ground',
  'sky-plate': 'flying', 'mind-plate': 'psychic', 'insect-plate': 'bug', 'stone-plate': 'rock',
  'spooky-plate': 'ghost', 'draco-plate': 'dragon', 'dread-plate': 'dark', 'iron-plate': 'steel',
  'pixie-plate': 'fairy',
};

/** Gems: consumed to power up the first damaging move of their type by 30%. */
export const GEM_TYPES: Readonly<Record<string, string>> = {
  'normal-gem': 'normal', 'fire-gem': 'fire', 'water-gem': 'water', 'electric-gem': 'electric',
  'grass-gem': 'grass', 'ice-gem': 'ice', 'fighting-gem': 'fighting', 'poison-gem': 'poison',
  'ground-gem': 'ground', 'flying-gem': 'flying', 'psychic-gem': 'psychic', 'bug-gem': 'bug',
  'rock-gem': 'rock', 'ghost-gem': 'ghost', 'dragon-gem': 'dragon', 'dark-gem': 'dark',
  'steel-gem': 'steel', 'fairy-gem': 'fairy',
};

/** Species (PokeAPI name prefixes) each species-specific item works for. */
export const SPECIES_ITEMS: Readonly<Record<string, readonly string[]>> = {
  'light-ball': ['pikachu'],
  'thick-club': ['cubone', 'marowak'],
  'leek': ['farfetchd', 'sirfetchd'],
  'lucky-punch': ['chansey'],
  'deep-sea-tooth': ['clamperl'],
  'deep-sea-scale': ['clamperl'],
  'metal-powder': ['ditto'],
  'quick-powder': ['ditto'],
  'soul-dew': ['latios', 'latias'],
  'adamant-orb': ['dialga'],
  'adamant-crystal': ['dialga'],
  'lustrous-orb': ['palkia'],
  'lustrous-globe': ['palkia'],
  'griseous-orb': ['giratina'],
  'griseous-core': ['giratina'],
  'rusted-sword': ['zacian'],
  'rusted-shield': ['zamazenta'],
};

/** Move types boosted x1.2 by the legendary orbs / Soul Dew. */
const SPECIES_POWER_TYPES: Readonly<Record<string, readonly string[]>> = {
  'soul-dew': ['dragon', 'psychic'],
  'adamant-orb': ['dragon', 'steel'],
  'adamant-crystal': ['dragon', 'steel'],
  'lustrous-orb': ['dragon', 'water'],
  'lustrous-globe': ['dragon', 'water'],
  'griseous-orb': ['dragon', 'ghost'],
  'griseous-core': ['dragon', 'ghost'],
};

const speciesName = (mon: BattlePokemon) => mon.pokemon.name.toLowerCase();

/** True when `mon` holds `item` and is a species that item works for (Ditto's powders stop after Transform). */
export function holdsSpeciesItem(mon: BattlePokemon | undefined, item: string): boolean {
  if (!mon || effectiveItem(mon) !== item) return false;
  const species = SPECIES_ITEMS[item];
  if (!species?.some((sp) => speciesName(mon).startsWith(sp))) return false;
  if ((item === 'metal-powder' || item === 'quick-powder') && mon.volatile?.transform) return false;
  return true;
}

/** Stat / power multipliers from species-specific items for one hit. */
export function speciesItemMultipliers(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  isPhysical: boolean,
  moveType: string,
): { attack: number; defense: number; power: number } {
  let attack = 1;
  let defense = 1;
  let power = 1;
  if (holdsSpeciesItem(attacker, 'light-ball')) attack *= 2;
  if (isPhysical && holdsSpeciesItem(attacker, 'thick-club')) attack *= 2;
  if (!isPhysical && holdsSpeciesItem(attacker, 'deep-sea-tooth')) attack *= 2;
  if (!isPhysical && holdsSpeciesItem(defender, 'deep-sea-scale')) defense *= 2;
  if (isPhysical && holdsSpeciesItem(defender, 'metal-powder')) defense *= 2;
  const type = moveType.toLowerCase();
  for (const [item, types] of Object.entries(SPECIES_POWER_TYPES)) {
    if (types.includes(type) && holdsSpeciesItem(attacker, item)) power *= 1.2;
  }
  return { attack, defense, power };
}

/** Leek / Lucky Punch: +2 critical-hit stages for their species. */
export function speciesItemCritStages(attacker: BattlePokemon): number {
  return holdsSpeciesItem(attacker, 'leek') || holdsSpeciesItem(attacker, 'lucky-punch') ? 2 : 0;
}

/** Quick Powder doubles an untransformed Ditto's Speed. */
export function speciesItemSpeedMultiplier(mon: BattlePokemon): number {
  return holdsSpeciesItem(mon, 'quick-powder') ? 2 : 1;
}

/** Items that cannot be knocked off or swapped while held by the species they define. */
export function isUnremovableItem(mon: BattlePokemon | undefined): boolean {
  if (!mon?.heldItem) return false;
  const item = mon.heldItem.toLowerCase();
  const name = speciesName(mon);
  if (PLATE_TYPES[item] && name.startsWith('arceus')) return true;
  if (item === 'rusted-sword' && name.startsWith('zacian')) return true;
  if (item === 'rusted-shield' && name.startsWith('zamazenta')) return true;
  if ((item === 'griseous-orb' || item === 'griseous-core') && name.startsWith('giratina')) return true;
  return false;
}
