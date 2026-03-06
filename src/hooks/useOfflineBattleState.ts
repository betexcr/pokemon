"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  BattleState, BattlePokemon, BattleTeam, BattleAction, BattleLogEntry,
} from '@/lib/team-battle-engine';
import {
  buildActionQueue, isTeamDefeated, getNextAvailablePokemon, getCurrentPokemon,
} from '@/lib/team-battle-engine';
import { processStartOfTurn, processEndOfTurn, resolveMove, resolveSwitch } from '@/lib/team-battle-engine-additional';
import { createBattleRng } from '@/lib/battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '@/lib/team-battle-types';
import { chooseAIAction } from '@/lib/offline-battle-ai';
import { getPokemon } from '@/lib/api';
import type { GYM_CHAMPIONS } from '@/lib/gym_champions';

// ---------------------------------------------------------------------------
// Types that mirror what useBattleState returns
// ---------------------------------------------------------------------------

type PublicMon = {
  species: string; level: number; types: string[];
  hp: { cur: number; max: number };
  status: null | string;
  boosts: Record<string, number>;
  volatiles?: Record<string, unknown>;
};

type PublicState = Record<string, any> & {
  field: { hazards: Record<string, any>; screens: Record<string, any> };
  battleLog?: any[];
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
};

type MoveEntry = { id: string; pp: number; maxPp?: number; disabled?: boolean; reason?: string };
type TeamMon = {
  species: string; level: number; types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  item?: string; ability?: string; moves: MoveEntry[];
  status?: string | null; fainted?: boolean;
  hp?: { cur: number; max: number };
};

type PrivateState = { team: TeamMon[]; currentIndex?: number };

export type UseOfflineBattleReturn = {
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
  chooseMove: (moveId: string) => Promise<void>;
  chooseSwitch: (idx: number) => Promise<void>;
  forfeit: () => Promise<void>;
  writeChoice: (choice: any) => Promise<void>;
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

  const hpStat = stats.find((s: any) => (s.stat?.name || s.name) === 'hp');
  const baseHp = hpStat?.base_stat ?? 50;
  const level = typeof raw.level === 'number' ? raw.level : 50;
  const calculatedMaxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
  const maxHp = typeof raw.maxHp === 'number' && raw.maxHp > 0 ? raw.maxHp : calculatedMaxHp;
  const currentHp = typeof raw.currentHp === 'number' ? raw.currentHp : maxHp;

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
    heldItem: raw.heldItem || undefined,
  };
}

// ---------------------------------------------------------------------------
// Build Meta / Pub / Private projections from BattleState
// ---------------------------------------------------------------------------

function makePublicActive(mon: BattlePokemon): PublicMon {
  return {
    species: mon.pokemon.name,
    level: mon.level,
    types: (mon.pokemon.types || []).map((t: any) => typeof t === 'string' ? t : t.type?.name || t.name || 'normal'),
    hp: { cur: Math.max(0, mon.currentHp), max: mon.maxHp },
    status: mon.status || null,
    boosts: {
      atk: mon.statModifiers?.attack || 0,
      def: mon.statModifiers?.defense || 0,
      spa: mon.statModifiers?.specialAttack || 0,
      spd: mon.statModifiers?.specialDefense || 0,
      spe: mon.statModifiers?.speed || 0,
    },
  };
}

function makeBench(team: BattleTeam) {
  return team.pokemon.filter((_, i) => i !== team.currentIndex).map(mon => ({
    species: mon.pokemon.name,
    fainted: mon.currentHp <= 0,
    revealedMoves: mon.moves.map(m => m.id).slice(0, 4),
  }));
}

function projectPrivate(team: BattleTeam): PrivateState {
  return {
    currentIndex: team.currentIndex,
    team: team.pokemon.map(p => {
      const statVal = (name: string) => p.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === name)?.base_stat ?? 50;
      return {
        species: p.pokemon.name,
        level: p.level,
        types: (p.pokemon.types || []).map((t: any) => typeof t === 'string' ? t : t.type?.name || t.name || 'normal'),
        stats: { hp: p.maxHp, atk: statVal('attack'), def: statVal('defense'), spa: statVal('special-attack'), spd: statVal('special-defense'), spe: statVal('speed') },
        moves: p.moves.map(m => ({ id: m.id, pp: m.pp, maxPp: m.maxPp })),
        status: p.status || null,
        fainted: p.currentHp <= 0,
        hp: { cur: Math.max(0, p.currentHp), max: p.maxHp },
      };
    }),
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
    lastResultSummary: state.battleLog.map(l => l.message).join(' '),
    p1: { active: makePublicActive(p1Active), benchPublic: makeBench(state.player) },
    p2: { active: makePublicActive(p2Active), benchPublic: makeBench(state.opponent) },
  };
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

