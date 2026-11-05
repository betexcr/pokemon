import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { resumeBattleTurnAfterSwitch, runBattleTurnFromQueue } from '../team-battle-engine-additional';
import { displayTypes, publicBenchEntries } from '../team-battle-illusion';
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
const sc = (stat: string, stages: number) => ({ stat, stages, chance: 100 });
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, makesContact: true },
  ember: { ...base, id: 52, name: 'ember', type: 'Fire', category: 'Special', power: 40, accuracy: 100 },
  'u-turn': { ...base, id: 369, name: 'u-turn', type: 'Bug', category: 'Physical', power: 70, accuracy: 100 },
  'close-combat': { ...base, id: 370, name: 'close-combat', type: 'Fighting', category: 'Physical', power: 120, accuracy: 100, statChanges: [sc('def', -1), sc('spd', -1)] },
  growl: { ...base, id: 45, name: 'growl', type: 'Normal', category: 'Status', power: null, accuracy: 100, statChanges: [sc('atk', -1)], target: 'all-opponents' },
  'kings-shield': { ...base, id: 588, name: 'kings-shield', type: 'Steel', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, priority: 4, target: 'user' },
  splash: { ...base, id: 150, name: 'splash', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'user' },
  'calm-mind': { ...base, id: 347, name: 'calm-mind', type: 'Psychic', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'user', statChanges: [sc('spa', 1), sc('spd', 1)] },
  fly: { ...base, id: 19, name: 'fly', type: 'Flying', category: 'Physical', power: 90, accuracy: 95 },
  gravity: { ...base, id: 356, name: 'gravity', type: 'Psychic', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, target: 'entire-field' },
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; hp?: number; maxHp?: number; level?: number; ability?: string; item?: string; stats?: Record<string, number> };
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
    currentHp: o.hp ?? o.maxHp ?? 320, maxHp: o.maxHp ?? 320,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    heldItem: o.item,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

function makeBattle(player = makeMon('p', { speed: 150 }), opponent = makeMon('o', { speed: 30 }), seed = 8): BattleState {
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
const typesOf = (m: BattlePokemon) => m.pokemon.types.map((t: any) => t.type.name);
const baseStat = (m: BattlePokemon, name: string) => (m.pokemon.stats as any[]).find((x) => x.stat.name === name).base_stat;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Protean / Libero', () => {
  it('changes type to the move before using it, once per entry, and reverts on switch-out', async () => {
    const s = makeBattle(makeMon('greninja', { speed: 150, types: ['water', 'dark'], ability: 'protean' }));
    const log = await play(s, mv('ember'));
    expect(log).toContain('greninja transformed into the Fire type!');
    expect(typesOf(P(s))).toEqual(['fire']);
    await play(s, mv('tackle'));
    expect(typesOf(P(s))).toEqual(['fire']);
    await play(s, { type: 'switch', switchIndex: 1 });
    expect(typesOf(s.player.pokemon[0])).toEqual(['water', 'dark']);
  });
});

describe('Disguise / Ice Face', () => {
  it('Disguise takes the first hit for 1/8 HP, then is busted for good', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('mimikyu', { speed: 30, ability: 'disguise' }));
    const log = await play(s, mv('tackle'));
    expect(log).toContain('Its disguise served it as a decoy!');
    expect(O(s).currentHp).toBe(320 - 40);
    await play(s, mv('tackle'));
    expect(O(s).currentHp).toBeLessThan(280);
    expect(O(s).disguiseBusted).toBe(true);
  });

  it('Mold Breaker ignores Disguise', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, ability: 'mold-breaker' }), makeMon('mimikyu', { speed: 30, ability: 'disguise' }));
    await play(s, mv('tackle'));
    expect(O(s).disguiseBusted).toBeUndefined();
    expect(O(s).currentHp).toBeLessThan(320);
  });

  it('Ice Face blocks one physical hit and comes back in snow', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('eiscue', { speed: 30, ability: 'ice-face' }));
    await play(s, mv('ember'));
    expect(O(s).iceFaceBroken).toBeUndefined();
    const hpAfterEmber = O(s).currentHp;
    await play(s, mv('tackle'));
    expect(O(s).currentHp).toBe(hpAfterEmber);
    expect(O(s).iceFaceBroken).toBe(true);
    s.field.weather = { kind: 'snow', turns: 5 };
    const log = await play(s, SPLASH);
    expect(log).toContain("eiscue's Ice Face was restored!");
  });
});

