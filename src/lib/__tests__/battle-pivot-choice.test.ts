import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { resumeBattleTurnAfterSwitch, runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  getCurrentPokemon,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, makesContact: true },
  'u-turn': { ...base, id: 369, name: 'u-turn', type: 'Bug', category: 'Physical', power: 70, accuracy: 100, makesContact: true },
  'parting-shot': { ...base, id: 575, name: 'parting-shot', type: 'Dark', category: 'Status', power: null, accuracy: 100, statChanges: [{ stat: 'atk', stages: -1, chance: 100 }, { stat: 'spa', stages: -1, chance: 100 }], target: 'selected-pokemon' },
  'baton-pass': { ...base, id: 226, name: 'baton-pass', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'user' },
  splash: { ...base, id: 150, name: 'splash', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'user' },
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

function makeMon(name: string, speed = 50, overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name,
      types: [{ type: { name: 'normal' } }] as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((s) => ({ stat: { name: s }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: speed }]),
      weight: 100,
      abilities: [],
    } as any,
    level: 50,
    currentHp: 300,
    maxHp: 300,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

function makeBattle(opts: { playerSpeed?: number; opponentSpeed?: number; playerBench?: number; opponentBench?: number } = {}): BattleState {
  const bench = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => makeMon(`${prefix}-bench-${i + 1}`));
  return {
    player: team([makeMon('p-lead', opts.playerSpeed ?? 150), ...bench('p', opts.playerBench ?? 2)]),
    opponent: team([makeMon('o-lead', opts.opponentSpeed ?? 30), ...bench('o', opts.opponentBench ?? 2)]),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng(21),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

const move = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });

async function startTurn(state: BattleState, p: BattleAction, o: BattleAction, manual: Array<'player' | 'opponent'> = ['player']) {
  return runBattleTurnFromQueue(state, buildActionQueue(state, p, o), { clearBattleLog: true, manualSwitchSides: manual });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('player-chosen pivot replacements', () => {
  it('pauses after U-turn with the legal options, before the slower foe moves or end of turn', async () => {
    const state = makeBattle();
    state.player.pokemon[0].heldItem = 'leftovers';
    state.player.pokemon[0].currentHp = 200;

    const outcome = await startTurn(state, move('u-turn'), move('tackle'));

    expect(outcome).toBe('awaiting-switch');
    expect(state.pendingSwitch).toMatchObject({ side: 'player', reason: 'pivot', options: [1, 2] });
    expect(state.player.currentIndex).toBe(0);
    expect(state.opponent.pokemon[0].currentHp).toBeLessThan(300);
    // The foe's tackle and end-of-turn Leftovers have not happened yet
    expect(state.battleLog.some((e) => e.message === 'o-lead used tackle!')).toBe(false);
    expect(state.player.pokemon[0].currentHp).toBe(200);
  });

  it('resuming sends in the chosen Pokémon, then finishes the turn', async () => {
    const state = makeBattle();
    await startTurn(state, move('u-turn'), move('tackle'));

    const outcome = await resumeBattleTurnAfterSwitch(state, 2);

    expect(outcome).toBe('complete');
    expect(state.pendingSwitch).toBeUndefined();
    expect(state.player.currentIndex).toBe(2);
    // The foe's tackle lands on the newcomer, and the log keeps the whole turn
    expect(state.player.pokemon[2].currentHp).toBeLessThan(300);
    expect(state.player.pokemon[0].currentHp).toBe(300);
    const messages = state.battleLog.map((e) => e.message);
    expect(messages.indexOf('p-lead used u-turn!')).toBeLessThan(messages.indexOf('Go! p-bench-2!'));
    expect(messages.indexOf('Go! p-bench-2!')).toBeLessThan(messages.indexOf('o-lead used tackle!'));
  });

  it('rejects a choice that is not one of the options', async () => {
    const state = makeBattle();
    await startTurn(state, move('u-turn'), move('tackle'));
    await expect(resumeBattleTurnAfterSwitch(state, 0)).rejects.toThrow('Illegal switch choice');
    expect(state.pendingSwitch).toBeDefined();
  });

  it('switches automatically when only one Pokémon can come in', async () => {
    const state = makeBattle({ playerBench: 1 });
    const outcome = await startTurn(state, move('u-turn'), move('tackle'));
    expect(outcome).toBe('complete');
    expect(state.player.currentIndex).toBe(1);
  });

  it('switches automatically for sides not marked as player-controlled (AI)', async () => {
    const state = makeBattle({ playerSpeed: 30, opponentSpeed: 150 });
    const outcome = await startTurn(state, move('tackle'), move('u-turn'), ['player']);
    expect(outcome).toBe('complete');
    expect(state.opponent.currentIndex).toBe(1);
  });

  it('keeps the old auto-switch behaviour when no side is manual', async () => {
    const state = makeBattle();
    const outcome = await runBattleTurnFromQueue(state, buildActionQueue(state, move('u-turn'), move('tackle')), { clearBattleLog: true });
    expect(outcome).toBe('complete');
    expect(state.player.currentIndex).toBe(1);
  });

  it('a pivot that moves last still pauses, and resume runs end of turn', async () => {
    const state = makeBattle({ playerSpeed: 30, opponentSpeed: 150 });
    state.player.pokemon[2].heldItem = 'leftovers';
    state.player.pokemon[2].currentHp = 200;
    expect(await startTurn(state, move('u-turn'), move('tackle'))).toBe('awaiting-switch');
    expect(state.pendingSwitch?.remainingQueue).toEqual([]);
    expect(await resumeBattleTurnAfterSwitch(state, 2)).toBe('complete');
    expect(state.player.pokemon[2].currentHp).toBe(200 + Math.floor(300 / 16));
  });

  it('Baton Pass passes boosts to the chosen Pokémon', async () => {
    const state = makeBattle();
    state.player.pokemon[0].statModifiers.attack = 2;
    expect(await startTurn(state, move('baton-pass'), move('splash'))).toBe('awaiting-switch');
    expect(state.pendingSwitch?.reason).toBe('baton-pass');
    await resumeBattleTurnAfterSwitch(state, 2);
    expect(getCurrentPokemon(state.player).pokemon.name).toBe('p-bench-2');
    expect(getCurrentPokemon(state.player).statModifiers.attack).toBe(2);
    expect(state.player.pokemon[0].statModifiers.attack).toBe(0);
  });

  it('Parting Shot pauses after lowering the foe’s stats', async () => {
    const state = makeBattle();
    expect(await startTurn(state, move('parting-shot'), move('splash'))).toBe('awaiting-switch');
    expect(state.opponent.pokemon[0].statModifiers.attack).toBe(-1);
  });

  it('handles both sides pivoting in one turn, one pick at a time', async () => {
    const state = makeBattle();
    expect(await startTurn(state, move('u-turn'), move('u-turn'), ['player', 'opponent'])).toBe('awaiting-switch');
    expect(state.pendingSwitch?.side).toBe('player');

    expect(await resumeBattleTurnAfterSwitch(state, 1)).toBe('awaiting-switch');
    expect(state.pendingSwitch?.side).toBe('opponent');
    expect(state.player.pokemon[1].currentHp).toBeLessThan(300);

    expect(await resumeBattleTurnAfterSwitch(state, 2)).toBe('complete');
    expect(state.opponent.currentIndex).toBe(2);
  });
});
