import { Pokemon, Move } from "@/types/pokemon";

export type BattlePokemon = {
  pokemon: Pokemon;
  level: number;
  currentHp: number;
  maxHp: number;
  moves: Move[];
  status?: 'paralyzed' | 'poisoned' | 'burned' | 'frozen' | 'asleep' | 'confused';
  statusTurns?: number; // How many turns the status has been active
  flinched?: boolean; // Can't move this turn
  // Ability system
  currentAbility?: string;
  originalAbility?: string;
  abilityChanged?: boolean;
  statModifiers: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
    accuracy: number;
    evasion: number;
  };
};

export type BattleLogEntry = {
  type: 'turn_start' | 'move_used' | 'damage_dealt' | 'status_applied' | 'status_damage' | 'status_effect' | 'pokemon_fainted' | 'pokemon_sent_out' | 'battle_start' | 'battle_end' | 'ability_changed' | 'healing';
  message: string;
  turn?: number;
  pokemon?: string;
  move?: string;
  damage?: number;
  effectiveness?: 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal';
  status?: string;
  healing?: number;
};

export type BattleTeam = {
  pokemon: BattlePokemon[];
  currentIndex: number; // Index of currently active Pokémon
  faintedCount: number; // Number of fainted Pokémon
};

export type BattleState = {
  player: BattleTeam;
  opponent: BattleTeam;
  turn: 'player' | 'opponent';
  turnNumber: number;
  battleLog: BattleLogEntry[];
  isComplete: boolean;
  winner?: 'player' | 'opponent';
  phase: 'battle' | 'switch'; // Current battle phase
};

export type BattleAction = {
  type: 'move' | 'switch' | 'item';
  moveIndex?: number;
  target?: 'player' | 'opponent';
};

// Calculate HP based on level and base stats
export function calculateHp(baseHp: number, level: number): number {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

// Helper functions for team battles
export function getCurrentPokemon(team: BattleTeam): BattlePokemon {
  return team.pokemon[team.currentIndex];
}

export function isTeamDefeated(team: BattleTeam): boolean {
  return team.faintedCount >= team.pokemon.length;
}

export function getNextAvailablePokemon(team: BattleTeam): number | null {
  for (let i = 0; i < team.pokemon.length; i++) {
    if (team.pokemon[i].currentHp > 0) {
      return i;
    }
  }
  return null;
}

export function switchToPokemon(team: BattleTeam, index: number): void {
  if (index >= 0 && index < team.pokemon.length && team.pokemon[index].currentHp > 0) {
    team.currentIndex = index;
  }
}

// Calculate other stats based on level and base stats
export function calculateStat(baseStat: number, level: number): number {
  return Math.floor(((2 * baseStat + 31) * level) / 100) + 5;
}

// Apply stat modifiers
export function applyStatModifier(baseStat: number, modifier: number): number {
  const multiplier = modifier >= 0 ? (2 + modifier) / 2 : 2 / (2 - modifier);
  return Math.floor(baseStat * multiplier);
}

// Calculate damage percentage
export function calculateDamagePercentage(damage: number, maxHp: number): number {
  return Math.round((damage / maxHp) * 100);
}

// Get effectiveness text
export function getEffectivenessText(effectiveness: number): 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal' {
  if (effectiveness === 0) return 'no_effect';
  if (effectiveness > 1) return 'super_effective';
  if (effectiveness < 1) return 'not_very_effective';
  return 'normal';
}

// Get Pokémon's current ability
export function getCurrentAbility(pokemon: BattlePokemon): string {
  if (pokemon.currentAbility) {
    return pokemon.currentAbility;
  }
  
  // Get the first non-hidden ability from the Pokémon's abilities
  const ability = pokemon.pokemon.abilities.find(a => !a.is_hidden);
  return ability?.ability.name || 'none';
}

