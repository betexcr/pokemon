import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  applySwitchOutAbilities,
  buildActionQueue,
  getCurrentPokemon,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { effectiveItem } from '../battle-item-access';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false } as const;
const status = (id: number, name: string, priority = 0) =>
  ({ ...base, id, name, type: 'Normal', category: 'Status', power: null, accuracy: null, pp: 20, priority });

const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, pp: 35, priority: 0, makesContact: true },
  'dragon-tail': { ...base, id: 525, name: 'dragon-tail', type: 'Dragon', category: 'Physical', power: 60, accuracy: 100, pp: 10, priority: -6, makesContact: true },
  splash: status(150, 'splash'),
  roar: status(46, 'roar', -6),
  whirlwind: status(18, 'whirlwind', -6),
  'baton-pass': status(226, 'baton-pass'),
  'magic-room': status(478, 'magic-room', -7),
  'wonder-room': status(472, 'wonder-room', -7),
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type StatOverrides = Partial<Record<'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed', number>>;

function makeMon(name: string, stats: StatOverrides = {}, overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  const s = { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: 50, ...stats };
  return {
    pokemon: {
      id: 1,
      name,
      types: [{ type: { name: 'normal' } }] as any,
      stats: Object.entries(s).map(([stat, base_stat]) => ({ stat: { name: stat }, base_stat })),
      weight: 100,
      abilities: [{ ability: { name: 'keen-eye' } }],
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

function makeTeam(members: BattlePokemon[]): BattleTeam {
  return {
    pokemon: members,
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  } as BattleTeam;
}

/** Player lead is fast (150), opponent lead is slow (30); each side has two bench Pokémon. */
function makeBattle(opts: { player?: BattlePokemon[]; opponent?: BattlePokemon[]; seed?: number } = {}): BattleState {
  return {
    player: makeTeam(opts.player ?? [makeMon('p-lead', { speed: 150 }), makeMon('p-bench-1'), makeMon('p-bench-2')]),
    opponent: makeTeam(opts.opponent ?? [makeMon('o-lead', { speed: 30 }), makeMon('o-bench-1'), makeMon('o-bench-2')]),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng(opts.seed ?? 99),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

const move = (moveId: string, target: 'player' | 'opponent' = 'opponent'): BattleAction => ({ type: 'move', moveId, target });
const sw = (switchIndex: number): BattleAction => ({ type: 'switch', switchIndex });

async function playTurn(state: BattleState, p: BattleAction, o: BattleAction) {
  await runBattleTurnFromQueue(state, buildActionQueue(state, p, o), { clearBattleLog: true });
  state.turn += 1;
  return state.battleLog.map((e) => e.message);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('switching out resets stat stages and volatiles', () => {
  it('clears boosts, confusion, Substitute and choice lock but keeps status', async () => {
    const state = makeBattle();
    const lead = state.player.pokemon[0];
    lead.statModifiers.attack = 2;
    lead.statModifiers.speed = -1;
    lead.status = 'burned';
    lead.volatile.confusion = { turns: 2 };
    lead.volatile.substitute = { hp: 50 };
    lead.volatile.choiceLock = 'tackle';

    await playTurn(state, sw(1), move('splash', 'opponent'));

    expect(state.player.currentIndex).toBe(1);
    expect(lead.statModifiers.attack).toBe(0);
    expect(lead.statModifiers.speed).toBe(0);
    expect(lead.volatile.confusion).toBeUndefined();
    expect(lead.volatile.substitute).toBeUndefined();
    expect(lead.volatile.choiceLock).toBeUndefined();
    expect(lead.status).toBe('burned');
  });

  it('keeps one-time item flags (Focus Sash used, eaten berry for Harvest)', () => {
    const mon = makeMon('flags');
    mon.volatile.focusSashUsed = true;
    mon.volatile.lastConsumedBerry = 'sitrus-berry';
    mon.volatile.taunt = { turns: 2 };
    applySwitchOutAbilities(mon);
    expect(mon.volatile).toEqual({ focusSashUsed: true, lastConsumedBerry: 'sitrus-berry' });
  });
});

describe('Roar / Whirlwind', () => {
  it('drags out a random bench Pokémon and resets the old one', async () => {
    const state = makeBattle();
    const lead = state.opponent.pokemon[0];
    lead.statModifiers.attack = 3;

    const log = await playTurn(state, move('roar'), move('splash', 'opponent'));

    expect(state.opponent.currentIndex).not.toBe(0);
    expect(log.some((m) => m.endsWith('was dragged out!'))).toBe(true);
    expect(lead.statModifiers.attack).toBe(0);
  });

  it('fails when the target has nothing to switch to', async () => {
    const state = makeBattle({
      opponent: [makeMon('o-lead', { speed: 30 }), makeMon('o-fainted', {}, { currentHp: 0 })],
    });
    const log = await playTurn(state, move('whirlwind'), move('splash', 'opponent'));
    expect(state.opponent.currentIndex).toBe(0);
    expect(log).toContain('But it failed!');
  });

  it('is blocked by Suction Cups', async () => {
    const state = makeBattle();
    state.opponent.pokemon[0].currentAbility = 'suction-cups';
    const log = await playTurn(state, move('roar'), move('splash', 'opponent'));
    expect(state.opponent.currentIndex).toBe(0);
    expect(log.some((m) => m.includes('anchors itself with Suction Cups'))).toBe(true);
  });

  it('works through Protect-style volatiles and Substitute', async () => {
    const state = makeBattle();
    state.opponent.pokemon[0].volatile.substitute = { hp: 75 };
    await playTurn(state, move('roar'), move('splash', 'opponent'));
    expect(state.opponent.currentIndex).not.toBe(0);
  });

  it('the dragged-in Pokémon does not use the move its predecessor chose', async () => {
    // Both use -6 moves; the faster player phazes first, so the opponent's queued Roar must not run.
    const state = makeBattle();
    const log = await playTurn(state, move('whirlwind'), move('roar', 'player'));
    expect(state.opponent.currentIndex).not.toBe(0);
    expect(state.player.currentIndex).toBe(0);
    const newcomer = getCurrentPokemon(state.opponent).pokemon.name;
    expect(log.some((m) => m === `${newcomer} used roar!`)).toBe(false);
  });
});

describe('Dragon Tail', () => {
  it('deals damage and drags the target out', async () => {
    const state = makeBattle();
    const lead = state.opponent.pokemon[0];
    await playTurn(state, move('dragon-tail'), move('splash', 'opponent'));
    expect(lead.currentHp).toBeLessThan(300);
    expect(state.opponent.currentIndex).not.toBe(0);
  });

  it('still deals damage (without failing) when nothing can come in', async () => {
    const state = makeBattle({ opponent: [makeMon('o-lead', { speed: 30 })] });
    const log = await playTurn(state, move('dragon-tail'), move('splash', 'opponent'));
    expect(state.opponent.pokemon[0].currentHp).toBeLessThan(300);
    expect(log).not.toContain('But it failed!');
  });

  it('does not drag the target out when the hit lands on a Substitute', async () => {
    const state = makeBattle();
    state.opponent.pokemon[0].volatile.substitute = { hp: 200 };
    await playTurn(state, move('dragon-tail'), move('splash', 'opponent'));
    expect(state.opponent.currentIndex).toBe(0);
  });
});

describe('Baton Pass', () => {
  it('passes stat stages and Substitute to the replacement', async () => {
    const state = makeBattle();
    const lead = state.player.pokemon[0];
    lead.statModifiers.attack = 2;
    lead.statModifiers.speed = 1;
    lead.volatile.substitute = { hp: 40 };

    await playTurn(state, move('baton-pass', 'player'), move('splash', 'opponent'));

    expect(state.player.currentIndex).toBe(1);
    const incoming = getCurrentPokemon(state.player);
    expect(incoming.statModifiers.attack).toBe(2);
    expect(incoming.statModifiers.speed).toBe(1);
    expect(incoming.volatile.substitute).toEqual({ hp: 40 });
    expect(lead.statModifiers.attack).toBe(0);
    expect(lead.volatile.substitute).toBeUndefined();
  });

  it('does not pass Disable or choice lock', async () => {
    const state = makeBattle();
    state.player.pokemon[0].volatile.disable = { move: 'tackle', turns: 3 };
    await playTurn(state, move('baton-pass', 'player'), move('splash', 'opponent'));
    expect(state.player.currentIndex).toBe(1);
    expect(getCurrentPokemon(state.player).volatile.disable).toBeUndefined();
    expect(getCurrentPokemon(state.player).volatile.choiceLock).toBeUndefined();
  });

  it('fails with no bench Pokémon', async () => {
    const state = makeBattle({ player: [makeMon('alone', { speed: 150 })] });
    const log = await playTurn(state, move('baton-pass', 'player'), move('splash', 'opponent'));
    expect(log).toContain('But it failed!');
  });
});

describe('Magic Room', () => {
  it('suppresses held items (no Leftovers recovery) while active', async () => {
    const state = makeBattle();
    const lead = state.player.pokemon[0];
    lead.heldItem = 'leftovers';
    lead.currentHp = 150;

    await playTurn(state, move('magic-room', 'player'), move('splash', 'opponent'));
    expect(state.field.rooms?.magicRoom).toBeDefined();
    expect(lead.currentHp).toBe(150);
    expect(effectiveItem(lead)).toBeUndefined();
    expect(lead.heldItem).toBe('leftovers');
  });

  it('items work again when the room ends, and using it again cancels it', async () => {
    const state = makeBattle();
    const lead = state.player.pokemon[0];
    lead.heldItem = 'leftovers';
    lead.currentHp = 150;

    await playTurn(state, move('magic-room', 'player'), move('splash', 'opponent'));
    const log = await playTurn(state, move('magic-room', 'player'), move('splash', 'opponent'));
    expect(log.some((m) => m.startsWith('Magic Room wore off'))).toBe(true);
    expect(state.field.rooms?.magicRoom).toBeUndefined();
    expect(lead.currentHp).toBe(150 + Math.floor(300 / 16));
  });

  it('expires after 5 turns with a message', async () => {
    const state = makeBattle();
    await playTurn(state, move('magic-room', 'player'), move('splash', 'opponent'));
    let expired = false;
    for (let i = 0; i < 5 && !expired; i++) {
      const log = await playTurn(state, move('splash', 'player'), move('splash', 'opponent'));
      expired = log.some((m) => m.startsWith('Magic Room wore off'));
    }
    expect(expired).toBe(true);
    expect(state.field.rooms?.magicRoom).toBeUndefined();
    expect(state.player.pokemon[0].volatile.itemSuppressed).toBeUndefined();
  });

  it('applies to a Pokémon that switches in while it is active', async () => {
    const state = makeBattle();
    await playTurn(state, move('magic-room', 'player'), move('splash', 'opponent'));
    state.player.pokemon[1].heldItem = 'choice-scarf';
    await playTurn(state, sw(1), move('splash', 'opponent'));
    expect(effectiveItem(getCurrentPokemon(state.player))).toBeUndefined();
  });
});

describe('Wonder Room', () => {
  const wall = () => makeMon('wall', { speed: 30, defense: 200, 'special-defense': 20 });

  async function tackleDamage(withRoom: boolean) {
    const state = makeBattle({ opponent: [wall(), makeMon('o-bench')], seed: 7 });
    if (withRoom) state.field.rooms = { wonderRoom: { turns: 5 } };
    await playTurn(state, move('tackle'), move('splash', 'opponent'));
    return 300 - state.opponent.pokemon[0].currentHp;
  }

  it('physical moves hit the lower Sp. Def stat while active', async () => {
    const normal = await tackleDamage(false);
    const swapped = await tackleDamage(true);
    expect(swapped).toBeGreaterThan(normal);
  });

  it('toggles on and off with the move', async () => {
    const state = makeBattle();
    await playTurn(state, move('wonder-room', 'player'), move('splash', 'opponent'));
    expect(state.field.rooms?.wonderRoom).toBeDefined();
    await playTurn(state, move('wonder-room', 'player'), move('splash', 'opponent'));
    expect(state.field.rooms?.wonderRoom).toBeUndefined();
  });
});
