import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { applyFaintReplacements, runBattleTurnFromQueue } from '../team-battle-engine-additional';
import { buildActionQueue, type BattleAction, type BattlePokemon, type BattleState, type BattleTeam } from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100 },
  splash: { ...base, id: 150, name: 'splash', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true },
} as unknown as Record<string, CompiledMove>;
vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

function makeMon(name: string, speed = 50, hp = 300): BattlePokemon {
  return {
    pokemon: {
      id: 1, name, types: [{ type: { name: 'normal' } }] as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((s) => ({ stat: { name: s }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: speed }]),
      weight: 100, abilities: [],
    } as any,
    level: 50, currentHp: hp, maxHp: 300,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

function makeBattle(player: BattlePokemon[], opponent: BattlePokemon[]): BattleState {
  return {
    player: team(player), opponent: team(opponent), turn: 1, field: createFieldState(), battleLog: [], actionQueue: [],
    rng: createBattleRng(3), isComplete: false, phase: 'choice',
  } as BattleState;
}
const move = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const play = (s: BattleState, p: BattleAction, o: BattleAction, manual: Array<'player' | 'opponent'>) =>
  runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true, manualSwitchSides: manual });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('player-chosen replacements after a faint', () => {
  it('finishes the turn, then waits for the player to pick', async () => {
    const s = makeBattle([makeMon('p-lead', 30, 5), makeMon('p-1'), makeMon('p-2')], [makeMon('o-lead', 150), makeMon('o-1')]);
    expect(await play(s, move('tackle'), move('tackle'), ['player'])).toBe('awaiting-replacement');
    expect(s.pendingReplacements).toEqual([{ side: 'player', options: [1, 2] }]);
    expect(s.player.currentIndex).toBe(0);

    expect(await applyFaintReplacements(s, { player: 2 })).toBe('complete');
    expect(s.player.currentIndex).toBe(2);
    expect(s.pendingReplacements).toBeUndefined();
    expect(s.battleLog.at(-1)?.message).toBe('Go! p-2!');
  });

  it('rejects a pick outside the options', async () => {
    const s = makeBattle([makeMon('p-lead', 30, 5), makeMon('p-1'), makeMon('p-2', 50, 0)], [makeMon('o-lead', 150)]);
    s.player.pokemon.push(makeMon('p-3'));
    await play(s, move('tackle'), move('tackle'), ['player']);
    await expect(applyFaintReplacements(s, { player: 2 })).rejects.toThrow('Illegal replacement');
  });

  it('sends in the only option automatically, and AI sides always auto-replace', async () => {
    let s = makeBattle([makeMon('p-lead', 30, 5), makeMon('p-1')], [makeMon('o-lead', 150)]);
    expect(await play(s, move('tackle'), move('tackle'), ['player'])).toBe('complete');
    expect(s.player.currentIndex).toBe(1);

    s = makeBattle([makeMon('p-lead', 150)], [makeMon('o-lead', 30, 5), makeMon('o-1'), makeMon('o-2')]);
    expect(await play(s, move('tackle'), move('splash'), ['player'])).toBe('complete');
    expect(s.opponent.currentIndex).toBe(1);
  });

  it('both sides pick when both actives faint', async () => {
    const s = makeBattle(
      [makeMon('p-lead', 150, 5), makeMon('p-1'), makeMon('p-2')],
      [makeMon('o-lead', 30, 5), makeMon('o-1'), makeMon('o-2')],
    );
    // Sandstorm residual knocks out both 5-HP leads at end of turn
    s.field.weather = { kind: 'sandstorm', turns: 5 };
    expect(await play(s, move('splash'), move('splash'), ['player', 'opponent'])).toBe('awaiting-replacement');
    expect(s.pendingReplacements?.map((r) => r.side).sort()).toEqual(['opponent', 'player']);
    await expect(applyFaintReplacements(s, { player: 1 })).rejects.toThrow();
    expect(await applyFaintReplacements(s, { player: 1, opponent: 2 })).toBe('complete');
    expect([s.player.currentIndex, s.opponent.currentIndex]).toEqual([1, 2]);
  });

  it('no prompt when the battle is over', async () => {
    const s = makeBattle([makeMon('p-lead', 150), makeMon('p-1')], [makeMon('o-lead', 30, 5)]);
    expect(await play(s, move('tackle'), move('splash'), ['player', 'opponent'])).toBe('complete');
    expect(s.pendingReplacements).toBeUndefined();
  });

  it('asks again when entry hazards knock out the newcomer', async () => {
    const s = makeBattle([makeMon('p-lead', 30, 5), makeMon('p-1', 50, 10), makeMon('p-2'), makeMon('p-3')], [makeMon('o-lead', 150)]);
    s.player.sideConditions.hazards.stealthRock = true;
    await play(s, move('tackle'), move('tackle'), ['player']);
    expect(await applyFaintReplacements(s, { player: 1 })).toBe('awaiting-replacement');
    expect(s.pendingReplacements).toEqual([{ side: 'player', options: [2, 3] }]);
  });
});
