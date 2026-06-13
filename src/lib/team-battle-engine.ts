import { Pokemon, Move } from '@/types/pokemon';
import { CompiledMove } from './adapters/pokeapiMoveAdapter';
import { DynamicPowerContext } from '@/types/move';
import {
  calculateComprehensiveDamage,
  TypeName,
  calculateTypeEffectiveness
} from './damage-calculator';
import { getMove, getCachedMove } from './moveCache';
import { processReplacements, runBattleTurnFromQueue } from './team-battle-engine-additional';
import {
  BattleRng,
  cloneBattleRng,
  createBattleRng,
  rngRollChance,
} from './battle-rng';
import { FieldState, SideHazards, EMPTY_HAZARDS, createFieldState, FieldSideScreens, TerrainKind, WeatherKind, type BattleFeatureFlags } from './team-battle-types';
import { isGrounded } from './team-battle-hazards';

function normalizeTypeName(raw?: string | null): TypeName {
  const fallback: TypeName = 'Normal';
  if (!raw || typeof raw !== 'string') return fallback;
  const normalized = raw.toLowerCase();
  const formatted = (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as TypeName;
  return formatted;
}

function determineWeatherModifier(kind?: WeatherKind): 'None' | 'Rain' | 'Sun' | 'Sandstorm' | 'Hail' {
  switch (kind) {
    case 'rain':
      return 'Rain';
    case 'sun':
      return 'Sun';
    case 'sandstorm':
      return 'Sandstorm';
    case 'snow':
      return 'Hail';
    default:
      return 'None';
  }
}

function determineTerrainModifier(
  terrainKind: TerrainKind | undefined,
  moveType: TypeName,
  attackerGrounded: boolean
): 'None' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty' {
  if (!terrainKind || terrainKind === 'none' || !attackerGrounded) {
    return 'None';
  }

  const normalized = terrainKind.toLowerCase();

  switch (normalized) {
    case 'electric':
      return moveType === 'Electric' ? 'Electric' : 'None';
    case 'grassy':
      return moveType === 'Grass' ? 'Grassy' : 'None';
    case 'psychic':
      return moveType === 'Psychic' ? 'Psychic' : 'None';
    case 'misty':
      return 'Misty';
    default:
      return 'None';
  }
}

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
  status?: 'paralyzed' | 'poisoned' | 'badly-poisoned' | 'burned' | 'frozen' | 'asleep' | 'confused';
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
    protect?: { counter: number; active?: boolean };
    perishSong?: { turns: number };
    flinched?: boolean;
    binding?: { kind: string; turnsLeft: number; fraction: number };
    justSwitchedIn?: boolean;
    toxicCounter?: number;
    yawn?: { turns: number };
    aquaRing?: boolean;
    wish?: { turns: number; heal: number };
    leechSeedSource?: { owner: 'player' | 'opponent'; index: number };
    damageDealtThisTurn?: number;
    focusSashUsed?: boolean;
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
  heldItem?: string;
};

export type BattleTeam = {
  pokemon: BattlePokemon[];
  currentIndex: number;
  faintedCount: number;
  // Side conditions
  sideConditions: {
    screens: FieldSideScreens;
    hazards: SideHazards;
    tailwind?: { turns: number };
    luckyChant?: { turns: number };
  };
};

export type BattleLogEntry = {
  type: 'turn_start' | 'move_used' | 'move_missed' | 'critical_hit' | 'multi_hit' | 'recoil' | 'drain' | 'damage_dealt' | 'status_applied' | 'status_damage' | 'status_effect' | 'pokemon_fainted' | 'pokemon_sent_out' | 'battle_start' | 'battle_end' | 'ability_changed' | 'healing' | 'engine_warning';
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
  rng: BattleRng; // Deterministic RNG state
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
  // Field state
  field: FieldState;
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
  /** Feature-gate scaffold for future mechanics (Tera/doubles). */
  featureFlags?: BattleFeatureFlags;
};

export type BattleAction = {
  type: 'move' | 'switch';
  moveId?: string;
  target?: 'player' | 'opponent';
  switchIndex?: number;
};

export type BattleRuleProfile = 'simplified' | 'cart_like';

/** Future doubles-ready target model (currently singles uses 'opponent'). */
export type BattleTargetRef =
  | { mode: 'single'; side: 'player' | 'opponent' }
  | { mode: 'slot'; side: 'player' | 'opponent'; slot: number };

export type NormalizedServerActionResult = {
  action: BattleAction;
  normalized: boolean;
  reasonCode?: string;
  errorCode?: string;
};

