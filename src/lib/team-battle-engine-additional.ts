// Additional functions for the Gen-8/9 battle engine

import { BattleState, BattlePokemon, getCurrentPokemon, switchToPokemon, getEffectiveSpeed, isTeamDefeated, canUseMove, applyStatusMoveEffects } from './team-battle-engine';
import { calculateComprehensiveDamage } from './damage-calculator';
import { getMove } from './moveCache';
import { applyEntryHazards } from './team-battle-hazards';
import { handleOnEntryAbilities } from './team-battle-abilities';
import { applyWeatherResidual, applyTerrainHealing, decrementFieldTimers, applyLeechSeed, applyBindingDamage } from './team-battle-field';
import { applyEndOfTurnStatus, clearStatus } from './team-battle-status';
import { getPokemonTypes } from './team-battle-hazards';
import { BattleRng, rngRollChance } from './battle-rng';
import { tryConsumeBerry, tryHarvestBerry } from './team-battle-items';

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
  newPokemon.volatile.justSwitchedIn = true;
}

// Resolve a move action
export async function resolveMove(state: BattleState, action: BattleState['actionQueue'][0]): Promise<void> {
  const attacker = action.user === 'player' ? getCurrentPokemon(state.player) : getCurrentPokemon(state.opponent);
  const defender = action.user === 'player' ? getCurrentPokemon(state.opponent) : getCurrentPokemon(state.player);
  const moveId = action.moveId!;
  
  console.log(`⚡ ${action.user} using move ${moveId}`);
  
  // Check if Pokemon can use the move
  const canUseResult = canUseMove(attacker, moveId, state.rng);
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
  await executeMoveAction(state, attacker, defender, moveId, action.user === 'player', action.user);
}

// Execute a move action (simplified version)
export async function executeMoveAction(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
  isPlayer: boolean,
  user: 'player' | 'opponent'
): Promise<void> {
  // Log the move usage
  state.battleLog.push({
    type: 'move_used',
    message: `${attacker.pokemon.name} used ${moveId}!`,
    pokemon: attacker.pokemon.name,
    move: moveId
  });
  
  // Get move data
  const move = await getMove(moveId);
  if (!move) {
    console.error(`Move ${moveId} not found`);
    return;
  }
  
  // Handle status moves (no direct damage)
  if (move.category === 'Status' || (move.power ?? 0) === 0) {
    await applyStatusMoveEffects(attacker as any, defender as any, move as any, state as any);
    return;
  }
  
  // Get stats from the Pokemon data structure
  const attackerAttackStat = attacker.pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
  const attackerSpecialAttackStat = attacker.pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50;
  const defenderDefenseStat = defender.pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
  const defenderSpecialDefenseStat = defender.pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50;
  
  // Determine if this is a physical or special move
  const isPhysical = move.category === 'Physical';
  const attackStat = isPhysical ? attackerAttackStat : attackerSpecialAttackStat;
  const defenseStat = isPhysical ? defenderDefenseStat : defenderSpecialDefenseStat;
  
  console.log(`Calculating damage for ${moveId} (power: ${move.power}, type: ${move.type}, category: ${move.category})`);
  console.log(`Attacker: ${attacker.pokemon.name} (level ${attacker.level}, ${isPhysical ? 'attack' : 'special-attack'}: ${attackStat})`);
  console.log(`Defender: ${defender.pokemon.name} (${isPhysical ? 'defense' : 'special-defense'}: ${defenseStat}, current HP: ${defender.currentHp})`);
  
  // Calculate damage using the comprehensive damage calculator
  const damageResult = calculateComprehensiveDamage({
    level: attacker.level,
    movePower: move.power || 0,
    moveType: move.type as any,
    attackerTypes: attacker.pokemon.types.map(type => 
      (typeof type === 'string' ? type : type.type?.name || 'normal') as any
    ),
    defenderTypes: defender.pokemon.types.map(type => 
      (typeof type === 'string' ? type : type.type?.name || 'normal') as any
    ),
    attackStat: attackStat,
    defenseStat: defenseStat,
    weather: 'None', // TODO: Implement weather effects
    terrain: 'None', // TODO: Implement terrain effects
    isPhysical: move.category === 'Physical',
  });
  
  const damage = damageResult.damage;
  const oldHp = defender.currentHp;
  defender.currentHp = Math.max(0, defender.currentHp - damage);
  totalDamageDealt += damage;
  tryConsumeBerry(state, defender);
  
  console.log(`Damage calculated: ${damage} (${oldHp} -> ${defender.currentHp})`);
  
  // Log damage dealt
  const damagePercent = Math.round((damage / oldHp) * 100);
  const remainingPercent = Math.round((defender.currentHp / defender.maxHp) * 100);
  
  state.battleLog.push({
    type: 'damage_dealt',
    message: `${defender.pokemon.name} took ${damage} damage! (${remainingPercent}% HP left)`,
    pokemon: defender.pokemon.name,
    damage: damagePercent
  });
  
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
    
    console.log(`Pokemon fainted! Updated ${user === 'player' ? 'opponent' : 'player'} team fainted count to ${defendingTeam.faintedCount}`);
  }
}

