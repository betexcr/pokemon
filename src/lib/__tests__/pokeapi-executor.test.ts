import { executeTurn } from '../executor';
import { BattlePokemon } from '../team-battle-engine';
import { Pokemon } from '@/types/pokemon';

// Mock Pokemon data
const mockPokemon: Pokemon = {
  id: 1,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ type: { name: 'electric' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 35 },
    { stat: { name: 'attack' }, base_stat: 55 },
    { stat: { name: 'defense' }, base_stat: 40 },
    { stat: { name: 'special-attack' }, base_stat: 50 },
    { stat: { name: 'special-defense' }, base_stat: 50 },
    { stat: { name: 'speed' }, base_stat: 90 }
  ],
  moves: [],
  sprites: {
    front_default: '',
    back_default: '',
    other: {}
  }
};

const mockPokemon2: Pokemon = {
  id: 2,
  name: 'squirtle',
  height: 5,
  weight: 90,
  types: [{ type: { name: 'water' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 44 },
    { stat: { name: 'attack' }, base_stat: 48 },
    { stat: { name: 'defense' }, base_stat: 65 },
    { stat: { name: 'special-attack' }, base_stat: 50 },
    { stat: { name: 'special-defense' }, base_stat: 64 },
    { stat: { name: 'speed' }, base_stat: 43 }
  ],
  moves: [],
  sprites: {
    front_default: '',
    back_default: '',
    other: {}
  }
};

const mockBattlePokemon: BattlePokemon = {
  pokemon: mockPokemon,
  level: 50,
  currentHp: 100,
  maxHp: 100,
  moves: [],
  statModifiers: {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  },
  status: undefined,
  statusTurns: undefined,
  currentAbility: 'static',
  abilityChanged: false,
  flinched: false
};

const mockBattlePokemon2: BattlePokemon = {
  pokemon: mockPokemon2,
  level: 50,
  currentHp: 100,
  maxHp: 100,
  moves: [],
  statModifiers: {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  },
  status: undefined,
  statusTurns: undefined,
  currentAbility: 'torrent',
  abilityChanged: false,
  flinched: false
};

describe('PokeAPI Executor Integration', () => {
  test('should execute a basic move with PokeAPI data', async () => {
    const result = await executeTurn({
      move: 'tackle',
      attacker: mockBattlePokemon,
      defender: mockBattlePokemon2
    });

    expect(result).toBeDefined();
    expect(result.move).toBe('tackle');
    expect(result.totalDamage).toBeGreaterThanOrEqual(0);
    expect(result.hits).toBe(1);
    expect(result.crits).toHaveLength(1);
    expect(result.perHitDamage).toHaveLength(1);
  }, 10000);

  test('should handle status moves correctly', async () => {
    const result = await executeTurn({
      move: 'growl',
      attacker: mockBattlePokemon,
      defender: mockBattlePokemon2
    });

    expect(result).toBeDefined();
    expect(result.move).toBe('growl');
    expect(result.totalDamage).toBe(0); // Status moves don't deal damage
    expect(result.missed).toBe(false); // Status moves don't miss
  }, 10000);

  test('should handle multi-hit moves', async () => {
    const result = await executeTurn({
      move: 'fury-swipes',
      attacker: mockBattlePokemon,
      defender: mockBattlePokemon2
    });

    expect(result).toBeDefined();
    expect(result.move).toBe('fury-swipes');
    expect(result.hits).toBeGreaterThanOrEqual(2);
    expect(result.hits).toBeLessThanOrEqual(5);
    expect(result.perHitDamage).toHaveLength(result.hits);
    expect(result.crits).toHaveLength(result.hits);
  }, 10000);

  test('should handle type effectiveness correctly', async () => {
    const result = await executeTurn({
      move: 'thunderbolt',
      attacker: mockBattlePokemon,
      defender: mockBattlePokemon2
    });

    expect(result).toBeDefined();
    expect(result.move).toBe('thunderbolt');
    expect(result.typeEffectiveness).toBe(2); // Electric is super effective against Water
  }, 10000);

  test('should handle dynamic power moves', async () => {
    const result = await executeTurn({
      move: 'low-kick',
      attacker: mockBattlePokemon,
      defender: mockBattlePokemon2
    });

    expect(result).toBeDefined();
    expect(result.move).toBe('low-kick');
    expect(result.totalDamage).toBeGreaterThanOrEqual(0);
  }, 10000);
});
