import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  canUseMove,
  allMovesOutOfPp,
  validateServerBattleAction,
  normalizeServerBattleAction,
  type BattleState,
  type BattlePokemon,
  type BattleTeam,
  type BattleAction,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import {
  getMoveDataMissCount,
  resetMoveDataMissCountForTests,
} from '../battle-engine-metrics';
import { handleOnEntryAbilities } from '../team-battle-abilities';

vi.mock('../moveCache', () => ({
  getMove: vi.fn(),
  getCachedMove: vi.fn(() => undefined),
}));

import { getMove } from '../moveCache';

const tackleLike: CompiledMove = {
  id: 33,
  name: 'tackle',
  type: 'Normal',
  category: 'Physical',
  power: 40,
  accuracy: 100,
  pp: 35,
  priority: 0,
  critRateStage: 0,
  makesContact: true,
  bypassAccuracyCheck: false,
  hits: null,
};

const struggleLike: CompiledMove = {
  id: 165,
  name: 'struggle',
  type: 'Normal',
  category: 'Physical',
  power: 50,
  accuracy: null,
  pp: null,
  priority: 0,
  critRateStage: 0,
  makesContact: true,
  bypassAccuracyCheck: true,
  hits: null,
  recoil: { fraction: 0.25 },
};

function makeMon(
  name: string,
  types: string[],
  overrides: Partial<BattlePokemon> = {}
): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name,
      types: types.map((t) => ({ type: { name: t } })) as any,
      stats: [
        { stat: { name: 'hp' }, base_stat: 100 },
        { stat: { name: 'attack' }, base_stat: 100 },
        { stat: { name: 'defense' }, base_stat: 80 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 80 },
        { stat: { name: 'speed' }, base_stat: 50 },
      ],
      weight: 100,
      abilities: [{ ability: { name: 'keen-eye' } }],
    } as any,
    level: 50,
    currentHp: 200,
    maxHp: 200,
    moves: [{ id: 'tackle', pp: 35, maxPp: 35 }],
    volatile: {},
    statModifiers: {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    ...overrides,
  };
}

function makeTeam(mon: BattlePokemon): BattleTeam {
  return {
    pokemon: [mon, makeMon('bench', ['normal'], { currentHp: 200, maxHp: 200 })],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  };
}

function makeBattle(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player: makeTeam(makeMon('attacker', ['normal'])),
    opponent: makeTeam(makeMon('defender', ['normal'])),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng('real-move-test'),
    isComplete: false,
    phase: 'choice',
    ...overrides,
  } as BattleState;
}

