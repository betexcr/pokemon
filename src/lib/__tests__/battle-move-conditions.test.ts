import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { getCounterDamage } from '../team-battle-move-conditions';

const base = {
  critRateStage: 0,
  bypassAccuracyCheck: false,
  hits: null,
  makesContact: false,
} as const;

const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, pp: 35, priority: 0, makesContact: true },
  'quick-attack': { ...base, id: 98, name: 'quick-attack', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, pp: 30, priority: 1, makesContact: true },
  'fake-out': { ...base, id: 252, name: 'fake-out', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, pp: 10, priority: 3, makesContact: true },
  'first-impression': { ...base, id: 660, name: 'first-impression', type: 'Bug', category: 'Physical', power: 90, accuracy: 100, pp: 10, priority: 2, makesContact: true },
  'sucker-punch': { ...base, id: 389, name: 'sucker-punch', type: 'Dark', category: 'Physical', power: 70, accuracy: 100, pp: 5, priority: 1, makesContact: true },
  'swords-dance': { ...base, id: 14, name: 'swords-dance', type: 'Normal', category: 'Status', power: null, accuracy: null, pp: 20, priority: 0 },
  thunderbolt: { ...base, id: 85, name: 'thunderbolt', type: 'Electric', category: 'Special', power: 90, accuracy: 100, pp: 15, priority: 0 },
  counter: { ...base, id: 68, name: 'counter', type: 'Fighting', category: 'Physical', power: null, accuracy: 100, pp: 20, priority: -5, makesContact: true },
  'mirror-coat': { ...base, id: 243, name: 'mirror-coat', type: 'Psychic', category: 'Special', power: null, accuracy: 100, pp: 20, priority: -5 },
  'metal-burst': { ...base, id: 368, name: 'metal-burst', type: 'Steel', category: 'Physical', power: null, accuracy: 100, pp: 10, priority: 0 },
  'seismic-toss': { ...base, id: 69, name: 'seismic-toss', type: 'Fighting', category: 'Physical', power: null, accuracy: 100, pp: 20, priority: 0, makesContact: true },
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

const ALL_MOVE_IDS = Object.keys(MOVES);

function makeMon(name: string, types: string[], speed: number, overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name,
      types: types.map((t) => ({ type: { name: t } })) as any,
      stats: [
        { stat: { name: 'hp' }, base_stat: 100 },
        { stat: { name: 'attack' }, base_stat: 100 },
        { stat: { name: 'defense' }, base_stat: 100 },
        { stat: { name: 'special-attack' }, base_stat: 100 },
        { stat: { name: 'special-defense' }, base_stat: 100 },
        { stat: { name: 'speed' }, base_stat: speed },
      ],
      weight: 100,
      abilities: [{ ability: { name: 'keen-eye' } }],
    } as any,
    level: 50,
    currentHp: 300,
    maxHp: 300,
    moves: ALL_MOVE_IDS.map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

function makeTeam(lead: BattlePokemon, benchName: string): BattleTeam {
  return {
    pokemon: [lead, makeMon(benchName, ['normal'], 50)],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  } as BattleTeam;
}

/** Player is fast (speed 150) unless overridden; opponent is slow (speed 30). */
function makeBattle(opts: { player?: BattlePokemon; opponent?: BattlePokemon } = {}): BattleState {
  return {
    player: makeTeam(opts.player ?? makeMon('fasty', ['normal'], 150), 'player-bench'),
    opponent: makeTeam(opts.opponent ?? makeMon('slowpoke', ['normal'], 30), 'opp-bench'),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng(4242),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

const move = (moveId: string, target: 'player' | 'opponent' = 'opponent'): BattleAction => ({ type: 'move', moveId, target });

async function playTurn(state: BattleState, p: BattleAction, o: BattleAction) {
  await runBattleTurnFromQueue(state, buildActionQueue(state, p, o), { clearBattleLog: true });
  state.turn += 1;
  return state.battleLog.map((e) => e.message);
}

const failed = (log: string[]) => log.includes('But it failed!');

describe('Fake Out / First Impression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('works on the first turn and fails on later turns', async () => {
    const state = makeBattle();
    const opp = state.opponent.pokemon[0];

    let log = await playTurn(state, move('fake-out'), move('tackle', 'player'));
    expect(failed(log)).toBe(false);
    const afterFirst = opp.currentHp;
    expect(afterFirst).toBeLessThan(300);

    log = await playTurn(state, move('fake-out'), move('tackle', 'player'));
    expect(failed(log)).toBe(true);
    expect(opp.currentHp).toBe(afterFirst);
    // PP is still spent on the failed attempt
    expect(state.player.pokemon[0].moves.find((m) => m.id === 'fake-out')!.pp).toBe(8);
  });

  it('works again after the user switches out and back in', async () => {
    const state = makeBattle();
    await playTurn(state, move('tackle'), move('swords-dance', 'opponent'));
    await playTurn(state, { type: 'switch', switchIndex: 1 }, move('swords-dance', 'opponent'));
    await playTurn(state, { type: 'switch', switchIndex: 0 }, move('swords-dance', 'opponent'));

    const log = await playTurn(state, move('fake-out'), move('swords-dance', 'opponent'));
    expect(failed(log)).toBe(false);
  });

  it('a Pokémon that switched in mid-turn can still Fake Out on its next turn', async () => {
    const state = makeBattle();
    await playTurn(state, move('tackle'), { type: 'switch', switchIndex: 1 });
    const log = await playTurn(state, move('tackle'), move('fake-out', 'player'));
    expect(failed(log)).toBe(false);
  });

  it('First Impression shares the first-turn gate', async () => {
    const state = makeBattle();
    expect(failed(await playTurn(state, move('first-impression'), move('swords-dance', 'opponent')))).toBe(false);
    expect(failed(await playTurn(state, move('first-impression'), move('swords-dance', 'opponent')))).toBe(true);
  });
});