describe('Illusion', () => {
  it('appears as the last party member until a damaging hit breaks it', async () => {
    const zoroark = makeMon('zoroark', { speed: 30, ability: 'illusion' });
    const s = makeBattle(makeMon('p', { speed: 150 }), zoroark);
    s.opponent.pokemon.push(makeMon('decoy'));
    const log = await play(s, mv('growl'), mv('tackle'));
    expect(log).toContain('decoy used tackle!');
    expect(log.some((m) => m.includes('zoroark'))).toBe(false);
    expect(O(s).volatile.illusion?.species).toBe('decoy');

    const log2 = await play(s, mv('tackle'), mv('tackle'));
    expect(log2).toContain("zoroark's illusion wore off!");
    expect(log2).toContain('zoroark used tackle!');
    expect(O(s).volatile.illusion).toBeUndefined();
  });
});

describe('Imposter', () => {
  it('transforms into the foe on entry', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, types: ['dragon'] }));
    s.player.pokemon[1] = makeMon('ditto', { ability: 'imposter' });
    const log = await play(s, { type: 'switch', switchIndex: 1 });
    expect(log).toContain('ditto transformed into o!');
    expect(typesOf(P(s))).toEqual(['dragon']);
  });
});

describe('form changes', () => {
  it('Stance Change: Blade Forme to attack, Shield Forme with King’s Shield', async () => {
    const s = makeBattle(makeMon('aegislash', { speed: 150, ability: 'stance-change', types: ['steel', 'ghost'], stats: { attack: 50, defense: 140 } }));
    let log = await play(s, mv('tackle'));
    expect(log).toContain('Changed to Blade Forme!');
    expect(baseStat(P(s), 'attack')).toBe(140);
    log = await play(s, mv('kings-shield'));
    expect(log).toContain('Changed to Shield Forme!');
    expect(baseStat(P(s), 'defense')).toBe(140);
  });

  it('Zen Mode at half HP or less', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('darmanitan', { speed: 30, ability: 'zen-mode', types: ['fire'], hp: 150 }));
    const log = await play(s, SPLASH);
    expect(log).toContain('Zen Mode triggered!');
    expect(typesOf(O(s))).toEqual(['fire', 'psychic']);
  });

  it('Schooling above 1/4 HP, stops schooling below', async () => {
    const s = makeBattle(makeMon('wishiwashi', { speed: 150, ability: 'schooling', stats: { attack: 20 } }), makeMon('o', { speed: 30 }));
    let log = await play(s, SPLASH);
    expect(log).toContain('wishiwashi formed a school!');
    expect(baseStat(P(s), 'attack')).toBe(140);
    P(s).currentHp = 60;
    log = await play(s, SPLASH);
    expect(log).toContain('wishiwashi stopped schooling!');
    expect(baseStat(P(s), 'attack')).toBe(20);
  });
});

describe('Eject Button / Red Card / Eject Pack', () => {
  it('Eject Button switches the holder out and cancels the attacker’s U-turn', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'eject-button' }));
    const log = await play(s, mv('u-turn'));
    expect(log).toContain('o is switched out with the Eject Button!');
    expect(s.opponent.currentIndex).toBe(1);
    expect(s.player.currentIndex).toBe(0);
    expect(s.opponent.pokemon[0].heldItem).toBeUndefined();
  });

  it('Red Card drags the attacker out', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'red-card' }));
    const log = await play(s, mv('tackle'));
    expect(log).toContain('o held up its Red Card against p!');
    expect(s.player.currentIndex).toBe(1);
  });

  it('Eject Pack switches out after a stat drop, including self-inflicted ones', async () => {
    let s = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'eject-pack' }));
    let log = await play(s, mv('growl'));
    expect(log).toContain('o is switched out by the Eject Pack!');
    expect(s.opponent.currentIndex).toBe(1);

    s = makeBattle(makeMon('p', { speed: 150, item: 'eject-pack' }));
    log = await play(s, mv('close-combat'));
    expect(s.player.currentIndex).toBe(1);
  });
});

