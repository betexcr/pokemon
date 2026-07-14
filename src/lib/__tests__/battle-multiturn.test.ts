import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BattlePokemon, BattleState, BattleTeam, BattleAction } from '../team-battle-engine';
import { buildActionQueue, getCurrentPokemon, consumePpForMove } from '../team-battle-engine';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { getForcedBattleMoveId, RECHARGE_MOVE_ID } from '../battle-multiturn';

vi.mock('../moveCache', () => {
  const mk = (name: string, extra: Record<string, unknown> = {}) => ({
    id: 1,
    name,
    type: 'Grass',
    category: 'Special',
    power: 120,
    accuracy: 100,
    pp: 10,
    priority: 0,
    critRateStage: 0,
    makesContact: false,
    bypassAccuracyCheck: false,
    hits: null,
    ...extra,
  });
  const cache = new Map<string, any>([
    ['petal-dance', mk('petal-dance')],
    ['outrage', mk('outrage', { type: 'Dragon', category: 'Physical' })],
    ['hyper-beam', mk('hyper-beam', { type: 'Normal', power: 150 })],
    ['dig', mk('dig', { type: 'Ground', category: 'Physical', power: 80 })],
    ['tackle', mk('tackle', { type: 'Normal', category: 'Physical', power: 40 })],
    ['solar-beam', mk('solar-beam', { type: 'Grass', power: 120 })],
  ]);
  return {
    getMove: vi.fn(async (id: string) => cache.get(String(id).toLowerCase()) ?? null),
    getCachedMove: (id: string) => cache.get(String(id).toLowerCase()),
  };
});

function makePokemon(overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name: 'testmon',
      types: [{ type: { name: 'grass' } }] as any,
      stats: [
        { stat: { name: 'hp' }, base_stat: 100 },
        { stat: { name: 'attack' }, base_stat: 80 },
        { stat: { name: 'defense' }, base_stat: 80 },
        { stat: { name: 'special-attack' }, base_stat: 100 },
        { stat: { name: 'special-defense' }, base_stat: 80 },
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
      weight: 100,
      abilities: [],
    } as any,
    level: 50,
    currentHp: 200,
    maxHp: 200,
    moves: [
      { id: 'petal-dance', pp: 10, maxPp: 10 },
      { id: 'dig', pp: 10, maxPp: 10 },
      { id: 'hyper-beam', pp: 5, maxPp: 5 },
      { id: 'tackle', pp: 20, maxPp: 20 },
    ],
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

function makeTeam(active: BattlePokemon): BattleTeam {
  return {
    pokemon: [active],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  };
}

function makeState(player: BattlePokemon, opponent: BattlePokemon): BattleState {
  return {
    player: makeTeam(player),
    opponent: makeTeam(opponent),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng('multiturn-test'),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

async function runPlayerMove(state: BattleState, moveId: string) {
  const playerAction: BattleAction = { type: 'move', moveId, target: 'opponent' };
  const oppAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'player' };
  const queue = buildActionQueue(state, playerAction, oppAction);
  await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });
}

describe('multi-turn moves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('locks Petal Dance for follow-up turns and damages each turn', async () => {
    const player = makePokemon({ pokemon: { id: 3, name: 'venusaur', types: [{ type: { name: 'grass' } }], stats: makePokemon().pokemon.stats, weight: 100, abilities: [] } as any });
    const foe = makePokemon({
      currentHp: 500,
      maxHp: 500,
      pokemon: { id: 707, name: 'klefki', types: [{ type: { name: 'steel' } }, { type: { name: 'fairy' } }], stats: makePokemon().pokemon.stats, weight: 3, abilities: [] } as any,
      moves: [{ id: 'tackle', pp: 20, maxPp: 20 }],
    });
    const state = makeState(player, foe);
    const foeHpBefore = getCurrentPokemon(state.opponent).currentHp;

    await runPlayerMove(state, 'petal-dance');
    expect(getCurrentPokemon(state.player).volatile.rampage?.move).toBe('petal-dance');
    expect(getCurrentPokemon(state.opponent).currentHp).toBeLessThan(foeHpBefore);
    const midHp = getCurrentPokemon(state.opponent).currentHp;
    expect(getForcedBattleMoveId(getCurrentPokemon(state.player))).toBe('petal-dance');

    const ppAfterFirst = getCurrentPokemon(state.player).moves.find(m => m.id === 'petal-dance')!.pp;
    await runPlayerMove(state, 'petal-dance');
    expect(getCurrentPokemon(state.opponent).currentHp).toBeLessThan(midHp);
    // Continuations do not spend PP again
    expect(getCurrentPokemon(state.player).moves.find(m => m.id === 'petal-dance')!.pp).toBe(ppAfterFirst);
  });

  it('Dig charges then deals damage on the second turn', async () => {
    const player = makePokemon();
    const foe = makePokemon({
      currentHp: 300,
      maxHp: 300,
      moves: [{ id: 'tackle', pp: 20, maxPp: 20 }],
    });
    const state = makeState(player, foe);
    const foeHp = getCurrentPokemon(state.opponent).currentHp;

    await runPlayerMove(state, 'dig');
    expect(getCurrentPokemon(state.player).volatile.twoTurn?.kind).toBe('pending');
    expect(getCurrentPokemon(state.opponent).currentHp).toBe(foeHp);
    expect(getForcedBattleMoveId(getCurrentPokemon(state.player))).toBe('dig');

    await runPlayerMove(state, 'dig');
    expect(getCurrentPokemon(state.opponent).currentHp).toBeLessThan(foeHp);
    expect(getCurrentPokemon(state.player).volatile.twoTurn).toBeUndefined();
  });

  it('Hyper Beam schedules a recharge turn', async () => {
    const player = makePokemon();
    const foe = makePokemon({ currentHp: 400, maxHp: 400, moves: [{ id: 'tackle', pp: 20, maxPp: 20 }] });
    const state = makeState(player, foe);

    await runPlayerMove(state, 'hyper-beam');
    expect(getCurrentPokemon(state.player).volatile.mustRecharge).toBe(true);
    expect(getForcedBattleMoveId(getCurrentPokemon(state.player))).toBe(RECHARGE_MOVE_ID);

    await runPlayerMove(state, RECHARGE_MOVE_ID);
    expect(getCurrentPokemon(state.player).volatile.mustRecharge).toBeFalsy();
    expect(state.battleLog.some(e => e.message?.includes('must recharge'))).toBe(true);
  });

  it('consumePp skips locked continuation turns', () => {
    const mon = makePokemon();
    mon.volatile.rampage = { move: 'petal-dance', turnsLeft: 1 };
    const before = mon.moves[0].pp;
    consumePpForMove(mon, 'petal-dance');
    expect(mon.moves[0].pp).toBe(before);
  });
});
