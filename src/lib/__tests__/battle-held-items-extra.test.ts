import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  getCurrentPokemon,
  normalizeServerBattleAction,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { BATTLE_ITEMS } from '../battle-items-catalog';
import { STATUS_CURE_BERRIES, THIRD_HEAL_BERRIES, STAT_BOOST_BERRIES, TYPE_RESIST_BERRIES } from '../team-battle-items';
import { TYPE_BOOST_ITEMS } from '../battle-move-constants';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const sc = (stat: string, stages: number) => ({ stat, stages, chance: 100 });
const status = (name: string, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'user', ...extra });
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, makesContact: true },
  'ice-punch': { ...base, id: 8, name: 'ice-punch', type: 'Ice', category: 'Physical', power: 75, accuracy: 100, makesContact: true },
  'water-gun': { ...base, id: 55, name: 'water-gun', type: 'Water', category: 'Special', power: 40, accuracy: 100 },
  'mega-drain': { ...base, id: 72, name: 'mega-drain', type: 'Grass', category: 'Special', power: 40, accuracy: 100, drain: { fraction: 0.5 } },
  'bullet-seed': { ...base, id: 331, name: 'bullet-seed', type: 'Grass', category: 'Physical', power: 25, accuracy: 100, hits: { min: 2, max: 5 } },
  'rock-slide': { ...base, id: 157, name: 'rock-slide', type: 'Rock', category: 'Physical', power: 75, accuracy: 100, ailment: { kind: 'flinch', chance: 30 } },
  'flame-wheel': { ...base, id: 172, name: 'flame-wheel', type: 'Fire', category: 'Physical', power: 60, accuracy: 100, ailment: { kind: 'burn', chance: 100 } },
  wrap: { ...base, id: 35, name: 'wrap', type: 'Normal', category: 'Physical', power: 15, accuracy: 100 },
  'solar-beam': { ...base, id: 76, name: 'solar-beam', type: 'Grass', category: 'Special', power: 120, accuracy: 100 },
  'hyper-voice': { ...base, id: 304, name: 'hyper-voice', type: 'Normal', category: 'Special', power: 90, accuracy: 100 },
  'miss-move': { ...base, id: 2, name: 'miss-move', type: 'Normal', category: 'Physical', power: 40, accuracy: 0 },
  growl: status('growl', { statChanges: [sc('atk', -1)], target: 'all-opponents', bypassAccuracyCheck: false, accuracy: 100 }),
  'swords-dance': status('swords-dance', { statChanges: [sc('atk', 2)] }),
  'thunder-wave': status('thunder-wave', { target: 'selected-pokemon', ailment: { kind: 'paralysis', chance: 0 }, bypassAccuracyCheck: false, accuracy: 100 }),
  taunt: status('taunt', { target: 'selected-pokemon' }),
  'trick-room': status('trick-room', { priority: -7, target: 'entire-field' }),
  splash: status('splash'),
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; hp?: number; ability?: string; item?: string; level?: number };
function makeMon(name: string, o: Opts = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1, name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((st) => ({ stat: { name: st }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: o.speed ?? 50 }]),
      weight: 100, abilities: [],
    } as any,
    level: o.level ?? 50,
    currentHp: o.hp ?? 320, maxHp: 320,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    heldItem: o.item,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;
function makeBattle(player = makeMon('p', { speed: 150 }), opponent = makeMon('o', { speed: 30 }), seed = 4): BattleState {
  return {
    player: team([player, makeMon('p-bench')]), opponent: team([opponent, makeMon('o-bench')]),
    turn: 1, field: createFieldState(), battleLog: [], actionQueue: [], rng: createBattleRng(seed),
    isComplete: false, phase: 'choice',
  } as BattleState;
}
const mv = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const SPLASH = mv('splash');
async function play(s: BattleState, p: BattleAction, o: BattleAction = SPLASH) {
  await runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true });
  return s.battleLog.map((e) => e.message);
}
const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);
const hit = (s: BattleState, name: string) => Number(s.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);

