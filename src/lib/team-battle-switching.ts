// Switching: pivots (U-turn, Baton Pass, Shed Tail), forced switches (Roar, Red Card), Revival Blessing,
// Eject Pack, and the switch-in sequence (hazards, entry abilities, items). Split out of
// team-battle-engine-additional.ts.

import { BattleState, BattlePokemon, BattleTeam, getCurrentPokemon, switchToPokemon, isTeamDefeated, getNextAvailableBenchPokemon, applySwitchOutAbilities, effectiveItem, getEffectiveSpeed, isTailwindActive } from './team-battle-engine';
import { applyEntryHazards } from './team-battle-hazards';
import { handleOnEntryAbilities } from './team-battle-abilities';
import { clearStatus } from './team-battle-status';
import { rngNextInt } from './battle-rng';
import { tryConsumeBerry, removeHeldItem } from './team-battle-items';
import { changeStatStage, checkWhiteHerb } from './team-battle-stat-stages';
import { targetAbility } from './team-battle-ability-rules';
import { updateParadoxBoosts } from './team-battle-paradox';
import { applyEntryAbilities, opportunistCopies, updateWeatherTerrainForms } from './team-battle-gen9-abilities';
import { maskIllusions, startIllusion } from './team-battle-illusion';
import { applyItemForms, updateHpForms } from './team-battle-forms';
import { PLATE_TYPES } from './team-battle-held-items';
import { restoreIceFaces } from './team-battle-end-of-turn';

/**
 * Item reactions once an action settles: Mental Herb (Taunt / Encore / Disable), Mirror Herb (copy the
 * foe's new boosts), and berries (status cures, Leppa, pinch berries) for both active Pokémon.
 */
export function afterActionItemChecks(state: BattleState): void {
  const sides = ['player', 'opponent'] as const;
  for (const side of sides) {
    const mon = getCurrentPokemon(side === 'player' ? state.player : state.opponent);
    if (mon.currentHp <= 0) continue;
    if (effectiveItem(mon) === 'mental-herb' && (mon.volatile.taunt || mon.volatile.encore || mon.volatile.disable)) {
      mon.volatile.taunt = undefined;
      mon.volatile.encore = undefined;
      mon.volatile.disable = undefined;
      removeHeldItem(mon);
      state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} cured its restrictions using its Mental Herb!`, pokemon: mon.pokemon.name });
    }
  }
  for (const side of sides) {
    const mon = getCurrentPokemon(side === 'player' ? state.player : state.opponent);
    const foe = getCurrentPokemon(side === 'player' ? state.opponent : state.player);
    const boosts = foe.volatile.recentBoosts;
    if (mon.currentHp > 0 && boosts && (opportunistCopies(mon) || effectiveItem(mon) === 'mirror-herb')) {
      if (opportunistCopies(mon)) {
        state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} copied its opponent's stat changes with Opportunist!`, pokemon: mon.pokemon.name });
      } else {
        removeHeldItem(mon);
        state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} used its Mirror Herb to mirror its opponent's stat changes!`, pokemon: mon.pokemon.name });
      }
      for (const [stat, amount] of Object.entries(boosts)) {
        if (amount) changeStatStage(state, mon, stat as keyof BattlePokemon['statModifiers'], amount);
      }
    }
  }
  for (const side of sides) {
    const mon = getCurrentPokemon(side === 'player' ? state.player : state.opponent);
    mon.volatile.recentBoosts = undefined;
    tryConsumeBerry(state, mon, side);
    updateWeatherTerrainForms(state, mon);
  }
}

