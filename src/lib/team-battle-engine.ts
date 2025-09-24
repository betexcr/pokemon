import { Pokemon, Move } from "@/types/pokemon";
import { CompiledMove } from "./adapters/pokeapiMoveAdapter";
import { DynamicPowerContext } from "@/types/move";
import { 
  calculateComprehensiveDamage, 
  TypeName, 
  calculateTypeEffectiveness 
} from "./damage-calculator";
import { getMove } from "./moveCache";
import { executeTurn } from "./executor";
import { 
  resolveSwitch, 
  resolveMove, 
  processEndOfTurn, 
  processReplacements 
} from "./team-battle-engine-additional";

export type BattlePokemon = {
  pokemon: Pokemon;
  level: number;
  nature?: import('@/data/natures').NatureName;
  currentHp: number;
  maxHp: number;
  moves: Array<{
    id: string;
    pp: number;
    maxPp: number;
    disabled?: boolean;
    lastUsed?: number; // turn number when last used
  }>;
  status?: 'paralyzed' | 'poisoned' | 'burned' | 'frozen' | 'asleep' | 'confused';
  statusTurns?: number;
  // Volatile conditions
  volatile: {
    confusion?: { turns: number };
    substitute?: { hp: number };
    leechSeed?: boolean;
    choiceLock?: string; // move id
    encore?: { move: string; turns: number };
    taunt?: { turns: number };
    disable?: { move: string; turns: number };
    protect?: { counter: number };
    perishSong?: { turns: number };
    flinched?: boolean;
    binding?: { kind: string; turnsLeft: number; fraction: number };
  };
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

export type BattleTeam = {
  pokemon: BattlePokemon[];
  currentIndex: number;
  faintedCount: number;
  // Side conditions
  sideConditions: {
    reflect?: { turns: number };
    lightScreen?: { turns: number };
    safeguard?: { turns: number };
    auroraVeil?: { turns: number };
    spikes?: number; // layers
    toxicSpikes?: number; // layers
    stealthRock?: boolean;
    stickyWeb?: boolean;
  };
};

export type BattleLogEntry = {
  type: 'turn_start' | 'move_used' | 'move_missed' | 'critical_hit' | 'multi_hit' | 'recoil' | 'drain' | 'damage_dealt' | 'status_applied' | 'status_damage' | 'status_effect' | 'pokemon_fainted' | 'pokemon_sent_out' | 'battle_start' | 'battle_end' | 'ability_changed' | 'healing';
  message: string;
  turn?: number;
  pokemon?: string;
  move?: string;
  damage?: number;
  effectiveness?: 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal';
  status?: string;
  healing?: number;
};

export type BattleState = {
  player: BattleTeam;
  opponent: BattleTeam;
  turn: number; // Current turn number
  rng: number; // RNG seed for reproducibility
  battleLog: BattleLogEntry[];
  isComplete: boolean;
  winner?: 'player' | 'opponent';
  phase: 'choice' | 'resolution' | 'end_of_turn' | 'replacement' | 'selection' | 'execution';
  // Action queue system
  actionQueue: Array<{
    type: 'move' | 'switch' | 'pursuit';
    user: 'player' | 'opponent';
    moveId?: string;
    target?: 'player' | 'opponent';
    switchIndex?: number;
    priority: number;
    speed: number;
  }>;
  // Field state (no weather/hazards for now)
  field: Record<string, never>;
  // Multiplayer battle properties
  selectedMoves?: {
    player?: { type: 'move'; moveIndex: number } | null;
    opponent?: { type: 'move'; moveIndex: number } | null;
  };
  executionQueue?: Array<{
    type: 'move' | 'switch';
    user: 'player' | 'opponent';
    moveId?: string;
    target?: 'player' | 'opponent';
    switchIndex?: number;
    priority: number;
    speed: number;
  }>;
  // Additional properties for team battles
  turnNumber?: number;
  needsPokemonSelection?: 'player' | 'opponent';
  currentTurn?: 'host' | 'guest';
};

export type BattleAction = {
  type: 'move' | 'switch';
  moveId?: string;
  target?: 'player' | 'opponent';
  switchIndex?: number;
};

// Helper functions
export function calculateHp(baseHp: number, level: number): number {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

// Calculate move priority (higher number = higher priority)
export function getMovePriority(moveId: string): number {
  // Priority mapping for common moves
  const priorityMoves: Record<string, number> = {
    'quick-guard': 4,
    'wide-guard': 4,
    'protect': 4,
    'detect': 4,
    'king-s-shield': 4,
    'spiky-shield': 4,
    'baneful-bunker': 4,
    'quick-attack': 1,
    'extreme-speed': 2,
    'fake-out': 3,
    'sucker-punch': 1,
    'bullet-punch': 1,
    'ice-shard': 1,
    'shadow-sneak': 1,
    'mach-punch': 1,
    'vacuum-wave': 1,
    'trick-room': -6,
    'wonder-room': -6,
    'magic-room': -6,
  };
  return priorityMoves[moveId] || 0;
}

// Calculate effective speed for move ordering
export function getEffectiveSpeed(pokemon: BattlePokemon): number {
  const baseSpeed = pokemon.pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50;
  let calculatedSpeed = calculateStat(baseSpeed, pokemon.level);
  // Apply nature: +10% to increased stat, -10% to decreased stat
  try {
    if (pokemon.nature) {
      const { getNature } = require('@/data/natures') as typeof import('@/data/natures');
      const n = getNature(pokemon.nature);
      if (n.increasedStat === 'speed') calculatedSpeed = Math.floor(calculatedSpeed * 1.1);
      if (n.decreasedStat === 'speed') calculatedSpeed = Math.floor(calculatedSpeed * 0.9);
    }
  } catch {}
  return applyStatModifier(calculatedSpeed, pokemon.statModifiers.speed);
}

// Check if a Pokemon can use a move (usability gates)
export function canUseMove(pokemon: BattlePokemon, moveId: string): { canUse: boolean; reason?: string } {
  const move = pokemon.moves.find(m => m.id === moveId);
  if (!move) return { canUse: false, reason: 'Invalid move' };
  
  // Check PP
  if (move.pp <= 0) return { canUse: false, reason: 'no PP left' };
  
  // Check if move is disabled
  if (move.disabled) return { canUse: false, reason: 'disabled' };
  
  // Check status conditions
  if (pokemon.status === 'asleep') {
    return { canUse: Math.random() < 0.25, reason: 'fast asleep' };
  }
  if (pokemon.status === 'frozen') {
    return { canUse: Math.random() < 0.2, reason: 'frozen solid' };
  }
  if (pokemon.status === 'paralyzed') {
    return { canUse: Math.random() < 0.75, reason: 'fully paralyzed' };
  }
  
  // Check volatile conditions
  if (pokemon.volatile.taunt && pokemon.volatile.taunt.turns > 0) {
    // Only allow damaging moves if taunted
    // For now, assume all moves are status moves if they have no power
    return { canUse: true }; // TODO: Check if move is status vs damaging
  }
  
  if (pokemon.volatile.encore && pokemon.volatile.encore.turns > 0) {
    // Must use the same move as last turn
    return { canUse: moveId === pokemon.volatile.encore.move, reason: 'encored' };
  }
  
  if (pokemon.volatile.disable && pokemon.volatile.disable.turns > 0) {
    return { canUse: moveId !== pokemon.volatile.disable.move, reason: 'disabled' };
  }
  
  return { canUse: true };
}

// Build and order action queue (Gen-8/9 style)
export function buildActionQueue(state: BattleState, playerAction: BattleAction, opponentAction: BattleAction): BattleState['actionQueue'] {
  const queue: BattleState['actionQueue'] = [];
  
  // Check for Pursuit interrupts
  if (playerAction.type === 'switch' && opponentAction.type === 'move' && opponentAction.moveId === 'pursuit') {
    queue.push({
      type: 'pursuit',
      user: 'opponent',
      moveId: 'pursuit',
      target: 'player',
      priority: getMovePriority('pursuit'),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent))
    });
  }
  
  if (opponentAction.type === 'switch' && playerAction.type === 'move' && playerAction.moveId === 'pursuit') {
    queue.push({
      type: 'pursuit',
      user: 'player',
      moveId: 'pursuit',
      target: 'opponent',
      priority: getMovePriority('pursuit'),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player))
    });
  }
  
  // Add regular actions
  if (playerAction.type === 'switch') {
    queue.push({
      type: 'switch',
      user: 'player',
      switchIndex: playerAction.switchIndex,
      priority: 6, // Switches have priority 6
      speed: 0
    });
  } else if (playerAction.type === 'move') {
    queue.push({
      type: 'move',
      user: 'player',
      moveId: playerAction.moveId,
      target: playerAction.target,
      priority: getMovePriority(playerAction.moveId || ''),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player))
    });
  }
  
  if (opponentAction.type === 'switch') {
    queue.push({
      type: 'switch',
      user: 'opponent',
      switchIndex: opponentAction.switchIndex,
      priority: 6, // Switches have priority 6
      speed: 0
    });
  } else if (opponentAction.type === 'move') {
    queue.push({
      type: 'move',
      user: 'opponent',
      moveId: opponentAction.moveId,
      target: opponentAction.target,
      priority: getMovePriority(opponentAction.moveId || ''),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent))
    });
  }
  
  // Order by class, then priority, then speed
  return queue.sort((a, b) => {
    // Class ordering: Pursuit > Switches > Moves
    const classOrder = { pursuit: 0, switch: 1, move: 2 };
    const aClass = classOrder[a.type];
    const bClass = classOrder[b.type];
    
    if (aClass !== bClass) {
      return aClass - bClass;
    }
    
    // Within same class, order by priority (higher first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // Within same priority, order by speed (higher first)
    return b.speed - a.speed;
  });
}

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