// Helper functions
function calculateHp(baseHp: number, level: number): number {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

// Calculate move priority (higher number = higher priority)
function getMovePriority(moveId: string): number {
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
export function getEffectiveSpeed(pokemon: BattlePokemon, tailwindActive = false): number {
  const baseSpeed = pokemon.pokemon.stats?.find((stat: any) => (stat.stat?.name || stat.name) === 'speed')?.base_stat || 50;
  let calculatedSpeed = calculateStat(baseSpeed, pokemon.level);
  // Apply nature: +10% to increased stat, -10% to decreased stat
  try {
    if (pokemon.nature) {
      const { getNature } = require('@/data/natures') as typeof import('@/data/natures');
      const n = getNature(pokemon.nature);
      if (n.increasedStat === 'speed') calculatedSpeed = Math.floor(calculatedSpeed * 1.1);
      if (n.decreasedStat === 'speed') calculatedSpeed = Math.floor(calculatedSpeed * 0.9);
    }
  } catch (e) { console.warn('Failed to load natures for speed calc:', e); }
  let finalSpeed = applyStatModifier(calculatedSpeed, pokemon.statModifiers?.speed || 0);
  // Tailwind doubles speed (Gen IV+)
  if (tailwindActive) {
    finalSpeed = Math.floor(finalSpeed * 2);
  }
  // Paralysis halves speed (Gen 7+)
  if (pokemon.status === 'paralyzed') {
    finalSpeed = Math.floor(finalSpeed * 0.5);
  }
  return finalSpeed;
}

/** True when every move slot has 0 PP (Struggle condition). */
export function allMovesOutOfPp(pokemon: BattlePokemon): boolean {
  if (!pokemon.moves.length) return false;
  return pokemon.moves.every((m) => m.pp <= 0);
}

/** Encored move slot has no PP left (Showdown-style: must Struggle even if other moves have PP). */
export function encoredMoveHasNoPp(pokemon: BattlePokemon): boolean {
  const e = pokemon.volatile.encore;
  if (!e || e.turns <= 0) return false;
  const slot = pokemon.moves.find((m) => m.id === e.move);
  return !slot || slot.pp <= 0;
}

export function canSelectStruggle(pokemon: BattlePokemon): boolean {
  return allMovesOutOfPp(pokemon) || encoredMoveHasNoPp(pokemon);
}

/** Decrements PP for the used move slot once per selection (hit or miss). Struggle does not consume PP. */
export function consumePpForMove(pokemon: BattlePokemon, moveId: string): void {
  if (moveId.toLowerCase() === 'struggle') return;
  const move = pokemon.moves.find((m) => m.id === moveId);
  if (!move) return;
  move.pp = Math.max(0, move.pp - 1);
}

// Check if a Pokemon can use a move (usability gates)
export function canUseMove(
  pokemon: BattlePokemon,
  moveId: string,
  rng: BattleRng
): { canUse: boolean; reason?: string; snappedOutOfConfusion?: boolean } {
  const idLower = moveId.toLowerCase();

  if (idLower === 'struggle') {
    if (!canSelectStruggle(pokemon)) {
      return { canUse: false, reason: 'struggle not available' };
    }
  } else {
    const move = pokemon.moves.find((m) => m.id === moveId);
    if (!move) return { canUse: false, reason: 'Invalid move' };

    if (pokemon.volatile.encore && pokemon.volatile.encore.turns > 0) {
      const enc = pokemon.volatile.encore.move;
      if (moveId !== enc) {
        return { canUse: false, reason: 'encored' };
      }
      if (move.pp <= 0) {
        return { canUse: false, reason: 'encored move has no PP' };
      }
    } else {
      if (move.pp <= 0) return { canUse: false, reason: 'no PP left' };
    }

    if (move.disabled) return { canUse: false, reason: 'disabled' };
  }

  // Check status conditions
  if (pokemon.status === 'asleep') {
    return { canUse: false, reason: 'fast asleep' };
  }
  if (pokemon.status === 'frozen') {
    return { canUse: false, reason: 'frozen solid' };
  }
  if (pokemon.status === 'paralyzed') {
    if (!rngRollChance(rng, 0.75)) {
      return { canUse: false, reason: 'fully paralyzed' };
    }
  }

  if (pokemon.volatile.confusion && pokemon.volatile.confusion.turns > 0) {
    pokemon.volatile.confusion.turns -= 1;
    if (pokemon.volatile.confusion.turns <= 0) {
      pokemon.volatile.confusion = undefined;
      return { canUse: true, snappedOutOfConfusion: true };
    }
    if (rngRollChance(rng, 1 / 3)) {
      const basePower = 40;
      const baseAtk = pokemon.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === 'attack')?.base_stat ?? 50;
      const baseDef = pokemon.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === 'defense')?.base_stat ?? 50;
      const level = pokemon.level ?? 50;
      let atkStat = applyStatModifier(calculateStat(baseAtk, level), pokemon.statModifiers?.attack || 0);
      const defStat = applyStatModifier(calculateStat(baseDef, level), pokemon.statModifiers?.defense || 0);
      if (pokemon.status === 'burned') atkStat = Math.floor(atkStat * 0.5);
      const confusionDmg = Math.max(1, Math.floor(((2 * level / 5 + 2) * basePower * atkStat / defStat) / 50 + 2));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - confusionDmg);
      return { canUse: false, reason: 'confused and hurt itself' };
    }
  }

  // Check volatile conditions
  if (pokemon.volatile.taunt && pokemon.volatile.taunt.turns > 0) {
    const fullMove = getCachedMove(moveId);
    if (fullMove?.category === 'Status') {
      return { canUse: false, reason: 'taunted' };
    }
  }

  if (pokemon.volatile.disable && pokemon.volatile.disable.turns > 0) {
    if (moveId === pokemon.volatile.disable.move && idLower !== 'struggle') {
      return { canUse: false, reason: 'disabled' };
    }
  }

  return { canUse: true };
}

/**
 * Deterministic server-side legality for submitted choices (no RNG).
 * Paralysis full para / confusion self-hit are resolved during turn execution, not here.
 */
export function validateServerBattleAction(team: BattleTeam, action: BattleAction): string | null {
  const normalized = normalizeServerBattleAction(team, action, 'simplified');
  return normalized.errorCode ?? null;
}

/**
 * Server-authoritative action normalization.
 * - `simplified`: normalize select illegal moves to Struggle when deterministic.
 * - `cart_like`: keep strict failures unless explicitly legal.
 */
