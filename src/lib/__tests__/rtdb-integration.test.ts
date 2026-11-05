/**
 * RTDB integration tests: the real `rtdbService` and `FirebaseRTDBBattleEngine`
 * running against an in-memory fake of `firebase/database`.
 *
 * Unlike `battle-engine-rtdb.test.ts` (which mocks `rtdbService` entirely), these
 * tests exercise the service's actual paths, listener wiring and duplicate /
 * permission handling, and check that two clients see a consistent battle.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

type Listener = { path: string; cb: (snap: FakeSnapshot) => void };
type FakeSnapshot = { val: () => unknown; exists: () => boolean };

const fake = vi.hoisted(() => {
  const state = {
    root: {} as Record<string, unknown>,
    listeners: [] as Listener[],
    /** Paths whose next `set` rejects with this error message. */
    failSet: new Map<string, string>(),
    writes: [] as string[],
  };

  const split = (path: string) => path.split('/').filter(Boolean);
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  const read = (path: string): unknown => {
    let node: unknown = state.root;
    for (const key of split(path)) {
      if (node === null || typeof node !== 'object') return undefined;
      node = (node as Record<string, unknown>)[key];
    }
    return node;
  };

  const write = (path: string, value: unknown) => {
    const keys = split(path);
    let node = state.root as Record<string, unknown>;
    for (const key of keys.slice(0, -1)) {
      if (node[key] === null || typeof node[key] !== 'object') node[key] = {};
      node = node[key] as Record<string, unknown>;
    }
    const last = keys[keys.length - 1];
    if (value === null || value === undefined) delete node[last];
    else node[last] = clone(value);
  };

  const snapshot = (path: string): FakeSnapshot => {
    const v = clone(read(path));
    return { val: () => (v === undefined ? null : v), exists: () => v !== undefined && v !== null };
  };

  const notify = (changed: string) => {
    for (const l of [...state.listeners]) {
      if (changed.startsWith(l.path) || l.path.startsWith(changed)) l.cb(snapshot(l.path));
    }
  };

  return { state, read, write, snapshot, notify };
});

vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  get: async (r: { path: string }) => fake.snapshot(r.path),
  set: async (r: { path: string }, value: unknown) => {
    const failure = fake.state.failSet.get(r.path);
    if (failure) {
      fake.state.failSet.delete(r.path);
      throw new Error(failure);
    }
    fake.write(r.path, value);
    fake.state.writes.push(r.path);
    fake.notify(r.path);
  },
  update: async (r: { path: string }, values: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(values)) fake.write(`${r.path}/${k}`, v);
    fake.state.writes.push(r.path);
    fake.notify(r.path);
  },
  remove: async (r: { path: string }) => {
    fake.write(r.path, null);
    fake.notify(r.path);
  },
  onValue: (r: { path: string }, cb: (snap: FakeSnapshot) => void) => {
    const listener = { path: r.path, cb };
    fake.state.listeners.push(listener);
    cb(fake.snapshot(r.path));
    return () => {
      fake.state.listeners = fake.state.listeners.filter((l) => l !== listener);
    };
  },
  off: vi.fn(),
  push: vi.fn(),
  serverTimestamp: () => 1_700_000_000_000,
}));

const authState = vi.hoisted(() => ({ currentUser: { uid: 'player1' } as { uid: string } | null }));

vi.mock('../firebase', () => ({
  rtdb: { fake: true },
  get auth() {
    return authState;
  },
}));

import { rtdbService } from '../firebase-rtdb-service';
import { FirebaseRTDBBattleEngine } from '../battle-engine-rtdb';

const slot = (name: string, type: string, moves: string[] = ['tackle']) => ({
  pokemon: { name, types: [{ type: { name: type } }] },
  level: 50,
  currentHp: 100,
  maxHp: 100,
  moves: moves.map((id) => ({ id, name: id })),
  statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
});

const p1Team = [slot('pikachu', 'electric', ['thunderbolt']), slot('bulbasaur', 'grass', ['vine-whip'])];
const p2Team = [slot('charmander', 'fire', ['flamethrower']), slot('squirtle', 'water', ['water-gun'])];