// Map PokeAPI stat names to our stat modifier keys
function mapStatName(stat: "atk"|"def"|"spa"|"spd"|"spe"|"acc"|"eva"): keyof BattlePokemon['statModifiers'] {
  const mapping: Record<"atk"|"def"|"spa"|"spd"|"spe"|"acc"|"eva", keyof BattlePokemon['statModifiers']> = {
    'atk': 'attack',
    'def': 'defense',
    'spa': 'specialAttack',
    'spd': 'specialDefense',
    'spe': 'speed',
    'acc': 'accuracy',
    'eva': 'evasion'
  };
  return mapping[stat];
}

// Apply effects for status moves (stat changes, etc.)
export async function applyStatusMoveEffects(
  attacker: BattlePokemon, 
  defender: BattlePokemon, 
  move: Move | CompiledMove, 
  battleState: { battleLog: BattleLogEntry[] }
): Promise<void> {
  // Handle both old Move type and new CompiledMove type
  let compiledMove: CompiledMove;
  if ('getPower' in move) {
    // Already a CompiledMove
    compiledMove = move;
  } else {
    // Old Move type - convert to CompiledMove
    compiledMove = await getMove(move.name);
  }
  
  const moveName = compiledMove.name;
  
  // Stat reduction moves
  const statReductionMoves: Record<string, { stat: keyof BattlePokemon['statModifiers'], stages: number, target: 'self' | 'opponent' }> = {
    'growl': { stat: 'attack', stages: -1, target: 'opponent' },
    'leer': { stat: 'defense', stages: -1, target: 'opponent' },
    'tail-whip': { stat: 'defense', stages: -1, target: 'opponent' },
    'scary-face': { stat: 'speed', stages: -2, target: 'opponent' },
    'string-shot': { stat: 'speed', stages: -1, target: 'opponent' },
    'smokescreen': { stat: 'accuracy', stages: -1, target: 'opponent' },
    'sand-attack': { stat: 'accuracy', stages: -1, target: 'opponent' },
    'kinesis': { stat: 'accuracy', stages: -1, target: 'opponent' },
    'flash': { stat: 'accuracy', stages: -1, target: 'opponent' },
    'charm': { stat: 'attack', stages: -2, target: 'opponent' },
    'feather-dance': { stat: 'attack', stages: -2, target: 'opponent' },
    'metal-sound': { stat: 'specialDefense', stages: -2, target: 'opponent' },
    'fake-tears': { stat: 'specialDefense', stages: -2, target: 'opponent' },
    'sweet-scent': { stat: 'evasion', stages: -1, target: 'opponent' },
    'cotton-spore': { stat: 'speed', stages: -2, target: 'opponent' }
  };

  // Stat boosting moves
  const statBoostingMoves: Record<string, { stat: keyof BattlePokemon['statModifiers'], stages: number, target: 'self' | 'opponent' }> = {
    'swords-dance': { stat: 'attack', stages: 2, target: 'self' },
    'dragon-dance': { stat: 'attack', stages: 1, target: 'self' },
    'bulk-up': { stat: 'attack', stages: 1, target: 'self' },
    'calm-mind': { stat: 'specialAttack', stages: 1, target: 'self' },
    'nasty-plot': { stat: 'specialAttack', stages: 2, target: 'self' },
    'work-up': { stat: 'attack', stages: 1, target: 'self' },
    'hone-claws': { stat: 'attack', stages: 1, target: 'self' },
    'defense-curl': { stat: 'defense', stages: 1, target: 'self' },
    'iron-defense': { stat: 'defense', stages: 2, target: 'self' },
    'acid-armor': { stat: 'defense', stages: 2, target: 'self' },
    'barrier': { stat: 'defense', stages: 2, target: 'self' },
    'amnesia': { stat: 'specialDefense', stages: 2, target: 'self' },
    'agility': { stat: 'speed', stages: 2, target: 'self' },
    'rock-polish': { stat: 'speed', stages: 2, target: 'self' },
    'autotomize': { stat: 'speed', stages: 2, target: 'self' },
    'shift-gear': { stat: 'speed', stages: 2, target: 'self' },
    'quiver-dance': { stat: 'specialAttack', stages: 1, target: 'self' },
    'coil': { stat: 'attack', stages: 1, target: 'self' },
    'shell-smash': { stat: 'attack', stages: 2, target: 'self' },
    'belly-drum': { stat: 'attack', stages: 6, target: 'self' },
    'growth': { stat: 'specialAttack', stages: 1, target: 'self' },
    'howl': { stat: 'attack', stages: 1, target: 'self' },
    'meditate': { stat: 'attack', stages: 1, target: 'self' },
    'sharpen': { stat: 'attack', stages: 1, target: 'self' },
    'harden': { stat: 'defense', stages: 1, target: 'self' },
    'withdraw': { stat: 'defense', stages: 1, target: 'self' },
    'minimize': { stat: 'evasion', stages: 2, target: 'self' },
    'double-team': { stat: 'evasion', stages: 1, target: 'self' },
    'focus-energy': { stat: 'accuracy', stages: 1, target: 'self' },
    'laser-focus': { stat: 'accuracy', stages: 2, target: 'self' }
  };

  // Check for stat changes from PokeAPI data first
  if (compiledMove.statChanges && compiledMove.statChanges.length > 0) {
    for (const statChange of compiledMove.statChanges) {
      // Check if the effect triggers
      if (Math.random() < (statChange.chance / 100)) {
        const target = statChange.stages > 0 ? attacker : defender; // Positive stages usually affect self, negative affect opponent
        const statName = mapStatName(statChange.stat);
        const oldValue = target.statModifiers[statName];
        
        // Apply stat change (clamp between -6 and +6)
        target.statModifiers[statName] = Math.max(-6, Math.min(6, oldValue + statChange.stages));
        
        const newValue = target.statModifiers[statName];
        const change = newValue - oldValue;
        
        if (change !== 0) {
          const statDisplayName = {
            attack: 'Attack',
            defense: 'Defense', 
            specialAttack: 'Special Attack',
            specialDefense: 'Special Defense',
            speed: 'Speed',
            accuracy: 'Accuracy',
            evasion: 'Evasion'
          }[statName];
          
          const direction = change > 0 ? 'rose' : 'fell';
          const targetName = target.pokemon.name;
          
          battleState.battleLog.push({
            type: 'status_effect',
            message: `${targetName}'s ${statDisplayName} ${direction}!`,
            pokemon: String(targetName)
          });
        }
      }
    }
  } else {
    // Fallback to hardcoded stat changes for moves not in PokeAPI
    const statChange = statReductionMoves[moveName] || statBoostingMoves[moveName];
    
    if (statChange) {
      const target = statChange.target === 'self' ? attacker : defender;
      const statName = statChange.stat;
      const oldValue = target.statModifiers[statName];
      
      // Apply stat change (clamp between -6 and +6)
      target.statModifiers[statName] = Math.max(-6, Math.min(6, oldValue + statChange.stages));
      
      const newValue = target.statModifiers[statName];
      const change = newValue - oldValue;
      
      if (change !== 0) {
        const statDisplayName = {
          attack: 'Attack',
          defense: 'Defense', 
          specialAttack: 'Special Attack',
          specialDefense: 'Special Defense',
          speed: 'Speed',
          accuracy: 'Accuracy',
          evasion: 'Evasion'
        }[statName];
        
        const direction = change > 0 ? 'rose' : 'fell';
        const targetName = statChange.target === 'self' ? attacker.pokemon.name : defender.pokemon.name;
        
        battleState.battleLog.push({
          type: 'status_effect',
          message: `${targetName}'s ${statDisplayName} ${direction}!`,
          pokemon: String(targetName)
        });
      }
    }
  }
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

// Type effectiveness calculation (now using comprehensive damage calculator)
export function getTypeEffectiveness(attackType: string, defenseTypes: string[]): number {
  return calculateTypeEffectiveness(
    attackType as TypeName, 
    defenseTypes.map(type => type as TypeName)
  );
}

// Legacy function for backward compatibility
export function canUseMoveLegacy(pokemon: BattlePokemon, moveIndex: number): { canUse: boolean; reason?: string } {
  if (moveIndex < 0 || moveIndex >= pokemon.moves.length) return { canUse: false, reason: 'Invalid move' };
  const move = pokemon.moves[moveIndex];
  if (!move) return { canUse: false, reason: 'No move' };
  
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

// Process end of turn status effects
export function processEndOfTurnStatus(pokemon: BattlePokemon): number {
  let damage = 0;
  
  // Increment status turns
  if (pokemon.status && pokemon.statusTurns !== undefined) {
    pokemon.statusTurns++;
  }
  
  switch (pokemon.status) {
    case 'poisoned':
      damage = Math.floor(pokemon.maxHp / 8); // 1/8 of max HP
      break;
    case 'burned':
      damage = Math.floor(pokemon.maxHp / 16); // 1/16 of max HP
      break;
    case 'asleep':
      // Sleep lasts 1-3 turns, then wake up
      if (pokemon.statusTurns && pokemon.statusTurns >= 3) {
        pokemon.status = undefined;
        pokemon.statusTurns = undefined;
      }
      break;
    case 'frozen':
      // 20% chance to thaw each turn
      if (Math.random() < 0.2) {
        pokemon.status = undefined;
        pokemon.statusTurns = undefined;
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

// Calculate damage using comprehensive modern formula with PokeAPI moves
export async function calculateDamageDetailed(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move | CompiledMove
): Promise<{ damage: number; effectiveness: number; critical: boolean; statusEffect?: string; flinch?: boolean }> {
  const level = attacker.level;
  
  // Handle both old Move type and new CompiledMove type
  let compiledMove: CompiledMove;
  if ('getPower' in move) {
    // Already a CompiledMove
    compiledMove = move;
  } else {
    // Old Move type - convert to CompiledMove
    compiledMove = await getMove(move.name);
  }
  
  // Calculate dynamic power if needed
  const powerContext: DynamicPowerContext = {
    attacker: {
      level: attacker.level,
      weightKg: attacker.pokemon.weight / 10, // Convert from hectograms to kg
      speed: attacker.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat,
      curHP: attacker.currentHp,
      maxHP: attacker.maxHp
    },
    defender: {
      weightKg: defender.pokemon.weight / 10,
      speed: defender.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat,
      curHP: defender.currentHp,
      maxHP: defender.maxHp,
      types: defender.pokemon.types.map(t => 
        (typeof t === 'string' ? t : t.type?.name || 'normal') as TypeName
      )
    }
  };
  
  const power = compiledMove.getPower ? compiledMove.getPower(powerContext) : (compiledMove.power || 0);
  
  // Determine if move is physical or special
  const moveType = compiledMove.type;
  const isPhysical = compiledMove.category === 'Physical';
  
  // Get base stats
  const attackerAttackStat = attacker.pokemon.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 50;
  const attackerSpecialAttackStat = attacker.pokemon.stats.find(stat => stat.stat.name === 'special-attack')?.base_stat || 50;
  const defenderDefenseStat = defender.pokemon.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 50;
  const defenderSpecialDefenseStat = defender.pokemon.stats.find(stat => stat.stat.name === 'special-defense')?.base_stat || 50;
  
  // Calculate actual stats at level
  const attackStat = isPhysical 
    ? calculateStat(attackerAttackStat, level)
    : calculateStat(attackerSpecialAttackStat, level);
    
  const defenseStat = isPhysical
    ? calculateStat(defenderDefenseStat, level)
    : calculateStat(defenderSpecialDefenseStat, level);

  // Apply nature to attacking and defending stats
  let attackWithNature = attackStat;
  let defenseWithNature = defenseStat;
  try {
    const natureModule = require('@/data/natures') as typeof import('@/data/natures');
    const attackerNature = (attacker as BattlePokemon).nature ? natureModule.getNature((attacker as BattlePokemon).nature!) : null;
    const defenderNature = (defender as BattlePokemon).nature ? natureModule.getNature((defender as BattlePokemon).nature!) : null;
    if (attackerNature) {
      const inc = attackerNature.increasedStat;
      const dec = attackerNature.decreasedStat;
      if (isPhysical) {
        if (inc === 'attack') attackWithNature = Math.floor(attackWithNature * 1.1);
        if (dec === 'attack') attackWithNature = Math.floor(attackWithNature * 0.9);
      } else {
        if (inc === 'special-attack') attackWithNature = Math.floor(attackWithNature * 1.1);
        if (dec === 'special-attack') attackWithNature = Math.floor(attackWithNature * 0.9);
      }
    }
    if (defenderNature) {
      const inc = defenderNature.increasedStat;
      const dec = defenderNature.decreasedStat;
      if (isPhysical) {
        if (inc === 'defense') defenseWithNature = Math.floor(defenseWithNature * 1.1);
        if (dec === 'defense') defenseWithNature = Math.floor(defenseWithNature * 0.9);
      } else {
        if (inc === 'special-defense') defenseWithNature = Math.floor(defenseWithNature * 1.1);
        if (dec === 'special-defense') defenseWithNature = Math.floor(defenseWithNature * 0.9);
      }
    }
  } catch {}

  // Get types
  const attackerTypes = attacker.pokemon.types.map(type => 
    (typeof type === 'string' ? type : type.type?.name || 'normal') as TypeName
  );
  const defenderTypes = defender.pokemon.types.map(type => 
    (typeof type === 'string' ? type : type.type?.name || 'normal') as TypeName
  );

  // Check for abilities
  const currentAbility = getCurrentAbility(attacker);
  const hasAdaptability = currentAbility === 'adaptability';
  const hasGuts = currentAbility === 'guts';
  const hasHugePower = currentAbility === 'huge-power';
  const hasPurePower = currentAbility === 'pure-power';
  const hasTintedLens = currentAbility === 'tinted-lens';
  const hasFilter = currentAbility === 'filter';
  const hasSolidRock = currentAbility === 'solid-rock';
  const hasMultiscale = currentAbility === 'multiscale';
  const hasSniper = currentAbility === 'sniper';
  const hasSuperLuck = currentAbility === 'super-luck';

  // Check if defender has abilities
  const defenderAbility = getCurrentAbility(defender);
  const defenderHasFilter = defenderAbility === 'filter';
  const defenderHasSolidRock = defenderAbility === 'solid-rock';
  const defenderHasMultiscale = defenderAbility === 'multiscale';

  // Check for high crit moves using the new crit rate stage
  const isHighCritMove = compiledMove.critRateStage > 0;

  // Use comprehensive damage calculation
  const result = calculateComprehensiveDamage({
    level,
    movePower: power,
    moveType,
    attackerTypes,
    defenderTypes,
    attackStat: attackWithNature,
    defenseStat: defenseWithNature,
    attackStatStages: attacker.statModifiers.attack,
    defenseStatStages: defender.statModifiers.defense,
    isPhysical,
    weather: 'None', // TODO: Add weather system
    isBurned: attacker.status === 'burned',
    hasGuts,
    hasAdaptability,
    hasLifeOrb: false, // TODO: Add item system
    hasExpertBelt: false, // TODO: Add item system
    hasReflect: false, // TODO: Add screen system
    hasLightScreen: false, // TODO: Add screen system
    isMultiTarget: false, // TODO: Add multi-target detection
    terrain: 'None', // TODO: Add terrain system
    hasTintedLens,
    hasFilter: defenderHasFilter,
    hasSolidRock: defenderHasSolidRock,
    hasMultiscale: defenderHasMultiscale,
    isFullHp: defender.currentHp === defender.maxHp,
    hasHugePower,
    hasPurePower,
    hasSniper,
    isHighCritMove,
    hasSuperLuck
  });
  
  // Check for status effects and flinch using new move system
  const statusEffect = compiledMove.ailment ? compiledMove.ailment.kind : undefined;
  const flinch = compiledMove.ailment?.kind === 'flinch' && Math.random() < (compiledMove.ailment.chance / 100);
  
  return {
    damage: result.damage,
    effectiveness: result.effectiveness,
    critical: result.critical,
    statusEffect: statusEffect || undefined,
    flinch: flinch || undefined
  };
}

export function getCurrentPokemon(team: BattleTeam): BattlePokemon {
  return team.pokemon[team.currentIndex];
}

export function isTeamDefeated(team: BattleTeam): boolean {
  return team.faintedCount >= team.pokemon.length;
}

export function getNextAvailablePokemon(team: BattleTeam): number | null {
  console.log('=== GET NEXT AVAILABLE POKEMON DEBUG ===');
  console.log('Team state:', {
    currentIndex: team.currentIndex,
    faintedCount: team.faintedCount,
    teamSize: team.pokemon.length,
    pokemon: team.pokemon.map((p, i) => ({
      index: i,
      name: p.pokemon.name,
      hp: p.currentHp,
      maxHp: p.maxHp,
      isCurrent: i === team.currentIndex,
      isFainted: p.currentHp <= 0
    }))
  });
  
  // Find the next available Pokemon (skip the current one if it's fainted)
  for (let i = 0; i < team.pokemon.length; i++) {
    const pokemon = team.pokemon[i];
    console.log(`Checking Pokemon ${i} (${pokemon.pokemon.name}): HP=${pokemon.currentHp}, Available=${pokemon.currentHp > 0}`);
    
    // Skip the current Pokemon if it's fainted, look for the next one
    if (i === team.currentIndex && pokemon.currentHp <= 0) {
      console.log(`Skipping current Pokemon ${i} (${pokemon.pokemon.name}) - it's fainted`);
      continue;
    }
    
    if (pokemon.currentHp > 0) {
      console.log(`Found available Pokemon at index ${i}: ${pokemon.pokemon.name}`);
      return i;
    }
  }
  
  console.log('No available Pokemon found');
  return null;
}

export function switchToPokemon(team: BattleTeam, index: number): void {
  console.log('=== SWITCH TO POKEMON DEBUG ===');
  console.log('Attempting to switch to index:', index);
  console.log('Team size:', team.pokemon.length);
  console.log('Target Pokemon:', team.pokemon[index] ? {
    name: team.pokemon[index].pokemon.name,
    hp: team.pokemon[index].currentHp,
    maxHp: team.pokemon[index].maxHp
  } : 'No Pokemon at this index');
  
  if (index >= 0 && index < team.pokemon.length && team.pokemon[index].currentHp > 0) {
    console.log('Switching successful - old index:', team.currentIndex, 'new index:', index);
    team.currentIndex = index;
  } else {
    console.log('Switching failed - conditions not met:', {
      indexValid: index >= 0 && index < team.pokemon.length,
      pokemonExists: !!team.pokemon[index],
      pokemonAlive: team.pokemon[index]?.currentHp > 0
    });
  }
}

// Function to handle automatic switching when a Pokémon faints
export function handleAutomaticSwitching(state: BattleState): BattleState {
  console.log('=== HANDLE AUTOMATIC SWITCHING DEBUG ===');
  const newState = { ...state };
  const newLog = [...state.battleLog];
  
  // Check if player's current Pokémon is fainted and switch if needed
  let pokemonSwitched = false;
  const playerCurrent = getCurrentPokemon(state.player);
  console.log('Player current Pokemon:', {
    name: playerCurrent.pokemon.name,
    hp: playerCurrent.currentHp,
    isFainted: playerCurrent.currentHp <= 0
  });
  
  if (playerCurrent.currentHp <= 0) {
    console.log('Player Pokemon fainted, looking for next available...');
    const nextIndex = getNextAvailablePokemon(state.player);
    console.log('Next available player Pokemon index:', nextIndex);
    
    if (nextIndex !== null && nextIndex !== state.player.currentIndex) {
      console.log('Switching player to Pokemon at index:', nextIndex);
      switchToPokemon(newState.player, nextIndex);
      const newCurrent = getCurrentPokemon(newState.player);
      console.log('Player switched to:', newCurrent.pokemon.name);
      newLog.push({
        type: 'pokemon_sent_out',
        message: `Go! ${newCurrent.pokemon.name}!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    } else if (nextIndex === state.player.currentIndex) {
      console.log('ERROR: Trying to switch to the same fainted Pokemon! Skipping switch.');
    } else {
      console.log('No available player Pokemon found - team defeated');
      // Mark battle as complete with opponent victory
      newState.isComplete = true;
      newState.winner = 'opponent';
      newLog.push({
        type: 'battle_end',
        message: 'All your Pokemon have fainted! You lose!',
        pokemon: 'defeat'
      });
      console.log('=== BATTLE COMPLETE - OPPONENT VICTORY ===');
    }
  }
  
  // Check if opponent's current Pokémon is fainted and switch if needed
  const opponentCurrent = getCurrentPokemon(state.opponent);
  console.log('Opponent current Pokemon:', {
    name: opponentCurrent.pokemon.name,
    hp: opponentCurrent.currentHp,
    isFainted: opponentCurrent.currentHp <= 0
  });
  
  if (opponentCurrent.currentHp <= 0) {
    console.log('Opponent Pokemon fainted, looking for next available...');
    const nextIndex = getNextAvailablePokemon(state.opponent);
    console.log('Next available opponent Pokemon index:', nextIndex);
    
    if (nextIndex !== null && nextIndex !== state.opponent.currentIndex) {
      console.log('Switching opponent to Pokemon at index:', nextIndex);
      switchToPokemon(newState.opponent, nextIndex);
      const newCurrent = getCurrentPokemon(newState.opponent);
      console.log('Opponent switched to:', newCurrent.pokemon.name);
      newLog.push({
        type: 'pokemon_sent_out',
        message: `${newCurrent.pokemon.name} was sent out!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    } else if (nextIndex === state.opponent.currentIndex) {
      console.log('ERROR: Trying to switch to the same fainted Pokemon! Skipping switch.');
    } else {
      console.log('No available opponent Pokemon found - team defeated');
      // Mark battle as complete with player victory
      newState.isComplete = true;
      newState.winner = 'player';
      newLog.push({
        type: 'battle_end',
        message: 'All opponent Pokemon have fainted! You win!',
        pokemon: 'victory'
      });
      console.log('=== BATTLE COMPLETE - PLAYER VICTORY ===');
    }
  }
  
  // If a Pokémon was switched, recalculate turn order based on new Pokémon's Speed
  if (pokemonSwitched) {
    console.log('=== RECALCULATING TURN ORDER ===');
    const newPlayerCurrent = getCurrentPokemon(newState.player);
    const newOpponentCurrent = getCurrentPokemon(newState.opponent);
    
    const playerSpeedStat = newPlayerCurrent.pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50;
    const opponentSpeedStat = newOpponentCurrent.pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50;
  let playerSpeed = calculateStat(playerSpeedStat, newPlayerCurrent.level);
  let opponentSpeed = calculateStat(opponentSpeedStat, newOpponentCurrent.level);
  try {
    const { getNature } = require('@/data/natures') as typeof import('@/data/natures');
    if (newPlayerCurrent.nature) {
      const n = getNature(newPlayerCurrent.nature);
      if (n.increasedStat === 'speed') playerSpeed = Math.floor(playerSpeed * 1.1);
      if (n.decreasedStat === 'speed') playerSpeed = Math.floor(playerSpeed * 0.9);
    }
    if (newOpponentCurrent.nature) {
      const n = getNature(newOpponentCurrent.nature);
      if (n.increasedStat === 'speed') opponentSpeed = Math.floor(opponentSpeed * 1.1);
      if (n.decreasedStat === 'speed') opponentSpeed = Math.floor(opponentSpeed * 0.9);
    }
  } catch {}
    
    console.log('Speed comparison:', {
      playerName: newPlayerCurrent.pokemon.name,
      playerSpeedStat,
      playerSpeed,
      opponentName: newOpponentCurrent.pokemon.name,
      opponentSpeedStat,
      opponentSpeed,
      oldTurn: state.turn
    });
    
    // Determine new turn order based on Speed (with tie-breaking)
    // Note: In the new system, turn order is determined by the action queue
    // This is just for logging purposes
    if (playerSpeed > opponentSpeed) {
      console.log('Player goes first (faster)');
    } else if (opponentSpeed > playerSpeed) {
      console.log('Opponent goes first (faster)');
    } else {
      // Speed tie - randomize (50/50 chance)
      console.log('Speed tie - random turn');
    }
    
    console.log('New turn order:', newState.turn);
  }
  
  newState.battleLog = newLog;
  return newState;
}

// Handle Pokemon switching for multiplayer battles (manual selection)
export function handleMultiplayerSwitching(state: BattleState, isPlayerTurn: boolean): BattleState {
  console.log('=== HANDLE MULTIPLAYER SWITCHING DEBUG ===');
  const newState = { ...state };
  const newLog = [...state.battleLog];
  
  // Check if current player's Pokemon is fainted
  const currentPokemon = isPlayerTurn ? getCurrentPokemon(state.player) : getCurrentPokemon(state.opponent);
  const team = isPlayerTurn ? state.player : state.opponent;
  
  console.log(`${isPlayerTurn ? 'Player' : 'Opponent'} current Pokemon:`, {
    name: currentPokemon.pokemon.name,
    hp: currentPokemon.currentHp,
    isFainted: currentPokemon.currentHp <= 0
  });
  
  if (currentPokemon.currentHp <= 0) {
    console.log(`${isPlayerTurn ? 'Player' : 'Opponent'} Pokemon fainted - waiting for manual selection`);
    
    // Check if there are any available Pokemon
    const availablePokemon = team.pokemon.filter((p, index) => 
      p.currentHp > 0 && index !== team.currentIndex
    );
    
    if (availablePokemon.length === 0) {
      console.log(`No available ${isPlayerTurn ? 'player' : 'opponent'} Pokemon found - team defeated`);
      // Mark battle as complete
      newState.isComplete = true;
      newState.winner = isPlayerTurn ? 'opponent' : 'player';
      newLog.push({
        type: 'battle_end',
        message: isPlayerTurn ? 'All your Pokemon have fainted! You lose!' : 'All opponent Pokemon have fainted! You win!',
        pokemon: isPlayerTurn ? 'defeat' : 'victory'
      });
      console.log(`=== BATTLE COMPLETE - ${isPlayerTurn ? 'OPPONENT' : 'PLAYER'} VICTORY ===`);
    } else {
      // Set a flag to indicate that manual Pokemon selection is needed
      newState.phase = 'replacement';
      newLog.push({
        type: 'pokemon_fainted',
        message: `${currentPokemon.pokemon.name} fainted! Choose your next Pokemon.`,
        pokemon: currentPokemon.pokemon.name
      });
      console.log(`=== WAITING FOR ${isPlayerTurn ? 'PLAYER' : 'OPPONENT'} TO SELECT POKEMON ===`);
    }
  }
  
  newState.battleLog = newLog;
  return newState;
}

// Manually switch to a selected Pokemon (for multiplayer battles)
export function switchToSelectedPokemon(state: BattleState, pokemonIndex: number, isPlayer: boolean): BattleState {
  console.log('=== SWITCH TO SELECTED POKEMON DEBUG ===');
  const newState = { ...state };
  const newLog = [...state.battleLog];
  
  const team = isPlayer ? newState.player : newState.opponent;
  const teamName = isPlayer ? 'player' : 'opponent';
  
  console.log(`Switching ${teamName} to Pokemon at index:`, pokemonIndex);
  
  // Validate the selection
  if (pokemonIndex < 0 || pokemonIndex >= team.pokemon.length) {
    console.error('Invalid Pokemon index:', pokemonIndex);
    return state;
  }
  
  const selectedPokemon = team.pokemon[pokemonIndex];
  
  if (selectedPokemon.currentHp <= 0) {
    console.error('Cannot switch to fainted Pokemon:', selectedPokemon.pokemon.name);
    return state;
  }
  
  if (pokemonIndex === team.currentIndex) {
    console.error('Cannot switch to current Pokemon');
    return state;
  }
  
  // Perform the switch
  switchToPokemon(team, pokemonIndex);
  const newCurrent = getCurrentPokemon(team);
  
  console.log(`${teamName} switched to:`, newCurrent.pokemon.name);
  
  newLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${newCurrent.pokemon.name}!`,
    pokemon: newCurrent.pokemon.name
  });
  
  // Clear the replacement phase
  newState.phase = 'choice';
  
  // Recalculate turn order based on Speed
  const playerCurrent = getCurrentPokemon(newState.player);
  const opponentCurrent = getCurrentPokemon(newState.opponent);
  
  let playerSpeed = calculateStat(playerCurrent.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0, playerCurrent.level);
  let opponentSpeed = calculateStat(opponentCurrent.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0, opponentCurrent.level);
  try {
    const { getNature } = require('@/data/natures') as typeof import('@/data/natures');
    if (playerCurrent.nature) {
      const n = getNature(playerCurrent.nature);
      if (n.increasedStat === 'speed') playerSpeed = Math.floor(playerSpeed * 1.1);
      if (n.decreasedStat === 'speed') playerSpeed = Math.floor(playerSpeed * 0.9);
    }
    if (opponentCurrent.nature) {
      const n = getNature(opponentCurrent.nature);
      if (n.increasedStat === 'speed') opponentSpeed = Math.floor(opponentSpeed * 1.1);
      if (n.decreasedStat === 'speed') opponentSpeed = Math.floor(opponentSpeed * 0.9);
    }
  } catch {}
  
  const playerSpeedMod = applyStatModifier(playerSpeed, playerCurrent.statModifiers.speed);
  const opponentSpeedMod = applyStatModifier(opponentSpeed, opponentCurrent.statModifiers.speed);
  
  console.log('Speed comparison:', {
    playerName: playerCurrent.pokemon.name,
    playerSpeed,
    opponentName: opponentCurrent.pokemon.name,
    opponentSpeed
  });
  
  // Determine new turn order based on Speed
  // Note: In the new system, turn order is determined by the action queue
  if (playerSpeedMod > opponentSpeedMod) {
    console.log('Player goes first (faster)');
  } else if (opponentSpeedMod > playerSpeedMod) {
    console.log('Opponent goes first (faster)');
  } else {
    // Speed tie - randomize (50/50 chance)
    console.log('Speed tie - random turn');
  }
  
  newState.battleLog = newLog;
  return newState;
}

// Initialize team battle
export function initializeTeamBattle(
  playerTeam: { pokemon: Pokemon; level: number; moves: Move[] }[],
  opponentTeam: { pokemon: Pokemon; level: number; moves: Move[] }[],
  playerTeamName: string = "Player",
  opponentTeamName: string = "Opponent"
): BattleState {
  // Convert team data to BattlePokemon arrays
  const playerBattlePokemon: BattlePokemon[] = playerTeam.map(teamMember => {
    const hpStat = teamMember.pokemon.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 50;
    const hp = calculateHp(hpStat, teamMember.level);
    const originalAbility = teamMember.pokemon.abilities.find(a => !a.is_hidden)?.ability.name || 'none';
    
    return {
      pokemon: teamMember.pokemon,
      level: teamMember.level,
      currentHp: hp,
      maxHp: hp,
      moves: teamMember.moves.map(move => ({
        id: move.name,
        pp: 5, // Default PP
        maxPp: 5,
        disabled: false
      })),
      originalAbility,
      currentAbility: originalAbility,
      abilityChanged: false,
      volatile: {},
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
  });

  const opponentBattlePokemon: BattlePokemon[] = opponentTeam.map(teamMember => {
    const hpStat = teamMember.pokemon.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 50;
    const hp = calculateHp(hpStat, teamMember.level);
    const originalAbility = teamMember.pokemon.abilities.find(a => !a.is_hidden)?.ability.name || 'none';
    
    return {
      pokemon: teamMember.pokemon,
      level: teamMember.level,
      currentHp: hp,
      maxHp: hp,
      moves: teamMember.moves.map(move => ({
        id: move.name,
        pp: 5, // Default PP
        maxPp: 5,
        disabled: false
      })),
      originalAbility,
      currentAbility: originalAbility,
      abilityChanged: false,
      volatile: {},
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
  });

  // Create teams
  const player: BattleTeam = {
    pokemon: playerBattlePokemon,
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: {}
  };

  const opponent: BattleTeam = {
    pokemon: opponentBattlePokemon,
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: {}
  };

  // Determine turn order based on speed of first Pokémon
  const playerSpeedStat = playerBattlePokemon[0].pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50;
  const opponentSpeedStat = opponentBattlePokemon[0].pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50;
  const playerSpeed = calculateStat(playerSpeedStat, playerBattlePokemon[0].level);
  const opponentSpeed = calculateStat(opponentSpeedStat, opponentBattlePokemon[0].level);
  
  console.log('=== TURN ORDER DETERMINATION ===');
  console.log('Player Pokemon:', playerBattlePokemon[0].pokemon.name, 'Speed stat:', playerSpeedStat, 'Calculated speed:', playerSpeed);
  console.log('Opponent Pokemon:', opponentBattlePokemon[0].pokemon.name, 'Speed stat:', opponentSpeedStat, 'Calculated speed:', opponentSpeed);
  
  // Faster Pokemon goes first
  const turn = playerSpeed > opponentSpeed ? 'player' : 'opponent';
  
  console.log('Turn order determined:', turn, '(faster Pokemon goes first)');
  
  const playerCurrent = getCurrentPokemon(player);
  const opponentCurrent = getCurrentPokemon(opponent);
  
  return {
    player,
    opponent,
    turn: 1,
    rng: Math.floor(Math.random() * 1000000),
    battleLog: [{
      type: 'battle_start',
      message: `Battle Start!\n${playerTeamName} sends out ${playerCurrent.pokemon.name}!\n${opponentTeamName} sends out ${opponentCurrent.pokemon.name}!`,
      pokemon: String(playerCurrent.pokemon.name)
    }],
    isComplete: false,
    phase: 'choice',
    actionQueue: [],
    field: {}
  };
}

// Legacy function - use processBattleTurn instead
export function selectMoveLegacy(state: BattleState, action: BattleAction, isPlayer: boolean): BattleState {
  console.warn('selectMoveLegacy is deprecated, use processBattleTurn instead');
  return state;
}

// Legacy function - use processBattleTurn instead
export async function executeNextActionLegacy(state: BattleState): Promise<BattleState> {
  console.warn('executeNextActionLegacy is deprecated, use processBattleTurn instead');
  return state;
}

// Execute a single move action (extracted from the original logic)
async function executeMoveAction(
  state: BattleState, 
  attacker: BattlePokemon, 
  defender: BattlePokemon, 
  move: Move, 
  isPlayer: boolean
): Promise<void> {
  // Check if this is a healing move
  if (isHealingMove(move)) {
    // Handle healing moves
    const healingAmount = calculateHealing(attacker, move);
    const oldHp = attacker.currentHp;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healingAmount);
    const actualHealing = attacker.currentHp - oldHp;
    
    // Log move usage
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${move.name}!`,
      pokemon: String(attacker.pokemon.name),
      move: String(move.name)
    });
    
    // Log healing
    if (actualHealing > 0) {
      const healingPercent = Math.round((actualHealing / attacker.maxHp) * 100);
      const remainingPercent = Math.round((attacker.currentHp / attacker.maxHp) * 100);
      state.battleLog.push({
        type: 'healing',
        message: `${attacker.pokemon.name} restored ${healingPercent}% HP (${remainingPercent}% HP left).`,
        pokemon: String(attacker.pokemon.name),
        healing: healingPercent
      });
    } else {
      state.battleLog.push({
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
      state.battleLog.push({
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
        state.battleLog.push({
          type: 'status_effect',
          message: `${attacker.pokemon.name} was cured of ${oldStatus}!`,
          pokemon: String(attacker.pokemon.name)
        });
      }
    }
  } else if (move.damage_class?.name === 'status') {
    // Handle status moves (no damage, just effects)
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${move.name}!`,
      pokemon: String(attacker.pokemon.name),
      move: String(move.name)
    });
    
    // Apply stat changes for status moves
    await applyStatusMoveEffects(attacker, defender, move, state);
  } else {
    // Use the new PokeAPI executor for move execution
    const turnResult = await executeTurn({
      move: move.name,
      attacker: attacker,
      defender: defender,
      attackerHasAdaptability: getCurrentAbility(attacker) === 'adaptability'
    });
    
    // Log move usage
    state.battleLog.push({
      type: 'move_used',
      message: `${attacker.pokemon.name} used ${turnResult.move}!`,
      pokemon: String(attacker.pokemon.name),
      move: String(turnResult.move)
    });
    
    // Handle miss
    if (turnResult.missed) {
      state.battleLog.push({
        type: 'move_missed',
        message: `${attacker.pokemon.name}'s ${move.name} missed!`,
        pokemon: String(attacker.pokemon.name),
        move: String(move.name)
      });
    } else {
      // Log damage if any
      if (turnResult.totalDamage > 0) {
        // Actually reduce the defender's HP
        const wasAlive = defender.currentHp > 0;
        defender.currentHp = Math.max(0, defender.currentHp - turnResult.totalDamage);
        
        const damagePercent = calculateDamagePercentage(turnResult.totalDamage, defender.maxHp);
        const remainingPercent = Math.round((defender.currentHp / defender.maxHp) * 100);
        
        // Log damage with effectiveness
        const effectivenessText = getEffectivenessText(turnResult.typeEffectiveness);
        let damageMessage = `${defender.pokemon.name} took ${damagePercent}% damage (${remainingPercent}% HP left).`;
        
        if (effectivenessText === 'super_effective') {
          damageMessage = `It's super effective! ${damageMessage}`;
        } else if (effectivenessText === 'not_very_effective') {
          damageMessage = `It's not very effective... ${damageMessage}`;
        } else if (effectivenessText === 'no_effect') {
          damageMessage = `It had no effect!`;
        }
        
        state.battleLog.push({
          type: 'damage_dealt',
          message: damageMessage,
          pokemon: String(defender.pokemon.name),
          damage: damagePercent,
          effectiveness: effectivenessText
        });

        // Track faint counter
        if (wasAlive && defender.currentHp === 0) {
          const team = isPlayer ? state.opponent : state.player;
          team.faintedCount = Math.min(team.pokemon.length, (team.faintedCount || 0) + 1);
        }
      }
      // Start binding if present
      if (turnResult.binding) {
        console.log(`🔗 Applying binding effect to ${defender.pokemon.name}:`, turnResult.binding);
        defender.volatile.binding = {
          kind: turnResult.binding.kind,
          turnsLeft: turnResult.binding.turns,
          fraction: turnResult.binding.fraction
        } as any;
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} was trapped by ${turnResult.binding.kind}!`,
          pokemon: String(defender.pokemon.name)
        });
        console.log(`🔗 Binding effect applied. Volatile state:`, defender.volatile.binding);
      }
      // Log flinch secondary
      if (turnResult.flinchedTarget) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} flinched!`,
          pokemon: String(defender.pokemon.name)
        });
      }
      
      // Log critical hits
      if (turnResult.crits.some(crit => crit)) {
        state.battleLog.push({
          type: 'critical_hit',
          message: "A critical hit!",
          pokemon: String(attacker.pokemon.name)
        });
      }
      
      // Log multi-hit
      if (turnResult.hits > 1) {
        state.battleLog.push({
          type: 'multi_hit',
          message: `Hit ${turnResult.hits} times!`,
          pokemon: String(attacker.pokemon.name)
        });
      }
      
      // Log drain
      if (turnResult.drained && turnResult.drained > 0) {
        state.battleLog.push({
          type: 'healing',
          message: `${attacker.pokemon.name} restored ${turnResult.drained} HP!`,
          pokemon: String(attacker.pokemon.name)
        });
      }
      
      // Log recoil
      if (turnResult.recoil && turnResult.recoil > 0) {
        state.battleLog.push({
          type: 'recoil',
          message: `${attacker.pokemon.name} is damaged by recoil!`,
          pokemon: String(attacker.pokemon.name)
        });
      }
    }
    
    // Apply status effects (handled by executor, just log if applied)
    if (turnResult.appliedAilment && !defender.status) {
      // Check if target is immune to sleep
      if (turnResult.appliedAilment === 'SLP' && isImmuneToSleep(defender)) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${defender.pokemon.name} is immune to sleep due to its ${getCurrentAbility(defender)} ability!`,
          pokemon: String(defender.pokemon.name)
        });
      } else {
        const statusMap: Record<string, string> = {
          'PAR': 'paralyzed',
          'BRN': 'burned', 
          'PSN': 'poisoned',
          'TOX': 'poisoned',
          'SLP': 'asleep',
          'FRZ': 'frozen'
        };
        const status = statusMap[turnResult.appliedAilment] || turnResult.appliedAilment.toLowerCase();
        defender.status = status as 'poisoned' | 'paralyzed' | 'asleep' | 'burned' | 'frozen';
        defender.statusTurns = 0;
        state.battleLog.push({
          type: 'status_applied',
          message: `${defender.pokemon.name} was ${status}!`,
          pokemon: String(defender.pokemon.name),
          status: status
        });
      }
    }
    
    // Log stat changes
    if (turnResult.statChanges && turnResult.statChanges.length > 0) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name}'s stats changed!`,
        pokemon: String(defender.pokemon.name)
      });
    }
    
    // Apply ability changes (Worry Seed, etc.)
    const newAbility = canChangeAbility(move);
    if (newAbility) {
      defender.currentAbility = newAbility;
      defender.abilityChanged = true;
      
      if (newAbility === 'insomnia') {
        // Worry Seed: Change to Insomnia and wake up if asleep
        if (defender.status === 'asleep') {
          defender.status = undefined;
          defender.statusTurns = undefined;
          state.battleLog.push({
            type: 'status_effect',
            message: `${defender.pokemon.name} woke up due to Worry Seed!`,
            pokemon: String(defender.pokemon.name)
          });
        }
        state.battleLog.push({
          type: 'ability_changed',
          message: `${defender.pokemon.name}'s ability was changed to Insomnia by Worry Seed!`,
          pokemon: String(defender.pokemon.name)
        });
      } else if (newAbility === 'none') {
        // Gastro Acid: Suppress ability
        state.battleLog.push({
          type: 'ability_changed',
          message: `${defender.pokemon.name}'s ability was suppressed!`,
          pokemon: String(defender.pokemon.name)
        });
      }
    }
  }
}