const PLAYER_UID = 'offline-player';
const AI_UID = 'offline-ai';

function loadPlayerTeamFromStorage(): Array<{ id: number; level?: number; moves?: string[]; nature?: string }> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('pokemon-current-team');
    if (raw) {
      const parsed = JSON.parse(raw);
      const team = (Array.isArray(parsed) ? parsed : [])
        .filter((s: any) => s && s.id != null)
        .map((s: any) => ({
          id: Number(s.id),
          level: typeof s.level === 'number' ? s.level : 50,
          moves: Array.isArray(s.moves)
            ? s.moves.slice(0, 4).map((m: any) => typeof m === 'string' ? m : m?.name || m?.id).filter(Boolean) as string[]
            : undefined,
          nature: typeof s.nature === 'string' ? s.nature : undefined,
        }));
      if (team.length > 0) return team;
    }
    const savedRaw = localStorage.getItem('pokemon-team-builder');
    if (savedRaw) {
      const teams = JSON.parse(savedRaw);
      const first = Array.isArray(teams) ? teams[0] : null;
      if (first?.slots) {
        return first.slots
          .filter((s: any) => s && s.id != null)
          .map((s: any) => ({
            id: Number(s.id),
            level: typeof s.level === 'number' ? s.level : 50,
            moves: Array.isArray(s.moves)
              ? s.moves.slice(0, 4).map((m: any) => typeof m === 'string' ? m : m?.name || m?.id).filter(Boolean) as string[]
              : undefined,
            nature: typeof s.nature === 'string' ? s.nature : undefined,
          }));
      }
    }
  } catch { /* ignore */ }
  return [];
}

export interface OfflineBattleConfig {
  playerTeam?: Array<{ id: number; level?: number; moves?: string[]; nature?: string }>;
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
    initialized.current = true;

    (async () => {
      try {
        setLoading(true);

        // Resolve player team: use provided team or load from localStorage
        let rawTeam = config.playerTeam;
        if (!rawTeam || rawTeam.length === 0) {
          rawTeam = loadPlayerTeamFromStorage();
        }
        if (!rawTeam || rawTeam.length === 0) {
          throw new Error('No player team found. Please build a team first.');
        }

        // Hydrate player team
        const playerSlots = await Promise.all(
          rawTeam.map(async (slot) => {
            const moves = (slot.moves || []).map(name => ({ id: name || 'tackle', name: name || 'tackle', pp: 20, maxPp: 20 }));
            return hydrateSlot({ id: slot.id, level: slot.level || 50, moves, nature: slot.nature });
          }),
        );

        // Hydrate champion team
        const championSlots = await Promise.all(
          config.opponentChampion.team.slots.map(async (slot) => {
            return hydrateSlot({ id: slot.id, level: slot.level || 50 });
          }),
        );

        // Give champion Pokemon auto-generated moves from PokeAPI
        for (const slot of championSlots) {
          if (slot.moves.length <= 1 && slot.moves[0]?.id === 'tackle') {
            try {
              const apiData = await getPokemon(slot.pokemon.id);
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
        };

        setBattleState(state);
        setMeta(metaObj);
        setPub(projectPublic(state));
        setMe(projectPrivate(state.player));
        setLoading(false);
      } catch (err: any) {
        console.error('Offline battle init error:', err);
        setError(err.message || 'Failed to initialize battle');
        setLoading(false);
      }
    })();
  }, [config]);

  // ---------------------------------------------------------------------------
  // Turn resolution (runs the same engine as multiplayer)
  // ---------------------------------------------------------------------------