async function damageWith(item: string | undefined, moveId: string, seed = 4) {
  const s = makeBattle(makeMon('p', { speed: 150, item }), makeMon('o', { speed: 30 }), seed);
  await play(s, mv(moveId));
  return hit(s, 'o');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('catalog coverage', () => {
  it('every item offered in the team builder is implemented by the engine', () => {
    const libDir = path.resolve(__dirname, '..');
    const source = fs.readdirSync(libDir)
      .filter((f) => f.endsWith('.ts') && f !== 'battle-items-catalog.ts')
      .map((f) => fs.readFileSync(path.join(libDir, f), 'utf8'))
      .join('\n');
    const tabled = new Set([
      ...Object.keys(STATUS_CURE_BERRIES), ...THIRD_HEAL_BERRIES, ...Object.keys(STAT_BOOST_BERRIES),
      ...Object.keys(TYPE_RESIST_BERRIES), ...Object.keys(TYPE_BOOST_ITEMS),
    ]);
    const missing = BATTLE_ITEMS.map((i) => i.id).filter((id) => !tabled.has(id) && !source.includes(`'${id}'`));
    expect(missing).toEqual([]);
  });
});

describe('turn order', () => {
  it('Custap Berry lets a slower holder at 1/4 HP move first, once', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, hp: 70, item: 'custap-berry' }));
    const log = await play(s, mv('tackle'), mv('tackle'));
    expect(log).toContain('o can act faster than normal, thanks to its Custap Berry!');
    expect(log.indexOf('o used tackle!')).toBeLessThan(log.indexOf('p used tackle!'));
    expect(O(s).heldItem).toBeUndefined();
  });

  it('Quick Claw sometimes moves first (20%)', async () => {
    let firsts = 0;
    // Spread seeds: the Lehmer RNG's first draw is tiny for small integer seeds
    for (let i = 1; i <= 40; i++) {
      const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'quick-claw' }), i * 1_000_003);
      const log = await play(s, mv('tackle'), mv('tackle'));
      if (log.indexOf('o used tackle!') < log.indexOf('p used tackle!')) firsts++;
    }
    expect(firsts).toBeGreaterThan(0);
    expect(firsts).toBeLessThan(20);
  });
});

describe('power and multi-hit', () => {
  it('Muscle Band / Wise Glasses / Punching Glove boost their moves', async () => {
    expect(await damageWith('muscle-band', 'tackle')).toBeGreaterThan(await damageWith(undefined, 'tackle'));
    expect(await damageWith('wise-glasses', 'water-gun')).toBeGreaterThan(await damageWith(undefined, 'water-gun'));
    expect(await damageWith('punching-glove', 'ice-punch')).toBeGreaterThan(await damageWith(undefined, 'ice-punch'));
  });

  it('Punching Glove and Protective Pads avoid contact (no Rocky Helmet)', async () => {
    for (const item of ['punching-glove', 'protective-pads']) {
      const s = makeBattle(makeMon('p', { speed: 150, item }), makeMon('o', { speed: 30, item: 'rocky-helmet' }));
      await play(s, mv('ice-punch'));
      expect(P(s).currentHp).toBe(320);
    }
  });

  it('Metronome grows with consecutive use', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'metronome' }), makeMon('o', { speed: 30 }), 6);
    await play(s, mv('tackle'));
    expect(P(s).volatile.metronomeStreak).toBe(0);
    await play(s, mv('tackle'));
    await play(s, mv('tackle'));
    expect(P(s).volatile.metronomeStreak).toBe(2);
    await play(s, mv('water-gun'));
    expect(P(s).volatile.metronomeStreak).toBe(0);
  });

  it('Loaded Dice makes 2-5 hit moves hit 4 or 5 times', async () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = makeBattle(makeMon('p', { speed: 150, item: 'loaded-dice' }), makeMon('o', { speed: 30 }), seed);
      const log = await play(s, mv('bullet-seed'));
      const hits = Number(/Hit (\d) time/.exec(log.find((m) => m.startsWith('Hit ')) ?? '')?.[1]);
      expect([4, 5]).toContain(hits);
    }
  });

  it('Big Root boosts draining', async () => {
    const drain = async (item?: string) => {
      const s = makeBattle(makeMon('p', { speed: 150, hp: 100, item }), makeMon('o', { speed: 30 }), 9);
      await play(s, mv('mega-drain'));
      return P(s).currentHp - 100;
    };
    expect(await drain('big-root')).toBeGreaterThan(await drain());
  });

  it('Utility Umbrella ignores rain boosts', async () => {
    const water = async (item?: string) => {
      const s = makeBattle(makeMon('p', { speed: 150, item }), makeMon('o', { speed: 30 }), 4);
      s.field.weather = { kind: 'rain', turns: 5 };
      await play(s, mv('water-gun'));
      return hit(s, 'o');
    };
    expect(await water('utility-umbrella')).toBe(await damageWith(undefined, 'water-gun'));
    expect(await water()).toBeGreaterThan(await water('utility-umbrella'));
  });
});

