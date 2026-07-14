import { createBattleRng, battleRngToStored } from '@/lib/battle-rng';
import type { RtdbOps } from '@/lib/rtdb-access';

const TURN_DEADLINE_MS = 30_000;

function extractSpeciesName(pokemon: any): string {
  if (!pokemon) return 'unknown';
  if (typeof pokemon.species === 'string') return pokemon.species;
  if (pokemon.pokemon?.name) return pokemon.pokemon.name;
  if (typeof pokemon.id === 'number') return `pokemon-${pokemon.id}`;
  return 'unknown';
}

function extractTypes(pokemon: any): string[] {
  if (!pokemon) return ['normal'];
  if (Array.isArray(pokemon.types)) {
    return pokemon.types.map((t: any) => (typeof t === 'string' ? t : t?.type?.name)).filter(Boolean);
  }
  if (Array.isArray(pokemon.pokemon?.types)) {
    return pokemon.pokemon.types.map((t: any) => (typeof t === 'string' ? t : t?.type?.name)).filter(Boolean);
  }
  return ['normal'];
}

function createPublicPokemonData(pokemon: any) {
  if (!pokemon) {
    return {
      species: 'unknown',
      level: 1,
      types: ['normal'],
      hp: { cur: 1, max: 1 },
      status: null,
      boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
      itemKnown: false,
      abilityKnown: false,
    };
  }

  const speciesName = extractSpeciesName(pokemon);
  const level = typeof pokemon.level === 'number' ? pokemon.level : 50;
  const types = extractTypes(pokemon);

  let maxHp: number;
  if (typeof pokemon.maxHp === 'number') {
    maxHp = pokemon.maxHp;
  } else if (pokemon.pokemon?.stats || pokemon.stats) {
    const stats = pokemon.pokemon?.stats || pokemon.stats;
    const hpStat = Array.isArray(stats)
      ? stats.find((s: any) => s.stat?.name === 'hp' || s.name === 'hp')
      : stats.hp;
    const baseHp =
      typeof hpStat?.base_stat === 'number' ? hpStat.base_stat : typeof hpStat === 'number' ? hpStat : 50;
    maxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
  } else {
    maxHp = 100;
  }

  const currentHp = typeof pokemon.currentHp === 'number' ? pokemon.currentHp : maxHp;

  return {
    species: speciesName,
    level,
    types,
    hp: { cur: currentHp, max: maxHp },
    status: pokemon.status || null,
    boosts: {
      atk: pokemon.statModifiers?.attack || 0,
      def: pokemon.statModifiers?.defense || 0,
      spa: pokemon.statModifiers?.specialAttack || 0,
      spd: pokemon.statModifiers?.specialDefense || 0,
      spe: pokemon.statModifiers?.speed || 0,
      acc: pokemon.statModifiers?.accuracy || 0,
      eva: pokemon.statModifiers?.evasion || 0,
    },
    itemKnown: false,
    abilityKnown: false,
  };
}

function createBenchPublic(pokemon: any) {
  const species = extractSpeciesName(pokemon);
  return {
    species,
    fainted: Boolean(pokemon?.fainted),
    revealedMoves: Array.isArray(pokemon?.moves)
      ? pokemon.moves
          .slice(0, 4)
          .map((m: any) => (typeof m === 'string' ? m : m?.name || m?.id))
          .filter(Boolean)
      : [],
  };
}

export type CreateRtdbBattleParams = {
  battleId: string;
  p1Uid: string;
  p1Name: string;
  p1Team: any[];
  p2Uid: string;
  p2Name: string;
  p2Team: any[];
  turnDeadlineMs?: number;
};

/**
 * Authoritative RTDB battle bootstrap. Must run with Admin (or elevated) ops.
 */
export async function writeRtdbBattle(ops: RtdbOps, params: CreateRtdbBattleParams): Promise<void> {
  const {
    battleId,
    p1Uid,
    p1Name,
    p1Team,
    p2Uid,
    p2Name,
    p2Team,
    turnDeadlineMs = TURN_DEADLINE_MS,
  } = params;

  if (!battleId || !p1Uid || !p2Uid) {
    throw new Error('Missing battle or player identity');
  }
  if (!Array.isArray(p1Team) || p1Team.length === 0 || !Array.isArray(p2Team) || p2Team.length === 0) {
    throw new Error('Both players need a non-empty team');
  }

  const now = Date.now();
  const initialRng = createBattleRng(now);

  const meta = {
    createdAt: now,
    format: 'singles',
    ruleSet: 'gen9-no-weather',
    region: 'global',
    players: {
      p1: { uid: p1Uid, name: p1Name },
      p2: { uid: p2Uid, name: p2Name },
    },
    phase: 'choosing',
    turn: 1,
    deadlineAt: now + turnDeadlineMs,
    version: 1,
    ruleProfile: 'simplified',
  };

  const serverState = {
    battleRng: battleRngToStored(initialRng),
  };

  const publicState = {
    field: {
      hazards: {
        p1: { sr: false, spikes: 0, tSpikes: 0, web: false },
        p2: { sr: false, spikes: 0, tSpikes: 0, web: false },
      },
      screens: {
        p1: { reflect: 0, lightScreen: 0, auroraVeil: 0 },
        p2: { reflect: 0, lightScreen: 0, auroraVeil: 0 },
      },
      rooms: {},
    },
    p1: {
      active: createPublicPokemonData(p1Team[0]),
      benchPublic: p1Team.slice(1).map((pokemon: any) => createBenchPublic(pokemon)),
    },
    p2: {
      active: createPublicPokemonData(p2Team[0]),
      benchPublic: p2Team.slice(1).map((pokemon: any) => createBenchPublic(pokemon)),
    },
    lastResultSummary: '',
  };

  const p1Private = {
    team: JSON.parse(JSON.stringify(p1Team)),
    currentIndex: 0,
    choiceLock: {},
  };
  const p2Private = {
    team: JSON.parse(JSON.stringify(p2Team)),
    currentIndex: 0,
    choiceLock: {},
  };

  const participants = {
    [p1Uid]: { role: 'p1', name: p1Name, joinedAt: now },
    [p2Uid]: { role: 'p2', name: p2Name, joinedAt: now },
  };

  if (ops.updateMulti) {
    await ops.updateMulti({
      [`battles/${battleId}/meta`]: meta,
      [`battles/${battleId}/server`]: serverState,
      [`battles/${battleId}/participants`]: participants,
      [`battles/${battleId}/public`]: publicState,
      [`battles/${battleId}/private/${p1Uid}`]: p1Private,
      [`battles/${battleId}/private/${p2Uid}`]: p2Private,
    });
    return;
  }

  await Promise.all([
    ops.set(`battles/${battleId}/meta`, meta),
    ops.set(`battles/${battleId}/server`, serverState),
    ops.set(`battles/${battleId}/participants`, participants),
    ops.set(`battles/${battleId}/public`, publicState),
    ops.set(`battles/${battleId}/private/${p1Uid}`, p1Private),
    ops.set(`battles/${battleId}/private/${p2Uid}`, p2Private),
  ]);
}

export { TURN_DEADLINE_MS };