describe('battle turn with move fixtures', () => {
  beforeEach(() => {
    vi.mocked(getMove).mockReset();
    resetMoveDataMissCountForTests();
  });

  it('applies damage when getMove returns compiled data', async () => {
    vi.mocked(getMove).mockResolvedValue(tackleLike);

    const state = makeBattle();
    const defenderHpBefore = state.opponent.pokemon[0].currentHp;
    const playerAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'opponent' };
    const oppAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'player' };

    const queue = buildActionQueue(state, playerAction, oppAction);
    await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });

    expect(state.opponent.pokemon[0].currentHp).toBeLessThan(defenderHpBefore);
    expect(state.battleLog.some((e) => e.type === 'damage_dealt')).toBe(true);
    expect(getMoveDataMissCount()).toBe(0);
  });

  it('logs engine_warning and increments miss metric when getMove throws', async () => {
    vi.mocked(getMove).mockRejectedValue(new Error('network'));

    const state = makeBattle();
    const playerAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'opponent' };
    const oppAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'player' };

    const queue = buildActionQueue(state, playerAction, oppAction);
    await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });

    expect(state.battleLog.some((e) => e.type === 'engine_warning')).toBe(true);
    expect(
      state.battleLog.some(
        (e) => e.type === 'engine_warning' && e.message.includes('move data unavailable')
      )
    ).toBe(true);
    expect(getMoveDataMissCount()).toBeGreaterThanOrEqual(1);
  });

  it('logs engine_warning when getMove resolves null (tests / bad cache)', async () => {
    vi.mocked(getMove).mockResolvedValue(null as unknown as CompiledMove);

    const state = makeBattle();
    const playerAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'opponent' };
    const oppAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'player' };

    const queue = buildActionQueue(state, playerAction, oppAction);
    await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });

    expect(state.battleLog.some((e) => e.type === 'engine_warning')).toBe(true);
    expect(getMoveDataMissCount()).toBeGreaterThanOrEqual(1);
  });

  it('decrements PP once per move used', async () => {
    vi.mocked(getMove).mockImplementation(async (id: string | number) => {
      if (String(id).toLowerCase() === 'struggle') return struggleLike;
      return tackleLike;
    });

    const state = makeBattle();
    const p = state.player.pokemon[0];
    const o = state.opponent.pokemon[0];
    expect(p.moves[0].pp).toBe(35);

    const playerAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'opponent' };
    const oppAction: BattleAction = { type: 'move', moveId: 'tackle', target: 'player' };
    const queue = buildActionQueue(state, playerAction, oppAction);
    await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });

    expect(p.moves[0].pp).toBe(34);
    expect(o.moves[0].pp).toBe(34);
  });

  it('canUseMove allows Struggle only when all moves have 0 PP', () => {
    const rng = createBattleRng(1);
    const mon = makeMon('x', ['normal'], {
      moves: [
        { id: 'a', pp: 0, maxPp: 20 },
        { id: 'b', pp: 0, maxPp: 20 },
        { id: 'c', pp: 0, maxPp: 20 },
        { id: 'd', pp: 0, maxPp: 20 },
      ],
    });
    expect(allMovesOutOfPp(mon)).toBe(true);
    expect(canUseMove(mon, 'struggle', rng).canUse).toBe(true);
    expect(canUseMove(mon, 'a', rng).canUse).toBe(false);

    const mon2 = makeMon('y', ['normal'], {
      moves: [
        { id: 'a', pp: 1, maxPp: 20 },
        { id: 'b', pp: 0, maxPp: 20 },
      ],
    });
    expect(canUseMove(mon2, 'struggle', createBattleRng(2)).canUse).toBe(false);
  });

  it('resolves a Struggle turn with recoil when all PP exhausted', async () => {
    vi.mocked(getMove).mockImplementation(async (id: string | number) => {
      if (String(id).toLowerCase() === 'struggle') return struggleLike;
      return tackleLike;
    });

    const state = makeBattle({
      player: makeTeam(
        makeMon('att', ['normal'], {
          moves: [
            { id: 'a', pp: 0, maxPp: 20 },
            { id: 'b', pp: 0, maxPp: 20 },
            { id: 'c', pp: 0, maxPp: 20 },
            { id: 'd', pp: 0, maxPp: 20 },
          ],
        })
      ),
      opponent: makeTeam(
        makeMon('def', ['normal'], {
          moves: [
            { id: 'a', pp: 0, maxPp: 20 },
            { id: 'b', pp: 0, maxPp: 20 },
            { id: 'c', pp: 0, maxPp: 20 },
            { id: 'd', pp: 0, maxPp: 20 },
          ],
        })
      ),
    });

    const playerAction: BattleAction = { type: 'move', moveId: 'struggle', target: 'opponent' };
    const oppAction: BattleAction = { type: 'move', moveId: 'struggle', target: 'player' };
    const queue = buildActionQueue(state, playerAction, oppAction);
    await runBattleTurnFromQueue(state, queue, { clearBattleLog: true });

    expect(state.battleLog.some((e) => e.message?.includes('struggle'))).toBe(true);
    expect(state.battleLog.some((e) => e.type === 'recoil')).toBe(true);
  });
});

describe('Encore and Struggle (Showdown-style)', () => {
  it('allows Struggle when encored move has 0 PP while other moves still have PP', () => {
    const mon = makeMon('enc', ['normal'], {
      moves: [
        { id: 'tackle', pp: 0, maxPp: 35 },
        { id: 'growl', pp: 20, maxPp: 40 },
      ],
      volatile: { encore: { move: 'tackle', turns: 3 } },
    });
    const team = makeTeam(mon);
    const rng = createBattleRng(1);
    expect(canUseMove(mon, 'struggle', rng).canUse).toBe(true);
    expect(canUseMove(mon, 'growl', rng).canUse).toBe(false);
    expect(validateServerBattleAction(team, { type: 'move', moveId: 'struggle' })).toBeNull();
    expect(validateServerBattleAction(team, { type: 'move', moveId: 'growl' })).toBeNull();
  });
});