describe('accuracy', () => {
  it('Blunder Policy: a miss sharply raises Speed', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'blunder-policy' }));
    const log = await play(s, mv('miss-move'));
    expect(log).toContain('p used its Blunder Policy!');
    expect(P(s).statModifiers.speed).toBe(2);
  });

  it('Micle Berry boost is used up by the next move', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, hp: 70, item: 'micle-berry' }));
    await play(s, mv('splash'));
    expect(P(s).volatile.micleBoost).toBe(true);
    await play(s, mv('tackle'));
    expect(P(s).volatile.micleBoost).toBeUndefined();
  });
});

describe('on-hit and secondary effects', () => {
  it('Covert Cloak blocks secondary effects', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'covert-cloak' }));
    await play(s, mv('flame-wheel'));
    expect(O(s).status).toBeUndefined();
  });

  it("King's Rock adds a flinch chance to moves without one", async () => {
    let flinches = 0;
    for (let i = 1; i <= 40; i++) {
      const s = makeBattle(makeMon('p', { speed: 150, item: 'kings-rock' }), makeMon('o', { speed: 30 }), i * 1_000_003);
      const log = await play(s, mv('tackle'), mv('tackle'));
      if (log.includes("o flinched and couldn't move!")) flinches++;
    }
    expect(flinches).toBeGreaterThan(0);
    expect(flinches).toBeLessThan(15);
  });

  it('Absorb Bulb / Luminous Moss / Cell Battery / Snowball react to their type', async () => {
    let s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'absorb-bulb' }));
    await play(s, mv('water-gun'));
    expect(O(s).statModifiers.specialAttack).toBe(1);
    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'snowball' }));
    await play(s, mv('ice-punch'));
    expect(O(s).statModifiers.attack).toBe(1);
    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'snowball' }));
    await play(s, mv('tackle'));
    expect(O(s).heldItem).toBe('snowball');
  });

  it('Kee / Jaboca / Enigma berries react to hits', async () => {
    let s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'kee-berry' }));
    await play(s, mv('tackle'));
    expect(O(s).statModifiers.defense).toBe(1);
    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'jaboca-berry' }));
    await play(s, mv('tackle'));
    expect(P(s).currentHp).toBe(320 - 40);
    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, types: ['fire'], item: 'enigma-berry' }));
    const log = await play(s, mv('water-gun'));
    expect(log).toContain('o restored HP with its Enigma Berry!');
  });

  it('Binding Band / Grip Claw strengthen binding', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'grip-claw' }), makeMon('o', { speed: 30 }));
    await play(s, mv('wrap'));
    expect(O(s).volatile.binding?.turnsLeft).toBe(6);
    const s2 = makeBattle(makeMon('p', { speed: 150, item: 'binding-band' }), makeMon('o', { speed: 30 }));
    await play(s2, mv('wrap'));
    expect(O(s2).volatile.binding?.fraction).toBeCloseTo(1 / 6);
  });
});