export function normalizeServerBattleAction(
  team: BattleTeam,
  action: BattleAction,
  profile: BattleRuleProfile = 'simplified'
): NormalizedServerActionResult {
  if (action.type === 'switch') {
    const idx = action.switchIndex;
    if (typeof idx !== 'number' || !Number.isInteger(idx)) return { action, normalized: false, errorCode: 'invalid_switch_index' };
    if (idx < 0 || idx >= team.pokemon.length) return { action, normalized: false, errorCode: 'switch_out_of_range' };
    if (idx === team.currentIndex) return { action, normalized: false, errorCode: 'switch_same_slot' };
    if (team.pokemon[idx].currentHp <= 0) return { action, normalized: false, errorCode: 'switch_to_fainted' };
    return { action, normalized: false };
  }

  if (action.type === 'move') {
    const moveId = action.moveId;
    if (!moveId || typeof moveId !== 'string') return { action, normalized: false, errorCode: 'missing_move' };
    const mon = getCurrentPokemon(team);
    const idLower = moveId.toLowerCase();

    if (idLower === 'struggle') {
      if (!canSelectStruggle(mon)) return { action, normalized: false, errorCode: 'illegal_struggle' };
      return { action, normalized: false };
    }

    const move = mon.moves.find((m) => m.id === moveId);
    if (!move) {
      if (profile === 'simplified' && canSelectStruggle(mon)) {
        return {
          action: { type: 'move', moveId: 'struggle', target: action.target },
          normalized: true,
          reasonCode: 'invalid_move_coerced_to_struggle',
        };
      }
      return { action, normalized: false, errorCode: 'invalid_move' };
    }
    if (mon.volatile.encore && mon.volatile.encore.turns > 0) {
      if (moveId !== mon.volatile.encore.move) {
        if (profile === 'simplified' && canSelectStruggle(mon)) {
          return {
            action: { type: 'move', moveId: 'struggle', target: action.target },
            normalized: true,
            reasonCode: 'encore_wrong_move_coerced_to_struggle',
          };
        }
        return { action, normalized: false, errorCode: 'encored_wrong_move' };
      }
      if (move.pp <= 0) {
        if (profile === 'simplified') {
          return {
            action: { type: 'move', moveId: 'struggle', target: action.target },
            normalized: true,
            reasonCode: 'encored_no_pp_coerced_to_struggle',
          };
        }
        return { action, normalized: false, errorCode: 'encored_no_pp_use_struggle' };
      }
    } else if (move.pp <= 0) {
      if (profile === 'simplified' && canSelectStruggle(mon)) {
        return {
          action: { type: 'move', moveId: 'struggle', target: action.target },
          normalized: true,
          reasonCode: 'no_pp_coerced_to_struggle',
        };
      }
      return { action, normalized: false, errorCode: 'no_pp' };
    }
    if (move.disabled) return { action, normalized: false, errorCode: 'move_disabled' };
    if (mon.status === 'asleep' || mon.status === 'frozen') return { action, normalized: false, errorCode: 'cannot_use_move_status' };

    if (mon.volatile.taunt && mon.volatile.taunt.turns > 0) {
      const fullMove = getCachedMove(moveId);
      if (fullMove?.category === 'Status') return { action, normalized: false, errorCode: 'taunted' };
    }

    if (mon.volatile.disable && mon.volatile.disable.turns > 0) {
      if (moveId === mon.volatile.disable.move && idLower !== 'struggle') {
        return { action, normalized: false, errorCode: 'move_disabled_volatile' };
      }
    }

    return { action, normalized: false };
  }

  return { action, normalized: false, errorCode: 'unknown_action' };
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
      speed: getEffectiveSpeed(
        getCurrentPokemon(state.opponent),
        !!(state.opponent.sideConditions.tailwind?.turns && state.opponent.sideConditions.tailwind.turns > 0)
      )
    });
  }

  if (opponentAction.type === 'switch' && playerAction.type === 'move' && playerAction.moveId === 'pursuit') {
    queue.push({
      type: 'pursuit',
      user: 'player',
      moveId: 'pursuit',
      target: 'opponent',
      priority: getMovePriority('pursuit'),
      speed: getEffectiveSpeed(
        getCurrentPokemon(state.player),
        !!(state.player.sideConditions.tailwind?.turns && state.player.sideConditions.tailwind.turns > 0)
      )
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
      speed: getEffectiveSpeed(getCurrentPokemon(state.player), !!(state.player.sideConditions.tailwind?.turns && state.player.sideConditions.tailwind.turns > 0))
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
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent), !!(state.opponent.sideConditions.tailwind?.turns && state.opponent.sideConditions.tailwind.turns > 0))
    });
  }

  // Order by class, then priority, then speed
  // Check if Trick Room is active
  const isTrickRoomActive = state.field.rooms?.trickRoom && state.field.rooms.trickRoom.turns > 0;
  
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

    // Within same priority, order by speed
    // If Trick Room is active, reverse speed order (slower moves first)
    if (a.speed !== b.speed) {
      if (isTrickRoomActive) {
        return a.speed - b.speed; // Lower speed first
      } else {
        return b.speed - a.speed; // Higher speed first
      }
    }

    // Speed tie: 50/50 using battle RNG (reproducible / consistent with multiplayer)
    return rngRollChance(state.rng, 0.5) ? -1 : 1;
  });
}

export function calculateStat(baseStat: number, level: number): number {
  return Math.floor(((2 * baseStat + 31) * level) / 100) + 5;
}

// Apply stat modifiers
function applyStatModifier(baseStat: number, modifier: number): number {
  const multiplier = modifier >= 0 ? (2 + modifier) / 2 : 2 / (2 - modifier);
  return Math.floor(baseStat * multiplier);
}

// Calculate damage percentage
function calculateDamagePercentage(damage: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.round((damage / maxHp) * 100);
}

// Get effectiveness text
function getEffectivenessText(effectiveness: number): 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal' {
  if (effectiveness === 0) return 'no_effect';
  if (effectiveness > 1) return 'super_effective';
  if (effectiveness < 1) return 'not_very_effective';
  return 'normal';
}

