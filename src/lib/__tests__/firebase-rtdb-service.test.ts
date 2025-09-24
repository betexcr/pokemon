import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { rtdbService } from '../firebase-rtdb-service';
import { ref, set, get, remove, onValue } from 'firebase/database';

// Mock Firebase RTDB
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  push: vi.fn(),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' }))
}));

// Mock Firebase app
vi.mock('../firebase', () => ({
  rtdb: {
    ref: vi.fn(),
    child: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

describe('FirebaseRTDBService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updatePresence', () => {
    it('should update user presence with connected status', async () => {
      const mockRef = { path: 'presence/test-uid' };
      (ref as Mock).mockReturnValue(mockRef);
      (set as Mock).mockResolvedValue(undefined);

      await rtdbService.updatePresence('test-uid', true);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'presence/test-uid');
      expect(set).toHaveBeenCalledWith(mockRef, {
        connected: true,
        lastActiveAt: { '.sv': 'timestamp' }
      });
    });

    it('should update user presence with disconnected status', async () => {
      const mockRef = { path: 'presence/test-uid' };
      (ref as Mock).mockReturnValue(mockRef);
      (set as Mock).mockResolvedValue(undefined);

      await rtdbService.updatePresence('test-uid', false);

      expect(set).toHaveBeenCalledWith(mockRef, {
        connected: false,
        lastActiveAt: { '.sv': 'timestamp' }
      });
    });

    it('should throw error if RTDB not initialized', async () => {
      // Mock rtdb as null
      vi.doMock('../firebase', () => ({
        rtdb: null
      }));

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('RTDB not initialized');
    });
  });

  describe('joinLobby', () => {
    it('should join lobby with user preferences', async () => {
      const mockRef = { path: 'lobbies/us-central1/queue/test-uid' };
      (ref as Mock).mockReturnValue(mockRef);
      (set as Mock).mockResolvedValue(undefined);

      const prefs = {
        format: 'singles',
        minRating: 1000
      };

      await rtdbService.joinLobby('test-uid', 'us-central1', prefs);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'lobbies/us-central1/queue/test-uid');
      expect(set).toHaveBeenCalledWith(mockRef, {
        joinedAt: { '.sv': 'timestamp' },
        prefs
      });
    });
  });

  describe('leaveLobby', () => {
    it('should remove user from lobby queue', async () => {
      const mockRef = { path: 'lobbies/us-central1/queue/test-uid' };
      (ref as Mock).mockReturnValue(mockRef);
      (remove as Mock).mockResolvedValue(undefined);

      await rtdbService.leaveLobby('test-uid', 'us-central1');

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'lobbies/us-central1/queue/test-uid');
      expect(remove).toHaveBeenCalledWith(mockRef);
    });
  });

  describe('createBattle', () => {
    it('should create battle with proper structure', async () => {
      const mockMetaRef = { path: 'battles/battle-123/meta' };
      const mockPublicRef = { path: 'battles/battle-123/public' };
      const mockP1PrivateRef = { path: 'battles/battle-123/private/p1-uid' };
      const mockP2PrivateRef = { path: 'battles/battle-123/private/p2-uid' };

      (ref as Mock)
        .mockReturnValueOnce(mockMetaRef)
        .mockReturnValueOnce(mockPublicRef)
        .mockReturnValueOnce(mockP1PrivateRef)
        .mockReturnValueOnce(mockP2PrivateRef);

      (set as Mock).mockResolvedValue(undefined);

      const p1Team = [
        {
          pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
          level: 50,
          currentHp: 100,
          maxHp: 100,
          statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
        }
      ];

      const p2Team = [
        {
          pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] },
          level: 50,
          currentHp: 100,
          maxHp: 100,
          statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
        }
      ];

      await rtdbService.createBattle(
        'battle-123',
        'p1-uid',
        'Player 1',
        p1Team,
        'p2-uid',
        'Player 2',
        p2Team
      );

      // Verify meta creation
      expect(set).toHaveBeenCalledWith(mockMetaRef, expect.objectContaining({
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        players: {
          p1: { uid: 'p1-uid', name: 'Player 1' },
          p2: { uid: 'p2-uid', name: 'Player 2' }
        },
        phase: 'choosing',
        turn: 1,
        version: 1
      }));

      // Verify public state creation
      expect(set).toHaveBeenCalledWith(mockPublicRef, expect.objectContaining({
        p1: expect.objectContaining({
          active: expect.objectContaining({
            species: 'Pikachu',
            level: 50,
            types: ['electric'],
            hp: { cur: 100, max: 100 }
          })
        }),
        p2: expect.objectContaining({
          active: expect.objectContaining({
            species: 'Charmander',
            level: 50,
            types: ['fire'],
            hp: { cur: 100, max: 100 }
          })
        })
      }));

      // Verify private state creation
      expect(set).toHaveBeenCalledWith(mockP1PrivateRef, {
        team: p1Team,
        choiceLock: {}
      });

      expect(set).toHaveBeenCalledWith(mockP2PrivateRef, {
        team: p2Team,
        choiceLock: {}
      });
    });
  });

  describe('submitChoice', () => {
    it('should submit choice with proper structure', async () => {
      const mockRef = { path: 'battles/battle-123/turns/1/choices/test-uid' };
      (ref as Mock).mockReturnValue(mockRef);
      (set as Mock).mockResolvedValue(undefined);

      const choice = {
        action: 'move' as const,
        payload: {
          moveId: 'thunderbolt',
          target: 'opponent'
        }
      };

      await rtdbService.submitChoice('battle-123', 1, 'test-uid', choice);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/turns/1/choices/test-uid');
      expect(set).toHaveBeenCalledWith(mockRef, {
        ...choice,
        committedAt: { '.sv': 'timestamp' },
        clientVersion: 0
      });
    });
  });

  describe('listeners', () => {
    it('should set up battle meta listener', () => {
      const mockUnsubscribe = vi.fn();
      (onValue as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = rtdbService.onBattleMeta('battle-123', callback);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/meta');
      expect(onValue).toHaveBeenCalledWith(expect.anything(), callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up battle public listener', () => {
      const mockUnsubscribe = vi.fn();
      (onValue as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = rtdbService.onBattlePublic('battle-123', callback);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/public');
      expect(onValue).toHaveBeenCalledWith(expect.anything(), callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up battle private listener', () => {
      const mockUnsubscribe = vi.fn();
      (onValue as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = rtdbService.onBattlePrivate('battle-123', 'test-uid', callback);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/private/test-uid');
      expect(onValue).toHaveBeenCalledWith(expect.anything(), callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up battle choices listener', () => {
      const mockUnsubscribe = vi.fn();
      (onValue as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = rtdbService.onBattleChoices('battle-123', 1, callback);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/turns/1/choices');
      expect(onValue).toHaveBeenCalledWith(expect.anything(), callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should set up battle resolution listener', () => {
      const mockUnsubscribe = vi.fn();
      (onValue as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = rtdbService.onBattleResolution('battle-123', 1, callback);

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123/turns/1/resolution');
      expect(onValue).toHaveBeenCalledWith(expect.anything(), callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('deleteBattle', () => {
    it('should delete battle from RTDB', async () => {
      const mockRef = { path: 'battles/battle-123' };
      (ref as Mock).mockReturnValue(mockRef);
      (remove as Mock).mockResolvedValue(undefined);

      await rtdbService.deleteBattle('battle-123');

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'battles/battle-123');
      expect(remove).toHaveBeenCalledWith(mockRef);
    });
  });
});
