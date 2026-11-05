// Additional functions for the Gen-8/9 battle engine

import {
  BattleState,
  BattlePokemon,
  BattleTeam,
  getCurrentPokemon,
  switchToPokemon,
  getEffectiveSpeed,
  isTailwindActive,
  isTeamDefeated,
  canUseMove,
  applyStatusMoveEffects,
  calculateStat,
  getNextAvailablePokemon,
  getNextAvailableBenchPokemon,
  applySwitchOutAbilities,
  getMovePriority,
  consumePpForMove,
  getTeamForPokemon,
  isSafeguardActive,
  effectiveItem,
  syncItemSuppression,
} from './team-battle-engine';
import { recordMoveDataMiss } from './battle-engine-metrics';
import { calculateComprehensiveDamage, calculateTypeEffectiveness, TypeName } from './damage-calculator';
import { getCachedMove, getMove } from './moveCache';
import { applyEntryHazards, isGrounded, getPokemonTypes } from './team-battle-hazards';
import {
  applyVolatileAndHazardScripts,
  applyBindingOnHit,
} from './team-battle-scripts';
import {
  applyRampageAfterHit,
  beginTwoTurnCharge,
  clearTwoTurnState,
  completeTwoTurnCharge,
  endRampageWithConfusion,
  getTwoTurnKind,
  isRechargeMove,
  RECHARGE_MOVE_ID,
  scheduleRecharge,
  shouldSkipTwoTurnCharge,
} from './battle-multiturn';
import { handleOnEntryAbilities } from './team-battle-abilities';
import {
  applyWeatherResidual,
  applyTerrainHealing,
  decrementFieldTimers,
  applyLeechSeed,
  applyBindingDamage,
} from './team-battle-field';
import { getWeatherDuration, getTerrainDuration, getScreenDuration } from './team-battle-types';
import { applyEndOfTurnStatus, clearStatus, applyStatus, applyStartOfTurnStatus, terrainPreventsStatus, cureTeamStatuses } from './team-battle-status';
import { BattleRng, rngRollChance, rngNextInt, rngNextFloat } from './battle-rng';
import { tryConsumeBerry, tryHarvestBerry, checkTypeResistBerry, removeHeldItem, applyOnHitBerries } from './team-battle-items';
import { GRAVITY_BLOCKED_MOVES, PIVOT_MOVES, SELF_STATUS_MOVES } from './battle-move-constants';
import { prepareLiveDamageModifiers, toDamageTypeName } from './battle-damage-modifiers';
import { COUNTER_MOVES, getCounterDamage, moveFailsTryCondition, recordDamageTaken } from './team-battle-move-conditions';
import { changeStatStage, checkWhiteHerb, triggerWeaknessPolicy } from './team-battle-stat-stages';
import { abilityOf, targetAbility } from './team-battle-ability-rules';
import { updateParadoxBoosts } from './team-battle-paradox';
import { consumeStellarBoost, stabTypeNames, teraPowerFloor, teraStabOverride, terastallize } from './team-battle-tera';
import { OHKO_MOVES, ohkoFailure, ohkoHitChance, terrainPulseVariant, weatherBallVariant } from './team-battle-move-variants';
import { transformBlocked, transformInto } from './team-battle-transform';
import {
  ABILITY_IGNORING_MOVES,
  ALWAYS_CRIT_MOVES,
  CRASH_MOVES,
  DEFENSE_TARGETING_MOVES,
  HALF_HP_COST_MOVES,
  IGNORE_TARGET_STAGES_MOVES,
  NON_CALLABLE_MOVES,
  PER_HIT_ACCURACY_MOVES,
  PROTECT_BYPASS_MOVES,
  PROTECT_MOVES,
  SCREEN_BREAKING_MOVES,
  SELF_KO_MOVES,
  beatUpPowers,
  bypassesSubstitute,
  flingPower,
  gen9AccuracyOverride,
  gen9AfterHit,
  gen9BasePower,
  gen9MoveVariant,
  gen9StatusMoveScripts,
  gen9TryFailure,
  gen9TypeEffectMultiplier,
  rollPresent,
  typesOf,
} from './team-battle-gen9-moves';
import { rawStat, stageMultiplier } from './battle-stats';
import {
  abilityAccuracyModifier,
  abilityDamageModifiers,
  abilityFinalDamageMultiplier,
  abilityMoveTypeChange,
  applyAttackerHitAbilities,
  applyEndOfTurnAbilities,
  applyEntryAbilities,
  applyHitReactionAbilities,
  applyKoAbilities,
  applyMagician,
  applySereneGrace,
  applySynchronize,
  contactThroughProtect,
  ignoresEvasion,
  ignoresGhostImmunity,
  opportunistCopies,
  pressurePpCost,
  updateWeatherTerrainForms,
  wantsEmergencyExit,
} from './team-battle-gen9-abilities';
import { forceEatBerry } from './team-battle-items';
import { METRONOME_MOVES } from '@/data/metronome-moves';
import { breakIllusion, maskIllusions, startIllusion } from './team-battle-illusion';
import { applyIceFaceStats, applyItemForms, applyStanceChange, updateHpForms } from './team-battle-forms';
import { GEM_TYPES, PLATE_TYPES, SOUND_MOVES, isTrapped, isUnremovableItem, itemAccuracyMultiplier, itemPowerMultiplier, loadedDiceHits, makesContactFor, umbrellaBlocksWeather } from './team-battle-held-items';

// Process start-of-turn effects
export async function processStartOfTurn(state: BattleState): Promise<void> {
  // Magic Room / Gravity are stored on the field; mirror them onto every Pokémon
  syncItemSuppression(state);
  syncGravity(state);
  // Leads never ran an entry sequence: start Illusion / HP-based forms on their first turn
  for (const side of ['player', 'opponent'] as const) {
    const lead = getCurrentPokemon(side === 'player' ? state.player : state.opponent);
    applyItemForms(state, lead, PLATE_TYPES[effectiveItem(lead) ?? ''], effectiveItem(lead));
    if (lead.volatile.moveActionsSinceEntry === undefined && !lead.volatile.illusion) startIllusion(state, side, lead);
    updateHpForms(state, lead);
  }
  // Booster Energy / field-driven paradox boosts for the leads (and after Magic Room changes)
  updateParadoxBoosts(state);

  // 1. Update field condition messages (weather, terrain)
  if (state.field.weather) {
    const weatherMessages: Record<string, string> = {
      'rain': 'Rain continues to fall.',
      'sun': 'The sunlight is strong.',
      'sandstorm': 'The sandstorm rages.',
      'snow': 'Snow continues to fall.'
    };
    const message = weatherMessages[state.field.weather.kind];
    if (message) {
      state.battleLog.push({
        type: 'status_effect',
        message
      });
    }
  }
  
  if (state.field.terrain) {
    const terrainMessages: Record<string, string> = {
      'electric': 'Electric current runs across the battlefield.',
      'grassy': 'Grass is covering the battlefield.',
      'psychic': 'The battlefield is weird.',
      'misty': 'Mist swirls around the battlefield.'
    };
    const message = terrainMessages[state.field.terrain.kind];
    if (message) {
      state.battleLog.push({
        type: 'status_effect',
        message
      });
    }
  }
  
  // 2. Clear per-turn flags
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  
  state.lastMoveThisTurn = undefined;
  for (const mon of [playerPokemon, opponentPokemon]) {
    mon.volatile.statsLoweredThisTurn = undefined;
    mon.volatile.statsRaisedThisTurn = undefined;
  }
  // Beak Blast heats up before anyone moves
  for (const queued of state.actionQueue ?? []) {
    if (queued.type === 'move' && queued.moveId?.toLowerCase() === 'beak-blast') {
      const mon = queued.user === 'player' ? playerPokemon : opponentPokemon;
      mon.volatile.beakBlast = true;
      state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} started heating up its beak!`, pokemon: mon.pokemon.name });
    }
  }
  playerPokemon.volatile.flinched = false;
  playerPokemon.volatile.justSwitchedIn = false;
  playerPokemon.volatile.lastDamageTaken = undefined;
  if (playerPokemon.volatile.protect?.active) {
    playerPokemon.volatile.protect.active = false;
  } else {
    playerPokemon.volatile.protect = undefined;
  }
  opponentPokemon.volatile.flinched = false;
  opponentPokemon.volatile.justSwitchedIn = false;
  opponentPokemon.volatile.lastDamageTaken = undefined;
  if (opponentPokemon.volatile.protect?.active) {
    opponentPokemon.volatile.protect.active = false;
  } else {
    opponentPokemon.volatile.protect = undefined;
  }
  
  applyStartOfTurnStatus(state, playerPokemon, state.rng);
  applyStartOfTurnStatus(state, opponentPokemon, state.rng);
  
  // 3. Process Yawn (sleep next turn)
  if (playerPokemon.volatile.yawn) {
    playerPokemon.volatile.yawn.turns--;
    if (playerPokemon.volatile.yawn.turns <= 0) {
      applyStatus(playerPokemon, 'asleep', { rng: state.rng });
      playerPokemon.volatile.yawn = undefined;
      state.battleLog.push({
        type: 'status_applied',
        message: `${playerPokemon.pokemon.name} fell asleep!`,
        pokemon: playerPokemon.pokemon.name,
        status: 'ASLEEP'
      });
    }
  }
  
  if (opponentPokemon.volatile.yawn) {
    opponentPokemon.volatile.yawn.turns--;
    if (opponentPokemon.volatile.yawn.turns <= 0) {
      applyStatus(opponentPokemon, 'asleep', { rng: state.rng });
      opponentPokemon.volatile.yawn = undefined;
      state.battleLog.push({
        type: 'status_applied',
        message: `${opponentPokemon.pokemon.name} fell asleep!`,
        pokemon: opponentPokemon.pokemon.name,
        status: 'ASLEEP'
      });
    }
  }
}


// Resolve a switch action
export async function resolveSwitch(state: BattleState, action: BattleState['actionQueue'][0]): Promise<void> {
  const team = action.user === 'player' ? state.player : state.opponent;
  const switchIndex = action.switchIndex!;
  
  // Clear some volatiles from outgoing Pokemon
  const currentPokemon = getCurrentPokemon(team);
  // Bound Pokémon cannot switch (Ghost types and Shed Shell holders can)
  if (isTrapped(currentPokemon, getCurrentPokemon(action.user === 'player' ? state.opponent : state.player))) {
    state.battleLog.push({ type: 'status_effect', message: `${currentPokemon.pokemon.name} can't escape!`, pokemon: currentPokemon.pokemon.name });
    return;
  }
  currentPokemon.volatile.protect = undefined;
  currentPokemon.volatile.flinched = false;
  maskIllusions(state);
  applySwitchOutAbilities(currentPokemon);
  
  // Perform the switch
  switchToPokemon(team, switchIndex);
  const newPokemon = getCurrentPokemon(team);
  
  // Log the switch
  state.battleLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${newPokemon.pokemon.name}!`,
    pokemon: newPokemon.pokemon.name
  });
  
  // Run on-entry sequence (hazards from the switching player's own side, abilities, etc.)
  await runEntrySequence(state, action.user === 'player' ? 'player' : 'opponent', newPokemon);
  newPokemon.volatile.justSwitchedIn = true;
}

// Accuracy stage multiplier: stage 0 = 1.0, each +1 gives 4/3 ratio, each -1 gives 3/4 ratio
function getAccuracyMultiplier(netStage: number): number {
  const clamped = Math.max(-6, Math.min(6, netStage));
  if (clamped >= 0) return (3 + clamped) / 3;
  return 3 / (3 + Math.abs(clamped));
}

// Resolve a move action
export async function resolveMove(state: BattleState, action: BattleState['actionQueue'][0]): Promise<void> {
  const attacker = action.user === 'player' ? getCurrentPokemon(state.player) : getCurrentPokemon(state.opponent);
  const defender = action.user === 'player' ? getCurrentPokemon(state.opponent) : getCurrentPokemon(state.player);
  const moveId = action.moveId!;

  if (attacker.currentHp <= 0) {
    return;
  }

  // Every move action (including recharge / sleep / flinch turns) counts toward Fake Out's first-turn gate
  attacker.volatile.moveActionsSinceEntry = (attacker.volatile.moveActionsSinceEntry ?? 0) + 1;
  // Destiny Bond / Glaive Rush only last until the user's next move
  attacker.volatile.destinyBond = undefined;
  attacker.volatile.glaiveRush = undefined;
  state.currentAction = action;

  // Forced recharge turn after Hyper Beam family
  if (moveId === RECHARGE_MOVE_ID || attacker.volatile.mustRecharge) {
    attacker.volatile.mustRecharge = false;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} must recharge!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  const canUseResult = canUseMove(attacker, moveId, state.rng);
  if (canUseResult.snappedOutOfConfusion) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} snapped out of confusion!`,
      pokemon: attacker.pokemon.name,
    });
  }
  if (!canUseResult.canUse) {
    const reason = canUseResult.reason || 'couldn\'t use the move';
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} is ${reason}...`,
      pokemon: attacker.pokemon.name
    });
    // Failing a rampage turn (sleep / para / freeze / confusion self-hit) ends the lock with fatigue
    if (attacker.volatile.rampage) {
      endRampageWithConfusion(state, attacker);
    }
    markMoveFailed(attacker);
    return;
  }

  if (attacker.volatile.flinched) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} flinched and couldn't move!`,
      pokemon: attacker.pokemon.name
    });
    if (abilityOf(attacker) === 'steadfast') changeStatStage(state, attacker, 'speed', 1, { reason: 'thanks to Steadfast' });
    attacker.volatile.flinched = false;
    if (attacker.volatile.rampage) {
      endRampageWithConfusion(state, attacker);
    }
    markMoveFailed(attacker);
    return;
  }

  // Attract: 50% chance to be immobilized by love
  if (attacker.volatile.infatuated) {
    const foe = getCurrentPokemon(attacker.volatile.infatuated.by === 'player' ? state.player : state.opponent);
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is in love with ${foe.pokemon.name}!`, pokemon: attacker.pokemon.name });
    if (rngRollChance(state.rng, 0.5)) {
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is immobilized by love!`, pokemon: attacker.pokemon.name });
      markMoveFailed(attacker);
      return;
    }
  }

  let move: Awaited<ReturnType<typeof getMove>> | null = null;
  try {
    move = await getMove(moveId);
  } catch {
    recordMoveDataMiss(moveId);
    state.battleLog.push({
      type: 'engine_warning',
      message: `${attacker.pokemon.name} could not use ${moveId} (move data unavailable).`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }
  if (!move) {
    recordMoveDataMiss(moveId);
    state.battleLog.push({
      type: 'engine_warning',
      message: `${attacker.pokemon.name} could not use ${moveId} (move data missing).`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  const moveLower = moveId.toLowerCase();
  const pendingTwoTurn = attacker.volatile.twoTurn?.kind === 'pending' && attacker.volatile.twoTurn.move === moveLower;
  const startingTwoTurn =
    !pendingTwoTurn &&
    getTwoTurnKind(moveLower) != null &&
    !shouldSkipTwoTurnCharge(moveLower, state.field.weather?.kind);

  // Gravity: airborne moves cannot be used (a pending Fly / Bounce charge is cancelled)
  if (isBlockedByGravity(state, moveLower)) {
    if (pendingTwoTurn) clearTwoTurnState(attacker);
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} can't use ${moveId} because of gravity!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  // Power Herb: two-turn moves skip their charge turn (once)
  if (startingTwoTurn && effectiveItem(attacker) === 'power-herb') {
    removeHeldItem(attacker);
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} became fully charged due to its Power Herb!`, pokemon: attacker.pokemon.name });
  } else if (startingTwoTurn) {
    consumePpForMove(attacker, moveId);
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${moveId}!`,
      pokemon: attacker.pokemon.name,
      move: moveId,
    });
    beginTwoTurnCharge(state, attacker, moveId);
    return;
  }

  // Focus Punch: any damage taken this turn breaks the user's focus
  if (moveLower === 'focus-punch' && attacker.volatile.lastDamageTaken) {
    consumePpForMove(attacker, moveId);
    attacker.volatile.lastMoveUsed = moveId;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} lost its focus and couldn't move!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  // One-hit KO moves: fail against higher-level targets, Sturdy, or (Sheer Cold) Ice types
  if (OHKO_MOVES.has(moveLower)) {
    const failure = ohkoFailure(attacker, defender, moveLower, targetAbility(attacker, defender));
    if (failure) {
      consumePpForMove(attacker, moveId);
      attacker.volatile.lastMoveUsed = moveId;
      state.battleLog.push({ type: 'move_used', message: `${attacker.pokemon.name} used ${moveId}!`, pokemon: attacker.pokemon.name, move: moveId });
      state.battleLog.push({ type: 'status_effect', message: failure, pokemon: defender.pokemon.name });
      return;
    }
  }

  // Gen 9 conditions (Dream Eater, Poltergeist, Upper Hand, Belch, Damp vs Explosion, ...)
  const defenderSideId = action.user === 'player' ? 'opponent' : 'player';
  const queueForTry = state.actionQueue ?? [];
  const tryIdx = queueForTry.indexOf(action);
  const targetPending = (tryIdx >= 0 ? queueForTry.slice(tryIdx + 1) : [])
    .find((a) => a.user === defenderSideId && (a.type === 'move' || a.type === 'pursuit') && a.moveId);
  const gen9Failure = gen9TryFailure({
    state,
    attacker,
    defender,
    moveLower,
    targetPendingMove: targetPending?.moveId
      ? { moveId: targetPending.moveId, priority: targetPending.priority, category: getCachedMove(targetPending.moveId)?.category }
      : undefined,
  });
  if (gen9Failure) {
    consumePpForMove(attacker, moveId);
    attacker.volatile.lastMoveUsed = moveId;
    state.battleLog.push({ type: 'move_used', message: `${attacker.pokemon.name} used ${moveId}!`, pokemon: attacker.pokemon.name, move: moveId });
    state.battleLog.push({ type: 'status_effect', message: gen9Failure });
    markMoveFailed(attacker);
    return;
  }
  if (moveLower === 'poltergeist' && defender.heldItem) {
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} is about to be attacked by its ${defender.heldItem}!`, pokemon: defender.pokemon.name });
  }

  // onTry conditions (Fake Out, Sucker Punch, Counter, ...) fail before the accuracy roll
  if (await moveFailsTryCondition(state, action, attacker, defender, moveLower)) {
    consumePpForMove(attacker, moveId);
    attacker.volatile.lastMoveUsed = moveId;
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${moveId}!`,
      pokemon: attacker.pokemon.name,
      move: moveId,
    });
    state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
    markMoveFailed(attacker);
    return;
  }

  // Weather, Lock-On and Glaive Rush can make a move a sure hit (or change its accuracy)
  const accuracyOverride = gen9AccuracyOverride(state, attacker, defender, moveLower);
  // Compound Eyes / Victory Star / Hustle; No Guard on either side makes every move hit
  const abilityAccuracy = abilityAccuracyModifier(attacker, defender, move.category);
  attacker.volatile.lockOn = undefined;
  if (move.accuracy != null && !move.bypassAccuracyCheck && accuracyOverride !== Infinity && abilityAccuracy !== Infinity) {
    const accStage = attacker.statModifiers?.accuracy ?? 0;
    // Darkest Lariat / Sacred Sword ignore evasion boosts
    const evaStage = IGNORE_TARGET_STAGES_MOVES.has(moveLower) || ignoresEvasion(attacker) ? 0 : defender.statModifiers?.evasion ?? 0;
    const mult = getAccuracyMultiplier(accStage - evaStage);
    // Zoom Lens: did the target already act this turn?
    const defenderSide = action.user === 'player' ? 'opponent' : 'player';
    const queueNow = state.actionQueue ?? [];
    const idxNow = queueNow.indexOf(action);
    const targetAlreadyMoved = idxNow >= 0 && !queueNow.slice(idxNow + 1).some((a) => a.user === defenderSide);
    // OHKO moves ignore stat stages and use the level gap; Gravity boosts everything else x5/3
    const hitChance = OHKO_MOVES.has(moveLower)
      ? ohkoHitChance(attacker, defender, moveLower)
      : ((accuracyOverride ?? move.accuracy) / 100) * mult * (state.field.rooms?.gravity ? 5 / 3 : 1) * itemAccuracyMultiplier(attacker, defender, targetAlreadyMoved) * abilityAccuracy;
    attacker.volatile.micleBoost = undefined;
    if (!rngRollChance(state.rng, hitChance)) {
      consumePpForMove(attacker, moveId);
      state.battleLog.push({
        type: 'move_used',
        message: `${attacker.pokemon.name} used ${moveId}!`,
        pokemon: attacker.pokemon.name,
        move: moveId
      });
      state.battleLog.push({
        type: 'move_missed',
        message: `${attacker.pokemon.name}'s attack missed!`,
        pokemon: attacker.pokemon.name
      });
      // Blunder Policy: a miss sharply raises Speed (not for one-hit KO moves)
      if (effectiveItem(attacker) === 'blunder-policy' && !OHKO_MOVES.has(moveLower)) {
        removeHeldItem(attacker);
        state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} used its Blunder Policy!`, pokemon: attacker.pokemon.name });
        changeStatStage(state, attacker, 'speed', 2);
      }
      // Miss still advances an already-active rampage lock
      if (attacker.volatile.rampage?.move === moveLower) {
        applyRampageAfterHit(state, attacker, moveId, state.rng);
      }
      if (pendingTwoTurn) {
        clearTwoTurnState(attacker);
      }
      markMoveFailed(attacker);
      applyCrashDamage(state, attacker, moveLower);
      finishMove(state, attacker, moveLower, 0);
      return;
    }
  }

  // Sunsteel Strike / Moongeist Beam / Photon Geyser ignore the target's ability
  if (ABILITY_IGNORING_MOVES.has(moveLower) || (abilityOf(attacker) === 'mycelium-might' && move.category === 'Status')) {
    attacker.volatile.moldBreakerMove = true;
  }
  state.lastHitDamage = 0;
  const logStart = state.battleLog.length;
  await executeMoveAction(state, attacker, defender, moveId, action.user === 'player', action.user);
  attacker.volatile.moldBreakerMove = undefined;
  attacker.volatile.lastMoveFailed = state.battleLog.slice(logStart).some((e) =>
    /But it failed|doesn't affect|wasn't affected|attack missed/.test(e.message)
    || (e.message.endsWith('protected itself!') && e.pokemon !== attacker.pokemon.name));
  finishMove(state, attacker, moveLower, state.lastHitDamage ?? 0);

  // Throat Spray: using a sound move raises Sp. Atk
  if (SOUND_MOVES.has(moveLower) && attacker.currentHp > 0 && effectiveItem(attacker) === 'throat-spray') {
    removeHeldItem(attacker);
    changeStatStage(state, attacker, 'specialAttack', 1, { reason: 'thanks to its Throat Spray' });
  }
  afterActionItemChecks(state);

  // White Herb restores lowered stats once the move's effects have settled (Shell Smash, Intimidate, ...)
  checkWhiteHerb(state, getCurrentPokemon(state.player));
  checkWhiteHerb(state, getCurrentPokemon(state.opponent));
  // Eject Pack: any lowered stat sends the holder out (the player may pick)
  await checkEjectPacks(state, true);
}

/**
 * Item reactions once an action settles: Mental Herb (Taunt / Encore / Disable), Mirror Herb (copy the
 * foe's new boosts), and berries (status cures, Leppa, pinch berries) for both active Pokémon.
 */
function afterActionItemChecks(state: BattleState): void {
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

/** King's Shield / Spiky Shield / Baneful Bunker / Burning Bulwark / Silk Trap punish contact. */
function applyProtectContactEffects(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, contact: boolean): void {
  const kind = defender.volatile.protect?.kind;
  if (!contact || !kind || attacker.currentHp <= 0) return;
  const types = typesOf(attacker);
  switch (kind) {
    case 'kings-shield':
    case 'king-s-shield':
      changeStatStage(state, attacker, 'attack', -1, { source: defender });
      break;
    case 'silk-trap':
      changeStatStage(state, attacker, 'speed', -1, { source: defender });
      break;
    case 'spiky-shield': {
      if (abilityOf(attacker) === 'magic-guard') break;
      attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 8));
      state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} was hurt!`, pokemon: attacker.pokemon.name });
      if (attacker.currentHp <= 0) state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
      break;
    }
    case 'baneful-bunker':
      if (!attacker.status && !types.includes('poison') && !types.includes('steel')) {
        applyStatus(attacker, 'poisoned');
        state.battleLog.push({ type: 'status_applied', message: `${attacker.pokemon.name} was poisoned!`, pokemon: attacker.pokemon.name, status: 'POISONED' });
      }
      break;
    case 'burning-bulwark':
      if (!attacker.status && !types.includes('fire')) {
        applyStatus(attacker, 'burned');
        state.battleLog.push({ type: 'status_applied', message: `${attacker.pokemon.name} was burned!`, pokemon: attacker.pokemon.name, status: 'BURNED' });
      }
      break;
    default:
      break;
  }
}

