"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  BattleState, BattlePokemon, BattleTeam, BattleAction, BattleLogEntry, PendingSwitchReason,
} from '@/lib/team-battle-engine';
import {
  buildActionQueue,
  isTeamDefeated,
  getCurrentPokemon,
  allMovesOutOfPp,
  encoredMoveHasNoPp,
} from '@/lib/team-battle-engine';
import { applyFaintReplacements, isBlockedByGravity, resumeBattleTurnAfterSwitch, runBattleTurnFromQueue, type TurnOutcome } from '@/lib/team-battle-engine-additional';
import { createBattleRng } from '@/lib/battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '@/lib/team-battle-types';
import { sanitizeBattleItem } from '@/lib/battle-items-catalog';
import { isTrapped } from '@/lib/team-battle-held-items';
import { displayShiny, displayTypes, publicBenchEntries } from '@/lib/team-battle-illusion';
import { canTerastallize, resolveTeraType } from '@/lib/team-battle-tera';
import { getCachedMove } from '@/lib/moveCache';
import { legalSlotAbility, resolveBattleAbility } from '@/lib/battle-default-ability';
import { chooseAIAction, chooseAIReplacement } from '@/lib/offline-battle-ai';
import { getPokemon } from '@/lib/api';
import type { GYM_CHAMPIONS } from '@/lib/gym_champions';
import { getForcedBattleMoveId, RECHARGE_MOVE_ID } from '@/lib/battle-multiturn';
import { maxHpFor, sanitizeEvs, type EvSpread } from '@/lib/battle-evs';
import { CHAMPION_SETS } from '@/data/champion-sets';
import { describeBattleConditions, type BattleConditions } from '@/lib/battle-conditions';

// ---------------------------------------------------------------------------
// Types that mirror what useBattleState returns
// ---------------------------------------------------------------------------

type PublicMon = {
  species: string;
  dexId?: number | null;
  level: number; types: string[];
  hp: { cur: number; max: number };
  status: null | string;
  boosts: Record<string, number>;
  volatiles?: Record<string, unknown>;
  terastallized?: boolean;
  teraType?: string;
  shiny?: boolean;
};

type PublicState = Record<string, any> & {
  field: { hazards: Record<string, any>; screens: Record<string, any> };
  battleLog?: any[];
  conditions?: BattleConditions;
  lastResultSummary?: string;
};

type Meta = {
  createdAt: number;
  format: 'singles';
  ruleSet: 'gen9-no-weather';
  players: { p1: { uid: string; name?: string }; p2: { uid: string; name?: string } };
  phase: 'choosing' | 'resolving' | 'ended';
  turn: number;
  version: number;
  deadlineAt: number;
  winnerUid: string | null;
  endedReason: null | 'forfeit' | string;
  ruleProfile?: 'simplified' | 'cart_like';
  /** Turn paused for this player to pick the Pokémon a pivot move (U-turn, Baton Pass, ...) sends in. */
  pendingSwitch?: { uid: string; reason: PendingSwitchReason | 'faint'; options?: number[] } | null;
};

type MoveEntry = { id: string; pp: number; maxPp?: number; disabled?: boolean; reason?: string };
type TeamMon = {
  species: string;
  dexId?: number | null;
  level: number; types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  item?: string; ability?: string; moves: MoveEntry[];
  status?: string | null; fainted?: boolean;
  hp?: { cur: number; max: number };
  teraType?: string | null;
  terastallized?: boolean;
  shiny?: boolean;
};

type PrivateState = { team: TeamMon[]; currentIndex?: number; teraUsed?: boolean };

type UseOfflineBattleReturn = {
  loading: boolean;
  error: string | null;
  meta: Meta | null;
  pub: PublicState | null;
  me: PrivateState | null;
  meUid: string | null;
  oppUid: string | null;
  timeLeftSec: number;
  legalMoves: Array<MoveEntry>;
  legalSwitchIndexes: number[];
  chooseMove: (moveId: string, options?: { terastallize?: boolean }) => Promise<void>;
  chooseSwitch: (idx: number) => Promise<void>;
  forfeit: () => Promise<void>;
  writeChoice: (choice: any) => Promise<void>;
  /** Whether the player can Terastallize this turn, and into what. */
  tera: { available: boolean; type: string | null };
};