/** Eject Pack holders whose stats were lowered switch out (consuming the pack). */
export async function checkEjectPacks(state: BattleState, allowPrompt: boolean): Promise<void> {
  for (const side of ['player', 'opponent'] as const) {
    const team = side === 'player' ? state.player : state.opponent;
    const mon = getCurrentPokemon(team);
    if (!mon.volatile.ejectPackPending) continue;
    delete mon.volatile.ejectPackPending;
    if (mon.currentHp <= 0 || effectiveItem(mon) !== 'eject-pack' || getSwitchCandidates(team).length === 0) continue;
    removeHeldItem(mon);
    state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} is switched out by the Eject Pack!`, pokemon: mon.pokemon.name });
    if (allowPrompt) await requestPivotSwitch(state, side);
    else await performPivotSwitch(state, side);
  }
}

/** Self-targeting / pivot move sets live in battle-move-constants.ts */

/** What Baton Pass hands to the replacement: stat stages and a subset of volatiles. */
export type BatonPassTransfer = {
  statModifiers: BattlePokemon['statModifiers'];
  volatile: Partial<BattlePokemon['volatile']>;
};

export function captureBatonPass(pokemon: BattlePokemon): BatonPassTransfer {
  const v = pokemon.volatile;
  const passed: Partial<BattlePokemon['volatile']> = {};
  if (v.substitute) passed.substitute = { ...v.substitute };
  if (v.confusion) passed.confusion = { ...v.confusion };
  if (v.leechSeed) {
    passed.leechSeed = v.leechSeed;
    if (v.leechSeedSource) passed.leechSeedSource = { ...v.leechSeedSource };
  }
  if (v.aquaRing) passed.aquaRing = v.aquaRing;
  if (v.perishSong) passed.perishSong = { ...v.perishSong };
  return { statModifiers: { ...pokemon.statModifiers }, volatile: passed };
}

export async function performPivotSwitch(
  state: BattleState,
  user: 'player' | 'opponent',
  options: { batonPass?: boolean; shedTail?: boolean; switchIndex?: number } = {},
): Promise<boolean> {
  const team = user === 'player' ? state.player : state.opponent;
  const outgoing = getCurrentPokemon(team);
  if (outgoing.currentHp <= 0) return false;
  const autoCandidates = getSwitchCandidates(team);
  const nextIndex = options.switchIndex
    ?? (state.autoSwitchPicker && autoCandidates.length ? state.autoSwitchPicker(state, user, autoCandidates) : getNextAvailableBenchPokemon(team));
  if (nextIndex === null || nextIndex === team.currentIndex || !team.pokemon[nextIndex] || team.pokemon[nextIndex].currentHp <= 0) {
    return false;
  }

  const transfer = options.batonPass
    ? captureBatonPass(outgoing)
    : options.shedTail
      ? { statModifiers: undefined, volatile: { substitute: { hp: Math.floor(outgoing.maxHp / 4) } } }
      : null;
  maskIllusions(state);
  applySwitchOutAbilities(outgoing);
  switchToPokemon(team, nextIndex);
  const replacement = getCurrentPokemon(team);
  if (transfer) {
    if (transfer.statModifiers) replacement.statModifiers = transfer.statModifiers;
    Object.assign(replacement.volatile, transfer.volatile);
  }
  state.battleLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${replacement.pokemon.name}!`,
    pokemon: replacement.pokemon.name,
  });
  await runEntrySequence(state, user, replacement);
  replacement.volatile.justSwitchedIn = true;
  return true;
}

/** Healthy bench Pokémon a side could send in. */
export function getSwitchCandidates(team: BattleTeam): number[] {
  return team.pokemon
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => i !== team.currentIndex && p.currentHp > 0)
    .map(({ i }) => i);
}

/**
 * Pivot moves call this instead of switching directly. When a player controls the side and has a real
 * choice (two or more healthy bench Pokémon), the turn pauses with `state.pendingSwitch`; otherwise the
 * next healthy bench Pokémon comes in immediately. Returns false when nothing can come in.
 */
export async function requestPivotSwitch(
  state: BattleState,
  user: 'player' | 'opponent',
  options: { batonPass?: boolean; shedTail?: boolean } = {},
): Promise<boolean> {
  const team = user === 'player' ? state.player : state.opponent;
  if (getCurrentPokemon(team).currentHp <= 0) return false;
  // A pivot that knocks out the foe's last Pokémon ends the battle; nobody switches
  if (isTeamDefeated(user === 'player' ? state.opponent : state.player)) return false;
  const candidates = getSwitchCandidates(team);
  if (candidates.length === 0) return false;
  if (state.manualSwitchSides?.includes(user) && candidates.length >= 2 && !state.pendingSwitch) {
    state.pendingSwitch = {
      side: user,
      reason: options.batonPass ? 'baton-pass' : options.shedTail ? 'shed-tail' : 'pivot',
      options: candidates,
    };
    return true;
  }
  return performPivotSwitch(state, user, options);
}