// Get Pokémon's current ability
function getCurrentAbility(pokemon: BattlePokemon): string {
  if (pokemon.currentAbility) {
    return pokemon.currentAbility;
  }

  // Get the first non-hidden ability from the Pokémon's abilities
  const ability = pokemon.pokemon.abilities.find(a => !a.is_hidden);
  return ability?.ability.name || 'none';
}

// Check if move can cause status effect
function canCauseStatusEffect(move: Move): string | null {
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
function canChangeAbility(move: Move): string | null {
  const abilityMoves: Record<string, string> = {
    'worry-seed': 'insomnia',
    'gastro-acid': 'none', // Suppresses ability
    'simple-beam': 'simple',
    'entrainment': 'none' // Copies user's ability
  };

  return abilityMoves[move.name] || null;
}

// Map PokeAPI stat names to our stat modifier keys
function mapStatName(stat: "atk" | "def" | "spa" | "spd" | "spe" | "acc" | "eva"): keyof BattlePokemon['statModifiers'] {
  const mapping: Record<"atk" | "def" | "spa" | "spd" | "spe" | "acc" | "eva", keyof BattlePokemon['statModifiers']> = {
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
  battleState: { battleLog: BattleLogEntry[]; rng?: BattleRng }
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

  // Stat boosting moves — each entry lists ALL stat changes the move applies
  type StatModKey = keyof BattlePokemon['statModifiers'];
  const statBoostingMoves: Record<string, { changes: Array<{ stat: StatModKey, stages: number }>, target: 'self' | 'opponent' }> = {
    'swords-dance': { changes: [{ stat: 'attack', stages: 2 }], target: 'self' },
    'dragon-dance': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'speed', stages: 1 }], target: 'self' },
    'bulk-up': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'defense', stages: 1 }], target: 'self' },
    'calm-mind': { changes: [{ stat: 'specialAttack', stages: 1 }, { stat: 'specialDefense', stages: 1 }], target: 'self' },
    'nasty-plot': { changes: [{ stat: 'specialAttack', stages: 2 }], target: 'self' },
    'work-up': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'specialAttack', stages: 1 }], target: 'self' },
    'hone-claws': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'accuracy', stages: 1 }], target: 'self' },
    'defense-curl': { changes: [{ stat: 'defense', stages: 1 }], target: 'self' },
    'iron-defense': { changes: [{ stat: 'defense', stages: 2 }], target: 'self' },
    'acid-armor': { changes: [{ stat: 'defense', stages: 2 }], target: 'self' },
    'barrier': { changes: [{ stat: 'defense', stages: 2 }], target: 'self' },
    'amnesia': { changes: [{ stat: 'specialDefense', stages: 2 }], target: 'self' },
    'agility': { changes: [{ stat: 'speed', stages: 2 }], target: 'self' },
    'rock-polish': { changes: [{ stat: 'speed', stages: 2 }], target: 'self' },
    'autotomize': { changes: [{ stat: 'speed', stages: 2 }], target: 'self' },
    'shift-gear': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'speed', stages: 2 }], target: 'self' },
    'quiver-dance': { changes: [{ stat: 'specialAttack', stages: 1 }, { stat: 'specialDefense', stages: 1 }, { stat: 'speed', stages: 1 }], target: 'self' },
    'coil': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'defense', stages: 1 }, { stat: 'accuracy', stages: 1 }], target: 'self' },
    'shell-smash': { changes: [{ stat: 'attack', stages: 2 }, { stat: 'specialAttack', stages: 2 }, { stat: 'speed', stages: 2 }, { stat: 'defense', stages: -1 }, { stat: 'specialDefense', stages: -1 }], target: 'self' },
    'belly-drum': { changes: [{ stat: 'attack', stages: 6 }], target: 'self' },
    'growth': { changes: [{ stat: 'attack', stages: 1 }, { stat: 'specialAttack', stages: 1 }], target: 'self' },
    'howl': { changes: [{ stat: 'attack', stages: 1 }], target: 'self' },
    'meditate': { changes: [{ stat: 'attack', stages: 1 }], target: 'self' },
    'sharpen': { changes: [{ stat: 'attack', stages: 1 }], target: 'self' },
    'harden': { changes: [{ stat: 'defense', stages: 1 }], target: 'self' },
    'withdraw': { changes: [{ stat: 'defense', stages: 1 }], target: 'self' },
    'minimize': { changes: [{ stat: 'evasion', stages: 2 }], target: 'self' },
    'double-team': { changes: [{ stat: 'evasion', stages: 1 }], target: 'self' },
    'focus-energy': { changes: [{ stat: 'accuracy', stages: 1 }], target: 'self' },
    'laser-focus': { changes: [{ stat: 'accuracy', stages: 2 }], target: 'self' },
  };

  const SELF_STAT_DROP_MOVES = new Set([
    'close-combat', 'superpower', 'overheat', 'draco-meteor', 'leaf-storm',
    'v-create', 'hammer-arm', 'psycho-boost', 'shell-smash', 'fleur-cannon',
    'hyperspace-fury', 'clanging-scales',
  ]);

  // Check for stat changes from PokeAPI data first
  if (compiledMove.statChanges && compiledMove.statChanges.length > 0) {
    const selfDrop = SELF_STAT_DROP_MOVES.has(compiledMove.name?.toLowerCase?.() ?? '');
    for (const statChange of compiledMove.statChanges) {
      // Check if the effect triggers
      const effectRng = battleState.rng || createBattleRng(Date.now());
      if (rngRollChance(effectRng, (statChange.chance ?? 100) / 100)) {
        const target = selfDrop ? attacker : (statChange.stages > 0 ? attacker : defender);
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
    const reductionEntry = statReductionMoves[moveName];
    const boostEntry = statBoostingMoves[moveName];

    const statDisplayNames: Record<string, string> = {
      attack: 'Attack', defense: 'Defense', specialAttack: 'Special Attack',
      specialDefense: 'Special Defense', speed: 'Speed', accuracy: 'Accuracy', evasion: 'Evasion',
    };

    if (reductionEntry) {
      const target = reductionEntry.target === 'self' ? attacker : defender;
      const oldValue = target.statModifiers[reductionEntry.stat];
      target.statModifiers[reductionEntry.stat] = Math.max(-6, Math.min(6, oldValue + reductionEntry.stages));
      const change = target.statModifiers[reductionEntry.stat] - oldValue;
      if (change !== 0) {
        const targetName = target.pokemon.name;
        battleState.battleLog.push({
          type: 'status_effect',
          message: `${targetName}'s ${statDisplayNames[reductionEntry.stat]} ${change > 0 ? 'rose' : 'fell'}!`,
          pokemon: String(targetName),
        });
      }
    } else if (boostEntry) {
      const target = boostEntry.target === 'self' ? attacker : defender;
      const targetName = target.pokemon.name;
      for (const { stat, stages } of boostEntry.changes) {
        const oldValue = target.statModifiers[stat];
        target.statModifiers[stat] = Math.max(-6, Math.min(6, oldValue + stages));
        const change = target.statModifiers[stat] - oldValue;
        if (change !== 0) {
          battleState.battleLog.push({
            type: 'status_effect',
            message: `${targetName}'s ${statDisplayNames[stat]} ${change > 0 ? 'rose' : 'fell'}!`,
            pokemon: String(targetName),
          });
        }
      }
    }
  }
}

// Check if Pokémon is immune to sleep
function isImmuneToSleep(pokemon: BattlePokemon): boolean {
  const currentAbility = getCurrentAbility(pokemon);
  const sleepImmuneAbilities = ['insomnia', 'vital-spirit', 'sweet-veil'];
  return sleepImmuneAbilities.includes(currentAbility);
}

// Check if move is a healing move
function isHealingMove(move: Move): boolean {
  const healingMoves = [
    'recover', 'rest', 'soft-boiled', 'milk-drink', 'synthesis',
    'moonlight', 'morning-sun', 'roost', 'heal-bell', 'aromatherapy',
    'wish', 'heal-pulse', 'life-dew', 'jungle-healing'
  ];
  return healingMoves.includes(move.name);
}

// Calculate healing amount for healing moves
function calculateHealing(user: BattlePokemon, move: Move): number {
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
function isSelfTargetingMove(move: Move): boolean {
  const selfTargetingMoves = [
    'recover', 'rest', 'soft-boiled', 'milk-drink', 'synthesis',
    'moonlight', 'morning-sun', 'roost', 'heal-bell', 'aromatherapy',
    'wish', 'swords-dance', 'dragon-dance', 'calm-mind', 'bulk-up',
    'nasty-plot', 'work-up', 'growth', 'hone-claws', 'coil'
  ];
  return selfTargetingMoves.includes(move.name);
}

// Check if move can cause flinch
function canCauseFlinch(move: Move): boolean {
  const flinchMoves = [
    'air-slash', 'bite', 'dark-pulse', 'dragon-rush', 'extrasensory',
    'headbutt', 'iron-head', 'rock-slide', 'zen-headbutt', 'fake-out',
    'flinch', 'stomp', 'rolling-kick', 'low-kick', 'double-kick'
  ];
  return flinchMoves.includes(move.name);
}

// Type effectiveness calculation (now using comprehensive damage calculator)
function getTypeEffectiveness(attackType: string, defenseTypes: string[]): number {
  return calculateTypeEffectiveness(
    attackType as TypeName,
    defenseTypes.map(type => type as TypeName)
  );
}

// Calculate damage using comprehensive modern formula with PokeAPI moves
async function calculateDamageDetailed(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move | CompiledMove,
  state: BattleState
): Promise<{ damage: number; effectiveness: number; critical: boolean; statusEffect?: string; flinch?: boolean }> {
  // Handle both old Move type and new CompiledMove type
  let compiledMove: CompiledMove;
  try {
      if ('getPower' in move) {
        // Already a CompiledMove
        compiledMove = move;
      } else if (move.type && move.category) {
        // Hydrated move from RTDB (has type, category, power, etc.)
        // We wrap it in a CompiledMove-like structure
        compiledMove = {
            ...move,
            id: typeof move.id === 'number' ? move.id : 0, // Ensure ID is number if expected, or handle string IDs
            name: move.name,
            type: normalizeTypeName(move.type),
            category: move.category as any, // Cast to match expected category type
            power: move.power || 0,
            accuracy: move.accuracy || 100,
            pp: move.pp || 0,
            priority: 0, // Default if missing
            critRateStage: 0,
            hits: null,
            makesContact: false,
            bypassAccuracyCheck: false,
            statChanges: undefined
        } as unknown as CompiledMove;
      } else {
        // Old Move type - convert to CompiledMove via lookup
        compiledMove = await getMove(move.name);
      }
  } catch (e) {
      console.error('❌ Error preparing move data:', e);
      throw e;
  }

  const rng = state.rng;
  const weatherContext = determineWeatherModifier(state.field.weather?.kind);
  const moveType = normalizeTypeName(compiledMove.type);
  const attackerGrounded = isGrounded(attacker);
  const terrainContext = determineTerrainModifier(state.field.terrain?.kind, moveType, attackerGrounded);
  const attackerItem = attacker.heldItem?.toLowerCase();
  const defenderItem = defender.heldItem?.toLowerCase();
  const level = attacker.level;

  const powerContext: DynamicPowerContext = {
    attacker: {
      level: attacker.level,
      weightKg: (attacker.pokemon.weight || 500) / 10,
      speed: attacker.pokemon.stats?.find(s => s.stat?.name === 'speed' || s.name === 'speed')?.base_stat ?? 50,
      curHP: attacker.currentHp,
      maxHP: attacker.maxHp
    },
    defender: {
      weightKg: (defender.pokemon.weight || 500) / 10,
      speed: defender.pokemon.stats?.find(s => s.stat?.name === 'speed' || s.name === 'speed')?.base_stat ?? 50,
      curHP: defender.currentHp,
      maxHP: defender.maxHp,
      types: (defender.pokemon.types || []).map((t: any) =>
        (typeof t === 'string' ? t : t.type?.name || t.name || 'normal') as TypeName
      )
    }
  };

  let power = 0;
  try {
      power = compiledMove.getPower ? compiledMove.getPower(powerContext) : (compiledMove.power || 0);
  } catch (e) {
      console.error('❌ Error calculating move power:', e);
      power = 0;
  }

  // Determine if move is physical or special
  const isPhysical = compiledMove.category === 'Physical';

  const findStat = (mon: BattlePokemon, statName: string): number => {
    const stats = mon.pokemon.stats;
    if (!Array.isArray(stats)) return 50;
    const found = stats.find((s: any) => (s.stat?.name || s.name) === statName);
    return found?.base_stat ?? 50;
  };

  const attackerAttackStat = findStat(attacker, 'attack');
  const attackerSpecialAttackStat = findStat(attacker, 'special-attack');
  const defenderDefenseStat = findStat(defender, 'defense');
  const defenderSpecialDefenseStat = findStat(defender, 'special-defense');

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
  } catch (e) {
    console.error('Error applying nature modifiers:', e);
  }
  // Resolve type arrays early (needed by Sandstorm SpD and damage calc)
  const attackerTypes = attacker.pokemon.types.map(t =>
    normalizeTypeName(typeof t === 'string' ? t : t.type?.name)
  );
  const defenderTypes = defender.pokemon.types.map(t =>
    normalizeTypeName(typeof t === 'string' ? t : t.type?.name)
  );

  // Sandstorm: Rock types raise Special Defense by 1.5× (special moves only)
  if (weatherContext === 'Sandstorm' && !isPhysical) {
    const defenderHasRock = defenderTypes.some((t) => String(t).toLowerCase() === 'rock');
    if (defenderHasRock) {
      defenseWithNature = Math.floor(defenseWithNature * 1.5);
    }
  }

  const CRIT_RATES = [1/24, 1/8, 1/2, 1, 1];
  const critStage = compiledMove.critRateStage || 0;
  const isCrit = rngRollChance(rng, CRIT_RATES[Math.min(critStage, 4)]);

  const attackerAbility = getCurrentAbility(attacker)?.toLowerCase();
  const defenderAbility = getCurrentAbility(defender)?.toLowerCase();

  const GUTS_STATUSES: readonly string[] = ['burned', 'paralyzed', 'poisoned', 'badly-poisoned', 'asleep', 'frozen'];
  const hasGuts = attackerAbility === 'guts' && attacker.status != null && GUTS_STATUSES.includes(attacker.status);
  const hasAdaptability = attackerAbility === 'adaptability';
  const hasTintedLens = attackerAbility === 'tinted-lens';
  const defenderHasFilter = defenderAbility === 'filter';
  const defenderHasSolidRock = defenderAbility === 'solid-rock';
  const defenderHasMultiscale = defenderAbility === 'multiscale';
  const hasHugePower = attackerAbility === 'huge-power';
  const hasPurePower = attackerAbility === 'pure-power';
  const hasSniper = attackerAbility === 'sniper';
  const hasSuperLuck = attackerAbility === 'super-luck';
  const isHighCritMove = (compiledMove.critRateStage || 0) > 0;

  // Calculate damage
  const result = calculateComprehensiveDamage({
    level,
    movePower: power,
    moveType,
    attackerTypes,
    defenderTypes,
    attackStat: attackWithNature,
    defenseStat: defenseWithNature,
    attackStatStages: isPhysical ? attacker.statModifiers.attack : attacker.statModifiers.specialAttack,
    defenseStatStages: isPhysical ? defender.statModifiers.defense : defender.statModifiers.specialDefense,
    isPhysical,
    weather: weatherContext,
    isBurned: attacker.status === 'burned',
    hasGuts,
    hasAdaptability,
    hasLifeOrb: attackerItem === 'life-orb',
    hasExpertBelt: attackerItem === 'expert-belt',
    hasReflect: hasScreen(state, defender, 'reflect') && isPhysical && !isCrit,
    hasLightScreen: hasScreen(state, defender, 'lightScreen') && !isPhysical && !isCrit,
    hasAuroraVeil: hasScreen(state, defender, 'auroraVeil') && !isCrit,
    isMultiTarget: false,
    terrain: terrainContext,
    hasTintedLens,
    hasFilter: defenderHasFilter,
    hasSolidRock: defenderHasSolidRock,
    hasMultiscale: defenderHasMultiscale,
    isFullHp: defender.currentHp === defender.maxHp,
    hasHugePower,
    hasPurePower,
    hasSniper,
    isHighCritMove,
    hasSuperLuck,
    precomputedCrit: isCrit,
    defenderGrounded: isGrounded(defender),
    rng
  });

  // Check for status effects and flinch using new move system
  const AILMENT_MAP: Record<string, BattlePokemon['status']> = {
    paralysis: 'paralyzed',
    burn: 'burned',
    poison: 'poisoned',
    toxic: 'badly-poisoned',
    sleep: 'asleep',
    freeze: 'frozen',
  };

  let statusEffect: BattlePokemon['status'] | undefined;
  if (compiledMove.ailment && compiledMove.ailment.kind !== 'flinch' && compiledMove.ailment.kind !== 'none') {
    // PokeAPI: chance 0 = guaranteed, otherwise N = N% probability
    const chance = compiledMove.ailment.chance === 0 ? 1 : (compiledMove.ailment.chance ?? 0) / 100;
    if (rngRollChance(state.rng, chance)) {
      statusEffect = AILMENT_MAP[compiledMove.ailment.kind];
    }
  }

  const flinchChance = compiledMove.ailment?.chance === 0 ? 1 : (compiledMove.ailment?.chance ?? 0) / 100;
  const flinch = compiledMove.ailment?.kind === 'flinch' && rngRollChance(state.rng, flinchChance);

  return {
    damage: result.damage,
    effectiveness: result.effectiveness,
    critical: result.critical,
    statusEffect: statusEffect || undefined,
    flinch: flinch || undefined
  };
}

export function getCurrentPokemon(team: BattleTeam): BattlePokemon {
  const pokemon = team.pokemon[team.currentIndex];
  if (!pokemon) {
    throw new Error(`No pokemon at index ${team.currentIndex} (team size: ${team.pokemon.length})`);
  }
  return pokemon;
}

export function isTeamDefeated(team: BattleTeam): boolean {
  return team.pokemon.every(p => p.currentHp <= 0);
}

export function getNextAvailablePokemon(team: BattleTeam): number | null {
  for (let i = 0; i < team.pokemon.length; i++) {
    const pokemon = team.pokemon[i];

    if (i === team.currentIndex && pokemon.currentHp <= 0) {
      continue;
    }

    if (pokemon.currentHp > 0) {
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

// Function to handle automatic switching when a Pokémon faints
function handleAutomaticSwitching(state: BattleState): BattleState {
  const newState = { ...state };
  const newLog = [...state.battleLog];

  let pokemonSwitched = false;
  const playerCurrent = getCurrentPokemon(state.player);

  if (playerCurrent.currentHp <= 0) {
    const nextIndex = getNextAvailablePokemon(state.player);

    if (nextIndex !== null && nextIndex !== state.player.currentIndex) {
      switchToPokemon(newState.player, nextIndex);
      const newCurrent = getCurrentPokemon(newState.player);
      newLog.push({
        type: 'pokemon_sent_out',
        message: `Go! ${newCurrent.pokemon.name}!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    } else if (nextIndex === null) {
      newState.isComplete = true;
      newState.winner = 'opponent';
      newLog.push({
        type: 'battle_end',
        message: 'All your Pokemon have fainted! You lose!',
        pokemon: 'defeat'
      });
    }
  }

  const opponentCurrent = getCurrentPokemon(state.opponent);

  if (opponentCurrent.currentHp <= 0) {
    const nextIndex = getNextAvailablePokemon(state.opponent);

    if (nextIndex !== null && nextIndex !== state.opponent.currentIndex) {
      switchToPokemon(newState.opponent, nextIndex);
      const newCurrent = getCurrentPokemon(newState.opponent);
      newLog.push({
        type: 'pokemon_sent_out',
        message: `${newCurrent.pokemon.name} was sent out!`,
        pokemon: newCurrent.pokemon.name
      });
      pokemonSwitched = true;
    } else if (nextIndex === null) {
      newState.isComplete = true;
      newState.winner = 'player';
      newLog.push({
        type: 'battle_end',
        message: 'All opponent Pokemon have fainted! You win!',
        pokemon: 'victory'
      });
    }
  }

  if (pokemonSwitched) {
    const newPlayerCurrent = getCurrentPokemon(newState.player);
    const newOpponentCurrent = getCurrentPokemon(newState.opponent);

    const playerSpeedStat = newPlayerCurrent.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'speed')?.base_stat || 50;
    const opponentSpeedStat = newOpponentCurrent.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'speed')?.base_stat || 50;
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
    } catch (e) { console.warn('Failed to load natures for speed calc:', e); }
  }

  newState.battleLog = newLog;
  return newState;
}

// Handle Pokemon switching for multiplayer battles (manual selection)
function handleMultiplayerSwitching(state: BattleState, isPlayerTurn: boolean): BattleState {
  const newState = { ...state };
  const newLog = [...state.battleLog];

  const currentPokemon = isPlayerTurn ? getCurrentPokemon(state.player) : getCurrentPokemon(state.opponent);
  const team = isPlayerTurn ? state.player : state.opponent;

  if (currentPokemon.currentHp <= 0) {
    const availablePokemon = team.pokemon.filter((p, index) =>
      p.currentHp > 0 && index !== team.currentIndex
    );

    if (availablePokemon.length === 0) {
      newState.isComplete = true;
      newState.winner = isPlayerTurn ? 'opponent' : 'player';
      newLog.push({
        type: 'battle_end',
        message: isPlayerTurn ? 'All your Pokemon have fainted! You lose!' : 'All opponent Pokemon have fainted! You win!',
        pokemon: isPlayerTurn ? 'defeat' : 'victory'
      });
    } else {
      newState.phase = 'replacement';
      newLog.push({
        type: 'pokemon_fainted',
        message: `${currentPokemon.pokemon.name} fainted! Choose your next Pokemon.`,
        pokemon: currentPokemon.pokemon.name
      });
    }
  }

  newState.battleLog = newLog;
  return newState;
}

// Manually switch to a selected Pokemon (for multiplayer battles)
function switchToSelectedPokemon(state: BattleState, pokemonIndex: number, isPlayer: boolean): BattleState {
  const newState = { ...state };
  const newLog = [...state.battleLog];

  const team = isPlayer ? newState.player : newState.opponent;

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

  switchToPokemon(team, pokemonIndex);
  const newCurrent = getCurrentPokemon(team);

  newLog.push({
    type: 'pokemon_sent_out',
    message: `Go! ${newCurrent.pokemon.name}!`,
    pokemon: newCurrent.pokemon.name
  });

  newState.phase = 'choice';

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
  } catch (e) { console.warn('Failed to load natures for speed calc:', e); }

  newState.battleLog = newLog;
  return newState;
}

// Initialize team battle
function initializeTeamBattle(
  playerTeam: { pokemon: Pokemon; level: number; moves: Move[] }[],
  opponentTeam: { pokemon: Pokemon; level: number; moves: Move[] }[],
  playerTeamName: string = "Player",
  opponentTeamName: string = "Opponent"
): BattleState {
  // Convert team data to BattlePokemon arrays
  const playerBattlePokemon: BattlePokemon[] = playerTeam.map(teamMember => {
    const hpStat = teamMember.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'hp')?.base_stat || 50;
    
    // Use existing calculated HP if available (from team builder), otherwise calculate from base stats
    const existingHp = (teamMember as any).currentHp;
    const existingMaxHp = (teamMember as any).maxHp;
    
    const maxHp = existingMaxHp !== undefined ? existingMaxHp : calculateHp(hpStat, teamMember.level);
    const currentHp = existingHp !== undefined ? existingHp : maxHp;

    return {
      pokemon: teamMember.pokemon,
      level: teamMember.level,
      currentHp,
      maxHp,
      moves: teamMember.moves.map(m => ({
        id: m.name,
        pp: m.pp || 20, // Default PP if missing
        maxPp: m.pp || 20,
        disabled: false
      })),
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      },
      volatile: {}
    };
  });

  const opponentBattlePokemon: BattlePokemon[] = opponentTeam.map(teamMember => {
    const hpStat = teamMember.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'hp')?.base_stat || 50;
    
    // Use existing calculated HP if available
    const existingHp = (teamMember as any).currentHp;
    const existingMaxHp = (teamMember as any).maxHp;
    
    const maxHp = existingMaxHp !== undefined ? existingMaxHp : calculateHp(hpStat, teamMember.level);
    const currentHp = existingHp !== undefined ? existingHp : maxHp;

    return {
      pokemon: teamMember.pokemon,
      level: teamMember.level,
      currentHp,
      maxHp,
      moves: teamMember.moves.map(m => ({
        id: m.name,
        pp: m.pp || 20,
        maxPp: m.pp || 20,
        disabled: false
      })),
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      },
      volatile: {}
    };
  });

  // Create teams
  const player: BattleTeam = {
    pokemon: playerBattlePokemon,
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: {
      screens: {},
      hazards: { ...EMPTY_HAZARDS },
    }
  };

  const opponent: BattleTeam = {
    pokemon: opponentBattlePokemon,
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: {
      screens: {},
      hazards: { ...EMPTY_HAZARDS },
    }
  };

  // Determine turn order based on speed of first Pokémon
  const playerSpeedStat = playerBattlePokemon[0]?.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'speed')?.base_stat || 50;
  const opponentSpeedStat = opponentBattlePokemon[0]?.pokemon.stats.find((stat: any) => (stat.stat?.name || stat.name) === 'speed')?.base_stat || 50;
  const playerSpeed = calculateStat(playerSpeedStat, playerBattlePokemon[0].level);
  const opponentSpeed = calculateStat(opponentSpeedStat, opponentBattlePokemon[0].level);

  // Faster Pokemon goes first
  const turn = playerSpeed > opponentSpeed ? 'player' : 'opponent';

  const playerCurrent = getCurrentPokemon(player);
  const opponentCurrent = getCurrentPokemon(opponent);

  return {
    player,
    opponent,
    turn: 1,
    rng: createBattleRng(),
    battleLog: [{
      type: 'battle_start',
      message: `Battle Start!\n${playerTeamName} sends out ${playerCurrent.pokemon.name}!\n${opponentTeamName} sends out ${opponentCurrent.pokemon.name}!`,
      pokemon: String(playerCurrent.pokemon.name)
    }],
    isComplete: false,
    phase: 'choice',
    actionQueue: [],
    field: createFieldState()
  };
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

  const newState = {
    ...state,
    battleLog: [...state.battleLog],
    rng: cloneBattleRng(state.rng),
  };
  newState.turn += 1;

  const queue = buildActionQueue(newState, playerAction, opponentAction);
  newState.phase = 'resolution';

  await runBattleTurnFromQueue(newState, queue, { clearBattleLog: false });

  await processReplacements(newState);

  // Check if battle is over (draw if both teams wiped same turn, same as resolveTurn)
  const playerLost = isTeamDefeated(newState.player);
  const opponentLost = isTeamDefeated(newState.opponent);
  if (playerLost && opponentLost) {
    newState.isComplete = true;
    newState.winner = undefined;
    newState.battleLog.push({
      type: 'battle_end',
      message: 'Both teams fainted! The battle is a draw!',
      turn: newState.turn
    });
  } else if (playerLost) {
    newState.isComplete = true;
    newState.winner = 'opponent';
    newState.battleLog.push({
      type: 'battle_end',
      message: 'All your Pokémon have fainted! You lost!',
      turn: newState.turn
    });
  } else if (opponentLost) {
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

function hasScreen(state: BattleState, defender: BattlePokemon, screen: 'reflect' | 'lightScreen' | 'auroraVeil'): boolean {
  const isPlayer = defender === getCurrentPokemon(state.player);
  const screens = isPlayer ? state.player.sideConditions.screens : state.opponent.sideConditions.screens;
  if (screen === 'auroraVeil') {
    return Boolean(screens.auroraVeil);
  }
  return Boolean(screens[screen]);
}