describe('Iron Ball', () => {
  it('grounds a Flying holder (Spikes hurt it)', async () => {
    const s = makeBattle();
    s.player.pokemon[1] = makeMon('bird', { types: ['flying'], item: 'iron-ball' });
    s.player.sideConditions.hazards.spikes = 1;
    await play(s, { type: 'switch', switchIndex: 1 });
    expect(P(s).currentHp).toBe(320 - 40);
  });
});

describe('remaining simplifications', () => {
  it('Illusion: the public bench and types stay consistent with the disguise', async () => {
    const zoroark = makeMon('zoroark', { speed: 30, ability: 'illusion', types: ['dark'] });
    const s = makeBattle(makeMon('p', { speed: 150 }), zoroark);
    s.opponent.pokemon.push(makeMon('decoy', { types: ['electric'] }));
    await play(s, mv('calm-mind'));
    expect(displayTypes(O(s))).toEqual(['electric']);
    const bench = publicBenchEntries(s.opponent).map((b) => b.species);
    expect(bench).toEqual(['o-bench', 'zoroark']);
    expect(bench).not.toContain('decoy');
  });

  it('Ice Face: Noice Face stats after the hit, Ice Face stats again when snow restores it', async () => {
    const s = makeBattle(makeMon('p', { speed: 150 }), makeMon('eiscue', { speed: 50, ability: 'ice-face', stats: { defense: 110, 'special-defense': 90 } }));
    const log = await play(s, mv('tackle'));
    expect(log).toContain('eiscue transformed into Noice Face!');
    expect(baseStat(O(s), 'speed')).toBe(130);
    expect(baseStat(O(s), 'defense')).toBe(70);
    // Noice Face persists through switching
    await play(s, SPLASH, { type: 'switch', switchIndex: 1 });
    expect(baseStat(s.opponent.pokemon[0], 'speed')).toBe(130);
    // Coming back in during snow restores Ice Face
    s.field.weather = { kind: 'snow', turns: 5 };
    await play(s, SPLASH, { type: 'switch', switchIndex: 0 });
    expect(O(s).iceFaceBroken).toBe(false);
    expect(baseStat(O(s), 'speed')).toBe(50);
    expect(baseStat(O(s), 'defense')).toBe(110);
  });

  it('Eject Pack after an Intimidate drop lets the player pick, then the turn continues', async () => {
    const s = makeBattle(makeMon('p', { speed: 150, item: 'eject-pack' }), makeMon('o', { speed: 30 }));
    s.player.pokemon.push(makeMon('p-bench-2'));
    s.opponent.pokemon[1].currentAbility = 'intimidate';
    const outcome = await runBattleTurnFromQueue(
      s,
      buildActionQueue(s, mv('tackle'), { type: 'switch', switchIndex: 1 }),
      { clearBattleLog: true, manualSwitchSides: ['player'] },
    );
    expect(outcome).toBe('awaiting-switch');
    expect(s.pendingSwitch).toMatchObject({ side: 'player', options: [1, 2] });
    expect(s.battleLog.map((e) => e.message)).toContain('p is switched out by the Eject Pack!');

    expect(await resumeBattleTurnAfterSwitch(s, 2)).toBe('complete');
    expect(s.player.currentIndex).toBe(2);
    // The ejected Pokémon's queued tackle does not happen
    expect(s.battleLog.some((e) => e.message === 'p used tackle!')).toBe(false);
  });

  it('Gravity blocks airborne moves and pulls a Fly user down', async () => {
    const s = makeBattle(makeMon('p', { speed: 30 }), makeMon('bird', { speed: 150, types: ['flying'] }));
    // Bird starts Fly (faster), then Gravity grounds it mid-charge
    let log = await play(s, mv('gravity'), mv('fly'));
    expect(log).toContain("bird couldn't stay airborne because of gravity!");
    expect(O(s).volatile.semiInvulnerable).toBeUndefined();
    log = await play(s, SPLASH, mv('fly'));
    expect(log).toContain("bird can't use fly because of gravity!");
    expect(log).toContain("p can't use splash because of gravity!");
  });
});
