import {
  BattleState,
  BattlePokemon,
  getCurrentPokemon,
  getMovePriority,
  getEffectiveSpeed,
  canUseMove,
  applyStatusMoveEffects,
} from '@/lib/team-battle-engine';
import {
  resolveSwitch,
  processEndOfTurn,
  processReplacements,
} from '@/lib/team-battle-engine-additional';
import { calculateDamageDetailed } from '@/lib/team-battle-engine';
import { getMove } from '@/lib/moveCache';
import type { CompiledMove } from '@/lib/adapters/pokeapiMoveAdapter';
import type { TypeName } from '@/lib/damage-calculator';

type Side = 'player' | 'opponent';

type ResolvedAction = {
  user: Side;
  type: 'move' | 'switch';
  moveId?: string;
  target?: Side;
  switchIndex?: number;
  priority: number;
  effectiveSpeed: number;
  quickModifier: number;
  executionOrderRoll: number;
  isPursuitReaction?: boolean;
};

const PRIORITY_SWITCH = 12; // Switch actions always occur before standard attacks unless a pursuit intercepts

/**
 * Entry point for the Gen 9 server-side turn executor.
 */
export async function executeTurn(battleState: BattleState): Promise<BattleState> {
  const state = JSON.parse(JSON.stringify(battleState)) as BattleState;

  if (state.isComplete) {
    return state;
  }

  state.battleLog.push({
    type: 'turn_start',
    message: `Turn ${state.turn} begins!`,
    turn: state.turn,
  });

  applyStartOfTurnEffects(state);

  const actions = await buildActionQueue(state);

  for (const action of actions) {
    if (state.isComplete) break;

    const actingTeam = action.user === 'player' ? state.player : state.opponent;
    const opposingTeam = action.user === 'player' ? state.opponent : state.player;
    const actingPokemon = getCurrentPokemon(actingTeam);

    if (actingPokemon.currentHp <= 0) {
      continue;
    }

    if (action.type === 'switch') {
      await resolveSwitch(state, {
        ...action,
        user: action.user,
        type: 'switch',
      } as BattleState['actionQueue'][0]);
      continue;
    }

    if (!action.moveId) continue;

    const defender = getCurrentPokemon(opposingTeam);
    if (defender.currentHp <= 0) {
      continue;
    }

    await executeMove(state, action, actingTeam, opposingTeam);
  }

  await applyEndOfTurn(state);

  await processReplacements(state);

  if (!state.isComplete) {
    state.turn += 1;
    state.phase = 'choice';
    state.selectedMoves = {};
    state.executionQueue = [];
  }

  return state;
}