/** Revival Blessing: a fainted party member returns with half its max HP and no status. */
export function reviveTeamMember(state: BattleState, side: 'player' | 'opponent', index: number): void {
  const team = side === 'player' ? state.player : state.opponent;
  const mon = team.pokemon[index];
  if (!mon || mon.currentHp > 0) return;
  mon.currentHp = Math.max(1, Math.floor(mon.maxHp / 2));
  mon.status = undefined;
  mon.statusTurns = 0;
  mon.volatile = {};
  team.faintedCount = team.pokemon.filter((p) => p.currentHp <= 0).length;
  state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} was revived and is ready to fight again!`, pokemon: mon.pokemon.name });
}

/** Revival Blessing: a player with two or more fainted Pokémon picks (the turn pauses); otherwise automatic. */
export function requestRevivalBlessing(state: BattleState, user: 'player' | 'opponent'): void {
  const team = user === 'player' ? state.player : state.opponent;
  const fainted = team.pokemon.map((p, i) => ({ p, i })).filter(({ p }) => p.currentHp <= 0).map(({ i }) => i);
  if (fainted.length === 0) {
    state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
    return;
  }
  if (state.manualSwitchSides?.includes(user) && fainted.length >= 2) {
    state.pendingSwitch = { side: user, reason: 'revival-blessing', options: fainted };
    return;
  }
  reviveTeamMember(state, user, fainted[0]);
}

export const PHAZE_BLOCKING_ABILITIES: Record<string, string> = {
  'suction-cups': 'Suction Cups',
  'guard-dog': 'Guard Dog',
};

/**
 * Force the target side to switch to a random healthy bench Pokémon.
 * Returns true when a switch happened. `logFailure` writes "But it failed!" when nothing can come in.
 */
export async function forceTargetSwitch(
  state: BattleState,
  targetSide: 'player' | 'opponent',
  logFailure: boolean,
  source?: BattlePokemon,
): Promise<boolean> {
  const team = targetSide === 'player' ? state.player : state.opponent;
  const target = getCurrentPokemon(team);
  if (target.currentHp <= 0) return false;

  // Suction Cups / Guard Dog are breakable: Mold Breaker phazers ignore them
  const blocker = PHAZE_BLOCKING_ABILITIES[targetAbility(source, target) ?? ''];
  if (blocker) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${target.pokemon.name} anchors itself with ${blocker}!`,
      pokemon: target.pokemon.name,
    });
    return false;
  }

  const candidates = team.pokemon
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => i !== team.currentIndex && p.currentHp > 0)
    .map(({ i }) => i);
  if (candidates.length === 0) {
    if (logFailure) state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
    return false;
  }

  const nextIndex = candidates[rngNextInt(state.rng, candidates.length)];
  maskIllusions(state);
  applySwitchOutAbilities(target);
  switchToPokemon(team, nextIndex);
  const incoming = getCurrentPokemon(team);
  state.battleLog.push({
    type: 'pokemon_sent_out',
    message: `${incoming.pokemon.name} was dragged out!`,
    pokemon: incoming.pokemon.name,
  });
  await runEntrySequence(state, targetSide, incoming);
  incoming.volatile.justSwitchedIn = true;
  return true;
}

// Run on-entry sequence for a Pokemon (switchingSide = the side whose Pokemon is switching in)
/**
 * Battle start: both leads "switch in", faster one first (player first on a speed tie), so entry
 * abilities and items act before the first turn: Drizzle / Drought / Sand Stream / Snow Warning,
 * terrain setters, Intimidate, Air Balloon, ... Runs once per battle (state.leadsEntered).
 */
export async function runLeadEntries(state: BattleState): Promise<void> {
  if (state.leadsEntered) return;
  state.leadsEntered = true;
  const player = getCurrentPokemon(state.player);
  const opponent = getCurrentPokemon(state.opponent);
  if (!player || !opponent) return;
  const playerSpeed = getEffectiveSpeed(player, isTailwindActive(state.player), state.field);
  const opponentSpeed = getEffectiveSpeed(opponent, isTailwindActive(state.opponent), state.field);
  const order: Array<'player' | 'opponent'> = opponentSpeed > playerSpeed ? ['opponent', 'player'] : ['player', 'opponent'];
  for (const side of order) {
    const mon = getCurrentPokemon(side === 'player' ? state.player : state.opponent);
    if (mon && mon.currentHp > 0) await runEntrySequence(state, side, mon);
  }
}

