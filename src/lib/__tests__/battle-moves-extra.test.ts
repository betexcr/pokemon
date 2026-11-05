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
const status = (name: string, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, ...extra });
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100 },
  earthquake: { ...base, id: 89, name: 'earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100 },
  'focus-punch': { ...base, id: 264, name: 'focus-punch', type: 'Fighting', category: 'Physical', power: 150, accuracy: 100, priority: -3 },
  'foul-play': { ...base, id: 492, name: 'foul-play', type: 'Dark', category: 'Physical', power: 95, accuracy: 100 },
  'body-press': { ...base, id: 776, name: 'body-press', type: 'Fighting', category: 'Physical', power: 80, accuracy: 100 },
  'weather-ball': { ...base, id: 311, name: 'weather-ball', type: 'Normal', category: 'Special', power: 50, accuracy: 100 },
  'salt-cure': { ...base, id: 864, name: 'salt-cure', type: 'Rock', category: 'Physical', power: 40, accuracy: 100 },
  fissure: { ...base, id: 90, name: 'fissure', type: 'Ground', category: 'Physical', power: null, accuracy: 30 },
  'sheer-cold': { ...base, id: 329, name: 'sheer-cold', type: 'Ice', category: 'Special', power: null, accuracy: 30 },
  splash: status('splash'),
  'destiny-bond': status('destiny-bond', { type: 'Ghost' }),
  gravity: status('gravity', { type: 'Psychic' }),
  curse: status('curse', { type: 'Ghost' }),
  'shed-tail': status('shed-tail'),
  'revival-blessing': status('revival-blessing'),
  transform: status('transform'),
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; hp?: number; level?: number; ability?: string; stats?: Record<string, number> };
function makeMon(name: string, o: Opts = {}): BattlePokemon {
  const stats = { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: o.speed ?? 50, ...o.stats };
  return {
    pokemon: {
      id: 1, name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: Object.entries(stats).map(([stat, base_stat]) => ({ stat: { name: stat }, base_stat })),
      weight: 100, abilities: [],
    } as any,
    level: o.level ?? 50,
    currentHp: o.hp ?? 300, maxHp: 300,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

/** Player lead fast (150), opponent lead slow (30); each side has a bench Pokémon. */
function makeBattle(player = makeMon('p', { speed: 150 }), opponent = makeMon('o', { speed: 30 }), seed = 12): BattleState {
  return {
    player: team([player, makeMon('p-bench')]), opponent: team([opponent, makeMon('o-bench')]),
    turn: 1, field: createFieldState(), battleLog: [], actionQueue: [], rng: createBattleRng(seed),
    isComplete: false, phase: 'choice',
  } as BattleState;
}
const mv = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const SPLASH = mv('splash');
async function play(s: BattleState, p: BattleAction, o: BattleAction = SPLASH, manual: Array<'player' | 'opponent'> = []) {
  const outcome = await runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true, manualSwitchSides: manual });
  return { outcome, log: s.battleLog.map((e) => e.message) };
}
const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);
const hit = (s: BattleState, name: string) => Number(s.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Destiny Bond', () => {
  it('takes the attacker down when the user is knocked out', async () => {
    const s = makeBattle(makeMon('ghost', { speed: 150, hp: 5 }));
    const { log } = await play(s, mv('destiny-bond'), mv('tackle'));
    expect(s.player.pokemon[0].currentHp).toBe(0);
    expect(s.opponent.pokemon[0].currentHp).toBe(0);
    expect(log).toContain('ghost took its attacker down with it!');
  });

  it('wears off at the user’s next move and fails twice in a row', async () => {
    const s = makeBattle();
    await play(s, mv('destiny-bond'));
    const { log } = await play(s, mv('destiny-bond'));
    expect(log).toContain('But it failed!');
    expect(P(s).volatile.destinyBond).toBeUndefined();
  });
});

describe('Focus Punch', () => {
  it('announces focus and hits when the user was not damaged', async () => {
    const s = makeBattle();
    const { log } = await play(s, mv('focus-punch'));
    expect(log[0]).toBe('p is tightening its focus!');
    expect(O(s).currentHp).toBeLessThan(300);
  });

  it('fails if the user is hit first', async () => {
    const s = makeBattle();
    const { log } = await play(s, mv('focus-punch'), mv('tackle'));
    expect(log).toContain("p lost its focus and couldn't move!");
    expect(O(s).currentHp).toBe(300);
  });
});

