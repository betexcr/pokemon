import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { FirebaseRTDBBattleEngine, BattleFlowEngine } from '../battle-engine-rtdb';
import { rtdbService } from '../firebase-rtdb-service';
import { BattleState, BattleAction } from '../team-battle-engine';

// Mock the RTDB service
vi.mock('../firebase-rtdb-service', () => ({
  rtdbService: {
    onBattleMeta: vi.fn(),
    onBattlePublic: vi.fn(),
    onBattlePrivate: vi.fn(),
    onBattleResolution: vi.fn(),
    submitChoice: vi.fn()
  }
}));

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-uid'
    }
  }
}));

describe('FirebaseRTDBBattleEngine', () => {
  let battleEngine: FirebaseRTDBBattleEngine;
  const mockBattleId = 'test-battle-123';

  beforeEach(() => {
    battleEngine = new FirebaseRTDBBattleEngine(mockBattleId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    battleEngine.destroy();
  });

  describe('constructor', () => {
    it('should initialize with battle ID', () => {
      expect(battleEngine.battleId).toBe(mockBattleId);
      expect(battleEngine.isInitialized).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should set up listeners and mark as initialized', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      const onStateChange = vi.fn();
      const onPhaseChange = vi.fn();

      await battleEngine.initialize(onStateChange, onPhaseChange);

      expect(rtdbService.onBattleMeta).toHaveBeenCalledWith(mockBattleId, expect.any(Function));
      expect(rtdbService.onBattlePublic).toHaveBeenCalledWith(mockBattleId, expect.any(Function));
      expect(rtdbService.onBattlePrivate).toHaveBeenCalledWith(mockBattleId, 'test-user-uid', expect.any(Function));
      expect(battleEngine.isInitialized).toBe(true);
    });

    it('should handle missing auth user', async () => {
      // Mock auth as null
      vi.doMock('../firebase', () => ({
        auth: null
      }));

      const onStateChange = vi.fn();
      const onPhaseChange = vi.fn();

      await battleEngine.initialize(onStateChange, onPhaseChange);

      expect(rtdbService.onBattleMeta).toHaveBeenCalled();
      expect(rtdbService.onBattlePublic).toHaveBeenCalled();
      // Should not call onBattlePrivate if no auth user
    });
  });

  describe('submitChoice', () => {
    beforeEach(async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();
    });

    it('should submit move choice', async () => {
      (rtdbService.submitChoice as Mock).mockResolvedValue(undefined);

      const action: BattleAction = {
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      };

      await battleEngine.submitChoice(action);

      expect(rtdbService.submitChoice).toHaveBeenCalledWith(
        mockBattleId,
        expect.any(Number),
        'test-user-uid',
        {
          action: 'move',
          payload: {
            moveId: 'thunderbolt',
            target: 'opponent'
          }
        }
      );
    });

    it('should submit switch choice', async () => {
      (rtdbService.submitChoice as Mock).mockResolvedValue(undefined);

      const action: BattleAction = {
        type: 'switch',
        switchIndex: 1
      };

      await battleEngine.submitChoice(action);

      expect(rtdbService.submitChoice).toHaveBeenCalledWith(
        mockBattleId,
        expect.any(Number),
        'test-user-uid',
        {
          action: 'switch',
          payload: {
            switchToIndex: 1
          }
        }
      );
    });

    it('should throw error if not initialized', async () => {
      const newEngine = new FirebaseRTDBBattleEngine(mockBattleId);
      
      const action: BattleAction = {
        type: 'move',
        moveId: 'thunderbolt'
      };

      await expect(newEngine.submitChoice(action))
        .rejects.toThrow('Battle not initialized');
    });

    it('should throw error if not in choosing phase', async () => {
      // Mock meta with resolving phase
      battleEngine['meta'] = {
        phase: 'resolving',
        turn: 1,
        version: 1,
        players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
        createdAt: Date.now(),
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        deadlineAt: Date.now() + 30000
      };

      const action: BattleAction = {
        type: 'move',
        moveId: 'thunderbolt'
      };

      await expect(battleEngine.submitChoice(action))
        .rejects.toThrow('Not in choosing phase');
    });
  });

  describe('convertToBattleState', () => {
    beforeEach(async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();
    });

    it('should convert RTDB data to BattleState', () => {
      // Mock the battle data
      battleEngine['meta'] = {
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

      battleEngine['publicState'] = {
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

      battleEngine['privateState'] = {
        team: [
          {
            pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
            level: 50,
            currentHp: 100,
            maxHp: 100,
            moves: [],
            volatile: {},
            statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
          }
        ],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState).toBeDefined();
      expect(battleState.turn).toBe(1);
      expect(battleState.phase).toBe('choice');
      expect(battleState.player.pokemon).toHaveLength(1);
      expect(battleState.player.pokemon[0].pokemon.name).toBe('Pikachu');
    });

    it('should throw error if not fully initialized', () => {
      expect(() => battleEngine.convertToBattleState())
        .toThrow('Battle state not fully initialized');
    });
  });

  describe('destroy', () => {
    it('should clean up listeners and reset state', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();
      const mockUnsubscribe3 = vi.fn();

      battleEngine['unsubscribe'] = [mockUnsubscribe1, mockUnsubscribe2, mockUnsubscribe3];

      battleEngine.destroy();

      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
      expect(mockUnsubscribe3).toHaveBeenCalled();
      expect(battleEngine.isInitialized).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return current phase', () => {
      battleEngine['meta'] = {
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

      expect(battleEngine.currentPhase).toBe('choosing');
    });

    it('should return current turn', () => {
      battleEngine['meta'] = {
        phase: 'choosing',
        turn: 5,
        version: 1,
        players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
        createdAt: Date.now(),
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        deadlineAt: Date.now() + 30000
      };

      expect(battleEngine.currentTurn).toBe(5);
    });

    it('should return completion status', () => {
      battleEngine['meta'] = {
        phase: 'ended',
        turn: 10,
        version: 1,
        players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
        createdAt: Date.now(),
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        deadlineAt: Date.now() + 30000
      };

      expect(battleEngine.isComplete).toBe(true);
    });

    it('should return winner', () => {
      battleEngine['meta'] = {
        phase: 'ended',
        turn: 10,
        version: 1,
        players: { p1: { uid: 'p1', name: 'P1' }, p2: { uid: 'p2', name: 'P2' } },
        createdAt: Date.now(),
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        deadlineAt: Date.now() + 30000,
        winnerUid: 'p1'
      };

      expect(battleEngine.winner).toBe('p1');
    });
  });
});

describe('BattleFlowEngine', () => {
  let flowEngine: BattleFlowEngine;
  const mockBattleId = 'test-battle-123';

  beforeEach(() => {
    flowEngine = new BattleFlowEngine(mockBattleId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    flowEngine.destroy();
  });

  describe('constructor', () => {
    it('should initialize with battle ID and create RTDB engine', () => {
      expect(flowEngine['battleId']).toBe(mockBattleId);
      expect(flowEngine['engine']).toBeInstanceOf(FirebaseRTDBBattleEngine);
    });
  });

  describe('initialize', () => {
    it('should initialize the underlying RTDB engine', async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      await flowEngine.initialize();

      expect(mockInitialize).toHaveBeenCalled();
    });
  });

  describe('submitMove', () => {
    beforeEach(async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockResolvedValue(undefined);
      await flowEngine.initialize();
    });

    it('should submit move choice', async () => {
      const mockSubmitChoice = vi.spyOn(flowEngine['engine'], 'submitChoice');
      mockSubmitChoice.mockResolvedValue(undefined);

      await flowEngine.submitMove('thunderbolt', 'opponent');

      expect(mockSubmitChoice).toHaveBeenCalledWith({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      });
    });

    it('should submit move without target', async () => {
      const mockSubmitChoice = vi.spyOn(flowEngine['engine'], 'submitChoice');
      mockSubmitChoice.mockResolvedValue(undefined);

      await flowEngine.submitMove('thunderbolt');

      expect(mockSubmitChoice).toHaveBeenCalledWith({
        type: 'move',
        moveId: 'thunderbolt',
        target: undefined
      });
    });
  });

  describe('submitSwitch', () => {
    beforeEach(async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockResolvedValue(undefined);
      await flowEngine.initialize();
    });

    it('should submit switch choice', async () => {
      const mockSubmitChoice = vi.spyOn(flowEngine['engine'], 'submitChoice');
      mockSubmitChoice.mockResolvedValue(undefined);

      await flowEngine.submitSwitch(2);

      expect(mockSubmitChoice).toHaveBeenCalledWith({
        type: 'switch',
        switchIndex: 2
      });
    });
  });

  describe('getBattleState', () => {
    it('should return null if not initialized', () => {
      expect(flowEngine.getBattleState()).toBeNull();
    });

    it('should return battle state if initialized', async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockResolvedValue(undefined);
      
      const mockConvertToBattleState = vi.spyOn(flowEngine['engine'], 'convertToBattleState');
      const mockBattleState: BattleState = {
        player: { pokemon: [], currentIndex: 0, faintedCount: 0, sideConditions: {} },
        opponent: { pokemon: [], currentIndex: 0, faintedCount: 0, sideConditions: {} },
        turn: 1,
        rng: 12345,
        battleLog: [],
        isComplete: false,
        phase: 'choice',
        actionQueue: [],
        field: {}
      };
      mockConvertToBattleState.mockReturnValue(mockBattleState);

      await flowEngine.initialize();
      const result = flowEngine.getBattleState();

      expect(result).toBe(mockBattleState);
    });
  });

  describe('destroy', () => {
    it('should destroy the underlying RTDB engine', () => {
      const mockDestroy = vi.spyOn(flowEngine['engine'], 'destroy');
      mockDestroy.mockImplementation(() => {});

      flowEngine.destroy();

      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