function applyStartOfTurnEffects(state: BattleState): void {
  ['player', 'opponent'].forEach(side => {
    const team = side === 'player' ? state.player : state.opponent;
    const active = getCurrentPokemon(team);

    if (!active) return;

    if (active.volatile.protect) {
      active.volatile.protect.counter = Math.min((active.volatile.protect.counter ?? 1) + 1, 4);
      active.volatile.protect = undefined;
    }

    if (active.volatile.flinched) {
      active.volatile.flinched = false;
    }

    if (active.status === 'asleep') {
      active.statusTurns = (active.statusTurns ?? 0) + 1;
      if (active.statusTurns >= 3) {
        active.status = undefined;
        active.statusTurns = undefined;
        state.battleLog.push({
          type: 'status_effect',
          message: `${active.pokemon.name} woke up!`,
          pokemon: active.pokemon.name,
        });
      }
    }

    if (active.volatile.encore && active.volatile.encore.turns > 0) {
      active.volatile.encore.turns -= 1;
      if (active.volatile.encore.turns === 0) {
        active.volatile.encore = undefined;
        state.battleLog.push({
          type: 'status_effect',
          message: `${active.pokemon.name}'s Encore ended!`,
          pokemon: active.pokemon.name,
        });
      }
    }

    if (active.volatile.taunt && active.volatile.taunt.turns > 0) {
      active.volatile.taunt.turns -= 1;
      if (active.volatile.taunt.turns === 0) {
        active.volatile.taunt = undefined;
        state.battleLog.push({
          type: 'status_effect',
          message: `${active.pokemon.name}'s Taunt wore off!`,
          pokemon: active.pokemon.name,
        });
      }
    }

    if (active.volatile.perishSong) {
      active.volatile.perishSong.turns -= 1;
      if (active.volatile.perishSong.turns <= 0) {
        active.currentHp = 0;
        state.battleLog.push({
          type: 'status_damage',
          message: `${active.pokemon.name}'s Perish Song countdown reached zero!`,
          pokemon: active.pokemon.name,
        });
      }
    }
  });

  const weather = (state.field as any)?.weather;
  if (weather?.turns != null) {
    weather.turns -= 1;
    if (weather.turns <= 0) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${weather.kind ?? 'The weather'} subsided.`,
      });
      delete weather.kind;
      delete weather.turns;
    }
  }
}

async function buildActionQueue(state: BattleState): Promise<ResolvedAction[]> {
  const actions: ResolvedAction[] = [];

  const base = state.executionQueue?.length
    ? state.executionQueue
    : deriveExecutionQueueFromSelections(state);

  for (const item of base) {
    if (item.type === 'switch') {
      actions.push({
        user: item.user,
        type: 'switch',
        switchIndex: item.switchIndex,
        priority: PRIORITY_SWITCH,
        effectiveSpeed: getEffectiveSpeed(getCurrentPokemon(item.user === 'player' ? state.player : state.opponent)),
        quickModifier: 0,
        executionOrderRoll: Math.random(),
      });
      continue;
    }

    if (!item.moveId) continue;
    const attackerTeam = item.user === 'player' ? state.player : state.opponent;
    const attacker = getCurrentPokemon(attackerTeam);
    const defender = getCurrentPokemon(item.user === 'player' ? state.opponent : state.player);
    const compiled = await getMove(item.moveId);
    const basePriority = getMovePriority(item.moveId);

    const priorityBoost = calculatePriorityModifiers(attacker, compiled);
    const quickBoost = computeQuickModifiers(attacker, compiled);
    const effectivePriority = basePriority + priorityBoost + quickBoost.priorityDelta;

    const speed = adjustSpeedForTurnOrder(attacker, compiled, state);

    actions.push({
      user: item.user,
      type: 'move',
      moveId: item.moveId,
      target: item.target ?? (item.user === 'player' ? 'opponent' : 'player'),
      priority: effectivePriority,
      effectiveSpeed: speed,
      quickModifier: quickBoost.speedTieBreaker,
      executionOrderRoll: Math.random(),
      isPursuitReaction: compiled.name.toLowerCase() === 'pursuit' && defender.volatile && defender.volatile.choiceLock?.toLowerCase() === 'switch',
    });
  }

  handlePursuitIntercept(actions, state);

  const trickRoomActive = Boolean((state.field as any)?.trickRoomTurns && (state.field as any).trickRoomTurns > 0);

  actions.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (trickRoomActive) {
      if (a.effectiveSpeed !== b.effectiveSpeed) return a.effectiveSpeed - b.effectiveSpeed;
    } else {
      if (a.effectiveSpeed !== b.effectiveSpeed) return b.effectiveSpeed - a.effectiveSpeed;
    }
    if (a.quickModifier !== b.quickModifier) return b.quickModifier - a.quickModifier;
    return b.executionOrderRoll - a.executionOrderRoll;
  });

  return actions;
}

function deriveExecutionQueueFromSelections(state: BattleState): BattleState['executionQueue'] {
  const queue: BattleState['executionQueue'] = [];
  const playerSelection = state.selectedMoves?.player;
  const opponentSelection = state.selectedMoves?.opponent;

  if (playerSelection) {
    if (playerSelection.type === 'move') {
      const move = getSelectedMoveId(state.player, playerSelection.moveIndex);
      if (move) {
        queue.push({ type: 'move', user: 'player', moveId: move, target: 'opponent', priority: 0, speed: 0 });
      }
    } else if (playerSelection.type === 'switch') {
      queue.push({ type: 'switch', user: 'player', switchIndex: playerSelection.moveIndex, priority: PRIORITY_SWITCH, speed: 0 });
    }
  }

  if (opponentSelection) {
    if (opponentSelection.type === 'move') {
      const move = getSelectedMoveId(state.opponent, opponentSelection.moveIndex);
      if (move) {
        queue.push({ type: 'move', user: 'opponent', moveId: move, target: 'player', priority: 0, speed: 0 });
      }
    } else if (opponentSelection.type === 'switch') {
      queue.push({ type: 'switch', user: 'opponent', switchIndex: opponentSelection.moveIndex, priority: PRIORITY_SWITCH, speed: 0 });
    }
  }

  return queue;
}

function getSelectedMoveId(team: BattleTeamWithActive, index: number | undefined | null): string | undefined {
  if (index == null) return undefined;
  const active = getCurrentPokemon(team);
  return active.moves[index]?.id;
}

type BattleTeamWithActive = Pick<BattleState, 'player'>['player'];

function calculatePriorityModifiers(attacker: BattlePokemon, move: CompiledMove): number {
  const ability = attacker.currentAbility?.toLowerCase();
  let bonus = 0;

  if (ability === 'prankster' && move.category === 'Status') {
    bonus += 1;
  }

  if (ability === 'gale-wings' && (
    move.type.toLowerCase() === 'flying' && attacker.currentHp === attacker.maxHp
  )) {
    bonus += 1;
  }

  if (ability === 'triage' && move.drain) {
    bonus += 3;
  }

  return bonus;
}

function computeQuickModifiers(attacker: BattlePokemon, move: CompiledMove): { priorityDelta: number; speedTieBreaker: number } {
  let delta = 0;
  let breaker = 0;

  const ability = attacker.currentAbility?.toLowerCase();
  if (ability === 'quick-draw' && move.category !== 'Status') {
    if (Math.random() < 0.3) {
      delta += 1;
    }
  }

  const held = (attacker as any).item?.toLowerCase?.();
  if (held === 'quick-claw' && move.category !== 'Status') {
    if (Math.random() < 0.2) {
      delta += 1;
      breaker += 0.5;
    }
  }

  return { priorityDelta: delta, speedTieBreaker: breaker };
}

function adjustSpeedForTurnOrder(attacker: BattlePokemon, move: CompiledMove, state: BattleState): number {
  let speed = getEffectiveSpeed(attacker);

  if (attacker.status === 'paralyzed') {
    speed = Math.floor(speed / 2);
  }

  const tailwind = (state.field as any)?.tailwind;
  if (tailwind?.player && tailwind.player.turns > 0 && attacker === getCurrentPokemon(state.player)) {
    speed *= 2;
  }
  if (tailwind?.opponent && tailwind.opponent.turns > 0 && attacker === getCurrentPokemon(state.opponent)) {
    speed *= 2;
  }

  const ability = attacker.currentAbility?.toLowerCase();
  if (ability === 'chlorophyll' && (state.field as any)?.weather?.kind === 'sun') {
    speed *= 2;
  }
  if (ability === 'swift-swim' && (state.field as any)?.weather?.kind === 'rain') {
    speed *= 2;
  }

  if ((state.field as any)?.tailwind?.user === attacker.pokemon.name) {
    speed *= 2;
  }

  if (move.name.toLowerCase() === 'gyro-ball') {
    speed = Math.max(speed, 1);
  }

  return speed;
}

function handlePursuitIntercept(actions: ResolvedAction[], state: BattleState): void {
  const switchIndices = new Map<Side, number>();
  actions.forEach((action, idx) => {
    if (action.type === 'switch') switchIndices.set(action.user, idx);
  });

  if (!switchIndices.size) return;

  actions.forEach(action => {
    if (action.type !== 'move' || !action.moveId) return;
    if (action.moveId.toLowerCase() !== 'pursuit') return;
    const targetSide = action.user === 'player' ? 'opponent' : 'player';
    if (!switchIndices.has(targetSide)) return;

    // Move pursuit just before the switch action
    action.priority = Math.max(action.priority, PRIORITY_SWITCH + 1);
  });
}

async function executeMove(
  state: BattleState,
  action: ResolvedAction,
  attackingTeam: BattleTeamWithActive,
  defendingTeam: BattleTeamWithActive
): Promise<void> {
  const attacker = getCurrentPokemon(attackingTeam);
  const defender = getCurrentPokemon(defendingTeam);
  const moveId = action.moveId!;

  const move = await getMove(moveId);

  const attackingMoveSlot = attacker.moves.find(slot => slot.id === moveId);
  if (attackingMoveSlot) {
    attackingMoveSlot.pp = Math.max(0, attackingMoveSlot.pp - 1);
  }

  const availability = canUseMove(attacker, moveId);
  if (!availability.canUse) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} ${availability.reason ?? "couldn't move"}!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  if (attacker.status === 'paralyzed' && Math.random() < 0.25) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} is fully paralyzed!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  if (attacker.status === 'asleep') {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} is fast asleep.`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  if (attacker.status === 'frozen' && Math.random() >= 0.2) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} is frozen solid!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }

  if (move.category === 'Status') {
    await applyStatusMoveEffects(attacker as any, defender as any, move as any, state as any);
    return;
  }

  const protectActive = Boolean(defender.volatile.protect);
  if (protectActive && !move.bypassAccuracyCheck) {
    state.battleLog.push({
      type: 'move_missed',
      message: `${defender.pokemon.name} protected itself!`,
      pokemon: defender.pokemon.name,
      move: move.name,
    });
    return;
  }

  const hitsToTake = determineHitCount(move);
  const hitResults: number[] = [];
  const criticals: boolean[] = [];

  for (let i = 0; i < hitsToTake; i++) {
    if (defender.currentHp <= 0) break;

    const damageResult = await calculateDamageDetailed(attacker, defender, move as CompiledMove);
    const damage = Math.max(1, damageResult.damage);
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    hitResults.push(damage);
    criticals.push(damageResult.critical);

    state.battleLog.push({
      type: 'damage_dealt',
      message: `${attacker.pokemon.name} dealt ${damage} damage to ${defender.pokemon.name}!`,
      pokemon: attacker.pokemon.name,
      move: move.name,
      damage: Math.round((damage / defender.maxHp) * 100),
      effectiveness:
        damageResult.effectiveness > 1
          ? 'super_effective'
          : damageResult.effectiveness === 0
            ? 'no_effect'
            : damageResult.effectiveness < 1
              ? 'not_very_effective'
              : 'normal',
    });

    if (defender.currentHp <= 0) {
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${defender.pokemon.name} fainted!`,
        pokemon: defender.pokemon.name,
      });
      break;
    }
  }

  if (move.drain) {
    const drainAmount = Math.floor(hitResults.reduce((sum, val) => sum + val, 0) * (move.drain.fraction ?? 0));
    if (drainAmount > 0) {
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drainAmount);
      state.battleLog.push({
        type: 'healing',
        message: `${attacker.pokemon.name} restored some HP!`,
        pokemon: attacker.pokemon.name,
        healing: Math.round((drainAmount / attacker.maxHp) * 100),
      });
    }
  }

  if (move.recoil) {
    const recoilAmount = Math.floor(hitResults.reduce((sum, val) => sum + val, 0) * (move.recoil.fraction ?? 0));
    if (recoilAmount > 0) {
      attacker.currentHp = Math.max(0, attacker.currentHp - recoilAmount);
      state.battleLog.push({
        type: 'recoil',
        message: `${attacker.pokemon.name} is hit with recoil!`,
        pokemon: attacker.pokemon.name,
        damage: Math.round((recoilAmount / attacker.maxHp) * 100),
      });
    }
  }

  if (move.ailment) {
    const ailmentApplied = maybeApplyAilment(defender, move.ailment.kind, move.ailment.chance);
    if (ailmentApplied) {
      state.battleLog.push({
        type: 'status_applied',
        message: `${defender.pokemon.name} is now ${ailmentApplied}!`,
        pokemon: defender.pokemon.name,
        status: ailmentApplied,
      });
    }
  }

  if (move.statChanges?.length) {
    await applyStatusMoveEffects(attacker as any, defender as any, move as any, state as any);
  }

  handleContactAbilities(state, attacker, defender, move);

  if (defender.currentHp <= 0 && attacker.currentAbility?.toLowerCase() === 'moxie') {
    attacker.statModifiers.attack = Math.min(6, attacker.statModifiers.attack + 1);
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name}'s Moxie boosted its Attack!`,
      pokemon: attacker.pokemon.name,
    });
  }
}