describe('Foul Play / Body Press', () => {
  async function damage(moveId: string, attacker: BattlePokemon, defender: BattlePokemon) {
    const s = makeBattle(attacker, defender, 2);
    await play(s, mv(moveId));
    return hit(s, defender.pokemon.name);
  }

  it('Foul Play scales with the target’s Attack', async () => {
    const weak = await damage('foul-play', makeMon('p', { speed: 150 }), makeMon('t', { speed: 30, stats: { attack: 40 } }));
    const strong = await damage('foul-play', makeMon('p', { speed: 150 }), makeMon('t', { speed: 30, stats: { attack: 200 } }));
    expect(strong).toBeGreaterThan(weak * 2);
  });

  it('Body Press scales with the user’s Defense', async () => {
    const low = await damage('body-press', makeMon('p', { speed: 150, stats: { defense: 40 } }), makeMon('t', { speed: 30 }));
    const high = await damage('body-press', makeMon('p', { speed: 150, stats: { defense: 200 } }), makeMon('t', { speed: 30 }));
    expect(high).toBeGreaterThan(low * 2);
  });
});

describe('Weather Ball', () => {
  it('becomes Fire-type with 100 power in sun (hits a Ghost a Normal move would miss)', async () => {
    let s = makeBattle(makeMon('p', { speed: 150 }), makeMon('ghost', { speed: 30, types: ['ghost'] }));
    await play(s, mv('weather-ball'));
    expect(O(s).currentHp).toBe(300);

    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('ghost', { speed: 30, types: ['ghost'] }));
    s.field.weather = { kind: 'sun', turns: 5 };
    await play(s, mv('weather-ball'));
    expect(O(s).currentHp).toBeLessThan(300);
  });
});

describe('Gravity', () => {
  it('grounds Flying types for Ground moves and wears off after 5 turns', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('bird', { speed: 30, types: ['flying'] }));
    await play(s, mv('gravity'));
    expect(s.field.rooms?.gravity).toBeDefined();
    await play(s, mv('earthquake'));
    expect(O(s).currentHp).toBeLessThan(300);
    let ended = false;
    for (let i = 0; i < 5 && !ended; i++) ended = (await play(s, SPLASH)).log.includes('Gravity returned to normal!');
    expect(ended).toBe(true);
    expect(O(s).volatile.gravityGrounded).toBeUndefined();
  });
});

describe('Curse', () => {
  it('non-Ghost users trade Speed for Attack and Defense', async () => {
    const s = makeBattle();
    await play(s, mv('curse'));
    expect(P(s).statModifiers).toMatchObject({ attack: 1, defense: 1, speed: -1 });
  });

  it('Ghost users pay half their HP and the target loses 1/4 each turn', async () => {
    const s = makeBattle(makeMon('gengar', { speed: 150, types: ['ghost'] }));
    await play(s, mv('curse'));
    expect(P(s).currentHp).toBe(150);
    expect(O(s).volatile.cursed).toBe(true);
    expect(O(s).currentHp).toBe(300 - 75);
  });
});

describe('Salt Cure', () => {
  it('deals 1/8 each turn, 1/4 to Water types', async () => {
    const plain = makeBattle();
    await play(plain, mv('salt-cure'));
    const afterHit = hit(plain, 'o');
    expect(O(plain).currentHp).toBe(300 - afterHit - Math.floor(300 / 8));

    const water = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, types: ['water'] }));
    await play(water, mv('salt-cure'));
    expect(O(water).currentHp).toBe(300 - hit(water, 'o') - Math.floor(300 / 4));
  });
});

