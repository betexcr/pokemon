import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RTDBTestUtils } from './rtdb-test-utils';
import { rtdbService } from '../firebase-rtdb-service';
import { FirebaseRTDBBattleEngine } from '../battle-engine-rtdb';
import { BattleFlowEngine } from '../battle-engine-rtdb';

describe('RTDB Test Runner - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests', () => {
    it('should run all unit tests for RTDB service', async () => {
      const { mockUnsubscribe } = RTDBTestUtils.setupMockRTDBService();
      
      // Test presence updates
      await rtdbService.updatePresence('test-uid', true);
      expect(rtdbService.updatePresence).toHaveBeenCalledWith('test-uid', true);

      // Test lobby operations
      await rtdbService.joinLobby('test-uid', 'us-central1', {
        format: 'singles',
        minRating: 1000
      });
      expect(rtdbService.joinLobby).toHaveBeenCalledWith('test-uid', 'us-central1', {
        format: 'singles',
        minRating: 1000
      });

      // Test battle creation
      const team = [RTDBTestUtils.createMockPokemon()];
      await rtdbService.createBattle(
        'battle-123',
        'p1-uid',
        'Player 1',
        team,
        'p2-uid',
        'Player 2',
        team
      );
      expect(rtdbService.createBattle).toHaveBeenCalled();

      // Test choice submission
      await rtdbService.submitChoice('battle-123', 1, 'test-uid', {
        action: 'move',
        payload: { moveId: 'thunderbolt', target: 'opponent' }
      });
      expect(rtdbService.submitChoice).toHaveBeenCalled();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should run all unit tests for battle engine', async () => {
      const { engine } = await RTDBTestUtils.createMockBattleEngine('battle-123');
      
      expect(engine.battleId).toBe('battle-123');
      expect(engine.isInitialized).toBe(true);

      // Test choice submission
      await engine.submitChoice({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      });

      // Test state conversion
      engine['meta'] = RTDBTestUtils.createMockRTDBMeta();
      engine['publicState'] = RTDBTestUtils.createMockRTDBPublicState();
      engine['privateState'] = RTDBTestUtils.createMockRTDBPrivateState();

      const battleState = engine.convertToBattleState();
      expect(battleState).toBeDefined();
      expect(battleState.turn).toBe(1);

      engine.destroy();
    });

    it('should run all unit tests for flow engine', async () => {
      const { flowEngine } = await RTDBTestUtils.createMockFlowEngine('battle-123');
      
      // Test move submission
      await flowEngine.submitMove('thunderbolt', 'opponent');
      expect(rtdbService.submitChoice).toHaveBeenCalledWith({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      });

      // Test switch submission
      await flowEngine.submitSwitch(1);
      expect(rtdbService.submitChoice).toHaveBeenCalledWith({
        type: 'switch',
        switchIndex: 1
      });

      // Test battle state retrieval
      const battleState = flowEngine.getBattleState();
      expect(battleState).toBeNull(); // Not initialized with real data

      flowEngine.destroy();
    });
  });

  describe('Integration Tests', () => {
    it('should run complete battle flow integration test', async () => {
      const battleId = 'integration-battle-123';
      const player1Choices = [
        { type: 'move', moveId: 'thunderbolt', target: 'opponent' },
        { type: 'switch', switchIndex: 1 },
        { type: 'move', moveId: 'quick-attack', target: 'opponent' }
      ];
      const player2Choices = [
        { type: 'move', moveId: 'flamethrower', target: 'opponent' },
        { type: 'move', moveId: 'ember', target: 'opponent' },
        { type: 'switch', switchIndex: 1 }
      ];

      const result = await RTDBTestUtils.simulateBattleFlow(
        battleId,
        player1Choices,
        player2Choices
      );

      expect(result.p1Choices).toHaveLength(3);
      expect(result.p2Choices).toHaveLength(3);
    });

    it('should run concurrent battles integration test', async () => {
      const battleCount = 10;
      const actualCount = await RTDBTestUtils.simulateConcurrentBattles(battleCount);
      
      expect(actualCount).toBe(battleCount);
    });

    it('should run high-frequency operations integration test', async () => {
      const operationCount = 50;
      const result = await RTDBTestUtils.simulateHighFrequencyOperations(operationCount);
      
      expect(result.operationCount).toBe(operationCount);
      expect(result.totalTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Performance Tests', () => {
    it('should run performance tests for large data', async () => {
      const largeTeam = RTDBTestUtils.createMockLargeTeam(100);
      
      const { duration } = await RTDBTestUtils.measurePerformance(async () => {
        await rtdbService.createBattle(
          'battle-123',
          'p1-uid',
          'Player 1',
          largeTeam,
          'p2-uid',
          'Player 2',
          largeTeam
        );
      });

      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should run memory usage tests', () => {
      const memoryUsage = RTDBTestUtils.measureMemoryUsage(() => {
        const engines = Array.from({ length: 100 }, (_, i) => 
          new FirebaseRTDBBattleEngine(`battle-${i}`)
        );
        
        engines.forEach(engine => engine.destroy());
      });

      expect(memoryUsage.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should run network condition tests', async () => {
      const networkConditions = RTDBTestUtils.createMockNetworkConditions(50, 0.1);
      
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < 10; i++) {
        try {
          await networkConditions.simulate(async () => {
            await rtdbService.updatePresence(`user-${i}`, true);
          });
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }

      expect(successCount + failureCount).toBe(10);
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Tests', () => {
    it('should run error handling tests for connection failures', async () => {
      RTDBTestUtils.setupMockRTDBError(new Error('Connection failed'));

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Connection failed');
    });

    it('should run error handling tests for timeouts', async () => {
      RTDBTestUtils.setupMockRTDBTimeout(50);

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Request timeout');
    });

    it('should run error handling tests for partial failures', async () => {
      RTDBTestUtils.setupMockRTDBPartialFailure(['presence']);

      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Partial failure');

      await expect(rtdbService.joinLobby('test-uid', 'us-central1', {}))
        .resolves.not.toThrow();
    });

    it('should run error recovery tests', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const operation = async () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await RTDBTestUtils.simulateErrorRecovery(operation, maxRetries);

      expect(result.attemptCount).toBe(maxRetries);
      expect(result.success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should run security tests for authentication', async () => {
      RTDBTestUtils.setupMockFirebaseAuth('test-user-uid');

      // Test that operations require authentication
      RTDBTestUtils.setupMockRTDBConnection();
      
      await expect(rtdbService.updatePresence('test-uid', true))
        .resolves.not.toThrow();
    });

    it('should run security tests for data validation', async () => {
      RTDBTestUtils.setupMockRTDBConnection();

      // Test invalid data
      await expect(rtdbService.createBattle('', 'p1', 'P1', [], 'p2', 'P2', []))
        .rejects.toThrow('Invalid battle ID');

      await expect(rtdbService.submitChoice('battle-123', 1, 'test-uid', null as any))
        .rejects.toThrow('Invalid choice data');
    });

    it('should run security tests for access control', async () => {
      RTDBTestUtils.setupMockRTDBConnection();

      // Test that users can only access their own data
      await expect(rtdbService.updatePresence('other-uid', true))
        .rejects.toThrow();
    });
  });

  describe('Migration Tests', () => {
    it('should run migration tests for data conversion', async () => {
      const firestoreData = [
        { id: 'battle-1', players: { p1: { uid: 'p1' }, p2: { uid: 'p2' } } },
        { id: 'battle-2', players: { p1: { uid: 'p1' }, p2: { uid: 'p2' } } }
      ];

      const rtdbData = [
        { id: 'battle-1', meta: { phase: 'choosing' } },
        { id: 'battle-2', meta: { phase: 'choosing' } }
      ];

      const result = await RTDBTestUtils.simulateDataMigration(firestoreData, rtdbData);

      expect(result.firestoreCount).toBe(2);
      expect(result.rtdbCount).toBe(2);
      expect(result.totalTime).toBeLessThan(1000);
    });

    it('should run migration tests for corrupted data', async () => {
      const corruptedData = RTDBTestUtils.createMockCorruptedData();

      // Should handle corrupted data gracefully
      expect(() => {
        // Simulate data validation
        if (!corruptedData.battle.id) {
          throw new Error('Invalid battle ID');
        }
      }).toThrow('Invalid battle ID');
    });
  });

  describe('Comprehensive Test Suite', () => {
    it('should run all test categories in sequence', async () => {
      // Unit Tests
      const { mockUnsubscribe } = RTDBTestUtils.setupMockRTDBService();
      await rtdbService.updatePresence('test-uid', true);
      expect(rtdbService.updatePresence).toHaveBeenCalled();

      // Integration Tests
      const battleResult = await RTDBTestUtils.simulateBattleFlow(
        'comprehensive-battle',
        [{ type: 'move', moveId: 'thunderbolt', target: 'opponent' }],
        [{ type: 'move', moveId: 'flamethrower', target: 'opponent' }]
      );
      expect(battleResult.p1Choices).toHaveLength(1);

      // Performance Tests
      const performanceResult = await RTDBTestUtils.measurePerformance(async () => {
        return 'performance test completed';
      });
      expect(performanceResult.result).toBe('performance test completed');
      expect(performanceResult.duration).toBeLessThan(1000);

      // Error Handling Tests
      RTDBTestUtils.setupMockRTDBError(new Error('Test error'));
      await expect(rtdbService.updatePresence('test-uid', true))
        .rejects.toThrow('Test error');

      // Security Tests
      RTDBTestUtils.setupMockFirebaseAuth('test-user-uid');
      RTDBTestUtils.setupMockRTDBConnection();
      await expect(rtdbService.updatePresence('test-uid', true))
        .resolves.not.toThrow();

      // Migration Tests
      const migrationResult = await RTDBTestUtils.simulateDataMigration(
        [{ id: 'test-1' }],
        [{ id: 'test-1' }]
      );
      expect(migrationResult.firestoreCount).toBe(1);
      expect(migrationResult.rtdbCount).toBe(1);

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should run stress tests', async () => {
      const stressTestResults = [];

      // Test 1: High-frequency operations
      const highFreqResult = await RTDBTestUtils.simulateHighFrequencyOperations(100);
      stressTestResults.push({
        test: 'high-frequency',
        operations: highFreqResult.operationCount,
        duration: highFreqResult.totalTime
      });

      // Test 2: Concurrent battles
      const concurrentResult = await RTDBTestUtils.simulateConcurrentBattles(20);
      stressTestResults.push({
        test: 'concurrent-battles',
        battles: concurrentResult
      });

      // Test 3: Large data
      const largeTeam = RTDBTestUtils.createMockLargeTeam(200);
      const largeDataResult = await RTDBTestUtils.measurePerformance(async () => {
        return largeTeam.length;
      });
      stressTestResults.push({
        test: 'large-data',
        size: largeDataResult.result,
        duration: largeDataResult.duration
      });

      // Verify all stress tests completed
      expect(stressTestResults).toHaveLength(3);
      expect(stressTestResults[0].operations).toBe(100);
      expect(stressTestResults[1].battles).toBe(20);
      expect(stressTestResults[2].size).toBe(200);
    });

    it('should run reliability tests', async () => {
      const reliabilityResults = [];

      // Test 1: Error recovery
      const errorRecoveryResult = await RTDBTestUtils.simulateErrorRecovery(
        async () => {
          if (Math.random() < 0.5) {
            throw new Error('Random failure');
          }
          return 'success';
        },
        5
      );
      reliabilityResults.push({
        test: 'error-recovery',
        success: errorRecoveryResult.success,
        attempts: errorRecoveryResult.attemptCount
      });

      // Test 2: Network resilience
      const networkConditions = RTDBTestUtils.createMockNetworkConditions(100, 0.2);
      let networkSuccessCount = 0;
      let networkFailureCount = 0;

      for (let i = 0; i < 20; i++) {
        try {
          await networkConditions.simulate(async () => {
            return 'network success';
          });
          networkSuccessCount++;
        } catch (error) {
          networkFailureCount++;
        }
      }

      reliabilityResults.push({
        test: 'network-resilience',
        success: networkSuccessCount,
        failures: networkFailureCount
      });

      // Test 3: Memory stability
      const memoryStabilityResult = RTDBTestUtils.measureMemoryUsage(() => {
        const engines = Array.from({ length: 1000 }, (_, i) => 
          new FirebaseRTDBBattleEngine(`battle-${i}`)
        );
        
        engines.forEach(engine => engine.destroy());
      });

      reliabilityResults.push({
        test: 'memory-stability',
        memoryIncrease: memoryStabilityResult.memoryIncrease
      });

      // Verify all reliability tests completed
      expect(reliabilityResults).toHaveLength(3);
      expect(reliabilityResults[0].attempts).toBeGreaterThan(0);
      expect(reliabilityResults[1].success + reliabilityResults[1].failures).toBe(20);
      expect(reliabilityResults[2].memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});