// ---------------------------------------------------------------------------
// Hydration helpers (same logic as battle-resolution.ts)
// ---------------------------------------------------------------------------

function ensureVolatile(p: any): BattlePokemon['volatile'] {
  return {
    confusion: undefined, substitute: undefined, leechSeed: false, choiceLock: undefined,
    encore: undefined, taunt: undefined, disable: undefined, protect: undefined,
    perishSong: undefined, flinched: false, binding: undefined, justSwitchedIn: false,
    toxicCounter: 0, yawn: undefined, aquaRing: false, wish: undefined,
    ...(p?.volatile || {}),
  };
}

function ensureStatModifiers(p: any): BattlePokemon['statModifiers'] {
  return {
    attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0,
    accuracy: 0, evasion: 0, ...(p?.statModifiers || {}),
  };
}

async function hydrateSlot(raw: any): Promise<BattlePokemon> {
  const pokemonObj = raw.pokemon || raw;
  const pokemonId = pokemonObj.id || raw.id;
  let stats = Array.isArray(pokemonObj.stats) && pokemonObj.stats.length > 0 ? pokemonObj.stats : [];
  let types = Array.isArray(pokemonObj.types) ? pokemonObj.types : (Array.isArray(raw.types) ? raw.types : []);
  let weight = pokemonObj.weight ?? raw.weight ?? null;
  let abilities = pokemonObj.abilities || raw.abilities || [];
  let name = pokemonObj.name || raw.species || raw.name || `pokemon-${pokemonId}`;

  if (stats.length === 0 && pokemonId) {
    try {
      const apiData = await getPokemon(pokemonId);
      stats = apiData.stats || [];
      if (types.length === 0) types = apiData.types || [];
      if (weight === null) weight = apiData.weight ?? 500;
      if (abilities.length === 0) abilities = apiData.abilities || [];
      name = apiData.name || name;
    } catch { /* fallback */ }
  }

  const pokemon = {
    id: pokemonId || 0,
    name,
    types: types.map((t: any) => typeof t === 'string' ? { type: { name: t } } : t),
    stats,
    weight: weight ?? 500,
    abilities,
  };

  const moves: BattlePokemon['moves'] = Array.isArray(raw.moves)
    ? raw.moves.map((m: any) => {
        if (typeof m === 'string') return { id: m, pp: 20, maxPp: 20 };
        return { id: m.id || m.name || 'tackle', pp: m.pp ?? 20, maxPp: m.maxPp ?? m.pp ?? 20, disabled: false };
      })
    : [{ id: 'tackle', pp: 35, maxPp: 35 }];

  const level = typeof raw.level === 'number' ? raw.level : 50;
  const evs = sanitizeEvs(raw.evs);
  const chosenAbility = abilities.length ? legalSlotAbility(raw.ability, abilities) : raw.ability;
  const calculatedMaxHp = maxHpFor(stats, level, evs);
  const maxHp = typeof raw.maxHp === 'number' && raw.maxHp > 0 ? raw.maxHp : calculatedMaxHp;
  const currentHp = typeof raw.currentHp === 'number' && raw.currentHp > 0 ? raw.currentHp : maxHp;

  return {
    pokemon: pokemon as any,
    level,
    nature: raw.nature || 'hardy',
    currentHp,
    maxHp,
    moves,
    status: undefined,
    statusTurns: 0,
    volatile: ensureVolatile(raw),
    statModifiers: ensureStatModifiers(raw),
    heldItem: sanitizeBattleItem(raw.heldItem ?? raw.item),
    // A chosen ability must be one the species can have (else its first regular ability)
    currentAbility: resolveBattleAbility({ ability: chosenAbility }, abilities),
    teraType: resolveTeraType(raw.teraType, types),
    originalAbility: resolveBattleAbility({ ability: chosenAbility }, abilities),
    ...(evs ? { evs } : {}),
    ...(raw.gender === 'male' || raw.gender === 'female' || raw.gender === 'genderless' ? { gender: raw.gender } : {}),
    ...(raw.shiny === true ? { shiny: true } : {}),
  };
}

// ---------------------------------------------------------------------------
// Build Meta / Pub / Private projections from BattleState
// ---------------------------------------------------------------------------

