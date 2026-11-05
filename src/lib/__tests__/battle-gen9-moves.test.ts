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
import { isTrapped } from '../team-battle-held-items';
import { captureEngineExtras, applyEngineExtras } from '../battle-engine-extras';
import { terastallize } from '../team-battle-tera';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const phys = (name: string, type: string, power: number, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Physical', power, accuracy: 100, ...extra });
const spec = (name: string, type: string, power: number, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Special', power, accuracy: 100, ...extra });
const status = (name: string, type = 'Normal', extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, ...extra });

const MOVES: Record<string, CompiledMove> = Object.fromEntries(
  [
    phys('tackle', 'Normal', 40, { makesContact: true }),
    phys('explosion', 'Normal', 250),
    spec('psyshock', 'Psychic', 80),
    spec('psychic', 'Psychic', 80),
    spec('freeze-dry', 'Ice', 70),
    spec('ice-beam', 'Ice', 90),
    phys('brick-break', 'Fighting', 75, { makesContact: true }),
    phys('false-swipe', 'Normal', 40, { makesContact: true }),
    phys('high-jump-kick', 'Fighting', 130, { makesContact: true }),
    spec('stored-power', 'Psychic', 20),
    phys('hard-press', 'Steel', null as unknown as number, { makesContact: true }),
    phys('payback', 'Dark', 50, { makesContact: true }),
    phys('stomping-tantrum', 'Ground', 75, { makesContact: true }),
    phys('thief', 'Dark', 60, { makesContact: true }),
    phys('smack-down', 'Rock', 50),
    phys('earthquake', 'Ground', 100),
    spec('future-sight', 'Psychic', 120),
    phys('triple-axel', 'Ice', 20, { makesContact: true }),
    spec('spit-up', 'Normal', null as unknown as number),
    phys('glaive-rush', 'Dragon', 120, { makesContact: true }),
    phys('retaliate', 'Normal', 70, { makesContact: true }),
    phys('fling', 'Dark', null as unknown as number),
    phys('wicked-blow', 'Dark', 75, { makesContact: true }),
    phys('crunch', 'Dark', 75, { makesContact: true }),
    phys('tera-blast', 'Normal', 80),
    phys('last-resort', 'Normal', 140, { makesContact: true }),
    phys('jaw-lock', 'Dark', 80, { makesContact: true }),
    status('protect', 'Normal', { priority: 4 }),
    status('kings-shield', 'Steel', { priority: 4 }),
    status('endure', 'Normal', { priority: 4 }),
    status('haze', 'Ice'),
    status('mean-look'),
    status('healing-wish', 'Psychic'),
    status('sleep-talk'),
    status('copycat'),
    status('teleport', 'Psychic', { priority: -6 }),
    status('skill-swap', 'Psychic'),
    status('spite', 'Ghost'),
    status('stockpile'),
    status('pain-split'),
    status('toxic', 'Poison', { accuracy: 90, bypassAccuracyCheck: false, ailment: { kind: 'badly-poisoned', chance: 0 } }),
    status('reflect', 'Psychic'),
    status('splash'),
    spec('burning-jealousy', 'Fire', 70, { ailment: { kind: 'burn', chance: 100 } }),
    status('swords-dance', 'Normal', { target: 'user', statChanges: [{ stat: 'atk', stages: 2, chance: 100 }] }),
  ].map((m) => [m.name, m as unknown as CompiledMove]),
);

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; ability?: string; item?: string; hp?: number; moves?: string[] };
function makeMon(name: string, o: Opts = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1, name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((st) => ({ stat: { name: st }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: o.speed ?? 50 }]),
      weight: 100, abilities: [],
    } as any,
    level: 50, currentHp: o.hp ?? 400, maxHp: 400,
    moves: (o.moves ?? Object.keys(MOVES)).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    originalAbility: o.ability,
    heldItem: o.item,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;
