/**
 * Multiplayer protocol for player-chosen pivot replacements: resolveTurn pauses a turn when a
 * U-turn / Baton Pass needs a pick, then finishes it once the pivoting player submits a switch.
 * Runs the real resolveTurn against an in-memory RTDB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';

const db = vi.hoisted(() => {
  const state = { root: {} as Record<string, any> };
  const split = (p: string) => p.split('/').filter(Boolean);
  const clone = (v: unknown) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const get = (p: string) => {
    let node: any = state.root;
    for (const k of split(p)) {
      if (node == null || typeof node !== 'object') return null;
      node = node[k];
    }
    return node === undefined ? null : clone(node);
  };
  const set = (p: string, v: unknown) => {
    const keys = split(p);
    let node: any = state.root;
    for (const k of keys.slice(0, -1)) {
      if (node[k] == null || typeof node[k] !== 'object') node[k] = {};
      node = node[k];
    }
    const last = keys[keys.length - 1];
    if (v === null || v === undefined) delete node[last];
    else node[last] = clone(v);
  };
  const ops = {
    get: async (p: string) => get(p),
    set: async (p: string, v: unknown) => set(p, v),
    update: async (p: string, v: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(v)) set(`${p}/${k}`, val);
    },
    updateMulti: async (v: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(v)) set(k, val);
    },
    transaction: async (p: string, transform: (cur: any) => any) => {
      const next = transform(get(p));
      if (next === undefined) return { committed: false, snapshot: get(p) };
      set(p, next);
      return { committed: true, snapshot: get(p) };
    },
  };
  return { state, get, set, ops };
});

vi.mock('../rtdb-access', () => ({ getRtdbOps: () => db.ops }));
vi.mock('../multiplayer/handleBattleEnd', () => ({
  handleBattleEnd: vi.fn(async (battleId: string, winner: string | undefined, reason: string) => {
    db.set(`battles/${battleId}/meta/phase`, 'ended');
    db.set(`battles/${battleId}/meta/endedReason`, reason);
    db.set(`battles/${battleId}/meta/winnerSide`, winner ?? 'none');
  }),
}));
vi.mock('../server/create-rtdb-battle', () => ({ TURN_DEADLINE_MS: 30_000 }));

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, makesContact: true },
  'u-turn': { ...base, id: 369, name: 'u-turn', type: 'Bug', category: 'Physical', power: 70, accuracy: 100, makesContact: true },
} as unknown as Record<string, CompiledMove>;
vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

import { resolveTurn, enforceTurnDeadline } from '../battle-resolution';

const BID = 'b1';
const P1 = 'uid-1';
const P2 = 'uid-2';

const slot = (name: string, speed: number) => ({
  pokemon: {
    id: 1,
    name,
    types: [{ type: { name: 'normal' } }],
    stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((s) => ({ stat: { name: s }, base_stat: 100 }))
      .concat([{ stat: { name: 'speed' }, base_stat: speed }]),
    weight: 100,
    abilities: [],
  },
  level: 50,
  maxHp: 300,
  currentHp: 300,
  moves: [{ id: 'tackle', pp: 20, maxPp: 20 }, { id: 'u-turn', pp: 20, maxPp: 20 }],
});

function seedBattle() {
  db.state.root = {};
  db.set(`battles/${BID}/meta`, {
    phase: 'choosing',
    turn: 1,
    version: 1,
    deadlineAt: Date.now() + 30_000,
    players: { p1: { uid: P1, name: 'Ash' }, p2: { uid: P2, name: 'Gary' } },
    ruleProfile: 'simplified',
  });
  db.set(`battles/${BID}/server/battleRng`, { seed: 7, state: 7, calls: 0 });
  db.set(`battles/${BID}/private/${P1}`, { team: [slot('p-lead', 150), slot('p-bench-1', 50), slot('p-bench-2', 50)], currentIndex: 0 });
  db.set(`battles/${BID}/private/${P2}`, { team: [slot('o-lead', 30), slot('o-bench-1', 50)], currentIndex: 0 });
  db.set(`battles/${BID}/public`, { field: {}, p1: {}, p2: {} });
}

function choose(uid: string, choice: Record<string, unknown>, turn = 1) {
  db.set(`battles/${BID}/turns/${turn}/choices/${uid}`, { committedAt: Date.now(), ...choice });
}

const meta = () => db.get(`battles/${BID}/meta`);

beforeEach(() => {
  vi.clearAllMocks();
  seedBattle();
});

describe('resolveTurn with a pending pivot pick', () => {
  async function pauseOnUturn() {
    choose(P1, { action: 'move', payload: { moveId: 'u-turn' }, clientVersion: 1 });
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);
  }

  it('pauses the turn and asks only the pivoting player', async () => {
    await pauseOnUturn();

    expect(meta()).toMatchObject({ phase: 'choosing', turn: 1, version: 2, pendingSwitch: { uid: P1, reason: 'pivot' } });
    expect(db.get(`battles/${BID}/turns/1/choices`)).toBeNull();
    expect(db.get(`battles/${BID}/turns/1/resolution`)).toBeNull();
    // Hidden rest of the turn (the opponent's tackle) waits server-side
    const pending = db.get(`battles/${BID}/server/pendingTurn`);
    expect(pending).toMatchObject({ turn: 1, side: 'player', options: [1, 2] });
    expect(pending.remainingQueue).toHaveLength(1);
    expect(pending.remainingQueue[0]).toMatchObject({ user: 'opponent', moveId: 'tackle' });
    // Public state shows the first half: U-turn landed, P1 still has its lead out
    const pub = db.get(`battles/${BID}/public`);
    expect(pub.battleLog.map((e: any) => e.message)).toContain('p-lead used u-turn!');
    expect(db.get(`battles/${BID}/private/${P1}`).currentIndex).toBe(0);
  });

  it('only the pivoting player’s choice is needed to resume, and the turn completes', async () => {
    await pauseOnUturn();
    choose(P1, { action: 'switch', payload: { switchToIndex: 2 }, clientVersion: 2 });
    await resolveTurn(BID);

    expect(meta()).toMatchObject({ phase: 'choosing', turn: 2, version: 3 });
    expect(meta().pendingSwitch ?? null).toBeNull();
    expect(db.get(`battles/${BID}/server/pendingTurn`)).toBeNull();
    expect(db.get(`battles/${BID}/private/${P1}`).currentIndex).toBe(2);

    const log: string[] = db.get(`battles/${BID}/public`).battleLog.map((e: any) => e.message);
    expect(log.indexOf('p-lead used u-turn!')).toBeLessThan(log.indexOf('Go! p-bench-2!'));
    expect(log.indexOf('Go! p-bench-2!')).toBeLessThan(log.indexOf('o-lead used tackle!'));
    // The opponent's tackle hit the newcomer
    expect(db.get(`battles/${BID}/private/${P1}`).team[2].currentHp).toBeLessThan(300);

    const resolution = db.get(`battles/${BID}/turns/1/resolution`);
    expect(resolution.replay.p1Action).toMatchObject({ type: 'move', moveId: 'u-turn' });
    expect(resolution.replay.p2Action).toMatchObject({ type: 'move', moveId: 'tackle' });
  });

  it('rejects an illegal pick and keeps waiting', async () => {
    await pauseOnUturn();
    choose(P1, { action: 'switch', payload: { switchToIndex: 0 }, clientVersion: 2 });
    await resolveTurn(BID);

    expect(meta()).toMatchObject({ phase: 'choosing', turn: 1, version: 3, pendingSwitch: { uid: P1 } });
    expect(db.get(`battles/${BID}/public/lastValidation`)).toMatchObject({ turn: 1, p1: 'illegal_pivot_switch' });
    expect(db.get(`battles/${BID}/server/pendingTurn`)).not.toBeNull();
  });

  it('a timeout while picking forfeits only the pivoting player', async () => {
    await pauseOnUturn();
    db.set(`battles/${BID}/meta/deadlineAt`, Date.now() - 1);
    expect(await enforceTurnDeadline(BID)).toBe(true);
    expect(meta()).toMatchObject({ phase: 'ended', endedReason: 'timeout', winnerSide: 'opponent' });
  });

  it('turns without a pivot still need both players', async () => {
    choose(P1, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);
    expect(meta()).toMatchObject({ phase: 'choosing', turn: 1, version: 1 });
  });
});

describe('resolveTurn with Terastallization', () => {
  it('terastallizes, persists it privately, reveals it publicly and records it in the replay', async () => {
    const p1 = db.get(`battles/${BID}/private/${P1}`);
    p1.team[0].teraType = 'water';
    db.set(`battles/${BID}/private/${P1}`, p1);

    choose(P1, { action: 'move', payload: { moveId: 'tackle', terastallize: true }, clientVersion: 1 });
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);

    const priv = db.get(`battles/${BID}/private/${P1}`);
    expect(priv.teraUsed).toBe(true);
    expect(priv.team[0].terastallized).toBe(true);
    expect(priv.team[0].pokemon.types.map((t: any) => t.type.name)).toEqual(['water']);
    const active = db.get(`battles/${BID}/public/p1/active`);
    expect(active).toMatchObject({ terastallized: true, teraType: 'water', types: ['water'] });
    expect(db.get(`battles/${BID}/turns/1/resolution`).replay.p1Action).toMatchObject({ terastallize: true });
    expect(db.get(`battles/${BID}/public`).battleLog[0].message).toBe('p-lead terastallized into the Water type!');
  });

  it('drops a second Tera request and reports it', async () => {
    const p1 = db.get(`battles/${BID}/private/${P1}`);
    p1.team[0].teraType = 'water';
    db.set(`battles/${BID}/private/${P1}`, p1);
    choose(P1, { action: 'move', payload: { moveId: 'tackle', terastallize: true }, clientVersion: 1 });
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);

    choose(P1, { action: 'move', payload: { moveId: 'tackle', terastallize: true }, clientVersion: 2 }, 2);
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 2 }, 2);
    await resolveTurn(BID);

    expect(meta().turn).toBe(3);
    expect(db.get(`battles/${BID}/public/lastValidation`)).toMatchObject({ turn: 2, p1: 'tera_unavailable', normalized: true });
    expect(db.get(`battles/${BID}/turns/2/resolution`).replay.p1Action.terastallize).toBeUndefined();
  });

  it('defaults the Tera Type to the primary type when the slot has none', async () => {
    choose(P2, { action: 'move', payload: { moveId: 'tackle', terastallize: true }, clientVersion: 1 });
    choose(P1, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);
    expect(db.get(`battles/${BID}/public/p2/active`)).toMatchObject({ terastallized: true, teraType: 'normal' });
  });
});

describe('resolveTurn with shiny Pokémon', () => {
  it('keeps the team builder\'s shiny choice across turns and shows it publicly', async () => {
    const p1 = db.get(`battles/${BID}/private/${P1}`);
    p1.team[0].shiny = true;
    db.set(`battles/${BID}/private/${P1}`, p1);

    choose(P1, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);

    expect(db.get(`battles/${BID}/private/${P1}`).team[0].shiny).toBe(true);
    expect(db.get(`battles/${BID}/public/p1/active`).shiny).toBe(true);
    expect(db.get(`battles/${BID}/public/p2/active`).shiny).toBeUndefined();

    // A non-shiny teammate switching in shows its own colouring
    choose(P1, { action: 'switch', payload: { switchToIndex: 1 }, clientVersion: 2 }, 2);
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 2 }, 2);
    await resolveTurn(BID);
    expect(db.get(`battles/${BID}/public/p1/active`).shiny).toBeUndefined();
  });
});

describe('resolveTurn with faint replacement picks', () => {
  async function knockOutP1Lead() {
    const p1 = db.get(`battles/${BID}/private/${P1}`);
    p1.team[0].currentHp = 5;
    db.set(`battles/${BID}/private/${P1}`, p1);
    choose(P1, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    choose(P2, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: 1 });
    await resolveTurn(BID);
  }

  it('ends the turn and asks only the player whose Pokémon fainted', async () => {
    await knockOutP1Lead();
    expect(meta()).toMatchObject({ phase: 'choosing', turn: 2, pendingReplacement: { uids: [P1] } });
    expect(db.get(`battles/${BID}/turns/1/resolution`)).not.toBeNull();
    expect(db.get(`battles/${BID}/private/${P1}`).currentIndex).toBe(0);
  });

  it('applies the pick on the same turn number, then normal choices resume', async () => {
    await knockOutP1Lead();
    const versionBefore = meta().version;
    choose(P1, { action: 'switch', payload: { switchToIndex: 2 }, clientVersion: versionBefore }, 2);
    await resolveTurn(BID);

    expect(meta()).toMatchObject({ phase: 'choosing', turn: 2, version: versionBefore + 1 });
    expect(meta().pendingReplacement ?? null).toBeNull();
    expect(db.get(`battles/${BID}/private/${P1}`).currentIndex).toBe(2);
    expect(db.get(`battles/${BID}/turns/2/choices`)).toBeNull();
    expect(db.get(`battles/${BID}/public`).battleLog.map((e: any) => e.message)).toContain('Go! p-bench-2!');

    // Turn 2 now needs both players again
    choose(P1, { action: 'move', payload: { moveId: 'tackle' }, clientVersion: versionBefore + 1 }, 2);
    await resolveTurn(BID);
    expect(meta().turn).toBe(2);
  });

  it('rejects a move or a fainted pick while replacing', async () => {
    await knockOutP1Lead();
    choose(P1, { action: 'switch', payload: { switchToIndex: 0 }, clientVersion: meta().version }, 2);
    await resolveTurn(BID);
    expect(meta()).toMatchObject({ turn: 2, pendingReplacement: { uids: [P1] } });
    expect(db.get(`battles/${BID}/public/lastValidation`)).toMatchObject({ p1: 'illegal_replacement' });
  });

  it('a timeout while replacing forfeits only that player', async () => {
    await knockOutP1Lead();
    db.set(`battles/${BID}/meta/deadlineAt`, Date.now() - 1);
    expect(await enforceTurnDeadline(BID)).toBe(true);
    expect(meta()).toMatchObject({ phase: 'ended', winnerSide: 'opponent' });
  });
});