/** Fling: some thrown items affect the target. */
function applyFlungItem(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, item: string): void {
  const types = typesOf(defender);
  const inflict = (status: NonNullable<BattlePokemon['status']>, label: string, immune: string[]) => {
    if (defender.status || immune.some((t) => types.includes(t))) return;
    applyStatus(defender, status);
    state.battleLog.push({ type: 'status_applied', message: `${defender.pokemon.name} was ${label}!`, pokemon: defender.pokemon.name, status: status.toUpperCase() });
  };
  if (item === 'flame-orb') inflict('burned', 'burned', ['fire']);
  else if (item === 'toxic-orb') inflict('badly-poisoned', 'badly poisoned', ['poison', 'steel']);
  else if (item === 'poison-barb') inflict('poisoned', 'poisoned', ['poison', 'steel']);
  else if (item === 'light-ball') inflict('paralyzed', 'paralyzed', ['electric']);
  else if (item === 'kings-rock' || item === 'razor-fang') defender.volatile.flinched = true;
  else if (item === 'white-herb') {
    for (const k of Object.keys(defender.statModifiers) as Array<keyof BattlePokemon['statModifiers']>) {
      if (defender.statModifiers[k] < 0) defender.statModifiers[k] = 0;
    }
  } else if (item === 'mental-herb') {
    defender.volatile.taunt = undefined;
    defender.volatile.encore = undefined;
    defender.volatile.disable = undefined;
    defender.volatile.torment = undefined;
    defender.volatile.infatuated = undefined;
  } else if (item.endsWith('-berry')) {
    forceEatBerry(state, defender, item);
  }
  void attacker;
}

/** Sleep Talk / Copycat / Metronome: announce and run another move (no PP, own accuracy roll). */
async function callMove(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  calledId: string,
  isPlayer: boolean,
  user: 'player' | 'opponent',
): Promise<void> {
  const called = await getMove(calledId);
  if (!called) {
    state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
    return;
  }
  state.battleLog.push({ type: 'move_used', message: `${attacker.pokemon.name} used ${calledId}!`, pokemon: attacker.pokemon.name, move: calledId });
  const override = gen9AccuracyOverride(state, attacker, defender, calledId);
  if (called.accuracy != null && !called.bypassAccuracyCheck && override !== Infinity && !SELF_STATUS_MOVES.has(calledId)) {
    const stage = Math.max(-6, Math.min(6, (attacker.statModifiers.accuracy ?? 0) - (defender.statModifiers.evasion ?? 0)));
    const chance = ((override ?? called.accuracy) / 100) * getAccuracyMultiplier(stage);
    if (!rngRollChance(state.rng, Math.min(1, chance))) {
      state.battleLog.push({ type: 'move_missed', message: `${attacker.pokemon.name}'s attack missed!`, pokemon: attacker.pokemon.name, move: calledId });
      return;
    }
  }
  await executeMoveAction(state, attacker, defender, calledId, isPlayer, user, false, true);
}

/** Status moves that switch, faint the user, or call other moves. Returns true when handled. */
async function runGen9AsyncStatusMove(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveLower: string,
  isPlayer: boolean,
  user: 'player' | 'opponent',
): Promise<boolean> {
  const team = user === 'player' ? state.player : state.opponent;
  const fail = () => state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
  switch (moveLower) {
    case 'teleport':
      if (getSwitchCandidates(team).length === 0) fail();
      else await requestPivotSwitch(state, user);
      return true;
    case 'chilly-reception':
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is preparing to tell a chillingly bad joke!`, pokemon: attacker.pokemon.name });
      scriptedStatusMoveHandlers.snowscape({ state, attacker, defender, isPlayer });
      if (getSwitchCandidates(team).length > 0) await requestPivotSwitch(state, user);
      return true;
    case 'healing-wish':
    case 'lunar-dance':
      team.sideConditions.healingWish = moveLower;
      attacker.currentHp = 0;
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
      team.faintedCount = team.pokemon.filter((p) => p.currentHp <= 0).length;
      return true;
    case 'sleep-talk': {
      const options = attacker.moves
        .map((m) => m.id.toLowerCase())
        .filter((id) => id !== 'sleep-talk' && !NON_CALLABLE_MOVES.has(id) && getTwoTurnKind(id) === null);
      if (options.length === 0) {
        fail();
        return true;
      }
      await callMove(state, attacker, defender, options[rngNextInt(state.rng, options.length)], isPlayer, user);
      return true;
    }
    case 'copycat':
      await callMove(state, attacker, defender, state.lastMoveInBattle!, isPlayer, user);
      return true;
    case 'metronome': {
      const known = new Set(attacker.moves.map((m) => m.id.toLowerCase()));
      const pool = METRONOME_MOVES.filter((id) => !NON_CALLABLE_MOVES.has(id) && !known.has(id));
      await callMove(state, attacker, defender, pool[rngNextInt(state.rng, pool.length)], isPlayer, user);
      return true;
    }
    case 'recycle':
      if (attacker.heldItem || !attacker.consumedItem) {
        fail();
        return true;
      }
      attacker.heldItem = attacker.consumedItem;
      attacker.consumedItem = undefined;
      attacker.volatile.unburdenActive = undefined;
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} found one ${attacker.heldItem}!`, pokemon: attacker.pokemon.name });
      return true;
    case 'stuff-cheeks': {
      const berry = removeHeldItem(attacker)!;
      attacker.consumedItem = berry;
      forceEatBerry(state, attacker, berry);
      changeStatStage(state, attacker, 'defense', 2);
      return true;
    }
    case 'teatime': {
      state.battleLog.push({ type: 'status_effect', message: 'It\'s teatime! Everyone dug in to their Berries!' });
      for (const mon of [attacker, defender]) {
        const item = effectiveItem(mon);
        if (mon.currentHp > 0 && item?.endsWith('-berry')) {
          removeHeldItem(mon);
          mon.consumedItem = item;
          forceEatBerry(state, mon, item);
        }
      }
      return true;
    }
    case 'defense-curl':
      attacker.volatile.defenseCurl = true;
      return false;
    default:
      return false;
  }
}

/** Remember that the user's move failed / missed (Stomping Tantrum, Temper Flare) and break streaks. */
function markMoveFailed(attacker: BattlePokemon): void {
  attacker.volatile.lastMoveFailed = true;
  attacker.volatile.rollout = undefined;
  attacker.volatile.furyCutter = undefined;
}

/** High Jump Kick, Jump Kick, Axe Kick, Supercell Slam: 1/2 max HP crash damage on a miss or failure. */
function applyCrashDamage(state: BattleState, attacker: BattlePokemon, moveLower: string): void {
  if (!CRASH_MOVES.has(moveLower) || attacker.currentHp <= 0 || abilityOf(attacker) === 'magic-guard') return;
  attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 2));
  state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} kept going and crashed!`, pokemon: attacker.pokemon.name });
  if (attacker.currentHp <= 0) {
    state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
  }
}

/**
 * After a move ran (hit or miss): self-KO moves, Steel Beam / Chloroblast HP cost, Rollout / Fury Cutter
 * streaks, Beak Blast ending, and "last move this turn" for the Fusion moves.
 */
function finishMove(state: BattleState, attacker: BattlePokemon, moveLower: string, damageDealt: number): void {
  attacker.volatile.beakBlast = undefined;
  state.lastMoveThisTurn = moveLower;
  const faint = (why?: string) => {
    if (attacker.currentHp <= 0) return;
    attacker.currentHp = 0;
    if (why) state.battleLog.push({ type: 'status_damage', message: why, pokemon: attacker.pokemon.name });
    state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
  };
  if (SELF_KO_MOVES.has(moveLower)) faint();
  if (attacker.currentHp > 0 && HALF_HP_COST_MOVES.has(moveLower) && (moveLower === 'steel-beam' || damageDealt > 0)
      && abilityOf(attacker) !== 'magic-guard') {
    attacker.currentHp = Math.max(0, attacker.currentHp - Math.ceil(attacker.maxHp / 2));
    state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} lost some of its HP!`, pokemon: attacker.pokemon.name });
    if (attacker.currentHp <= 0) {
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    }
  }
  if (moveLower === 'rollout' && damageDealt > 0) {
    const count = (attacker.volatile.rollout?.count ?? 0) + 1;
    attacker.volatile.rollout = count >= 5 ? undefined : { count };
  } else if (moveLower !== 'rollout') {
    attacker.volatile.rollout = undefined;
  }
  attacker.volatile.furyCutter = moveLower === 'fury-cutter' && damageDealt > 0 ? (attacker.volatile.furyCutter ?? 0) + 1 : undefined;
}

