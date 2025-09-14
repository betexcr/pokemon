// Additional functions for the Gen-8/9 battle engine

import { BattleState, BattlePokemon, getCurrentPokemon, switchToPokemon, getEffectiveSpeed, isTeamDefeated } from './team-battle-engine';

// Resolve a switch action
export async function resolveSwitch(state: BattleState, action: BattleState['actionQueue'][0]): Promise<void> {
  const team = action.user === 'player' ? state.player : state.opponent;
  const switchIndex = action.switchIndex!;
  
  console.log(`🔄 ${action.user} switching to Pokemon at index ${switchIndex}`);
  
  // Clear some volatiles from outgoing Pokemon
  const currentPokemon = getCurrentPokemon(team);
  currentPokemon.volatile.protect = undefined;
  currentPokemon.volatile.flinched = false;
  
  // Perform the switch
  switchToPokemon(team, switchIndex);
  const newPokemon = getCurrentPokemon(team);
  
  // Log the switch
  state.battleLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${newPokemon.pokemon.name}!`,
    pokemon: newPokemon.pokemon.name
  });
  
  // Run on-entry sequence (hazards, abilities, etc.)
  await runEntrySequence(state, action.user === 'player' ? 'opponent' : 'player', newPokemon);
}

// Resolve a move action
export async function resolveMove(state: BattleState, action: BattleState['actionQueue'][0]): Promise<void> {
  const attacker = action.user === 'player' ? getCurrentPokemon(state.player) : getCurrentPokemon(state.opponent);
  const defender = action.user === 'player' ? getCurrentPokemon(state.opponent) : getCurrentPokemon(state.player);
  const moveId = action.moveId!;
  
  console.log(`⚡ ${action.user} using move ${moveId}`);
  
  // Check if Pokemon can use the move
  const canUseResult = canUseMove(attacker, moveId);
  if (!canUseResult.canUse) {
    const reason = canUseResult.reason || 'couldn\'t use the move';
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} is ${reason}...`,
      pokemon: attacker.pokemon.name
    });
    return;
  }
  
  // Check for flinch
  if (attacker.volatile.flinched) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} flinched and couldn't move!`,
      pokemon: attacker.pokemon.name
    });
    attacker.volatile.flinched = false;
    return;
  }
  
  // Execute the move (simplified for now)
  await executeMoveAction(state, attacker, defender, moveId, action.user === 'player');
}

// Execute a move action (simplified version)
export async function executeMoveAction(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
  isPlayer: boolean
): Promise<void> {
  // For now, use the existing move execution logic
  // This would need to be updated to work with the new move system
  state.battleLog.push({
    type: 'move_used',
    message: `${attacker.pokemon.name} used ${moveId}!`,
    pokemon: attacker.pokemon.name,
    move: moveId
  });
  
  // TODO: Implement full move resolution pipeline
  // 1. Usability gates ✓
  // 2. Target validation
  // 3. Accuracy check
  // 4. Critical check
  // 5. Damage calculation
  // 6. Post-hit effects
}

// Run on-entry sequence for a Pokemon
export async function runEntrySequence(state: BattleState, opponentSide: 'player' | 'opponent', incomingPokemon: BattlePokemon): Promise<void> {
  const opponentTeam = opponentSide === 'player' ? state.player : state.opponent;
  
  // Check for entry hazards (simplified - no hazards for now)
  // TODO: Implement Stealth Rock, Spikes, Toxic Spikes, Sticky Web
  
  // Check for on-entry abilities/items
  // TODO: Implement Intimidate, Download, Frisk, etc.
  
  console.log(`🎯 Running entry sequence for ${incomingPokemon.pokemon.name}`);
}

// Process end-of-turn effects
export async function processEndOfTurn(state: BattleState): Promise<void> {
  console.log('🌅 Processing end-of-turn effects');
  
  // 1. Residual damage/heal
  processResidualDamage(state);
  
  // 2. Item residuals
  processItemResiduals(state);
  
  // 3. End-of-turn abilities
  processEndOfTurnAbilities(state);
  
  // 4. Volatile decrements
  processVolatileDecrements(state);
  
  // 5. Check faints from residuals
  checkResidualFaints(state);
}

// Process residual damage
export function processResidualDamage(state: BattleState): void {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  
  // Poison/Burn damage
  if (playerPokemon.status === 'poisoned') {
    const damage = Math.floor(playerPokemon.maxHp / 8);
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${playerPokemon.pokemon.name} was hurt by poison!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round((damage / playerPokemon.maxHp) * 100)
      });
    }
  }
  
  if (opponentPokemon.status === 'poisoned') {
    const damage = Math.floor(opponentPokemon.maxHp / 8);
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${opponentPokemon.pokemon.name} was hurt by poison!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round((damage / opponentPokemon.maxHp) * 100)
      });
    }
  }
  
  // Burn damage
  if (playerPokemon.status === 'burned') {
    const damage = Math.floor(playerPokemon.maxHp / 16);
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${playerPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round((damage / playerPokemon.maxHp) * 100)
      });
    }
  }
  
  if (opponentPokemon.status === 'burned') {
    const damage = Math.floor(opponentPokemon.maxHp / 16);
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${opponentPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round((damage / opponentPokemon.maxHp) * 100)
      });
    }
  }
}

// Process item residuals
export function processItemResiduals(state: BattleState): void {
  // TODO: Implement Leftovers, Black Sludge, etc.
}

// Process end-of-turn abilities
export function processEndOfTurnAbilities(state: BattleState): void {
  // TODO: Implement Speed Boost, Moody, Harvest, etc.
}

// Process volatile decrements
export function processVolatileDecrements(state: BattleState): void {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  
  // Confusion turns
  if (playerPokemon.volatile.confusion) {
    playerPokemon.volatile.confusion.turns--;
    if (playerPokemon.volatile.confusion.turns <= 0) {
      playerPokemon.volatile.confusion = undefined;
      state.battleLog.push({
        type: 'status_effect',
        message: `${playerPokemon.pokemon.name} snapped out of confusion!`,
        pokemon: playerPokemon.pokemon.name
      });
    }
  }
  
  if (opponentPokemon.volatile.confusion) {
    opponentPokemon.volatile.confusion.turns--;
    if (opponentPokemon.volatile.confusion.turns <= 0) {
      opponentPokemon.volatile.confusion = undefined;
      state.battleLog.push({
        type: 'status_effect',
        message: `${opponentPokemon.pokemon.name} snapped out of confusion!`,
        pokemon: opponentPokemon.pokemon.name
      });
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
    }
  }
}

// Check for faints from residuals
export function checkResidualFaints(state: BattleState): void {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  
  if (playerPokemon.currentHp <= 0) {
    state.battleLog.push({
      type: 'pokemon_fainted',
      message: `${playerPokemon.pokemon.name} fainted!`,
      pokemon: playerPokemon.pokemon.name
    });
  }
  
  if (opponentPokemon.currentHp <= 0) {
    state.battleLog.push({
      type: 'pokemon_fainted',
      message: `${opponentPokemon.pokemon.name} fainted!`,
      pokemon: opponentPokemon.pokemon.name
    });
  }
}

// Process force replacements
export async function processReplacements(state: BattleState): Promise<void> {
  console.log('🔄 Processing force replacements');
  
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
    const playerSpeed = getEffectiveSpeed(getCurrentPokemon(state.player));
    const opponentSpeed = getEffectiveSpeed(getCurrentPokemon(state.opponent));
    
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
