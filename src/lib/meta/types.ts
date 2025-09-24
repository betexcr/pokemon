export type MoveUsage = {
  move: string;
  usage: number; // percentage 0-100
};

export type PokemonMeta = {
  id: number;
  name: string;
  usage: number; // percentage
  winrate: number; // percentage
  topMoves: MoveUsage[];
  topItem: string;
  topTeammate: string;
  trend?: { month: string; usage: number }[]; // optional last N months
};

export type MetaDataset = {
  format: 'OU' | 'VGC' | 'UU' | string;
  month: string; // YYYY-MM
  top: PokemonMeta[];
};

