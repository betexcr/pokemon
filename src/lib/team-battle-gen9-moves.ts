// Gen 9 moves whose behaviour is not described by PokeAPI data alone (power, type, accuracy,
// status chance, stat changes, drain / recoil). The turn pipeline calls these hooks at fixed points:
//   gen9TryFailure        – before the accuracy roll ("But it failed!" conditions)
//   gen9MoveVariant       – type / category / power changes before damage (Tera Blast, Shell Side Arm, ...)
//   gen9BasePower         – situational base power (Stored Power, Payback, Hard Press, ...)
//   gen9AccuracyOverride  – weather / Lock-On / Glaive Rush accuracy
// Status-move scripts live in `gen9StatusMoveScripts` (synchronous, no switching).

import type { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';
import { abilityOf, targetAbility } from './team-battle-ability-rules';
import { changeStatStage, type StatKey } from './team-battle-stat-stages';
import { rngNextInt, rngRollChance } from './battle-rng';
import { rawStat, stageMultiplier, type RawStatName } from './battle-stats';
import { calculateTypeEffectiveness, type TypeName } from './damage-calculator';
import { SOUND_MOVES } from './team-battle-held-items';
export { SOUND_MOVES };
import { getCachedMove } from './moveCache';
import { forceEatBerry, removeHeldItem } from './team-battle-items';
import { clearStatus } from './team-battle-status';
import { isUnremovableItem } from './team-battle-held-items';

/** Lowercase type of a move from the move cache (moves in play are always cached). */
export function cachedMoveType(moveId: string): string | undefined {
  const t = getCachedMove(moveId)?.type;
  return t ? String(t).toLowerCase() : undefined;
}

// ---------------------------------------------------------------------------
// Move groups
// ---------------------------------------------------------------------------

/** The user faints after using the move (blocked by Damp). */
export const SELF_KO_MOVES: ReadonlySet<string> = new Set(['explosion', 'self-destruct', 'misty-explosion']);
/** Special moves that hit the target's Defense. */
export const DEFENSE_TARGETING_MOVES: ReadonlySet<string> = new Set(['psyshock', 'psystrike', 'secret-sword']);
/** Ignore the target's Defense / evasion stat stages. */
export const IGNORE_TARGET_STAGES_MOVES: ReadonlySet<string> = new Set(['darkest-lariat', 'sacred-sword']);
/** Ignore the target's ability for this move (like Mold Breaker). */
export const ABILITY_IGNORING_MOVES: ReadonlySet<string> = new Set(['sunsteel-strike', 'moongeist-beam', 'photon-geyser']);
/** Remove Reflect / Light Screen / Aurora Veil from the target's side before hitting. */
export const SCREEN_BREAKING_MOVES: ReadonlySet<string> = new Set(['brick-break', 'psychic-fangs', 'raging-bull']);
/** Lose 1/2 max HP when the move misses or fails to connect. */
export const CRASH_MOVES: ReadonlySet<string> = new Set(['high-jump-kick', 'jump-kick', 'axe-kick', 'supercell-slam']);
/** Always land a critical hit. */
export const ALWAYS_CRIT_MOVES: ReadonlySet<string> = new Set(['frost-breath', 'flower-trick', 'wicked-blow', 'surging-strikes', 'storm-throw']);
/** Bypass Protect (and, for Hyperspace Hole, Substitute). */
export const PROTECT_BYPASS_MOVES: ReadonlySet<string> = new Set(['feint', 'hyperspace-hole']);
/** Thaw a frozen target (on top of Fire-type moves). */
export const THAWING_MOVES: ReadonlySet<string> = new Set(['scald', 'steam-eruption', 'scorching-sands', 'matcha-gotcha']);
/** User loses half its max HP after using the move. */
export const HALF_HP_COST_MOVES: ReadonlySet<string> = new Set(['steel-beam', 'chloroblast']);
/** Protect-like moves; the extra effect hits attackers that make contact. */
export const PROTECT_MOVES: ReadonlySet<string> = new Set([
  'protect', 'detect', 'kings-shield', 'king-s-shield', 'spiky-shield', 'baneful-bunker', 'burning-bulwark', 'silk-trap', 'endure',
]);
/** Each hit after the first re-rolls accuracy; power grows per hit (Triple Kick / Axel) or stays fixed. */
export const PER_HIT_ACCURACY_MOVES: Readonly<Record<string, { hits: number; powerStep: number }>> = {
  'triple-kick': { hits: 3, powerStep: 10 },
  'triple-axel': { hits: 3, powerStep: 20 },
  'population-bomb': { hits: 10, powerStep: 0 },
};
/** Moves Sleep Talk / Copycat / Metronome cannot call. */
export const NON_CALLABLE_MOVES: ReadonlySet<string> = new Set([
  'assist', 'beak-blast', 'belch', 'bide', 'celebrate', 'chatter', 'copycat', 'dynamax-cannon', 'focus-punch', 'metronome',
  'mimic', 'mirror-move', 'nature-power', 'shell-trap', 'sketch', 'sleep-talk', 'struggle', 'uproar', 'transform',
  'protect', 'detect', 'endure', 'kings-shield', 'king-s-shield', 'spiky-shield', 'baneful-bunker', 'burning-bulwark',
  'silk-trap', 'follow-me', 'rage-powder', 'helping-hand', 'snatch', 'counter', 'mirror-coat', 'metal-burst',
  'thief', 'covet', 'trick', 'switcheroo', 'destiny-bond', 'feint', 'snore',
]);
/** Abilities Skill Swap, Role Play, Entrainment, Gastro Acid and co. cannot change or copy. */
export const FIXED_ABILITIES: ReadonlySet<string> = new Set([
  'multitype', 'stance-change', 'schooling', 'zen-mode', 'disguise', 'ice-face', 'battle-bond', 'power-construct',
  'shields-down', 'rks-system', 'comatose', 'commander', 'zero-to-hero', 'tera-shift', 'protosynthesis', 'quark-drive',
  'illusion', 'imposter', 'wonder-guard', 'neutralizing-gas', 'hunger-switch', 'as-one-glastrier', 'as-one-spectrier',
  'gulp-missile', 'poison-puppeteer', 'tera-shell', 'teraform-zero',
]);

const TYPE_LABEL = (t: string) => (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as TypeName;

export function typesOf(mon: BattlePokemon): string[] {
  return (mon.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? '').toLowerCase()).filter(Boolean);
}

function setTypes(mon: BattlePokemon, types: string[]): void {
  if (!mon.volatile.typeChange) mon.volatile.typeChange = mon.pokemon.types;
  mon.pokemon = { ...mon.pokemon, types: types.map((t, i) => ({ slot: i + 1, type: { name: t, url: '' } })) as any };
}

function isBerry(item: string | undefined): boolean {
  return !!item && item.endsWith('-berry');
}

const sideOf = (state: BattleState, mon: BattlePokemon): 'player' | 'opponent' =>
  state.player.pokemon.includes(mon) ? 'player' : 'opponent';
const teamOf = (state: BattleState, mon: BattlePokemon): BattleTeam => (sideOf(state, mon) === 'player' ? state.player : state.opponent);

// ---------------------------------------------------------------------------
// Pre-move failures
// ---------------------------------------------------------------------------

export type TryContext = {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  moveLower: string;
  /** The target's queued move this turn if it has not acted yet. */
  targetPendingMove?: { moveId: string; priority: number; category?: string };
};

/** Message when the move fails before its accuracy roll, else null. */
export function gen9TryFailure(ctx: TryContext): string | null {
  const { state, attacker, defender, moveLower } = ctx;
  const fail = 'But it failed!';
  const userItem = effectiveItem(attacker);
  const bench = teamOf(state, attacker).pokemon.filter((p) => p !== attacker && p.currentHp > 0);

  if (SELF_KO_MOVES.has(moveLower)) {
    for (const mon of [attacker, defender]) {
      if (targetAbility(attacker, mon) === 'damp' && mon.currentHp > 0) {
        return `${mon.pokemon.name}'s Damp prevents ${attacker.pokemon.name} from using ${moveLower}!`;
      }
    }
  }
  switch (moveLower) {
    case 'dream-eater':
      return defender.status === 'asleep' ? null : `${defender.pokemon.name} wasn't affected!`;
    case 'poltergeist':
      return defender.heldItem ? null : fail;
    case 'upper-hand': {
      const pending = ctx.targetPendingMove;
      return pending && pending.priority > 0 && pending.category !== 'Status' ? null : fail;
    }
    case 'belch':
      return attacker.ateBerry ? null : `${attacker.pokemon.name} hasn't eaten a Berry yet!`;
    case 'last-resort': {
      const others = attacker.moves.filter((m) => m.id !== 'last-resort');
      const used = new Set(attacker.volatile.movesUsedSinceEntry ?? []);
      return others.length > 0 && others.every((m) => used.has(m.id)) ? null : fail;
    }
    case 'steel-roller':
      return state.field.terrain ? null : fail;
    case 'double-shock':
      return typesOf(attacker).includes('electric') ? null : fail;
    case 'burn-up':
      return typesOf(attacker).includes('fire') ? null : fail;
    case 'fling':
      return attacker.heldItem && userItem ? null : fail;
    case 'stuff-cheeks':
      return isBerry(userItem) ? null : fail;
    case 'teatime':
      return isBerry(effectiveItem(attacker)) || isBerry(effectiveItem(defender)) ? null : fail;
    case 'spit-up':
    case 'swallow':
      return (attacker.volatile.stockpile?.count ?? 0) > 0 ? null : fail;
    case 'sleep-talk':
    case 'snore':
      return attacker.status === 'asleep' ? null : fail;
    case 'aura-wheel':
      return attacker.pokemon.name.toLowerCase().startsWith('morpeko') ? null : fail;
    case 'healing-wish':
    case 'lunar-dance':
      return bench.length > 0 ? null : fail;
    case 'copycat':
      return state.lastMoveInBattle && !NON_CALLABLE_MOVES.has(state.lastMoveInBattle) ? null : fail;
    case 'fairy-lock':
      return state.field.rooms?.fairyLock ? fail : null;
    case 'no-retreat':
      return attacker.volatile.noRetreat ? fail : null;
    case 'stockpile':
      return (attacker.volatile.stockpile?.count ?? 0) >= 3 ? fail : null;
    case 'future-sight':
    case 'doom-desire': {
      const foeTeam = sideOf(state, attacker) === 'player' ? state.opponent : state.player;
      return foeTeam.sideConditions.futureAttack ? fail : null;
    }
    case 'attract': {
      if (defender.volatile.infatuated || targetAbility(attacker, defender) === 'oblivious') return fail;
      const a = attacker.gender;
      const d = defender.gender;
      // Teams do not record gender, so only known same / genderless pairs fail
      if (a === 'genderless' || d === 'genderless' || (a && d && a === d)) return fail;
      return null;
    }
    case 'torment':
      return defender.volatile.torment ? fail : null;
    case 'imprison':
      return attacker.volatile.imprisoning ? fail : null;
    case 'throat-chop':
      return null;
    case 'mean-look':
    case 'block':
      return defender.volatile.trapped ? fail : null;
    case 'fillet-away':
      return attacker.currentHp > attacker.maxHp / 2 ? null : fail;
    case 'strength-sap':
      return defender.statModifiers.attack <= -6 ? fail : null;
    case 'magic-powder':
    case 'soak':
    case 'forests-curse':
    case 'reflect-type':
    case 'conversion':
    case 'conversion-2':
      return defender.terastallized || attacker.terastallized ? fail : null;
    case 'skill-swap':
    case 'role-play':
    case 'entrainment':
    case 'doodle': {
      const a = abilityOf(attacker);
      const d = abilityOf(defender);
      if (!a || !d || a === d) return fail;
      if (FIXED_ABILITIES.has(a) || FIXED_ABILITIES.has(d)) return fail;
      if (effectiveItem(defender) === 'ability-shield' && moveLower !== 'role-play' && moveLower !== 'doodle') return fail;
      return null;
    }
    case 'simple-beam':
    case 'worry-seed':
    case 'gastro-acid': {
      const d = abilityOf(defender);
      if (d && FIXED_ABILITIES.has(d)) return fail;
      if (effectiveItem(defender) === 'ability-shield') return fail;
      if (moveLower === 'simple-beam' && d === 'simple') return fail;
      if (moveLower === 'worry-seed' && (d === 'insomnia' || d === 'truant')) return fail;
      return null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Type / category / power variants
// ---------------------------------------------------------------------------

type MoveShape = { type: string; category: string; power: number | null; makesContact?: boolean; [k: string]: unknown };

const IVY_CUDGEL_MASKS: Record<string, string> = {
  'wellspring-mask': 'water',
  'hearthflame-mask': 'fire',
  'cornerstone-mask': 'rock',
};

/** Returns a copy of `move` with any Gen 9 type / category changes applied. */
export function gen9MoveVariant<T extends MoveShape>(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, move: T, moveLower: string): T {
  const atk = (m: BattlePokemon, physical: boolean) =>
    rawStat(m, physical ? 'attack' : 'special-attack') * stageMultiplier(physical ? m.statModifiers.attack : m.statModifiers.specialAttack);
  switch (moveLower) {
    case 'tera-blast': {
      if (!attacker.terastallized || !attacker.teraType) return move;
      const physical = atk(attacker, true) > atk(attacker, false);
      // Stellar Tera Blast: 100 power, super effective on Terastallized targets
      if (attacker.teraType.toLowerCase() === 'stellar') {
        return { ...move, type: 'Stellar', power: 100, category: physical ? 'Physical' : 'Special' };
      }
      return { ...move, type: TYPE_LABEL(attacker.teraType), category: physical ? 'Physical' : 'Special' };
    }
    case 'photon-geyser':
      return { ...move, category: atk(attacker, true) > atk(attacker, false) ? 'Physical' : 'Special' };
    case 'shell-side-arm': {
      const def = (stat: RawStatName, stage: number) => rawStat(defender, stat) * stageMultiplier(stage);
      const physicalScore = atk(attacker, true) / def('defense', defender.statModifiers.defense);
      const specialScore = atk(attacker, false) / def('special-defense', defender.statModifiers.specialDefense);
      const physical = physicalScore > specialScore;
      return { ...move, category: physical ? 'Physical' : 'Special', makesContact: physical };
    }
    case 'revelation-dance': {
      const t = attacker.terastallized && attacker.teraType && attacker.teraType !== 'stellar' ? attacker.teraType : typesOf(attacker)[0];
      return t ? { ...move, type: TYPE_LABEL(t) } : move;
    }
    case 'aura-wheel':
      return { ...move, type: attacker.volatile.hangry ? 'Dark' : 'Electric' };
    case 'ivy-cudgel': {
      const mask = IVY_CUDGEL_MASKS[effectiveItem(attacker) ?? ''];
      return mask ? { ...move, type: TYPE_LABEL(mask) } : move;
    }
    case 'raging-bull': {
      const name = attacker.pokemon.name.toLowerCase();
      const type = name.includes('combat') ? 'fighting' : name.includes('blaze') ? 'fire' : name.includes('aqua') ? 'water' : null;
      return type ? { ...move, type: TYPE_LABEL(type) } : move;
    }
    default:
      void state;
      return move;
  }
}

// ---------------------------------------------------------------------------
// Situational base power
// ---------------------------------------------------------------------------

export type PowerContext = {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  moveLower: string;
  moveType: string;
  basePower: number;
  /** The target already acted this turn. */
  targetMovedFirst: boolean;
};

function positiveStages(mon: BattlePokemon): number {
  return Object.values(mon.statModifiers).reduce((sum, v) => sum + Math.max(0, v), 0);
}

/** Base power after situational modifiers (returns `basePower` unchanged for other moves). */
export function gen9BasePower(ctx: PowerContext): number {
  const { state, attacker, defender, moveLower, basePower } = ctx;
  const team = teamOf(state, attacker);
  const terrain = state.field.terrain?.kind;
  const userGrounded = attacker.volatile.gravityGrounded || !typesOf(attacker).includes('flying');
  const targetGrounded = defender.volatile.gravityGrounded || !typesOf(defender).includes('flying');
  switch (moveLower) {
    case 'stored-power':
    case 'power-trip':
      return 20 + 20 * positiveStages(attacker);
    case 'payback':
      return ctx.targetMovedFirst ? basePower * 2 : basePower;
    case 'avalanche':
    case 'revenge':
      return attacker.volatile.lastDamageTaken ? basePower * 2 : basePower;
    case 'assurance':
      return defender.volatile.lastDamageTaken ? basePower * 2 : basePower;
    case 'retaliate':
      return team.lastFaintTurn !== undefined && team.lastFaintTurn === state.turn - 1 ? basePower * 2 : basePower;
    case 'stomping-tantrum':
    case 'temper-flare':
      return attacker.volatile.lastMoveFailed ? basePower * 2 : basePower;
    case 'lash-out':
      return attacker.volatile.statsLoweredThisTurn ? basePower * 2 : basePower;
    case 'last-respects':
      return Math.min(5050, 50 + 50 * team.pokemon.filter((p) => p !== attacker && p.currentHp <= 0).length);
    case 'hard-press':
      return Math.max(1, Math.floor((100 * defender.currentHp) / defender.maxHp));
    case 'crush-grip':
      return Math.max(1, Math.floor((120 * defender.currentHp) / defender.maxHp));
    case 'dragon-energy':
      return Math.max(1, Math.floor((150 * attacker.currentHp) / attacker.maxHp));
    case 'brine':
      return defender.currentHp <= defender.maxHp / 2 ? basePower * 2 : basePower;
    case 'venoshock':
    case 'barb-barrage':
      return defender.status === 'poisoned' || defender.status === 'badly-poisoned' ? basePower * 2 : basePower;
    case 'infernal-parade':
      return defender.status ? basePower * 2 : basePower;
    case 'rollout': {
      const n = attacker.volatile.rollout?.count ?? 0;
      return basePower * 2 ** n * (attacker.volatile.defenseCurl ? 2 : 1);
    }
    case 'fury-cutter':
      return Math.min(160, basePower * 2 ** (attacker.volatile.furyCutter ?? 0));
    case 'spit-up':
      return 100 * (attacker.volatile.stockpile?.count ?? 0);
    case 'grav-apple':
      return state.field.rooms?.gravity ? Math.floor(basePower * 1.5) : basePower;
    case 'psyblade':
      return terrain === 'electric' ? Math.floor(basePower * 1.5) : basePower;
    case 'hydro-steam':
      // In sun: x1.5, and the sun's halving of Water moves does not apply (net x3 before weather)
      return state.field.weather?.kind === 'sun' ? basePower * 3 : basePower;
    case 'misty-explosion':
      return terrain === 'misty' && userGrounded ? Math.floor(basePower * 1.5) : basePower;
    case 'expanding-force':
      return terrain === 'psychic' && userGrounded ? Math.floor(basePower * 1.5) : basePower;
    case 'rising-voltage':
      return terrain === 'electric' && targetGrounded ? basePower * 2 : basePower;
    case 'collision-course':
    case 'electro-drift': {
      const eff = calculateTypeEffectiveness(TYPE_LABEL(ctx.moveType), typesOf(defender).map(TYPE_LABEL));
      return eff > 1 ? Math.floor((basePower * 5461) / 4096) : basePower;
    }
    case 'fusion-flare':
      return state.lastMoveThisTurn === 'fusion-bolt' ? basePower * 2 : basePower;
    case 'fusion-bolt':
      return state.lastMoveThisTurn === 'fusion-flare' ? basePower * 2 : basePower;
    case 'fickle-beam':
      if (rngRollChance(state.rng, 0.3)) {
        state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is going all out for this attack!`, pokemon: attacker.pokemon.name });
        return basePower * 2;
      }
      return basePower;
    default:
      return basePower;
  }
}

// ---------------------------------------------------------------------------
// Accuracy
// ---------------------------------------------------------------------------

const RAIN_SURE_HIT = new Set(['thunder', 'hurricane', 'bleakwind-storm', 'wildbolt-storm', 'sandsear-storm']);

/** Accuracy (percent) replacing the move's own, Infinity for a sure hit, or null for no change. */
export function gen9AccuracyOverride(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, moveLower: string): number | null {
  if (attacker.volatile.lockOn || defender.volatile.glaiveRush) return Infinity;
  const weather = effectiveItem(attacker) === 'utility-umbrella' ? undefined : state.field.weather?.kind;
  if (RAIN_SURE_HIT.has(moveLower) && weather === 'rain') return Infinity;
  if ((moveLower === 'thunder' || moveLower === 'hurricane') && weather === 'sun') return 50;
  if (moveLower === 'blizzard' && weather === 'snow') return Infinity;
  if (moveLower === 'toxic' && typesOf(attacker).includes('poison')) return Infinity;
  return null;
}

// ---------------------------------------------------------------------------
// Status move scripts (no switching, no calling other moves)
// ---------------------------------------------------------------------------

type ScriptCtx = { state: BattleState; attacker: BattlePokemon; defender: BattlePokemon; isPlayer: boolean };

const STAGE_KEYS: StatKey[] = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'];

function log(state: BattleState, message: string, mon?: BattlePokemon) {
  state.battleLog.push({ type: 'status_effect', message, ...(mon ? { pokemon: mon.pokemon.name } : {}) });
}

function changeAbility(state: BattleState, mon: BattlePokemon, ability: string | undefined) {
  if (!mon.abilityChanged) {
    mon.originalAbility = mon.originalAbility ?? mon.currentAbility;
  }
  mon.currentAbility = ability;
  mon.abilityChanged = true;
  void state;
}

const abilityLabel = (a: string | undefined) => (a ?? 'nothing').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function heal(state: BattleState, mon: BattlePokemon, amount: number): number {
  const before = mon.currentHp;
  mon.currentHp = Math.min(mon.maxHp, mon.currentHp + Math.max(0, Math.floor(amount)));
  const healed = mon.currentHp - before;
  if (healed > 0) {
    state.battleLog.push({ type: 'healing', message: `${mon.pokemon.name} restored HP!`, pokemon: mon.pokemon.name, healing: Math.round((healed / mon.maxHp) * 100) });
  }
  return healed;
}

/** Status moves handled without switching. Each returns true when it handled the move. */
export const gen9StatusMoveScripts: Record<string, (ctx: ScriptCtx) => boolean> = {
  haze: ({ state }) => {
    for (const team of [state.player, state.opponent]) {
      const mon = team.pokemon[team.currentIndex];
      if (mon) for (const k of STAGE_KEYS) mon.statModifiers[k] = 0;
    }
    log(state, 'All stat changes were eliminated!');
    return true;
  },
  mist: ({ state, attacker, isPlayer }) => {
    const side = isPlayer ? state.player : state.opponent;
    if (side.sideConditions.screens.mist) {
      log(state, 'But it failed!');
      return true;
    }
    side.sideConditions.screens.mist = { turns: 5 };
    log(state, `${attacker.pokemon.name}'s team became shrouded in mist!`, attacker);
    return true;
  },
  'pain-split': ({ state, attacker, defender }) => {
    const avg = Math.floor((attacker.currentHp + defender.currentHp) / 2);
    attacker.currentHp = Math.min(attacker.maxHp, avg);
    defender.currentHp = Math.min(defender.maxHp, avg);
    log(state, 'The battlers shared their pain!');
    return true;
  },
  memento: ({ state, attacker, defender }) => {
    changeStatStage(state, defender, 'attack', -2, { source: attacker });
    changeStatStage(state, defender, 'specialAttack', -2, { source: attacker });
    attacker.currentHp = 0;
    state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    return true;
  },
  'mean-look': ({ state, attacker, defender }) => {
    defender.volatile.trapped = { by: sideOf(state, attacker) };
    log(state, `${defender.pokemon.name} can no longer escape!`, defender);
    return true;
  },
  block: (ctx) => gen9StatusMoveScripts['mean-look'](ctx),
  'fairy-lock': ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    state.field.rooms.fairyLock = { turns: 2 };
    log(state, 'No one will be able to run away during the next turn!');
    return true;
  },
  'no-retreat': ({ state, attacker }) => {
    for (const k of ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const) changeStatStage(state, attacker, k, 1);
    attacker.volatile.noRetreat = true;
    log(state, `${attacker.pokemon.name} can no longer escape because it used No Retreat!`, attacker);
    return true;
  },
  'fillet-away': ({ state, attacker }) => {
    attacker.currentHp -= Math.floor(attacker.maxHp / 2);
    changeStatStage(state, attacker, 'attack', 2);
    changeStatStage(state, attacker, 'specialAttack', 2);
    changeStatStage(state, attacker, 'speed', 2);
    return true;
  },
  'strength-sap': ({ state, attacker, defender }) => {
    const amount = rawStat(defender, 'attack') * stageMultiplier(defender.statModifiers.attack);
    const bigRoot = effectiveItem(attacker) === 'big-root' ? 1.3 : 1;
    changeStatStage(state, defender, 'attack', -1, { source: attacker });
    heal(state, attacker, amount * bigRoot);
    return true;
  },
  'take-heart': ({ state, attacker }) => {
    if (attacker.status) {
      attacker.status = undefined;
      attacker.statusTurns = 0;
      attacker.volatile.toxicCounter = undefined;
      log(state, `${attacker.pokemon.name}'s status returned to normal!`, attacker);
    }
    changeStatStage(state, attacker, 'specialAttack', 1);
    changeStatStage(state, attacker, 'specialDefense', 1);
    return true;
  },
  'tidy-up': ({ state, attacker }) => {
    for (const team of [state.player, state.opponent]) {
      const hz = team.sideConditions.hazards;
      hz.stealthRock = false;
      hz.spikes = 0;
      hz.toxicSpikes = 0;
      hz.stickyWeb = false;
      const mon = team.pokemon[team.currentIndex];
      if (mon) mon.volatile.substitute = undefined;
    }
    log(state, 'Tidying up complete!');
    changeStatStage(state, attacker, 'attack', 1);
    changeStatStage(state, attacker, 'speed', 1);
    return true;
  },
  'jungle-healing': ({ state, attacker }) => {
    heal(state, attacker, attacker.maxHp / 4);
    if (attacker.status) {
      attacker.status = undefined;
      attacker.statusTurns = 0;
    }
    return true;
  },
  'lunar-blessing': (ctx) => gen9StatusMoveScripts['jungle-healing'](ctx),
  'floral-healing': ({ state, defender }) => {
    // Singles: the only target is the foe
    heal(state, defender, defender.maxHp * (state.field.terrain?.kind === 'grassy' ? 2 / 3 : 1 / 2));
    return true;
  },
  'magnetic-flux': ({ state, attacker }) => {
    const a = abilityOf(attacker);
    if (a !== 'plus' && a !== 'minus') {
      log(state, 'But it failed!');
      return true;
    }
    changeStatStage(state, attacker, 'defense', 1);
    changeStatStage(state, attacker, 'specialDefense', 1);
    return true;
  },
  celebrate: ({ state, attacker }) => {
    log(state, `Congratulations, ${attacker.pokemon.name}!`, attacker);
    return true;
  },
  'happy-hour': ({ state }) => {
    log(state, 'Everyone is caught up in the happy atmosphere!');
    return true;
  },
  acupressure: ({ state, attacker }) => {
    const open = STAGE_KEYS.filter((k) => attacker.statModifiers[k] < 6);
    if (open.length === 0) {
      log(state, 'But it failed!');
      return true;
    }
    changeStatStage(state, attacker, open[rngNextInt(state.rng, open.length)], 2);
    return true;
  },
  'psych-up': ({ state, attacker, defender }) => {
    for (const k of STAGE_KEYS) attacker.statModifiers[k] = defender.statModifiers[k];
    log(state, `${attacker.pokemon.name} copied ${defender.pokemon.name}'s stat changes!`, attacker);
    return true;
  },
  'topsy-turvy': ({ state, defender }) => {
    if (STAGE_KEYS.every((k) => defender.statModifiers[k] === 0)) {
      log(state, 'But it failed!');
      return true;
    }
    for (const k of STAGE_KEYS) defender.statModifiers[k] = -defender.statModifiers[k];
    log(state, `${defender.pokemon.name}'s stat changes were all reversed!`, defender);
    return true;
  },
  'power-swap': ({ state, attacker, defender }) => {
    for (const k of ['attack', 'specialAttack'] as const) [attacker.statModifiers[k], defender.statModifiers[k]] = [defender.statModifiers[k], attacker.statModifiers[k]];
    log(state, `${attacker.pokemon.name} switched all changes to its Attack and Sp. Atk with the target!`, attacker);
    return true;
  },
  'guard-swap': ({ state, attacker, defender }) => {
    for (const k of ['defense', 'specialDefense'] as const) [attacker.statModifiers[k], defender.statModifiers[k]] = [defender.statModifiers[k], attacker.statModifiers[k]];
    log(state, `${attacker.pokemon.name} switched all changes to its Defense and Sp. Def with the target!`, attacker);
    return true;
  },
  'heart-swap': ({ state, attacker, defender }) => {
    for (const k of STAGE_KEYS) [attacker.statModifiers[k], defender.statModifiers[k]] = [defender.statModifiers[k], attacker.statModifiers[k]];
    log(state, `${attacker.pokemon.name} switched stat changes with the target!`, attacker);
    return true;
  },
  'speed-swap': ({ state, attacker, defender }) => {
    const a = rawStat(attacker, 'speed');
    const d = rawStat(defender, 'speed');
    attacker.volatile.statOverrides = { ...attacker.volatile.statOverrides, speed: d };
    defender.volatile.statOverrides = { ...defender.volatile.statOverrides, speed: a };
    log(state, `${attacker.pokemon.name} switched Speed with its target!`, attacker);
    return true;
  },
  'power-split': ({ state, attacker, defender }) => {
    for (const stat of ['attack', 'special-attack'] as const) {
      const avg = Math.floor((rawStat(attacker, stat) + rawStat(defender, stat)) / 2);
      attacker.volatile.statOverrides = { ...attacker.volatile.statOverrides, [stat]: avg };
      defender.volatile.statOverrides = { ...defender.volatile.statOverrides, [stat]: avg };
    }
    log(state, `${attacker.pokemon.name} shared its power with the target!`, attacker);
    return true;
  },
  'guard-split': ({ state, attacker, defender }) => {
    for (const stat of ['defense', 'special-defense'] as const) {
      const avg = Math.floor((rawStat(attacker, stat) + rawStat(defender, stat)) / 2);
      attacker.volatile.statOverrides = { ...attacker.volatile.statOverrides, [stat]: avg };
      defender.volatile.statOverrides = { ...defender.volatile.statOverrides, [stat]: avg };
    }
    log(state, `${attacker.pokemon.name} shared its guard with the target!`, attacker);
    return true;
  },
  'power-trick': ({ state, attacker }) => {
    const a = rawStat(attacker, 'attack');
    const d = rawStat(attacker, 'defense');
    attacker.volatile.statOverrides = { ...attacker.volatile.statOverrides, attack: d, defense: a };
    log(state, `${attacker.pokemon.name} switched its Attack and Defense!`, attacker);
    return true;
  },
  'skill-swap': ({ state, attacker, defender }) => {
    const a = attacker.currentAbility;
    changeAbility(state, attacker, defender.currentAbility);
    changeAbility(state, defender, a);
    log(state, `${attacker.pokemon.name} swapped Abilities with its target!`, attacker);
    return true;
  },
  'role-play': ({ state, attacker, defender }) => {
    changeAbility(state, attacker, defender.currentAbility);
    log(state, `${attacker.pokemon.name} copied ${defender.pokemon.name}'s ${abilityLabel(defender.currentAbility)} Ability!`, attacker);
    return true;
  },
  doodle: (ctx) => gen9StatusMoveScripts['role-play'](ctx),
  entrainment: ({ state, attacker, defender }) => {
    changeAbility(state, defender, attacker.currentAbility);
    log(state, `${defender.pokemon.name} acquired ${abilityLabel(attacker.currentAbility)}!`, defender);
    return true;
  },
  'simple-beam': ({ state, defender }) => {
    changeAbility(state, defender, 'simple');
    log(state, `${defender.pokemon.name} acquired Simple!`, defender);
    return true;
  },
  'worry-seed': ({ state, defender }) => {
    changeAbility(state, defender, 'insomnia');
    log(state, `${defender.pokemon.name} acquired Insomnia!`, defender);
    if (defender.status === 'asleep') {
      defender.status = undefined;
      defender.statusTurns = 0;
      log(state, `${defender.pokemon.name} woke up!`, defender);
    }
    return true;
  },
  'gastro-acid': ({ state, defender }) => {
    // A sentinel (not undefined) so the suppression survives multiplayer rehydration
    changeAbility(state, defender, 'no-ability');
    log(state, `${defender.pokemon.name}'s Ability was suppressed!`, defender);
    return true;
  },
  soak: ({ state, defender }) => {
    setTypes(defender, ['water']);
    log(state, `${defender.pokemon.name} transformed into the Water type!`, defender);
    return true;
  },
  'magic-powder': ({ state, defender }) => {
    setTypes(defender, ['psychic']);
    log(state, `${defender.pokemon.name} transformed into the Psychic type!`, defender);
    return true;
  },
  'forests-curse': ({ state, defender }) => {
    const types = typesOf(defender);
    if (!types.includes('grass')) setTypes(defender, [...types, 'grass']);
    log(state, `Grass type was added to ${defender.pokemon.name}!`, defender);
    return true;
  },
  'reflect-type': ({ state, attacker, defender }) => {
    setTypes(attacker, typesOf(defender));
    log(state, `${attacker.pokemon.name}'s type became the same as ${defender.pokemon.name}'s type!`, attacker);
    return true;
  },
  conversion: ({ state, attacker }) => {
    const first = attacker.moves[0]?.id;
    const type = first ? cachedMoveType(first) : undefined;
    if (!type || (typesOf(attacker).length === 1 && typesOf(attacker)[0] === type)) {
      log(state, 'But it failed!');
      return true;
    }
    setTypes(attacker, [type]);
    log(state, `${attacker.pokemon.name}'s type changed to ${TYPE_LABEL(type)}!`, attacker);
    return true;
  },
  'conversion-2': ({ state, attacker, defender }) => {
    const last = defender.volatile.lastMoveUsed;
    const lastType = last ? cachedMoveType(last) : undefined;
    if (!lastType) {
      log(state, 'But it failed!');
      return true;
    }
    const all = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    const resisting = all.filter((t) => calculateTypeEffectiveness(TYPE_LABEL(lastType), [TYPE_LABEL(t)]) < 1 && !typesOf(attacker).includes(t));
    if (resisting.length === 0) {
      log(state, 'But it failed!');
      return true;
    }
    const pick = resisting[rngNextInt(state.rng, resisting.length)];
    setTypes(attacker, [pick]);
    log(state, `${attacker.pokemon.name}'s type changed to ${TYPE_LABEL(pick)}!`, attacker);
    return true;
  },
  attract: ({ state, attacker, defender }) => {
    defender.volatile.infatuated = { by: sideOf(state, attacker) };
    log(state, `${defender.pokemon.name} fell in love!`, defender);
    return true;
  },
  torment: ({ state, defender }) => {
    defender.volatile.torment = true;
    log(state, `${defender.pokemon.name} was subjected to torment!`, defender);
    return true;
  },
  imprison: ({ state, attacker, defender }) => {
    attacker.volatile.imprisoning = true;
    defender.volatile.imprisonedMoves = attacker.moves.map((m) => m.id);
    log(state, `${attacker.pokemon.name} sealed any moves its target shares with it!`, attacker);
    return true;
  },
  spite: ({ state, defender }) => {
    const last = defender.volatile.lastMoveUsed;
    const slot = last ? defender.moves.find((m) => m.id === last) : undefined;
    if (!slot || slot.pp <= 0) {
      log(state, 'But it failed!');
      return true;
    }
    const before = slot.pp;
    slot.pp = Math.max(0, slot.pp - 4);
    log(state, `It reduced the PP of ${defender.pokemon.name}'s ${last} by ${before - slot.pp}!`, defender);
    return true;
  },
  stockpile: ({ state, attacker }) => {
    const sp = attacker.volatile.stockpile ?? { count: 0, def: 0, spd: 0 };
    sp.count += 1;
    sp.def += changeStatStage(state, attacker, 'defense', 1);
    sp.spd += changeStatStage(state, attacker, 'specialDefense', 1);
    attacker.volatile.stockpile = sp;
    log(state, `${attacker.pokemon.name} stockpiled ${sp.count}!`, attacker);
    return true;
  },
  swallow: ({ state, attacker }) => {
    const sp = attacker.volatile.stockpile!;
    heal(state, attacker, attacker.maxHp * (sp.count === 1 ? 0.25 : sp.count === 2 ? 0.5 : 1));
    releaseStockpile(state, attacker);
    return true;
  },
  'tar-shot': ({ state, attacker, defender }) => {
    changeStatStage(state, defender, 'speed', -1, { source: attacker });
    if (!defender.volatile.tarShot && !defender.terastallized) {
      defender.volatile.tarShot = true;
      log(state, `${defender.pokemon.name} became weaker to fire!`, defender);
    }
    return true;
  },
  'lock-on': ({ state, attacker, defender }) => {
    attacker.volatile.lockOn = 2;
    log(state, `${attacker.pokemon.name} took aim at ${defender.pokemon.name}!`, attacker);
    return true;
  },
  'stuff-cheeks': ({ state, attacker }) => {
    // The berry itself is eaten by the engine (gen9EatBerry) before this runs
    changeStatStage(state, attacker, 'defense', 2);
    return true;
  },
};

/** Spit Up / Swallow: drop the stockpile and the Defense / Sp. Def it granted. */
export function releaseStockpile(state: BattleState, mon: BattlePokemon): void {
  const sp = mon.volatile.stockpile;
  if (!sp) return;
  if (sp.def) changeStatStage(state, mon, 'defense', -sp.def, { quietFailure: true });
  if (sp.spd) changeStatStage(state, mon, 'specialDefense', -sp.spd, { quietFailure: true });
  mon.volatile.stockpile = undefined;
}

/** Fling base power by item (Showdown values; most items are 30). */
export function flingPower(item: string): number {
  const table: Record<string, number> = {
    'iron-ball': 130, 'hard-stone': 100, 'room-service': 100, 'thick-club': 90, 'rocky-helmet': 60, 'deep-sea-tooth': 90,
    'griseous-orb': 60, 'adamant-orb': 60, 'lustrous-orb': 60, 'assault-vest': 80, 'weakness-policy': 80, 'blunder-policy': 80,
    'heavy-duty-boots': 80, 'quick-claw': 80, 'razor-claw': 80, 'utility-umbrella': 60, 'eviolite': 40, 'kings-rock': 30,
    'razor-fang': 30, 'light-ball': 30, 'poison-barb': 70, 'dragon-fang': 70, 'power-herb': 10, 'white-herb': 10,
    'mental-herb': 10, 'mirror-herb': 30, 'flame-orb': 30, 'toxic-orb': 30, 'big-root': 10, 'metronome': 30, 'life-orb': 30,
    'choice-band': 10, 'choice-specs': 10, 'choice-scarf': 10, 'expert-belt': 10, 'focus-sash': 10, 'leftovers': 10,
    'muscle-band': 10, 'wise-glasses': 10, 'shell-bell': 30, 'protective-pads': 30, 'loaded-dice': 30, 'clear-amulet': 30,
    'covert-cloak': 30, 'booster-energy': 30, 'punching-glove': 30, 'ability-shield': 30,
  };
  if (item.endsWith('-plate')) return 90;
  if (item.endsWith('-berry')) return 10;
  if (item.endsWith('-gem')) return 0;
  return table[item] ?? 30;
}

// ---------------------------------------------------------------------------
// Damage-step helpers
// ---------------------------------------------------------------------------

/** Sound moves, Hyperspace Hole and Infiltrator users hit through Substitute. */
export function bypassesSubstitute(attacker: BattlePokemon, moveLower: string): boolean {
  return SOUND_MOVES.has(moveLower) || moveLower === 'hyperspace-hole' || abilityOf(attacker) === 'infiltrator';
}

/** Extra type-effectiveness factor: Freeze-Dry on Water (x4 over the normal 0.5), Tar Shot on Fire moves. */
export function gen9TypeEffectMultiplier(defender: BattlePokemon, moveLower: string, moveType: string): number {
  let mult = 1;
  if (moveLower === 'freeze-dry' && typesOf(defender).includes('water')) mult *= 4;
  if (defender.volatile.tarShot && moveType.toLowerCase() === 'fire') mult *= 2;
  if (moveType.toLowerCase() === 'stellar' && defender.terastallized) mult *= 2;
  return mult;
}

/** Present: 40 / 80 / 120 power, or heals the target by 1/4 (returns 0). */
export function rollPresent(state: BattleState): number {
  const r = rngNextInt(state.rng, 10);
  if (r < 4) return 40;
  if (r < 7) return 80;
  if (r < 8) return 120;
  return 0;
}

/** Beat Up: one hit per healthy, status-free team member; power 5 + base Attack / 10. */
export function beatUpPowers(state: BattleState, attacker: BattlePokemon): number[] {
  return teamOf(state, attacker).pokemon
    .filter((p) => p.currentHp > 0 && (!p.status || p === attacker))
    .map((p) => 5 + Math.floor((p.pokemon.stats?.find((st: any) => (st.stat?.name || st.name) === 'attack')?.base_stat ?? 50) / 10));
}

/** Remove one of the user's own types (Double Shock, Burn Up). */
export function loseType(state: BattleState, mon: BattlePokemon, type: string): void {
  const rest = typesOf(mon).filter((t) => t !== type);
  setTypes(mon, rest.length ? rest : ['typeless']);
  log(state, `${mon.pokemon.name} lost its ${TYPE_LABEL(type)} type!`, mon);
}

export type AfterHitContext = {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  moveLower: string;
  moveType: string;
  /** Damage that reached the target's HP. */
  hpDamage: number;
  hitSubstitute: boolean;
};

/** Effects of Gen 9 damaging moves once the hits are done. */
export function gen9AfterHit(ctx: AfterHitContext): void {
  const { state, attacker, defender, moveLower, hpDamage } = ctx;
  const landed = hpDamage > 0 && !ctx.hitSubstitute;
  const targetAlive = defender.currentHp > 0;
  const foeTeam = teamOf(state, defender);

  // Item theft / destruction
  if (landed && (moveLower === 'thief' || moveLower === 'covet') && !attacker.heldItem && defender.heldItem
      && !isUnremovableItem(defender) && targetAbility(attacker, defender) !== 'sticky-hold' && attacker.currentHp > 0) {
    const item = removeHeldItem(defender)!;
    attacker.heldItem = item;
    attacker.volatile.unburdenActive = undefined;
    log(state, `${attacker.pokemon.name} stole ${defender.pokemon.name}'s ${item}!`, attacker);
  }
  if (landed && (moveLower === 'pluck' || moveLower === 'bug-bite') && isBerry(defender.heldItem) && attacker.currentHp > 0
      && targetAbility(attacker, defender) !== 'sticky-hold') {
    const berry = removeHeldItem(defender)!;
    log(state, `${attacker.pokemon.name} stole and ate its target's ${berry}!`, attacker);
    forceEatBerry(state, attacker, berry);
  }
  if (landed && moveLower === 'incinerate' && (isBerry(defender.heldItem) || defender.heldItem?.endsWith('-gem'))
      && targetAbility(attacker, defender) !== 'sticky-hold') {
    const item = removeHeldItem(defender);
    log(state, `${defender.pokemon.name}'s ${item} was burned up!`, defender);
  }

  if (landed && targetAlive) {
    switch (moveLower) {
      case 'clear-smog':
        for (const k of STAGE_KEYS) defender.statModifiers[k] = 0;
        log(state, `${defender.pokemon.name}'s stat changes were removed!`, defender);
        break;
      case 'smack-down':
      case 'thousand-arrows':
        if (!defender.volatile.smackedDown && (typesOf(defender).includes('flying') || abilityOf(defender) === 'levitate'
            || effectiveItem(defender) === 'air-balloon' || defender.volatile.semiInvulnerable === 'fly' || defender.volatile.semiInvulnerable === 'bounce')) {
          log(state, `${defender.pokemon.name} fell straight down!`, defender);
        }
        defender.volatile.smackedDown = true;
        break;
      case 'jaw-lock':
        if (!defender.volatile.jawLock && attacker.currentHp > 0) {
          defender.volatile.jawLock = { by: sideOf(state, attacker) };
          attacker.volatile.jawLock = { by: sideOf(state, attacker) };
          log(state, 'Neither Pokémon can run away!');
        }
        break;
      case 'throat-chop':
        defender.volatile.throatChop = { turns: 2 };
        break;
      case 'syrup-bomb':
        if (!defender.volatile.syrupBomb) {
          defender.volatile.syrupBomb = { turns: 3 };
          log(state, `${defender.pokemon.name} got covered in sticky candy syrup!`, defender);
        }
        break;
      case 'spirit-shackle':
      case 'anchor-shot':
        if (!defender.volatile.trapped) defender.volatile.trapped = { by: sideOf(state, attacker) };
        break;
      default:
        break;
    }
    if (THAWING_MOVES.has(moveLower) && defender.status === 'frozen') {
      clearStatus(defender);
      log(state, `${defender.pokemon.name} thawed out!`, defender);
    }
  }

  // Hazards from hits (even through a Substitute)
  if (hpDamage > 0 || ctx.hitSubstitute) {
    const hz = foeTeam.sideConditions.hazards;
    if (moveLower === 'ceaseless-edge' && (hz.spikes ?? 0) < 3) {
      hz.spikes = (hz.spikes ?? 0) + 1;
      log(state, 'Spikes were scattered on the ground around the opposing team!');
    }
    if (moveLower === 'stone-axe' && !hz.stealthRock) {
      hz.stealthRock = true;
      log(state, 'Pointed stones float in the air around the opposing team!');
    }
  }

  // Fell Stinger: +3 Attack on a KO
  if (moveLower === 'fell-stinger' && hpDamage > 0 && !targetAlive && attacker.currentHp > 0) {
    changeStatStage(state, attacker, 'attack', 3);
  }

  if (hpDamage > 0 || ctx.hitSubstitute) {
    if ((moveLower === 'ice-spinner' || moveLower === 'steel-roller') && state.field.terrain && attacker.currentHp > 0) {
      state.field.terrain = undefined;
      log(state, 'The battlefield returned to normal.');
    }
    if (moveLower === 'double-shock') loseType(state, attacker, 'electric');
    if (moveLower === 'burn-up') loseType(state, attacker, 'fire');
    if (moveLower === 'spit-up') releaseStockpile(state, attacker);
  }
  if (moveLower === 'glaive-rush') attacker.volatile.glaiveRush = true;
  // Stellar Tera Blast lowers the user's Attack and Sp. Atk
  if (moveLower === 'tera-blast' && ctx.moveType.toLowerCase() === 'stellar' && (hpDamage > 0 || ctx.hitSubstitute)) {
    changeStatStage(state, attacker, 'attack', -1);
    changeStatStage(state, attacker, 'specialAttack', -1);
  }
}