function makePublicActive(mon: BattlePokemon): PublicMon {
  // Illusion shows the disguise (name and sprite) to the opponent
  const illusion = mon.volatile?.illusion;
  return {
    species: illusion?.species ?? mon.pokemon.name,
    dexId: illusion ? illusion.dexId ?? null : typeof mon.pokemon.id === 'number' && mon.pokemon.id > 0 ? mon.pokemon.id : null,
    level: mon.level,
    types: displayTypes(mon),
    hp: { cur: Math.max(0, mon.currentHp), max: mon.maxHp },
    status: mon.status || null,
    boosts: {
      atk: mon.statModifiers?.attack || 0,
      def: mon.statModifiers?.defense || 0,
      spa: mon.statModifiers?.specialAttack || 0,
      spd: mon.statModifiers?.specialDefense || 0,
      spe: mon.statModifiers?.speed || 0,
    },
    // Tera is public once it happens
    ...(mon.terastallized && mon.teraType ? { terastallized: true, teraType: mon.teraType } : {}),
    ...(displayShiny(mon) ? { shiny: true } : {}),
  };
}

function makeBench(team: BattleTeam) {
  // Illusion-aware: the disguised slot shows the real user
  return publicBenchEntries(team);
}

function projectPrivate(team: BattleTeam): PrivateState {
  return {
    currentIndex: team.currentIndex,
    team: team.pokemon.map(p => {
      const statVal = (name: string) => p.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === name)?.base_stat ?? 50;
      return {
        species: p.pokemon.name,
        dexId: typeof p.pokemon.id === 'number' && p.pokemon.id > 0 ? p.pokemon.id : null,
        level: p.level,
        types: (p.pokemon.types || []).map((t: any) => typeof t === 'string' ? t : t.type?.name || t.name || 'normal'),
        stats: { hp: p.maxHp, atk: statVal('attack'), def: statVal('defense'), spa: statVal('special-attack'), spd: statVal('special-defense'), spe: statVal('speed') },
        moves: p.moves.map(m => ({ id: m.id, pp: m.pp, maxPp: m.maxPp })),
        status: p.status || null,
        fainted: p.currentHp <= 0,
        hp: { cur: Math.max(0, p.currentHp), max: p.maxHp },
        teraType: p.teraType ?? null,
        terastallized: !!p.terastallized,
        ...(p.shiny ? { shiny: true } : {}),
      };
    }),
    teraUsed: !!team.teraUsed,
  };
}