  const resolveTurnLocally = useCallback(async (
    state: BattleState,
    currentMeta: Meta,
    playerAction: BattleAction,
  ) => {
    if (resolving.current) return;
    resolving.current = true;

    try {
      // AI chooses its action
      const aiAction = chooseAIAction(state.opponent, state.player);
      const opponentAction: BattleAction = aiAction.type === 'move'
        ? { type: 'move', moveId: aiAction.moveId, target: 'player' }
        : { type: 'switch', switchIndex: aiAction.switchIndex!, target: 'player' };

      // Set resolving phase
      const newMeta = { ...currentMeta, phase: 'resolving' as const };
      setMeta(newMeta);

      // Build action queue (same as battle-resolution.ts)
      const queue = buildActionQueue(state, playerAction, opponentAction);
      state.actionQueue = queue;
      state.battleLog = [];

      // Process start of turn
      await processStartOfTurn(state);

      // Execute actions
      for (const action of queue) {
        if (action.type === 'switch') {
          await resolveSwitch(state, action);
        } else if (action.type === 'move' && action.moveId) {
          await resolveMove(state, action);
        }

        state.player.faintedCount = state.player.pokemon.filter(p => p.currentHp <= 0).length;
        state.opponent.faintedCount = state.opponent.pokemon.filter(p => p.currentHp <= 0).length;

        if (isTeamDefeated(state.player) || isTeamDefeated(state.opponent)) break;
      }

      // End of turn
      await processEndOfTurn(state);

      // Auto-replace fainted Pokemon
      const p1Active = getCurrentPokemon(state.player);
      if (p1Active.currentHp <= 0) {
        const nextIdx = getNextAvailablePokemon(state.player);
        if (nextIdx !== null && nextIdx !== state.player.currentIndex) {
          state.player.currentIndex = nextIdx;
          const np = getCurrentPokemon(state.player);
          state.battleLog.push({ type: 'pokemon_sent_out', message: `Go! ${np.pokemon.name}!`, pokemon: np.pokemon.name });
        }
      }
      const p2Active = getCurrentPokemon(state.opponent);
      if (p2Active.currentHp <= 0) {
        const nextIdx = getNextAvailablePokemon(state.opponent);
        if (nextIdx !== null && nextIdx !== state.opponent.currentIndex) {
          state.opponent.currentIndex = nextIdx;
          const np = getCurrentPokemon(state.opponent);
          state.battleLog.push({ type: 'pokemon_sent_out', message: `Go! ${np.pokemon.name}!`, pokemon: np.pokemon.name });
        }
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

      // Update all state
      const updatedMeta: Meta = {
        ...currentMeta,
        turn: currentMeta.turn + 1,
        version: currentMeta.version + 1,
        phase: state.isComplete ? 'ended' : 'choosing',
        winnerUid: state.isComplete ? (state.winner === 'player' ? PLAYER_UID : AI_UID) : null,
        deadlineAt: Date.now() + 120_000,
      };

      setBattleState({ ...state });
      setMeta(updatedMeta);
      setPub(projectPublic(state));
      setMe(projectPrivate(state.player));
    } catch (err: any) {
      console.error('Offline battle resolution error:', err, err.stack);
      setError(err.message);
    } finally {
      resolving.current = false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------------

  const chooseMove = useCallback(async (moveId: string) => {
    if (!battleState || !meta || meta.phase !== 'choosing') return;
    const action: BattleAction = { type: 'move', moveId, target: 'opponent' };
    await resolveTurnLocally(battleState, meta, action);
  }, [battleState, meta, resolveTurnLocally]);

  const chooseSwitch = useCallback(async (idx: number) => {
    if (!battleState || !meta || meta.phase !== 'choosing') return;
    const action: BattleAction = { type: 'switch', switchIndex: idx, target: 'opponent' };
    await resolveTurnLocally(battleState, meta, action);
  }, [battleState, meta, resolveTurnLocally]);

  const forfeit = useCallback(async () => {
    if (!meta) return;
    setMeta(prev => prev ? { ...prev, phase: 'ended', winnerUid: AI_UID, endedReason: 'forfeit' } : prev);
  }, [meta]);

  // ---------------------------------------------------------------------------
  // Derived legality
  // ---------------------------------------------------------------------------

  const legalMoves = useMemo(() => {
    if (!battleState) return [];
    const active = getCurrentPokemon(battleState.player);
    return active.moves.filter(m => m.pp > 0 && !m.disabled).map(m => ({
      id: m.id, pp: m.pp, maxPp: m.maxPp,
    }));
  }, [battleState]);

  const legalSwitchIndexes = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.pokemon
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => i !== battleState.player.currentIndex && p.currentHp > 0)
      .map(({ i }) => i);
  }, [battleState]);

  return {
    loading,
    error,
    meta,
    pub,
    me,
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
