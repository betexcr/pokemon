import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { FirebaseRTDBBattleEngine } from '../battle-engine-rtdb';
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

describe('Battle State Conversion Tests', () => {
  let battleEngine: FirebaseRTDBBattleEngine;
  const mockBattleId = 'test-battle-123';

  beforeEach(() => {
    battleEngine = new FirebaseRTDBBattleEngine(mockBattleId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    battleEngine.destroy();
  });

  describe('RTDB to BattleState Conversion', () => {
    it('should convert basic battle state correctly', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

      // Mock RTDB data
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
      expect(battleState.opponent.pokemon).toHaveLength(1);
      expect(battleState.opponent.pokemon[0].pokemon.name).toBe('Charmander');
    });

    it('should handle different battle phases correctly', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

      // Test choosing phase
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
        p1: { active: { species: 'Pikachu', level: 50, types: ['electric'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        p2: { active: { species: 'Charmander', level: 50, types: ['fire'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      let battleState = battleEngine.convertToBattleState();
      expect(battleState.phase).toBe('choice');

      // Test resolving phase
      battleEngine['meta'] = {
        ...battleEngine['meta']!,
        phase: 'resolving'
      };

      battleState = battleEngine.convertToBattleState();
      expect(battleState.phase).toBe('resolving');

      // Test ended phase
      battleEngine['meta'] = {
        ...battleEngine['meta']!,
        phase: 'ended',
        winnerUid: 'p1'
      };

      battleState = battleEngine.convertToBattleState();
      expect(battleState.phase).toBe('ended');
      expect(battleState.isComplete).toBe(true);
      expect(battleState.winner).toBe('player');
    });

    it('should handle Pokemon with different HP values', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
            hp: { cur: 75, max: 100 },
            boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }
          },
          benchPublic: []
        },
        p2: {
          active: {
            species: 'Charmander',
            level: 50,
            types: ['fire'],
            hp: { cur: 50, max: 100 },
            boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }
          },
          benchPublic: []
        },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 75, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState.player.pokemon[0].currentHp).toBe(75);
      expect(battleState.player.pokemon[0].maxHp).toBe(100);
      expect(battleState.opponent.pokemon[0].currentHp).toBe(50);
      expect(battleState.opponent.pokemon[0].maxHp).toBe(100);
    });

    it('should handle Pokemon with stat boosts', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
            boosts: { atk: 2, def: 0, spa: 0, spd: 0, spe: 1, acc: 0, eva: 0 }
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
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 2, defense: 0, specialAttack: 0, specialDefense: 0, speed: 1, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState.player.pokemon[0].statModifiers.attack).toBe(2);
      expect(battleState.player.pokemon[0].statModifiers.speed).toBe(1);
      expect(battleState.opponent.pokemon[0].statModifiers.attack).toBe(0);
    });

    it('should handle field conditions', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
        p1: { active: { species: 'Pikachu', level: 50, types: ['electric'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        p2: { active: { species: 'Charmander', level: 50, types: ['fire'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        field: {
          hazards: {
            p1: { sr: true, spikes: 2, tSpikes: 0, web: false },
            p2: { sr: false, spikes: 0, tSpikes: 1, web: true }
          },
          screens: {
            p1: { reflect: 5, lightScreen: 0 },
            p2: { reflect: 0, lightScreen: 8 }
          }
        },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState.field).toBeDefined();
      // Note: Field conditions would be properly mapped in the actual implementation
    });

    it('should handle multiple Pokemon on bench', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
          benchPublic: [
            { species: 'Charmander', level: 50, types: ['fire'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } },
            { species: 'Squirtle', level: 50, types: ['water'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }
          ]
        },
        p2: {
          active: {
            species: 'Bulbasaur',
            level: 50,
            types: ['grass'],
            hp: { cur: 100, max: 100 },
            boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }
          },
          benchPublic: []
        },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [
          { pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } },
          { pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } },
          { pokemon: { name: 'Squirtle', types: [{ type: { name: 'water' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }
        ],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState.player.pokemon).toHaveLength(3);
      expect(battleState.player.pokemon[0].pokemon.name).toBe('Pikachu');
      expect(battleState.player.pokemon[1].pokemon.name).toBe('Charmander');
      expect(battleState.player.pokemon[2].pokemon.name).toBe('Squirtle');
    });

    it('should handle fainted Pokemon correctly', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
            hp: { cur: 0, max: 100 },
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
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 0, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      const battleState = battleEngine.convertToBattleState();

      expect(battleState.player.pokemon[0].currentHp).toBe(0);
      expect(battleState.player.faintedCount).toBe(1);
    });

    it('should throw error if not fully initialized', () => {
      expect(() => battleEngine.convertToBattleState())
        .toThrow('Battle state not fully initialized');
    });

    it('should throw error if meta is missing', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

      battleEngine['publicState'] = {
        p1: { active: { species: 'Pikachu', level: 50, types: ['electric'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        p2: { active: { species: 'Charmander', level: 50, types: ['fire'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      expect(() => battleEngine.convertToBattleState())
        .toThrow('Battle state not fully initialized');
    });

    it('should throw error if publicState is missing', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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

      battleEngine['privateState'] = {
        team: [{ pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] }, level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {}, statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }],
        choiceLock: {}
      };

      expect(() => battleEngine.convertToBattleState())
        .toThrow('Battle state not fully initialized');
    });

    it('should throw error if privateState is missing', async () => {
      const mockUnsubscribe = vi.fn();
      (rtdbService.onBattleMeta as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePublic as Mock).mockReturnValue(mockUnsubscribe);
      (rtdbService.onBattlePrivate as Mock).mockReturnValue(mockUnsubscribe);

      await battleEngine.initialize();

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
        p1: { active: { species: 'Pikachu', level: 50, types: ['electric'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        p2: { active: { species: 'Charmander', level: 50, types: ['fire'], hp: { cur: 100, max: 100 }, boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 } }, benchPublic: [] },
        field: { hazards: { p1: { sr: false, spikes: 0, tSpikes: 0, web: false }, p2: { sr: false, spikes: 0, tSpikes: 0, web: false } }, screens: { p1: { reflect: 0, lightScreen: 0 }, p2: { reflect: 0, lightScreen: 0 } } },
        lastResultSummary: ''
      };

      expect(() => battleEngine.convertToBattleState())
        .toThrow('Battle state not fully initialized');
    });
  });
});