function projectPublic(state: BattleState): PublicState {
  const p1Active = getCurrentPokemon(state.player);
  const p2Active = getCurrentPokemon(state.opponent);
  return {
    field: {
      hazards: { p1: state.player.sideConditions.hazards, p2: state.opponent.sideConditions.hazards },
      screens: { p1: state.player.sideConditions.screens, p2: state.opponent.sideConditions.screens },
    },
    battleLog: state.battleLog,
    conditions: describeBattleConditions(state),
    lastResultSummary: state.battleLog.map(l => l.message).join(' '),
    p1: { active: makePublicActive(p1Active), benchPublic: makeBench(state.player) },
    p2: { active: makePublicActive(p2Active), benchPublic: makeBench(state.opponent) },
  };
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

/**
 * AI Terastallizes when its chosen move matches its Tera Type (offensive Tera),
 * or when its active Pokémon is the last one standing.
 */
function aiShouldTerastallize(state: BattleState, moveId: string | undefined): boolean {
  if (!moveId || !canTerastallize(state, state.opponent)) return false;
  const active = getCurrentPokemon(state.opponent);
  const moveType = String(getCachedMove(moveId)?.type ?? '').toLowerCase();
  if (moveType && moveType === active.teraType?.toLowerCase()) return true;
  return state.opponent.pokemon.filter((p) => p.currentHp > 0).length === 1;
}

const PLAYER_UID = 'offline-player';
const AI_UID = 'offline-ai';

/** A team slot as stored for battle (team builder / battle setup). */
export type OfflineTeamSlot = {
  id: number;
  level?: number;
  moves?: string[];
  nature?: string;
  teraType?: string;
  heldItem?: string;
  evs?: EvSpread;
  gender?: 'male' | 'female' | 'genderless';
  ability?: string;
  shiny?: boolean;
};

function storedSlot(s: any): OfflineTeamSlot {
  const item = sanitizeBattleItem(s.heldItem ?? s.item);
  const evs = sanitizeEvs(s.evs);
  return {
    id: Number(s.id),
    level: typeof s.level === 'number' ? s.level : 50,
    moves: Array.isArray(s.moves)
      ? s.moves.slice(0, 4).map((m: any) => typeof m === 'string' ? m : m?.name || m?.id).filter(Boolean) as string[]
      : undefined,
    nature: typeof s.nature === 'string' ? s.nature : undefined,
    // Team-builder choices: Tera Type, held item, EVs, gender
    ...(typeof s.teraType === 'string' ? { teraType: s.teraType } : {}),
    ...(item ? { heldItem: item } : {}),
    ...(evs ? { evs } : {}),
    ...(s.gender === 'male' || s.gender === 'female' || s.gender === 'genderless' ? { gender: s.gender } : {}),
    ...(typeof s.ability === 'string' && s.ability ? { ability: s.ability } : {}),
    // The team builder saves isShiny; battle setup passes shiny
    ...(s.shiny === true || s.isShiny === true ? { shiny: true } : {}),
  };
}

function loadPlayerTeamFromStorage(): OfflineTeamSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('pokemon-current-team');
    if (raw) {
      const parsed = JSON.parse(raw);
      const team = (Array.isArray(parsed) ? parsed : [])
        .filter((s: any) => s && s.id != null)
        .map(storedSlot);
      if (team.length > 0) return team;
    }
    const savedRaw = localStorage.getItem('pokemon-team-builder');
    if (savedRaw) {
      const teams = JSON.parse(savedRaw);
      const first = Array.isArray(teams) ? teams[0] : null;
      if (first?.slots) {
        return first.slots
          .filter((s: any) => s && s.id != null)
          .map(storedSlot);
      }
    }
  } catch { /* ignore */ }
  return [];
}

export interface OfflineBattleConfig {
  playerTeam?: OfflineTeamSlot[];
  opponentChampion: (typeof GYM_CHAMPIONS)[number];
}

