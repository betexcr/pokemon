import { executeTurn } from '../executor';
import { BattlePokemon } from '../team-battle-engine';
import { Pokemon } from '@/types/pokemon';

// Mock Pokemon data
const mockPokemon: Pokemon = {
  id: 1,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' }, slot: 1 }],
  stats: [
    { stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' }, base_stat: 35, effort: 0 },
    { stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' }, base_stat: 55, effort: 0 },
    { stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' }, base_stat: 40, effort: 0 },
    { stat: { name: 'special-attack', url: 'https://pokeapi.co/api/v2/stat/4/' }, base_stat: 50, effort: 0 },
    { stat: { name: 'special-defense', url: 'https://pokeapi.co/api/v2/stat/5/' }, base_stat: 50, effort: 0 },
    { stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' }, base_stat: 90, effort: 2 }
  ],
  moves: [],
  sprites: {
    front_default: '',
    front_shiny: null,
    front_female: null,
    front_shiny_female: null,
    back_default: '',
    back_shiny: null,
    back_female: null,
    back_shiny_female: null,
    other: {
      dream_world: { front_default: null, front_female: null },
      home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
      'official-artwork': { front_default: null, front_shiny: null }
    }
  }
};

const mockPokemon2: Pokemon = {
  id: 2,
  name: 'squirtle',
  height: 5,
  weight: 90,
  types: [{ type: { name: 'water', url: 'https://pokeapi.co/api/v2/type/11/' }, slot: 1 }],
  stats: [
    { stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' }, base_stat: 44, effort: 0 },
    { stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' }, base_stat: 48, effort: 0 },
    { stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' }, base_stat: 65, effort: 1 },
    { stat: { name: 'special-attack', url: 'https://pokeapi.co/api/v2/stat/4/' }, base_stat: 50, effort: 0 },
    { stat: { name: 'special-defense', url: 'https://pokeapi.co/api/v2/stat/5/' }, base_stat: 64, effort: 0 },
    { stat: { name: 'speed', url: 'https://pokeapi.co/api/v2/stat/6/' }, base_stat: 43, effort: 0 }
  ],
  moves: [],
  sprites: {
    front_default: '',
    front_shiny: null,
    front_female: null,
    front_shiny_female: null,
    back_default: '',
    back_shiny: null,
    back_female: null,
    back_shiny_female: null,
    other: {
      dream_world: { front_default: null, front_female: null },
      home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
      'official-artwork': { front_default: null, front_shiny: null }
    }
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