function makeBattle(player: BattlePokemon, opponent = makeMon('target', { speed: 30 }), seed = 4_000_037, playerBench = makeMon('p-bench')): BattleState {
  return {
    player: team([player, playerBench]), opponent: team([opponent, makeMon('o-bench')]),
    turn: 1, field: createFieldState(), battleLog: [], actionQueue: [], rng: createBattleRng(seed),
    isComplete: false, phase: 'choice',
  } as BattleState;
}
const mv = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const sw = (switchIndex: number): BattleAction => ({ type: 'switch', switchIndex, target: 'opponent' });
async function play(s: BattleState, p: BattleAction, o: BattleAction = mv('splash')) {
  await runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true });
  s.turn += 1;
  return s.battleLog.map((e) => e.message);
}
const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);
const hit = (s: BattleState, name = 'target') => Number(s.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);
const fast = (o: Opts = {}) => makeMon('user', { speed: 150, ...o });

async function damage(attacker: BattlePokemon, moveId: string, defender = makeMon('target', { speed: 30 }), seed?: number) {
  const s = makeBattle(attacker, defender, seed);
  await play(s, mv(moveId));
  return hit(s, defender.pokemon.name);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('core Gen 9 moves', () => {
  it('Explosion faints the user; Damp stops it', async () => {
    let s = makeBattle(fast());
    await play(s, mv('explosion'));
    expect(s.player.pokemon[0].currentHp).toBe(0);
    expect(O(s).currentHp).toBeLessThan(400);
    s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'damp' }));
    const log = await play(s, mv('explosion'));
    expect(log.some((m) => m.includes('Damp prevents'))).toBe(true);
    expect(P(s).currentHp).toBe(400);
  });

  it('Psyshock hits Defense, not Sp. Def', async () => {
    const spdWall = makeMon('target', { speed: 30 });
    spdWall.statModifiers.specialDefense = 6;
    const viaPsyshock = await damage(fast(), 'psyshock', spdWall);
    const spdWall2 = makeMon('target', { speed: 30 });
    spdWall2.statModifiers.specialDefense = 6;
    const viaPsychic = await damage(fast(), 'psychic', spdWall2);
    expect(viaPsyshock).toBeGreaterThan(viaPsychic * 2);
  });

  it('Freeze-Dry is super effective on Water types', async () => {
    const water = await damage(fast(), 'freeze-dry', makeMon('target', { speed: 30, types: ['water'] }));
    const neutral = await damage(fast(), 'freeze-dry', makeMon('target', { speed: 30 }));
    expect(water / neutral).toBeGreaterThan(1.6);
  });

  it('Brick Break shatters Reflect before hitting', async () => {
    const s = makeBattle(makeMon('user', { speed: 20 }), makeMon('target', { speed: 30 }));
    const log = await play(s, mv('brick-break'), mv('reflect'));
    expect(log).toContain('user shattered the barrier!');
    expect(s.opponent.sideConditions.screens.reflect).toBeUndefined();
  });

  it('False Swipe leaves the target at 1 HP', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, hp: 5 }));
    await play(s, mv('false-swipe'));
    expect(O(s).currentHp).toBe(1);
  });

  it('Haze clears every stat stage', async () => {
    const user = fast();
    user.statModifiers.attack = 2;
    const foe = makeMon('target', { speed: 30 });
    foe.statModifiers.speed = -3;
    const s = makeBattle(user, foe);
    await play(s, mv('haze'));
    expect(P(s).statModifiers.attack).toBe(0);
    expect(O(s).statModifiers.speed).toBe(0);
  });

  it('Mean Look traps until the user leaves', async () => {
    const s = makeBattle(fast());
    await play(s, mv('mean-look'));
    expect(isTrapped(O(s))).toBe(true);
    const log = await play(s, mv('splash'), sw(1));
    expect(log).toContain("target can't escape!");
    await play(s, sw(1));
    expect(isTrapped(O(s))).toBe(false);
  });

  it('Jaw Lock traps both Pokémon', async () => {
    const s = makeBattle(fast());
    await play(s, mv('jaw-lock'));
    expect(isTrapped(P(s))).toBe(true);
    expect(isTrapped(O(s))).toBe(true);
  });
});