/** Eject Pack holders whose stats were lowered switch out (consuming the pack). */
async function checkEjectPacks(state: BattleState, allowPrompt: boolean): Promise<void> {
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

// Determine hit count for multi-hit moves
function determineHitCount(move: any, attacker: BattlePokemon, rng: BattleRng): number {
  // Check if move is multi-hit
  if (!move.hits) return 1;
  
  const minHits = move.hits.min || 1;
  const maxHits = move.hits.max || 1;
  
  // Fixed hit count moves (e.g., Double Kick = 2, Triple Kick = 3)
  if (minHits === maxHits) return minHits;
  
  // Skill Link ability always gives max hits
  const ability = attacker.currentAbility?.toLowerCase();
  if (ability === 'skill-link') return maxHits;
  
  // For 2-5 hit moves, use Gen 9 distribution:
  // 35% for 2 hits, 35% for 3 hits, 15% for 4 hits, 15% for 5 hits
  if (minHits === 2 && maxHits === 5) {
    const roll = rngNextFloat(rng);
    if (roll < 0.35) return 2;
    if (roll < 0.70) return 3;
    if (roll < 0.85) return 4;
    return 5;
  }
  
  // Default: random between min and max
  return minHits + rngNextInt(rng, maxHits - minHits + 1);
}

const AILMENT_TO_STATUS: Record<string, BattlePokemon['status']> = {
  paralysis: 'paralyzed',
  burn: 'burned',
  poison: 'poisoned',
  toxic: 'badly-poisoned',
  sleep: 'asleep',
  freeze: 'frozen',
};

const STATUS_LABELS: Record<string, string> = {
  paralyzed: 'paralyzed',
  burned: 'burned',
  poisoned: 'poisoned',
  'badly-poisoned': 'badly poisoned',
  asleep: 'fell asleep',
  frozen: 'was frozen solid',
};

const STAT_ABBR_TO_NAME: Record<string, keyof BattlePokemon['statModifiers']> = {
  atk: 'attack', def: 'defense', spa: 'specialAttack',
  spd: 'specialDefense', spe: 'speed', acc: 'accuracy', eva: 'evasion',
};

function applyMoveAilment(
  state: BattleState, move: any,
  _attacker: BattlePokemon, defender: BattlePokemon,
  isSecondary = false,
): void {
  if (!move.ailment || move.ailment.kind === 'flinch' || move.ailment.kind === 'none') return;
  // Burning Jealousy (burn) / Alluring Voice (confusion) only affect a target whose stats rose this turn
  const ailmentMove = String(move.name ?? '').toLowerCase();
  if ((ailmentMove === 'burning-jealousy' || ailmentMove === 'alluring-voice') && !defender.volatile.statsRaisedThisTurn) return;

  if (move.ailment.kind === 'confusion') {
    if (defender.volatile.confusion) return;
    // Misty Terrain protects grounded Pokemon from confusion
    if (state.field.terrain?.kind === 'misty' && isGrounded(defender)) {
      return;
    }
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? (isSecondary ? 0 : 100)) / 100;
    if (chance > 0 && !rngRollChance(state.rng, chance)) return;
    defender.volatile.confusion = { turns: 2 + rngNextInt(state.rng, 4) };
    state.battleLog.push({ type: 'status_applied', message: `${defender.pokemon.name} became confused!`, pokemon: defender.pokemon.name, status: 'CONFUSED' });
    return;
  }

  const status = AILMENT_TO_STATUS[move.ailment.kind];
  if (!status || defender.status) return;

  // Terrain blocks certain statuses on grounded Pokemon
  if (terrainPreventsStatus(state.field.terrain?.kind, defender, status)) {
    return;
  }

  // Safeguard blocks non-volatile status (and confusion is handled above)
  if (isSafeguardActive(getTeamForPokemon(state, defender))) {
    return;
  }

  if (isSecondary) {
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? 0) / 100;
    if (!rngRollChance(state.rng, chance)) return;
  } else {
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? 100) / 100;
    if (!rngRollChance(state.rng, chance)) return;
  }

  applyStatus(defender, status, status === 'asleep' ? { rng: state.rng } : undefined);
  const label = STATUS_LABELS[status!] ?? status;
  state.battleLog.push({
    type: 'status_applied',
    message: `${defender.pokemon.name} was ${label}!`,
    pokemon: defender.pokemon.name,
    status: status as string,
  });
  applySynchronize(state, defender, _attacker);
}

const SELF_STAT_DROP_MOVES = new Set([
  'close-combat', 'superpower', 'overheat', 'draco-meteor', 'leaf-storm',
  'v-create', 'hammer-arm', 'psycho-boost', 'shell-smash', 'fleur-cannon',
  'hyperspace-fury', 'clanging-scales', 'scale-shot', 'make-it-rain', 'armor-cannon', 'headlong-rush', 'spin-out',
  'ice-hammer', 'dragon-ascent', 'hammer-arm',
]);

/** Ailments that are part of a move's main effect rather than a Sheer Force-able secondary. */
const PRIMARY_AILMENTS = new Set(['none', 'trap', 'unknown']);

/** Damaging moves whose extra effects are "secondary" (Sheer Force boosts them and removes the effects). */
function hasSheerForceSecondary(move: any, moveLower: string): boolean {
  if (move.category === 'Status' || SELF_STAT_DROP_MOVES.has(moveLower)) return false;
  if (move.ailment?.kind && !PRIMARY_AILMENTS.has(move.ailment.kind)) return true;
  if (typeof move.flinchChance === 'number' && move.flinchChance > 0) return true;
  return Array.isArray(move.statChanges) && move.statChanges.length > 0;
}

/** PokeAPI targets of status moves whose stat changes land on the user. */
const SELF_TARGETS = new Set(['user', 'users-field', 'user-and-allies', 'user-or-ally', 'ally', 'all-allies']);

function applyMoveSecondaryStatChanges(
  state: BattleState, move: any,
  attacker: BattlePokemon, defender: BattlePokemon,
  isSecondary = false,
  /** Covert Cloak: skip changes aimed at the defender. */
  defenderShielded = false,
): void {
  if (!move.statChanges || move.statChanges.length === 0) return;
  const selfDrop = SELF_STAT_DROP_MOVES.has(move.name?.toLowerCase?.() ?? '');
  const isStatus = move.category === 'Status';
  const declaredTarget: string | undefined = typeof move.target === 'string' ? move.target : undefined;
  for (const sc of move.statChanges) {
    const chance = (sc.chance ?? 100) / 100;
    if (!rngRollChance(state.rng, chance)) continue;
    let target: BattlePokemon;
    if (selfDrop) target = attacker;
    else if (isStatus && declaredTarget) target = SELF_TARGETS.has(declaredTarget) ? attacker : defender;
    // Damaging moves (and status moves without target metadata): boosts go to the user, drops to the foe
    else target = sc.stages > 0 ? attacker : defender;
    const statName = STAT_ABBR_TO_NAME[sc.stat];
    if (!statName) continue;
    if (defenderShielded && target === defender) continue;
    changeStatStage(state, target, statName, sc.stages, {
      source: attacker,
      // Chance-based riders on attacks fail silently; status moves announce "won't go any higher"
      quietFailure: isSecondary && !isStatus,
    });
  }
}

/** Flinch from PokeAPI `flinchChance` (or an explicit `ailment.kind === 'flinch'` in hand-written move data). */
export function moveFlinchChance(move: any): number {
  if (typeof move?.flinchChance === 'number' && move.flinchChance > 0) return move.flinchChance / 100;
  if (move?.ailment?.kind === 'flinch') {
    const raw = move.ailment.chance ?? 0;
    return raw === 0 ? 1 : raw / 100;
  }
  return 0;
}

function applyMoveFlinch(state: BattleState, move: any, defender: BattlePokemon): void {
  const chance = moveFlinchChance(move);
  if (chance > 0 && rngRollChance(state.rng, chance)) {
    defender.volatile.flinched = true;
  }
}

type ScriptedStatusMoveHandler = (ctx: {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  isPlayer: boolean;
}) => boolean;

const scriptedStatusMoveHandlers: Record<string, ScriptedStatusMoveHandler> = {
  'sunny-day': ({ state, attacker }) => {
    state.field.weather = { kind: 'sun', turns: getWeatherDuration('sun', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'The sunlight turned harsh!' });
    return true;
  },
  'rain-dance': ({ state, attacker }) => {
    state.field.weather = { kind: 'rain', turns: getWeatherDuration('rain', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to rain!' });
    return true;
  },
  sandstorm: ({ state, attacker }) => {
    state.field.weather = { kind: 'sandstorm', turns: getWeatherDuration('sandstorm', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'A sandstorm kicked up!' });
    return true;
  },
  hail: ({ state, attacker }) => {
    state.field.weather = { kind: 'snow', turns: getWeatherDuration('snow', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to snow!' });
    return true;
  },
  snowscape: ({ state, attacker }) => {
    state.field.weather = { kind: 'snow', turns: getWeatherDuration('snow', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to snow!' });
    return true;
  },
  'electric-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'electric', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'An electric current runs across the battlefield!' });
    return true;
  },
  'grassy-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'grassy', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'Grass grew to cover the battlefield!' });
    return true;
  },
  'misty-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'misty', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'Mist swirled around the battlefield!' });
    return true;
  },
  'psychic-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'psychic', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'The battlefield got weird!' });
    return true;
  },
  'trick-room': ({ state, attacker }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.trickRoom) {
      delete state.field.rooms.trickRoom;
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} twisted the dimensions back to normal!` });
    } else {
      state.field.rooms.trickRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} twisted the dimensions!` });
      // Room Service: -1 Speed when Trick Room starts
      for (const team of [state.player, state.opponent]) {
        const mon = getCurrentPokemon(team);
        if (mon.currentHp > 0 && effectiveItem(mon) === 'room-service') {
          removeHeldItem(mon);
          changeStatStage(state, mon, 'speed', -1, { reason: 'due to its Room Service' });
        }
      }
    }
    return true;
  },
  'destiny-bond': ({ state, attacker }) => {
    attacker.volatile.destinyBond = true;
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is hoping to take its attacker down with it!`, pokemon: attacker.pokemon.name });
    return true;
  },
  gravity: ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.gravity) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    state.field.rooms.gravity = { turns: 5 };
    syncGravity(state);
    state.battleLog.push({ type: 'status_effect', message: 'Gravity intensified!' });
    groundAirbornePokemon(state);
    return true;
  },
  curse: ({ state, attacker, defender }) => {
    const isGhost = getPokemonTypes(attacker).map((t) => String(t).toLowerCase()).includes('ghost');
    if (!isGhost) {
      changeStatStage(state, attacker, 'speed', -1);
      changeStatStage(state, attacker, 'attack', 1);
      changeStatStage(state, attacker, 'defense', 1);
      return true;
    }
    if (defender.volatile.cursed || defender.currentHp <= 0) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 2));
    defender.volatile.cursed = true;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} cut its own HP and laid a curse on ${defender.pokemon.name}!`,
      pokemon: attacker.pokemon.name,
    });
    if (attacker.currentHp <= 0) {
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    }
    return true;
  },
  transform: ({ state, attacker, defender }) => {
    if (transformBlocked(attacker, defender) || !transformInto(attacker, defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} transformed into ${defender.pokemon.name}!`, pokemon: attacker.pokemon.name });
    return true;
  },
  'magic-room': ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.magicRoom) {
      delete state.field.rooms.magicRoom;
      state.battleLog.push({ type: 'status_effect', message: 'Magic Room wore off, and held items regained their effects!' });
    } else {
      state.field.rooms.magicRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: "It created a bizarre area in which Pokémon's held items lose their effects!" });
    }
    syncItemSuppression(state);
    return true;
  },
  'wonder-room': ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.wonderRoom) {
      delete state.field.rooms.wonderRoom;
      state.battleLog.push({ type: 'status_effect', message: 'Wonder Room wore off, and Defense and Sp. Def stats returned to normal!' });
    } else {
      state.field.rooms.wonderRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: 'It created a bizarre area in which Defense and Sp. Def stats are swapped!' });
    }
    return true;
  },
  trick: ({ state, attacker, defender }) => {
    if (isUnremovableItem(attacker) || isUnremovableItem(defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    const aItem = attacker.heldItem;
    const dItem = defender.heldItem;
    attacker.heldItem = dItem;
    defender.heldItem = aItem;
    attacker.volatile.choiceLock = undefined;
    defender.volatile.choiceLock = undefined;
    syncUnburdenAfterItemChange(attacker, Boolean(aItem), Boolean(attacker.heldItem));
    syncUnburdenAfterItemChange(defender, Boolean(dItem), Boolean(defender.heldItem));
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} switched items with ${defender.pokemon.name}!`,
    });
    return true;
  },
  switcheroo: ({ state, attacker, defender }) => {
    if (isUnremovableItem(attacker) || isUnremovableItem(defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    const aItem = attacker.heldItem;
    const dItem = defender.heldItem;
    attacker.heldItem = dItem;
    defender.heldItem = aItem;
    attacker.volatile.choiceLock = undefined;
    defender.volatile.choiceLock = undefined;
    syncUnburdenAfterItemChange(attacker, Boolean(aItem), Boolean(attacker.heldItem));
    syncUnburdenAfterItemChange(defender, Boolean(dItem), Boolean(defender.heldItem));
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} switched items with ${defender.pokemon.name}!`,
    });
    return true;
  },
};

function syncUnburdenAfterItemChange(
  pokemon: BattlePokemon,
  hadItem: boolean,
  hasItem: boolean
): void {
  if (pokemon.currentAbility?.toLowerCase() !== 'unburden') return;
  if (hadItem && !hasItem) {
    pokemon.volatile.unburdenActive = true;
  } else if (hasItem) {
    pokemon.volatile.unburdenActive = undefined;
  }
}

/** Apply absorbed hit to Substitute; returns true if the Substitute took the hit. */
function absorbHitWithSubstitute(
  state: BattleState,
  defender: BattlePokemon,
  damage: number
): boolean {
  if (!defender.volatile.substitute || damage <= 0) return false;
  const sub = defender.volatile.substitute;
  if (damage >= sub.hp) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s substitute faded!`,
      pokemon: defender.pokemon.name,
    });
    defender.volatile.substitute = undefined;
  } else {
    sub.hp -= damage;
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s substitute took the hit!`,
      pokemon: defender.pokemon.name,
    });
  }
  return true;
}

/** Self-targeting / pivot move sets live in battle-move-constants.ts */

/** What Baton Pass hands to the replacement: stat stages and a subset of volatiles. */
type BatonPassTransfer = {
  statModifiers: BattlePokemon['statModifiers'];
  volatile: Partial<BattlePokemon['volatile']>;
};

function captureBatonPass(pokemon: BattlePokemon): BatonPassTransfer {
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

async function performPivotSwitch(
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

/** PokeAPI targets that aim a status move at the foe (or its side), i.e. what Magic Bounce can reflect. */
const FOE_TARGETS = new Set(['selected-pokemon', 'all-opponents', 'opponents-field', 'random-opponent', 'all-other-pokemon']);
const HAZARD_MOVES = new Set(['stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web']);
/** Foe-targeting status moves without Showdown's `reflectable` flag. */
const NON_REFLECTABLE_MOVES = new Set(['trick', 'switcheroo', 'transform', 'sketch', 'mimic', 'curse', 'destiny-bond', 'baton-pass', 'magic-room', 'wonder-room', 'trick-room']);

function isReflectableStatusMove(move: { category?: string; target?: string }, moveLower: string): boolean {
  if (move.category !== 'Status' || NON_REFLECTABLE_MOVES.has(moveLower)) return false;
  if (typeof move.target === 'string') return FOE_TARGETS.has(move.target);
  return HAZARD_MOVES.has(moveLower) || !SELF_STATUS_MOVES.has(moveLower);
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
async function requestPivotSwitch(
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

/** Items consumed for +1 to a stat when hit by a move of their type. */
const TYPE_HIT_ITEMS: Record<string, { type: string; stat: keyof BattlePokemon['statModifiers']; label: string }> = {
  'absorb-bulb': { type: 'water', stat: 'specialAttack', label: 'Absorb Bulb' },
  'cell-battery': { type: 'electric', stat: 'attack', label: 'Cell Battery' },
  'snowball': { type: 'ice', stat: 'attack', label: 'Snowball' },
  'luminous-moss': { type: 'water', stat: 'specialDefense', label: 'Luminous Moss' },
};

/** Protean / Libero: the user becomes the move's type before acting (once per entry; not while Terastallized). */
function applyProtean(state: BattleState, mon: BattlePokemon, moveTypeRaw: string, moveLower: string): void {
  const ability = abilityOf(mon);
  if ((ability !== 'protean' && ability !== 'libero') || mon.volatile.proteanUsed || mon.terastallized) return;
  if (moveLower === 'struggle' || moveLower === RECHARGE_MOVE_ID) return;
  const moveType = moveTypeRaw.toLowerCase();
  const current = getPokemonTypes(mon).map((t) => String(t).toLowerCase());
  mon.volatile.proteanUsed = true;
  if (current.length === 1 && current[0] === moveType) return;
  if (!mon.volatile.typeChange) mon.volatile.typeChange = mon.pokemon.types;
  mon.pokemon = { ...mon.pokemon, types: [{ slot: 1, type: { name: moveType, url: '' } }] as any };
  state.battleLog.push({
    type: 'status_effect',
    message: `${mon.pokemon.name} transformed into the ${moveType.charAt(0).toUpperCase()}${moveType.slice(1)} type!`,
    pokemon: mon.pokemon.name,
  });
}

/**
 * Disguise (any damaging hit) and Ice Face (physical hits) take one hit for the holder.
 * Mold Breaker ignores both. Returns the damage that still reaches HP.
 */
function applyDisguiseShields(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, damage: number, category: string): number {
  if (damage <= 0 || defender.currentHp <= 0) return damage;
  const ability = targetAbility(attacker, defender);
  if (ability === 'disguise' && !defender.disguiseBusted) {
    defender.disguiseBusted = true;
    state.battleLog.push({ type: 'status_effect', message: 'Its disguise served it as a decoy!', pokemon: defender.pokemon.name });
    const chip = Math.max(1, Math.floor(defender.maxHp / 8));
    defender.currentHp = Math.max(0, defender.currentHp - chip);
    state.battleLog.push({ type: 'status_damage', message: `${defender.pokemon.name}'s disguise was busted!`, pokemon: defender.pokemon.name });
    return 0;
  }
  if (ability === 'ice-face' && category === 'Physical' && !defender.iceFaceBroken) {
    defender.iceFaceBroken = true;
    applyIceFaceStats(defender, 'noice');
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name}'s Ice Face took the hit!`, pokemon: defender.pokemon.name });
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} transformed into Noice Face!`, pokemon: defender.pokemon.name });
    return 0;
  }
  return damage;
}

/** Revival Blessing: a fainted party member returns with half its max HP and no status. */
function reviveTeamMember(state: BattleState, side: 'player' | 'opponent', index: number): void {
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
function requestRevivalBlessing(state: BattleState, user: 'player' | 'opponent'): void {
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

/** Roar / Whirlwind (status) and Dragon Tail / Circle Throw (after damage) drag out a random bench Pokémon. */
const PHAZING_STATUS_MOVES = new Set(['roar', 'whirlwind']);
const PHAZING_DAMAGE_MOVES = new Set(['dragon-tail', 'circle-throw']);

const PHAZE_BLOCKING_ABILITIES: Record<string, string> = {
  'suction-cups': 'Suction Cups',
  'guard-dog': 'Guard Dog',
};

/**
 * Force the target side to switch to a random healthy bench Pokémon.
 * Returns true when a switch happened. `logFailure` writes "But it failed!" when nothing can come in.
 */
async function forceTargetSwitch(
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

function tryAbilityAbsorb(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveTypeRaw: string,
  moveCategory: string,
): boolean {
  const ability = targetAbility(attacker, defender);
  if (!ability) return false;
  const moveType = moveTypeRaw.toLowerCase();

  const healQuarter = () => {
    const heal = Math.floor(defender.maxHp / 4);
    if (heal > 0 && defender.currentHp < defender.maxHp) {
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      state.battleLog.push({
        type: 'healing',
        message: `${defender.pokemon.name} restored HP with ${ability}!`,
        pokemon: defender.pokemon.name,
        healing: Math.round((heal / defender.maxHp) * 100),
      });
    } else {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name}'s ${ability} made it immune!`,
        pokemon: defender.pokemon.name,
      });
    }
  };

  const boostStat = (key: 'attack' | 'specialAttack' | 'speed') => {
    changeStatStage(state, defender, key, 1, { reason: `thanks to its ${ability}` });
  };

  if (ability === 'flash-fire' && moveType === 'fire') {
    defender.volatile.flashFireActive = true;
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s Flash Fire raised its Fire power!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }
  if (ability === 'volt-absorb' && moveType === 'electric') {
    healQuarter();
    return true;
  }
  if (ability === 'water-absorb' && moveType === 'water') {
    healQuarter();
    return true;
  }
  if (ability === 'storm-drain' && moveType === 'water') {
    boostStat('specialAttack');
    return true;
  }
  if (ability === 'lightning-rod' && moveType === 'electric') {
    boostStat('specialAttack');
    return true;
  }
  if (ability === 'sap-sipper' && moveType === 'grass') {
    boostStat('attack');
    return true;
  }
  if (ability === 'motor-drive' && moveType === 'electric') {
    boostStat('speed');
    return true;
  }
  if (ability === 'levitate' && moveType === 'ground' && !defender.volatile.gravityGrounded) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} is immune via Levitate!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }
  if (ability === 'wonder-guard' && moveCategory !== 'Status') {
    const atkType = (moveType.charAt(0).toUpperCase() + moveType.slice(1)) as TypeName;
    const defTypes = getPokemonTypes(defender).map((t) => {
      const s = String(t);
      return (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as TypeName;
    });
    const effectiveness = calculateTypeEffectiveness(atkType, defTypes);
    if (effectiveness <= 1) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name}'s Wonder Guard blocked the attack!`,
        pokemon: defender.pokemon.name,
      });
      return true;
    }
  }
  return false;
}

