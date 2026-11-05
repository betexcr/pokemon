import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
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
import { canTerastallize, resolveTeraType, teraBlockedReason } from '../team-battle-tera';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100 },
  ember: { ...base, id: 52, name: 'ember', type: 'Fire', category: 'Special', power: 40, accuracy: 100 },
  flamethrower: { ...base, id: 53, name: 'flamethrower', type: 'Fire', category: 'Special', power: 90, accuracy: 100 },
  'water-gun': { ...base, id: 55, name: 'water-gun', type: 'Water', category: 'Special', power: 40, accuracy: 100 },
  'shadow-ball': { ...base, id: 247, name: 'shadow-ball', type: 'Ghost', category: 'Special', power: 80, accuracy: 100 },
  splash: { ...base, id: 150, name: 'splash', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true },
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

function makeMon(name: string, types: string[], o: Partial<BattlePokemon> & { speed?: number } = {}): BattlePokemon {
  const { speed = 50, ...rest } = o;
  return {
    pokemon: {
      id: 1,
      name,
      types: types.map((t) => ({ type: { name: t } })) as any,
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
    ...rest,
  };
}

const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

function makeBattle(player: BattlePokemon, opponent: BattlePokemon, seed = 9): BattleState {
  return {
    player: team([player, makeMon('p-bench', ['normal'])]),
    opponent: team([opponent, makeMon('o-bench', ['normal'])]),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng(seed),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

const move = (moveId: string, terastallize = false): BattleAction => ({ type: 'move', moveId, target: 'opponent', ...(terastallize ? { terastallize } : {}) });

async function playTurn(state: BattleState, p: BattleAction, o: BattleAction = move('splash')) {
  await runBattleTurnFromQueue(state, buildActionQueue(state, p, o), { clearBattleLog: true });
  return state.battleLog.map((e) => e.message);
}

const typesOf = (m: BattlePokemon) => m.pokemon.types.map((t: any) => (typeof t === 'string' ? t : t.type.name));
const hitOn = (state: BattleState, name: string) =>
  Number(state.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Terastallization', () => {
  it('changes defensive typing to the Tera Type before anyone moves, once per battle', async () => {
    const state = makeBattle(makeMon('charizard', ['fire', 'flying'], { speed: 30, teraType: 'water' }), makeMon('o', ['normal'], { speed: 150 }));
    const log = await playTurn(state, move('splash', true), move('tackle'));
    const zard = getCurrentPokemon(state.player);

    expect(log[0]).toBe('charizard terastallized into the Water type!');
    expect(typesOf(zard)).toEqual(['water']);
    expect(zard.terastallized).toBe(true);
    expect(state.player.teraUsed).toBe(true);
    expect(canTerastallize(state, state.player)).toBe(false);
    expect(teraBlockedReason(state, state.player)).toBe('tera_already_used');
  });

  it('is refused a second time, even for another Pokémon', async () => {
    const state = makeBattle(makeMon('a', ['fire'], { teraType: 'water' }), makeMon('o', ['normal']));
    state.player.pokemon[1].teraType = 'grass';
    await playTurn(state, move('splash', true));
    await playTurn(state, { type: 'switch', switchIndex: 1 });
    const log = await playTurn(state, move('splash', true));
    expect(log.some((m) => m.includes('terastallized'))).toBe(false);
    expect(typesOf(getCurrentPokemon(state.player))).toEqual(['normal']);
  });

  it('keeps the new typing after switching out', async () => {
    const state = makeBattle(makeMon('a', ['fire'], { teraType: 'water' }), makeMon('o', ['normal']));
    await playTurn(state, move('splash', true));
    await playTurn(state, { type: 'switch', switchIndex: 1 });
    expect(typesOf(state.player.pokemon[0])).toEqual(['water']);
  });

  it('a Ghost Tera Type makes Normal moves miss entirely', async () => {
    const state = makeBattle(makeMon('a', ['normal'], { speed: 30, teraType: 'ghost' }), makeMon('o', ['normal'], { speed: 150 }));
    await playTurn(state, move('splash', true), move('tackle'));
    expect(getCurrentPokemon(state.player).currentHp).toBe(300);
  });

  async function flamethrowerDamage(attacker: BattlePokemon, tera: boolean) {
    const state = makeBattle(attacker, makeMon('target', ['normal'], { speed: 30 }), 4);
    await playTurn(state, move('flamethrower', tera));
    return hitOn(state, 'target');
  }

  it('Tera into an original type gives 2x STAB instead of 1.5x', async () => {
    const plain = await flamethrowerDamage(makeMon('a', ['fire'], { speed: 150, teraType: 'fire' }), false);
    const tera = await flamethrowerDamage(makeMon('a', ['fire'], { speed: 150, teraType: 'fire' }), true);
    expect(tera / plain).toBeCloseTo(2 / 1.5, 1);
  });

  it('keeps STAB on original types after changing type', async () => {
    const plain = await flamethrowerDamage(makeMon('a', ['fire'], { speed: 150, teraType: 'water' }), false);
    const tera = await flamethrowerDamage(makeMon('a', ['fire'], { speed: 150, teraType: 'water' }), true);
    expect(tera).toBe(plain);
  });

  it('grants STAB on a new Tera Type and raises weak Tera-type moves to 60 power', async () => {
    const waterGun = async (tera: boolean) => {
      const state = makeBattle(makeMon('a', ['fire'], { speed: 150, teraType: 'water' }), makeMon('target', ['normal'], { speed: 30 }), 4);
      await playTurn(state, move('water-gun', tera));
      return hitOn(state, 'target');
    };
    const plain = await waterGun(false);
    const tera = await waterGun(true);
    // 1.5x STAB and 40 -> 60 power (base-damage rounding keeps this approximate)
    expect(tera / plain).toBeGreaterThan(2);
    expect(tera / plain).toBeLessThan(2.4);
  });

  it('does nothing when Tera is disabled by feature flag', async () => {
    const state = makeBattle(makeMon('a', ['fire'], { teraType: 'water' }), makeMon('o', ['normal']));
    state.featureFlags = { teraEnabled: false };
    await playTurn(state, move('splash', true));
    expect(typesOf(getCurrentPokemon(state.player))).toEqual(['fire']);
  });
});

describe('resolveTeraType', () => {
  it('uses a valid chosen type, else the primary type', () => {
    expect(resolveTeraType('Fairy', [{ type: { name: 'fire' } }])).toBe('fairy');
    expect(resolveTeraType('stellar', [{ type: { name: 'fire' } }])).toBe('fire');
    expect(resolveTeraType(undefined, ['water', 'ground'])).toBe('water');
    expect(resolveTeraType(undefined, [])).toBeUndefined();
  });
});
