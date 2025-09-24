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

describe('RTDB Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Performance', () => {
    it('should establish connection quickly', async () => {
      const startTime = performance.now();
      
      // Mock successful connection
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      await rtdbService.updatePresence('test-uid', true);
      
      const endTime = performance.now();
      const connectionTime = endTime - startTime;
      
      expect(connectionTime).toBeLessThan(100); // Should connect in under 100ms
    });

    it('should handle multiple concurrent connections', async () => {
      const startTime = performance.now();
      
      // Mock successful connection
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Simulate multiple concurrent connections
      const promises = Array.from({ length: 10 }, (_, i) => 
        rtdbService.updatePresence(`user-${i}`, true)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // Should handle 10 connections in under 500ms
    });

    it('should handle connection failures gracefully', async () => {
      // Mock connection failure
      (rtdbService as any).rtdb = null;
      
      const startTime = performance.now();
      
      try {
        await rtdbService.updatePresence('test-uid', true);
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = performance.now();
      const failureTime = endTime - startTime;
      
      expect(failureTime).toBeLessThan(50); // Should fail quickly
    });
  });

  describe('Data Transfer Performance', () => {
    it('should transfer small data quickly', async () => {
      const startTime = performance.now();
      
      // Mock successful data transfer
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      await rtdbService.joinLobby('test-uid', 'us-central1', {
        format: 'singles',
        minRating: 1000
      });
      
      const endTime = performance.now();
      const transferTime = endTime - startTime;
      
      expect(transferTime).toBeLessThan(100); // Should transfer small data in under 100ms
    });

    it('should transfer large battle data efficiently', async () => {
      const startTime = performance.now();
      
      // Mock successful data transfer
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Create large team data
      const largeTeam = Array.from({ length: 6 }, (_, i) => ({
        pokemon: {
          name: `Pokemon${i}`,
          types: [{ type: { name: 'normal' } }]
        },
        level: 50,
        currentHp: 100,
        maxHp: 100,
        statModifiers: {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }
      }));
      
      await rtdbService.createBattle(
        'battle-123',
        'p1-uid',
        'Player 1',
        largeTeam,
        'p2-uid',
        'Player 2',
        largeTeam
      );
      
      const endTime = performance.now();
      const transferTime = endTime - startTime;
      
      expect(transferTime).toBeLessThan(500); // Should transfer large data in under 500ms
    });

    it('should handle multiple small updates efficiently', async () => {
      const startTime = performance.now();
      
      // Mock successful data transfer
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Simulate multiple small updates
      const promises = Array.from({ length: 20 }, (_, i) => 
        rtdbService.submitChoice('battle-123', 1, 'test-uid', {
          action: 'move',
          payload: { moveId: `move-${i}`, target: 'opponent' }
        })
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should handle 20 updates in under 1 second
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with multiple battle engines', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple battle engines
      const engines = Array.from({ length: 100 }, (_, i) => 
        new FirebaseRTDBBattleEngine(`battle-${i}`)
      );
      
      const afterCreation = process.memoryUsage().heapUsed;
      const memoryIncrease = afterCreation - initialMemory;
      
      // Clean up
      engines.forEach(engine => engine.destroy());
      
      const afterCleanup = process.memoryUsage().heapUsed;
      const memoryAfterCleanup = afterCleanup - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(memoryAfterCleanup).toBeLessThan(10 * 1024 * 1024); // Less than 10MB after cleanup
    });

    it('should clean up listeners properly', () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
      
      const engine = new FirebaseRTDBBattleEngine('battle-123');
      
      // Initialize to create listeners
      engine.initialize();
      
      // Destroy should clean up all listeners
      engine.destroy();
      
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3); // Should unsubscribe from all listeners
    });
  });

  describe('Battle Engine Performance', () => {
    it('should initialize battle engine quickly', async () => {
      const startTime = performance.now();
      
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
      
      const engine = new FirebaseRTDBBattleEngine('battle-123');
      
      await engine.initialize();
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      expect(initTime).toBeLessThan(200); // Should initialize in under 200ms
      
      engine.destroy();
    });

    it('should handle rapid state changes efficiently', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
      
      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();
      
      const startTime = performance.now();
      
      // Simulate rapid state changes
      for (let i = 0; i < 100; i++) {
        // Simulate state change
        engine['meta'] = {
          phase: 'choosing',
          turn: i,
          version: 1,
          players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
          createdAt: Date.now(),
          format: 'singles',
          ruleSet: 'gen9-no-weather',
          region: 'global',
          deadlineAt: Date.now() + 30000
        };
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // Should handle 100 state changes in under 100ms
      
      engine.destroy();
    });

    it('should handle concurrent battle engines efficiently', async () => {
      const startTime = performance.now();
      
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
      
      // Create multiple battle engines
      const engines = Array.from({ length: 10 }, (_, i) => 
        new FirebaseRTDBBattleEngine(`battle-${i}`)
      );
      
      // Initialize all engines concurrently
      const initPromises = engines.map(engine => engine.initialize());
      await Promise.all(initPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should initialize 10 engines in under 1 second
      
      // Clean up
      engines.forEach(engine => engine.destroy());
    });
  });

  describe('Network Resilience', () => {
    it('should handle network delays gracefully', async () => {
      const startTime = performance.now();
      
      // Mock delayed response
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Simulate network delay
      const originalSet = rtdbService.updatePresence;
      rtdbService.updatePresence = vi.fn().mockImplementation(async (...args) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return originalSet.apply(rtdbService, args);
      });
      
      await rtdbService.updatePresence('test-uid', true);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(200); // Should handle delay gracefully
    });

    it('should handle network failures gracefully', async () => {
      const startTime = performance.now();
      
      // Mock network failure
      (rtdbService as any).rtdb = null;
      
      try {
        await rtdbService.updatePresence('test-uid', true);
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = performance.now();
      const failureTime = endTime - startTime;
      
      expect(failureTime).toBeLessThan(50); // Should fail quickly
    });

    it('should handle partial network failures', async () => {
      const startTime = performance.now();
      
      // Mock partial failure
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Simulate some operations failing
      const originalSet = rtdbService.updatePresence;
      rtdbService.updatePresence = vi.fn().mockImplementation(async (...args) => {
        if (Math.random() < 0.5) {
          throw new Error('Network error');
        }
        return originalSet.apply(rtdbService, args);
      });
      
      // Try multiple times
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < 10; i++) {
        try {
          await rtdbService.updatePresence(`user-${i}`, true);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should handle partial failures in under 1 second
      expect(successCount + failureCount).toBe(10); // Should attempt all operations
    });
  });

  describe('Scalability', () => {
    it('should handle large number of battles', async () => {
      const startTime = performance.now();
      
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
      
      // Create many battle engines
      const engines = Array.from({ length: 50 }, (_, i) => 
        new FirebaseRTDBBattleEngine(`battle-${i}`)
      );
      
      // Initialize all engines
      const initPromises = engines.map(engine => engine.initialize());
      await Promise.all(initPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(2000); // Should handle 50 battles in under 2 seconds
      
      // Clean up
      engines.forEach(engine => engine.destroy());
    });

    it('should handle large team data efficiently', async () => {
      const startTime = performance.now();
      
      // Mock successful data transfer
      (rtdbService as any).rtdb = { ref: vi.fn() };
      
      // Create very large team data
      const largeTeam = Array.from({ length: 100 }, (_, i) => ({
        pokemon: {
          name: `Pokemon${i}`,
          types: [{ type: { name: 'normal' } }],
          stats: Array.from({ length: 6 }, (_, j) => ({
            stat: { name: `stat-${j}` },
            base_stat: 100
          }))
        },
        level: 50,
        currentHp: 100,
        maxHp: 100,
        statModifiers: {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }
      }));
      
      await rtdbService.createBattle(
        'battle-123',
        'p1-uid',
        'Player 1',
        largeTeam,
        'p2-uid',
        'Player 2',
        largeTeam
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(2000); // Should handle large data in under 2 seconds
    });
  });
});