// Execute a move action with multi-hit support
async function executeMoveAction(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
  isPlayer: boolean,
  user: 'player' | 'opponent',
  /** Set when Magic Bounce sends a status move back: the reflector neither spends PP nor "uses" the move. */
  reflected = false,
  /** Called by Sleep Talk / Copycat / Metronome: no PP, already announced. */
  called = false,
): Promise<void> {
  // Copycat copies the move that was called, never the calling move itself
  if (!reflected && !['struggle', 'copycat', 'sleep-talk', 'metronome'].includes(moveId.toLowerCase())) {
    state.lastMoveInBattle = moveId.toLowerCase();
    const used = attacker.volatile.movesUsedSinceEntry ?? [];
    if (!used.includes(moveId)) attacker.volatile.movesUsedSinceEntry = [...used, moveId];
  }
  if (!reflected && !called) {
    consumePpForMove(attacker, moveId);
    // Pressure: one extra PP for moves aimed at the holder
    const ppSlot = attacker.moves.find((m) => m.id === moveId);
    if (ppSlot && ppSlot.pp > 0 && pressurePpCost(defender, !SELF_STATUS_MOVES.has(moveId.toLowerCase()))) ppSlot.pp -= 1;

    // Metronome (item): +20% per consecutive use of the same move
    attacker.volatile.metronomeStreak =
      attacker.volatile.lastMoveUsed?.toLowerCase() === moveId.toLowerCase() ? (attacker.volatile.metronomeStreak ?? 0) + 1 : 0;

    if (moveId.toLowerCase() !== 'struggle') {
      attacker.volatile.lastMoveUsed = moveId;
    }

    // Choice items lock the user into the selected move
    const itemLower = effectiveItem(attacker);
    if (
      (itemLower === 'choice-scarf' || itemLower === 'choice-band' || itemLower === 'choice-specs') &&
      moveId.toLowerCase() !== 'struggle'
    ) {
      attacker.volatile.choiceLock = moveId;
    }

    // Log the move usage
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${moveId}!`,
      pokemon: attacker.pokemon.name,
      move: moveId
    });
  }
  
  // Get move data
  let move = await getMove(moveId);
  if (!move) {
    console.error(`Move ${moveId} not found`);
    return;
  }

  const moveLower = moveId.toLowerCase();
  // Weather Ball / Terrain Pulse take the field's type and double in power
  if (moveLower === 'weather-ball') {
    const variant = weatherBallVariant(state.field.weather?.kind);
    if (variant) move = { ...move, type: variant.type as typeof move.type, power: variant.power };
  } else if (moveLower === 'judgment') {
    // Judgment takes the type of the user's Plate
    const plateType = PLATE_TYPES[effectiveItem(attacker) ?? ''];
    if (plateType) move = { ...move, type: (plateType.charAt(0).toUpperCase() + plateType.slice(1)) as typeof move.type };
  } else if (moveLower === 'terrain-pulse') {
    const variant = terrainPulseVariant(state.field.terrain?.kind, isGrounded(attacker));
    if (variant) move = { ...move, type: variant.type as typeof move.type, power: variant.power };
  }
  move = gen9MoveVariant(state, attacker, defender, move as any, moveLower) as typeof move;
  if (ALWAYS_CRIT_MOVES.has(moveLower)) move = { ...move, critRateStage: 3 };
  // -ate abilities / Normalize / Liquid Voice change the type (and boost the -ates and Normalize)
  let ateBoost = 1;
  const ate = abilityMoveTypeChange(attacker, String(move.type), moveLower, move.category);
  if (ate) {
    move = { ...move, type: (ate.type.charAt(0).toUpperCase() + ate.type.slice(1)) as typeof move.type };
    ateBoost = ate.boost;
  }
  move = applySereneGrace(attacker, move as any) as typeof move;
  // Merciless: always a critical hit on a poisoned target
  if (abilityOf(attacker) === 'merciless' && (defender.status === 'poisoned' || defender.status === 'badly-poisoned')) {
    move = { ...move, critRateStage: 3 };
  }
  if (!reflected) {
    applyStanceChange(state, attacker, moveId, move.category);
    applyProtean(state, attacker, String(move.type), moveLower);
  }
  const attackerAbilityEarly = attacker.currentAbility?.toLowerCase();
  const effectivePriority = getMovePriority(moveId, attacker);

  // Psychic Terrain blocks priority moves against grounded opposing targets
  const targetsOpponent = !SELF_STATUS_MOVES.has(moveLower);
  if (
    state.field.terrain?.kind === 'psychic' &&
    effectivePriority > 0 &&
    targetsOpponent &&
    isGrounded(defender)
  ) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} is protected by Psychic Terrain!`,
      pokemon: defender.pokemon.name,
    });
    return;
  }

  // Prankster: Dark-types are immune to status moves boosted by Prankster
  if (
    attackerAbilityEarly === 'prankster' &&
    move.category === 'Status' &&
    targetsOpponent
  ) {
    const defenderTypes = getPokemonTypes(defender).map((t) => String(t).toLowerCase());
    if (defenderTypes.includes('dark')) {
      state.battleLog.push({
        type: 'status_effect',
        message: `It doesn't affect ${defender.pokemon.name}...`,
        pokemon: defender.pokemon.name,
      });
      return;
    }
  }
  
  // Handle status moves (no direct damage).
  // Note: moves with power=null (like seismic-toss, night-shade) are NOT status moves.
  if (move.category === 'Status') {
    // Magic Bounce reflects foe-targeting status moves (breakable; a bounced move cannot bounce again)
    if (!reflected && isReflectableStatusMove(move, moveLower) && targetAbility(attacker, defender) === 'magic-bounce') {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name} bounced the ${moveId} back!`,
        pokemon: defender.pokemon.name,
      });
      await executeMoveAction(state, defender, attacker, moveId, !isPlayer, user === 'player' ? 'opponent' : 'player', true);
      return;
    }

    if (PHAZING_STATUS_MOVES.has(moveLower)) {
      // Sound/wind phazing ignores Protect and Substitute in this engine
      await forceTargetSwitch(state, user === 'player' ? 'opponent' : 'player', true, attacker);
      return;
    }
    if (moveLower === 'baton-pass') {
      if (!(await requestPivotSwitch(state, user, { batonPass: true }))) {
        state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      }
      return;
    }
    if (moveLower === 'shed-tail') {
      // Pay half max HP for a 1/4-HP substitute that the replacement inherits
      const cost = Math.ceil(attacker.maxHp / 2);
      const team = user === 'player' ? state.player : state.opponent;
      if (attacker.currentHp <= cost) {
        state.battleLog.push({ type: 'status_effect', message: 'But it does not have enough HP left to make a substitute!' });
      } else if (getSwitchCandidates(team).length === 0) {
        state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      } else {
        attacker.currentHp -= cost;
        state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} shed its tail to create a decoy!`, pokemon: attacker.pokemon.name });
        await requestPivotSwitch(state, user, { shedTail: true });
      }
      return;
    }
    if (moveLower === 'revival-blessing') {
      requestRevivalBlessing(state, user);
      return;
    }

    // Protect blocks foe-targeting status moves (King's Shield / Silk Trap only stop attacks)
    const prot = defender.volatile.protect;
    if (prot?.active && prot.kind !== 'endure' && prot.kind !== 'kings-shield' && prot.kind !== 'king-s-shield' && prot.kind !== 'silk-trap'
        && isReflectableStatusMove(move, moveLower) && defender !== attacker) {
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} protected itself!`, pokemon: defender.pokemon.name });
      return;
    }

    if (await runGen9AsyncStatusMove(state, attacker, defender, moveLower, isPlayer, user)) {
      return;
    }
    const gen9Script = gen9StatusMoveScripts[moveLower];
    if (gen9Script?.({ state, attacker, defender, isPlayer })) {
      return;
    }

    const scripted = scriptedStatusMoveHandlers[moveLower];
    if (scripted?.({ state, attacker, defender, isPlayer })) {
      return;
    }

    // Healing moves
    const HEALING_FRACTIONS: Record<string, number> = {
      'recover': 0.5, 'soft-boiled': 0.5, 'milk-drink': 0.5,
      'roost': 0.5, 'synthesis': 0.5, 'moonlight': 0.5,
      'morning-sun': 0.5, 'shore-up': 0.5, 'slack-off': 0.5,
      'heal-pulse': 0.5, 'life-dew': 0.25,
      'rest': 1.0,
    };
    if (HEALING_FRACTIONS[moveLower] !== undefined) {
      const frac = HEALING_FRACTIONS[moveLower];
      const healAmount = Math.floor(attacker.maxHp * frac);
      const oldHp = attacker.currentHp;
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      const actual = attacker.currentHp - oldHp;
      if (actual > 0) {
        state.battleLog.push({
          type: 'healing',
          message: `${attacker.pokemon.name} restored ${Math.round((actual / attacker.maxHp) * 100)}% HP!`,
          pokemon: attacker.pokemon.name,
          healing: Math.round((actual / attacker.maxHp) * 100),
        });
      }
      if (moveLower === 'rest') {
        applyStatus(attacker, 'asleep', { sleepTurns: 2 });
        attacker.currentHp = attacker.maxHp;
        state.battleLog.push({
          type: 'status_applied',
          message: `${attacker.pokemon.name} fell asleep due to Rest!`,
          pokemon: attacker.pokemon.name,
          status: 'asleep',
        });
      }
      return;
    }

    // Team status cure
    if (moveLower === 'heal-bell' || moveLower === 'aromatherapy') {
      const team = isPlayer ? state.player : state.opponent;
      const cured = cureTeamStatuses(
        state,
        team,
        moveLower as 'heal-bell' | 'aromatherapy',
        attacker.pokemon.name,
      );
      if (cured === 0) {
        state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      }
      return;
    }

    // Protect / Detect
    if (PROTECT_MOVES.has(moveLower)) {
      const prot = attacker.volatile.protect;
      const consecutiveUses = prot?.counter ?? 0;
      const successChance = 1 / Math.pow(3, consecutiveUses);
      // Protect-family moves fail when the user moves last in the turn
      const queue = state.actionQueue ?? [];
      const idx = state.currentAction ? queue.indexOf(state.currentAction) : -1;
      const movesLast = idx >= 0 && !queue.slice(idx + 1).some((a) => a.type === 'move' || a.type === 'pursuit');
      if (!movesLast && rngRollChance(state.rng, successChance)) {
        attacker.volatile.protect = { active: true, counter: consecutiveUses + 1, kind: moveLower };
        state.battleLog.push({
          type: 'status_effect',
          message: moveLower === 'endure' ? `${attacker.pokemon.name} braced itself!` : `${attacker.pokemon.name} protected itself!`,
          pokemon: attacker.pokemon.name,
        });
      } else {
        attacker.volatile.protect = undefined;
        state.battleLog.push({
          type: 'status_effect',
          message: `${attacker.pokemon.name}'s Protect failed!`,
          pokemon: attacker.pokemon.name,
        });
      }
      return;
    }


    // Screen-setting moves
    const attackerSide = isPlayer ? state.player : state.opponent;
    const screenTurns = getScreenDuration(effectiveItem(attacker));
    if (moveLower === 'reflect') {
      attackerSide.sideConditions.screens.reflect = { turns: screenTurns };
      state.battleLog.push({ type: 'status_effect', message: `Reflect raised ${attacker.pokemon.name}'s team's Defense!` });
      return;
    }
    if (moveLower === 'light-screen') {
      attackerSide.sideConditions.screens.lightScreen = { turns: screenTurns };
      state.battleLog.push({ type: 'status_effect', message: `Light Screen raised ${attacker.pokemon.name}'s team's Sp. Def!` });
      return;
    }
    if (moveLower === 'aurora-veil') {
      if (state.field.weather?.kind === 'snow') {
        attackerSide.sideConditions.screens.auroraVeil = { turns: screenTurns };
        state.battleLog.push({ type: 'status_effect', message: `Aurora Veil made ${attacker.pokemon.name}'s team stronger against physical and special moves!` });
      } else {
        state.battleLog.push({ type: 'status_effect', message: `But it failed!` });
      }
      return;
    }

    // Hazard-setting moves
    const defenderSide = isPlayer ? state.opponent : state.player;
    if (moveLower === 'stealth-rock') {
      if (!defenderSide.sideConditions.hazards.stealthRock) {
        defenderSide.sideConditions.hazards.stealthRock = true;
        state.battleLog.push({ type: 'status_effect', message: `Pointed stones float in the air around the opposing team!` });
      } else {
        state.battleLog.push({ type: 'status_effect', message: `But it failed!` });
      }
      return;
    }
    if (moveLower === 'spikes') {
      if ((defenderSide.sideConditions.hazards.spikes ?? 0) < 3) {
        defenderSide.sideConditions.hazards.spikes = (defenderSide.sideConditions.hazards.spikes ?? 0) + 1;
        state.battleLog.push({ type: 'status_effect', message: `Spikes were scattered on the ground around the opposing team!` });
      } else {
        state.battleLog.push({ type: 'status_effect', message: `But it failed!` });
      }
      return;
    }
    if (moveLower === 'toxic-spikes') {
      if ((defenderSide.sideConditions.hazards.toxicSpikes ?? 0) < 2) {
        defenderSide.sideConditions.hazards.toxicSpikes = (defenderSide.sideConditions.hazards.toxicSpikes ?? 0) + 1;
        state.battleLog.push({ type: 'status_effect', message: `Poison spikes were scattered on the ground around the opposing team!` });
      } else {
        state.battleLog.push({ type: 'status_effect', message: `But it failed!` });
      }
      return;
    }
    if (moveLower === 'sticky-web') {
      if (!defenderSide.sideConditions.hazards.stickyWeb) {
        defenderSide.sideConditions.hazards.stickyWeb = true;
        state.battleLog.push({ type: 'status_effect', message: `A sticky web has been laid out on the ground around the opposing team!` });
      } else {
        state.battleLog.push({ type: 'status_effect', message: `But it failed!` });
      }
      return;
    }

    if (applyVolatileAndHazardScripts(state, moveLower, attacker, defender, isPlayer)) {
      if (moveLower === 'parting-shot') {
        await requestPivotSwitch(state, user);
      }
      return;
    }

    await applyStatusMoveEffects(attacker, defender, move, state);
    applyMoveAilment(state, move, attacker, defender);
    applyMoveSecondaryStatChanges(state, move, attacker, defender);
    if (moveLower === 'parting-shot') {
      await requestPivotSwitch(state, user);
    }
    return;
  }
  
  // Check if defender is protected
  if (defender.volatile.protect && defender.volatile.protect.active && defender.volatile.protect.kind !== 'endure') {
    // Feint, Hyperspace Hole and moves with "bypassesProtect" go through Protect (Feint also lifts it)
    const bypassesProtect = PROTECT_BYPASS_MOVES.has(moveLower) || move.bypassesProtect
      || contactThroughProtect(attacker, makesContactFor(attacker, move, moveLower));
    if (bypassesProtect && moveLower === 'feint') {
      defender.volatile.protect.active = false;
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} fell for the feint!`, pokemon: defender.pokemon.name });
    }
    
    if (!bypassesProtect) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name} protected itself!`,
        pokemon: defender.pokemon.name
      });
      applyProtectContactEffects(state, attacker, defender, makesContactFor(attacker, move, moveLower));
      applyCrashDamage(state, attacker, moveLower);
      
      // Increment protect counter for next turn
      if (!defender.volatile.protect.counter) {
        defender.volatile.protect.counter = 1;
      }
      if (attacker.volatile.twoTurn?.kind === 'pending') {
        clearTwoTurnState(attacker);
      }
      if (attacker.volatile.rampage?.move === moveLower) {
        applyRampageAfterHit(state, attacker, moveId, state.rng);
      }
      return; // Move blocked
    }
  }

  // Completing Dig/Fly/Solar Beam — leave semi-invulnerable before dealing damage
  if (attacker.volatile.twoTurn?.kind === 'pending' && attacker.volatile.twoTurn.move === moveLower) {
    clearTwoTurnState(attacker);
  }

  // Ability absorbs / immunities before damage
  if (tryAbilityAbsorb(state, attacker, defender, String(move.type), move.category)) {
    return;
  }

  // Future Sight / Doom Desire: the attack lands two turns later on whoever is there
  if (moveLower === 'future-sight' || moveLower === 'doom-desire') {
    const foeTeam = isPlayer ? state.opponent : state.player;
    foeTeam.sideConditions.futureAttack = {
      move: moveLower,
      turns: 3,
      user: attacker.pokemon.name,
      level: attacker.level,
      attackStat: Math.floor(rawStat(attacker, 'special-attack') * stageMultiplier(attacker.statModifiers.specialAttack)),
      attackerTypes: stabTypeNames(attacker).map((t) => String(t).toLowerCase()),
      power: typeof move.power === 'number' && move.power > 0 ? move.power : 120,
      type: String(move.type || (moveLower === 'doom-desire' ? 'Steel' : 'Psychic')),
    };
    state.battleLog.push({
      type: 'status_effect',
      message: moveLower === 'future-sight' ? `${attacker.pokemon.name} foresaw an attack!` : `${attacker.pokemon.name} chose Doom Desire as its destiny!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  // Brick Break / Psychic Fangs / Raging Bull shatter screens first
  if (SCREEN_BREAKING_MOVES.has(moveLower)) {
    const foeScreens = (isPlayer ? state.opponent : state.player).sideConditions.screens;
    if (foeScreens.reflect || foeScreens.lightScreen || foeScreens.auroraVeil) {
      foeScreens.reflect = undefined;
      foeScreens.lightScreen = undefined;
      foeScreens.auroraVeil = undefined;
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} shattered the barrier!`, pokemon: attacker.pokemon.name });
    }
  }

  // Fling: throws the held item (its power and, for some items, its effect)
  let flungItem: string | undefined;
  if (moveLower === 'fling') {
    flungItem = removeHeldItem(attacker);
    if (flungItem) {
      attacker.consumedItem = flungItem;
      move = { ...move, power: flingPower(flungItem) };
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} flung its ${flungItem}!`, pokemon: attacker.pokemon.name });
    }
  }

  // Present: random power or a heal for the target
  if (moveLower === 'present') {
    const power = rollPresent(state);
    if (power === 0) {
      const before = defender.currentHp;
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + Math.floor(defender.maxHp / 4));
      state.battleLog.push({ type: 'healing', message: `${defender.pokemon.name} restored HP!`, pokemon: defender.pokemon.name, healing: Math.round(((defender.currentHp - before) / defender.maxHp) * 100) });
      return;
    }
    move = { ...move, power };
  }

  // Situational base power (Stored Power, Payback, Hard Press, Last Respects, Rollout, ...)
  {
    const queueNow = state.actionQueue ?? [];
    const idxNow = state.currentAction ? queueNow.indexOf(state.currentAction) : -1;
    const foeSide = user === 'player' ? 'opponent' : 'player';
    const targetMovedFirst = idxNow >= 0 && queueNow.slice(0, idxNow).some((a) => a.user === foeSide && a.type !== 'switch');
    const bp = gen9BasePower({
      state, attacker, defender, moveLower, moveType: String(move.type), basePower: typeof move.power === 'number' ? move.power : 0, targetMovedFirst,
    });
    if (bp > 0 && bp !== move.power) move = { ...move, power: bp };
  }

  // Air Balloon: immune to Ground-type attacks while the balloon is up
  if (String(move.type).toLowerCase() === 'ground' && effectiveItem(defender) === 'air-balloon' && !defender.volatile.gravityGrounded) {
    state.battleLog.push({
      type: 'status_effect',
      message: `It doesn't affect ${defender.pokemon.name}...`,
      pokemon: defender.pokemon.name,
    });
    return;
  }

  // Sheer Force: +30% power for moves with secondary effects, which are then dropped (and Life Orb recoil with them)
  const sheerForce = abilityOf(attacker) === 'sheer-force' && hasSheerForceSecondary(move, moveLower);

  // Gems: consumed to boost the first damaging move of their type (not fixed-damage moves or immune targets)
  let gemBoost = 1;
  const gemType = GEM_TYPES[effectiveItem(attacker) ?? ''];
  if (gemType && typeof move.power === 'number' && move.power > 0 && String(move.type).toLowerCase() === gemType) {
    const defTypes = getPokemonTypes(defender).map((t) => toDamageTypeName(String(t)));
    if (calculateTypeEffectiveness(toDamageTypeName(gemType), defTypes) > 0) {
      const gemLabel = `${gemType.charAt(0).toUpperCase()}${gemType.slice(1)} Gem`;
      removeHeldItem(attacker);
      gemBoost = 1.3;
      state.battleLog.push({ type: 'status_effect', message: `The ${gemLabel} strengthened ${attacker.pokemon.name}'s power!`, pokemon: attacker.pokemon.name });
    }
  }
  
  // Determine number of hits
  // Triple Kick / Triple Axel / Population Bomb roll accuracy per hit; Beat Up hits once per teammate
  const perHit = PER_HIT_ACCURACY_MOVES[moveLower];
  const beatUp = moveLower === 'beat-up' ? beatUpPowers(state, attacker) : null;
  const skillLink = abilityOf(attacker) === 'skill-link';
  const baseHitCount = beatUp
    ? beatUp.length
    : perHit
      ? (moveLower === 'population-bomb' && effectiveItem(attacker) === 'loaded-dice' && !skillLink
        ? 4 + rngNextInt(state.rng, 7)
        : perHit.hits)
      : move.hits && move.hits.min !== move.hits.max
        ? loadedDiceHits(attacker, move.hits.min, move.hits.max, state.rng) ?? determineHitCount(move, attacker, state.rng)
        : determineHitCount(move, attacker, state.rng);
  // Parental Bond: single-hit attacks strike twice, the second at 1/4 power
  const parentalBond = abilityOf(attacker) === 'parental-bond' && baseHitCount === 1 && !beatUp && !perHit
    && !SELF_KO_MOVES.has(moveLower) && !OHKO_MOVES.has(moveLower)
    && !['fling', 'final-gambit', 'endeavor', 'struggle'].includes(moveLower);
  const hitCount = parentalBond ? 2 : baseHitCount;
  const rollsEachHit = !!perHit && !skillLink && effectiveItem(attacker) !== 'loaded-dice';
  const baseMove = move;
  const defenderHpAtStart = defender.currentHp;
  const queueForOrder = state.actionQueue ?? [];
  const orderIdx = state.currentAction ? queueForOrder.indexOf(state.currentAction) : -1;
  const movesLastInTurn = orderIdx >= 0 && !queueForOrder.slice(orderIdx + 1).some((a) => a.type === 'move' || a.type === 'pursuit');
  /** Last hit's type effectiveness (Enigma Berry). */
  let lastEffectiveness = 1;
  const contact = makesContactFor(attacker, move, moveLower);
  let totalDamageDealt = 0;
  /** Damage that reached the defender's HP (not a Substitute) — feeds Counter / Mirror Coat / Metal Burst. */
  let hpDamageDealt = 0;
  /** A super-effective hit reached HP (Weakness Policy). */
  let superEffectiveHpHit = false;
  let actualHits = 0;
  let hitSubstitute = false;
  
  // Execute each hit
  for (let i = 0; i < hitCount; i++) {
    // Check if defender is still alive
    if (defender.currentHp <= 0) {
      break; // Stop hitting if target fainted
    }
    if (beatUp) move = { ...baseMove, power: beatUp[i] };
    if (perHit) {
      if (perHit.powerStep > 0) move = { ...baseMove, power: perHit.powerStep * (i + 1) };
      if (i > 0 && rollsEachHit && typeof baseMove.accuracy === 'number') {
        const acc = (baseMove.accuracy / 100) * getAccuracyMultiplier(Math.max(-6, Math.min(6, (attacker.statModifiers.accuracy ?? 0) - (defender.statModifiers.evasion ?? 0))));
        if (!rngRollChance(state.rng, Math.min(1, acc))) break;
      }
    }
    
    const defenderSideConditions = isPlayer ? state.opponent.sideConditions : state.player.sideConditions;

    // Get stats from the Pokemon data structure
    const isPhysical = move.category === 'Physical';
    // Raw stats honour Power / Guard Split, Speed Swap and Power Trick
    let attackStat = rawStat(attacker, isPhysical ? 'attack' : 'special-attack');
    // Foul Play uses the target's Attack; Body Press uses the user's Defense
    if (moveLower === 'foul-play') attackStat = rawStat(defender, 'attack');
    if (moveLower === 'body-press') attackStat = rawStat(attacker, 'defense');
    // Psyshock / Psystrike / Secret Sword hit Defense; Wonder Room swaps every raw Defense and Sp. Def
    const wonderRoom = !!state.field.rooms?.wonderRoom;
    const hitsDefense = isPhysical || DEFENSE_TARGETING_MOVES.has(moveLower);
    const usesDefenseStat = hitsDefense !== wonderRoom;
    let defenseStat = rawStat(defender, usesDefenseStat ? 'defense' : 'special-defense');

    // Sandstorm Rock SpD / Snow Ice Def
    const weatherKind = state.field.weather?.kind;
    if (!isPhysical && weatherKind === 'sandstorm') {
      const defTypes = getPokemonTypes(defender).map((t) => String(t).toLowerCase());
      if (defTypes.includes('rock')) defenseStat = Math.floor(defenseStat * 1.5);
    }
    if (isPhysical && weatherKind === 'snow') {
      const defTypes = getPokemonTypes(defender).map((t) => String(t).toLowerCase());
      if (defTypes.includes('ice')) defenseStat = Math.floor(defenseStat * 1.5);
    }

    // Fixed-damage moves bypass the normal formula
    const FIXED_DAMAGE_MOVES: Record<string, (atk: BattlePokemon, def: BattlePokemon) => number> = {
      'seismic-toss': (a) => a.level,
      'night-shade': (a) => a.level,
      'dragon-rage': () => 40,
      'sonic-boom': () => 20,
      'super-fang': (_a, d) => Math.max(1, Math.floor(d.currentHp / 2)),
      'endeavor': (a, d) => Math.max(0, d.currentHp - a.currentHp),
      'final-gambit': (a) => a.currentHp,
      ruination: (_a, d) => Math.max(1, Math.floor(d.currentHp / 2)),
      'natures-madness': (_a, d) => Math.max(1, Math.floor(d.currentHp / 2)),
      // One-hit KO moves (failure and accuracy were handled before the move ran)
      fissure: (_a, d) => d.currentHp,
      guillotine: (_a, d) => d.currentHp,
      'horn-drill': (_a, d) => d.currentHp,
      'sheer-cold': (_a, d) => d.currentHp,
    };
    for (const counterMove of Object.keys(COUNTER_MOVES)) {
      FIXED_DAMAGE_MOVES[counterMove] = (a) => getCounterDamage(a, counterMove) ?? 0;
    }

    const fixedFn = FIXED_DAMAGE_MOVES[moveId.toLowerCase()];
    if (fixedFn) {
      // Fixed-damage moves still respect type immunity (Seismic Toss vs Ghost, Mirror Coat vs Dark, ...)
      const atkType = toDamageTypeName(String(move.type || 'normal'));
      const defTypes = getPokemonTypes(defender).map((t) => toDamageTypeName(String(t)))
        .filter((t) => !(t === 'Ghost' && ignoresGhostImmunity(attacker, String(atkType))));
      if (calculateTypeEffectiveness(atkType, defTypes) === 0) {
        state.battleLog.push({
          type: 'status_effect',
          message: `It doesn't affect ${defender.pokemon.name}...`,
          pokemon: defender.pokemon.name,
        });
        return;
      }
      const fixedDmg = applyDisguiseShields(state, attacker, defender, fixedFn(attacker, defender), move.category);
      if (!bypassesSubstitute(attacker, moveLower) && absorbHitWithSubstitute(state, defender, fixedDmg)) {
        hitSubstitute = true;
        totalDamageDealt += fixedDmg;
        actualHits++;
        continue;
      }
      const hpBefore = defender.currentHp;
      defender.currentHp = Math.max(0, defender.currentHp - fixedDmg);
      hpDamageDealt += hpBefore - defender.currentHp;
      if (OHKO_MOVES.has(moveLower) && defender.currentHp <= 0) {
        state.battleLog.push({ type: 'status_effect', message: "It's a one-hit KO!" });
      }
      totalDamageDealt += fixedDmg;
      actualHits++;
      continue;
    }

    // Calculate damage using the comprehensive damage calculator
    const prep = prepareLiveDamageModifiers({
      rng: state.rng,
      move,
      moveId,
      // Utility Umbrella: sun / rain do not change this hit
      weatherKind: umbrellaBlocksWeather(state, attacker, defender) ? undefined : state.field.weather?.kind,
      terrainKind: state.field.terrain?.kind,
      attacker,
      defender,
    });
    if (sheerForce) prep.powerMultiplier *= 1.3;
    prep.powerMultiplier *= itemPowerMultiplier(attacker, move.category, moveLower) * gemBoost;
    // ...and their stat stages come from the same stat (critical hits ignore drops)
    if (moveLower === 'foul-play' || moveLower === 'body-press') {
      const stage = moveLower === 'foul-play' ? defender.statModifiers.attack : attacker.statModifiers.defense;
      prep.attackStatStages = prep.isCrit ? Math.max(0, stage) : stage;
    }
    prep.movePower = teraPowerFloor(attacker, String(prep.moveType), prep.movePower, move);
    const abilityMods = abilityDamageModifiers({
      state, attacker, defender, moveLower, moveType: String(prep.moveType), isPhysical: prep.isPhysical,
      contact, hasRecoil: !!move.recoil, movesLast: movesLastInTurn,
    });
    prep.attackMultiplier *= abilityMods.attack;
    prep.defenseMultiplier *= abilityMods.defense;
    prep.powerMultiplier *= abilityMods.power * ateBoost * (parentalBond && i === 1 ? 0.25 : 1);
    if (DEFENSE_TARGETING_MOVES.has(moveLower)) {
      // Psyshock hits Defense: Assault Vest (Sp. Def) does nothing, Fur Coat (Defense) does
      if (effectiveItem(defender) === 'assault-vest') prep.defenseMultiplier /= 1.5;
      if (targetAbility(attacker, defender) === 'fur-coat') prep.defenseMultiplier *= 2;
      const stage = defender.statModifiers.defense;
      prep.defenseStatStages = prep.attackerAbility === 'unaware' && !prep.isCrit ? 0 : prep.isCrit ? Math.min(0, stage) : stage;
    }
    if (IGNORE_TARGET_STAGES_MOVES.has(moveLower)) prep.defenseStatStages = 0;
    // Glaive Rush: the user takes double damage until it moves again
    if (defender.volatile.glaiveRush) prep.powerMultiplier *= 2;

    const damageResult = calculateComprehensiveDamage({
      level: attacker.level,
      movePower: prep.movePower,
      moveType: prep.moveType,
      // Terastallized attackers keep STAB on their original types as well as the Tera Type
      attackerTypes: stabTypeNames(attacker).map((t) => toDamageTypeName(t)),
      stabOverride: teraStabOverride(attacker, String(prep.moveType), prep.attackerAbility === 'adaptability'),
      // A grounded Flying type (Gravity, Iron Ball) takes Ground moves neutrally
      defenderTypes: defender.pokemon.types
        .map((type) => toDamageTypeName(typeof type === 'string' ? type : type.type?.name || 'normal'))
        .filter((t) => !(t === 'Flying' && String(prep.moveType).toLowerCase() === 'ground' && isGrounded(defender)))
        .filter((t) => !(t === 'Ghost' && ignoresGhostImmunity(attacker, String(prep.moveType)))),
      attackStat: attackStat,
      defenseStat: defenseStat,
      attackStatStages: prep.attackStatStages,
      defenseStatStages: prep.defenseStatStages,
      weather: prep.weather,
      terrain: prep.terrain,
      isPhysical: prep.isPhysical,
      isBurned: attacker.status === 'burned',
      hasGuts: prep.hasGuts,
      hasAdaptability: prep.attackerAbility === 'adaptability',
      hasLifeOrb: prep.attackerItem === 'life-orb',
      hasExpertBelt: prep.attackerItem === 'expert-belt',
      hasReflect: !!defenderSideConditions?.screens?.reflect,
      hasLightScreen: !!defenderSideConditions?.screens?.lightScreen,
      hasAuroraVeil: !!defenderSideConditions?.screens?.auroraVeil,
      hasTintedLens: prep.attackerAbility === 'tinted-lens',
      hasFilter: prep.defenderAbility === 'filter' || prep.defenderAbility === 'prism-armor',
      hasSolidRock: prep.defenderAbility === 'solid-rock',
      hasMultiscale: prep.defenderAbility === 'multiscale' || prep.defenderAbility === 'shadow-shield',
      isFullHp: defender.currentHp === defender.maxHp,
      hasHugePower: prep.attackerAbility === 'huge-power',
      hasPurePower: prep.attackerAbility === 'pure-power',
      hasSniper: prep.attackerAbility === 'sniper',
      isHighCritMove: (typeof move.critRateStage === 'number' ? move.critRateStage : 0) > 0,
      hasSuperLuck: prep.attackerAbility === 'super-luck',
      cannotCrit: prep.cannotCrit,
      precomputedCrit: prep.isCrit,
      attackMultiplier: prep.attackMultiplier,
      defenseMultiplier: prep.defenseMultiplier,
      powerMultiplier: prep.powerMultiplier,
      defenderGrounded: isGrounded(defender),
      typeEffectMultiplier: gen9TypeEffectMultiplier(defender, moveLower, String(prep.moveType)),
      rng: state.rng,
    });
    
    let damage = Math.floor(damageResult.damage * abilityFinalDamageMultiplier(attacker, damageResult.effectiveness ?? 1));
    lastEffectiveness = damageResult.effectiveness ?? 1;
    const superEffective = lastEffectiveness > 1;

    // Type-resist berries (Unnerve-aware)
    const berryMult = checkTypeResistBerry(
      state,
      defender,
      String(move.type),
      damageResult.effectiveness,
      user === 'player' ? 'opponent' : 'player'
    );
    damage = Math.floor(damage * berryMult);

    // Substitute absorbs damage before real HP / sash (sound moves and Infiltrator go through)
    if (!bypassesSubstitute(attacker, moveLower) && absorbHitWithSubstitute(state, defender, damage)) {
      hitSubstitute = true;
      totalDamageDealt += damage;
      actualHits++;
      continue;
    }

    // Disguise / Ice Face take the hit instead (once)
    damage = applyDisguiseShields(state, attacker, defender, damage, move.category);

    // False Swipe / Hold Back leave the target at 1 HP; Endure hangs on at 1 HP
    if ((moveLower === 'false-swipe' || moveLower === 'hold-back') && damage >= defender.currentHp) {
      damage = Math.max(0, defender.currentHp - 1);
    }
    if (defender.volatile.protect?.active && defender.volatile.protect.kind === 'endure' && damage >= defender.currentHp) {
      damage = Math.max(0, defender.currentHp - 1);
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} endured the hit!`, pokemon: defender.pokemon.name });
    }

    // Check for Focus Sash / Sturdy (survive at 1 HP from full HP)
    const defenderAbility = targetAbility(attacker, defender); // Sturdy is breakable
    const defenderItem = effectiveItem(defender);
    const isFullHp = defender.currentHp === defender.maxHp;
    const wouldFaint = defender.currentHp - damage <= 0;
    
    if (isFullHp && wouldFaint) {
      // Focus Sash (one-time use item)
      if (defenderItem === 'focus-sash' && !defender.volatile.focusSashUsed) {
        damage = defender.currentHp - 1; // Leave at 1 HP
        defender.volatile.focusSashUsed = true;
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} hung on using its Focus Sash!`,
          pokemon: defender.pokemon.name
        });
      }
      // Sturdy ability
      else if (defenderAbility === 'sturdy') {
        damage = defender.currentHp - 1; // Leave at 1 HP
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} endured the hit with Sturdy!`,
          pokemon: defender.pokemon.name
        });
      }
      // Focus Band (10% chance)
      else if (defenderItem === 'focus-band' && rngRollChance(state.rng, 0.1)) {
        damage = defender.currentHp - 1; // Leave at 1 HP
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} hung on using its Focus Band!`,
          pokemon: defender.pokemon.name
        });
      }
    }
    
    const hpBeforeHit = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    hpDamageDealt += hpBeforeHit - defender.currentHp;
    if (superEffective && hpBeforeHit > defender.currentHp) superEffectiveHpHit = true;
    totalDamageDealt += damage;
    actualHits++;
    
    // Trigger contact abilities per hit (Rough Skin, Iron Barbs, Static, etc.)
    if (contact) {
      const defenderAbility = defender.currentAbility?.toLowerCase();
      // Beak Blast charging burns attackers that touch the user
      if (defender.volatile.beakBlast && !attacker.status && attacker.currentHp > 0) {
        applyStatus(attacker, 'burned');
        state.battleLog.push({ type: 'status_applied', message: `${attacker.pokemon.name} was burned!`, pokemon: attacker.pokemon.name, status: 'BURNED' });
      }
      
      // Rough Skin / Iron Barbs: 1/8 max HP recoil
      if (defenderAbility === 'rough-skin' || defenderAbility === 'iron-barbs') {
        const recoil = Math.floor(attacker.maxHp / 8);
        attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
        state.battleLog.push({
          type: 'status_damage',
          message: `${attacker.pokemon.name} was hurt by ${defender.pokemon.name}'s ${defenderAbility === 'rough-skin' ? 'Rough Skin' : 'Iron Barbs'}!`,
          pokemon: attacker.pokemon.name,
          damage: Math.round((recoil / attacker.maxHp) * 100)
        });
      }
      
      // Static: 30% chance to paralyze
      if (defenderAbility === 'static' && !attacker.status && rngRollChance(state.rng, 0.3)) {
        attacker.status = 'paralyzed';
        attacker.statusTurns = 0;
        state.battleLog.push({
          type: 'status_applied',
          message: `${attacker.pokemon.name} was paralyzed by Static!`,
          pokemon: attacker.pokemon.name,
          status: 'PARALYZED'
        });
      }
      
      // Flame Body: 30% chance to burn
      if (defenderAbility === 'flame-body' && !attacker.status && rngRollChance(state.rng, 0.3)) {
        attacker.status = 'burned';
        attacker.statusTurns = 0;
        state.battleLog.push({
          type: 'status_applied',
          message: `${attacker.pokemon.name} was burned by Flame Body!`,
          pokemon: attacker.pokemon.name,
          status: 'BURNED'
        });
      }
      
      // Poison Point: 30% chance to poison
      if (defenderAbility === 'poison-point' && !attacker.status && rngRollChance(state.rng, 0.3)) {
        attacker.status = 'poisoned';
        attacker.statusTurns = 0;
        state.battleLog.push({
          type: 'status_applied',
          message: `${attacker.pokemon.name} was poisoned by Poison Point!`,
          pokemon: attacker.pokemon.name,
          status: 'POISONED'
        });
      }
      
      // Rocky Helmet: 1/6 max HP recoil
      const defenderItem = effectiveItem(defender);
      if (defenderItem === 'rocky-helmet') {
        const recoil = Math.floor(attacker.maxHp / 6);
        attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
        state.battleLog.push({
          type: 'status_damage',
          message: `${attacker.pokemon.name} was hurt by ${defender.pokemon.name}'s Rocky Helmet!`,
          pokemon: attacker.pokemon.name,
          damage: Math.round((recoil / attacker.maxHp) * 100)
        });
      }
    }

    // Abilities reacting to the hit (Stamina, Weak Armor, Mummy, Innards Out, ...) and the attacker's on-hit abilities
    const hitCtx = {
      state, attacker, defender, moveLower, moveType: String(prep.moveType), category: move.category, contact,
      damage: hpBeforeHit - defender.currentHp, hpBefore: hpBeforeHit, isCrit: prep.isCrit,
    };
    applyHitReactionAbilities(hitCtx);
    applyAttackerHitAbilities({ ...hitCtx, moveHasFlinch: moveFlinchChance(move) > 0 });
    
    // Check if attacker fainted from recoil
    if (attacker.currentHp <= 0) {
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
      break;
    }
  }
  if (String(move.type).toLowerCase() === 'electric') attacker.volatile.charged = undefined;
  
  // Log multi-hit if applicable
  if (actualHits > 1) {
    state.battleLog.push({
      type: 'multi_hit',
      message: `Hit ${actualHits} time(s)!`,
    });
  }
  
  // Log total damage dealt
  const remainingPercent = Math.round((defender.currentHp / defender.maxHp) * 100);
  state.battleLog.push({
    type: 'damage_dealt',
    message: `${defender.pokemon.name} took ${totalDamageDealt} damage! (${remainingPercent}% HP left)`,
    pokemon: defender.pokemon.name,
    damage: totalDamageDealt
  });
  
  recordDamageTaken(defender, hpDamageDealt, move.category);
  if (hpDamageDealt > 0) breakIllusion(state, defender);

  // Air Balloon pops when an attack reaches HP
  if (hpDamageDealt > 0 && effectiveItem(defender) === 'air-balloon') {
    removeHeldItem(defender);
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s Air Balloon popped!`,
      pokemon: defender.pokemon.name,
    });
  }
  if (superEffectiveHpHit) {
    triggerWeaknessPolicy(state, defender);
  }

  // Eject Button (holder leaves) / Red Card (attacker is dragged out); either cancels the attacker's pivot
  let pivotCancelled = false;
  const defenderSide = user === 'player' ? 'opponent' : 'player';
  if (hpDamageDealt > 0 && defender.currentHp > 0 && !hitSubstitute) {
    const defenderItemNow = effectiveItem(defender);
    const defenderTeam = defenderSide === 'player' ? state.player : state.opponent;
    if (defenderItemNow === 'eject-button' && getSwitchCandidates(defenderTeam).length > 0) {
      removeHeldItem(defender);
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} is switched out with the Eject Button!`, pokemon: defender.pokemon.name });
      await requestPivotSwitch(state, defenderSide);
      pivotCancelled = true;
    } else if (defenderItemNow === 'red-card' && attacker.currentHp > 0) {
      removeHeldItem(defender);
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} held up its Red Card against ${attacker.pokemon.name}!`, pokemon: defender.pokemon.name });
      pivotCancelled = await forceTargetSwitch(state, user, false, defender);
    } else if (wantsEmergencyExit(defender, defenderHpAtStart) && getSwitchCandidates(defenderTeam).length > 0) {
      // Emergency Exit / Wimp Out: dropping to half HP sends the holder back
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} rushed back to safety!`, pokemon: defender.pokemon.name });
      await requestPivotSwitch(state, defenderSide);
      pivotCancelled = true;
    }
  }

  // Track damage for Shell Bell
  if (!attacker.volatile.damageDealtThisTurn) {
    attacker.volatile.damageDealtThisTurn = 0;
  }
  attacker.volatile.damageDealtThisTurn += totalDamageDealt;
  
  // Struggle: recoil is 1/4 max HP (not tied to damage dealt)
  if (moveId.toLowerCase() === 'struggle') {
    const recoilDamage = Math.max(1, Math.floor(attacker.maxHp / 4));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
    state.battleLog.push({
      type: 'recoil',
      message: `${attacker.pokemon.name} was damaged by recoil!`,
      pokemon: attacker.pokemon.name,
      damage: Math.round((recoilDamage / attacker.maxHp) * 100)
    });
    if (attacker.currentHp <= 0) {
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${attacker.pokemon.name} fainted from recoil!`,
        pokemon: attacker.pokemon.name
      });
    }
  } else if (move.recoil && totalDamageDealt > 0 && abilityOf(attacker) !== 'rock-head' && abilityOf(attacker) !== 'magic-guard') {
    const recoilFraction = move.recoil.fraction || 0.33; // Default 1/3
    const recoilDamage = Math.max(1, Math.floor(totalDamageDealt * recoilFraction));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
    state.battleLog.push({
      type: 'recoil',
      message: `${attacker.pokemon.name} was damaged by recoil!`,
      pokemon: attacker.pokemon.name,
      damage: Math.round((recoilDamage / attacker.maxHp) * 100)
    });
    
    // Check if attacker fainted from recoil
    if (attacker.currentHp <= 0) {
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${attacker.pokemon.name} fainted from recoil!`,
        pokemon: attacker.pokemon.name
      });
    }
  }
  
  // Apply drain healing (Giga Drain, Drain Punch, etc.)
  if (move.drain && totalDamageDealt > 0) {
    const drainFraction = move.drain.fraction || 0.5; // Default 50%
    const bigRoot = effectiveItem(attacker) === 'big-root' ? 1.3 : 1;
    const healAmount = Math.max(1, Math.floor(totalDamageDealt * drainFraction * bigRoot));
    if (targetAbility(attacker, defender) === 'liquid-ooze') {
      attacker.currentHp = Math.max(0, attacker.currentHp - healAmount);
      state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} sucked up the liquid ooze!`, pokemon: attacker.pokemon.name });
      if (attacker.currentHp <= 0) state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    }
    const oldHp = attacker.currentHp;
    if (targetAbility(attacker, defender) !== 'liquid-ooze' && attacker.currentHp > 0) {
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    }
    const actualHeal = attacker.currentHp - oldHp;
    
    if (actualHeal > 0) {
      state.battleLog.push({
        type: 'drain',
        message: `${attacker.pokemon.name} drained HP from ${defender.pokemon.name}!`,
        pokemon: attacker.pokemon.name,
        healing: Math.round((actualHeal / attacker.maxHp) * 100)
      });
    }
  }
  
  // Apply Life Orb recoil (10% max HP)
  const attackerItem = effectiveItem(attacker);
  if (attackerItem === 'life-orb' && totalDamageDealt > 0 && !sheerForce) {
    const lifeOrbRecoil = Math.floor(attacker.maxHp / 10);
    attacker.currentHp = Math.max(0, attacker.currentHp - lifeOrbRecoil);
    state.battleLog.push({
      type: 'recoil',
      message: `${attacker.pokemon.name} lost some HP due to Life Orb!`,
      pokemon: attacker.pokemon.name,
      damage: Math.round((lifeOrbRecoil / attacker.maxHp) * 100)
    });
    
    // Check if attacker fainted from Life Orb
    if (attacker.currentHp <= 0) {
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${attacker.pokemon.name} fainted from Life Orb recoil!`,
        pokemon: attacker.pokemon.name
      });
    }
  }
  
  // Try to consume berry after damage
  tryConsumeBerry(state, defender, user === 'player' ? 'opponent' : 'player');
  
  // Apply secondary effects from damaging moves (ailments, stat changes, flinch)
  // Substitute blocks most secondary effects when it absorbed the hit
  if (defender.currentHp > 0 && !hitSubstitute) {
    // Covert Cloak protects the holder from secondary effects
    const cloaked = effectiveItem(defender) === 'covert-cloak';
    if (!sheerForce) {
      if (!cloaked) applyMoveAilment(state, move, attacker, defender, true);
      applyMoveSecondaryStatChanges(state, move, attacker, defender, true, cloaked);
      if (!cloaked) applyMoveFlinch(state, move, defender);
    } else if (SELF_STAT_DROP_MOVES.has(moveLower)) {
      // Not a secondary effect: Close Combat's drops still apply (and such moves are never boosted)
      applyMoveSecondaryStatChanges(state, move, attacker, defender, true);
    }
    // King's Rock / Razor Fang: 10% flinch on hits from moves without their own flinch chance
    const attackerItemNow = effectiveItem(attacker);
    if ((attackerItemNow === 'kings-rock' || attackerItemNow === 'razor-fang') && !cloaked && hpDamageDealt > 0
        && moveFlinchChance(move) === 0 && rngRollChance(state.rng, 0.1)) {
      defender.volatile.flinched = true;
    }
    applyBindingOnHit(state, moveId.toLowerCase(), defender, attacker);
  }

  // Items that react to being hit by a move type (Absorb Bulb, Cell Battery, Snowball, Luminous Moss)
  if (hpDamageDealt > 0 && defender.currentHp > 0 && !hitSubstitute) {
    const reaction = TYPE_HIT_ITEMS[effectiveItem(defender) ?? ''];
    if (reaction && String(move.type).toLowerCase() === reaction.type) {
      removeHeldItem(defender);
      changeStatStage(state, defender, reaction.stat, 1, { reason: `thanks to its ${reaction.label}` });
    }
    applyOnHitBerries(state, attacker, defender, user === 'player' ? 'opponent' : 'player', move.category, lastEffectiveness);
  }

  // Salt Cure: residual damage every turn until the target leaves the field
  if (moveLower === 'salt-cure' && hpDamageDealt > 0 && defender.currentHp > 0 && !hitSubstitute && !defender.volatile.saltCure) {
    defender.volatile.saltCure = true;
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} is being salt cured!`, pokemon: defender.pokemon.name });
  }

  // Rapid Spin / Mortal Spin clear hazards even though they deal damage
  const spinId = moveId.toLowerCase();
  if ((spinId === 'rapid-spin' || spinId === 'mortal-spin') && totalDamageDealt >= 0) {
    applyVolatileAndHazardScripts(state, spinId, attacker, defender, isPlayer);
  }

  // Knock Off: remove held item after a successful hit (not blocked by Substitute alone when damage dealt to HP — skip if only hit sub)
  if (moveLower === 'knock-off' && totalDamageDealt > 0 && defender.heldItem && !hitSubstitute && !isUnremovableItem(defender)) {
    const removed = removeHeldItem(defender);
    defender.volatile.choiceLock = undefined;
    if (removed) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${attacker.pokemon.name} knocked off ${defender.pokemon.name}'s ${removed}!`,
        pokemon: defender.pokemon.name,
      });
    }
  }
  
  gen9AfterHit({ state, attacker, defender, moveLower, moveType: String(move.type), hpDamage: hpDamageDealt, hitSubstitute });
  if (actualHits > 0) consumeStellarBoost(attacker, String(move.type));
  if (!hitSubstitute) applyMagician(state, attacker, defender, hpDamageDealt);
  if (flungItem && hpDamageDealt > 0 && defender.currentHp > 0 && !hitSubstitute) applyFlungItem(state, attacker, defender, flungItem);
  state.lastHitDamage = hpDamageDealt;

  // Check if Pokemon fainted
  if (defender.currentHp <= 0) {
    state.battleLog.push({
      type: 'pokemon_fainted',
      message: `${defender.pokemon.name} fainted!`,
      pokemon: defender.pokemon.name
    });
    
    // Update fainted count for the defending team
    const defendingTeam = user === 'player' ? state.opponent : state.player;
    defendingTeam.faintedCount = defendingTeam.pokemon.filter(p => p.currentHp <= 0).length;

    // Destiny Bond: the attacker goes down too
    if (defender.volatile.destinyBond && attacker.currentHp > 0) {
      defender.volatile.destinyBond = undefined;
      attacker.currentHp = 0;
      state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} took its attacker down with it!`, pokemon: defender.pokemon.name });
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
    }
    
    // Trigger on-faint abilities (Moxie, Soul Heart, Beast Boost)
    const attackerAbility = attacker.currentAbility?.toLowerCase();
    if (attackerAbility === 'moxie') {
      changeStatStage(state, attacker, 'attack', 1, { reason: 'thanks to Moxie', quietFailure: true });
    } else if (attackerAbility === 'soul-heart') {
      changeStatStage(state, attacker, 'specialAttack', 1, { reason: 'thanks to Soul-Heart', quietFailure: true });
    } else if (attackerAbility === 'beast-boost') {
      applyBeastBoost(attacker, state);
    }
    applyKoAbilities(state, attacker);
  }

  // Dragon Tail / Circle Throw drag the target out after a hit that reached its HP
  if (PHAZING_DAMAGE_MOVES.has(moveLower) && hpDamageDealt > 0 && defender.currentHp > 0 && attacker.currentHp > 0) {
    await forceTargetSwitch(state, user === 'player' ? 'opponent' : 'player', false, attacker);
  }

  // Pivot moves: the player picks the replacement (turn pauses) or the next bench Pokémon comes in
  if (PIVOT_MOVES.has(moveLower) && moveLower !== 'parting-shot' && totalDamageDealt > 0 && attacker.currentHp > 0 && !pivotCancelled) {
    await requestPivotSwitch(state, user);
  }

  // Multi-turn locks: Outrage/Petal Dance continue; Hyper Beam forces recharge
  if (totalDamageDealt > 0 && attacker.currentHp > 0) {
    applyRampageAfterHit(state, attacker, moveId, state.rng);
    if (isRechargeMove(moveId)) {
      scheduleRecharge(attacker, moveId);
      state.battleLog.push({
        type: 'status_effect',
        message: `${attacker.pokemon.name} must recharge next turn!`,
        pokemon: attacker.pokemon.name,
      });
    }
  }
}

function applyBeastBoost(attacker: BattlePokemon, state: BattleState): void {
  const findBase = (name: string): number => {
    const stats = attacker.pokemon.stats;
    if (!Array.isArray(stats)) return 50;
    const found = stats.find((s: any) => (s.stat?.name || s.name) === name);
    return found?.base_stat ?? 50;
  };
  const stageMult = (stage: number) => {
    const clamped = Math.max(-6, Math.min(6, stage));
    return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
  };
  const candidates: Array<{
    key: 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
    value: number;
    label: string;
  }> = [
    { key: 'attack', value: findBase('attack') * stageMult(attacker.statModifiers.attack), label: 'Attack' },
    { key: 'defense', value: findBase('defense') * stageMult(attacker.statModifiers.defense), label: 'Defense' },
    { key: 'specialAttack', value: findBase('special-attack') * stageMult(attacker.statModifiers.specialAttack), label: 'Special Attack' },
    { key: 'specialDefense', value: findBase('special-defense') * stageMult(attacker.statModifiers.specialDefense), label: 'Special Defense' },
    { key: 'speed', value: findBase('speed') * stageMult(attacker.statModifiers.speed), label: 'Speed' },
  ];
  let best = candidates[0];
  for (const c of candidates) {
    if (c.value > best.value) best = c;
  }
  changeStatStage(state, attacker, best.key, 1, { reason: 'thanks to Beast Boost', quietFailure: true });
}

// Run on-entry sequence for a Pokemon (switchingSide = the side whose Pokemon is switching in)
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

export type RunBattleTurnFromQueueOptions = {
  /** When true, clears `state.battleLog` before this turn slice (multiplayer / offline per-turn log). */
  clearBattleLog?: boolean;
  /** Sides whose pivot replacements a player picks (the turn pauses with `state.pendingSwitch`). */
  manualSwitchSides?: Array<'player' | 'opponent'>;
};

/**
 * `awaiting-switch`: paused mid-turn for `state.pendingSwitch`; call `resumeBattleTurnAfterSwitch`.
 * `awaiting-replacement`: the turn finished but fainted actives need picks (`state.pendingReplacements`);
 * call `applyFaintReplacements` before the next turn.
 */
export type TurnOutcome = 'complete' | 'awaiting-switch' | 'awaiting-replacement';

async function autoReplaceFaintedActive(state: BattleState, side: 'player' | 'opponent'): Promise<void> {
  const team = side === 'player' ? state.player : state.opponent;
  const active = getCurrentPokemon(team);
  if (active.currentHp > 0) return;
  const healthy = getSwitchCandidates(team);
  const nextIndex = state.autoSwitchPicker && healthy.length ? state.autoSwitchPicker(state, side, healthy) : getNextAvailablePokemon(team);
  if (nextIndex === null || nextIndex === team.currentIndex) return;
  team.currentIndex = nextIndex;
  const newPokemon = getCurrentPokemon(team);
  state.battleLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${newPokemon.pokemon.name}!`,
    pokemon: newPokemon.pokemon.name,
  });
  await runEntrySequence(state, side, newPokemon);
}