describe('Protect family', () => {
  it('High Jump Kick crashes when the target protects', async () => {
    const s = makeBattle(fast());
    const log = await play(s, mv('high-jump-kick'), mv('protect'));
    expect(log).toContain('target protected itself!');
    expect(P(s).currentHp).toBe(200);
  });

  it("King's Shield lowers a contact attacker's Attack", async () => {
    const s = makeBattle(fast());
    await play(s, mv('tackle'), mv('kings-shield'));
    expect(P(s).statModifiers.attack).toBe(-1);
    expect(O(s).currentHp).toBe(400);
  });

  it('Protect blocks foe-targeting status moves', async () => {
    const s = makeBattle(fast());
    await play(s, mv('toxic'), mv('protect'));
    expect(O(s).status).toBeUndefined();
  });

  it('Endure survives a lethal hit at 1 HP', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, hp: 10 }));
    const log = await play(s, mv('tackle'), mv('endure'));
    expect(log).toContain('target endured the hit!');
    expect(O(s).currentHp).toBe(1);
  });

  it('Protect fails when the user moves last', async () => {
    const s = makeBattle(fast());
    const log = await play(s, mv('protect'), sw(1));
    expect(log.some((m) => m.includes("Protect failed"))).toBe(true);
  });
});

describe('variable power', () => {
  it('Stored Power grows with stat boosts', async () => {
    const boosted = fast();
    boosted.statModifiers.specialAttack = 2;
    boosted.statModifiers.speed = 2;
    const plain = await damage(fast(), 'stored-power');
    // 20 → 100 power, partly offset by... nothing: the +2 Sp. Atk doubles it again
    expect(await damage(boosted, 'stored-power')).toBeGreaterThan(plain * 8);
  });

  it('Hard Press weakens as the target loses HP', async () => {
    const full = await damage(fast(), 'hard-press', makeMon('target', { speed: 30 }));
    const half = await damage(fast(), 'hard-press', makeMon('target', { speed: 30, hp: 200 }));
    expect(full / half).toBeGreaterThan(1.6);
  });

  it('Payback doubles when the user moves after its target', async () => {
    const first = await damage(fast(), 'payback');
    const slowUser = makeMon('user', { speed: 10 });
    const s = makeBattle(slowUser, makeMon('target', { speed: 30 }));
    await play(s, mv('payback'));
    expect(hit(s) / first).toBeGreaterThan(1.6);
  });

  it('Stomping Tantrum doubles after a failed move', async () => {
    const plain = await damage(fast(), 'stomping-tantrum');
    const s = makeBattle(fast());
    await play(s, mv('tackle'), mv('protect'));
    await play(s, mv('stomping-tantrum'));
    expect(hit(s) / plain).toBeGreaterThan(1.6);
  });

  it('Triple Axel hits three times with growing power', async () => {
    const s = makeBattle(fast());
    const log = await play(s, mv('triple-axel'));
    expect(log).toContain('Hit 3 time(s)!');
  });

  it('Retaliate doubles the turn after an ally fainted', async () => {
    const plain = await damage(fast(), 'retaliate');
    const s = makeBattle(fast());
    s.player.lastFaintTurn = s.turn - 1;
    await play(s, mv('retaliate'));
    expect(hit(s) / plain).toBeGreaterThan(1.6);
  });

  it('Wicked Blow always lands a critical hit', async () => {
    const crit = await damage(fast(), 'wicked-blow', undefined, 9_000_011);
    const normal = await damage(fast(), 'crunch', undefined, 9_000_011);
    expect(crit / normal).toBeGreaterThan(1.25);
  });

  it('Glaive Rush leaves the user taking double damage', async () => {
    const plain = await damage(makeMon('user', { speed: 10 }), 'tackle', makeMon('target', { speed: 30 }));
    // Until the user moves again: the slower foe's reply this turn lands for double
    const s = makeBattle(fast(), makeMon('target', { speed: 30 }));
    await play(s, mv('glaive-rush'), mv('tackle'));
    expect(hit(s, 'user') / plain).toBeGreaterThan(1.6);
    await play(s, mv('splash'), mv('tackle'));
    expect(hit(s, 'user') / plain).toBeLessThan(1.3);
  });

  it('Tera Blast takes the Tera Type once Terastallized', async () => {
    const user = fast();
    user.terastallized = true;
    user.teraType = 'ghost';
    user.pokemon.types = [{ type: { name: 'ghost' } }] as any;
    const s = makeBattle(user, makeMon('target', { speed: 30, types: ['ghost'] }));
    await play(s, mv('tera-blast'));
    expect(O(s).currentHp).toBeLessThan(400);
  });
});