describe('Sucker Punch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hits when the target is about to attack', async () => {
    const state = makeBattle();
    const log = await playTurn(state, move('sucker-punch'), move('tackle', 'player'));
    expect(failed(log)).toBe(false);
    expect(state.opponent.pokemon[0].currentHp).toBeLessThan(300);
  });

  it('fails when the target uses a status move', async () => {
    const state = makeBattle();
    const log = await playTurn(state, move('sucker-punch'), move('swords-dance', 'opponent'));
    expect(failed(log)).toBe(true);
    expect(state.opponent.pokemon[0].currentHp).toBe(300);
  });

  it('fails when the target switches out', async () => {
    const state = makeBattle();
    const log = await playTurn(state, move('sucker-punch'), { type: 'switch', switchIndex: 1 });
    expect(failed(log)).toBe(true);
    expect(state.opponent.pokemon[1].currentHp).toBe(300);
  });

  it('fails when the target already moved this turn', async () => {
    // Opponent is faster and both moves have +1 priority, so the target attacks first.
    const state = makeBattle({
      player: makeMon('slow-punch', ['dark'], 30),
      opponent: makeMon('fast-quick', ['normal'], 150),
    });
    const log = await playTurn(state, move('sucker-punch'), move('quick-attack', 'player'));
    expect(failed(log)).toBe(true);
  });
});

describe('Counter / Mirror Coat / Metal Burst', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Counter returns double the physical damage taken this turn', async () => {
    const state = makeBattle();
    const user = state.player.pokemon[0];
    const target = state.opponent.pokemon[0];

    const log = await playTurn(state, move('counter'), move('tackle', 'player'));
    expect(failed(log)).toBe(false);
    const taken = 300 - user.currentHp;
    expect(taken).toBeGreaterThan(0);
    expect(300 - target.currentHp).toBe(taken * 2);
  });

  it('Counter fails against special damage, Mirror Coat reflects it', async () => {
    let state = makeBattle();
    let log = await playTurn(state, move('counter'), move('thunderbolt', 'player'));
    expect(failed(log)).toBe(true);
    expect(state.opponent.pokemon[0].currentHp).toBe(300);

    state = makeBattle();
    log = await playTurn(state, move('mirror-coat'), move('thunderbolt', 'player'));
    expect(failed(log)).toBe(false);
    const taken = 300 - state.player.pokemon[0].currentHp;
    expect(300 - state.opponent.pokemon[0].currentHp).toBe(taken * 2);
  });

  it('Counter fails when the user was not hit this turn', async () => {
    const state = makeBattle();
    const log = await playTurn(state, move('counter'), move('swords-dance', 'opponent'));
    expect(failed(log)).toBe(true);
  });

  it('damage taken on an earlier turn does not count', async () => {
    const state = makeBattle();
    await playTurn(state, move('swords-dance', 'player'), move('tackle', 'player'));
    expect(state.player.pokemon[0].currentHp).toBeLessThan(300);
    const log = await playTurn(state, move('counter'), move('swords-dance', 'opponent'));
    expect(failed(log)).toBe(true);
  });

  it('Metal Burst returns 1.5x damage of either category when the user moves last', async () => {
    const state = makeBattle({
      player: makeMon('slow-steel', ['steel'], 30),
      opponent: makeMon('fast-zapper', ['normal'], 150),
    });
    const log = await playTurn(state, move('metal-burst'), move('thunderbolt', 'player'));
    expect(failed(log)).toBe(false);
    const taken = 300 - state.player.pokemon[0].currentHp;
    expect(300 - state.opponent.pokemon[0].currentHp).toBe(Math.floor(taken * 1.5));
  });

  it('Metal Burst fails when the user moves first', async () => {
    const state = makeBattle();
    const log = await playTurn(state, move('metal-burst'), move('tackle', 'player'));
    expect(failed(log)).toBe(true);
  });

  it('getCounterDamage applies the category filter and multiplier', () => {
    const mon = makeMon('helper', ['normal'], 50);
    expect(getCounterDamage(mon, 'counter')).toBeNull();
    mon.volatile.lastDamageTaken = { amount: 50, category: 'Physical' };
    expect(getCounterDamage(mon, 'counter')).toBe(100);
    expect(getCounterDamage(mon, 'mirror-coat')).toBeNull();
    expect(getCounterDamage(mon, 'metal-burst')).toBe(75);
  });
});

describe('Fixed-damage moves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('respect type immunity (Seismic Toss vs Ghost)', async () => {
    const state = makeBattle({ opponent: makeMon('ghosty', ['ghost'], 30) });
    const log = await playTurn(state, move('seismic-toss'), move('swords-dance', 'opponent'));
    expect(log.some((m) => m.startsWith("It doesn't affect"))).toBe(true);
    expect(state.opponent.pokemon[0].currentHp).toBe(300);
  });

  it('still deal level-based damage to non-immune targets', async () => {
    const state = makeBattle();
    await playTurn(state, move('seismic-toss'), move('swords-dance', 'opponent'));
    expect(state.opponent.pokemon[0].currentHp).toBe(250);
  });
});