describe('stat reactions', () => {
  it('Clear Amulet blocks foe drops; Adrenaline Orb answers Intimidate', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'clear-amulet' }));
    const log = await play(s, mv('growl'));
    expect(log).toContain("o's Clear Amulet prevents its stats from being lowered!");
    expect(O(s).statModifiers.attack).toBe(0);

    const s2 = makeBattle(makeMon('p', { speed: 150, item: 'adrenaline-orb' }));
    s2.opponent.pokemon[1].currentAbility = 'intimidate';
    await play(s2, SPLASH, { type: 'switch', switchIndex: 1 });
    expect(P(s2).statModifiers.speed).toBe(1);
  });

  it('Mirror Herb copies the foe’s boosts once', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'mirror-herb' }));
    await play(s, mv('swords-dance'));
    expect(O(s).statModifiers.attack).toBe(2);
    expect(O(s).heldItem).toBeUndefined();
  });

  it('Throat Spray, Room Service and Mental Herb', async () => {
    let s = makeBattle(makeMon('p', { speed: 150, item: 'throat-spray' }));
    await play(s, mv('hyper-voice'));
    expect(P(s).statModifiers.specialAttack).toBe(1);

    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'room-service' }));
    await play(s, mv('trick-room'));
    expect(O(s).statModifiers.speed).toBe(-1);

    s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'mental-herb' }));
    O(s).volatile.taunt = { turns: 3 };
    await play(s, SPLASH);
    expect(O(s).volatile.taunt).toBeUndefined();
    expect(O(s).heldItem).toBeUndefined();
  });

  it('Power Herb skips the charge turn', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'power-herb' }));
    const log = await play(s, mv('solar-beam'));
    expect(log).toContain('p became fully charged due to its Power Herb!');
    expect(O(s).currentHp).toBeLessThan(320);
  });
});

describe('berries', () => {
  it('status berries cure right after the status lands', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'cheri-berry' }));
    const log = await play(s, mv('thunder-wave'));
    expect(O(s).status).toBeUndefined();
    expect(log).toContain("o's Cheri Berry cured its status!");
  });

  it('Figy-family berries heal 1/3 at 1/4 HP; Starf raises a stat', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, hp: 100, item: 'figy-berry' }));
    await play(s, mv('tackle'));
    expect(O(s).heldItem).toBeUndefined();

    const s2 = makeBattle(makeMon('p', { speed: 150, hp: 70, item: 'starf-berry' }));
    await play(s2, SPLASH);
    const boosts = Object.values(P(s2).statModifiers);
    expect(boosts).toContain(2);
  });

  it('Leppa Berry refills an empty move', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'leppa-berry' }));
    P(s).moves.find((m) => m.id === 'tackle')!.pp = 1;
    await play(s, mv('tackle'));
    expect(P(s).moves.find((m) => m.id === 'tackle')!.pp).toBe(10);
  });
});

describe('Ability Shield and Shed Shell', () => {
  it('Ability Shield keeps Levitate working against Mold Breaker', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, ability: 'mold-breaker' }), makeMon('o', { speed: 30, ability: 'levitate', item: 'ability-shield' }));
    MOVES.earthquake = { ...base, id: 89, name: 'earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100 } as unknown as CompiledMove;
    P(s).moves.push({ id: 'earthquake', pp: 10, maxPp: 10 });
    await play(s, mv('earthquake'));
    expect(O(s).currentHp).toBe(320);
  });

  it('bound Pokémon cannot switch unless they hold Shed Shell (or are Ghost types)', async () => {
    const s = makeBattle(makeMon('p', { speed: 30 }), makeMon('o', { speed: 150 }));
    await play(s, SPLASH, mv('wrap'));
    expect(P(s).volatile.binding).toBeDefined();
    expect(normalizeServerBattleAction(s.player, { type: 'switch', switchIndex: 1 }).errorCode).toBe('switch_trapped');
    const log = await play(s, { type: 'switch', switchIndex: 1 });
    expect(log).toContain("p can't escape!");
    expect(s.player.currentIndex).toBe(0);

    P(s).heldItem = 'shed-shell';
    expect(normalizeServerBattleAction(s.player, { type: 'switch', switchIndex: 1 }).errorCode).toBeUndefined();
    await play(s, { type: 'switch', switchIndex: 1 });
    expect(s.player.currentIndex).toBe(1);
  });
});