/**
 * Canonical turn slice: start-of-turn, action queue, end-of-turn, auto-send next Pokémon with hazards/abilities.
 * Used by multiplayer `resolveTurn`, offline battles, and `processBattleTurn`.
 */
export async function runBattleTurnFromQueue(
  state: BattleState,
  queue: BattleState['actionQueue'],
  options?: RunBattleTurnFromQueueOptions
): Promise<TurnOutcome> {
  if (options?.clearBattleLog) {
    state.battleLog = [];
  }
  state.manualSwitchSides = options?.manualSwitchSides;
  state.pendingSwitch = undefined;
  state.pendingReplacements = undefined;
  state.actionQueue = queue;

  await processStartOfTurn(state);

  // Terastallization happens at the start of the turn, before anyone moves (in turn order)
  for (const action of queue) {
    if (action.type === 'move' && action.terastallize) terastallize(state, action.user);
  }
  // Quick Claw / Custap Berry (rolled when the queue was built)
  for (const action of queue) {
    if (action.type !== 'move' || !action.moveFirst) continue;
    const mon = getCurrentPokemon(action.user === 'player' ? state.player : state.opponent);
    if (action.moveFirst === 'custap-berry') removeHeldItem(mon);
    state.battleLog.push({
      type: 'status_effect',
      message: action.moveFirst === 'quick-claw'
        ? `${mon.pokemon.name}'s Quick Claw let it move first!`
        : `${mon.pokemon.name} can act faster than normal, thanks to its Custap Berry!`,
      pokemon: mon.pokemon.name,
    });
  }

  // Focus Punch users tighten their focus before anything else happens
  for (const action of queue) {
    if (action.type === 'move' && action.moveId?.toLowerCase() === 'focus-punch') {
      const mon = getCurrentPokemon(action.user === 'player' ? state.player : state.opponent);
      state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} is tightening its focus!`, pokemon: mon.pokemon.name });
    }
  }

  // A move belongs to the Pokémon that chose it: if that side's active Pokémon was replaced
  // mid-turn (Roar, Dragon Tail, ...), the newcomer does not use it.
  const activeAtTurnStart = {
    player: state.player.currentIndex,
    opponent: state.opponent.currentIndex,
  };

  return runQueuedActions(state, queue, activeAtTurnStart);
}

/**
 * Finish a turn paused for a pivot replacement: send in `switchIndex` (passing Baton Pass effects),
 * then run the rest of the turn and end-of-turn effects. May pause again if a later pivot needs a pick.
 */
export async function resumeBattleTurnAfterSwitch(
  state: BattleState,
  switchIndex: number,
  options?: Pick<RunBattleTurnFromQueueOptions, 'manualSwitchSides'>,
): Promise<TurnOutcome> {
  const pending = state.pendingSwitch;
  if (!pending) throw new Error('No switch is pending');
  if (!pending.options.includes(switchIndex)) throw new Error(`Illegal switch choice: ${switchIndex}`);
  if (options?.manualSwitchSides) state.manualSwitchSides = options.manualSwitchSides;

  const remaining = pending.remainingQueue ?? [];
  const activeAtTurnStart = pending.activeAtTurnStart ?? {
    player: state.player.currentIndex,
    opponent: state.opponent.currentIndex,
  };
  state.pendingSwitch = undefined;
  state.actionQueue = remaining;

  state.resolvingActions = true;
  if (pending.reason === 'revival-blessing') {
    reviveTeamMember(state, pending.side, switchIndex);
  } else {
    await performPivotSwitch(state, pending.side, {
      batonPass: pending.reason === 'baton-pass',
      shedTail: pending.reason === 'shed-tail',
      switchIndex,
    });
  }
  // The newcomer's entry (e.g. Intimidate into an Eject Pack) may need another pick.
  // (Re-read: the switch above can set a new pending pick.)
  const repick = state.pendingSwitch as BattleState['pendingSwitch'];
  if (repick && !repick.remainingQueue) {
    repick.remainingQueue = remaining;
    repick.activeAtTurnStart = { ...activeAtTurnStart };
    state.resolvingActions = false;
    return 'awaiting-switch';
  }
  // Paradox boosts / White Herb for the newcomer were handled by its entry sequence
  return runQueuedActions(state, remaining, activeAtTurnStart);
}

async function runQueuedActions(
  state: BattleState,
  queue: BattleState['actionQueue'],
  activeAtTurnStart: { player: number; opponent: number },
): Promise<TurnOutcome> {
  state.resolvingActions = true;
  for (let i = 0; i < queue.length; i++) {
    const action = queue[i];
    if (action.type === 'switch') {
      activeAtTurnStart[action.user] = action.switchIndex ?? activeAtTurnStart[action.user];
      await resolveSwitch(state, action);
    } else if ((action.type === 'move' || action.type === 'pursuit') && action.moveId) {
      const team = action.user === 'player' ? state.player : state.opponent;
      if (team.currentIndex === activeAtTurnStart[action.user]) {
        await resolveMove(state, action);
      }
    }

    state.player.faintedCount = state.player.pokemon.filter((p) => p.currentHp <= 0).length;
    state.opponent.faintedCount = state.opponent.pokemon.filter((p) => p.currentHp <= 0).length;

    // Weather / terrain may have changed mid-turn (Sunny Day, Electric Terrain, Snowscape, ...)
    updateParadoxBoosts(state);
    restoreIceFaces(state);
    maskIllusions(state);

    if (state.pendingSwitch && !state.pendingSwitch.remainingQueue) {
      state.pendingSwitch.remainingQueue = queue.slice(i + 1);
      state.pendingSwitch.activeAtTurnStart = { ...activeAtTurnStart };
      state.resolvingActions = false;
      return 'awaiting-switch';
    }

    if (isTeamDefeated(state.player) || isTeamDefeated(state.opponent)) {
      break;
    }
  }

  state.resolvingActions = false;
  await processEndOfTurn(state);

  const outcome = await requestFaintReplacements(state);
  maskIllusions(state);
  return outcome;
}

/**
 * End-of-turn replacements. A player-controlled side with two or more healthy options gets to pick
 * (both sides pick simultaneously); otherwise the next healthy Pokémon comes in automatically.
 * No prompt once either team is out of Pokémon (the battle is over).
 */
async function requestFaintReplacements(state: BattleState): Promise<TurnOutcome> {
  const battleOver = isTeamDefeated(state.player) || isTeamDefeated(state.opponent);
  const pending: NonNullable<BattleState['pendingReplacements']> = [];
  for (const side of ['player', 'opponent'] as const) {
    const team = side === 'player' ? state.player : state.opponent;
    if (getCurrentPokemon(team).currentHp > 0) continue;
    const options = getSwitchCandidates(team);
    if (!battleOver && options.length >= 2 && state.manualSwitchSides?.includes(side)) {
      pending.push({ side, options });
    } else {
      await autoReplaceFaintedActive(state, side);
    }
  }
  if (pending.length === 0) return 'complete';
  state.pendingReplacements = pending;
  return 'awaiting-replacement';
}

/**
 * Send in the picked replacements for `state.pendingReplacements` (faster side's entry effects first).
 * Throws when a pending side has no legal pick.
 */
export async function applyFaintReplacements(
  state: BattleState,
  picks: Partial<Record<'player' | 'opponent', number>>,
): Promise<TurnOutcome> {
  const pending = state.pendingReplacements ?? [];
  for (const req of pending) {
    const pick = picks[req.side];
    if (typeof pick !== 'number' || !req.options.includes(pick)) {
      throw new Error(`Illegal replacement for ${req.side}: ${String(pick)}`);
    }
  }
  const ordered = [...pending].sort((a, b) => {
    const speed = (side: 'player' | 'opponent') => {
      const team = side === 'player' ? state.player : state.opponent;
      return getEffectiveSpeed(team.pokemon[picks[side]!], isTailwindActive(team), state.field);
    };
    return speed(b.side) - speed(a.side);
  });
  state.pendingReplacements = undefined;
  for (const req of ordered) {
    const team = req.side === 'player' ? state.player : state.opponent;
    team.currentIndex = picks[req.side]!;
    const incoming = getCurrentPokemon(team);
    state.battleLog.push({ type: 'pokemon_sent_out', message: `Go! ${incoming.pokemon.name}!`, pokemon: incoming.pokemon.name });
    await runEntrySequence(state, req.side, incoming);
  }
  // Entry hazards can knock out the newcomer: pick again
  return requestFaintReplacements(state);
}

// Process end-of-turn effects
export async function processEndOfTurn(state: BattleState): Promise<void> {
  // 1. Residual damage/heal
  applyWeatherResidual(state);
  processResidualDamage(state);
  applyTerrainHealing(state);
  applyLeechSeed(state);
  applyBindingDamage(state);
  const roomsBefore = { ...(state.field.rooms ?? {}) };
  decrementFieldTimers(state.field, {
    player: state.player.sideConditions.screens,
    opponent: state.opponent.sideConditions.screens,
  });
  const roomsAfter = state.field.rooms ?? {};
  if (roomsBefore.trickRoom && !roomsAfter.trickRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'The twisted dimensions returned to normal!' });
  }
  if (roomsBefore.magicRoom && !roomsAfter.magicRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'Magic Room wore off, and held items regained their effects!' });
  }
  if (roomsBefore.wonderRoom && !roomsAfter.wonderRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'Wonder Room wore off, and Defense and Sp. Def stats returned to normal!' });
  }
  if (roomsBefore.gravity && !roomsAfter.gravity) {
    state.battleLog.push({ type: 'status_effect', message: 'Gravity returned to normal!' });
  }
  syncItemSuppression(state);
  syncGravity(state);
  applyCurseAndSaltCure(state);
  for (const team of [state.player, state.opponent]) {
    updateHpForms(state, getCurrentPokemon(team));
  }
  restoreIceFaces(state);

  applyEndOfTurnStatus(state, getCurrentPokemon(state.player));
  applyEndOfTurnStatus(state, getCurrentPokemon(state.opponent));
  
  // 2. Item residuals
  processItemResiduals(state);
  processStatusOrbs(state);
  
  // 3. End-of-turn abilities
  processEndOfTurnAbilities(state);
  
  // 4. Volatile decrements
  processVolatileDecrements(state);
  processGen9EndOfTurn(state);
  
  // 5. Check faints from residuals
  checkResidualFaints(state);
  noteFaintTurns(state);

  // 6. Weather / terrain that just ended may switch paradox boosts off (or trigger Booster Energy)
  updateParadoxBoosts(state);
}

/** Future Sight / Doom Desire landing, Syrup Bomb, Throat Chop / Lock-On timers, Hunger Switch, Fairy Lock. */
function processGen9EndOfTurn(state: BattleState): void {
  applyEndOfTurnAbilities(state);
  for (const team of [state.player, state.opponent]) updateWeatherTerrainForms(state, getCurrentPokemon(team));
  for (const team of [state.player, state.opponent]) {
    const fa = team.sideConditions.futureAttack;
    if (fa) {
      fa.turns -= 1;
      if (fa.turns <= 0) {
        team.sideConditions.futureAttack = undefined;
        const target = getCurrentPokemon(team);
        if (target.currentHp > 0) {
          state.battleLog.push({ type: 'status_effect', message: `${target.pokemon.name} took the ${fa.move} attack!`, pokemon: target.pokemon.name });
          const typeName = toDamageTypeName(fa.type.toLowerCase());
          const defTypes = getPokemonTypes(target).map((t) => toDamageTypeName(String(t)));
          if (calculateTypeEffectiveness(typeName, defTypes) === 0) {
            state.battleLog.push({ type: 'status_effect', message: `It doesn't affect ${target.pokemon.name}...`, pokemon: target.pokemon.name });
          } else {
            const result = calculateComprehensiveDamage({
              level: fa.level,
              movePower: fa.power,
              moveType: typeName,
              attackerTypes: fa.attackerTypes.map((t) => toDamageTypeName(t)),
              defenderTypes: defTypes,
              attackStat: fa.attackStat,
              defenseStat: Math.floor(rawStat(target, 'special-defense') * stageMultiplier(target.statModifiers.specialDefense)),
              attackStatStages: 0,
              defenseStatStages: 0,
              isPhysical: false,
              hasLightScreen: !!team.sideConditions.screens.lightScreen,
              hasAuroraVeil: !!team.sideConditions.screens.auroraVeil,
              cannotCrit: true,
              rng: state.rng,
            });
            const dmg = target.volatile.substitute ? 0 : result.damage;
            if (!absorbHitWithSubstitute(state, target, result.damage)) {
              target.currentHp = Math.max(0, target.currentHp - dmg);
              state.battleLog.push({
                type: 'damage_dealt',
                message: `${target.pokemon.name} took ${dmg} damage! (${Math.round((target.currentHp / target.maxHp) * 100)}% HP left)`,
                pokemon: target.pokemon.name,
                damage: dmg,
              });
              if (target.currentHp <= 0) {
                state.battleLog.push({ type: 'pokemon_fainted', message: `${target.pokemon.name} fainted!`, pokemon: target.pokemon.name });
              }
            }
          }
        }
      }
    }

    const mon = getCurrentPokemon(team);
    if (!mon || mon.currentHp <= 0) continue;
    const v = mon.volatile;
    if (v.syrupBomb) {
      changeStatStage(state, mon, 'speed', -1, { reason: 'due to the sticky syrup', quietFailure: true });
      v.syrupBomb.turns -= 1;
      if (v.syrupBomb.turns <= 0) v.syrupBomb = undefined;
    }
    if (v.throatChop) {
      v.throatChop.turns -= 1;
      if (v.throatChop.turns <= 0) v.throatChop = undefined;
    }
    if (v.lockOn) {
      v.lockOn -= 1;
      if (v.lockOn <= 0) v.lockOn = undefined;
    }
    v.fairyLocked = !!state.field.rooms?.fairyLock || undefined;
    // Hunger Switch: Morpeko flips between Full Belly and Hangry Mode
    if (abilityOf(mon) === 'hunger-switch' && !mon.terastallized) {
      v.hangry = !v.hangry;
      state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} transformed!`, pokemon: mon.pokemon.name });
    }
  }
}

/** Remember the turn a team member last fainted (Retaliate). */
function noteFaintTurns(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const fainted = team.pokemon.filter((p) => p.currentHp <= 0).length;
    if (fainted > (team.faintTally ?? 0)) team.lastFaintTurn = state.turn;
    team.faintTally = fainted;
  }
}

/** Ice Face comes back whenever an Eiscue is out in snow (on entry, when snow starts, at end of turn). */
function restoreIceFaces(state: BattleState): void {
  if (state.field.weather?.kind !== 'snow') return;
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    if (!mon.iceFaceBroken || mon.currentHp <= 0 || abilityOf(mon) !== 'ice-face') continue;
    mon.iceFaceBroken = false;
    applyIceFaceStats(mon, 'ice');
    state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name}'s Ice Face was restored!`, pokemon: mon.pokemon.name });
  }
}

