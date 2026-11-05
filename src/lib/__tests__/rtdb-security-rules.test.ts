/**
 * RTDB security model tests.
 *
 * Authorization for live battles is enforced by the Realtime Database rules
 * (`src/lib/firebase-rtdb-rules.json`, deployed via firebase.json), not by the client
 * service. These tests therefore check two things for every guarantee:
 *   1. the deployed rule source actually contains the guard, and
 *   2. `rtdbService` writes/reads exactly the paths and shapes those rules expect,
 *      and handles rule rejections (PERMISSION_DENIED) the way callers rely on.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  set: fb.set,
  get: fb.get,
  update: fb.update,
  remove: fb.remove,
  onValue: fb.onValue,
  off: vi.fn(),
  push: vi.fn(),
  serverTimestamp: () => ({ '.sv': 'timestamp' }),
}));

vi.mock('../firebase', () => ({ rtdb: { fake: true } }));

import { rtdbService } from '../firebase-rtdb-service';

type Rule = string | boolean;
type RuleNode = { [key: string]: Rule | RuleNode };

const rules = JSON.parse(
  readFileSync(join(process.cwd(), 'src/lib/firebase-rtdb-rules.json'), 'utf8')
).rules as RuleNode;
const battle = (rules.battles as RuleNode).$bid as RuleNode;
const node = (path: string): RuleNode =>
  path.split('/').reduce<RuleNode>((acc, key) => acc[key] as RuleNode, rules);
const rule = (path: string, op: '.read' | '.write' | '.validate'): Rule => node(path)[op] as Rule;

const IS_PARTICIPANT =
  "root.child('battles/'+$bid+'/meta/players/p1/uid').val() == auth.uid || root.child('battles/'+$bid+'/meta/players/p2/uid').val() == auth.uid";
const choiceWrite = rule('battles/$bid/turns/$turn/choices/$uid', '.write') as string;

/** Swap the service's RTDB handle (private `db` field) for a test. */
function setDb(value: unknown) {
  (rtdbService as unknown as { db: unknown }).db = value;
}

const snap = (val: unknown) => ({ val: () => val, exists: () => val !== null && val !== undefined });
const paths = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.map(([r]) => (r as { path: string }).path);