export async function runEntrySequence(state: BattleState, switchingSide: 'player' | 'opponent', incomingPokemon: BattlePokemon): Promise<void> {
  incomingPokemon.volatile.moveActionsSinceEntry = 0;
  incomingPokemon.volatile.lastDamageTaken = undefined;
  incomingPokemon.volatile.movesUsedSinceEntry = [];
  if (state.field.rooms?.fairyLock) incomingPokemon.volatile.fairyLocked = true;
  // The Pokémon that left took its Mean Look / Jaw Lock / Attract / Imprison with it
  const foeTeamNow = switchingSide === 'player' ? state.opponent : state.player;
  const foeActive = foeTeamNow.pokemon[foeTeamNow.currentIndex];
  if (foeActive) {
    const fv = foeActive.volatile;
    if (fv.trapped?.by === switchingSide) fv.trapped = undefined;
    if (fv.infatuated?.by === switchingSide) fv.infatuated = undefined;
    fv.jawLock = undefined;
    fv.imprisonedMoves = undefined;
  }
  // Healing Wish / Lunar Dance: the replacement is fully healed
  const ownTeam = switchingSide === 'player' ? state.player : state.opponent;
  const wish = ownTeam.sideConditions.healingWish;
  if (wish && incomingPokemon.currentHp > 0 && (incomingPokemon.currentHp < incomingPokemon.maxHp || incomingPokemon.status
      || (wish === 'lunar-dance' && incomingPokemon.moves.some((m) => m.pp < m.maxPp)))) {
    ownTeam.sideConditions.healingWish = undefined;
    incomingPokemon.currentHp = incomingPokemon.maxHp;
    clearStatus(incomingPokemon);
    if (wish === 'lunar-dance') for (const m of incomingPokemon.moves) m.pp = m.maxPp;
    state.battleLog.push({
      type: 'healing',
      message: wish === 'lunar-dance' ? `${incomingPokemon.pokemon.name} became cloaked in mystical moonlight!` : `The healing wish came true for ${incomingPokemon.pokemon.name}!`,
      pokemon: incomingPokemon.pokemon.name,
      healing: 100,
    });
  }
  applyItemForms(state, incomingPokemon, PLATE_TYPES[effectiveItem(incomingPokemon) ?? ''], effectiveItem(incomingPokemon));
  startIllusion(state, switchingSide, incomingPokemon);
  if (state.field.rooms?.magicRoom) incomingPokemon.volatile.itemSuppressed = true;
  else delete incomingPokemon.volatile.itemSuppressed;
  if (state.field.rooms?.gravity) incomingPokemon.volatile.gravityGrounded = true;

  const switchingTeam = switchingSide === 'player' ? state.player : state.opponent;

  // Hazards are on the switching player's own side of the field
  const hazards = switchingTeam.sideConditions.hazards;
  const result = applyEntryHazards(incomingPokemon, hazards);

  if (result.damage > 0) {
    incomingPokemon.currentHp = Math.max(0, incomingPokemon.currentHp - result.damage);
    state.battleLog.push({
      type: 'status_damage',
      message: `${incomingPokemon.pokemon.name} is hurt by entry hazards!`,
      pokemon: incomingPokemon.pokemon.name,
      damage: Math.round((result.damage / incomingPokemon.maxHp) * 100),
    });
  }

  if (result.poisonStatus) {
    incomingPokemon.status = result.poisonStatus;
    incomingPokemon.statusTurns = 0;
    state.battleLog.push({
      type: 'status_applied',
      message: `${incomingPokemon.pokemon.name} was ${result.poisonStatus === 'badly-poisoned' ? 'badly poisoned' : 'poisoned'} by Toxic Spikes!`,
      pokemon: incomingPokemon.pokemon.name,
      status: result.poisonStatus.toUpperCase(),
    });
  }

  if (result.applyStickyWeb) {
    // The web counts as a foe's effect: Clear Body blocks it, Defiant / Competitive trigger
    const foeTeam = switchingSide === 'player' ? state.opponent : state.player;
    changeStatStage(state, incomingPokemon, 'speed', -1, {
      source: foeTeam.pokemon[foeTeam.currentIndex],
      reason: 'due to Sticky Web',
    });
  }

  if (result.absorbedToxicSpikes) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${incomingPokemon.pokemon.name} absorbed the Toxic Spikes!`,
      pokemon: incomingPokemon.pokemon.name,
    });
  }

  handleOnEntryAbilities(state, switchingSide, incomingPokemon);
  applyEntryAbilities(state, incomingPokemon);

  if (incomingPokemon.currentHp > 0 && effectiveItem(incomingPokemon) === 'air-balloon') {
    state.battleLog.push({
      type: 'status_effect',
      message: `${incomingPokemon.pokemon.name} floats in the air with its Air Balloon!`,
      pokemon: incomingPokemon.pokemon.name,
    });
  }
  checkWhiteHerb(state, getCurrentPokemon(state.player));
  checkWhiteHerb(state, getCurrentPokemon(state.opponent));
  updateParadoxBoosts(state);
  updateHpForms(state, incomingPokemon);
  afterActionItemChecks(state);
  // Switching in during snow restores Ice Face
  restoreIceFaces(state);
  // Eject Pack from entry effects (Intimidate, Sticky Web): the player picks while actions resolve;
  // switch-ins between turns (faint replacements) send the next Pokémon automatically
  await checkEjectPacks(state, !!state.resolvingActions);
}

/** After an automatic switch to the next unfainted Pokémon (mid-turn faint), apply hazards and on-entry abilities. */
export async function applyAutoSwitchInEffects(
  state: BattleState,
  side: 'player' | 'opponent',
  incoming: BattlePokemon
): Promise<void> {
  await runEntrySequence(state, side, incoming);
  incoming.volatile.justSwitchedIn = true;
}