// Check if move can cause status effect
export function canCauseStatusEffect(move: Move): string | null {
  const statusMoves: Record<string, string> = {
    'thunder-wave': 'paralyzed',
    'thunderbolt': 'paralyzed',
    'thunder': 'paralyzed',
    'will-o-wisp': 'burned',
    'flamethrower': 'burned',
    'fire-blast': 'burned',
    'sleep-powder': 'asleep',
    'hypnosis': 'asleep',
    'spore': 'asleep',
    'sludge-bomb': 'poisoned',
    'poison-powder': 'poisoned',
    'toxic': 'poisoned',
    'ice-beam': 'frozen',
    'blizzard': 'frozen',
    'confuse-ray': 'confused',
    'supersonic': 'confused',
    'swagger': 'confused'
  };
  
  return statusMoves[move.name] || null;
}

// Check if move changes abilities
export function canChangeAbility(move: Move): string | null {
  const abilityMoves: Record<string, string> = {
    'worry-seed': 'insomnia',
    'gastro-acid': 'none', // Suppresses ability
    'simple-beam': 'simple',
    'entrainment': 'none' // Copies user's ability
  };
  
  return abilityMoves[move.name] || null;
}

// Check if Pokémon is immune to sleep
export function isImmuneToSleep(pokemon: BattlePokemon): boolean {
  const currentAbility = getCurrentAbility(pokemon);
  const sleepImmuneAbilities = ['insomnia', 'vital-spirit', 'sweet-veil'];
  return sleepImmuneAbilities.includes(currentAbility);
}

// Check if move is a healing move
export function isHealingMove(move: Move): boolean {
  const healingMoves = [
    'recover', 'rest', 'soft-boiled', 'milk-drink', 'synthesis', 
    'moonlight', 'morning-sun', 'roost', 'heal-bell', 'aromatherapy',
    'wish', 'heal-pulse', 'life-dew', 'jungle-healing'
  ];
  return healingMoves.includes(move.name);
}

// Calculate healing amount for healing moves
export function calculateHealing(user: BattlePokemon, move: Move): number {
  const healingAmounts: Record<string, number> = {
    'recover': 0.5,        // 50% of max HP
    'rest': 1.0,           // 100% of max HP (but puts to sleep)
    'soft-boiled': 0.5,    // 50% of max HP
    'milk-drink': 0.5,     // 50% of max HP
    'synthesis': 0.5,      // 50% of max HP (weather dependent)
    'moonlight': 0.5,      // 50% of max HP (weather dependent)
    'morning-sun': 0.5,    // 50% of max HP (weather dependent)
    'roost': 0.5,          // 50% of max HP
    'heal-pulse': 0.5,     // 50% of max HP (targets ally)
    'life-dew': 0.25,      // 25% of max HP (affects all allies)
    'jungle-healing': 0.25 // 25% of max HP (affects all allies)
  };
  
  const healingPercentage = healingAmounts[move.name] || 0;
  return Math.floor(user.maxHp * healingPercentage);
}

// Check if move is self-targeting
export function isSelfTargetingMove(move: Move): boolean {
  const selfTargetingMoves = [
    'recover', 'rest', 'soft-boiled', 'milk-drink', 'synthesis',
    'moonlight', 'morning-sun', 'roost', 'heal-bell', 'aromatherapy',
    'wish', 'swords-dance', 'dragon-dance', 'calm-mind', 'bulk-up',
    'nasty-plot', 'work-up', 'growth', 'hone-claws', 'coil'
  ];
  return selfTargetingMoves.includes(move.name);
}

// Check if move can cause flinch
export function canCauseFlinch(move: Move): boolean {
  const flinchMoves = [
    'air-slash', 'bite', 'dark-pulse', 'dragon-rush', 'extrasensory', 
    'headbutt', 'iron-head', 'rock-slide', 'zen-headbutt', 'fake-out',
    'flinch', 'stomp', 'rolling-kick', 'low-kick', 'double-kick'
  ];
  return flinchMoves.includes(move.name);
}