function determineHitCount(move: CompiledMove): number {
  if (!move.hits) return 1;
  const { min, max } = move.hits;
  if (min === max) return min;
  const distribution = [2, 3, 4, 5];
  if (min === 2 && max === 5) {
    const roll = Math.random();
    if (roll < 0.375) return 2;
    if (roll < 0.75) return 3;
    if (roll < 0.875) return 4;
    return 5;
  }
  return distribution[Math.floor(Math.random() * distribution.length)] ?? min;
}

function maybeApplyAilment(target: BattlePokemon, ailment: string, chance = 100): string | null {
  if (Math.random() * 100 >= chance) return null;
  const lower = ailment.toLowerCase();
  if (!target.status) {
    if (lower.includes('paral')) {
      target.status = 'paralyzed';
      return 'Paralyzed';
    }
    if (lower.includes('burn')) {
      target.status = 'burned';
      return 'Burned';
    }
    if (lower.includes('poison')) {
      target.status = 'poisoned';
      return 'Poisoned';
    }
    if (lower.includes('sleep')) {
      target.status = 'asleep';
      target.statusTurns = 0;
      return 'Asleep';
    }
    if (lower.includes('freeze')) {
      target.status = 'frozen';
      target.statusTurns = 0;
      return 'Frozen';
    }
  }
  return null;
}