// Run on-entry sequence for a Pokemon
export async function runEntrySequence(state: BattleState, opponentSide: 'player' | 'opponent', incomingPokemon: BattlePokemon): Promise<void> {
  const opponentTeam = opponentSide === 'player' ? state.player : state.opponent;

  // Check for entry hazards
  const hazards = opponentTeam.sideConditions.hazards;
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
    incomingPokemon.statModifiers.speed = Math.max(-6, incomingPokemon.statModifiers.speed - 1);
    state.battleLog.push({
      type: 'status_effect',
      message: `${incomingPokemon.pokemon.name}'s Speed was lowered by Sticky Web!`,
      pokemon: incomingPokemon.pokemon.name,
    });
  }

  if (result.absorbedToxicSpikes) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${incomingPokemon.pokemon.name} absorbed the Toxic Spikes!`,
      pokemon: incomingPokemon.pokemon.name,
    });
  }

  handleOnEntryAbilities(state, opponentSide === 'player' ? 'opponent' : 'player', incomingPokemon);
}

// Process end-of-turn effects
export async function processEndOfTurn(state: BattleState): Promise<void> {
  console.log('🌅 Processing end-of-turn effects');
  
  // 1. Residual damage/heal
  applyWeatherResidual(state);
  processResidualDamage(state);
  applyTerrainHealing(state);
  applyLeechSeed(state);
  applyBindingDamage(state);
  decrementFieldTimers(state.field, {
    player: state.player.sideConditions.screens,
    opponent: state.opponent.sideConditions.screens,
  });

  applyEndOfTurnStatus(state, getCurrentPokemon(state.player));
  applyEndOfTurnStatus(state, getCurrentPokemon(state.opponent));
  
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
  if (playerPokemon.status === 'poisoned' || playerPokemon.status === 'badly-poisoned') {
    if (!playerPokemon.volatile.toxicCounter) {
      playerPokemon.volatile.toxicCounter = playerPokemon.status === 'badly-poisoned' ? 1 : 0;
    }
    if (playerPokemon.status === 'badly-poisoned') {
      playerPokemon.volatile.toxicCounter += 1;
    }
    const damageFraction = playerPokemon.status === 'badly-poisoned'
      ? Math.min(16, playerPokemon.volatile.toxicCounter ?? 1) / 16
      : 1 / 8;
    const damage = Math.floor(playerPokemon.maxHp * damageFraction);
    const oldHp = playerPokemon.currentHp;
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${playerPokemon.pokemon.name} was hurt by poison!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round((damage / playerPokemon.maxHp) * 100)
      });
    }
    // Update fainted count if Pokemon fainted
    if (oldHp > 0 && playerPokemon.currentHp <= 0) {
      state.player.faintedCount = state.player.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  if (opponentPokemon.status === 'poisoned' || opponentPokemon.status === 'badly-poisoned') {
    if (!opponentPokemon.volatile.toxicCounter) {
      opponentPokemon.volatile.toxicCounter = opponentPokemon.status === 'badly-poisoned' ? 1 : 0;
    }
    if (opponentPokemon.status === 'badly-poisoned') {
      opponentPokemon.volatile.toxicCounter += 1;
    }
    const damageFraction = opponentPokemon.status === 'badly-poisoned'
      ? Math.min(16, opponentPokemon.volatile.toxicCounter ?? 1) / 16
      : 1 / 8;
    const damage = Math.floor(opponentPokemon.maxHp * damageFraction);
    const oldHp = opponentPokemon.currentHp;
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${opponentPokemon.pokemon.name} was hurt by poison!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round((damage / opponentPokemon.maxHp) * 100)
      });
    }
    // Update fainted count if Pokemon fainted
    if (oldHp > 0 && opponentPokemon.currentHp <= 0) {
      state.opponent.faintedCount = state.opponent.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  // Burn damage
  if (playerPokemon.status === 'burned') {
    const damage = Math.floor(playerPokemon.maxHp / 16);
    const oldHp = playerPokemon.currentHp;
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${playerPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round((damage / playerPokemon.maxHp) * 100)
      });
    }
    // Update fainted count if Pokemon fainted
    if (oldHp > 0 && playerPokemon.currentHp <= 0) {
      state.player.faintedCount = state.player.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  if (opponentPokemon.status === 'burned') {
    const damage = Math.floor(opponentPokemon.maxHp / 16);
    const oldHp = opponentPokemon.currentHp;
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: 'status_damage',
        message: `${opponentPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round((damage / opponentPokemon.maxHp) * 100)
      });
    }
    // Update fainted count if Pokemon fainted
    if (oldHp > 0 && opponentPokemon.currentHp <= 0) {
      state.opponent.faintedCount = state.opponent.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  // Binding damage
}

// Process item residuals
export function processItemResiduals(state: BattleState): void {
  const processItem = (team: BattleTeam) => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const item = pokemon.heldItem?.toLowerCase();
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

    // TODO: implement berry consumption triggers during damage resolution
  };

  processItem(state.player);
  processItem(state.opponent);

  // Reset per-turn damage trackers after applying Shell Bell
  getCurrentPokemon(state.player).volatile.damageDealtThisTurn = 0;
  getCurrentPokemon(state.opponent).volatile.damageDealtThisTurn = 0;
}

// Process end-of-turn abilities
export function processEndOfTurnAbilities(state: BattleState): void {
  [state.player, state.opponent].forEach(team => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const ability = pokemon.currentAbility?.toLowerCase();
    switch (ability) {
      case 'speed-boost': {
        pokemon.statModifiers.speed = Math.min(6, pokemon.statModifiers.speed + 1);
        state.battleLog.push({
          type: 'status_effect',
          message: `${pokemon.pokemon.name}'s Speed rose thanks to Speed Boost!`,
          pokemon: pokemon.pokemon.name,
        });
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