describe('RTDB Security Rules Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDb({ fake: true });
    fb.set.mockResolvedValue(undefined);
    fb.update.mockResolvedValue(undefined);
    fb.remove.mockResolvedValue(undefined);
    fb.onValue.mockReturnValue(() => {});
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for all operations', () => {
      // Default deny at the root.
      expect(rules['.read']).toBe(false);
      expect(rules['.write']).toBe(false);

      // Every rule that grants access requires an authenticated user.
      const walk = (n: RuleNode, at: string) => {
        for (const [key, value] of Object.entries(n)) {
          if (key === '.read' || key === '.write') {
            if (value !== false) expect(value, `${at}/${key}`).toContain('auth != null');
          } else if (typeof value === 'object') {
            walk(value, `${at}/${key}`);
          }
        }
      };
      walk(rules, '');
    });

    it('should refuse to operate when RTDB is not initialized', async () => {
      setDb(null);
      await expect(rtdbService.updatePresence('test-uid', true)).rejects.toThrow('RTDB not initialized');
      await expect(
        rtdbService.joinLobby('test-uid', 'us-central1', { format: 'singles', minRating: 0 })
      ).rejects.toThrow('RTDB not initialized');
      await expect(rtdbService.createBattle('battle-123', 'p1', 'P1', [], 'p2', 'P2', [])).rejects.toThrow(
        'RTDB not initialized'
      );
      await expect(
        rtdbService.submitChoice('battle-123', 1, 'p1', { action: 'move', payload: { moveId: 'tackle' } } as never)
      ).rejects.toThrow('RTDB not initialized');

      const cb = vi.fn();
      rtdbService.onBattleMeta('battle-123', cb);
      expect(cb).toHaveBeenCalledWith(null);
      expect(fb.onValue).not.toHaveBeenCalled();
    });
  });

  describe('Presence Rules', () => {
    it('should only allow users to update their own presence', async () => {
      expect(rule('presence/$uid', '.write')).toBe('auth != null && auth.uid == $uid');
      expect(rule('presence/$uid', '.read')).toBe('auth != null && auth.uid == $uid');

      await rtdbService.updatePresence('test-uid', true);
      expect(paths(fb.update)).toEqual(['presence/test-uid']);
    });

    it('should validate presence data structure', async () => {
      await rtdbService.updatePresence('test-uid', false);
      expect(fb.update).toHaveBeenCalledWith(
        { path: 'presence/test-uid' },
        { connected: false, lastActiveAt: { '.sv': 'timestamp' } }
      );
    });
  });

  describe('Lobby Rules', () => {
    it('should only allow users to join/leave their own lobby entries', async () => {
      expect(rule('lobbies/$region/queue/$uid', '.write')).toBe('auth != null && auth.uid == $uid');
      expect(rule('lobbies/$region/queue/$uid', '.read')).toBe('auth != null && auth.uid == $uid');

      await rtdbService.joinLobby('test-uid', 'us-central1', { format: 'singles', minRating: 1000 });
      await rtdbService.leaveLobby('test-uid', 'us-central1');
      expect(paths(fb.set)).toEqual(['lobbies/us-central1/queue/test-uid']);
      expect(paths(fb.remove)).toEqual(['lobbies/us-central1/queue/test-uid']);
    });

    it('should validate lobby data structure', async () => {
      expect(rule('lobbies/$region/queue/$uid/joinedAt', '.validate')).toContain('newData.isNumber()');

      const prefs = { format: 'singles', minRating: 1200 };
      await rtdbService.joinLobby('test-uid', 'us-central1', prefs);
      expect(fb.set).toHaveBeenCalledWith(
        { path: 'lobbies/us-central1/queue/test-uid' },
        { joinedAt: { '.sv': 'timestamp' }, prefs }
      );
    });
  });

  describe('Battle Rules', () => {
    it('should only allow battle participants to access battle data', () => {
      for (const key of ['meta', 'public', 'participants']) {
        const read = (battle[key] as RuleNode)['.read'] as string;
        expect(read, key).toContain('auth != null');
        expect(read, key).toContain(IS_PARTICIPANT);
      }
      expect(rule('battles/$bid/turns/$turn/resolution', '.read')).toContain(IS_PARTICIPANT);
      // Private state: only the owning player, never the opponent.
      expect(rule('battles/$bid/private/$uid', '.read')).toBe('auth != null && auth.uid == $uid');

      rtdbService.onBattleMeta('battle-123', vi.fn());
      rtdbService.onBattlePublic('battle-123', vi.fn());
      rtdbService.onBattlePrivate('battle-123', 'p1-uid', vi.fn());
      expect(paths(fb.onValue)).toEqual([
        'battles/battle-123/meta',
        'battles/battle-123/public',
        'battles/battle-123/private/p1-uid',
      ]);
    });

    it('should only allow choice submission during choosing phase', async () => {
      expect(choiceWrite).toContain("root.child('battles/'+$bid+'/meta/phase').val() == 'choosing'");
      expect(choiceWrite).toContain("('' + root.child('battles/'+$bid+'/meta/turn').val()) == $turn");
      expect(choiceWrite).toContain('auth.uid == $uid');
      expect(choiceWrite).toContain(IS_PARTICIPANT);

      fb.get.mockResolvedValueOnce(snap(3)).mockResolvedValueOnce(snap(null));
      await rtdbService.submitChoice('battle-123', 2, 'test-uid', { action: 'move', payload: { moveId: 'tackle' } } as never);
      expect(paths(fb.set)).toEqual(['battles/battle-123/turns/2/choices/test-uid']);
    });

    it('should validate choice data structure', async () => {
      expect(choiceWrite).toContain("newData.child('action').isString()");
      expect(choiceWrite).toContain(
        "(newData.child('action').val() == 'move' || newData.child('action').val() == 'switch')"
      );
      // Forfeit is a server-side action, never a client choice.
      expect(choiceWrite).not.toContain("'forfeit'");

      fb.get.mockResolvedValueOnce(snap(1)).mockResolvedValueOnce(snap(null));
      await rtdbService.submitChoice('battle-123', 1, 'test-uid', { action: 'switch', payload: { switchToIndex: 2 } } as never);
      const written = fb.set.mock.calls[0][1] as Record<string, unknown>;
      expect(written).toMatchObject({ action: 'switch', payload: { switchToIndex: 2 } });
      expect(written.committedAt).toEqual({ '.sv': 'timestamp' });
    });

    it('should prevent duplicate choice submissions', async () => {
      expect(choiceWrite).toContain('!data.exists()');

      // Choice already exists for this turn: the service must not attempt a second write.
      fb.get.mockResolvedValueOnce(snap(1)).mockResolvedValueOnce(snap({ action: 'move' }));
      await rtdbService.submitChoice('battle-123', 1, 'test-uid', { action: 'move', payload: { moveId: 'tackle' } } as never);
      expect(fb.set).not.toHaveBeenCalled();
    });

    it('should validate client version for choice submissions', async () => {
      expect(choiceWrite).toContain(
        "newData.child('clientVersion').val() == root.child('battles/'+$bid+'/meta/version').val()"
      );

      // The service reads meta/version and echoes it as clientVersion.
      fb.get.mockResolvedValueOnce(snap(7)).mockResolvedValueOnce(snap(null));
      await rtdbService.submitChoice('battle-123', 4, 'test-uid', { action: 'move', payload: { moveId: 'tackle' } } as never);
      expect(paths(fb.get)[0]).toBe('battles/battle-123/meta/version');
      expect((fb.set.mock.calls[0][1] as { clientVersion: number }).clientVersion).toBe(7);
    });

    it('should treat a rules rejection (PERMISSION_DENIED) as a no-op but surface other errors', async () => {
      fb.get.mockResolvedValue(snap(null));
      fb.set.mockRejectedValueOnce(new Error('PERMISSION_DENIED: Permission denied'));
      await expect(
        rtdbService.submitChoice('battle-123', 1, 'test-uid', { action: 'move', payload: { moveId: 'tackle' } } as never)
      ).resolves.toBeUndefined();

      fb.set.mockRejectedValueOnce(new Error('network down'));
      await expect(
        rtdbService.submitChoice('battle-123', 1, 'test-uid', { action: 'move', payload: { moveId: 'tackle' } } as never)
      ).rejects.toThrow('network down');
    });
  });

  describe('Data Validation', () => {
    const team = [
      {
        pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
        level: 50,
        currentHp: 100,
        maxHp: 100,
        statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      },
    ];

    it('should validate Pokemon data structure in battle creation', async () => {
      await rtdbService.createBattle('battle-123', 'p1-uid', 'Player 1', team, 'p2-uid', 'Player 2', team);
      expect(paths(fb.set)).toEqual([
        'battles/battle-123/meta',
        'battles/battle-123/public',
        'battles/battle-123/private/p1-uid',
        'battles/battle-123/private/p2-uid',
      ]);
      // Each player's private state lands under their own uid only.
      expect(JSON.stringify(fb.set.mock.calls[2][1])).toContain('Pikachu');
    });

    it('should validate battle metadata structure', async () => {
      await rtdbService.createBattle('battle-123', 'p1-uid', 'Player 1', team, 'p2-uid', 'Player 2', team);
      const meta = fb.set.mock.calls[0][1] as Record<string, unknown>;
      // These fields are what the choice-write rule reads (players, phase, turn, version).
      expect(meta).toMatchObject({
        players: { p1: { uid: 'p1-uid', name: 'Player 1' }, p2: { uid: 'p2-uid', name: 'Player 2' } },
        phase: 'choosing',
        turn: 1,
        version: 1,
      });
      expect(paths(fb.update)).toEqual(['battles/battle-123/participants']);
    });
  });

  describe('Access Control', () => {
    it('should prevent unauthorized access to private battle data', () => {
      expect(rule('battles/$bid/private/$uid', '.read')).toBe('auth != null && auth.uid == $uid');
      expect(rule('battles/$bid/private/$uid', '.write')).toBe(false);
      expect(rule('battles/$bid/turns/$turn/choices/$uid', '.read')).toBe('auth != null && auth.uid == $uid');
    });

    it('should prevent unauthorized access to battle meta', () => {
      expect(rule('battles/$bid/meta', '.read')).toContain(IS_PARTICIPANT);
      expect(rule('battles/$bid/server', '.read')).toBe(false);
    });

    it('should prevent unauthorized access to battle public state', () => {
      expect(rule('battles/$bid/public', '.read')).toContain(IS_PARTICIPANT);
      expect(rule('battles/$bid/turns/$turn/resolution', '.read')).toContain(IS_PARTICIPANT);
    });
  });

  describe('Write Protection', () => {
    it('should prevent direct writes to battle meta', () => {
      expect(rule('battles/$bid/meta', '.write')).toBe(false);
      expect(rule('battles/$bid/participants', '.write')).toBe(false);
    });

    it('should prevent direct writes to battle public state', () => {
      expect(rule('battles/$bid/public', '.write')).toBe(false);
      expect(rule('battles/$bid/turns/$turn/resolution', '.write')).toBe(false);
    });

    it('should prevent direct writes to battle private state', () => {
      expect(rule('battles/$bid/private/$uid', '.write')).toBe(false);
      expect(rule('battles/$bid/server', '.write')).toBe(false);
    });
  });
});
