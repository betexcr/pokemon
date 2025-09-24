import type { TypeName } from '@/lib/type/data';

export type Move = { name: string; type: TypeName; power: number };
export type SimplePokemon = {
  id: number;
  name: string;
  types: TypeName[];
  hp: number;
  moves: Move[];
  sprite?: string;
};

export const SAMPLE_POKEMON: Record<string, SimplePokemon> = {
  Charizard: {
    id: 6,
    name: 'Charizard',
    types: ['Fire', 'Flying'],
    hp: 180,
    moves: [
      { name: 'Flamethrower', type: 'Fire', power: 90 },
      { name: 'Air Slash', type: 'Flying', power: 75 },
      { name: 'Dragon Claw', type: 'Dragon', power: 80 },
    ],
  },
  Blastoise: {
    id: 9,
    name: 'Blastoise',
    types: ['Water'],
    hp: 200,
    moves: [
      { name: 'Surf', type: 'Water', power: 90 },
      { name: 'Ice Beam', type: 'Ice', power: 90 },
      { name: 'Bite', type: 'Dark', power: 60 },
    ],
  },
  Venusaur: {
    id: 3,
    name: 'Venusaur',
    types: ['Grass', 'Poison'],
    hp: 190,
    moves: [
      { name: 'Giga Drain', type: 'Grass', power: 75 },
      { name: 'Sludge Bomb', type: 'Poison', power: 90 },
      { name: 'Earthquake', type: 'Ground', power: 100 },
    ],
  },
  Pikachu: {
    id: 25,
    name: 'Pikachu',
    types: ['Electric'],
    hp: 140,
    moves: [
      { name: 'Thunderbolt', type: 'Electric', power: 90 },
      { name: 'Quick Attack', type: 'Normal', power: 40 },
      { name: 'Iron Tail', type: 'Steel', power: 100 },
    ],
  },
};

export const POKEMON_LIST = Object.values(SAMPLE_POKEMON);