describe('items and berries', () => {
  it('Thief steals the target’s item', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, item: 'leftovers' }));
    await play(s, mv('thief'));
    expect(P(s).heldItem).toBe('leftovers');
    expect(O(s).heldItem).toBeUndefined();
  });

  it('Fling throws a Flame Orb to burn the target', async () => {
    const s = makeBattle(fast({ item: 'flame-orb' }));
    await play(s, mv('fling'));
    expect(P(s).heldItem).toBeUndefined();
    expect(O(s).status).toBe('burned');
  });

  it('Fling fails without an item', async () => {
    const s = makeBattle(fast());
    const log = await play(s, mv('fling'));
    expect(log).toContain('But it failed!');
  });
});

describe('status-move scripts', () => {
  it('Smack Down lets Ground moves hit a Flying type', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, types: ['flying'] }));
    await play(s, mv('smack-down'));
    const before = O(s).currentHp;
    await play(s, mv('earthquake'));
    expect(O(s).currentHp).toBeLessThan(before);
  });

  it('Healing Wish faints the user and fully heals the replacement', async () => {
    const s = makeBattle(fast(), undefined, undefined, makeMon('p-bench', { hp: 50 }));
    s.player.pokemon[1].status = 'burned';
    await play(s, mv('healing-wish'));
    expect(s.player.pokemon[0].currentHp).toBe(0);
    const bench = s.player.pokemon[1];
    expect(bench.currentHp).toBe(bench.maxHp);
    expect(bench.status).toBeUndefined();
  });

  it('Future Sight lands two turns later', async () => {
    const s = makeBattle(fast());
    let log = await play(s, mv('future-sight'));
    expect(log).toContain('user foresaw an attack!');
    expect(O(s).currentHp).toBe(400);
    await play(s, mv('splash'));
    expect(O(s).currentHp).toBe(400);
    log = await play(s, mv('splash'));
    expect(log).toContain('target took the future-sight attack!');
    expect(O(s).currentHp).toBeLessThan(400);
  });

  it('Sleep Talk uses another move while asleep', async () => {
    const user = fast({ moves: ['sleep-talk', 'tackle'] });
    user.status = 'asleep';
    user.statusTurns = 5;
    const s = makeBattle(user);
    const log = await play(s, mv('sleep-talk'));
    expect(log).toContain('user used tackle!');
    expect(O(s).currentHp).toBeLessThan(400);
  });

  it('Copycat copies the last move used', async () => {
    const s = makeBattle(makeMon('user', { speed: 10 }), makeMon('target', { speed: 30 }));
    const log = await play(s, mv('copycat'), mv('tackle'));
    expect(log.filter((m) => m === 'user used tackle!')).toHaveLength(1);
    expect(hit(s)).toBeGreaterThan(0);
  });

  it('Teleport switches the user out', async () => {
    const s = makeBattle(fast());
    await play(s, mv('teleport'));
    expect(P(s).pokemon.name).toBe('p-bench');
  });

  it('Skill Swap trades abilities until the user leaves', async () => {
    const s = makeBattle(fast({ ability: 'levitate' }), makeMon('target', { speed: 30, ability: 'intimidate' }));
    await play(s, mv('skill-swap'));
    expect(P(s).currentAbility).toBe('intimidate');
    expect(O(s).currentAbility).toBe('levitate');
    await play(s, sw(1));
    expect(s.player.pokemon[0].currentAbility).toBe('levitate');
  });

  it('Spite cuts the PP of the target’s last move', async () => {
    const s = makeBattle(makeMon('user', { speed: 10 }), makeMon('target', { speed: 30 }));
    await play(s, mv('spite'), mv('tackle'));
    expect(O(s).moves.find((m) => m.id === 'tackle')!.pp).toBe(5);
  });

  it('Stockpile powers Spit Up, which then drops the boosts', async () => {
    const s = makeBattle(fast());
    await play(s, mv('stockpile'));
    await play(s, mv('stockpile'));
    expect(P(s).statModifiers.defense).toBe(2);
    await play(s, mv('spit-up'));
    expect(hit(s)).toBeGreaterThan(0);
    expect(P(s).statModifiers.defense).toBe(0);
    expect(P(s).volatile.stockpile).toBeUndefined();
  });

  it('Pain Split averages HP', async () => {
    const s = makeBattle(fast({ hp: 100 }));
    await play(s, mv('pain-split'));
    expect(P(s).currentHp).toBe(250);
    expect(O(s).currentHp).toBe(250);
  });

  it('Last Resort fails until every other move was used', async () => {
    const s = makeBattle(fast({ moves: ['last-resort', 'tackle'] }));
    let log = await play(s, mv('last-resort'));
    expect(log).toContain('But it failed!');
    await play(s, mv('tackle'));
    log = await play(s, mv('last-resort'));
    expect(log).not.toContain('But it failed!');
  });
});

