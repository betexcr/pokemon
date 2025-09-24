import { vi, Mock } from 'vitest';
import { rtdbService } from '../firebase-rtdb-service';
import { FirebaseRTDBBattleEngine } from '../battle-engine-rtdb';
import { BattleFlowEngine } from '../battle-engine-rtdb';
import { BattleState, BattlePokemon, BattleTeam } from '../team-battle-engine';

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

export class RTDBTestUtils {
  static createMockPokemon(overrides: Partial<BattlePokemon> = {}): BattlePokemon {
    return {
      pokemon: {
        name: 'Pikachu',
        id: 25,
        types: [{ type: { name: 'electric' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 35 },
          { stat: { name: 'attack' }, base_stat: 55 },
          { stat: { name: 'defense' }, base_stat: 40 },
          { stat: { name: 'special-attack' }, base_stat: 50 },
          { stat: { name: 'special-defense' }, base_stat: 50 },
          { stat: { name: 'speed' }, base_stat: 90 }
        ],
        weight: 60,
        height: 4,
        abilities: [{ ability: { name: 'static' }, is_hidden: false }],
        sprites: { front_default: 'pikachu.png' }
      },
      level: 50,
      currentHp: 100,
      maxHp: 100,
      moves: [
        { id: 'thunderbolt', pp: 15, maxPp: 15, disabled: false },
        { id: 'quick-attack', pp: 30, maxPp: 30, disabled: false }
      ],
      volatile: {},
      statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      ...overrides
    };
  }

  static createMockTeam(overrides: Partial<BattleTeam> = {}): BattleTeam {
    return {
      pokemon: [this.createMockPokemon()],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {},
      ...overrides
    };
  }

  static createMockBattleState(overrides: Partial<BattleState> = {}): BattleState {
    return {
      player: this.createMockTeam(),
      opponent: this.createMockTeam(),
      turn: 1,
      rng: 12345,
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: {},
      ...overrides
    };
  }

  static createMockRTDBMeta(overrides: any = {}) {
    return {
      phase: 'choosing',
      turn: 1,
      version: 1,
      players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
      createdAt: Date.now(),
      format: 'singles',
      ruleSet: 'gen9-no-weather',
      region: 'global',
      deadlineAt: Date.now() + 30000,
      ...overrides
    };
  }

  static createMockRTDBPublicState(overrides: any = {}) {
    return {
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
      lastResultSummary: '',
      ...overrides
    };
  }

  static createMockRTDBPrivateState(overrides: any = {}) {
    return {
      team: [this.createMockPokemon()],
      choiceLock: {},
      ...overrides
    };
  }

  static setupMockRTDBService() {
    const mockUnsubscribe = vi.fn();
    
    (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
    (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
    (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);
    (rtdbService.onBattleResolution as Mock).mockReturnValue(mockUnsubscribe);
    (rtdbService.submitChoice as Mock).mockResolvedValue(undefined);
    (rtdbService.updatePresence as Mock).mockResolvedValue(undefined);
    (rtdbService.joinLobby as Mock).mockResolvedValue(undefined);
    (rtdbService.leaveLobby as Mock).mockResolvedValue(undefined);
    (rtdbService.createBattle as Mock).mockResolvedValue(undefined);
    (rtdbService.deleteBattle as Mock).mockResolvedValue(undefined);

    return {
      mockUnsubscribe,
      rtdbService
    };
  }

  static async createMockBattleEngine(battleId: string = 'test-battle-123') {
    const { mockUnsubscribe } = this.setupMockRTDBService();
    
    const engine = new FirebaseRTDBBattleEngine(battleId);
    await engine.initialize();

    return {
      engine,
      mockUnsubscribe
    };
  }

  static async createMockFlowEngine(battleId: string = 'test-battle-123') {
    const { mockUnsubscribe } = this.setupMockRTDBService();
    
    const flowEngine = new BattleFlowEngine(battleId);
    await flowEngine.initialize();

    return {
      flowEngine,
      mockUnsubscribe
    };
  }

  static setupMockFirebaseAuth(uid: string = 'test-user-uid') {
    vi.doMock('../firebase', () => ({
      auth: {
        currentUser: {
          uid
        }
      }
    }));
  }

  static setupMockRTDBConnection() {
    (rtdbService as any).rtdb = {
      ref: vi.fn(),
      child: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
  }

  static setupMockRTDBError(error: Error) {
    (rtdbService as any).rtdb = {
      ref: vi.fn().mockImplementation(() => {
        throw error;
      })
    };
  }

  static setupMockRTDBTimeout(timeout: number = 100) {
    (rtdbService as any).rtdb = {
      ref: vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
      })
    };
  }

  static setupMockRTDBPartialFailure(failingPaths: string[] = []) {
    (rtdbService as any).rtdb = {
      ref: vi.fn().mockImplementation((path) => {
        if (failingPaths.some(failingPath => path.includes(failingPath))) {
          throw new Error('Partial failure');
        }
        return { set: vi.fn().mockResolvedValue(undefined) };
      })
    };
  }

  static async simulateBattleFlow(
    battleId: string,
    player1Choices: any[],
    player2Choices: any[]
  ) {
    const { engine: p1Engine } = await this.createMockBattleEngine(battleId);
    const { engine: p2Engine } = await this.createMockBattleEngine(battleId);

    // Simulate choice submissions
    for (let i = 0; i < player1Choices.length; i++) {
      await p1Engine.submitChoice(player1Choices[i]);
      await p2Engine.submitChoice(player2Choices[i]);
    }

    // Clean up
    p1Engine.destroy();
    p2Engine.destroy();

    return {
      p1Choices: player1Choices,
      p2Choices: player2Choices
    };
  }

  static async simulateConcurrentBattles(battleCount: number = 5) {
    const battles = Array.from({ length: battleCount }, (_, i) => 
      this.createMockBattleEngine(`battle-${i}`)
    );

    const engines = await Promise.all(battles);

    // Simulate concurrent operations
    const operations = engines.map(({ engine }) => 
      engine.submitChoice({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      })
    );

    await Promise.all(operations);

    // Clean up
    engines.forEach(({ engine }) => engine.destroy());

    return engines.length;
  }

  static async simulateHighFrequencyOperations(operationCount: number = 100) {
    const startTime = performance.now();

    const operations = Array.from({ length: operationCount }, (_, i) => 
      rtdbService.updatePresence(`user-${i}`, true)
    );

    await Promise.all(operations);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return {
      operationCount,
      totalTime,
      averageTime: totalTime / operationCount
    };
  }

  static createMockLargeTeam(size: number = 50) {
    return Array.from({ length: size }, (_, i) => ({
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
  }

  static async simulateDataMigration(
    firestoreData: any[],
    rtdbData: any[]
  ) {
    const startTime = performance.now();

    // Simulate Firestore operations
    const firestoreOperations = firestoreData.map(data => 
      Promise.resolve(`firestore-${data.id}`)
    );
    await Promise.all(firestoreOperations);

    // Simulate RTDB operations
    const rtdbOperations = rtdbData.map(data => 
      Promise.resolve(`rtdb-${data.id}`)
    );
    await Promise.all(rtdbOperations);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return {
      firestoreCount: firestoreData.length,
      rtdbCount: rtdbData.length,
      totalTime
    };
  }

  static createMockCorruptedData() {
    return {
      battle: {
        id: '',
        players: {
          p1: { uid: '', name: '' },
          p2: { uid: '', name: '' }
        },
        turn: -1,
        phase: 'invalid-phase',
        createdAt: -1
      },
      team: [
        {
          pokemon: { name: '', types: [] },
          level: -1,
          currentHp: 1000,
          maxHp: 100,
          statModifiers: {}
        }
      ],
      choice: {
        action: 'invalid-action',
        payload: {}
      }
    };
  }

  static async simulateErrorRecovery(
    operation: () => Promise<any>,
    maxRetries: number = 3
  ) {
    let attemptCount = 0;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await operation();
        break;
      } catch (error) {
        lastError = error as Error;
        attemptCount++;
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }

    return {
      attemptCount,
      lastError,
      success: lastError === null
    };
  }

  static measureMemoryUsage(operation: () => void) {
    const initialMemory = process.memoryUsage().heapUsed;
    
    operation();
    
    const afterOperation = process.memoryUsage().heapUsed;
    const memoryIncrease = afterOperation - initialMemory;

    return {
      initialMemory,
      afterOperation,
      memoryIncrease
    };
  }

  static async measurePerformance<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    return { result, duration };
  }

  static createMockNetworkConditions(
    latency: number = 0,
    packetLoss: number = 0
  ) {
    return {
      latency,
      packetLoss,
      simulate: async (operation: () => Promise<any>) => {
        if (packetLoss > 0 && Math.random() < packetLoss) {
          throw new Error('Packet loss');
        }
        
        if (latency > 0) {
          await new Promise(resolve => setTimeout(resolve, latency));
        }
        
        return operation();
      }
    };
  }
}