export function isBlockedByGravity(state: Pick<BattleState, 'field'>, moveId: string): boolean {
  return !!state.field.rooms?.gravity && GRAVITY_BLOCKED_MOVES.has(moveId.toLowerCase());
}

/** Gravity pulls Pokémon out of the sky mid-Fly / Bounce / Sky Drop. */
function groundAirbornePokemon(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    const airborne = mon.volatile.semiInvulnerable && GRAVITY_BLOCKED_MOVES.has(mon.volatile.semiInvulnerable);
    if (!airborne) continue;
    clearTwoTurnState(mon);
    mon.volatile.semiInvulnerable = undefined;
    state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} couldn't stay airborne because of gravity!`, pokemon: mon.pokemon.name });
  }
}

/** Gravity grounds every Pokémon (mirrored onto volatiles so `isGrounded` sees it). */
function syncGravity(state: BattleState): void {
  const on = !!state.field.rooms?.gravity;
  for (const team of [state.player, state.opponent]) {
    for (const mon of team.pokemon) {
      if (on) mon.volatile.gravityGrounded = true;
      else delete mon.volatile.gravityGrounded;
    }
  }
}

/** End of turn: Curse (1/4 max HP) and Salt Cure (1/8, or 1/4 for Water / Steel). Magic Guard is immune. */
function applyCurseAndSaltCure(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    if (mon.currentHp <= 0 || abilityOf(mon) === 'magic-guard') continue;
    if (mon.volatile.cursed) {
      mon.currentHp = Math.max(0, mon.currentHp - Math.max(1, Math.floor(mon.maxHp / 4)));
      state.battleLog.push({ type: 'status_damage', message: `${mon.pokemon.name} is afflicted by the curse!`, pokemon: mon.pokemon.name });
    }
    if (mon.volatile.saltCure && mon.currentHp > 0) {
      const types = getPokemonTypes(mon).map((t) => String(t).toLowerCase());
      const fraction = types.includes('water') || types.includes('steel') ? 4 : 8;
      mon.currentHp = Math.max(0, mon.currentHp - Math.max(1, Math.floor(mon.maxHp / fraction)));
      state.battleLog.push({ type: 'status_damage', message: `${mon.pokemon.name} is hurt by Salt Cure!`, pokemon: mon.pokemon.name });
    }
  }
}

