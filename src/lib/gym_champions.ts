export type BattleTeam = {
  name: string;
  slots: Array<{ id: number; level: number }>;
};

export type Champion = {
  id: string;
  name: string;
  generation: string; // e.g., "1st Generation", "2nd Generation", etc.
  team: BattleTeam;
};

// Gym Champions and Elite Four teams based on official game data
export const GYM_CHAMPIONS: Champion[] = [
  // Kanto Gym Leaders (1st Generation)
  {
    id: 'brock-kanto',
    name: 'Brock (Kanto)',
    generation: '1st Generation',
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
    generation: '1st Generation',
    team: {
      name: 'Water Pulse',
      slots: [
        { id: 120, level: 18 }, // Staryu
        { id: 121, level: 21 }, // Starmie
      ],
    },
  },
  {
    id: 'lt-surge-kanto',
    name: 'Lt. Surge (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Electric Shock',
      slots: [
        { id: 100, level: 21 }, // Voltorb
        { id: 25, level: 18 },  // Pikachu
        { id: 26, level: 24 },  // Raichu
      ],
    },
  },
  {
    id: 'erika-kanto',
    name: 'Erika (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Grass Garden',
      slots: [
        { id: 71, level: 29 },  // Victreebel
        { id: 114, level: 24 }, // Tangela
        { id: 45, level: 29 },  // Vileplume
      ],
    },
  },
  {
    id: 'koga-kanto',
    name: 'Koga (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Poison Master',
      slots: [
        { id: 109, level: 37 }, // Koffing
        { id: 89, level: 39 },  // Muk
        { id: 109, level: 37 }, // Koffing
        { id: 110, level: 43 }, // Weezing
      ],
    },
  },
  {
    id: 'sabrina-kanto',
    name: 'Sabrina (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Psychic Power',
      slots: [
        { id: 64, level: 38 },  // Kadabra
        { id: 122, level: 37 }, // Mr. Mime
        { id: 49, level: 38 },  // Venomoth
        { id: 65, level: 43 },  // Alakazam
      ],
    },
  },
  {
    id: 'blaine-kanto',
    name: 'Blaine (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Fire Blast',
      slots: [
        { id: 58, level: 42 },  // Growlithe
        { id: 77, level: 40 },  // Ponyta
        { id: 78, level: 42 },  // Rapidash
        { id: 59, level: 47 },  // Arcanine
      ],
    },
  },
  {
    id: 'giovanni-kanto',
    name: 'Giovanni (Kanto)',
    generation: '1st Generation',
    team: {
      name: 'Ground Force',
      slots: [
        { id: 111, level: 45 }, // Rhyhorn
        { id: 51, level: 42 },  // Dugtrio
        { id: 31, level: 44 },  // Nidoqueen
        { id: 34, level: 45 },  // Nidoking
        { id: 112, level: 50 }, // Rhydon
      ],
    },
  },
  
  // Elite Four (1st Generation)
  {
    id: 'lorelei-elite',
    name: 'Lorelei (Elite Four)',
    generation: '1st Generation',
    team: {
      name: 'Ice Queen',
      slots: [
        { id: 87, level: 54 },  // Dewgong
        { id: 91, level: 53 },  // Cloyster
        { id: 80, level: 54 },  // Slowbro
        { id: 124, level: 56 }, // Jynx
        { id: 131, level: 56 }, // Lapras
      ],
    },
  },
  {
    id: 'bruno-elite',
    name: 'Bruno (Elite Four)',
    generation: '1st Generation',
    team: {
      name: 'Fighting Spirit',
      slots: [
        { id: 95, level: 53 },  // Onix
        { id: 107, level: 55 }, // Hitmonchan
        { id: 106, level: 55 }, // Hitmonlee
        { id: 95, level: 56 },  // Onix
        { id: 68, level: 58 },  // Machamp
      ],
    },
  },
  {
    id: 'agatha-elite',
    name: 'Agatha (Elite Four)',
    generation: '1st Generation',
    team: {
      name: 'Ghost Master',
      slots: [
        { id: 94, level: 56 },  // Gengar
        { id: 42, level: 56 },  // Golbat
        { id: 93, level: 55 },  // Haunter
        { id: 24, level: 58 },  // Arbok
        { id: 94, level: 60 },  // Gengar
      ],
    },
  },
  {
    id: 'lance-elite',
    name: 'Lance (Elite Four)',
    generation: '1st Generation',
    team: {
      name: 'Dragon Master',
      slots: [
        { id: 130, level: 58 }, // Gyarados
        { id: 148, level: 56 }, // Dragonair
        { id: 148, level: 56 }, // Dragonair
        { id: 142, level: 60 }, // Aerodactyl
        { id: 149, level: 62 }, // Dragonite
      ],
    },
  },

  // Generation II - Johto Gym Leaders
  {
    id: 'falkner-johto',
    name: 'Falkner (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Flying Ace',
      slots: [
        { id: 16, level: 7 },   // Pidgey
        { id: 17, level: 9 },   // Pidgeotto
      ],
    },
  },
  {
    id: 'bugsy-johto',
    name: 'Bugsy (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Bug Swarm',
      slots: [
        { id: 11, level: 14 },  // Metapod
        { id: 14, level: 14 },  // Kakuna
        { id: 123, level: 16 }, // Scyther
      ],
    },
  },
  {
    id: 'whitney-johto',
    name: 'Whitney (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Normal Power',
      slots: [
        { id: 35, level: 18 },  // Clefairy
        { id: 241, level: 20 }, // Miltank
      ],
    },
  },
  {
    id: 'morty-johto',
    name: 'Morty (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Ghost Whisperer',
      slots: [
        { id: 92, level: 21 },  // Gastly
        { id: 93, level: 21 },  // Haunter
        { id: 94, level: 25 },  // Gengar
        { id: 93, level: 23 },  // Haunter
      ],
    },
  },
  {
    id: 'chuck-johto',
    name: 'Chuck (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Fighting Force',
      slots: [
        { id: 57, level: 27 },  // Primeape
        { id: 62, level: 30 },  // Poliwrath
      ],
    },
  },
  {
    id: 'jasmine-johto',
    name: 'Jasmine (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Steel Defense',
      slots: [
        { id: 81, level: 30 },  // Magnemite
        { id: 81, level: 30 },  // Magnemite
        { id: 208, level: 35 }, // Steelix
      ],
    },
  },
  {
    id: 'pryce-johto',
    name: 'Pryce (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Ice Storm',
      slots: [
        { id: 86, level: 27 },  // Seel
        { id: 87, level: 29 },  // Dewgong
        { id: 221, level: 31 }, // Piloswine
      ],
    },
  },
  {
    id: 'clair-johto',
    name: 'Clair (Johto)',
    generation: '2nd Generation',
    team: {
      name: 'Dragon Fury',
      slots: [
        { id: 148, level: 37 }, // Dragonair
        { id: 148, level: 37 }, // Dragonair
        { id: 148, level: 37 }, // Dragonair
        { id: 230, level: 40 }, // Kingdra
      ],
    },
  },

  // Generation II - Elite Four
  {
    id: 'will-elite-johto',
    name: 'Will (Elite Four)',
    generation: '2nd Generation',
    team: {
      name: 'Psychic Master',
      slots: [
        { id: 178, level: 40 }, // Xatu
        { id: 103, level: 41 }, // Exeggutor
        { id: 124, level: 41 }, // Jynx
        { id: 80, level: 41 },  // Slowbro
        { id: 178, level: 42 }, // Xatu
      ],
    },
  },
  {
    id: 'koga-elite-johto',
    name: 'Koga (Elite Four)',
    generation: '2nd Generation',
    team: {
      name: 'Poison Master',
      slots: [
        { id: 168, level: 40 }, // Ariados
        { id: 49, level: 41 },  // Venomoth
        { id: 205, level: 43 }, // Forretress
        { id: 89, level: 42 },  // Muk
        { id: 169, level: 44 }, // Crobat
      ],
    },
  },
  {
    id: 'bruno-elite-johto',
    name: 'Bruno (Elite Four)',
    generation: '2nd Generation',
    team: {
      name: 'Fighting Spirit',
      slots: [
        { id: 237, level: 42 }, // Hitmontop
        { id: 106, level: 42 }, // Hitmonlee
        { id: 107, level: 42 }, // Hitmonchan
        { id: 95, level: 43 },  // Onix
        { id: 68, level: 46 },  // Machamp
      ],
    },
  },
  {
    id: 'karen-elite-johto',
    name: 'Karen (Elite Four)',
    generation: '2nd Generation',
    team: {
      name: 'Dark Master',
      slots: [
        { id: 197, level: 42 }, // Umbreon
        { id: 45, level: 42 },  // Vileplume
        { id: 94, level: 45 },  // Gengar
        { id: 198, level: 44 }, // Murkrow
        { id: 229, level: 47 }, // Houndoom
      ],
    },
  },
  {
    id: 'lance-champion-johto',
    name: 'Lance (Champion)',
    generation: '2nd Generation',
    team: {
      name: 'Dragon Champion',
      slots: [
        { id: 130, level: 44 }, // Gyarados
        { id: 149, level: 47 }, // Dragonite
        { id: 149, level: 47 }, // Dragonite
        { id: 142, level: 46 }, // Aerodactyl
        { id: 6, level: 46 },   // Charizard
        { id: 149, level: 50 }, // Dragonite
      ],
    },
  },

  // Generation III - Hoenn Gym Leaders
  {
    id: 'roxanne-hoenn',
    name: 'Roxanne (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Rock Solid',
      slots: [
        { id: 74, level: 14 },  // Geodude
        { id: 74, level: 14 },  // Geodude
        { id: 299, level: 15 }, // Nosepass
      ],
    },
  },
  {
    id: 'brawly-hoenn',
    name: 'Brawly (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Fighting Force',
      slots: [
        { id: 66, level: 16 },  // Machop
        { id: 307, level: 16 }, // Meditite
        { id: 296, level: 19 }, // Makuhita
      ],
    },
  },
  {
    id: 'wattson-hoenn',
    name: 'Wattson (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Electric Shock',
      slots: [
        { id: 100, level: 20 }, // Voltorb
        { id: 309, level: 20 }, // Electrike
        { id: 82, level: 22 },  // Magneton
        { id: 310, level: 24 }, // Manectric
      ],
    },
  },
  {
    id: 'flannery-hoenn',
    name: 'Flannery (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Fire Blast',
      slots: [
        { id: 322, level: 24 }, // Numel
        { id: 218, level: 24 }, // Slugma
        { id: 218, level: 26 }, // Slugma
        { id: 324, level: 29 }, // Torkoal
      ],
    },
  },
  {
    id: 'norman-hoenn',
    name: 'Norman (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Normal Power',
      slots: [
        { id: 327, level: 27 }, // Spinda
        { id: 288, level: 27 }, // Vigoroth
        { id: 264, level: 29 }, // Linoone
        { id: 289, level: 31 }, // Slaking
      ],
    },
  },
  {
    id: 'winona-hoenn',
    name: 'Winona (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Flying Ace',
      slots: [
        { id: 277, level: 31 }, // Swellow
        { id: 279, level: 30 }, // Pelipper
        { id: 227, level: 32 }, // Skarmory
        { id: 334, level: 33 }, // Altaria
      ],
    },
  },
  {
    id: 'tate-liza-hoenn',
    name: 'Tate & Liza (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Psychic Power',
      slots: [
        { id: 344, level: 41 }, // Claydol
        { id: 178, level: 41 }, // Xatu
        { id: 337, level: 42 }, // Lunatone
        { id: 338, level: 42 }, // Solrock
      ],
    },
  },
  {
    id: 'wallace-hoenn',
    name: 'Wallace (Hoenn)',
    generation: '3rd Generation',
    team: {
      name: 'Water Master',
      slots: [
        { id: 370, level: 40 }, // Luvdisc
        { id: 340, level: 40 }, // Whiscash
        { id: 364, level: 42 }, // Sealeo
        { id: 119, level: 42 }, // Seaking
        { id: 350, level: 43 }, // Milotic
      ],
    },
  },

  // Generation III - Elite Four
  {
    id: 'sidney-elite-hoenn',
    name: 'Sidney (Elite Four)',
    generation: '3rd Generation',
    team: {
      name: 'Dark Master',
      slots: [
        { id: 262, level: 46 }, // Mightyena
        { id: 275, level: 48 }, // Shiftry
        { id: 332, level: 46 }, // Cacturne
        { id: 319, level: 48 }, // Sharpedo
        { id: 359, level: 49 }, // Absol
      ],
    },
  },
  {
    id: 'phoebe-elite-hoenn',
    name: 'Phoebe (Elite Four)',
    generation: '3rd Generation',
    team: {
      name: 'Ghost Master',
      slots: [
        { id: 356, level: 48 }, // Dusclops
        { id: 354, level: 49 }, // Banette
        { id: 354, level: 49 }, // Banette
        { id: 302, level: 50 }, // Sableye
        { id: 356, level: 51 }, // Dusclops
      ],
    },
  },
  {
    id: 'glacia-elite-hoenn',
    name: 'Glacia (Elite Four)',
    generation: '3rd Generation',
    team: {
      name: 'Ice Queen',
      slots: [
        { id: 364, level: 50 }, // Sealeo
        { id: 364, level: 50 }, // Sealeo
        { id: 362, level: 52 }, // Glalie
        { id: 362, level: 52 }, // Glalie
        { id: 365, level: 53 }, // Walrein
      ],
    },
  },
  {
    id: 'drake-elite-hoenn',
    name: 'Drake (Elite Four)',
    generation: '3rd Generation',
    team: {
      name: 'Dragon Master',
      slots: [
        { id: 372, level: 52 }, // Shelgon
        { id: 334, level: 54 }, // Altaria
        { id: 330, level: 53 }, // Flygon
        { id: 330, level: 53 }, // Flygon
        { id: 373, level: 55 }, // Salamence
      ],
    },
  },
  {
    id: 'steven-champion-hoenn',
    name: 'Steven (Champion)',
    generation: '3rd Generation',
    team: {
      name: 'Steel Champion',
      slots: [
        { id: 227, level: 57 }, // Skarmory
        { id: 344, level: 55 }, // Claydol
        { id: 306, level: 56 }, // Aggron
        { id: 346, level: 56 }, // Cradily
        { id: 348, level: 56 }, // Armaldo
        { id: 376, level: 58 }, // Metagross
      ],
    },
  },
];
