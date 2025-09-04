import { 
  calculateHp, 
  calculateStat, 
  getTypeEffectiveness, 
  calculateDamage,
  initializeBattle,
  executeAction
} from '../battle-engine';
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

const mockMove: Move = {
  name: 'tackle',
  type: 'normal',
  power: 40,
  accuracy: 100,
  pp: 35,
  effect: 'Deals damage',
  damage_class: 'physical',
  priority: 0
};

describe('Battle Engine', () => {
  describe('calculateHp', () => {
    it('should calculate HP correctly for level 5', () => {
      const hp = calculateHp(45, 5);
      expect(hp).toBe(21); // ((2 * 45 + 31) * 5) / 100 + 5 + 10 = 21
    });

    it('should calculate HP correctly for level 50', () => {
      const hp = calculateHp(45, 50);
      expect(hp).toBe(120); // ((2 * 45 + 31) * 50) / 100 + 50 + 10 = 120
    });
  });

  describe('calculateStat', () => {
    it('should calculate attack stat correctly', () => {
      const attack = calculateStat(49, 5);
      expect(attack).toBe(11); // ((2 * 49 + 31) * 5) / 100 + 5 = 11
    });
  });

  describe('getTypeEffectiveness', () => {
    it('should return 2x for super effective', () => {
      const effectiveness = getTypeEffectiveness('fire', ['grass']);
      expect(effectiveness).toBe(2);
    });

    it('should return 0.5x for not very effective', () => {
      const effectiveness = getTypeEffectiveness('fire', ['fire']);
      expect(effectiveness).toBe(0.5);
    });

    it('should return 0x for no effect', () => {
      const effectiveness = getTypeEffectiveness('normal', ['ghost']);
      expect(effectiveness).toBe(0);
    });

    it('should handle dual types correctly', () => {
      const effectiveness = getTypeEffectiveness('fire', ['grass', 'poison']);
      expect(effectiveness).toBe(2); // Fire is 2x vs grass, 0.5x vs poison = 1x total
    });
  });

  describe('calculateDamage', () => {
    it('should calculate damage within expected range', () => {
      const attacker = {
        pokemon: mockPokemon,
        level: 5,
        currentHp: 20,
        maxHp: 20,
        moves: [mockMove],
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

      const defender = {
        pokemon: mockPokemon,
        level: 5,
        currentHp: 20,
        maxHp: 20,
        moves: [mockMove],
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

      const damage = calculateDamage(attacker, defender, mockMove);
      expect(damage).toBeGreaterThan(0);
      expect(damage).toBeLessThan(50); // Should be reasonable damage
    });
  });

  describe('initializeBattle', () => {
    it('should initialize battle state correctly', () => {
      const battle = initializeBattle(
        mockPokemon,
        5,
        [mockMove],
        mockPokemon,
        5,
        [mockMove]
      );

      expect(battle.player.pokemon).toBe(mockPokemon);
      expect(battle.opponent.pokemon).toBe(mockPokemon);
      expect(battle.player.level).toBe(5);
      expect(battle.opponent.level).toBe(5);
      expect(battle.turnNumber).toBe(1);
      expect(battle.isComplete).toBe(false);
      expect(battle.battleLog).toHaveLength(1);
      expect(battle.battleLog[0]).toContain('Battle started!');
    });
  });

  describe('executeAction', () => {
    it('should execute a move action', () => {
      const battle = initializeBattle(
        mockPokemon,
        5,
        [mockMove],
        mockPokemon,
        5,
        [mockMove]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });
      
      expect(newBattle.battleLog.length).toBeGreaterThanOrEqual(battle.battleLog.length);
      expect(newBattle.turnNumber).toBe(2);
      expect(newBattle.turn).toBe('opponent');
    });

    it('should end battle when HP reaches 0', () => {
      const battle = initializeBattle(
        mockPokemon,
        5,
        [mockMove],
        mockPokemon,
        5,
        [mockMove]
      );

      // Set opponent HP to 1
      battle.opponent.currentHp = 1;

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });
      
      expect(newBattle.isComplete).toBe(true);
      expect(newBattle.winner).toBe('player');
    });
  });
});
