export type Species = {
  id: number;
  name: string;
  types: string[];
  gen: number;
  sprite?: string;
};

export type MethodLevel = { kind: 'level'; level: number };
export type MethodStone = { kind: 'stone'; item: string };
export type MethodTrade = { kind: 'trade'; item?: string };
export type MethodFriendship = { kind: 'friendship'; time?: 'day' | 'night' };
export type MethodLocation = { kind: 'location'; place: string };
export type MethodMove = { kind: 'move'; move: string };
export type MethodAffection = { kind: 'affection'; move?: string };
export type MethodTime = { kind: 'time'; time: 'day' | 'night' };
export type MethodWeather = { kind: 'weather'; weather: string };
export type MethodHeldItem = { kind: 'heldItem'; item: string };
export type MethodVersion = { kind: 'version'; version: string };
export type MethodSpecial = { kind: 'special'; hint: string };

export type Method =
  | MethodLevel
  | MethodStone
  | MethodTrade
  | MethodFriendship
  | MethodLocation
  | MethodMove
  | MethodAffection
  | MethodTime
  | MethodWeather
  | MethodHeldItem
  | MethodVersion
  | MethodSpecial;

export type Edge = {
  from: number;
  to: number;
  method: Method;
};

export type Family = {
  familyId: string;
  species: Species[];
  edges: Edge[];
};

export type EvoGraph = {
  families: Family[];
};

// Convenience normalized model returned by normalize()
export type NormalizedFamily = Family & {
  speciesById: Map<number, Species>;
  incoming: Map<number, Edge[]>;
  outgoing: Map<number, Edge[]>;
  bases: number[]; // species ids with no incoming edges
  isBranched: boolean; // true if any node has >1 outgoing
};

export type NormalizedEvoGraph = {
  families: NormalizedFamily[];
};