function handleContactAbilities(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, move: CompiledMove): void {
  if (!move.makesContact) return;

  const defenderAbility = defender.currentAbility?.toLowerCase();
  if (!defenderAbility) return;

  if (defenderAbility === 'rough-skin' || defenderAbility === 'iron-barbs') {
    const damage = Math.floor(attacker.maxHp / 8);
    attacker.currentHp = Math.max(0, attacker.currentHp - damage);
    state.battleLog.push({
      type: 'recoil',
      message: `${attacker.pokemon.name} was hurt by ${defender.pokemon.name}'s ${defenderAbility.replace('-', ' ')}!`,
      pokemon: attacker.pokemon.name,
      damage: Math.round((damage / attacker.maxHp) * 100),
    });
  }

  if (defenderAbility === 'static' && Math.random() < 0.3) {
    if (!attacker.status) {
      attacker.status = 'paralyzed';
      state.battleLog.push({
        type: 'status_applied',
        message: `${attacker.pokemon.name} was paralyzed by Static!`,
        pokemon: attacker.pokemon.name,
        status: 'PAR',
      });
    }
  }

  if (defenderAbility === 'flame-body' && Math.random() < 0.3) {
    if (!attacker.status) {
      attacker.status = 'burned';
      state.battleLog.push({
        type: 'status_applied',
        message: `${attacker.pokemon.name} was burned by Flame Body!`,
        pokemon: attacker.pokemon.name,
        status: 'BRN',
      });
    }
  }
}

async function applyEndOfTurn(state: BattleState): Promise<void> {
  await processEndOfTurn(state);

  const playerFainted = getCurrentPokemon(state.player).currentHp <= 0;
  const opponentFainted = getCurrentPokemon(state.opponent).currentHp <= 0;

  if (playerFainted && opponentFainted) {
    if (state.player.faintedCount < state.player.pokemon.length && state.opponent.faintedCount < state.opponent.pokemon.length) {
      state.phase = 'replacement';
    } else {
      state.isComplete = true;
      state.winner = undefined;
      state.battleLog.push({
        type: 'battle_end',
        message: 'Both Pokémon fainted! The battle ends in a draw.',
      });
    }
  }

  if (state.player.faintedCount >= state.player.pokemon.length) {
    state.isComplete = true;
    state.winner = 'opponent';
    state.battleLog.push({
      type: 'battle_end',
      message: 'All of the player\'s Pokémon fainted! Opponent wins!',
    });
  }

  if (state.opponent.faintedCount >= state.opponent.pokemon.length) {
    state.isComplete = true;
    state.winner = 'player';
    state.battleLog.push({
      type: 'battle_end',
      message: 'All of the opponent\'s Pokémon fainted! Player wins!',
    });
  }
}
