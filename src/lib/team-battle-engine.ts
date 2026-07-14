import { Pokemon, Move } from '@/types/pokemon';
import { CompiledMove } from './adapters/pokeapiMoveAdapter';
import { getMove, getCachedMove } from './moveCache';
import { processReplacements, runBattleTurnFromQueue } from './team-battle-engine-additional';
import {
  BattleRng,
  cloneBattleRng,
  createBattleRng,
  rngRollChance,
} from './battle-rng';
import { FieldState, SideHazards, FieldSideScreens, type BattleFeatureFlags } from './team-battle-types';

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
    unburdenActive?: boolean;
    /** Flash Fire absorbed a Fire move — next Fire moves are boosted */
    flashFireActive?: boolean;
    /** Last successfully selected move id (Encore / Disable target). */
    lastMoveUsed?: string;
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

/** Moves that restore HP (used by Triage priority). */
const TRIAGE_HEALING_MOVES = new Set([
  'recover', 'soft-boiled', 'milk-drink', 'roost', 'synthesis', 'moonlight',
  'morning-sun', 'shore-up', 'slack-off', 'heal-pulse', 'life-dew', 'rest',
  'wish', 'aqua-ring', 'ingrain', 'absorb', 'mega-drain', 'giga-drain',
  'drain-punch', 'drain-kiss', 'horn-leech', 'leech-life', 'oblivion-wing',
  'parabolic-charge', 'bitter-blade', 'matcha-gotcha',
]);

const FALLBACK_PRIORITY: Record<string, number> = {
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

// Calculate move priority (higher number = higher priority); prefers cached move metadata when available
export function getMovePriority(moveId: string, pokemon?: BattlePokemon): number {
  const id = moveId.toLowerCase();
  const cached = getCachedMove(id);
  let priority = cached?.priority ?? FALLBACK_PRIORITY[id] ?? 0;

  const ability = pokemon?.currentAbility?.toLowerCase();
  if (!ability || !pokemon) return priority;

  const category = cached?.category;
  const moveType = typeof cached?.type === 'string' ? cached.type.toLowerCase() : '';

  if (ability === 'prankster' && category === 'Status') {
    priority += 1;
  }
  if (ability === 'gale-wings' && pokemon.currentHp >= pokemon.maxHp && moveType === 'flying') {
    priority += 1;
  }
  if (ability === 'triage' && TRIAGE_HEALING_MOVES.has(id)) {
    priority += 3;
  }

  return priority;
}

// Calculate effective speed for move ordering
export function isTailwindActive(side: BattleTeam): boolean {
  const t = side.sideConditions?.screens?.tailwind?.turns ?? side.sideConditions?.tailwind?.turns;
  return typeof t === 'number' && t > 0;
}

export function getEffectiveSpeed(
  pokemon: BattlePokemon,
  tailwindActive = false,
  field?: { weather?: { kind?: string }; terrain?: { kind?: string } }
): number {
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

  const ability = pokemon.currentAbility?.toLowerCase();
  const weather = field?.weather?.kind;
  const terrain = field?.terrain?.kind;
  if (ability === 'chlorophyll' && weather === 'sun') finalSpeed = Math.floor(finalSpeed * 2);
  if (ability === 'swift-swim' && weather === 'rain') finalSpeed = Math.floor(finalSpeed * 2);
  if (ability === 'sand-rush' && weather === 'sandstorm') finalSpeed = Math.floor(finalSpeed * 2);
  if (ability === 'slush-rush' && weather === 'snow') finalSpeed = Math.floor(finalSpeed * 2);
  if (ability === 'surge-surfer' && terrain === 'electric') finalSpeed = Math.floor(finalSpeed * 2);

  const item = pokemon.heldItem?.toLowerCase();
  if (item === 'choice-scarf') finalSpeed = Math.floor(finalSpeed * 1.5);
  if (item === 'iron-ball') finalSpeed = Math.floor(finalSpeed * 0.5);
  if (pokemon.volatile.unburdenActive) finalSpeed = Math.floor(finalSpeed * 2);

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
  if (pokemon.volatile.choiceLock && idLower !== 'struggle') {
    if (moveId !== pokemon.volatile.choiceLock) {
      return { canUse: false, reason: 'choice locked' };
    }
  }

  if (pokemon.volatile.taunt && pokemon.volatile.taunt.turns > 0) {
    const fullMove = getCachedMove(moveId);
    if (fullMove?.category === 'Status') {
      return { canUse: false, reason: 'taunted' };
    }
  }

  // Assault Vest: cannot select status moves
  if (pokemon.heldItem?.toLowerCase() === 'assault-vest' && idLower !== 'struggle') {
    const fullMove = getCachedMove(moveId);
    if (fullMove?.category === 'Status') {
      return { canUse: false, reason: 'assault vest' };
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
      priority: getMovePriority('pursuit', getCurrentPokemon(state.opponent)),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent), isTailwindActive(state.opponent), state.field)
    });
  }

  if (opponentAction.type === 'switch' && playerAction.type === 'move' && playerAction.moveId === 'pursuit') {
    queue.push({
      type: 'pursuit',
      user: 'player',
      moveId: 'pursuit',
      target: 'opponent',
      priority: getMovePriority('pursuit', getCurrentPokemon(state.player)),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player), isTailwindActive(state.player), state.field)
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
      priority: getMovePriority(playerAction.moveId || '', getCurrentPokemon(state.player)),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player), isTailwindActive(state.player), state.field)
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
      priority: getMovePriority(opponentAction.moveId || '', getCurrentPokemon(state.opponent)),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent), isTailwindActive(state.opponent), state.field)
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

export function getCurrentPokemon(team: BattleTeam): BattlePokemon {
  const pokemon = team.pokemon[team.currentIndex];
  if (!pokemon) {
    throw new Error(`No pokemon at index ${team.currentIndex} (team size: ${team.pokemon.length})`);
  }
  return pokemon;
}

/** Resolve which team a Pokémon belongs to (active or bench). */
export function getTeamForPokemon(
  state: BattleState,
  pokemon: BattlePokemon
): BattleTeam {
  if (state.player.pokemon.includes(pokemon)) return state.player;
  if (state.opponent.pokemon.includes(pokemon)) return state.opponent;
  if (getCurrentPokemon(state.player) === pokemon) return state.player;
  return state.opponent;
}

export function isSafeguardActive(team: BattleTeam): boolean {
  return Boolean(team.sideConditions.screens.safeguard?.turns);
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

/** Regenerator heal 1/3 and Natural Cure status clear on voluntary switch-out. */
export function applySwitchOutAbilities(pokemon: BattlePokemon): void {
  if (pokemon.currentHp <= 0) return;
  const ability = pokemon.currentAbility?.toLowerCase();
  if (ability === 'regenerator') {
    const heal = Math.floor(pokemon.maxHp / 3);
    if (heal > 0) {
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
    }
  }
  if (ability === 'natural-cure' && pokemon.status) {
    pokemon.status = undefined;
    pokemon.statusTurns = 0;
    pokemon.volatile.toxicCounter = undefined;
  }
}

/** First non-fainted bench Pokémon (skips current active). */
export function getNextAvailableBenchPokemon(team: BattleTeam): number | null {
  for (let i = 0; i < team.pokemon.length; i++) {
    if (i === team.currentIndex) continue;
    if (team.pokemon[i].currentHp > 0) return i;
  }
  return null;
}

// Function to handle automatic switching when a Pokémon faints
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