/** Flame Orb / Toxic Orb: inflict the holder's own status at end of turn (Misty Terrain and immunities still apply). */
function processStatusOrbs(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0 || pokemon.status) continue;
    const item = effectiveItem(pokemon);
    if (item !== 'flame-orb' && item !== 'toxic-orb') continue;
    const status = item === 'flame-orb' ? 'burned' : 'badly-poisoned';
    const types = getPokemonTypes(pokemon).map((t) => String(t).toLowerCase());
    const ability = abilityOf(pokemon);
    const immune =
      status === 'burned'
        ? types.includes('fire') || ability === 'water-veil' || ability === 'water-bubble' || ability === 'thermal-exchange'
        : types.includes('poison') || types.includes('steel') || ability === 'immunity' || ability === 'pastel-veil';
    if (immune || ability === 'comatose' || terrainPreventsStatus(state.field.terrain?.kind, pokemon, status)) continue;
    applyStatus(pokemon, status);
    state.battleLog.push({
      type: 'status_applied',
      message: `${pokemon.pokemon.name} was ${status === 'burned' ? 'burned' : 'badly poisoned'} by the ${item === 'flame-orb' ? 'Flame Orb' : 'Toxic Orb'}!`,
      pokemon: pokemon.pokemon.name,
      status: status.toUpperCase(),
    });
  }
}

