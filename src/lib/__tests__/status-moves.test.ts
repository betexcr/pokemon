import { 
  // createBattlePokemon, 
  applyStatusMoveEffects, 
  calculateDamageDetailed,
  BattlePokemon 
} from '../team-battle-engine';
import { Pokemon, Move } from '@/types/pokemon';

// Mock Pokémon data
const mockPokemon: Pokemon = {
  id: 1,
  name: 'charizard',
  types: [{ type: { name: 'fire' } }, { type: { name: 'flying' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 78 },
    { stat: { name: 'attack' }, base_stat: 84 },
    { stat: { name: 'defense' }, base_stat: 78 },
    { stat: { name: 'special-attack' }, base_stat: 109 },
    { stat: { name: 'special-defense' }, base_stat: 85 },
    { stat: { name: 'speed' }, base_stat: 100 }
  ],
  height: 17,
  weight: 905,
  abilities: [
    { ability: { name: 'blaze' }, is_hidden: false }
  ],
  moves: [],
  base_experience: 267,
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    front_shiny: null,
    front_female: null,
    front_shiny_female: null,
    back_default: null,
    back_shiny: null,
    back_female: null,
    back_shiny_female: null,
    other: {
      dream_world: { front_default: null, front_female: null },
      home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
      'official-artwork': { front_default: null, front_shiny: null }
    },
    versions: {}
  },
  held_items: [],
  location_area_encounters: '',
  species: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon-species/6/' }
};

const mockGeodude: Pokemon = {
  id: 74,
  name: 'geodude',
  types: [{ type: { name: 'rock' } }, { type: { name: 'ground' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 40 },
    { stat: { name: 'attack' }, base_stat: 80 },
    { stat: { name: 'defense' }, base_stat: 100 },
    { stat: { name: 'special-attack' }, base_stat: 30 },
    { stat: { name: 'special-defense' }, base_stat: 30 },
    { stat: { name: 'speed' }, base_stat: 20 }
  ],
  height: 4,
  weight: 200,
  abilities: [
    { ability: { name: 'rock-head' }, is_hidden: false }
  ],
  moves: [],
  base_experience: 86,
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
    front_shiny: null,
    front_female: null,
    front_shiny_female: null,
    back_default: null,
    back_shiny: null,
    back_female: null,
    back_shiny_female: null,
    other: {
      dream_world: { front_default: null, front_female: null },
      home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
      'official-artwork': { front_default: null, front_shiny: null }
    },
    versions: {}
  },
  held_items: [],
  location_area_encounters: '',
  species: { name: 'geodude', url: 'https://pokeapi.co/api/v2/pokemon-species/74/' }
};