// Type effectiveness calculation
export function getTypeEffectiveness(attackType: string, defenseTypes: string[]): number {
  const typeChart: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, rock: 2, ground: 2, steel: 0.5, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, bug: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, ice: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, steel: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  let effectiveness = 1;
  for (const defenseType of defenseTypes) {
    const multiplier = typeChart[attackType]?.[defenseType] ?? 1;
    effectiveness *= multiplier;
  }
  return effectiveness;
}

// Calculate damage using simplified Gen 8+ formula
export function calculateDamageDetailed(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move
): { damage: number; effectiveness: number; critical: boolean; statusEffect?: string; flinch?: boolean } {
  const level = attacker.level;
  const power = move.power || 0;
  
  // Determine if move is physical or special
  const moveType = typeof move.type === 'string' ? move.type : move.type?.name || 'normal';
  const isPhysical = ['normal', 'fighting', 'poison', 'ground', 'flying', 'bug', 'rock', 'ghost', 'steel', 'fairy'].includes(moveType);
  
  // Get stats from the stats array
  const attackerAttackStat = attacker.pokemon.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 50;
  const attackerSpecialAttackStat = attacker.pokemon.stats.find(stat => stat.stat.name === 'special-attack')?.base_stat || 50;
  const defenderDefenseStat = defender.pokemon.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 50;
  const defenderSpecialDefenseStat = defender.pokemon.stats.find(stat => stat.stat.name === 'special-defense')?.base_stat || 50;
  
  const attack = isPhysical 
    ? applyStatModifier(calculateStat(attackerAttackStat, level), attacker.statModifiers.attack)
    : applyStatModifier(calculateStat(attackerSpecialAttackStat, level), attacker.statModifiers.specialAttack);
    
  const defense = isPhysical
    ? applyStatModifier(calculateStat(defenderDefenseStat, level), defender.statModifiers.defense)
    : applyStatModifier(calculateStat(defenderSpecialDefenseStat, level), defender.statModifiers.specialDefense);

  // Type effectiveness
  const defenderTypes = defender.pokemon.types.map(type => 
    typeof type === 'string' ? type : type.type?.name || ''
  );
  const effectiveness = getTypeEffectiveness(moveType, defenderTypes);
  
  // STAB (Same Type Attack Bonus)
  const attackerTypes = attacker.pokemon.types.map(type => 
    typeof type === 'string' ? type : type.type?.name || ''
  );
  const stab = attackerTypes.includes(moveType) ? 1.5 : 1;
  
  // Random factor (85-100%)
  const randomFactor = 0.85 + Math.random() * 0.15;
  
  // Critical hit chance (6.25% base)
  const criticalHit = Math.random() < 0.0625 ? 2 : 1;
  
  // Damage calculation
  const damage = Math.floor(
    ((((2 * level / 5 + 2) * power * attack / defense) / 50 + 2) * 
     effectiveness * stab * randomFactor * criticalHit)
  );
  
  // Check for status effects and flinch
  const statusEffect = canCauseStatusEffect(move);
  const flinch = canCauseFlinch(move) && Math.random() < 0.3; // 30% flinch chance
  
  return {
    damage: Math.max(1, damage),
    effectiveness,
    critical: criticalHit > 1,
    statusEffect: statusEffect || undefined,
    flinch: flinch || undefined
  };
}

// Simple damage calculation for backward compatibility
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move
): number {
  return calculateDamageDetailed(attacker, defender, move).damage;
}

// Check if a Pokemon can use a move
export function canUseMove(pokemon: BattlePokemon, moveIndex: number): { canUse: boolean; reason?: string } {
  if (moveIndex < 0 || moveIndex >= pokemon.moves.length) return { canUse: false, reason: 'Invalid move' };
  const move = pokemon.moves[moveIndex];
  if (!move) return { canUse: false, reason: 'No move' };
  
  // Check PP (simplified - assume infinite PP for now)
  // Check status conditions that prevent moves
  if (pokemon.status === 'asleep') {
    return { canUse: Math.random() < 0.25, reason: 'fast asleep' }; // 25% chance to wake up
  }
  if (pokemon.status === 'frozen') {
    return { canUse: Math.random() < 0.2, reason: 'frozen solid' }; // 20% chance to break free
  }
  if (pokemon.status === 'paralyzed') {
    return { canUse: Math.random() < 0.75, reason: 'fully paralyzed' }; // 25% chance to be paralyzed
  }
  if (pokemon.status === 'confused') {
    return { canUse: Math.random() < 0.5, reason: 'confused' }; // 50% chance to hit self
  }
  
  return { canUse: true };
}

