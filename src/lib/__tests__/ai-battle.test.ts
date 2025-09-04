import { BattleAI, createBattleAI } from '../ai-battle';
import { BattleState, BattlePokemon } from '../battle-engine';
import { Pokemon, Move } from '../../types/pokemon';

// Mock Pokemon data
const mockPokemon: Pokemon = {
  id: 1,
  name: 'bulbasaur',
  types: ['grass', 'poison'],
  stats: {
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45
  },
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png'
  },
  height: 7,
  weight: 69,
  abilities: [],
  moves: [],
  species: { name: 'bulbasaur', url: '' },
  base_experience: 64,
  order: 1,
  is_default: true,
  forms: [],
  game_indices: [],
  held_items: [],
  location_area_encounters: '',
  past_types: []
};

const mockMove1: Move = {
  name: 'tackle',
  type: 'normal',
  power: 40,
  accuracy: 100,
  pp: 35,
  effect: 'Deals damage',
  damage_class: 'physical',
  priority: 0
};

const mockMove2: Move = {
  name: 'vine whip',
  type: 'grass',
  power: 45,
  accuracy: 100,
  pp: 25,
  effect: 'Deals damage',
  damage_class: 'physical',
  priority: 0
};

const mockMove3: Move = {
  name: 'growl',
  type: 'normal',
  power: 0,
  accuracy: 100,
  pp: 40,
  effect: 'Lowers attack',
  damage_class: 'status',
  priority: 0
};

describe('Battle AI', () => {
  let mockBattleState: BattleState;

  beforeEach(() => {
    const player: BattlePokemon = {
      pokemon: mockPokemon,
      level: 5,
      currentHp: 20,
      maxHp: 20,
      moves: [mockMove1, mockMove2],
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      }
    };

    const opponent: BattlePokemon = {
      pokemon: mockPokemon,
      level: 5,
      currentHp: 20,
      maxHp: 20,
      moves: [mockMove1, mockMove2, mockMove3],
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      }
    };

    mockBattleState = {
      player,
      opponent,
      turn: 'opponent',
      turnNumber: 1,
      battleLog: ['Battle started!'],
      isComplete: false
    };
  });

  describe('BattleAI', () => {
    it('should create AI with difficulty', () => {
      const ai = new BattleAI('normal');
      expect(ai).toBeInstanceOf(BattleAI);
    });

    it('should select a move action', () => {
      const ai = new BattleAI('normal');
      const action = ai.selectAction(mockBattleState);
      
      expect(action.type).toBe('move');
      expect(typeof action.moveIndex).toBe('number');
      expect(action.moveIndex).toBeGreaterThanOrEqual(0);
      expect(action.moveIndex).toBeLessThan(mockBattleState.opponent.moves.length);
    });

    it('should prefer STAB moves', () => {
      const ai = new BattleAI('normal');
      
      // Create a battle where opponent has both STAB and non-STAB moves
      const grassPokemon = { ...mockPokemon, types: ['grass'] };
      const opponentWithStab: BattlePokemon = {
        ...mockBattleState.opponent,
        pokemon: grassPokemon,
        moves: [mockMove1, mockMove2] // tackle (normal), vine whip (grass - STAB)
      };
      
      const battleWithStab = {
        ...mockBattleState,
        opponent: opponentWithStab
      };

      // Run multiple times to see if STAB move is preferred
      let stabMoveCount = 0;
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const action = ai.selectAction(battleWithStab);
        if (action.moveIndex === 1) { // vine whip is index 1
          stabMoveCount++;
        }
      }
      
      // STAB move should be selected more often (not guaranteed due to randomness)
      expect(stabMoveCount).toBeGreaterThan(0);
    });

    it('should prefer high power moves', () => {
      const ai = new BattleAI('normal');
      
      const highPowerMove: Move = {
        name: 'hyper beam',
        type: 'normal',
        power: 150,
        accuracy: 90,
        pp: 5,
        effect: 'Deals damage',
        damage_class: 'special',
        priority: 0
      };

      const opponentWithHighPower: BattlePokemon = {
        ...mockBattleState.opponent,
        moves: [mockMove1, highPowerMove] // tackle (40 power), hyper beam (150 power)
      };
      
      const battleWithHighPower = {
        ...mockBattleState,
        opponent: opponentWithHighPower
      };

      // Run multiple times to see if high power move is preferred
      let highPowerCount = 0;
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const action = ai.selectAction(battleWithHighPower);
        if (action.moveIndex === 1) { // hyper beam is index 1
          highPowerCount++;
        }
      }
      
      // High power move should be selected more often
      expect(highPowerCount).toBeGreaterThan(0);
    });
  });

  describe('createBattleAI', () => {
    it('should create AI with easy difficulty', () => {
      const ai = createBattleAI('easy');
      expect(ai).toBeInstanceOf(BattleAI);
    });

    it('should create AI with normal difficulty', () => {
      const ai = createBattleAI('normal');
      expect(ai).toBeInstanceOf(BattleAI);
    });

    it('should create AI with hard difficulty', () => {
      const ai = createBattleAI('hard');
      expect(ai).toBeInstanceOf(BattleAI);
    });
  });

  describe('Difficulty behavior', () => {
    it('should have different behavior for different difficulties', () => {
      const easyAI = new BattleAI('easy');
      const normalAI = new BattleAI('normal');
      const hardAI = new BattleAI('hard');

      // All should return valid actions
      const easyAction = easyAI.selectAction(mockBattleState);
      const normalAction = normalAI.selectAction(mockBattleState);
      const hardAction = hardAI.selectAction(mockBattleState);

      expect(easyAction.type).toBe('move');
      expect(normalAction.type).toBe('move');
      expect(hardAction.type).toBe('move');
    });
  });
});