describe('Status Moves', () => {
  let charizard: BattlePokemon;
  let geodude: BattlePokemon;
  let battleLog: unknown[];

  beforeEach(() => {
    charizard = {
      pokemon: mockPokemon,
      level: 50,
      currentHp: 195, // 78 base HP at level 50
      maxHp: 195,
      moves: [],
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
    
    geodude = {
      pokemon: mockGeodude,
      level: 50,
      currentHp: 100, // 40 base HP at level 50
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
      }
    };
    
    battleLog = [];
  });

  describe('Stat Reduction Moves', () => {
    test('growl should reduce opponent attack by 1 stage', () => {
      const growlMove: Move = {
        name: 'growl',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 40
      };

      const initialAttack = geodude.statModifiers.attack;
      applyStatusMoveEffects(charizard, geodude, growlMove, { battleLog });

      expect(geodude.statModifiers.attack).toBe(initialAttack - 1);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("geodude's Attack fell!");
    });

    test('leer should reduce opponent defense by 1 stage', () => {
      const leerMove: Move = {
        name: 'leer',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 30
      };

      const initialDefense = geodude.statModifiers.defense;
      applyStatusMoveEffects(charizard, geodude, leerMove, { battleLog });

      expect(geodude.statModifiers.defense).toBe(initialDefense - 1);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("geodude's Defense fell!");
    });

    test('smokescreen should reduce opponent accuracy by 1 stage', () => {
      const smokescreenMove: Move = {
        name: 'smokescreen',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 20
      };

      const initialAccuracy = geodude.statModifiers.accuracy;
      applyStatusMoveEffects(charizard, geodude, smokescreenMove, { battleLog });

      expect(geodude.statModifiers.accuracy).toBe(initialAccuracy - 1);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("geodude's Accuracy fell!");
    });

    test('charm should reduce opponent attack by 2 stages', () => {
      const charmMove: Move = {
        name: 'charm',
        type: 'fairy',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 20
      };

      const initialAttack = geodude.statModifiers.attack;
      applyStatusMoveEffects(charizard, geodude, charmMove, { battleLog });

      expect(geodude.statModifiers.attack).toBe(initialAttack - 2);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("geodude's Attack fell!");
    });
  });

  describe('Stat Boosting Moves', () => {
    test('swords-dance should increase user attack by 2 stages', () => {
      const swordsDanceMove: Move = {
        name: 'swords-dance',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: null,
        pp: 20
      };

      const initialAttack = charizard.statModifiers.attack;
      applyStatusMoveEffects(charizard, geodude, swordsDanceMove, { battleLog });

      expect(charizard.statModifiers.attack).toBe(initialAttack + 2);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("charizard's Attack rose!");
    });

    test('calm-mind should increase user special attack by 1 stage', () => {
      const calmMindMove: Move = {
        name: 'calm-mind',
        type: 'psychic',
        damage_class: 'status',
        power: null,
        accuracy: null,
        pp: 20
      };

      const initialSpecialAttack = charizard.statModifiers.specialAttack;
      applyStatusMoveEffects(charizard, geodude, calmMindMove, { battleLog });

      expect(charizard.statModifiers.specialAttack).toBe(initialSpecialAttack + 1);
      expect(battleLog).toHaveLength(1);
      expect(battleLog[0].message).toContain("charizard's Special Attack rose!");
    });
  });

  describe('Stat Modifier Limits', () => {
    test('stat modifiers should be clamped between -6 and +6', () => {
      // Set attack to -6
      geodude.statModifiers.attack = -6;
      
      const growlMove: Move = {
        name: 'growl',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 40
      };

      applyStatusMoveEffects(charizard, geodude, growlMove, { battleLog });

      // Should still be -6 (can't go lower)
      expect(geodude.statModifiers.attack).toBe(-6);
    });

    test('stat modifiers should be clamped at +6', () => {
      // Set attack to +6
      charizard.statModifiers.attack = 6;
      
      const swordsDanceMove: Move = {
        name: 'swords-dance',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: null,
        pp: 20
      };

      applyStatusMoveEffects(charizard, geodude, swordsDanceMove, { battleLog });

      // Should still be +6 (can't go higher)
      expect(charizard.statModifiers.attack).toBe(6);
    });
  });

  describe('Status Moves vs Damaging Moves', () => {
    test('status moves should not deal damage', () => {
      const growlMove: Move = {
        name: 'growl',
        type: 'normal',
        damage_class: 'status',
        power: null,
        accuracy: 100,
        pp: 40
      };

      const initialHp = geodude.currentHp;
      applyStatusMoveEffects(charizard, geodude, growlMove, { battleLog });

      // HP should not change
      expect(geodude.currentHp).toBe(initialHp);
    });

    test('damaging moves should deal damage', () => {
      const scratchMove: Move = {
        name: 'scratch',
        type: 'normal',
        damage_class: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35
      };

      const initialHp = geodude.currentHp;
      const damageResult = calculateDamageDetailed(charizard, geodude, scratchMove);

      // Should deal damage
      expect(damageResult.damage).toBeGreaterThan(0);
    });
  });
});
