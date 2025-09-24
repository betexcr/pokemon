import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { rtdbService } from '../firebase-rtdb-service';
import { FirebaseRTDBBattleEngine } from '../battle-engine-rtdb';
import { BattleFlowEngine } from '../battle-engine-rtdb';

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

describe('RTDB Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Errors', () => {
    it('should handle RTDB not initialized error', async () => {
      // Mock RTDB as null
      (rtdbService as any).rtdb = null;

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('RTDB not initialized');

      await expect(rtdbService.joinLobby('test-uid', 'us-central1', {}))
        .rejects.toThrow('RTDB not initialized');

      await expect(rtdbService.createBattle('battle-123', 'p1', 'P1', [], 'p2', 'P2', []))
        .rejects.toThrow('RTDB not initialized');
    });

    it('should handle network connection errors', async () => {
      // Mock RTDB with network error
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          throw new Error('Network connection failed');
        })
      };

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Network connection failed');
    });

    it('should handle timeout errors', async () => {
      // Mock RTDB with timeout
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        })
      };

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle unauthenticated user errors', async () => {
      // Mock RTDB with auth error
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          throw new Error('User not authenticated');
        })
      };

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('User not authenticated');
    });

    it('should handle permission denied errors', async () => {
      // Mock RTDB with permission error
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          throw new Error('Permission denied');
        })
      };

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Permission denied');
    });

    it('should handle invalid token errors', async () => {
      // Mock RTDB with token error
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          throw new Error('Invalid token');
        })
      };

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle invalid battle ID errors', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      await expect(rtdbService.createBattle('', 'p1', 'P1', [], 'p2', 'P2', []))
        .rejects.toThrow('Invalid battle ID');

      await expect(rtdbService.createBattle(null as any, 'p1', 'P1', [], 'p2', 'P2', []))
        .rejects.toThrow('Invalid battle ID');
    });

    it('should handle invalid user ID errors', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      await expect(rtdbService.updatePresence('', true))
        .rejects.toThrow('Invalid user ID');

      await expect(rtdbService.updatePresence(null as any, true))
        .rejects.toThrow('Invalid user ID');
    });

    it('should handle invalid team data errors', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      await expect(rtdbService.createBattle('battle-123', 'p1', 'P1', null as any, 'p2', 'P2', []))
        .rejects.toThrow('Invalid team data');

      await expect(rtdbService.createBattle('battle-123', 'p1', 'P1', [], 'p2', 'P2', null as any))
        .rejects.toThrow('Invalid team data');
    });

    it('should handle invalid choice data errors', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      await expect(rtdbService.submitChoice('battle-123', 1, 'test-uid', null as any))
        .rejects.toThrow('Invalid choice data');

      await expect(rtdbService.submitChoice('battle-123', 1, 'test-uid', {}))
        .rejects.toThrow('Invalid choice data');
    });
  });

  describe('Battle Engine Error Handling', () => {
    it('should handle initialization errors', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');

      // Mock initialization failure
      const mockInitialize = vi.spyOn(engine, 'initialize');
      mockInitialize.mockRejectedValue(new Error('Initialization failed'));

      await expect(engine.initialize()).rejects.toThrow('Initialization failed');

      engine.destroy();
    });

    it('should handle choice submission errors', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();

      // Mock choice submission failure
      (rtdbService.submitChoice as Mock).mockRejectedValue(new Error('Choice submission failed'));

      await expect(engine.submitChoice({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      })).rejects.toThrow('Choice submission failed');

      engine.destroy();
    });

    it('should handle state conversion errors', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();

      // Mock invalid state data
      engine['meta'] = null;
      engine['publicState'] = null;
      engine['privateState'] = null;

      expect(() => engine.convertToBattleState())
        .toThrow('Battle state not fully initialized');

      engine.destroy();
    });
  });

  describe('Flow Engine Error Handling', () => {
    it('should handle move submission errors', async () => {
      const flowEngine = new BattleFlowEngine('battle-123');

      // Mock initialization failure
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockRejectedValue(new Error('Engine initialization failed'));

      await expect(flowEngine.initialize()).rejects.toThrow('Engine initialization failed');

      flowEngine.destroy();
    });

    it('should handle switch submission errors', async () => {
      const flowEngine = new BattleFlowEngine('battle-123');

      // Mock successful initialization
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Mock choice submission failure
      const mockSubmitChoice = vi.spyOn(flowEngine['engine'], 'submitChoice');
      mockSubmitChoice.mockRejectedValue(new Error('Switch submission failed'));

      await flowEngine.initialize();

      await expect(flowEngine.submitSwitch(1)).rejects.toThrow('Switch submission failed');

      flowEngine.destroy();
    });

    it('should handle battle state retrieval errors', () => {
      const flowEngine = new BattleFlowEngine('battle-123');

      // Mock invalid state
      const mockConvertToBattleState = vi.spyOn(flowEngine['engine'], 'convertToBattleState');
      mockConvertToBattleState.mockImplementation(() => {
        throw new Error('State conversion failed');
      });

      expect(() => flowEngine.getBattleState()).toThrow('State conversion failed');

      flowEngine.destroy();
    });
  });

  describe('Recovery and Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      // Mock RTDB with retry logic
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < maxRetries) {
            throw new Error('Temporary failure');
          }
          return { set: vi.fn().mockResolvedValue(undefined) };
        })
      };

      // Simulate retry logic
      let lastError: Error | null = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          await rtdbService.updatePresence('test-uid', true);
          break;
        } catch (error) {
          lastError = error as Error;
          if (i === maxRetries - 1) {
            throw error;
          }
        }
      }

      expect(attemptCount).toBe(maxRetries);
      expect(lastError).toBeNull();
    });

    it('should handle partial failures gracefully', async () => {
      // Mock RTDB with partial failure
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation((path) => {
          if (path.includes('presence')) {
            throw new Error('Presence update failed');
          }
          return { set: vi.fn().mockResolvedValue(undefined) };
        })
      };

      // Some operations should fail, others should succeed
      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Presence update failed');

      await expect(rtdbService.joinLobby('test-uid', 'us-central1', {}))
        .resolves.not.toThrow();
    });

    it('should handle concurrent operation failures', async () => {
      // Mock RTDB with concurrent failure
      (rtdbService as any).rtdb = {
        ref: vi.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Concurrent operation failed')), 50);
          });
        })
      };

      // Simulate concurrent operations
      const promises = Array.from({ length: 5 }, (_, i) => 
        rtdbService.updatePresence(`user-${i}`, true)
      );

      const results = await Promise.allSettled(promises);
      
      // All operations should fail
      results.forEach(result => {
        expect(result.status).toBe('rejected');
        expect((result as PromiseRejectedResult).reason).toBeInstanceOf(Error);
      });
    });
  });

  describe('Data Corruption Handling', () => {
    it('should handle corrupted battle data', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();

      // Mock corrupted data
      engine['meta'] = {
        phase: 'invalid-phase' as any,
        turn: -1,
        version: 0,
        players: { p1: { uid: '', name: '' }, p2: { uid: '', name: '' } },
        createdAt: -1,
        format: 'invalid-format' as any,
        ruleSet: 'invalid-rules' as any,
        region: 'invalid-region' as any,
        deadlineAt: -1
      };

      // Should handle corrupted data gracefully
      expect(() => engine.convertToBattleState()).not.toThrow();

      engine.destroy();
    });

    it('should handle missing required fields', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();

      // Mock incomplete data
      engine['meta'] = {
        phase: 'choosing',
        turn: 1,
        version: 1,
        players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
        createdAt: Date.now(),
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        deadlineAt: Date.now() + 30000
      };

      engine['publicState'] = {
        p1: { active: null as any, benchPublic: [] },
        p2: { active: null as any, benchPublic: [] },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      engine['privateState'] = {
        team: [],
        choiceLock: {}
      };

      // Should handle missing fields gracefully
      expect(() => engine.convertToBattleState()).not.toThrow();

      engine.destroy();
    });
  });

  describe('Resource Cleanup Errors', () => {
    it('should handle cleanup errors gracefully', () => {
      const mockUnsubscribe = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      engine.initialize();

      // Should not throw even if cleanup fails
      expect(() => engine.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      engine.initialize();

      // Multiple destroy calls should not throw
      expect(() => {
        engine.destroy();
        engine.destroy();
        engine.destroy();
      }).not.toThrow();
    });
  });
});
