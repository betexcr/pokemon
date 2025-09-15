export type Move = { 
  id: string; 
  pp: number; 
};

export type Pokemon = {
  species: string;
  level: number;
  types: string[];
  stats: { 
    hp: number; 
    atk: number; 
    def: number; 
    spa: number; 
    spd: number; 
    spe: number; 
  };
  item?: string;
  ability?: string;
  moves: Move[];
};

export type Team = Pokemon[];

export type BattleMeta = {
  createdAt: number;
  format: 'singles';
  ruleSet: 'gen9-no-weather';
  players: {
    p1: { uid: string };
    p2: { uid: string };
  };
  phase: 'choosing' | 'resolving' | 'ended';
  turn: number;
  deadlineAt: number;
  version: number;
  winnerUid?: string;
  endedReason?: 'forfeit' | 'timeout' | 'victory';
};

export type BattlePublic = {
  field: {
    hazards: {
      [uid: string]: { sr: boolean; spikes: number; tSpikes: number; web: boolean };
    };
    screens: {
      [uid: string]: { reflect: number; lightScreen: number };
    };
  };
  [uid: string]: {
    active: {
      species: string;
      level: number;
      types: string[];
      hp: { cur: number; max: number };
      status?: string;
      boosts: { atk: number; def: number; spa: number; spd: number; spe: number; acc: number; eva: number };
      itemKnown?: boolean;
      abilityKnown?: boolean;
      subHp?: number;
    };
    benchPublic: Array<{
      species: string;
      fainted: boolean;
      revealedMoves: string[];
    }>;
  } | any;
  lastResultSummary: string;
};

export type BattlePrivate = {
  team: Team;
  choiceLock?: {
    moveId?: string;
    target?: string;
    locked?: boolean;
  };
};

export type BattleChoice = {
  action: 'move' | 'switch' | 'forfeit';
  payload: {
    moveId?: string;
    target?: string;
    switchToIndex?: number;
  };
  committedAt: number;
  clientVersion: number;
};
