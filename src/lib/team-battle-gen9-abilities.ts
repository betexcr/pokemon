// Abilities beyond the original subset, grouped by the point in the turn where they act:
//   abilityMoveTypeChange      – -ate abilities, Normalize, Liquid Voice (type + power boost)
//   abilityDamageModifiers     – power / attack / defense multipliers for one hit
//   abilityAccuracyModifier    – Compound Eyes, Victory Star, Hustle, No Guard
//   applyHitReactionAbilities  – the target's reactions to a hit (Stamina, Weak Armor, Mummy, ...)
//   applyAttackerHitAbilities  – the attacker's on-hit effects (Poison Touch, Toxic Chain, Stench)
//   applyEntryAbilities        – switch-in effects not covered by handleOnEntryAbilities
//   applyEndOfTurnAbilities    – Moody, Bad Dreams, Slow Start, Cud Chew, Pickup
// Doubles-only abilities (Healer, Costar, Battery, Power Spot, Receiver, ...) have no effect in singles.

import type { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';
import { abilityOf, targetAbility } from './team-battle-ability-rules';
import { changeStatStage, type StatKey } from './team-battle-stat-stages';
import { rngNextInt, rngRollChance } from './battle-rng';
import { applyStatus } from './team-battle-status';
import { PUNCHING_MOVES, SOUND_MOVES, isUnremovableItem } from './team-battle-held-items';
import { calculateTypeEffectiveness, type TypeName } from './damage-calculator';
import { forceEatBerry, removeHeldItem } from './team-battle-items';
import { getCachedMove } from './moveCache';

export const BITING_MOVES: ReadonlySet<string> = new Set([
  'bite', 'crunch', 'fire-fang', 'fishious-rend', 'hyper-fang', 'ice-fang', 'jaw-lock', 'poison-fang', 'psychic-fangs', 'thunder-fang',
]);
export const PULSE_MOVES: ReadonlySet<string> = new Set([
  'aura-sphere', 'dark-pulse', 'dragon-pulse', 'heal-pulse', 'origin-pulse', 'terrain-pulse', 'water-pulse',
]);
export const SLICING_MOVES: ReadonlySet<string> = new Set([
  'aerial-ace', 'air-cutter', 'air-slash', 'aqua-cutter', 'behemoth-blade', 'bitter-blade', 'ceaseless-edge', 'cross-poison',
  'cut', 'fury-cutter', 'kowtow-cleave', 'leaf-blade', 'mighty-cleave', 'night-slash', 'population-bomb', 'psycho-cut',
  'psyblade', 'razor-leaf', 'razor-shell', 'sacred-sword', 'secret-sword', 'slash', 'solar-blade', 'stone-axe',
  'tachyon-cutter', 'x-scissor',
]);
export const WIND_MOVES: ReadonlySet<string> = new Set([
  'air-cutter', 'bleakwind-storm', 'blizzard', 'fairy-wind', 'gust', 'heat-wave', 'hurricane', 'icy-wind', 'petal-blizzard',
  'sandsear-storm', 'springtide-storm', 'twister', 'wildbolt-storm',
]);
const RECKLESS_MOVES: ReadonlySet<string> = new Set([
  'brave-bird', 'double-edge', 'flare-blitz', 'head-charge', 'head-smash', 'high-jump-kick', 'jump-kick', 'axe-kick',
  'light-of-ruin', 'submission', 'take-down', 'volt-tackle', 'wave-crash', 'wild-charge', 'wood-hammer', 'supercell-slam',
  'chloroblast',
]);

/** Abilities that cannot be copied by Trace / overwritten by Mummy and friends. */
const UNCOPYABLE: ReadonlySet<string> = new Set([
  'trace', 'multitype', 'stance-change', 'schooling', 'zen-mode', 'disguise', 'ice-face', 'battle-bond', 'power-construct',
  'shields-down', 'rks-system', 'comatose', 'commander', 'zero-to-hero', 'tera-shift', 'protosynthesis', 'quark-drive',
  'illusion', 'imposter', 'neutralizing-gas', 'hunger-switch', 'as-one-glastrier', 'as-one-spectrier', 'flower-gift',
  'forecast', 'receiver', 'power-of-alchemy', 'poison-puppeteer', 'tera-shell', 'teraform-zero', 'embody-aspect-teal',
  'embody-aspect-wellspring', 'embody-aspect-hearthflame', 'embody-aspect-cornerstone', 'mummy', 'lingering-aroma',
  'gulp-missile', 'wonder-guard',
]);

const PINCH_ABILITIES: Readonly<Record<string, string>> = { overgrow: 'grass', blaze: 'fire', torrent: 'water', swarm: 'bug' };
const TYPE_BOOST_ABILITIES: Readonly<Record<string, { type: string; mult: number }>> = {
  steelworker: { type: 'steel', mult: 1.5 },
  'steely-spirit': { type: 'steel', mult: 1.5 },
  transistor: { type: 'electric', mult: 1.3 },
  'dragons-maw': { type: 'dragon', mult: 1.5 },
  'rocky-payload': { type: 'rock', mult: 1.5 },
};
const ATE_ABILITIES: Readonly<Record<string, string>> = {
  aerilate: 'flying', pixilate: 'fairy', refrigerate: 'ice', galvanize: 'electric',
};

const label = (t: string) => (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as TypeName;
const abilityName = (a: string) => a.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function typesOf(mon: BattlePokemon): string[] {
  return (mon.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? '').toLowerCase()).filter(Boolean);
}
function setTypes(mon: BattlePokemon, types: string[]): void {
  if (!mon.volatile.typeChange) mon.volatile.typeChange = mon.pokemon.types;
  mon.pokemon = { ...mon.pokemon, types: types.map((t, i) => ({ slot: i + 1, type: { name: t, url: '' } })) as any };
}
function log(state: BattleState, message: string, mon?: BattlePokemon) {
  state.battleLog.push({ type: 'status_effect', message, ...(mon ? { pokemon: mon.pokemon.name } : {}) });
}
const sideOf = (state: BattleState, mon: BattlePokemon): 'player' | 'opponent' => (state.player.pokemon.includes(mon) ? 'player' : 'opponent');
const teamOf = (state: BattleState, mon: BattlePokemon): BattleTeam => (sideOf(state, mon) === 'player' ? state.player : state.opponent);
const foeTeamOf = (state: BattleState, mon: BattlePokemon): BattleTeam => (sideOf(state, mon) === 'player' ? state.opponent : state.player);
const activeOf = (team: BattleTeam) => team.pokemon[team.currentIndex];

function setAbility(mon: BattlePokemon, ability: string) {
  if (!mon.abilityChanged) mon.originalAbility = mon.originalAbility ?? mon.currentAbility;
  mon.currentAbility = ability;
  mon.abilityChanged = true;
}

function canBeStatused(mon: BattlePokemon, status: NonNullable<BattlePokemon['status']>): boolean {
  if (mon.status || mon.currentHp <= 0) return false;
  const types = typesOf(mon);
  const ab = abilityOf(mon);
  if ((status === 'poisoned' || status === 'badly-poisoned') && (types.includes('poison') || types.includes('steel') || ab === 'immunity' || ab === 'pastel-veil')) return false;
  if (status === 'burned' && (types.includes('fire') || ab === 'water-veil' || ab === 'water-bubble' || ab === 'thermal-exchange')) return false;
  if (status === 'paralyzed' && (types.includes('electric') || ab === 'limber')) return false;
  if (status === 'asleep' && (ab === 'insomnia' || ab === 'vital-spirit' || ab === 'sweet-veil')) return false;
  if (ab === 'comatose' || ab === 'purifying-salt') return false;
  return true;
}

const STATUS_WORD: Record<string, string> = {
  poisoned: 'poisoned', 'badly-poisoned': 'badly poisoned', burned: 'burned', paralyzed: 'paralyzed', asleep: 'put to sleep',
};
function inflict(state: BattleState, mon: BattlePokemon, status: NonNullable<BattlePokemon['status']>, cause: string): boolean {
  if (!canBeStatused(mon, status)) return false;
  applyStatus(mon, status, status === 'asleep' ? { rng: state.rng } : undefined);
  state.battleLog.push({ type: 'status_applied', message: `${mon.pokemon.name} was ${STATUS_WORD[status] ?? status} by ${cause}!`, pokemon: mon.pokemon.name, status: status.toUpperCase() });
  return true;
}

function chip(state: BattleState, mon: BattlePokemon, amount: number, message: string): void {
  if (mon.currentHp <= 0 || abilityOf(mon) === 'magic-guard') return;
  mon.currentHp = Math.max(0, mon.currentHp - Math.max(1, Math.floor(amount)));
  state.battleLog.push({ type: 'status_damage', message, pokemon: mon.pokemon.name });
  if (mon.currentHp <= 0) state.battleLog.push({ type: 'pokemon_fainted', message: `${mon.pokemon.name} fainted!`, pokemon: mon.pokemon.name });
}

// ---------------------------------------------------------------------------
// Move type / power / stats
// ---------------------------------------------------------------------------

/** -ate abilities, Normalize, Liquid Voice. `boost` is the extra power multiplier (1.2 or 1). */
export function abilityMoveTypeChange(attacker: BattlePokemon, moveType: string, moveLower: string, category: string): { type: string; boost: number } | null {
  const ab = abilityOf(attacker);
  if (!ab || category === 'Status') return null;
  const t = moveType.toLowerCase();
  if (ATE_ABILITIES[ab] && t === 'normal') return { type: ATE_ABILITIES[ab], boost: 1.2 };
  if (ab === 'normalize' && moveLower !== 'struggle') return { type: 'normal', boost: 1.2 };
  if (ab === 'liquid-voice' && SOUND_MOVES.has(moveLower)) return { type: 'water', boost: 1 };
  return null;
}

export type DamageModifierContext = {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  moveLower: string;
  moveType: string;
  isPhysical: boolean;
  contact: boolean;
  hasRecoil: boolean;
  /** No other move is left in the queue after this one (Analytic). */
  movesLast: boolean;
};

/** Multipliers from abilities for one hit. */
export function abilityDamageModifiers(ctx: DamageModifierContext): { attack: number; defense: number; power: number } {
  const { state, attacker, defender, moveLower, isPhysical } = ctx;
  const type = ctx.moveType.toLowerCase();
  const ab = abilityOf(attacker);
  const defAb = targetAbility(attacker, defender);
  let attack = 1;
  let defense = 1;
  let power = 1;

  // Attacker's power boosts
  if (ab === 'iron-fist' && PUNCHING_MOVES.has(moveLower)) power *= 1.2;
  if (ab === 'tough-claws' && ctx.contact) power *= 1.3;
  if (ab === 'strong-jaw' && BITING_MOVES.has(moveLower)) power *= 1.5;
  if (ab === 'mega-launcher' && PULSE_MOVES.has(moveLower)) power *= 1.5;
  if (ab === 'sharpness' && SLICING_MOVES.has(moveLower)) power *= 1.5;
  if (ab === 'reckless' && (ctx.hasRecoil || RECKLESS_MOVES.has(moveLower))) power *= 1.2;
  if (ab === 'toxic-boost' && isPhysical && (attacker.status === 'poisoned' || attacker.status === 'badly-poisoned')) power *= 1.5;
  if (ab === 'flare-boost' && !isPhysical && attacker.status === 'burned') power *= 1.5;
  if (ab === 'analytic' && ctx.movesLast) power *= 1.3;
  if (ab === 'supreme-overlord') {
    const fallen = Math.min(5, teamOf(state, attacker).pokemon.filter((p) => p !== attacker && p.currentHp <= 0).length);
    power *= 1 + 0.1 * fallen;
  }
  if (ab === 'rivalry' && attacker.gender && defender.gender && attacker.gender !== 'genderless' && defender.gender !== 'genderless') {
    power *= attacker.gender === defender.gender ? 1.25 : 0.75;
  }
  if (attacker.volatile.charged && type === 'electric') power *= 2;
  // Dark Aura / Fairy Aura (either side), reversed by Aura Break
  const actives = [activeOf(state.player), activeOf(state.opponent)].filter((m) => m && m.currentHp > 0);
  const auras = actives.map((m) => abilityOf(m));
  const auraBreak = auras.includes('aura-break');
  if ((type === 'dark' && auras.includes('dark-aura')) || (type === 'fairy' && auras.includes('fairy-aura'))) {
    power *= auraBreak ? 0.75 : 4 / 3;
  }

  // Attacker's attacking stat
  const pinch = ab ? PINCH_ABILITIES[ab] : undefined;
  if (pinch === type && attacker.currentHp <= attacker.maxHp / 3) attack *= 1.5;
  const typeBoost = ab ? TYPE_BOOST_ABILITIES[ab] : undefined;
  if (typeBoost && typeBoost.type === type) attack *= typeBoost.mult;
  if (ab === 'hustle' && isPhysical) attack *= 1.5;
  if (ab === 'gorilla-tactics' && isPhysical) attack *= 1.5;
  if (ab === 'defeatist' && attacker.currentHp <= attacker.maxHp / 2) attack *= 0.5;
  if (ab === 'slow-start' && isPhysical && (attacker.volatile.slowStart ?? 0) > 0) attack *= 0.5;
  if (ab === 'stakeout' && defender.volatile.justSwitchedIn) attack *= 2;
  const sun = state.field.weather?.kind === 'sun' && effectiveItem(attacker) !== 'utility-umbrella';
  if (ab === 'orichalcum-pulse' && isPhysical && sun) attack *= 5461 / 4096;
  if (ab === 'hadron-engine' && !isPhysical && state.field.terrain?.kind === 'electric') attack *= 5461 / 4096;

  // Treasures of Ruin: lower everyone else's stat
  const has = (mon: BattlePokemon, a: string) => abilityOf(mon) === a && mon.currentHp > 0;
  if (isPhysical && has(defender, 'tablets-of-ruin') && ab !== 'tablets-of-ruin') attack *= 0.75;
  if (!isPhysical && has(defender, 'vessel-of-ruin') && ab !== 'vessel-of-ruin') attack *= 0.75;
  if (isPhysical && has(attacker, 'sword-of-ruin') && defAb !== 'sword-of-ruin') defense *= 0.75;
  if (!isPhysical && has(attacker, 'beads-of-ruin') && defAb !== 'beads-of-ruin') defense *= 0.75;

  // Flower Gift (the holder's own boost; the ally boost needs doubles)
  if (ab === 'flower-gift' && isPhysical && sun) attack *= 1.5;

  // Defender
  if (defAb === 'grass-pelt' && isPhysical && state.field.terrain?.kind === 'grassy') defense *= 1.5;
  if (defAb === 'flower-gift' && !isPhysical && state.field.weather?.kind === 'sun' && effectiveItem(defender) !== 'utility-umbrella') defense *= 1.5;

  return { attack, defense, power };
}

/** Neuroforce: super-effective hits deal 25% more. */
export function abilityFinalDamageMultiplier(attacker: BattlePokemon, effectiveness: number): number {
  return abilityOf(attacker) === 'neuroforce' && effectiveness > 1 ? 1.25 : 1;
}

/** Scrappy / Mind's Eye: Normal and Fighting moves hit Ghost types. */
export function ignoresGhostImmunity(attacker: BattlePokemon, moveType: string): boolean {
  const ab = abilityOf(attacker);
  const t = moveType.toLowerCase();
  return (ab === 'scrappy' || ab === 'minds-eye') && (t === 'normal' || t === 'fighting');
}

/** Abilities that ignore the target's evasion boosts. */
export function ignoresEvasion(attacker: BattlePokemon): boolean {
  const ab = abilityOf(attacker);
  return ab === 'keen-eye' || ab === 'minds-eye' || ab === 'illuminate' || ab === 'unaware';
}

/** Accuracy multiplier from abilities, or Infinity when the move cannot miss (No Guard). */
export function abilityAccuracyModifier(attacker: BattlePokemon, defender: BattlePokemon, category: string): number {
  const ab = abilityOf(attacker);
  if (ab === 'no-guard' || abilityOf(defender) === 'no-guard') return Infinity;
  let mult = 1;
  if (ab === 'compound-eyes') mult *= 1.3;
  if (ab === 'victory-star') mult *= 1.1;
  if (ab === 'hustle' && category === 'Physical') mult *= 0.8;
  return mult;
}

/** Serene Grace doubles secondary-effect chances. */
export function applySereneGrace<T extends { ailment?: { kind: string; chance: number }; flinchChance?: number; statChanges?: Array<{ chance: number }>; category?: string }>(
  attacker: BattlePokemon,
  move: T,
): T {
  if (abilityOf(attacker) !== 'serene-grace' || move.category === 'Status') return move;
  const dbl = (c: number) => (c > 0 && c < 100 ? Math.min(100, c * 2) : c);
  return {
    ...move,
    ...(move.ailment ? { ailment: { ...move.ailment, chance: dbl(move.ailment.chance) } } : {}),
    ...(move.flinchChance ? { flinchChance: dbl(move.flinchChance) } : {}),
    ...(move.statChanges ? { statChanges: move.statChanges.map((sc) => ({ ...sc, chance: dbl(sc.chance) })) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Reactions to a hit
// ---------------------------------------------------------------------------

export type HitContext = {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  moveLower: string;
  moveType: string;
  category: string;
  contact: boolean;
  /** HP the hit took off the target. */
  damage: number;
  hpBefore: number;
  isCrit: boolean;
};

/** The target's ability reacts to a hit that reached its HP. */
export function applyHitReactionAbilities(ctx: HitContext): void {
  const { state, attacker, defender, contact, damage } = ctx;
  if (damage <= 0) return;
  // Breakable reactions are skipped by Mold Breaker (Mummy, Color Change and co. are not breakable)
  const ab = abilityOf(defender);
  if (!ab) return;
  const type = ctx.moveType.toLowerCase();
  const alive = defender.currentHp > 0;
  const physical = ctx.category === 'Physical';
  const foeSource = { source: attacker };

  if (alive) {
    switch (ab) {
      case 'stamina':
        changeStatStage(state, defender, 'defense', 1, { reason: 'thanks to Stamina' });
        break;
      case 'weak-armor':
        if (physical) {
          changeStatStage(state, defender, 'defense', -1, { reason: 'due to Weak Armor' });
          changeStatStage(state, defender, 'speed', 2, { reason: 'due to Weak Armor' });
        }
        break;
      case 'justified':
        if (type === 'dark') changeStatStage(state, defender, 'attack', 1, { reason: 'thanks to Justified' });
        break;
      case 'rattled':
        if (type === 'bug' || type === 'ghost' || type === 'dark') changeStatStage(state, defender, 'speed', 1, { reason: 'thanks to Rattled' });
        break;
      case 'water-compaction':
        if (type === 'water') changeStatStage(state, defender, 'defense', 2, { reason: 'thanks to Water Compaction' });
        break;
      case 'steam-engine':
        if (type === 'water' || type === 'fire') changeStatStage(state, defender, 'speed', 6, { reason: 'thanks to Steam Engine' });
        break;
      case 'anger-point':
        if (ctx.isCrit && defender.statModifiers.attack < 6) {
          defender.statModifiers.attack = 6;
          log(state, `${defender.pokemon.name} maxed its Attack!`, defender);
        }
        break;
      case 'color-change':
        if (!typesOf(defender).includes(type) && !defender.terastallized && type) {
          setTypes(defender, [type]);
          log(state, `${defender.pokemon.name}'s type changed to ${label(type)}!`, defender);
        }
        break;
      case 'cotton-down':
        changeStatStage(state, attacker, 'speed', -1, { ...foeSource, reason: 'due to Cotton Down' });
        break;
      case 'sand-spit':
        if (state.field.weather?.kind !== 'sandstorm') {
          state.field.weather = { kind: 'sandstorm', turns: effectiveItem(defender) === 'smooth-rock' ? 8 : 5, source: defender.pokemon.name };
          log(state, 'A sandstorm kicked up!');
        }
        break;
      case 'seed-sower':
        if (state.field.terrain?.kind !== 'grassy') {
          state.field.terrain = { kind: 'grassy', turns: effectiveItem(defender) === 'terrain-extender' ? 8 : 5, source: defender.pokemon.name };
          log(state, 'Grass grew to cover the battlefield!');
        }
        break;
      case 'electromorphosis':
        defender.volatile.charged = true;
        log(state, `Being hit by ${ctx.moveLower} charged ${defender.pokemon.name} with power!`, defender);
        break;
      case 'wind-power':
        if (WIND_MOVES.has(ctx.moveLower)) {
          defender.volatile.charged = true;
          log(state, `Being hit by ${ctx.moveLower} charged ${defender.pokemon.name} with power!`, defender);
        }
        break;
      case 'toxic-debris': {
        const hz = teamOf(state, attacker).sideConditions.hazards;
        if (physical && (hz.toxicSpikes ?? 0) < 2) {
          hz.toxicSpikes = (hz.toxicSpikes ?? 0) + 1;
          log(state, 'Poison spikes were scattered on the ground around the opposing team!');
        }
        break;
      }
      case 'cursed-body':
        if (!attacker.volatile.disable && attacker.currentHp > 0 && rngRollChance(state.rng, 0.3)) {
          attacker.volatile.disable = { move: ctx.moveLower, turns: 4 };
          log(state, `${attacker.pokemon.name}'s ${ctx.moveLower} was disabled by ${defender.pokemon.name}'s Cursed Body!`, attacker);
        }
        break;
      case 'berserk':
        if (ctx.hpBefore > defender.maxHp / 2 && defender.currentHp <= defender.maxHp / 2) {
          changeStatStage(state, defender, 'specialAttack', 1, { reason: 'thanks to Berserk' });
        }
        break;
      case 'anger-shell':
        if (ctx.hpBefore > defender.maxHp / 2 && defender.currentHp <= defender.maxHp / 2) {
          for (const st of ['defense', 'specialDefense'] as StatKey[]) changeStatStage(state, defender, st, -1, { reason: 'due to Anger Shell' });
          for (const st of ['attack', 'specialAttack', 'speed'] as StatKey[]) changeStatStage(state, defender, st, 1, { reason: 'due to Anger Shell' });
        }
        break;
      default:
        break;
    }
  }

  if (contact && attacker.currentHp > 0) {
    const atkProtected = effectiveItem(attacker) === 'protective-pads';
    if (!atkProtected) {
      switch (ab) {
        case 'effect-spore': {
          if (typesOf(attacker).includes('grass') || abilityOf(attacker) === 'overcoat' || effectiveItem(attacker) === 'safety-goggles') break;
          const roll = rngNextInt(state.rng, 100);
          if (roll < 11) inflict(state, attacker, 'asleep', 'Effect Spore');
          else if (roll < 21) inflict(state, attacker, 'paralyzed', 'Effect Spore');
          else if (roll < 30) inflict(state, attacker, 'poisoned', 'Effect Spore');
          break;
        }
        case 'cute-charm':
          if (!attacker.volatile.infatuated && abilityOf(attacker) !== 'oblivious' && rngRollChance(state.rng, 0.3)
              && !(attacker.gender && defender.gender && (attacker.gender === defender.gender || attacker.gender === 'genderless'))) {
            attacker.volatile.infatuated = { by: sideOf(state, defender) };
            log(state, `${attacker.pokemon.name} fell in love!`, attacker);
          }
          break;
        case 'gooey':
        case 'tangling-hair':
          changeStatStage(state, attacker, 'speed', -1, { ...foeSource, reason: `due to ${abilityName(ab)}` });
          break;
        case 'aftermath':
          if (!alive && ![abilityOf(attacker), abilityOf(defender)].includes('damp')) {
            chip(state, attacker, attacker.maxHp / 4, `${attacker.pokemon.name} was caught in the aftermath!`);
          }
          break;
        case 'perish-body':
          if (!attacker.volatile.perishSong) {
            attacker.volatile.perishSong = { turns: 3 };
            if (!defender.volatile.perishSong && alive) defender.volatile.perishSong = { turns: 3 };
            log(state, 'Both Pokémon will faint in three turns!');
          }
          break;
        case 'mummy':
        case 'lingering-aroma': {
          const atkAb = abilityOf(attacker);
          if (atkAb && atkAb !== ab && !UNCOPYABLE.has(atkAb) && effectiveItem(attacker) !== 'ability-shield') {
            setAbility(attacker, ab);
            log(state, `${attacker.pokemon.name}'s Ability became ${abilityName(ab)}!`, attacker);
          }
          break;
        }
        case 'wandering-spirit': {
          const atkAb = abilityOf(attacker);
          if (alive && atkAb && !UNCOPYABLE.has(atkAb) && effectiveItem(attacker) !== 'ability-shield') {
            setAbility(attacker, ab);
            setAbility(defender, atkAb);
            log(state, `${defender.pokemon.name} swapped Abilities with its target!`, defender);
          }
          break;
        }
        case 'pickpocket':
          if (alive && !defender.heldItem && attacker.heldItem && !isUnremovableItem(attacker) && abilityOf(attacker) !== 'sticky-hold') {
            const item = removeHeldItem(attacker)!;
            defender.heldItem = item;
            log(state, `${defender.pokemon.name} stole ${attacker.pokemon.name}'s ${item}!`, defender);
          }
          break;
        default:
          break;
      }
    }
  }

  // Innards Out: the attacker takes the HP the holder had left
  if (!alive && ab === 'innards-out') {
    chip(state, attacker, ctx.hpBefore, `${attacker.pokemon.name} was hurt by ${defender.pokemon.name}'s Innards Out!`);
  }
}

/** The attacker's ability acts on a hit that reached the target's HP. */
export function applyAttackerHitAbilities(ctx: HitContext & { moveHasFlinch: boolean }): void {
  const { state, attacker, defender } = ctx;
  if (ctx.damage <= 0 || defender.currentHp <= 0 || attacker.currentHp <= 0) return;
  const ab = abilityOf(attacker);
  const shielded = targetAbility(attacker, defender) === 'shield-dust' || effectiveItem(defender) === 'covert-cloak';
  if (ab === 'poison-touch' && ctx.contact && !shielded && rngRollChance(state.rng, 0.3)) inflict(state, defender, 'poisoned', 'Poison Touch');
  if (ab === 'toxic-chain' && !shielded && rngRollChance(state.rng, 0.3)) inflict(state, defender, 'badly-poisoned', 'Toxic Chain');
  if (ab === 'stench' && !ctx.moveHasFlinch && !shielded && rngRollChance(state.rng, 0.1)) defender.volatile.flinched = true;
}

/** Magician: steal the target's item after a damaging move (Pickpocket is the target's version). */
export function applyMagician(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, hpDamage: number): void {
  if (abilityOf(attacker) !== 'magician' || hpDamage <= 0 || attacker.heldItem || !defender.heldItem || attacker.currentHp <= 0) return;
  if (isUnremovableItem(defender) || targetAbility(attacker, defender) === 'sticky-hold') return;
  const item = removeHeldItem(defender)!;
  attacker.heldItem = item;
  log(state, `${attacker.pokemon.name} stole ${defender.pokemon.name}'s ${item}!`, attacker);
}

/** Chilling Neigh / Grim Neigh / As One: boost on a KO. */
export function applyKoAbilities(state: BattleState, attacker: BattlePokemon): void {
  const ab = abilityOf(attacker);
  if (ab === 'chilling-neigh' || ab === 'as-one-glastrier') changeStatStage(state, attacker, 'attack', 1, { reason: `thanks to ${abilityName(ab)}`, quietFailure: true });
  if (ab === 'grim-neigh' || ab === 'as-one-spectrier') changeStatStage(state, attacker, 'specialAttack', 1, { reason: `thanks to ${abilityName(ab)}`, quietFailure: true });
}

/** Emergency Exit / Wimp Out: true when the holder dropped to half HP or less from above it. */
export function wantsEmergencyExit(mon: BattlePokemon, hpBefore: number): boolean {
  const ab = abilityOf(mon);
  return (ab === 'emergency-exit' || ab === 'wimp-out') && mon.currentHp > 0 && hpBefore > mon.maxHp / 2 && mon.currentHp <= mon.maxHp / 2;
}

/** Synchronize: a foe that burns, paralyzes or poisons the holder gets the same status. */
export function applySynchronize(state: BattleState, holder: BattlePokemon, source: BattlePokemon | undefined): void {
  if (!source || source === holder || abilityOf(holder) !== 'synchronize') return;
  const st = holder.status;
  if (st === 'burned' || st === 'paralyzed' || st === 'poisoned' || st === 'badly-poisoned') inflict(state, source, st, 'Synchronize');
}

// ---------------------------------------------------------------------------
// Entry and end of turn
// ---------------------------------------------------------------------------

/** Switch-in abilities not handled by handleOnEntryAbilities. */
export function applyEntryAbilities(state: BattleState, incoming: BattlePokemon): void {
  const ab = abilityOf(incoming);
  if (!ab || incoming.currentHp <= 0) return;
  const foe = activeOf(foeTeamOf(state, incoming));
  const once = (key: 'intrepidUsed' | 'dauntlessUsed' | 'syrupUsed') => {
    if (incoming[key]) return false;
    incoming[key] = true;
    return true;
  };
  switch (ab) {
    case 'trace': {
      const foeAb = foe ? abilityOf(foe) : undefined;
      if (foe && foe.currentHp > 0 && foeAb && !UNCOPYABLE.has(foeAb)) {
        setAbility(incoming, foeAb);
        log(state, `${incoming.pokemon.name} traced ${foe.pokemon.name}'s ${abilityName(foeAb)}!`, incoming);
      }
      break;
    }
    case 'screen-cleaner': {
      let cleared = false;
      for (const team of [state.player, state.opponent]) {
        const sc = team.sideConditions.screens;
        if (sc.reflect || sc.lightScreen || sc.auroraVeil) cleared = true;
        sc.reflect = undefined;
        sc.lightScreen = undefined;
        sc.auroraVeil = undefined;
      }
      if (cleared) log(state, `${incoming.pokemon.name}'s Screen Cleaner removed the barriers!`, incoming);
      break;
    }
    case 'intrepid-sword':
      if (once('intrepidUsed')) changeStatStage(state, incoming, 'attack', 1, { reason: 'thanks to Intrepid Sword' });
      break;
    case 'dauntless-shield':
      if (once('dauntlessUsed')) changeStatStage(state, incoming, 'defense', 1, { reason: 'thanks to Dauntless Shield' });
      break;
    case 'supersweet-syrup':
      if (foe && foe.currentHp > 0 && once('syrupUsed')) {
        log(state, `A supersweet aroma is wafting from ${incoming.pokemon.name}!`, incoming);
        changeStatStage(state, foe, 'evasion', -1, { source: incoming });
      }
      break;
    case 'embody-aspect-teal':
      changeStatStage(state, incoming, 'speed', 1, { reason: 'thanks to Embody Aspect' });
      break;
    case 'embody-aspect-wellspring':
      changeStatStage(state, incoming, 'specialDefense', 1, { reason: 'thanks to Embody Aspect' });
      break;
    case 'embody-aspect-hearthflame':
      changeStatStage(state, incoming, 'attack', 1, { reason: 'thanks to Embody Aspect' });
      break;
    case 'embody-aspect-cornerstone':
      changeStatStage(state, incoming, 'defense', 1, { reason: 'thanks to Embody Aspect' });
      break;
    case 'slow-start':
      incoming.volatile.slowStart = 5;
      log(state, `${incoming.pokemon.name} can't get it going!`, incoming);
      break;
    case 'pressure':
      log(state, `${incoming.pokemon.name} is exerting its pressure!`, incoming);
      break;
    case 'dark-aura':
      log(state, `${incoming.pokemon.name} is radiating a dark aura!`, incoming);
      break;
    case 'fairy-aura':
      log(state, `${incoming.pokemon.name} is radiating a fairy aura!`, incoming);
      break;
    case 'aura-break':
      log(state, `${incoming.pokemon.name} reversed all other Pokémon's auras!`, incoming);
      break;
    case 'as-one-glastrier':
    case 'as-one-spectrier':
      log(state, `${incoming.pokemon.name} has two Abilities! The opposing team is too nervous to eat Berries!`, incoming);
      break;
    case 'beads-of-ruin':
    case 'tablets-of-ruin':
    case 'vessel-of-ruin':
    case 'sword-of-ruin': {
      const stat = { 'beads-of-ruin': 'Sp. Def', 'tablets-of-ruin': 'Attack', 'vessel-of-ruin': 'Sp. Atk', 'sword-of-ruin': 'Defense' }[ab];
      log(state, `${incoming.pokemon.name}'s ${abilityName(ab)} weakened the ${stat} of all surrounding Pokémon!`, incoming);
      break;
    }
    case 'orichalcum-pulse':
      if (state.field.weather?.kind !== 'sun') {
        state.field.weather = { kind: 'sun', turns: effectiveItem(incoming) === 'heat-rock' ? 8 : 5, source: incoming.pokemon.name };
        log(state, `${incoming.pokemon.name} turned the sunlight harsh, sending its ancient pulse into a frenzy!`, incoming);
      }
      break;
    case 'hadron-engine':
      if (state.field.terrain?.kind !== 'electric') {
        state.field.terrain = { kind: 'electric', turns: effectiveItem(incoming) === 'terrain-extender' ? 8 : 5, source: incoming.pokemon.name };
        log(state, `${incoming.pokemon.name} turned the ground into Electric Terrain, energizing its futuristic engine!`, incoming);
      }
      break;
    case 'anticipation': {
      const scary = (foe?.moves ?? []).some((m) => {
        const id = m.id.toLowerCase();
        if (['fissure', 'guillotine', 'horn-drill', 'sheer-cold'].includes(id)) return true;
        const mv = getCachedMove(id);
        return !!mv && mv.category !== 'Status' && isSuperEffective(String(mv.type), incoming);
      });
      if (scary) log(state, `${incoming.pokemon.name} shuddered!`, incoming);
      break;
    }
    case 'forewarn': {
      const strongest = (foe?.moves ?? [])
        .map((m) => ({ id: m.id, power: Number(getCachedMove(m.id)?.power ?? 0) }))
        .sort((a, b) => b.power - a.power)[0];
      if (strongest) log(state, `${incoming.pokemon.name}'s Forewarn alerted it to ${strongest.id}!`, incoming);
      break;
    }
    case 'klutz':
      break;
    default:
      break;
  }
  updateWeatherTerrainForms(state, incoming);
}

/** Forecast (Castform) and Mimicry follow the weather / terrain. */
export function updateWeatherTerrainForms(state: BattleState, mon: BattlePokemon): void {
  const ab = abilityOf(mon);
  if (!mon || mon.currentHp <= 0 || mon.terastallized) return;
  if (ab === 'forecast' && mon.pokemon.name.toLowerCase().startsWith('castform')) {
    const w = state.field.weather?.kind;
    const t = w === 'sun' ? 'fire' : w === 'rain' ? 'water' : w === 'snow' ? 'ice' : 'normal';
    if (typesOf(mon)[0] !== t || typesOf(mon).length !== 1) {
      setTypes(mon, [t]);
      log(state, `${mon.pokemon.name} transformed!`, mon);
    }
  }
  if (ab === 'mimicry') {
    const terrain = state.field.terrain?.kind;
    const t = terrain === 'electric' ? 'electric' : terrain === 'grassy' ? 'grass' : terrain === 'misty' ? 'fairy' : terrain === 'psychic' ? 'psychic' : null;
    if (t && (typesOf(mon).length !== 1 || typesOf(mon)[0] !== t)) {
      setTypes(mon, [t]);
      log(state, `${mon.pokemon.name}'s type changed to ${label(t)}!`, mon);
    } else if (!t && mon.volatile.typeChange) {
      mon.pokemon = { ...mon.pokemon, types: mon.volatile.typeChange };
      mon.volatile.typeChange = undefined;
      log(state, `${mon.pokemon.name} returned to its original type!`, mon);
    }
  }
}

/** Moody, Bad Dreams, Slow Start timer, Cud Chew, Pickup, Opportunist reset. */
export function applyEndOfTurnAbilities(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const mon = activeOf(team);
    if (!mon || mon.currentHp <= 0) continue;
    const ab = abilityOf(mon);
    const foe = activeOf(team === state.player ? state.opponent : state.player);
    switch (ab) {
      case 'moody': {
        const stats: StatKey[] = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
        const up = stats.filter((s) => mon.statModifiers[s] < 6);
        const raised = up.length ? up[rngNextInt(state.rng, up.length)] : undefined;
        if (raised) changeStatStage(state, mon, raised, 2, { reason: 'due to Moody' });
        const down = stats.filter((s) => s !== raised && mon.statModifiers[s] > -6);
        if (down.length) changeStatStage(state, mon, down[rngNextInt(state.rng, down.length)], -1, { reason: 'due to Moody' });
        break;
      }
      case 'bad-dreams':
        if (foe && foe.currentHp > 0 && (foe.status === 'asleep' || abilityOf(foe) === 'comatose')) {
          chip(state, foe, foe.maxHp / 8, `${foe.pokemon.name} is tormented!`);
        }
        break;
      case 'slow-start':
        if ((mon.volatile.slowStart ?? 0) > 0) {
          mon.volatile.slowStart! -= 1;
          if (mon.volatile.slowStart === 0) log(state, `${mon.pokemon.name} finally got its act together!`, mon);
        }
        break;
      case 'cud-chew': {
        const cc = mon.volatile.cudChew;
        if (cc) {
          if (cc.turns <= 0) {
            mon.volatile.cudChew = undefined;
            log(state, `${mon.pokemon.name} ate its ${cc.berry} again!`, mon);
            forceEatBerry(state, mon, cc.berry, { repeat: true });
          } else {
            cc.turns -= 1;
          }
        }
        break;
      }
      case 'pickup':
        if (!mon.heldItem && foe?.consumedItem && foe.volatile.consumedThisTurn) {
          mon.heldItem = foe.consumedItem;
          foe.consumedItem = undefined;
          log(state, `${mon.pokemon.name} found one ${mon.heldItem}!`, mon);
        }
        break;
      default:
        break;
    }
  }
  for (const team of [state.player, state.opponent]) {
    for (const mon of team.pokemon) {
      if (mon.volatile) mon.volatile.consumedThisTurn = undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Speed, priority, trapping, PP, items
// ---------------------------------------------------------------------------

/** Quick Feet x1.5 when statused; Slow Start halves Speed for 5 turns. */
export function abilitySpeedMultiplier(mon: BattlePokemon): number {
  const ab = abilityOf(mon);
  if (ab === 'quick-feet' && mon.status) return 1.5;
  if (ab === 'slow-start' && (mon.volatile?.slowStart ?? 0) > 0) return 0.5;
  return 1;
}

/** Stall / Mycelium Might (status moves): act last in the priority bracket. Quick Draw: 30% to act first. */
export function abilityTurnOrder(mon: BattlePokemon, moveCategory: string | undefined, rng: BattleState['rng']): 'first' | 'last' | null {
  const ab = abilityOf(mon);
  if (ab === 'stall') return 'last';
  if (ab === 'mycelium-might' && moveCategory === 'Status') return 'last';
  if (ab === 'quick-draw' && moveCategory && moveCategory !== 'Status' && rngRollChance(rng, 0.3)) return 'first';
  return null;
}

/** Pressure: moves aimed at the holder use one extra PP. */
export function pressurePpCost(defender: BattlePokemon, targetsFoe: boolean): number {
  return targetsFoe && abilityOf(defender) === 'pressure' && defender.currentHp > 0 ? 1 : 0;
}

/** Unseen Fist: contact moves go through Protect. Long Reach: never makes contact. */
export function contactThroughProtect(attacker: BattlePokemon, contact: boolean): boolean {
  return contact && abilityOf(attacker) === 'unseen-fist';
}

/** Opportunist copies the foe's stat boosts (like Mirror Herb, every time). */
export function opportunistCopies(mon: BattlePokemon): boolean {
  return abilityOf(mon) === 'opportunist' && mon.currentHp > 0;
}

/** Super-effective check used by Anticipation-like helpers. */
export function isSuperEffective(moveType: string, target: BattlePokemon): boolean {
  return calculateTypeEffectiveness(label(moveType), typesOf(target).map(label)) > 1;
}