// Apply status effects
export function applyStatusEffect(pokemon: BattlePokemon, status: BattlePokemon['status']): void {
  pokemon.status = status;
}

// Process end of turn status effects
export function processEndOfTurnStatus(pokemon: BattlePokemon): number {
  let damage = 0;
  
  // Increment status turns
  if (pokemon.status && pokemon.statusTurns !== undefined) {
    pokemon.statusTurns++;
  }
  
  switch (pokemon.status) {
    case 'poisoned':
      damage = Math.floor(pokemon.maxHp / 8);
      break;
    case 'burned':
      damage = Math.floor(pokemon.maxHp / 16);
      break;
    case 'asleep':
      // Sleep lasts 1-3 turns, then wake up
      if (pokemon.statusTurns && pokemon.statusTurns >= 3) {
        pokemon.status = undefined;
        pokemon.statusTurns = undefined;
        // Note: Wake up message will be handled in executeAction
      }
      break;
    case 'frozen':
      // 20% chance to thaw each turn
      if (Math.random() < 0.2) {
        pokemon.status = undefined;
        pokemon.statusTurns = undefined;
        // Note: Thaw message will be handled in executeAction
      }
      break;
    case 'paralyzed':
      // Paralysis is permanent until cured
      break;
    case 'confused':
      // Confusion lasts 2-5 turns
      if (pokemon.statusTurns && pokemon.statusTurns >= 5) {
        pokemon.status = undefined;
        pokemon.statusTurns = undefined;
      }
      break;
  }
  
  pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
  return damage;
}