async function createBattle(id = 'battle-123') {
  await rtdbService.createBattle(id, 'player1', 'Player 1', p1Team, 'player2', 'Player 2', p2Team);
  return id;
}

async function engineFor(uid: string, battleId: string) {
  authState.currentUser = { uid };
  const engine = new FirebaseRTDBBattleEngine(battleId);
  const states: Array<ReturnType<FirebaseRTDBBattleEngine['convertToBattleState']>> = [];
  const phases: string[] = [];
  await engine.initialize((s) => states.push(s), (p) => phases.push(p));
  return { engine, states, phases };
}

describe('RTDB Integration Tests', () => {
  beforeEach(() => {
    fake.state.root = {};
    fake.state.listeners = [];
    fake.state.failSet.clear();
    fake.state.writes = [];
    authState.currentUser = { uid: 'player1' };
  });

  describe('Battle creation', () => {
    it('writes meta, participants, public and per-player private nodes', async () => {
      const id = await createBattle();

      const meta = fake.read(`battles/${id}/meta`) as Record<string, any>;
      expect(meta.phase).toBe('choosing');
      expect(meta.turn).toBe(1);
      expect(meta.players.p1.uid).toBe('player1');
      expect(meta.players.p2.uid).toBe('player2');
      expect(meta.battleRng).toBeDefined();

      const pub = fake.read(`battles/${id}/public`) as Record<string, any>;
      expect(pub.p1.active.species).toBe('pikachu');
      expect(pub.p2.active.species).toBe('charmander');
      expect(pub.p1.benchPublic).toHaveLength(1);
      expect(pub.p2.benchPublic[0].species).toBe('squirtle');

      const p1Private = fake.read(`battles/${id}/private/player1`) as Record<string, any>;
      const p2Private = fake.read(`battles/${id}/private/player2`) as Record<string, any>;
      expect(p1Private.team).toHaveLength(2);
      expect(p2Private.team[0].pokemon.name).toBe('charmander');

      const participants = fake.read(`battles/${id}/participants`) as Record<string, any>;
      expect(participants.player1.role).toBe('p1');
      expect(participants.player2.role).toBe('p2');
    });

    it('keeps each player team private: public data exposes only species and revealed moves', async () => {
      const id = await createBattle();
      const pub = fake.read(`battles/${id}/public`) as Record<string, any>;
      expect(pub.p2.benchPublic[0]).toEqual({ species: 'squirtle', fainted: false, revealedMoves: ['water-gun'] });
      expect(JSON.stringify(pub)).not.toContain('statModifiers');
    });
  });

  describe('Client engines', () => {
    it('both players get a consistent battle state from their own perspective', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      const b = await engineFor('player2', id);

      const aState = a.states.at(-1)!;
      const bState = b.states.at(-1)!;
      expect(aState.turn).toBe(1);
      expect(bState.turn).toBe(1);
      expect(aState.player.pokemon[aState.player.currentIndex].pokemon.name).toBe('pikachu');
      expect(aState.opponent.pokemon[0].pokemon.name).toBe('charmander');
      expect(bState.player.pokemon[bState.player.currentIndex].pokemon.name).toBe('charmander');
      expect(bState.opponent.pokemon[0].pokemon.name).toBe('pikachu');
      expect(a.phases.at(-1)).toBe('choosing');

      a.engine.destroy();
      b.engine.destroy();
    });

    it('submitted choices land under turns/{turn}/choices/{uid} with the current meta version', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      const b = await engineFor('player2', id);

      await a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' });
      await b.engine.submitChoice({ type: 'switch', switchIndex: 1 });

      const choices = fake.read(`battles/${id}/turns/1/choices`) as Record<string, any>;
      expect(choices.player1).toMatchObject({
        action: 'move',
        payload: { moveId: 'thunderbolt', target: 'opponent' },
        clientVersion: 1,
      });
      expect(choices.player2).toMatchObject({ action: 'switch', payload: { switchToIndex: 1 }, clientVersion: 1 });

      a.engine.destroy();
      b.engine.destroy();
    });

    it('ignores a second submission for the same turn (choices are write-once)', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);

      await a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' });
      await a.engine.submitChoice({ type: 'move', moveId: 'quick-attack', target: 'opponent' });

      const choice = fake.read(`battles/${id}/turns/1/choices/player1`) as Record<string, any>;
      expect(choice.payload.moveId).toBe('thunderbolt');
      a.engine.destroy();
    });

    it('treats PERMISSION_DENIED on choice write as a no-op (rules closed the window)', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      fake.state.failSet.set(`battles/${id}/turns/1/choices/player1`, 'PERMISSION_DENIED: write rejected');

      await expect(
        a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' }),
      ).resolves.toBeUndefined();
      expect(fake.read(`battles/${id}/turns/1/choices/player1`)).toBeUndefined();
      a.engine.destroy();
    });

    it('surfaces other write errors to the caller', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      fake.state.failSet.set(`battles/${id}/turns/1/choices/player1`, 'network down');

      await expect(
        a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' }),
      ).rejects.toThrow('network down');
      a.engine.destroy();
    });

    it('rejects choices once the server moves the battle out of the choosing phase', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);

      await rtdbService.updateBattleMeta(id, { phase: 'resolving' } as any);
      expect(a.phases.at(-1)).toBe('resolving');
      await expect(
        a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' }),
      ).rejects.toThrow('Not in choosing phase');
      a.engine.destroy();
    });

    it('propagates server-side turn advances and public HP changes to every client', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      const b = await engineFor('player2', id);

      await rtdbService.updatePublicState(id, {
        p2: { ...(fake.read(`battles/${id}/public/p2`) as any), active: { ...(fake.read(`battles/${id}/public/p2/active`) as any), hp: { cur: 40, max: 100 } } },
      } as any);
      await rtdbService.updateBattleMeta(id, { turn: 2, phase: 'choosing' } as any);

      expect(a.states.at(-1)!.turn).toBe(2);
      expect(b.states.at(-1)!.turn).toBe(2);
      expect(a.states.at(-1)!.opponent.pokemon[0].currentHp).toBe(40);

      // Turn 2 choices go to the new turn node.
      await a.engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' });
      expect(fake.read(`battles/${id}/turns/2/choices/player1`)).toBeDefined();
      expect(fake.read(`battles/${id}/turns/1/choices/player1`)).toBeUndefined();

      a.engine.destroy();
      b.engine.destroy();
    });

    it('destroy() detaches every listener', async () => {
      const id = await createBattle();
      const a = await engineFor('player1', id);
      const b = await engineFor('player2', id);
      expect(fake.state.listeners).toHaveLength(6);

      a.engine.destroy();
      expect(fake.state.listeners).toHaveLength(3);
      b.engine.destroy();
      expect(fake.state.listeners).toHaveLength(0);
    });

    it('keeps concurrent battles isolated', async () => {
      const ids = await Promise.all(['b-0', 'b-1', 'b-2'].map((id) => createBattle(id)));
      const engines = [];
      for (const id of ids) engines.push(await engineFor('player1', id));

      await Promise.all(
        engines.map(({ engine }) => engine.submitChoice({ type: 'move', moveId: 'thunderbolt', target: 'opponent' })),
      );

      for (const id of ids) {
        const choices = fake.read(`battles/${id}/turns/1/choices`) as Record<string, unknown>;
        expect(Object.keys(choices)).toEqual(['player1']);
      }
      engines.forEach(({ engine }) => engine.destroy());
    });
  });

  describe('Lobby and presence', () => {
    it('joinLobby / leaveLobby write and clear the queue entry', async () => {
      await rtdbService.joinLobby('player1', 'us-central1', { format: 'singles', minRating: 1000 } as any);
      expect(fake.read('lobbies/us-central1/queue/player1')).toMatchObject({ prefs: { format: 'singles' } });

      await rtdbService.leaveLobby('player1', 'us-central1');
      expect(fake.read('lobbies/us-central1/queue/player1')).toBeUndefined();
    });

    it('updatePresence records connection state', async () => {
      await rtdbService.updatePresence('player1', true);
      expect(fake.read('presence/player1')).toMatchObject({ connected: true });
      await rtdbService.updatePresence('player1', false);
      expect(fake.read('presence/player1')).toMatchObject({ connected: false });
    });
  });
});
