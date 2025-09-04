export type BattleTeam = {
  name: string;
  slots: Array<{ id: number; level: number }>;
};

export type Champion = {
  id: string;
  name: string;
  difficulty: 'normal'; // placeholder; selection will control AI difficulty externally
  team: BattleTeam;
};

// Minimal seed data. Extend with more champions and full rosters later
export const GYM_CHAMPIONS: Champion[] = [
  {
    id: 'brock-kanto',
    name: 'Brock (Kanto)',
    difficulty: 'normal',
    team: {
      name: 'Rock Solid',
      slots: [
        { id: 74, level: 12 }, // Geodude
        { id: 95, level: 14 }, // Onix
      ],
    },
  },
  {
    id: 'misty-kanto',
    name: 'Misty (Kanto)',
    difficulty: 'normal',
    team: {
      name: 'Water Pulse',
      slots: [
        { id: 120, level: 18 }, // Staryu
        { id: 121, level: 21 }, // Starmie
      ],
    },
  },
];