describe('ability wave (download, frisk, unnerve)', () => {
  function entryMon(
    name: string,
    ability: string | undefined,
    extra: Partial<BattlePokemon> = {}
  ): BattlePokemon {
    return {
      pokemon: {
        id: 1,
        name,
        types: [{ type: { name: 'normal' } }],
        stats: [
          { stat: { name: 'defense' }, base_stat: 40 },
          { stat: { name: 'special-defense' }, base_stat: 80 },
        ],
        weight: 100,
        abilities: [],
      } as BattlePokemon['pokemon'],
      level: 50,
      currentHp: 100,
      maxHp: 100,
      moves: [],
      volatile: {},
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
      currentAbility: ability,
      heldItem: 'sitrus-berry',
      ...extra,
    };
  }

  it('Download raises Sp. Atk when foe Defense base is not lower than Sp. Def', () => {
    const incoming = entryMon('porygon-z', 'download');
    const opp = entryMon('blissey', 'natural-cure', {
      heldItem: undefined,
      pokemon: {
        id: 1,
        name: 'blissey',
        types: [{ type: { name: 'normal' } }],
        stats: [
          { stat: { name: 'defense' }, base_stat: 90 },
          { stat: { name: 'special-defense' }, base_stat: 30 },
        ],
        weight: 100,
        abilities: [],
      } as BattlePokemon['pokemon'],
    });
    const st: BattleState = {
      player: { pokemon: [incoming], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      opponent: { pokemon: [opp], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      turn: 1,
      rng: createBattleRng(1),
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: createFieldState(),
    };
    handleOnEntryAbilities(st, 'player', incoming);
    expect(incoming.statModifiers.specialAttack).toBe(1);
    expect(incoming.statModifiers.attack).toBe(0);
  });

  it('Frisk reveals opponent item', () => {
    const incoming = entryMon('duskull', 'frisk', { heldItem: undefined });
    const opp = entryMon('snorlax', 'thick-fat', { heldItem: 'leftovers' });
    const st: BattleState = {
      player: { pokemon: [incoming], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      opponent: { pokemon: [opp], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      turn: 1,
      rng: createBattleRng(1),
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: createFieldState(),
    };
    handleOnEntryAbilities(st, 'player', incoming);
    expect(st.battleLog.some((e) => e.message?.includes('leftovers'))).toBe(true);
  });

  it('Unnerve logs on switch-in', () => {
    const incoming = entryMon('hydreigon', 'unnerve', { heldItem: undefined });
    const opp = entryMon('rattata', 'run-away', { heldItem: undefined });
    const st: BattleState = {
      player: { pokemon: [incoming], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      opponent: { pokemon: [opp], currentIndex: 0, faintedCount: 0, sideConditions: {} },
      turn: 1,
      rng: createBattleRng(1),
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: createFieldState(),
    };
    handleOnEntryAbilities(st, 'player', incoming);
    expect(st.battleLog.some((e) => e.message?.includes('Unnerve'))).toBe(true);
  });
});

describe('validateServerBattleAction', () => {
  it('rejects illegal struggle and invalid switches', () => {
    const active = makeMon('atk', ['normal'], {
      moves: [{ id: 'tackle', pp: 5, maxPp: 10 }],
    });
    const team: BattleTeam = {
      pokemon: [active, { ...active, pokemon: { ...active.pokemon, name: 'b' }, currentHp: 0 }],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {},
    };
    expect(validateServerBattleAction(team, { type: 'move', moveId: 'struggle' })).toBe('illegal_struggle');
    expect(validateServerBattleAction(team, { type: 'switch', switchIndex: 0 })).toBe('switch_same_slot');
    expect(validateServerBattleAction(team, { type: 'switch', switchIndex: 1 })).toBe('switch_to_fainted');
  });
});

describe('normalizeServerBattleAction', () => {
  it('coerces invalid move to struggle in simplified profile when struggle is legal', () => {
    const active = makeMon('atk', ['normal'], {
      moves: [
        { id: 'tackle', pp: 0, maxPp: 10 },
        { id: 'growl', pp: 0, maxPp: 20 },
      ],
    });
    const team: BattleTeam = {
      pokemon: [active],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {},
    };
    const r = normalizeServerBattleAction(team, { type: 'move', moveId: 'unknown', target: 'opponent' }, 'simplified');
    expect(r.normalized).toBe(true);
    expect(r.action.moveId).toBe('struggle');
  });
});
