export type DexEntry = {
  id: number; // National Dex ID
  name: string;
  gen: number; // 1..9
  types: string[]; // ["Water"], ["Grass","Poison"], ...
  sprite: string; // /sprites/1.png
};

export type ProgressState = {
  caught: Record<number, true>; // sparse map for compactness
  seen?: Record<number, true>;
  updatedAt: number; // epoch ms for conflict resolution
};

export type Snapshot = {
  id: string; // share id
  createdAt: number;
  totals: { caught: number; seen?: number; percent: number };
  gens: Record<number, { caught: number; total: number }>;
  selection?: number[]; // optional highlighted favorites
};

