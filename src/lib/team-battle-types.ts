import type { TypeName } from './damage-calculator';

export type WeatherKind = 'none' | 'sun' | 'rain' | 'sandstorm' | 'snow';
export type TerrainKind = 'none' | 'electric' | 'grassy' | 'misty' | 'psychic';

export type FieldWeather = {
  kind: WeatherKind;
  turns: number;
  source?: string;
};

export type FieldTerrain = {
  kind: TerrainKind;
  turns: number;
  source?: string;
};

export type FieldRooms = {
  trickRoom?: { turns: number };
  wonderRoom?: { turns: number };
  magicRoom?: { turns: number };
};

export type FieldSideScreens = {
  reflect?: { turns: number };
  lightScreen?: { turns: number };
  auroraVeil?: { turns: number };
  safeguard?: { turns: number };
  tailwind?: { turns: number };
};

export type SideHazards = {
  stealthRock: boolean;
  spikes: number; // 0-3
  toxicSpikes: number; // 0-2
  stickyWeb: boolean;
  gMaxVineLash?: { turns: number };
  gMaxWildfire?: { turns: number };
};

export type FieldState = {
  weather?: FieldWeather;
  terrain?: FieldTerrain;
  rooms?: FieldRooms;
  playerScreens?: FieldSideScreens;
  opponentScreens?: FieldSideScreens;
  other?: Record<string, unknown>;
};

export const EMPTY_HAZARDS: SideHazards = {
  stealthRock: false,
  spikes: 0,
  toxicSpikes: 0,
  stickyWeb: false,
};

export const createFieldState = (): FieldState => ({
  weather: undefined,
  terrain: undefined,
  rooms: {},
  playerScreens: {},
  opponentScreens: {},
  other: {},
});