describe('Shed Tail', () => {
  it('pays half HP and hands a 1/4-HP substitute to the replacement', async () => {
    const s = makeBattle();
    await play(s, mv('shed-tail'));
    expect(s.player.pokemon[0].currentHp).toBe(150);
    expect(s.player.currentIndex).toBe(1);
    expect(P(s).volatile.substitute).toEqual({ hp: 75 });
  });

  it('fails without enough HP', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, hp: 150 }));
    const { log } = await play(s, mv('shed-tail'));
    expect(log).toContain('But it does not have enough HP left to make a substitute!');
    expect(s.player.currentIndex).toBe(0);
  });
});

describe('Revival Blessing', () => {
  it('revives the only fainted Pokémon automatically at half HP', async () => {
    const s = makeBattle();
    s.player.pokemon[1].currentHp = 0;
    s.player.pokemon[1].status = 'burned';
    const { log } = await play(s, mv('revival-blessing'));
    expect(s.player.pokemon[1].currentHp).toBe(150);
    expect(s.player.pokemon[1].status).toBeUndefined();
    expect(log).toContain('p-bench was revived and is ready to fight again!');
  });

  it('lets the player pick when two or more have fainted', async () => {
    const s = makeBattle();
    s.player.pokemon.push(makeMon('p-bench-2'));
    s.player.pokemon[1].currentHp = 0;
    s.player.pokemon[2].currentHp = 0;
    const { outcome } = await play(s, mv('revival-blessing'), SPLASH, ['player']);
    expect(outcome).toBe('awaiting-switch');
    expect(s.pendingSwitch).toMatchObject({ reason: 'revival-blessing', options: [1, 2] });
    await resumeBattleTurnAfterSwitch(s, 2);
    expect(s.player.pokemon[2].currentHp).toBe(150);
    expect(s.player.pokemon[1].currentHp).toBe(0);
    expect(s.player.currentIndex).toBe(0);
  });

  it('fails with nobody to revive', async () => {
    const s = makeBattle();
    expect((await play(s, mv('revival-blessing'))).log).toContain('But it failed!');
  });
});

describe('One-hit KO moves', () => {
  it('KOs when the level gap makes it certain', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, level: 100 }), makeMon('o', { speed: 30, level: 30 }));
    const { log } = await play(s, mv('fissure'));
    expect(s.opponent.pokemon[0].currentHp).toBe(0);
    expect(log).toContain("It's a one-hit KO!");
  });

  it('fails against a higher-level target, Sturdy, or (Sheer Cold) an Ice type', async () => {
    let s = makeBattle(makeMon('p', { speed: 150, level: 40 }), makeMon('o', { speed: 30, level: 60 }));
    expect((await play(s, mv('fissure'))).log).toContain('But it failed!');

    s = makeBattle(makeMon('p', { speed: 150, level: 100 }), makeMon('o', { speed: 30, level: 30, ability: 'sturdy' }));
    expect((await play(s, mv('fissure'))).log).toContain('o is protected by Sturdy!');

    s = makeBattle(makeMon('p', { speed: 150, level: 100 }), makeMon('o', { speed: 30, level: 30, types: ['ice'] }));
    await play(s, mv('sheer-cold'));
    expect(O(s).currentHp).toBe(300);
  });
});

describe('Transform', () => {
  it('copies types, stats, moves (5 PP) and boosts, and reverts on switch-out', async () => {
    const foe = makeMon('dragon', { speed: 30, types: ['dragon'], stats: { attack: 180 } });
    foe.moves = [{ id: 'earthquake', pp: 10, maxPp: 10 }];
    foe.statModifiers.attack = 2;
    const s = makeBattle(makeMon('ditto', { speed: 150 }), foe);
    const { log } = await play(s, mv('transform'));
    const ditto = s.player.pokemon[0];
    expect(log).toContain('ditto transformed into dragon!');
    expect(ditto.pokemon.types.map((t: any) => t.type.name)).toEqual(['dragon']);
    expect(ditto.moves).toEqual([{ id: 'earthquake', pp: 5, maxPp: 5 }]);
    expect(ditto.statModifiers.attack).toBe(2);
    expect(ditto.pokemon.name).toBe('ditto');

    await play(s, { type: 'switch', switchIndex: 1 });
    expect(ditto.pokemon.types.map((t: any) => t.type.name)).toEqual(['normal']);
    expect(ditto.moves.map((m) => m.id)).toContain('transform');
  });
});