// End the current turn and start the next one
async function endTurn(state: BattleState): Promise<BattleState> {
  const newState = { ...state, battleLog: [...state.battleLog] };
  
  // Check for team defeat
  if (isTeamDefeated(newState.player)) {
    newState.isComplete = true;
    newState.winner = 'opponent';
    newState.battleLog.push({
      type: 'battle_end',
      message: 'All your Pokémon have fainted! You lost the battle!',
      turn: newState.turn
    });
    return newState;
  }
  
  if (isTeamDefeated(newState.opponent)) {
    newState.isComplete = true;
    newState.winner = 'player';
    newState.battleLog.push({
      type: 'battle_end',
      message: 'All opponent Pokémon have fainted! You won the battle!',
      turn: newState.turn
    });
    return newState;
  }
  
  // Check if current Pokémon are fainted and switch if needed
  let pokemonSwitched = false;
  const playerCurrent = getCurrentPokemon(newState.player);
  const opponentCurrent = getCurrentPokemon(newState.opponent);
  
  if (playerCurrent.currentHp <= 0) {
    const nextIndex = getNextAvailablePokemon(newState.player);
    if (nextIndex !== null) {
      switchToPokemon(newState.player, nextIndex);
      const newCurrent = getCurrentPokemon(newState.player);
      newState.battleLog.push({
        type: 'pokemon_sent_out',
        message: `Go! ${newCurrent.pokemon.name}!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    }
  }
  
  if (opponentCurrent.currentHp <= 0) {
    const nextIndex = getNextAvailablePokemon(newState.opponent);
    if (nextIndex !== null) {
      switchToPokemon(newState.opponent, nextIndex);
      const newCurrent = getCurrentPokemon(newState.opponent);
      newState.battleLog.push({
        type: 'pokemon_sent_out',
        message: `${newCurrent.pokemon.name} was sent out!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    }
  }
  
  // Process end of turn status effects
  const playerStatusDamage = processEndOfTurnStatus(newState.player.pokemon[newState.player.currentIndex]);
  const opponentStatusDamage = processEndOfTurnStatus(newState.opponent.pokemon[newState.opponent.currentIndex]);
  
  if (playerStatusDamage > 0) {
    const damagePercent = calculateDamagePercentage(playerStatusDamage, newState.player.pokemon[newState.player.currentIndex].maxHp);
    const remainingPercent = Math.round((newState.player.pokemon[newState.player.currentIndex].currentHp / newState.player.pokemon[newState.player.currentIndex].maxHp) * 100);
    
    newState.battleLog.push({
      type: 'status_damage',
      message: `${newState.player.pokemon[newState.player.currentIndex].pokemon.name} was hurt by its ${newState.player.pokemon[newState.player.currentIndex].status}! (${remainingPercent}% HP left)`,
      pokemon: String(newState.player.pokemon[newState.player.currentIndex].pokemon.name),
      damage: damagePercent,
      status: String(newState.player.pokemon[newState.player.currentIndex].status)
    });
  }
  
  if (opponentStatusDamage > 0) {
    const damagePercent = calculateDamagePercentage(opponentStatusDamage, newState.opponent.pokemon[newState.opponent.currentIndex].maxHp);
    const remainingPercent = Math.round((newState.opponent.pokemon[newState.opponent.currentIndex].currentHp / newState.opponent.pokemon[newState.opponent.currentIndex].maxHp) * 100);
    
    newState.battleLog.push({
      type: 'status_damage',
      message: `${newState.opponent.pokemon[newState.opponent.currentIndex].pokemon.name} was hurt by its ${newState.opponent.pokemon[newState.opponent.currentIndex].status}! (${remainingPercent}% HP left)`,
      pokemon: String(newState.opponent.pokemon[newState.opponent.currentIndex].pokemon.name),
      damage: damagePercent,
      status: String(newState.opponent.pokemon[newState.opponent.currentIndex].status)
    });
  }

  // Binding damage is now processed in processResidualDamage function
  
  // Start next turn
  newState.turn++;
  newState.phase = 'choice';
  newState.actionQueue = [];
  
  // Add turn indicator
  newState.battleLog.push({
    type: 'turn_start',
    message: `Turn ${newState.turn}:`,
    turn: newState.turn
  });
  
  return newState;
}

// Main battle loop (Gen-8/9 style)
export async function processBattleTurn(
  state: BattleState, 
  playerAction: BattleAction, 
  opponentAction: BattleAction
): Promise<BattleState> {
  if (state.isComplete) {
    return state;
  }
  
  const newState = { ...state, battleLog: [...state.battleLog] };
  newState.turn += 1;
  
  // A) Choice phase - actions are already provided
  // B) Build & order action queue
  newState.actionQueue = buildActionQueue(newState, playerAction, opponentAction);
  newState.phase = 'resolution';
  
  // C) Resolve actions
  for (const action of newState.actionQueue) {
    if (action.type === 'switch') {
      await resolveSwitch(newState, action);
    } else if (action.type === 'move' || action.type === 'pursuit') {
      await resolveMove(newState, action);
    }
  }
  
  // D) End-of-turn
  await processEndOfTurn(newState);
  
  // E) Force replacements
  await processReplacements(newState);

  // If an active fainted during resolution or end-of-turn, auto-select next available
  function ensureReplacement(team: BattleTeam) {
    const cur = team.pokemon[team.currentIndex];
    if (cur && cur.currentHp <= 0) {
      const idx = getNextAvailablePokemon(team);
      if (idx !== null) {
        switchToPokemon(team, idx);
        const sent = getCurrentPokemon(team);
        newState.battleLog.push({
          type: 'pokemon_sent_out',
          message: `Go! ${sent.pokemon.name}!`,
          pokemon: sent.pokemon.name
        });
      }
    }
  }
  ensureReplacement(newState.player);
  ensureReplacement(newState.opponent);
  
  // Check if battle is over
  if (isTeamDefeated(newState.player)) {
    newState.isComplete = true;
    newState.winner = 'opponent';
    newState.battleLog.push({
      type: 'battle_end',
      message: 'All your Pokémon have fainted! You lost!',
      turn: newState.turn
    });
  } else if (isTeamDefeated(newState.opponent)) {
    newState.isComplete = true;
    newState.winner = 'player';
    newState.battleLog.push({
      type: 'battle_end',
      message: 'All opponent Pokémon have fainted! You won!',
      turn: newState.turn
    });
  } else {
    // Battle continues - transition back to choice phase for next turn
    newState.phase = 'choice';
  }
  
  return newState;
}
