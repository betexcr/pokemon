// Pokémon API Types based on PokeAPI v2
export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface APIResource {
  url: string;
}

export interface NamedAPIResourceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface APIResourceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIResource[];
}

// Pokémon Types
export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  back_female: string | null;
  back_shiny_female: string | null;
  other: {
    dream_world: {
      front_default: string | null;
      front_female: string | null;
    };
    home: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonAbility {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonMove {
  move: NamedAPIResource;
  version_group_details: {
    level_learned_at: number;
    move_learn_method: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
}

// Basic Pokémon type for initial page load (minimal data)
export interface BasicPokemon {
  id: number;
  name: string;
  sprites: PokemonSprites;
  types: PokemonType[];
  height: number;
  weight: number;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  species: NamedAPIResource | null;
  evolution_chain: NamedAPIResource | null;
  // Make all Pokemon fields optional to be compatible
  base_experience?: number;
  is_default?: boolean;
  order?: number;
  forms?: NamedAPIResource[];
  game_indices?: unknown[];
  held_items?: unknown[];
  location_area_encounters?: string;
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  is_default: boolean;
  order: number;
  abilities: PokemonAbility[];
  forms: NamedAPIResource[];
  game_indices: {
    game_index: number;
    version: NamedAPIResource;
  }[];
  held_items: {
    item: NamedAPIResource;
    version_details: {
      rarity: number;
      version: NamedAPIResource;
    }[];
  }[];
  location_area_encounters: string;
  moves: PokemonMove[];
  sprites: PokemonSprites;
  species: NamedAPIResource;
  stats: PokemonStat[];
  types: PokemonType[];
}

// Type information
export interface Type {
  id: number;
  name: string;
  damage_relations: {
    double_damage_from: NamedAPIResource[];
    double_damage_to: NamedAPIResource[];
    half_damage_from: NamedAPIResource[];
    half_damage_to: NamedAPIResource[];
    no_damage_from: NamedAPIResource[];
    no_damage_to: NamedAPIResource[];
  };
  game_indices: {
    game_index: number;
    generation: NamedAPIResource;
  }[];
  generation: NamedAPIResource;
  move_damage_class: NamedAPIResource | null;
  names: {
    language: NamedAPIResource;
    name: string;
  }[];
  pokemon: {
    pokemon: NamedAPIResource;
    slot: number;
  }[];
  moves: NamedAPIResource[];
}

// Species information
export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: {
    entry_number: number;
    pokedex: NamedAPIResource;
  }[];
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource;
  evolves_from_species: NamedAPIResource | null;
  evolution_chain: {
    url: string;
  };
  habitat: NamedAPIResource | null;
  generation: NamedAPIResource;
  names: {
    name: string;
    language: NamedAPIResource;
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedAPIResource;
    version: NamedAPIResource;
  }[];
  form_descriptions: {
    description: string;
    language: NamedAPIResource;
  }[];
  genera: {
    genus: string;
    language: NamedAPIResource;
  }[];
  varieties: {
    is_default: boolean;
    pokemon: NamedAPIResource;
  }[];
}

// Evolution chain
export interface EvolutionDetail {
  item: NamedAPIResource | null;
  trigger: NamedAPIResource;
  gender: number | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  turn_upside_down: boolean;
}

export interface EvolutionChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: EvolutionChainLink;
}

// Move information
export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number;
  priority: number;
  power: number | null;
  contest_combos: {
    normal: {
      use_before: NamedAPIResource[];
      use_after: NamedAPIResource[];
    };
    super: {
      use_before: NamedAPIResource[];
      use_after: NamedAPIResource[];
    };
  } | null;
  contest_type: NamedAPIResource | null;
  contest_effect: NamedAPIResource | null;
  damage_class: NamedAPIResource;
  effect_entries: {
    effect: string;
    language: NamedAPIResource;
    short_effect: string;
  }[];
  effect_changes: {
    effect_entries: {
      effect: string;
      language: NamedAPIResource;
    }[];
    version_group: NamedAPIResource;
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
  generation: NamedAPIResource;
  machines: {
    machine: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
  meta: {
    ailment: NamedAPIResource;
    ailment_chance: number;
    category: NamedAPIResource;
    crit_rate: number;
    drain: number;
    flinch_chance: number;
    healing: number;
    max_hits: number | null;
    max_turns: number | null;
    min_hits: number | null;
    min_turns: number | null;
    stat_chance: number;
  };
  names: {
    language: NamedAPIResource;
    name: string;
  }[];
  past_values: {
    accuracy: number | null;
    effect_chance: number | null;
    effect_entries: {
      effect: string;
      language: NamedAPIResource;
    }[];
    power: number | null;
    pp: number | null;
    type: NamedAPIResource | null;
    version_group: NamedAPIResource;
  }[];
  stat_changes: {
    change: number;
    stat: NamedAPIResource;
  }[];
  super_contest_effect: NamedAPIResource | null;
  target: NamedAPIResource;
  type: NamedAPIResource;
}

// UI Types
export interface PokemonCard {
  id: number;
  name: string;
  image: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

export interface FilterState {
  search: string;
  types: string[];
  generation: string;
  sortBy: 'id' | 'name' | 'height' | 'weight';
  sortOrder: 'asc' | 'desc';
}

export interface PokemonComparison {
  pokemon1: Pokemon | null;
  pokemon2: Pokemon | null;
}

// Ability information
export interface Ability {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: NamedAPIResource;
  names: {
    name: string;
    language: NamedAPIResource;
  }[];
  effect_entries: {
    effect: string;
    short_effect: string;
    language: NamedAPIResource;
  }[];
  effect_changes: {
    effect_entries: {
      effect: string;
      language: NamedAPIResource;
    }[];
    version_group: NamedAPIResource;
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
  pokemon: {
    is_hidden: boolean;
    slot: number;
    pokemon: NamedAPIResource;
  }[];
}

// Item information
export interface Item {
  id: number;
  name: string;
  cost: number;
  fling_power: number | null;
  fling_effect: NamedAPIResource | null;
  attributes: NamedAPIResource[];
  category: NamedAPIResource;
  effect_entries: {
    effect: string;
    short_effect: string;
    language: NamedAPIResource;
  }[];
  flavor_text_entries: {
    text: string;
    version_group: NamedAPIResource;
    language: NamedAPIResource;
  }[];
  game_indices: {
    game_index: number;
    generation: NamedAPIResource;
  }[];
  names: {
    name: string;
    language: NamedAPIResource;
  }[];
  sprites: {
    default: string | null;
  };
  held_by_pokemon: {
    pokemon: NamedAPIResource;
    version_details: {
      rarity: number;
      version: NamedAPIResource;
    }[];
  }[];
  baby_trigger_for: NamedAPIResource | null;
  machines: {
    machine: NamedAPIResource;
    version_group: NamedAPIResource;
  }[];
}

// Location Area information
export interface LocationArea {
  id: number;
  name: string;
  game_index: number;
  encounter_method_rates: {
    encounter_method: NamedAPIResource;
    version_details: {
      rate: number;
      version: NamedAPIResource;
    }[];
  }[];
  location: NamedAPIResource;
  names: {
    name: string;
    language: NamedAPIResource;
  }[];
  pokemon_encounters: {
    pokemon: NamedAPIResource;
    version_details: {
      version: NamedAPIResource;
      max_chance: number;
      encounter_details: {
        min_level: number;
        max_level: number;
        condition_values: NamedAPIResource[];
        chance: number;
        method: NamedAPIResource;
      }[];
    }[];
  }[];
}

// Generation information
export interface Generation {
  id: number;
  name: string;
  abilities: NamedAPIResource[];
  names: {
    name: string;
    language: NamedAPIResource;
  }[];
  main_region: NamedAPIResource;
  moves: NamedAPIResource[];
  pokemon_species: NamedAPIResource[];
  types: NamedAPIResource[];
  version_groups: NamedAPIResource[];
}