// Execute a battle action
export function executeAction(state: BattleState, action: BattleAction): BattleState {
  const newState = { ...state, battleLog: [...state.battleLog] };
  const attackerTeam = newState.turn === 'player' ? newState.player : newState.opponent;
  const defenderTeam = newState.turn === 'player' ? newState.opponent : newState.player;
  const attacker = getCurrentPokemon(attackerTeam);
  const defender = getCurrentPokemon(defenderTeam);
  
  if (action.type === 'move' && action.moveIndex !== undefined) {
    const move = attacker.moves[action.moveIndex];
    const canUseResult = canUseMove(attacker, action.moveIndex);
    
    if (!move || !canUseResult.canUse) {
      const reason = canUseResult.reason || 'couldn\'t use the move';
      newState.battleLog.push({
        type: 'status_effect',
        message: `${attacker.pokemon.name} is ${reason}...`,
        pokemon: String(attacker.pokemon.name),
        move: move?.name ? String(move.name) : undefined
      });
    } else {
      // Check for flinch
      if (attacker.flinched) {
        newState.battleLog.push({
          type: 'status_effect',
          message: `${attacker.pokemon.name} flinched and couldn't move!`,
          pokemon: String(attacker.pokemon.name)
        });
        attacker.flinched = false;
      } else {
        // Check if this is a healing move
        if (isHealingMove(move)) {
          // Handle healing moves
          const healingAmount = calculateHealing(attacker, move);
          const oldHp = attacker.currentHp;
          attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healingAmount);
          const actualHealing = attacker.currentHp - oldHp;
          
          // Log move usage
          newState.battleLog.push({
            type: 'move_used',
            message: `${attacker.pokemon.name} used ${move.name}!`,
            pokemon: String(attacker.pokemon.name),
            move: String(move.name)
          });
          
          // Log healing
          if (actualHealing > 0) {
            const healingPercent = Math.round((actualHealing / attacker.maxHp) * 100);
            const remainingPercent = Math.round((attacker.currentHp / attacker.maxHp) * 100);
            newState.battleLog.push({
              type: 'healing',
              message: `${attacker.pokemon.name} restored ${healingPercent}% HP (${remainingPercent}% HP left).`,
              pokemon: String(attacker.pokemon.name),
              healing: healingPercent
            });
          } else {
            newState.battleLog.push({
              type: 'healing',
              message: `${attacker.pokemon.name} is already at full health!`,
              pokemon: String(attacker.pokemon.name)
            });
          }
          
          // Handle special healing move effects
          if (move.name === 'rest') {
            // Rest puts the user to sleep and heals to full
            attacker.status = 'asleep';
            attacker.statusTurns = 0;
            attacker.currentHp = attacker.maxHp;
            newState.battleLog.push({
              type: 'status_applied',
              message: `${attacker.pokemon.name} fell asleep due to Rest!`,
              pokemon: String(attacker.pokemon.name),
              status: 'asleep'
            });
          } else if (move.name === 'heal-bell' || move.name === 'aromatherapy') {
            // Heal Bell and Aromatherapy cure status conditions
            if (attacker.status) {
              const oldStatus = attacker.status;
              attacker.status = undefined;
              attacker.statusTurns = undefined;
              newState.battleLog.push({
                type: 'status_effect',
                message: `${attacker.pokemon.name} was cured of ${oldStatus}!`,
                pokemon: String(attacker.pokemon.name)
              });
            }
          }
        } else {
          // Use detailed damage calculation for damaging moves
          const damageResult = calculateDamageDetailed(attacker, defender, move);
          const damage = damageResult.damage;
          const oldHp = defender.currentHp;
          defender.currentHp = Math.max(0, defender.currentHp - damage);
          
          // Calculate damage percentage
          const damagePercent = calculateDamagePercentage(damage, defender.maxHp);
          const remainingPercent = Math.round((defender.currentHp / defender.maxHp) * 100);
          
          // Log move usage
          newState.battleLog.push({
            type: 'move_used',
            message: `${attacker.pokemon.name} used ${move.name}!`,
            pokemon: String(attacker.pokemon.name),
            move: String(move.name)
          });
          
          // Log damage with effectiveness
          const effectivenessText = getEffectivenessText(damageResult.effectiveness);
          let damageMessage = `${defender.pokemon.name} took ${damagePercent}% damage (${remainingPercent}% HP left).`;
          
          if (effectivenessText === 'super_effective') {
            damageMessage = `It's super effective! ${damageMessage}`;
          } else if (effectivenessText === 'not_very_effective') {
            damageMessage = `It's not very effective... ${damageMessage}`;
          } else if (effectivenessText === 'no_effect') {
            damageMessage = `It had no effect!`;
          }
          
          newState.battleLog.push({
            type: 'damage_dealt',
            message: damageMessage,
            pokemon: String(defender.pokemon.name),
            damage: damagePercent,
            effectiveness: effectivenessText
          });
          
          // Apply status effects
          if (damageResult.statusEffect && !defender.status) {
            // Check if target is immune to sleep
            if (damageResult.statusEffect === 'asleep' && isImmuneToSleep(defender)) {
              newState.battleLog.push({
                type: 'status_effect',
                message: `${defender.pokemon.name} is immune to sleep due to its ${getCurrentAbility(defender)} ability!`,
                pokemon: String(defender.pokemon.name)
              });
            } else {
              defender.status = damageResult.statusEffect as 'poisoned' | 'paralyzed' | 'asleep' | 'burned' | 'frozen';
              defender.statusTurns = 0;
              newState.battleLog.push({
                type: 'status_applied',
                message: `${defender.pokemon.name} was ${damageResult.statusEffect}!`,
                pokemon: String(defender.pokemon.name),
                status: String(damageResult.statusEffect)
              });
            }
          }
          
          // Apply ability changes (Worry Seed, etc.)
          const newAbility = canChangeAbility(move);
          if (newAbility) {
            const oldAbility = getCurrentAbility(defender);
            defender.currentAbility = newAbility;
            defender.abilityChanged = true;
            
            if (newAbility === 'insomnia') {
              // Worry Seed: Change to Insomnia and wake up if asleep
              if (defender.status === 'asleep') {
                defender.status = undefined;
                defender.statusTurns = undefined;
                newState.battleLog.push({
                  type: 'status_effect',
                  message: `${defender.pokemon.name} woke up due to Worry Seed!`,
                  pokemon: String(defender.pokemon.name)
                });
              }
              newState.battleLog.push({
                type: 'ability_changed',
                message: `${defender.pokemon.name}'s ability was changed to Insomnia by Worry Seed!`,
                pokemon: String(defender.pokemon.name)
              });
            } else if (newAbility === 'none') {
              // Gastro Acid: Suppress ability
              newState.battleLog.push({
                type: 'ability_changed',
                message: `${defender.pokemon.name}'s ability was suppressed!`,
                pokemon: String(defender.pokemon.name)
              });
            }
          }
          
          // Apply flinch
          if (damageResult.flinch) {
            defender.flinched = true;
          }
        }
      }
    }
  }
  
  // Check if battle is over
  const playerCurrentPokemon = getCurrentPokemon(newState.player);
  const opponentCurrentPokemon = getCurrentPokemon(newState.opponent);
  
  if (playerCurrentPokemon.currentHp <= 0) {
    newState.isComplete = true;
    newState.winner = 'opponent';
    newState.battleLog.push({
      type: 'pokemon_fainted',
      message: `${playerCurrentPokemon.pokemon.name} fainted!`,
      pokemon: String(playerCurrentPokemon.pokemon.name)
    });
  } else if (opponentCurrentPokemon.currentHp <= 0) {
    newState.isComplete = true;
    newState.winner = 'player';
    newState.battleLog.push({
      type: 'pokemon_fainted',
      message: `${opponentCurrentPokemon.pokemon.name} fainted!`,
      pokemon: String(opponentCurrentPokemon.pokemon.name)
    });
  } else {
    // Process end of turn status effects
    const playerStatusDamage = processEndOfTurnStatus(playerCurrentPokemon);
    const opponentStatusDamage = processEndOfTurnStatus(opponentCurrentPokemon);
    
    if (playerStatusDamage > 0) {
      const oldHp = playerCurrentPokemon.currentHp + playerStatusDamage;
      const damagePercent = calculateDamagePercentage(playerStatusDamage, playerCurrentPokemon.maxHp);
      const remainingPercent = Math.round((playerCurrentPokemon.currentHp / playerCurrentPokemon.maxHp) * 100);
      
      newState.battleLog.push({
        type: 'status_damage',
        message: `${playerCurrentPokemon.pokemon.name} was hurt by its ${playerCurrentPokemon.status}! (${remainingPercent}% HP left)`,
        pokemon: String(playerCurrentPokemon.pokemon.name),
        damage: damagePercent,
        status: String(playerCurrentPokemon.status)
      });
    }
    
    if (opponentStatusDamage > 0) {
      const oldHp = opponentCurrentPokemon.currentHp + opponentStatusDamage;
      const damagePercent = calculateDamagePercentage(opponentStatusDamage, opponentCurrentPokemon.maxHp);
      const remainingPercent = Math.round((opponentCurrentPokemon.currentHp / opponentCurrentPokemon.maxHp) * 100);
      
      newState.battleLog.push({
        type: 'status_damage',
        message: `${opponentCurrentPokemon.pokemon.name} was hurt by its ${opponentCurrentPokemon.status}! (${remainingPercent}% HP left)`,
        pokemon: String(opponentCurrentPokemon.pokemon.name),
        damage: damagePercent,
        status: String(opponentCurrentPokemon.status)
      });
    }
    
    // Switch turns
    newState.turn = newState.turn === 'player' ? 'opponent' : 'player';
    newState.turnNumber++;
    
    // Add turn indicator
    newState.battleLog.push({
      type: 'turn_start',
      message: `Turn ${newState.turnNumber}:`,
      turn: newState.turnNumber
    });
  }
  
  return newState;
}