function processResidualDamage(_state: BattleState): void {
  // Status residual damage (poison, burn) is handled by applyEndOfTurnStatus
}

// Process item residuals
function processItemResiduals(state: BattleState): void {
  const processItem = (team: BattleTeam, side: 'player' | 'opponent') => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const item = effectiveItem(pokemon);
    if (!item) return;

    if (item === 'shell-bell' && pokemon.volatile.damageDealtThisTurn) {
      const heal = Math.max(1, Math.floor(pokemon.volatile.damageDealtThisTurn / 8));
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: 'healing',
          message: `${pokemon.pokemon.name} restored HP with Shell Bell!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round((heal / pokemon.maxHp) * 100),
        });
      }
    }

    if (item === 'leftovers' || (item === 'black-sludge' && pokemon.pokemon.types.some(t => (typeof t === 'string' ? t : t.type?.name || '') === 'Poison'))) {
      const heal = Math.floor(pokemon.maxHp / 16);
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: 'healing',
          message: `${pokemon.pokemon.name} restored HP with ${item === 'leftovers' ? 'Leftovers' : 'Black Sludge'}!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round((heal / pokemon.maxHp) * 100),
        });
      }
    } else if (item === 'black-sludge') {
      const damage = Math.floor(pokemon.maxHp / 8);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: 'status_damage',
          message: `${pokemon.pokemon.name} was hurt by Black Sludge!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round((damage / pokemon.maxHp) * 100),
        });
      }
    }

    tryConsumeBerry(state, pokemon, side);
  };

  processItem(state.player, 'player');
  processItem(state.opponent, 'opponent');

  // Reset per-turn damage trackers after applying Shell Bell
  getCurrentPokemon(state.player).volatile.damageDealtThisTurn = 0;
  getCurrentPokemon(state.opponent).volatile.damageDealtThisTurn = 0;
}

// Process end-of-turn abilities
function processEndOfTurnAbilities(state: BattleState): void {
  [state.player, state.opponent].forEach(team => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const ability = pokemon.currentAbility?.toLowerCase();
    switch (ability) {
      case 'speed-boost': {
        changeStatStage(state, pokemon, 'speed', 1, { reason: 'thanks to Speed Boost', quietFailure: true });
        break;
      }
      case 'poison-heal': {
        if (pokemon.status === 'poisoned' || pokemon.status === 'badly-poisoned') {
          const heal = Math.floor(pokemon.maxHp / 8);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Poison Heal!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'shed-skin': {
        if (pokemon.status && rngRollChance(state.rng, 0.3)) {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: 'status_effect',
            message: `${pokemon.pokemon.name} shed its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name,
          });
        }
        break;
      }
      case 'hydration': {
        if (pokemon.status && state.field.weather?.kind === 'rain') {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: 'status_effect',
            message: `${pokemon.pokemon.name}'s Hydration cured its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name,
          });
        }
        break;
      }
      case 'rain-dish': {
        if (state.field.weather?.kind === 'rain') {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Rain Dish!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'dry-skin': {
        if (state.field.weather?.kind === 'rain') {
          const heal = Math.floor(pokemon.maxHp / 8);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Dry Skin!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        } else if (state.field.weather?.kind === 'sun') {
          const damage = Math.floor(pokemon.maxHp / 8);
          if (damage > 0) {
            pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
            state.battleLog.push({
              type: 'status_damage',
              message: `${pokemon.pokemon.name} was hurt by Dry Skin under the sun!`,
              pokemon: pokemon.pokemon.name,
              damage: Math.round((damage / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'solar-power': {
        if (state.field.weather?.kind === 'sun') {
          const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
          state.battleLog.push({
            type: 'status_damage',
            message: `${pokemon.pokemon.name} is hurt by Solar Power!`,
            pokemon: pokemon.pokemon.name,
            damage: Math.round((damage / pokemon.maxHp) * 100),
          });
        }
        break;
      }
      case 'ice-body': {
        if (state.field.weather?.kind === 'snow') {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Ice Body!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'harvest': {
        tryHarvestBerry(state, pokemon);
        break;
      }
      default:
        break;
    }
  });
}

// Process volatile decrements
function processVolatileDecrements(state: BattleState): void {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);

  const processWish = (team: BattleTeam) => {
    // Wish is stored on the mon that used it; heal the current active when it lands
    for (const mon of team.pokemon) {
      if (!mon.volatile.wish) continue;
      mon.volatile.wish.turns -= 1;
      if (mon.volatile.wish.turns > 0) continue;
      const heal = mon.volatile.wish.heal;
      mon.volatile.wish = undefined;
      const active = getCurrentPokemon(team);
      if (active.currentHp <= 0 || heal <= 0) continue;
      const before = active.currentHp;
      active.currentHp = Math.min(active.maxHp, active.currentHp + heal);
      const gained = active.currentHp - before;
      if (gained > 0) {
        state.battleLog.push({
          type: 'healing',
          message: `${active.pokemon.name}'s wish came true!`,
          pokemon: active.pokemon.name,
          healing: Math.round((gained / active.maxHp) * 100),
        });
      }
    }
  };
  processWish(state.player);
  processWish(state.opponent);

  // Dig/Fly/Solar Beam: after the charge turn, mark the move pending for next action
  for (const mon of [playerPokemon, opponentPokemon]) {
    if (mon.volatile.twoTurn?.kind === 'charging') {
      completeTwoTurnCharge(mon);
    }
  }
  
  // Encore turns
  if (playerPokemon.volatile.encore) {
    playerPokemon.volatile.encore.turns--;
    if (playerPokemon.volatile.encore.turns <= 0) {
      playerPokemon.volatile.encore = undefined;
    }
  }
  
  if (opponentPokemon.volatile.encore) {
    opponentPokemon.volatile.encore.turns--;
    if (opponentPokemon.volatile.encore.turns <= 0) {
      opponentPokemon.volatile.encore = undefined;
    }
  }
  
  // Taunt turns
  if (playerPokemon.volatile.taunt) {
    playerPokemon.volatile.taunt.turns--;
    if (playerPokemon.volatile.taunt.turns <= 0) {
      playerPokemon.volatile.taunt = undefined;
    }
  }
  
  if (opponentPokemon.volatile.taunt) {
    opponentPokemon.volatile.taunt.turns--;
    if (opponentPokemon.volatile.taunt.turns <= 0) {
      opponentPokemon.volatile.taunt = undefined;
    }
  }
  
  // Disable turns
  if (playerPokemon.volatile.disable) {
    playerPokemon.volatile.disable.turns--;
    if (playerPokemon.volatile.disable.turns <= 0) {
      playerPokemon.volatile.disable = undefined;
    }
  }
  
  if (opponentPokemon.volatile.disable) {
    opponentPokemon.volatile.disable.turns--;
    if (opponentPokemon.volatile.disable.turns <= 0) {
      opponentPokemon.volatile.disable = undefined;
    }
  }
  
  // Perish Song turns
  if (playerPokemon.volatile.perishSong) {
    playerPokemon.volatile.perishSong.turns--;
    if (playerPokemon.volatile.perishSong.turns <= 0) {
      playerPokemon.currentHp = 0;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${playerPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: playerPokemon.pokemon.name
      });
      // Update fainted count
      state.player.faintedCount = state.player.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  if (opponentPokemon.volatile.perishSong) {
    opponentPokemon.volatile.perishSong.turns--;
    if (opponentPokemon.volatile.perishSong.turns <= 0) {
      opponentPokemon.currentHp = 0;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${opponentPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: opponentPokemon.pokemon.name
      });
      // Update fainted count
      state.opponent.faintedCount = state.opponent.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
}

// Check for faints from residuals and resync faintedCount from HP
function checkResidualFaints(state: BattleState): void {
  const checkSide = (team: BattleTeam) => {
    const pokemon = getCurrentPokemon(team);
    const prevFaintedCount = team.faintedCount;
    team.faintedCount = team.pokemon.filter(p => p.currentHp <= 0).length;
    if (pokemon.currentHp <= 0 && team.faintedCount > prevFaintedCount) {
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${pokemon.pokemon.name} fainted!`,
        pokemon: pokemon.pokemon.name
      });
    }
  };

  checkSide(state.player);
  checkSide(state.opponent);
}

// Process force replacements
export async function processReplacements(state: BattleState): Promise<void> {
  // Check if either side needs a replacement
  const playerNeedsReplacement = getCurrentPokemon(state.player).currentHp <= 0;
  const opponentNeedsReplacement = getCurrentPokemon(state.opponent).currentHp <= 0;
  
  if (playerNeedsReplacement && !isTeamDefeated(state.player)) {
    // Force player to choose a replacement
    state.phase = 'replacement';
    state.battleLog.push({
      type: 'pokemon_fainted',
      message: `${getCurrentPokemon(state.player).pokemon.name} fainted! Choose your next Pokemon.`,
      pokemon: getCurrentPokemon(state.player).pokemon.name
    });
  }
  
  if (opponentNeedsReplacement && !isTeamDefeated(state.opponent)) {
    // Force opponent to choose a replacement
    state.phase = 'replacement';
    state.battleLog.push({
      type: 'pokemon_fainted',
      message: `${getCurrentPokemon(state.opponent).pokemon.name} fainted! Choose your next Pokemon.`,
      pokemon: getCurrentPokemon(state.opponent).pokemon.name
    });
  }
  
  // If both sides need replacements, determine order by speed
  if (playerNeedsReplacement && opponentNeedsReplacement) {
    const playerSpeed = getEffectiveSpeed(getCurrentPokemon(state.player), isTailwindActive(state.player), state.field);
    const opponentSpeed = getEffectiveSpeed(getCurrentPokemon(state.opponent), isTailwindActive(state.opponent), state.field);
    
    if (playerSpeed > opponentSpeed) {
      // Player chooses first
      state.phase = 'replacement';
    } else if (opponentSpeed > playerSpeed) {
      // Opponent chooses first
      state.phase = 'replacement';
    } else {
      // Speed tie - random
      state.phase = 'replacement';
    }
  }
}