describe('loose ends', () => {
  it('Burning Jealousy only burns a target whose stats rose this turn', async () => {
    let s = makeBattle(makeMon('user', { speed: 10 }), makeMon('target', { speed: 30 }));
    await play(s, mv('burning-jealousy'), mv('splash'));
    expect(O(s).status).toBeUndefined();
    s = makeBattle(makeMon('user', { speed: 10 }), makeMon('target', { speed: 30 }));
    await play(s, mv('burning-jealousy'), mv('swords-dance'));
    expect(O(s).status).toBe('burned');
  });

  it('Assault Vest does not soften Psyshock', async () => {
    const plain = await damage(fast(), 'psyshock', makeMon('target', { speed: 30 }));
    const vest = await damage(fast(), 'psyshock', makeMon('target', { speed: 30, item: 'assault-vest' }));
    expect(vest).toBe(plain);
    const psychicVest = await damage(fast(), 'psychic', makeMon('target', { speed: 30, item: 'assault-vest' }));
    expect(psychicVest).toBeLessThan(await damage(fast(), 'psychic', makeMon('target', { speed: 30 })));
  });

  it('Stellar Tera keeps the typing and turns Tera Blast into a neutral Stellar hit', async () => {
    const user = fast();
    user.teraType = 'stellar';
    const s = makeBattle(user, makeMon('target', { speed: 30, types: ['ghost'] }));
    expect(terastallize(s, 'player')).toBe(true);
    expect(P(s).pokemon.types.map((t: any) => t.type.name)).toEqual(['normal']);
    await play(s, mv('tera-blast'));
    // A Normal-type Tera Blast would not touch a Ghost
    expect(O(s).currentHp).toBeLessThan(400);
    expect(P(s).statModifiers.attack).toBe(-1);
    expect(P(s).statModifiers.specialAttack).toBe(-1);
  });

  it('Stellar boosts each type once (x2 for original types)', async () => {
    const make = () => {
      const u = fast();
      u.teraType = 'stellar';
      return u;
    };
    const plain = await damage(fast(), 'tackle');
    const s = makeBattle(make());
    terastallize(s, 'player');
    await play(s, mv('tackle'));
    const first = hit(s);
    await play(s, mv('tackle'));
    const second = hit(s);
    expect(first / plain).toBeGreaterThan(1.2);
    expect(second / plain).toBeLessThan(1.15);
  });
});

describe('multiplayer persistence', () => {
  it('round-trips side extras (Future Sight, Healing Wish, Tailwind, Mist)', () => {
    const s = makeBattle(fast());
    s.player.sideConditions.screens.tailwind = { turns: 3 };
    s.player.sideConditions.screens.mist = { turns: 2 };
    s.opponent.sideConditions.healingWish = 'lunar-dance';
    s.opponent.sideConditions.futureAttack = { move: 'future-sight', turns: 2, user: 'user', level: 50, attackStat: 120, attackerTypes: ['psychic'], power: 120, type: 'Psychic' };
    s.field.rooms = { fairyLock: { turns: 1 } };
    s.lastMoveInBattle = 'tackle';
    const extras = JSON.parse(JSON.stringify(captureEngineExtras(s)));
    const fresh = makeBattle(fast());
    applyEngineExtras(fresh, extras);
    expect(fresh.player.sideConditions.screens.tailwind).toEqual({ turns: 3 });
    expect(fresh.player.sideConditions.screens.mist).toEqual({ turns: 2 });
    expect(fresh.opponent.sideConditions.healingWish).toBe('lunar-dance');
    expect(fresh.opponent.sideConditions.futureAttack?.turns).toBe(2);
    expect(fresh.field.rooms?.fairyLock).toEqual({ turns: 1 });
    expect(fresh.lastMoveInBattle).toBe('tackle');
  });
});
