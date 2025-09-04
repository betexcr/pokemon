import { Pokemon, Move } from "@/types/pokemon";

export type BattlePokemon = {
  pokemon: Pokemon;
  level: number;
  currentHp: number;
  maxHp: number;
  moves: Move[];
  status?: 'paralyzed' | 'poisoned' | 'burned' | 'frozen' | 'asleep' | 'confused';
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

export type BattleState = {
  player: BattlePokemon;
  opponent: BattlePokemon;
  turn: 'player' | 'opponent';
  turnNumber: number;
  battleLog: string[];
  isComplete: boolean;
  winner?: 'player' | 'opponent';
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

// Calculate other stats based on level and base stats
export function calculateStat(baseStat: number, level: number): number {
  return Math.floor(((2 * baseStat + 31) * level) / 100) + 5;
}

// Apply stat modifiers
export function applyStatModifier(baseStat: number, modifier: number): number {
  const multiplier = modifier >= 0 ? (2 + modifier) / 2 : 2 / (2 - modifier);
  return Math.floor(baseStat * multiplier);
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
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move
): number {
  const level = attacker.level;
  const power = move.power || 0;
  
  // Determine if move is physical or special
  const isPhysical = ['normal', 'fighting', 'poison', 'ground', 'flying', 'bug', 'rock', 'ghost', 'steel', 'fairy'].includes(move.type);
  
  const attack = isPhysical 
    ? applyStatModifier(calculateStat(attacker.pokemon.stats.attack, level), attacker.statModifiers.attack)
    : applyStatModifier(calculateStat(attacker.pokemon.stats.specialAttack, level), attacker.statModifiers.specialAttack);
    
  const defense = isPhysical
    ? applyStatModifier(calculateStat(defender.pokemon.stats.defense, level), defender.statModifiers.defense)
    : applyStatModifier(calculateStat(defender.pokemon.stats.specialDefense, level), defender.statModifiers.specialDefense);

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.pokemon.types);
  
  // STAB (Same Type Attack Bonus)
  const stab = attacker.pokemon.types.includes(move.type) ? 1.5 : 1;
  
  // Random factor (85-100%)
  const randomFactor = 0.85 + Math.random() * 0.15;
  
  // Critical hit chance (6.25% base)
  const criticalHit = Math.random() < 0.0625 ? 2 : 1;
  
  // Damage calculation
  const damage = Math.floor(
    ((((2 * level / 5 + 2) * power * attack / defense) / 50 + 2) * 
     effectiveness * stab * randomFactor * criticalHit)
  );
  
  return Math.max(1, damage);
}

// Check if a Pokemon can use a move
export function canUseMove(pokemon: BattlePokemon, moveIndex: number): boolean {
  if (moveIndex < 0 || moveIndex >= pokemon.moves.length) return false;
  const move = pokemon.moves[moveIndex];
  if (!move) return false;
  
  // Check PP (simplified - assume infinite PP for now)
  // Check status conditions that prevent moves
  if (pokemon.status === 'asleep' || pokemon.status === 'frozen') {
    return Math.random() < 0.25; // 25% chance to wake up/break free
  }
  if (pokemon.status === 'paralyzed') {
    return Math.random() < 0.75; // 25% chance to be paralyzed
  }
  if (pokemon.status === 'confused') {
    return Math.random() < 0.5; // 50% chance to hit self
  }
  
  return true;
}

// Apply status effects
export function applyStatusEffect(pokemon: BattlePokemon, status: BattlePokemon['status']): void {
  pokemon.status = status;
}

// Process end of turn status effects
export function processEndOfTurnStatus(pokemon: BattlePokemon): number {
  let damage = 0;
  
  switch (pokemon.status) {
    case 'poisoned':
      damage = Math.floor(pokemon.maxHp / 8);
      break;
    case 'burned':
      damage = Math.floor(pokemon.maxHp / 16);
      break;
  }
  
  pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
  return damage;
}

// Initialize battle state
export function initializeBattle(
  playerPokemon: Pokemon,
  playerLevel: number,
  playerMoves: Move[],
  opponentPokemon: Pokemon,
  opponentLevel: number,
  opponentMoves: Move[]
): BattleState {
  const playerHp = calculateHp(playerPokemon.stats.hp, playerLevel);
  const opponentHp = calculateHp(opponentPokemon.stats.hp, opponentLevel);
  
  const player: BattlePokemon = {
    pokemon: playerPokemon,
    level: playerLevel,
    currentHp: playerHp,
    maxHp: playerHp,
    moves: playerMoves,
    statModifiers: {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    }
  };
  
  const opponent: BattlePokemon = {
    pokemon: opponentPokemon,
    level: opponentLevel,
    currentHp: opponentHp,
    maxHp: opponentHp,
    moves: opponentMoves,
    statModifiers: {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    }
  };
  
  // Determine turn order based on speed
  const playerSpeed = calculateStat(playerPokemon.stats.speed, playerLevel);
  const opponentSpeed = calculateStat(opponentPokemon.stats.speed, opponentLevel);
  const turn = playerSpeed >= opponentSpeed ? 'player' : 'opponent';
  
  return {
    player,
    opponent,
    turn,
    turnNumber: 1,
    battleLog: [`Battle started! ${playerPokemon.name} vs ${opponentPokemon.name}`],
    isComplete: false
  };
}

// Execute a battle action
export function executeAction(state: BattleState, action: BattleAction): BattleState {
  const newState = { ...state };
  const attacker = newState.turn === 'player' ? newState.player : newState.opponent;
  const defender = newState.turn === 'player' ? newState.opponent : newState.player;
  
  if (action.type === 'move' && action.moveIndex !== undefined) {
    const move = attacker.moves[action.moveIndex];
    if (!move || !canUseMove(attacker, action.moveIndex)) {
      newState.battleLog.push(`${attacker.pokemon.name} couldn't use ${move?.name || 'the move'}!`);
    } else {
      const damage = calculateDamage(attacker, defender, move);
      defender.currentHp = Math.max(0, defender.currentHp - damage);
      
      newState.battleLog.push(
        `${attacker.pokemon.name} used ${move.name}! ${defender.pokemon.name} took ${damage} damage!`
      );
      
      // Check for status effects (simplified)
      if (move.name.toLowerCase().includes('thunder') && Math.random() < 0.1) {
        applyStatusEffect(defender, 'paralyzed');
        newState.battleLog.push(`${defender.pokemon.name} was paralyzed!`);
      }
    }
  }
  
  // Check if battle is over
  if (newState.player.currentHp <= 0) {
    newState.isComplete = true;
    newState.winner = 'opponent';
    newState.battleLog.push(`${newState.player.pokemon.name} fainted! ${newState.opponent.pokemon.name} wins!`);
  } else if (newState.opponent.currentHp <= 0) {
    newState.isComplete = true;
    newState.winner = 'player';
    newState.battleLog.push(`${newState.opponent.pokemon.name} fainted! ${newState.player.pokemon.name} wins!`);
  } else {
    // Switch turns
    newState.turn = newState.turn === 'player' ? 'opponent' : 'player';
    newState.turnNumber++;
    
    // Process end of turn effects
    const playerStatusDamage = processEndOfTurnStatus(newState.player);
    const opponentStatusDamage = processEndOfTurnStatus(newState.opponent);
    
    if (playerStatusDamage > 0) {
      newState.battleLog.push(`${newState.player.pokemon.name} took ${playerStatusDamage} damage from ${newState.player.status}!`);
    }
    if (opponentStatusDamage > 0) {
      newState.battleLog.push(`${newState.opponent.pokemon.name} took ${opponentStatusDamage} damage from ${newState.opponent.status}!`);
    }
  }
  
  return newState;
}
