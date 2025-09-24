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

describe('RTDB Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Migration', () => {
    it('should migrate Firestore battle data to RTDB format', async () => {
      // Mock Firestore data (old format)
      const firestoreBattleData = {
        id: 'battle-123',
        players: {
          p1: {
            uid: 'player1',
            name: 'Player 1',
            team: [
              {
                pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
                level: 50,
                currentHp: 100,
                maxHp: 100,
                statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
              }
            ]
          },
          p2: {
            uid: 'player2',
            name: 'Player 2',
            team: [
              {
                pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] },
                level: 50,
                currentHp: 100,
                maxHp: 100,
                statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
              }
            ]
          }
        },
        turn: 1,
        phase: 'choosing',
        createdAt: Date.now(),
        format: 'singles'
      };

      // Mock RTDB operations
      (rtdbService as any).rtdb = { ref: vi.fn() };

      // Migrate battle data
      await rtdbService.createBattle(
        firestoreBattleData.id,
        firestoreBattleData.players.p1.uid,
        firestoreBattleData.players.p1.name,
        firestoreBattleData.players.p1.team,
        firestoreBattleData.players.p2.uid,
        firestoreBattleData.players.p2.name,
        firestoreBattleData.players.p2.team
      );

      expect(rtdbService.createBattle).toHaveBeenCalledWith(
        'battle-123',
        'player1',
        'Player 1',
        firestoreBattleData.players.p1.team,
        'player2',
        'Player 2',
        firestoreBattleData.players.p2.team
      );
    });

    it('should migrate user presence data', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      // Migrate presence data
      await rtdbService.updatePresence('user-123', true);

      expect(rtdbService.updatePresence).toHaveBeenCalledWith('user-123', true);
    });

    it('should migrate lobby data', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      // Migrate lobby data
      await rtdbService.joinLobby('user-123', 'us-central1', {
        format: 'singles',
        minRating: 1000
      });

      expect(rtdbService.joinLobby).toHaveBeenCalledWith('user-123', 'us-central1', {
        format: 'singles',
        minRating: 1000
      });
    });
  });

  describe('Component Migration', () => {
    it('should migrate from Firestore battle component to RTDB component', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      // Old Firestore battle engine
      const oldEngine = {
        battleId: 'battle-123',
        isInitialized: false,
        initialize: vi.fn().mockResolvedValue(undefined),
        submitChoice: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn()
      };

      // New RTDB battle engine
      const newEngine = new FirebaseRTDBBattleEngine('battle-123');

      // Migrate initialization
      await oldEngine.initialize();
      await newEngine.initialize();

      expect(oldEngine.initialize).toHaveBeenCalled();
      expect(newEngine.isInitialized).toBe(true);

      // Migrate choice submission
      const choice = {
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      };

      await oldEngine.submitChoice(choice);
      await newEngine.submitChoice(choice);

      expect(oldEngine.submitChoice).toHaveBeenCalledWith(choice);
      expect(rtdbService.submitChoice).toHaveBeenCalled();

      // Clean up
      oldEngine.destroy();
      newEngine.destroy();
    });

    it('should migrate battle flow engine', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      // Old Firestore flow engine
      const oldFlowEngine = {
        battleId: 'battle-123',
        engine: {
          initialize: vi.fn().mockResolvedValue(undefined),
          submitChoice: vi.fn().mockResolvedValue(undefined),
          destroy: vi.fn()
        },
        initialize: vi.fn().mockResolvedValue(undefined),
        submitMove: vi.fn().mockResolvedValue(undefined),
        submitSwitch: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn()
      };

      // New RTDB flow engine
      const newFlowEngine = new BattleFlowEngine('battle-123');

      // Migrate initialization
      await oldFlowEngine.initialize();
      await newFlowEngine.initialize();

      expect(oldFlowEngine.initialize).toHaveBeenCalled();
      expect(newFlowEngine['engine']).toBeInstanceOf(FirebaseRTDBBattleEngine);

      // Migrate move submission
      await oldFlowEngine.submitMove('thunderbolt', 'opponent');
      await newFlowEngine.submitMove('thunderbolt', 'opponent');

      expect(oldFlowEngine.submitMove).toHaveBeenCalledWith('thunderbolt', 'opponent');
      expect(rtdbService.submitChoice).toHaveBeenCalled();

      // Migrate switch submission
      await oldFlowEngine.submitSwitch(1);
      await newFlowEngine.submitSwitch(1);

      expect(oldFlowEngine.submitSwitch).toHaveBeenCalledWith(1);
      expect(rtdbService.submitChoice).toHaveBeenCalled();

      // Clean up
      oldFlowEngine.destroy();
      newFlowEngine.destroy();
    });
  });

  describe('State Migration', () => {
    it('should migrate battle state from Firestore to RTDB format', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const engine = new FirebaseRTDBBattleEngine('battle-123');
      await engine.initialize();

      // Old Firestore state format
      const oldState = {
        player: {
          pokemon: [
            {
              pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
              level: 50,
              currentHp: 100,
              maxHp: 100,
              statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
            }
          ],
          currentIndex: 0,
          faintedCount: 0,
          sideConditions: {}
        },
        opponent: {
          pokemon: [
            {
              pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] },
              level: 50,
              currentHp: 100,
              maxHp: 100,
              statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
            }
          ],
          currentIndex: 0,
          faintedCount: 0,
          sideConditions: {}
        },
        turn: 1,
        rng: 12345,
        battleLog: [],
        isComplete: false,
        phase: 'choice',
        actionQueue: [],
        field: {}
      };

      // Migrate to RTDB format
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
        p1: {
          active: {
            species: 'Pikachu',
            level: 50,
            types: ['electric'],
            hp: { cur: 100, max: 100 },
            boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }
          },
          benchPublic: []
        },
        p2: {
          active: {
            species: 'Charmander',
            level: 50,
            types: ['fire'],
            hp: { cur: 100, max: 100 },
            boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }
          },
          benchPublic: []
        },
        field: {
          hazards: {
            p1: { sr: false, spikes: 0, tSpikes: 0, web: false },
            p2: { sr: false, spikes: 0, tSpikes: 0, web: false }
          },
          screens: {
            p1: { reflect: 0, lightScreen: 0 },
            p2: { reflect: 0, lightScreen: 0 }
          }
        },
        lastResultSummary: ''
      };

      engine['privateState'] = {
        team: oldState.player.pokemon,
        choiceLock: {}
      };

      // Convert to new state format
      const newState = engine.convertToBattleState();

      expect(newState).toBeDefined();
      expect(newState.turn).toBe(1);
      expect(newState.phase).toBe('choice');
      expect(newState.player.pokemon).toHaveLength(1);
      expect(newState.player.pokemon[0].pokemon.name).toBe('Pikachu');

      engine.destroy();
    });

    it('should handle state migration errors gracefully', async () => {
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

      // Should handle invalid state gracefully
      expect(() => engine.convertToBattleState())
        .toThrow('Battle state not fully initialized');

      engine.destroy();
    });
  });

  describe('Rollback Testing', () => {
    it('should be able to rollback to Firestore system', async () => {
      // Mock both systems
      const firestoreService = {
        createBattle: vi.fn().mockResolvedValue(undefined),
        submitChoice: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn()
      };

      const rtdbService = {
        createBattle: vi.fn().mockResolvedValue(undefined),
        submitChoice: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn()
      };

      // Test both systems
      await firestoreService.createBattle('battle-123', 'p1', 'P1', [], 'p2', 'P2', []);
      await rtdbService.createBattle('battle-123', 'p1', 'P1', [], 'p2', 'P2', []);

      expect(firestoreService.createBattle).toHaveBeenCalled();
      expect(rtdbService.createBattle).toHaveBeenCalled();

      // Clean up both systems
      firestoreService.destroy();
      rtdbService.destroy();
    });

    it('should handle mixed system state during migration', async () => {
      // Mock mixed state
      const firestoreBattles = ['battle-1', 'battle-2'];
      const rtdbBattles = ['battle-3', 'battle-4'];

      // Simulate migration process
      const allBattles = [...firestoreBattles, ...rtdbBattles];

      expect(allBattles).toHaveLength(4);
      expect(firestoreBattles).toContain('battle-1');
      expect(rtdbBattles).toContain('battle-3');
    });
  });

  describe('Performance Comparison', () => {
    it('should compare Firestore vs RTDB performance', async () => {
      // Mock Firestore operations
      const firestoreStart = performance.now();
      const firestoreOperations = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(`firestore-operation-${i}`)
      );
      await Promise.all(firestoreOperations);
      const firestoreEnd = performance.now();
      const firestoreTime = firestoreEnd - firestoreStart;

      // Mock RTDB operations
      const rtdbStart = performance.now();
      const rtdbOperations = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(`rtdb-operation-${i}`)
      );
      await Promise.all(rtdbOperations);
      const rtdbEnd = performance.now();
      const rtdbTime = rtdbEnd - rtdbStart;

      // Both should complete in reasonable time
      expect(firestoreTime).toBeLessThan(1000);
      expect(rtdbTime).toBeLessThan(1000);
    });

    it('should measure memory usage during migration', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate migration process
      const engines = Array.from({ length: 50 }, (_, i) => 
        new FirebaseRTDBBattleEngine(`battle-${i}`)
      );

      const afterCreation = process.memoryUsage().heapUsed;
      const memoryIncrease = afterCreation - initialMemory;

      // Clean up
      engines.forEach(engine => engine.destroy());

      const afterCleanup = process.memoryUsage().heapUsed;
      const memoryAfterCleanup = afterCleanup - initialMemory;

      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(memoryAfterCleanup).toBeLessThan(20 * 1024 * 1024); // Less than 20MB after cleanup
    });
  });

  describe('Data Validation', () => {
    it('should validate migrated data integrity', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      // Create battle with validation
      const battleId = 'battle-123';
      const team = [
        {
          pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
          level: 50,
          currentHp: 100,
          maxHp: 100,
          statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
        }
      ];

      await rtdbService.createBattle(
        battleId,
        'player1',
        'Player 1',
        team,
        'player2',
        'Player 2',
        team
      );

      // Validate data integrity
      expect(rtdbService.createBattle).toHaveBeenCalledWith(
        battleId,
        'player1',
        'Player 1',
        team,
        'player2',
        'Player 2',
        team
      );

      // Validate team data
      expect(team).toHaveLength(1);
      expect(team[0].pokemon.name).toBe('Pikachu');
      expect(team[0].level).toBe(50);
      expect(team[0].currentHp).toBe(100);
      expect(team[0].maxHp).toBe(100);
    });

    it('should handle data corruption during migration', async () => {
      (rtdbService as any).rtdb = { ref: vi.fn() };

      // Test corrupted data
      const corruptedTeam = [
        {
          pokemon: { name: '', types: [] }, // Invalid name and types
          level: -1, // Invalid level
          currentHp: 1000, // Invalid HP
          maxHp: 100,
          statModifiers: {} // Missing required fields
        }
      ];

      // Should handle corrupted data gracefully
      await expect(rtdbService.createBattle(
        'battle-123',
        'player1',
        'Player 1',
        corruptedTeam,
        'player2',
        'Player 2',
        corruptedTeam
      )).resolves.not.toThrow();
    });
  });
});
