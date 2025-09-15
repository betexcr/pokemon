import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { BattleFlowEngine } from '../battle-engine-rtdb';
import { rtdbService } from '../firebase-rtdb-service';
import { BattleState, BattlePokemon, BattleTeam } from '../team-battle-engine';

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

describe('Battle Flow Integration Tests', () => {
  let flowEngine: BattleFlowEngine;
  let mockUnsubscribes: Mock[];

  const createMockBattleState = (overrides: Partial<BattleState> = {}): BattleState => {
    const mockPokemon: BattlePokemon = {
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
      statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
    };

    const mockTeam: BattleTeam = {
      pokemon: [mockPokemon],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {}
    };

    return {
      player: mockTeam,
      opponent: mockTeam,
      turn: 1,
      rng: 12345,
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: {},
      ...overrides
    };
  };

  beforeEach(() => {
    mockUnsubscribes = [vi.fn(), vi.fn(), vi.fn()];
    
    (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribes[0]);
    (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribes[1]);
    (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribes[2]);
    (rtdbService.submitChoice as Mock).mockResolvedValue(undefined);

    flowEngine = new BattleFlowEngine('test-battle-123');
  });

  afterEach(() => {
    flowEngine.destroy();
    vi.clearAllMocks();
  });

  describe('Complete Battle Flow', () => {
    it('should handle full battle lifecycle from initialization to completion', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      // Mock the initialize method to capture callbacks
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      expect(mockInitialize).toHaveBeenCalled();
      expect(stateChangeCallback).toBeDefined();
      expect(phaseChangeCallback).toBeDefined();

      // Simulate battle state changes
      const initialState = createMockBattleState();
      stateChangeCallback!(initialState);
      phaseChangeCallback!('choosing');

      let currentState = flowEngine.getBattleState();
      expect(currentState).toBeDefined();
      expect(currentState?.phase).toBe('choice');

      // Test move submission
      await flowEngine.submitMove('thunderbolt', 'opponent');
      expect(rtdbService.submitChoice).toHaveBeenCalledWith({
        type: 'move',
        moveId: 'thunderbolt',
        target: 'opponent'
      });

      // Simulate phase change to resolving
      phaseChangeCallback!('resolving');
      // Note: In a real implementation, the state would be updated by the server

      // Simulate battle completion
      const completedState = createMockBattleState({
        isComplete: true,
        winner: 'player',
        phase: 'ended'
      });
      stateChangeCallback!(completedState);
      phaseChangeCallback!('ended');

      currentState = flowEngine.getBattleState();
      expect(currentState?.isComplete).toBe(true);
      expect(currentState?.winner).toBe('player');
    });

    it('should handle Pokemon switching flow', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      // Create state with multiple Pokemon
      const mockPokemon1: BattlePokemon = {
        pokemon: {
          name: 'Pikachu',
          id: 25,
          types: [{ type: { name: 'electric' } }],
          stats: [],
          weight: 60,
          height: 4,
          abilities: [],
          sprites: { front_default: 'pikachu.png' }
        },
        level: 50,
        currentHp: 50, // Damaged
        maxHp: 100,
        moves: [],
        volatile: {},
        statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
      };

      const mockPokemon2: BattlePokemon = {
        pokemon: {
          name: 'Charmander',
          id: 4,
          types: [{ type: { name: 'fire' } }],
          stats: [],
          weight: 85,
          height: 6,
          abilities: [],
          sprites: { front_default: 'charmander.png' }
        },
        level: 50,
        currentHp: 100, // Full health
        maxHp: 100,
        moves: [],
        volatile: {},
        statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
      };

      const switchState = createMockBattleState({
        player: {
          pokemon: [mockPokemon1, mockPokemon2],
          currentIndex: 0,
          faintedCount: 0,
          sideConditions: {}
        }
      });

      stateChangeCallback!(switchState);
      phaseChangeCallback!('choosing');

      // Test switch submission
      await flowEngine.submitSwitch(1);
      expect(rtdbService.submitChoice).toHaveBeenCalledWith({
        type: 'switch',
        switchIndex: 1
      });
    });

    it('should handle error scenarios gracefully', async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockRejectedValue(new Error('Connection failed'));

      await expect(flowEngine.initialize()).rejects.toThrow('Connection failed');
    });

    it('should handle move submission errors', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      (rtdbService.submitChoice as Mock).mockRejectedValue(new Error('Invalid move'));

      await flowEngine.initialize();

      const initialState = createMockBattleState();
      stateChangeCallback!(initialState);
      phaseChangeCallback!('choosing');

      await expect(flowEngine.submitMove('invalid-move')).rejects.toThrow('Invalid move');
    });

    it('should handle switch submission errors', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      (rtdbService.submitChoice as Mock).mockRejectedValue(new Error('Invalid switch'));

      await flowEngine.initialize();

      const initialState = createMockBattleState();
      stateChangeCallback!(initialState);
      phaseChangeCallback!('choosing');

      await expect(flowEngine.submitSwitch(5)).rejects.toThrow('Invalid switch');
    });
  });

  describe('State Synchronization', () => {
    it('should maintain state consistency across multiple updates', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      // Simulate multiple state updates
      const state1 = createMockBattleState({ turn: 1 });
      const state2 = createMockBattleState({ turn: 2 });
      const state3 = createMockBattleState({ turn: 3, isComplete: true, winner: 'player' });

      stateChangeCallback!(state1);
      phaseChangeCallback!('choosing');
      expect(flowEngine.getBattleState()?.turn).toBe(1);

      stateChangeCallback!(state2);
      phaseChangeCallback!('resolving');
      expect(flowEngine.getBattleState()?.turn).toBe(2);

      stateChangeCallback!(state3);
      phaseChangeCallback!('ended');
      expect(flowEngine.getBattleState()?.isComplete).toBe(true);
      expect(flowEngine.getBattleState()?.winner).toBe('player');
    });

    it('should handle rapid phase changes', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;
      let phaseChangeCallback: ((phase: string) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange, onPhaseChange) => {
        stateChangeCallback = onStateChange;
        phaseChangeCallback = onPhaseChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      const initialState = createMockBattleState();
      stateChangeCallback!(initialState);

      // Rapid phase changes
      phaseChangeCallback!('choosing');
      phaseChangeCallback!('resolving');
      phaseChangeCallback!('choosing');
      phaseChangeCallback!('resolving');
      phaseChangeCallback!('ended');

      // Should handle all changes gracefully
      expect(flowEngine.getBattleState()).toBeDefined();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should properly clean up resources on destroy', () => {
      const mockDestroy = vi.spyOn(flowEngine['engine'], 'destroy');
      mockDestroy.mockImplementation(() => {});

      flowEngine.destroy();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const mockDestroy = vi.spyOn(flowEngine['engine'], 'destroy');
      mockDestroy.mockImplementation(() => {});

      flowEngine.destroy();
      flowEngine.destroy();
      flowEngine.destroy();

      expect(mockDestroy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null battle state gracefully', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange) => {
        stateChangeCallback = onStateChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      // Simulate null state
      stateChangeCallback!(null as any);

      expect(flowEngine.getBattleState()).toBeNull();
    });

    it('should handle undefined callbacks', async () => {
      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation(() => Promise.resolve());

      await flowEngine.initialize();

      // Should not throw errors
      expect(() => flowEngine.submitMove('thunderbolt')).not.toThrow();
      expect(() => flowEngine.submitSwitch(1)).not.toThrow();
    });

    it('should handle concurrent operations', async () => {
      let stateChangeCallback: ((state: BattleState) => void) | undefined;

      const mockInitialize = vi.spyOn(flowEngine['engine'], 'initialize');
      mockInitialize.mockImplementation((onStateChange) => {
        stateChangeCallback = onStateChange;
        return Promise.resolve();
      });

      await flowEngine.initialize();

      const initialState = createMockBattleState();
      stateChangeCallback!(initialState);

      // Simulate concurrent operations
      const promises = [
        flowEngine.submitMove('thunderbolt'),
        flowEngine.submitMove('quick-attack'),
        flowEngine.submitSwitch(1)
      ];

      await Promise.allSettled(promises);

      expect(rtdbService.submitChoice).toHaveBeenCalledTimes(3);
    });
  });
});
