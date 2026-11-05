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
  return lens + (attacker.volatile.critBoost ?? 0);
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