export function useOfflineBattleState(config: OfflineBattleConfig | null): UseOfflineBattleReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [pub, setPub] = useState<PublicState | null>(null);
  const [me, setMe] = useState<PrivateState | null>(null);
  const resolving = useRef(false);
  const initialized = useRef(false);

  // Initialise battle
  useEffect(() => {
    if (!config || initialized.current) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        let rawTeam = config.playerTeam;
        if (!rawTeam || rawTeam.length === 0) {
          rawTeam = loadPlayerTeamFromStorage();
        }
        if (!rawTeam || rawTeam.length === 0) {
          throw new Error('No player team found. Please build a team first.');
        }

        const playerSlots = await Promise.all(
          rawTeam.map(async (slot) => {
            const moves = (slot.moves || []).map(name => ({ id: name || 'tackle', name: name || 'tackle', pp: 20, maxPp: 20 }));
            return hydrateSlot({
              id: slot.id, level: slot.level || 50, moves, nature: slot.nature,
              teraType: slot.teraType, heldItem: slot.heldItem, evs: slot.evs, gender: slot.gender,
              ability: slot.ability, shiny: slot.shiny,
            });
          }),
        );
        if (cancelled) return;

        // Curated sets for leaders at level 30+ (moves, ability, item, nature, EVs, Tera Type);
        // early leaders keep level-up moves and no items, as in the games
        const championSets = CHAMPION_SETS[config.opponentChampion.id] ?? [];
        const championSlots = await Promise.all(
          config.opponentChampion.team.slots.map(async (slot, i) => {
            const set = championSets[i];
            return hydrateSlot({
              id: slot.id,
              level: slot.level || 50,
              ...(set?.moves ? { moves: set.moves.map((id) => ({ id, pp: 20, maxPp: 20 })) } : {}),
              ...(set?.ability ? { ability: set.ability } : {}),
              ...(set?.item ? { heldItem: set.item } : {}),
              ...(set ? { nature: set.nature, evs: set.evs } : {}),
              ...(set?.teraType ? { teraType: set.teraType } : {}),
            });
          }),
        );
        if (cancelled) return;

        for (const slot of championSlots) {
          if (slot.moves.length <= 1 && slot.moves[0]?.id === 'tackle') {
            try {
              const apiData = await getPokemon(slot.pokemon.id);
              if (cancelled) return;
              const learnedMoves = (apiData.moves || [])
                .filter((m: any) => {
                  const vg = m.version_group_details || [];
                  return vg.some((d: any) => d.move_learn_method?.name === 'level-up' && (d.level_learned_at || 0) <= slot.level);
                })
                .map((m: any) => m.move?.name)
                .filter(Boolean)
                .slice(-4);
              if (learnedMoves.length > 0) {
                slot.moves = learnedMoves.map((name: string) => ({ id: name, pp: 20, maxPp: 20 }));
              }
            } catch { /* keep tackle */ }
          }
        }
        if (cancelled) return;

        const playerTeam: BattleTeam = {
          pokemon: playerSlots,
          currentIndex: 0,
          faintedCount: 0,
          sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
        };

        const opponentTeam: BattleTeam = {
          pokemon: championSlots,
          currentIndex: 0,
          faintedCount: 0,
          sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
        };

        const state: BattleState = {
          player: playerTeam,
          opponent: opponentTeam,
          turn: 1,
          rng: createBattleRng(Date.now()),
          battleLog: [{ type: 'battle_start', message: `Battle against ${config.opponentChampion.name} begins!` }],
          isComplete: false,
          phase: 'selection',
          actionQueue: [],
          field: createFieldState(),
        };

        const metaObj: Meta = {
          createdAt: Date.now(),
          format: 'singles',
          ruleSet: 'gen9-no-weather',
          players: {
            p1: { uid: PLAYER_UID, name: 'You' },
            p2: { uid: AI_UID, name: config.opponentChampion.name },
          },
          phase: 'choosing',
          turn: 1,
          version: 1,
          deadlineAt: Date.now() + 120_000,
          winnerUid: null,
          endedReason: null,
          ruleProfile: 'simplified',
        };

        setBattleState(state);
        setMeta(metaObj);
        setPub(projectPublic(state));
        setMe(projectPrivate(state.player));
        setLoading(false);
        initialized.current = true;
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Offline battle init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize battle');
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [config]);

  // ---------------------------------------------------------------------------
  // Turn resolution (runs the same engine as multiplayer)
  // ---------------------------------------------------------------------------

  /** Publish engine state after a turn slice: either paused for the player's pivot pick or finished. */
  const publishTurnOutcome = useCallback((
    state: BattleState,
    currentMeta: Meta,
    outcome: TurnOutcome,
    opts: { turnAlreadyAdvanced?: boolean } = {},
  ) => {
    const playerReplacement = state.pendingReplacements?.find((r) => r.side === 'player');
    if (outcome === 'awaiting-replacement' && playerReplacement) {
      // Turn is over; the player picks the next Pokémon before the next turn starts
      const pickMeta: Meta = {
        ...currentMeta,
        turn: opts.turnAlreadyAdvanced ? currentMeta.turn : currentMeta.turn + 1,
        phase: 'choosing',
        version: currentMeta.version + 1,
        pendingSwitch: { uid: PLAYER_UID, reason: 'faint', options: playerReplacement.options },
        deadlineAt: Date.now() + 120_000,
      };
      setBattleState({ ...state });
      setMeta(pickMeta);
      setPub(projectPublic(state));
      setMe(projectPrivate(state.player));
      return;
    }
    if (outcome === 'awaiting-switch' && state.pendingSwitch) {
      // Same turn continues once the player picks; bump version so the UI treats it as a fresh choice
      const pausedMeta: Meta = {
        ...currentMeta,
        phase: 'choosing',
        version: currentMeta.version + 1,
        pendingSwitch: { uid: PLAYER_UID, reason: state.pendingSwitch.reason, options: state.pendingSwitch.options },
        deadlineAt: Date.now() + 120_000,
      };
      setBattleState({ ...state });
      setMeta(pausedMeta);
      setPub(projectPublic(state));
      setMe(projectPrivate(state.player));
      return;
    }

    // Check win condition
    if (isTeamDefeated(state.player)) {
      state.isComplete = true;
      state.winner = 'opponent';
      state.battleLog.push({ type: 'battle_end', message: `${currentMeta.players.p2.name} won!` });
    } else if (isTeamDefeated(state.opponent)) {
      state.isComplete = true;
      state.winner = 'player';
      state.battleLog.push({ type: 'battle_end', message: 'You won!' });
    }

    const updatedMeta: Meta = {
      ...currentMeta,
      turn: opts.turnAlreadyAdvanced ? currentMeta.turn : currentMeta.turn + 1,
      version: currentMeta.version + 1,
      phase: state.isComplete ? 'ended' : 'choosing',
      winnerUid: state.isComplete ? (state.winner === 'player' ? PLAYER_UID : AI_UID) : null,
      deadlineAt: Date.now() + 120_000,
      pendingSwitch: null,
    };

    setBattleState({ ...state });
    setMeta(updatedMeta);
    setPub(projectPublic(state));
    setMe(projectPrivate(state.player));
  }, []);

  const resolveTurnLocally = useCallback(async (
    state: BattleState,
    currentMeta: Meta,
    playerAction: BattleAction,
  ) => {
    if (resolving.current) return;
    resolving.current = true;

    try {
      // AI chooses its action (and, during the turn, which Pokémon it sends in)
      state.autoSwitchPicker = chooseAIReplacement;
      const aiAction = await chooseAIAction(state, 'opponent');
      const opponentAction: BattleAction = aiAction.type === 'move'
        ? { type: 'move', moveId: aiAction.moveId, target: 'player', ...(aiShouldTerastallize(state, aiAction.moveId) ? { terastallize: true } : {}) }
        : { type: 'switch', switchIndex: aiAction.switchIndex!, target: 'player' };

      // Set resolving phase
      const newMeta = { ...currentMeta, phase: 'resolving' as const };
      setMeta(newMeta);

      // Turn-based effects (Retaliate, Future Sight) read the engine's turn counter
      state.turn = currentMeta.turn;
      const queue = buildActionQueue(state, playerAction, opponentAction);
      // The player picks their own pivot replacements; the AI sends in its next healthy Pokémon
      const outcome = await runBattleTurnFromQueue(state, queue, { clearBattleLog: true, manualSwitchSides: ['player'] });
      publishTurnOutcome(state, currentMeta, outcome);
    } catch (err: unknown) {
      console.error('Offline battle resolution error:', err);
      setError(err instanceof Error ? err.message : 'Battle resolution failed');
    } finally {
      resolving.current = false;
    }
  }, [publishTurnOutcome]);

  /** Send in the player's pick for a fainted active Pokémon (the turn already ended). */
  const applyReplacementLocally = useCallback(async (state: BattleState, currentMeta: Meta, switchIndex: number) => {
    if (resolving.current) return;
    resolving.current = true;
    try {
      state.battleLog = [];
      state.autoSwitchPicker = chooseAIReplacement;
      const outcome = await applyFaintReplacements(state, { player: switchIndex });
      publishTurnOutcome(state, currentMeta, outcome, { turnAlreadyAdvanced: true });
    } catch (err: unknown) {
      console.error('Offline replacement error:', err);
      setError(err instanceof Error ? err.message : 'Battle resolution failed');
    } finally {
      resolving.current = false;
    }
  }, [publishTurnOutcome]);

  /** Continue a turn paused for the player's U-turn / Baton Pass replacement. */
  const resumeTurnLocally = useCallback(async (state: BattleState, currentMeta: Meta, switchIndex: number) => {
    if (resolving.current) return;
    resolving.current = true;
    try {
      setMeta({ ...currentMeta, phase: 'resolving' });
      state.autoSwitchPicker = chooseAIReplacement;
      const outcome = await resumeBattleTurnAfterSwitch(state, switchIndex, { manualSwitchSides: ['player'] });
      publishTurnOutcome(state, currentMeta, outcome);
    } catch (err: unknown) {
      console.error('Offline battle resume error:', err);
      setError(err instanceof Error ? err.message : 'Battle resolution failed');
    } finally {
      resolving.current = false;
    }
  }, [publishTurnOutcome]);

  // ---------------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------------

  const chooseMove = useCallback(async (moveId: string, options?: { terastallize?: boolean }) => {
    if (!battleState || !meta || meta.phase !== 'choosing') return;
    if (battleState.pendingSwitch || battleState.pendingReplacements?.length) return; // only a switch answers a pick prompt
    const terastallize = !!options?.terastallize && canTerastallize(battleState, battleState.player);
    const action: BattleAction = { type: 'move', moveId, target: 'opponent', ...(terastallize ? { terastallize } : {}) };
    await resolveTurnLocally(battleState, meta, action);
  }, [battleState, meta, resolveTurnLocally]);

  const chooseSwitch = useCallback(async (idx: number) => {
    if (!battleState || !meta || meta.phase !== 'choosing') return;
    if (battleState.pendingReplacements?.length) {
      await applyReplacementLocally(battleState, meta, idx);
      return;
    }
    if (battleState.pendingSwitch) {
      await resumeTurnLocally(battleState, meta, idx);
      return;
    }
    const action: BattleAction = { type: 'switch', switchIndex: idx, target: 'opponent' };
    await resolveTurnLocally(battleState, meta, action);
  }, [battleState, meta, resolveTurnLocally, resumeTurnLocally, applyReplacementLocally]);

  const forfeit = useCallback(async () => {
    if (!meta) return;
    setMeta(prev => prev ? { ...prev, phase: 'ended', winnerUid: AI_UID, endedReason: 'forfeit' } : prev);
  }, [meta]);

  // ---------------------------------------------------------------------------
  // Derived legality
  // ---------------------------------------------------------------------------

  const legalMoves = useMemo(() => {
    if (!battleState) return [];
    if (battleState.pendingSwitch || battleState.pendingReplacements?.length) return [];
    const active = getCurrentPokemon(battleState.player);
    const forced = getForcedBattleMoveId(active);
    if (forced) {
      if (forced === RECHARGE_MOVE_ID) {
        return [{ id: RECHARGE_MOVE_ID, pp: 1, maxPp: 1 }];
      }
      const slot = active.moves.find(m => m.id === forced);
      return [{ id: forced, pp: slot?.pp ?? 1, maxPp: slot?.maxPp ?? 1 }];
    }
    const profile = meta?.ruleProfile ?? 'simplified';
    if (allMovesOutOfPp(active) || (profile === 'simplified' && encoredMoveHasNoPp(active))) {
      return [{ id: 'struggle', pp: 1, maxPp: 1 }];
    }
    return active.moves.filter(m => m.pp > 0 && !m.disabled).map(m => ({
      id: m.id, pp: m.pp, maxPp: m.maxPp,
      ...(isBlockedByGravity(battleState, m.id) ? { disabled: true, reason: 'Gravity' } : {}),
    }));
  }, [battleState, meta?.ruleProfile]);

  const legalSwitchIndexes = useMemo(() => {
    if (!battleState) return [];
    if (battleState.pendingSwitch) return battleState.pendingSwitch.options;
    const replacement = battleState.pendingReplacements?.find((r) => r.side === 'player');
    if (replacement) return replacement.options;
    const active = getCurrentPokemon(battleState.player);
    if (getForcedBattleMoveId(active)) return [];
    // Bound / Mean Look / Shadow Tag and co. (Shed Shell holders and Ghost types can still switch)
    if (isTrapped(active, getCurrentPokemon(battleState.opponent))) return [];
    return battleState.player.pokemon
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => i !== battleState.player.currentIndex && p.currentHp > 0)
      .map(({ i }) => i);
  }, [battleState]);

  const tera = useMemo(() => {
    if (!battleState || battleState.pendingSwitch || battleState.pendingReplacements?.length) {
      return { available: false, type: null as string | null };
    }
    const active = getCurrentPokemon(battleState.player);
    return { available: canTerastallize(battleState, battleState.player), type: active.teraType ?? null };
  }, [battleState]);

  return {
    loading,
    error,
    meta,
    pub,
    me,
    tera,
    meUid: PLAYER_UID,
    oppUid: AI_UID,
    timeLeftSec: 120,
    legalMoves,
    legalSwitchIndexes,
    chooseMove,
    chooseSwitch,
    forfeit,
    writeChoice: async () => {},
  };
}
