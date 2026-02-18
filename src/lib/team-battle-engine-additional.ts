// Additional functions for the Gen-8/9 battle engine

import { BattleState, BattlePokemon, BattleTeam, getCurrentPokemon, switchToPokemon, getEffectiveSpeed, isTeamDefeated, canUseMove, applyStatusMoveEffects } from './team-battle-engine';
import { calculateComprehensiveDamage } from './damage-calculator';
import { getMove } from './moveCache';
import { applyEntryHazards } from './team-battle-hazards';
import { handleOnEntryAbilities } from './team-battle-abilities';
import { applyWeatherResidual, applyTerrainHealing, decrementFieldTimers, applyLeechSeed, applyBindingDamage } from './team-battle-field';
import { applyEndOfTurnStatus, clearStatus } from './team-battle-status';
import { getPokemonTypes } from './team-battle-hazards';
import { BattleRng, rngRollChance, rngNextInt, rngNextFloat } from './battle-rng';
import { tryConsumeBerry, tryHarvestBerry } from './team-battle-items';

// Process start-of-turn effects
export async function processStartOfTurn(state: BattleState): Promise<void> {
  console.log('🌄 Processing start-of-turn effects');
  
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
  
  playerPokemon.volatile.flinched = false;
  playerPokemon.volatile.justSwitchedIn = false;
  opponentPokemon.volatile.flinched = false;
  opponentPokemon.volatile.justSwitchedIn = false;
  
  // 3. Process Yawn (sleep next turn)
  if (playerPokemon.volatile.yawn) {
    playerPokemon.volatile.yawn.turns--;
    if (playerPokemon.volatile.yawn.turns <= 0) {
      playerPokemon.status = 'asleep';
      playerPokemon.statusTurns = 0;
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
      opponentPokemon.status = 'asleep';
      opponentPokemon.statusTurns = 0;
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
  return rngNextInt(rng, minHits, maxHits + 1);
}

// Execute a move action with multi-hit support
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
  
  // Check if defender is protected
  if (defender.volatile.protect && defender.volatile.protect.active) {
    // Feint and moves with "bypassesProtect" can bypass Protect
    const bypassesProtect = moveId === 'feint' || move.bypassesProtect;
    
    if (!bypassesProtect) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name} protected itself!`,
        pokemon: defender.pokemon.name
      });
      
      // Increment protect counter for next turn
      if (!defender.volatile.protect.counter) {
        defender.volatile.protect.counter = 1;
      }
      return; // Move blocked
    }
  }
  
  // Determine number of hits
  const hitCount = determineHitCount(move, attacker, state.rng);
  let totalDamageDealt = 0;
  let actualHits = 0;
  
  // Execute each hit
  for (let i = 0; i < hitCount; i++) {
    // Check if defender is still alive
    if (defender.currentHp <= 0) {
      break; // Stop hitting if target fainted
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
      weather: 'None',
      terrain: 'None',
      isPhysical: move.category === 'Physical',
    });
    
    let damage = damageResult.damage;
    const oldHp = defender.currentHp;
    
    // Check for Focus Sash / Sturdy (survive at 1 HP from full HP)
    const defenderAbility = defender.currentAbility?.toLowerCase();
    const defenderItem = defender.heldItem?.toLowerCase();
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
    
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    totalDamageDealt += damage;
    actualHits++;
    
    // Trigger contact abilities per hit (Rough Skin, Iron Barbs, Static, etc.)
    if (move.makesContact) {
      const defenderAbility = defender.currentAbility?.toLowerCase();
      
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
      const defenderItem = defender.heldItem?.toLowerCase();
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
    
    // Check if attacker fainted from recoil
    if (attacker.currentHp <= 0) {
      const attackingTeam = user === 'player' ? state.player : state.opponent;
      attackingTeam.faintedCount = attackingTeam.pokemon.filter(p => p.currentHp <= 0).length;
      break;
    }
  }
  
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
  
  // Track damage for Shell Bell
  if (!attacker.volatile.damageDealtThisTurn) {
    attacker.volatile.damageDealtThisTurn = 0;
  }
  attacker.volatile.damageDealtThisTurn += totalDamageDealt;
  
  // Apply recoil damage (Brave Bird, Flare Blitz, etc.)
  if (move.recoil && totalDamageDealt > 0) {
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
    const healAmount = Math.max(1, Math.floor(totalDamageDealt * drainFraction));
    const oldHp = attacker.currentHp;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
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
  const attackerItem = attacker.heldItem?.toLowerCase();
  if (attackerItem === 'life-orb' && totalDamageDealt > 0) {
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
  tryConsumeBerry(state, defender);
  
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
    
    // Trigger on-faint abilities (Moxie, Soul Heart, etc.)
    const attackerAbility = attacker.currentAbility?.toLowerCase();
    if (attackerAbility === 'moxie') {
      attacker.statModifiers.attack = Math.min(6, attacker.statModifiers.attack + 1);
      state.battleLog.push({
        type: 'status_effect',
        message: `${attacker.pokemon.name}'s Attack rose thanks to Moxie!`,
        pokemon: attacker.pokemon.name
      });
    } else if (attackerAbility === 'soul-heart' || attackerAbility === 'beast-boost') {
      attacker.statModifiers.specialAttack = Math.min(6, attacker.statModifiers.specialAttack + 1);
      state.battleLog.push({
        type: 'status_effect',
        message: `${attacker.pokemon.name}'s Special Attack rose!`,
        pokemon: attacker.pokemon.name
      });
    }
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
