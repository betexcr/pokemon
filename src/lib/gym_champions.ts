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

  // ===== Generation IV - Sinnoh (placeholders; teams will be refined) =====
  { id: 'roark-sinnoh', name: 'Roark (Sinnoh)', generation: '4th Generation', team: { name: 'Oreburgh Leader', slots: [
    { id: 74, level: 12 }, // Geodude
    { id: 95, level: 12 }, // Onix
    { id: 408, level: 14 }, // Cranidos
  ] } },
  { id: 'gardenia-sinnoh', name: 'Gardenia (Sinnoh)', generation: '4th Generation', team: { name: 'Eterna Leader', slots: [
    { id: 420, level: 19 }, // Cherubi
    { id: 387, level: 19 }, // Turtwig
    { id: 407, level: 22 }, // Roserade
  ] } },
  { id: 'maylene-sinnoh', name: 'Maylene (Sinnoh)', generation: '4th Generation', team: { name: 'Veilstone Leader', slots: [
    { id: 307, level: 27 }, // Meditite
    { id: 67, level: 27 },  // Machoke
    { id: 448, level: 30 }, // Lucario
  ] } },
  { id: 'wake-sinnoh', name: 'Crasher Wake (Sinnoh)', generation: '4th Generation', team: { name: 'Pastoria Leader', slots: [
    { id: 130, level: 27 }, // Gyarados
    { id: 195, level: 27 }, // Quagsire
    { id: 419, level: 30 }, // Floatzel
  ] } },
  { id: 'fantina-sinnoh', name: 'Fantina (Sinnoh)', generation: '4th Generation', team: { name: 'Hearthome Leader', slots: [
    { id: 426, level: 24 }, // Drifblim
    { id: 94, level: 24 },  // Gengar
    { id: 429, level: 26 }, // Mismagius
  ] } },
  { id: 'byron-sinnoh', name: 'Byron (Sinnoh)', generation: '4th Generation', team: { name: 'Canalave Leader', slots: [
    { id: 436, level: 36 }, // Bronzor
    { id: 208, level: 36 }, // Steelix
    { id: 411, level: 39 }, // Bastiodon
  ] } },
  { id: 'candice-sinnoh', name: 'Candice (Sinnoh)', generation: '4th Generation', team: { name: 'Snowpoint Leader', slots: [
    { id: 459, level: 38 }, // Snover
    { id: 215, level: 38 }, // Sneasel
    { id: 308, level: 40 }, // Medicham
    { id: 460, level: 42 }, // Abomasnow
  ] } },
  { id: 'volkner-sinnoh', name: 'Volkner (Sinnoh)', generation: '4th Generation', team: { name: 'Sunyshore Leader', slots: [
    { id: 26, level: 46 },  // Raichu
    { id: 424, level: 47 }, // Ambipom
    { id: 224, level: 47 }, // Octillery
    { id: 405, level: 49 }, // Luxray
  ] } },
  { id: 'aaron-elite-sinnoh', name: 'Aaron (Elite Four)', generation: '4th Generation', team: { name: 'Bug Elite', slots: [
    { id: 269, level: 53 }, // Dustox
    { id: 267, level: 53 }, // Beautifly
    { id: 416, level: 54 }, // Vespiquen
    { id: 214, level: 54 }, // Heracross
    { id: 452, level: 57 }, // Drapion
  ] } },
  { id: 'bertha-elite-sinnoh', name: 'Bertha (Elite Four)', generation: '4th Generation', team: { name: 'Ground Elite', slots: [
    { id: 195, level: 55 }, // Quagsire
    { id: 340, level: 55 }, // Whiscash
    { id: 76, level: 56 },  // Golem
    { id: 185, level: 56 }, // Sudowoodo
    { id: 450, level: 59 }, // Hippowdon
  ] } },
  { id: 'flint-elite-sinnoh', name: 'Flint (Elite Four)', generation: '4th Generation', team: { name: 'Fire Elite', slots: [
    { id: 78, level: 58 },  // Rapidash
    { id: 208, level: 57 }, // Steelix
    { id: 426, level: 58 }, // Drifblim
    { id: 428, level: 57 }, // Lopunny
    { id: 392, level: 61 }, // Infernape
  ] } },
  { id: 'lucian-elite-sinnoh', name: 'Lucian (Elite Four)', generation: '4th Generation', team: { name: 'Psychic Elite', slots: [
    { id: 122, level: 59 }, // Mr. Mime
    { id: 203, level: 59 }, // Girafarig
    { id: 308, level: 60 }, // Medicham
    { id: 65, level: 60 },  // Alakazam
    { id: 437, level: 63 }, // Bronzong
  ] } },
  { id: 'cynthia-champion-sinnoh', name: 'Cynthia (Champion)', generation: '4th Generation', team: { name: 'Sinnoh Champion', slots: [
    { id: 442, level: 61 }, // Spiritomb
    { id: 407, level: 60 }, // Roserade
    { id: 423, level: 60 }, // Gastrodon
    { id: 448, level: 63 }, // Lucario
    { id: 350, level: 63 }, // Milotic
    { id: 445, level: 66 }, // Garchomp
  ] } },

  // ===== Generation V - Unova =====
  { id: 'cilan-unova', name: 'Cilan (Unova)', generation: '5th Generation', team: { name: 'Striaton (Grass)', slots: [
    { id: 506, level: 12 }, // Lillipup
    { id: 511, level: 14 }, // Pansage
  ] } },
  { id: 'chili-unova', name: 'Chili (Unova)', generation: '5th Generation', team: { name: 'Striaton (Fire)', slots: [
    { id: 506, level: 12 }, // Lillipup
    { id: 513, level: 14 }, // Pansear
  ] } },
  { id: 'cress-unova', name: 'Cress (Unova)', generation: '5th Generation', team: { name: 'Striaton (Water)', slots: [
    { id: 506, level: 12 }, // Lillipup
    { id: 515, level: 14 }, // Panpour
  ] } },
  { id: 'lenora-unova', name: 'Lenora (Unova)', generation: '5th Generation', team: { name: 'Nacrene Leader', slots: [
    { id: 507, level: 18 }, // Herdier
    { id: 505, level: 20 }, // Watchog
  ] } },
  { id: 'burgh-unova', name: 'Burgh (Unova)', generation: '5th Generation', team: { name: 'Castelia Leader', slots: [
    { id: 544, level: 21 }, // Whirlipede
    { id: 557, level: 21 }, // Dwebble
    { id: 542, level: 23 }, // Leavanny
  ] } },
  { id: 'elesa-unova', name: 'Elesa (Unova)', generation: '5th Generation', team: { name: 'Nimbasa Leader', slots: [
    { id: 587, level: 25 }, // Emolga
    { id: 587, level: 25 }, // Emolga
    { id: 523, level: 27 }, // Zebstrika
  ] } },
  { id: 'clay-unova', name: 'Clay (Unova)', generation: '5th Generation', team: { name: 'Driftveil Leader', slots: [
    { id: 552, level: 29 }, // Krokorok
    { id: 536, level: 29 }, // Palpitoad
    { id: 530, level: 31 }, // Excadrill
  ] } },
  { id: 'skyla-unova', name: 'Skyla (Unova)', generation: '5th Generation', team: { name: 'Mistralton Leader', slots: [
    { id: 528, level: 33 }, // Swoobat
    { id: 521, level: 33 }, // Unfezant
    { id: 581, level: 35 }, // Swanna
  ] } },
  { id: 'brycen-unova', name: 'Brycen (Unova)', generation: '5th Generation', team: { name: 'Icirrus Leader', slots: [
    { id: 583, level: 37 }, // Vanillish
    { id: 615, level: 37 }, // Cryogonal
    { id: 614, level: 39 }, // Beartic
  ] } },
  { id: 'drayden-unova', name: 'Drayden/Iris (Unova)', generation: '5th Generation', team: { name: 'Opelucid Leader', slots: [
    { id: 611, level: 41 }, // Fraxure
    { id: 621, level: 41 }, // Druddigon
    { id: 612, level: 43 }, // Haxorus
  ] } },
  { id: 'shauntal-elite-unova', name: 'Shauntal (Elite Four)', generation: '5th Generation', team: { name: 'Ghost Elite', slots: [
    { id: 563, level: 48 }, // Cofagrigus
    { id: 593, level: 48 }, // Jellicent
    { id: 623, level: 48 }, // Golurk
    { id: 609, level: 50 }, // Chandelure
  ] } },
  { id: 'grimsley-elite-unova', name: 'Grimsley (Elite Four)', generation: '5th Generation', team: { name: 'Dark Elite', slots: [
    { id: 560, level: 48 }, // Scrafty
    { id: 510, level: 48 }, // Liepard
    { id: 625, level: 50 }, // Bisharp
    { id: 553, level: 48 }, // Krookodile
  ] } },
  { id: 'caitlin-elite-unova', name: 'Caitlin (Elite Four)', generation: '5th Generation', team: { name: 'Psychic Elite', slots: [
    { id: 579, level: 48 }, // Reuniclus
    { id: 561, level: 48 }, // Sigilyph
    { id: 518, level: 48 }, // Musharna
    { id: 576, level: 50 }, // Gothitelle
  ] } },
  { id: 'marshal-elite-unova', name: 'Marshal (Elite Four)', generation: '5th Generation', team: { name: 'Fighting Elite', slots: [
    { id: 538, level: 48 }, // Throh
    { id: 539, level: 48 }, // Sawk
    { id: 534, level: 48 }, // Conkeldurr
    { id: 620, level: 50 }, // Mienshao
  ] } },
  { id: 'alder-champion-unova', name: 'Alder (Champion)', generation: '5th Generation', team: { name: 'Unova Champion', slots: [
    { id: 617, level: 75 }, // Accelgor
    { id: 626, level: 75 }, // Bouffalant
    { id: 589, level: 75 }, // Escavalier
    { id: 584, level: 75 }, // Vanilluxe
    { id: 621, level: 75 }, // Druddigon
    { id: 637, level: 77 }, // Volcarona
  ] } },
  { id: 'iris-champion-unova', name: 'Iris (Champion B2W2)', generation: '5th Generation', team: { name: 'B2W2 Champion', slots: [
    { id: 635, level: 57 }, // Hydreigon
    { id: 131, level: 57 }, // Lapras
    { id: 306, level: 57 }, // Aggron
    { id: 567, level: 57 }, // Archeops
    { id: 621, level: 57 }, // Druddigon
    { id: 612, level: 59 }, // Haxorus
  ] } },

  // ===== Generation VI - Kalos =====
  { id: 'viola-kalos', name: 'Viola (Kalos)', generation: '6th Generation', team: { name: 'Santalune Leader', slots: [
    { id: 283, level: 10 }, // Surskit
    { id: 666, level: 12 }, // Vivillon
  ] } },
  { id: 'grant-kalos', name: 'Grant (Kalos)', generation: '6th Generation', team: { name: 'Cyllage Leader', slots: [
    { id: 698, level: 25 }, // Amaura
    { id: 696, level: 25 }, // Tyrunt
  ] } },
  { id: 'korrina-kalos', name: 'Korrina (Kalos)', generation: '6th Generation', team: { name: 'Shalour Leader', slots: [
    { id: 619, level: 29 }, // Mienfoo
    { id: 67, level: 28 },  // Machoke
    { id: 701, level: 32 }, // Hawlucha
  ] } },
  { id: 'ramos-kalos', name: 'Ramos (Kalos)', generation: '6th Generation', team: { name: 'Coumarine Leader', slots: [
    { id: 189, level: 30 }, // Jumpluff
    { id: 70, level: 31 },  // Weepinbell
    { id: 673, level: 34 }, // Gogoat
  ] } },
  { id: 'clemont-kalos', name: 'Clemont (Kalos)', generation: '6th Generation', team: { name: 'Lumiose Leader', slots: [
    { id: 587, level: 35 }, // Emolga
    { id: 82, level: 35 },  // Magneton
    { id: 695, level: 37 }, // Heliolisk
  ] } },
  { id: 'valerie-kalos', name: 'Valerie (Kalos)', generation: '6th Generation', team: { name: 'Laverre Leader', slots: [
    { id: 303, level: 38 }, // Mawile
    { id: 122, level: 39 }, // Mr. Mime
    { id: 700, level: 42 }, // Sylveon
  ] } },
  { id: 'olympia-kalos', name: 'Olympia (Kalos)', generation: '6th Generation', team: { name: 'Anistar Leader', slots: [
    { id: 561, level: 44 }, // Sigilyph
    { id: 199, level: 45 }, // Slowking
    { id: 678, level: 48 }, // Meowstic
  ] } },
  { id: 'wulfric-kalos', name: 'Wulfric (Kalos)', generation: '6th Generation', team: { name: 'Snowbelle Leader', slots: [
    { id: 460, level: 56 }, // Abomasnow
    { id: 615, level: 55 }, // Cryogonal
    { id: 713, level: 59 }, // Avalugg
  ] } },
  { id: 'kalos-elite-malva', name: 'Malva (Elite Four)', generation: '6th Generation', team: { name: 'Fire Elite', slots: [
    { id: 668, level: 63 }, // Pyroar
    { id: 324, level: 63 }, // Torkoal
    { id: 609, level: 63 }, // Chandelure
    { id: 663, level: 65 }, // Talonflame
  ] } },
  { id: 'kalos-elite-siebold', name: 'Siebold (Elite Four)', generation: '6th Generation', team: { name: 'Water Elite', slots: [
    { id: 693, level: 63 }, // Clawitzer
    { id: 121, level: 63 }, // Starmie
    { id: 130, level: 63 }, // Gyarados
    { id: 689, level: 65 }, // Barbaracle
  ] } },
  { id: 'kalos-elite-wikstrom', name: 'Wikstrom (Elite Four)', generation: '6th Generation', team: { name: 'Steel Elite', slots: [
    { id: 707, level: 63 }, // Klefki
    { id: 476, level: 63 }, // Probopass
    { id: 212, level: 63 }, // Scizor
    { id: 681, level: 65 }, // Aegislash
  ] } },
  { id: 'kalos-elite-drasna', name: 'Drasna (Elite Four)', generation: '6th Generation', team: { name: 'Dragon Elite', slots: [
    { id: 691, level: 63 }, // Dragalge
    { id: 621, level: 63 }, // Druddigon
    { id: 334, level: 63 }, // Altaria
    { id: 715, level: 65 }, // Noivern
  ] } },
  { id: 'diantha-champion-kalos', name: 'Diantha (Champion)', generation: '6th Generation', team: { name: 'Kalos Champion', slots: [
    { id: 701, level: 64 }, // Hawlucha
    { id: 697, level: 65 }, // Tyrantrum
    { id: 699, level: 65 }, // Aurorus
    { id: 711, level: 65 }, // Gourgeist
    { id: 706, level: 66 }, // Goodra
    { id: 282, level: 68 }, // Gardevoir
  ] } },

  // ===== Generation VII - Alola =====
  { id: 'hala-alola', name: 'Hala (Kahuna)', generation: '7th Generation', team: { name: 'Melemele Kahuna', slots: [
    { id: 66, level: 14 },   // Machop
    { id: 296, level: 14 },  // Makuhita
    { id: 739, level: 15 },  // Crabrawler
  ] } },
  { id: 'olivia-alola', name: 'Olivia (Kahuna)', generation: '7th Generation', team: { name: 'Akala Kahuna', slots: [
    { id: 299, level: 26 },  // Nosepass
    { id: 525, level: 26 },  // Boldore
    { id: 745, level: 27 },  // Lycanroc
  ] } },
  { id: 'nanu-alola', name: 'Nanu (Kahuna)', generation: '7th Generation', team: { name: 'Ula’ula Kahuna', slots: [
    { id: 302, level: 38 },  // Sableye
    { id: 552, level: 37 },  // Krokorok
    { id: 53, level: 39 },   // Persian (Alolan form)
  ] } },
  { id: 'hapu-alola', name: 'Hapu (Kahuna)', generation: '7th Generation', team: { name: 'Poni Kahuna', slots: [
    { id: 623, level: 47 },  // Golurk
    { id: 423, level: 47 },  // Gastrodon
    { id: 750, level: 48 },  // Mudsdale
  ] } },
  { id: 'hala-elite-alola', name: 'Hala (Elite Four)', generation: '7th Generation', team: { name: 'Fighting Elite', slots: [
    { id: 297, level: 54 },  // Hariyama
    { id: 57, level: 54 },   // Primeape
    { id: 740, level: 55 },  // Crabominable
    { id: 62, level: 54 },   // Poliwrath
    { id: 760, level: 54 },  // Bewear
  ] } },
  { id: 'olivia-elite-alola', name: 'Olivia (Elite Four)', generation: '7th Generation', team: { name: 'Rock Elite', slots: [
    { id: 348, level: 54 },  // Armaldo
    { id: 369, level: 54 },  // Relicanth
    { id: 745, level: 55 },  // Lycanroc
    { id: 476, level: 54 },  // Probopass
    { id: 76, level: 54 },   // Golem (Alolan)
  ] } },
  { id: 'acerola-elite-alola', name: 'Acerola (Elite Four)', generation: '7th Generation', team: { name: 'Ghost Elite', slots: [
    { id: 302, level: 54 },  // Sableye
    { id: 426, level: 54 },  // Drifblim
    { id: 771, level: 55 },  // Palossand (note: Palossand is 770 in National Dex; USUM list uses 771 for Pyukumuku—using 770 here)
    { id: 478, level: 54 },  // Froslass
    { id: 781, level: 54 },  // Dhelmise
  ] } },
  { id: 'kahili-elite-alola', name: 'Kahili (Elite Four)', generation: '7th Generation', team: { name: 'Flying Elite', slots: [
    { id: 227, level: 54 },  // Skarmory
    { id: 630, level: 54 },  // Mandibuzz
    { id: 733, level: 55 },  // Toucannon
    { id: 741, level: 54 },  // Oricorio (Pom-Pom)
    { id: 169, level: 54 },  // Crobat
  ] } },
  { id: 'kukui-champion-alola', name: 'Kukui (Champion)', generation: '7th Generation', team: { name: 'Alola Champion', slots: [
    { id: 745, level: 57 },  // Lycanroc
    { id: 38, level: 56 },   // Ninetales (Alolan)
    { id: 628, level: 56 },  // Braviary
    { id: 462, level: 56 },  // Magnezone
    { id: 143, level: 56 },  // Snorlax
    { id: 724, level: 58 },  // Decidueye (starter placeholder)
  ] } },
  { id: 'hau-champion-alola', name: 'Hau (USUM Champion)', generation: '7th Generation', team: { name: 'USUM Champion', slots: [
    { id: 26, level: 53 },   // Raichu (Alolan)
    { id: 740, level: 53 },  // Crabominable
    { id: 715, level: 53 },  // Noivern
    { id: 128, level: 53 },  // Tauros
    { id: 136, level: 53 },  // Flareon
    { id: 724, level: 55 },  // Decidueye (starter placeholder)
  ] } },

  // ===== Generation VIII - Galar =====
  { id: 'milo-galar', name: 'Milo (Galar)', generation: '8th Generation', team: { name: 'Turf Field Leader', slots: [
    { id: 829, level: 19 }, // Gossifleur
    { id: 830, level: 20 }, // Eldegoss
  ] } },
  { id: 'nessa-galar', name: 'Nessa (Galar)', generation: '8th Generation', team: { name: 'Water Leader', slots: [
    { id: 118, level: 22 }, // Goldeen
    { id: 846, level: 23 }, // Arrokuda
    { id: 834, level: 24 }, // Drednaw
  ] } },
  { id: 'kabu-galar', name: 'Kabu (Galar)', generation: '8th Generation', team: { name: 'Fire Leader', slots: [
    { id: 38, level: 25 },  // Ninetales
    { id: 59, level: 25 },  // Arcanine
    { id: 851, level: 27 }, // Centiskorch
  ] } },
  { id: 'bea-galar', name: 'Bea (Galar)', generation: '8th Generation', team: { name: 'Fighting Leader', slots: [
    { id: 237, level: 34 }, // Hitmontop
    { id: 675, level: 34 }, // Pangoro
    { id: 865, level: 35 }, // Sirfetch’d
    { id: 68, level: 36 },  // Machamp
  ] } },
  { id: 'allister-galar', name: 'Allister (Galar)', generation: '8th Generation', team: { name: 'Ghost Leader', slots: [
    { id: 562, level: 34 }, // Yamask (Galar form)
    { id: 778, level: 34 }, // Mimikyu
    { id: 864, level: 35 }, // Cursola
    { id: 94, level: 36 },  // Gengar
  ] } },
  { id: 'opal-galar', name: 'Opal (Galar)', generation: '8th Generation', team: { name: 'Fairy Leader', slots: [
    { id: 110, level: 36 }, // Weezing (Galar)
    { id: 303, level: 36 }, // Mawile
    { id: 468, level: 37 }, // Togekiss
    { id: 869, level: 38 }, // Alcremie
  ] } },
  { id: 'gordie-galar', name: 'Gordie (Galar)', generation: '8th Generation', team: { name: 'Rock Leader', slots: [
    { id: 689, level: 40 }, // Barbaracle
    { id: 213, level: 40 }, // Shuckle
    { id: 874, level: 41 }, // Stonjourner
    { id: 839, level: 42 }, // Coalossal
  ] } },
  { id: 'melony-galar', name: 'Melony (Galar)', generation: '8th Generation', team: { name: 'Ice Leader', slots: [
    { id: 873, level: 40 }, // Frosmoth
    { id: 555, level: 40 }, // Darmanitan (Galar)
    { id: 875, level: 41 }, // Eiscue
    { id: 131, level: 42 }, // Lapras
  ] } },
  { id: 'piers-galar', name: 'Piers (Galar)', generation: '8th Generation', team: { name: 'Dark Leader', slots: [
    { id: 560, level: 44 }, // Scrafty
    { id: 687, level: 45 }, // Malamar
    { id: 435, level: 45 }, // Skuntank
    { id: 862, level: 46 }, // Obstagoon
  ] } },
  { id: 'raihan-galar', name: 'Raihan (Galar)', generation: '8th Generation', team: { name: 'Dragon Leader', slots: [
    { id: 526, level: 46 }, // Gigalith
    { id: 330, level: 47 }, // Flygon
    { id: 844, level: 46 }, // Sandaconda
    { id: 884, level: 48 }, // Duraludon
  ] } },
  { id: 'leon-champion-galar', name: 'Leon (Champion)', generation: '8th Generation', team: { name: 'Galar Champion', slots: [
    { id: 681, level: 62 }, // Aegislash
    { id: 612, level: 64 }, // Haxorus
    { id: 887, level: 62 }, // Dragapult
    { id: 537, level: 64 }, // Seismitoad
    { id: 464, level: 64 }, // Rhyperior
    { id: 6, level: 65 },   // Charizard
  ] } },

  // ===== Generation IX - Paldea =====
  { id: 'katy-paldea', name: 'Katy (Paldea)', generation: '9th Generation', team: { name: 'Bug Leader', slots: [
    { id: 919, level: 14 }, // Nymble
    { id: 917, level: 14 }, // Tarountula
    { id: 216, level: 15 }, // Teddiursa (Bug Tera)
  ] } },
  { id: 'brassius-paldea', name: 'Brassius (Paldea)', generation: '9th Generation', team: { name: 'Grass Leader', slots: [
    { id: 548, level: 16 }, // Petilil
    { id: 928, level: 16 }, // Smoliv
    { id: 185, level: 17 }, // Sudowoodo (Grass Tera)
  ] } },
  { id: 'iono-paldea', name: 'Iono (Paldea)', generation: '9th Generation', team: { name: 'Electric Leader', slots: [
    { id: 940, level: 23 }, // Wattrel
    { id: 939, level: 23 }, // Bellibolt
    { id: 404, level: 23 }, // Luxio
    { id: 429, level: 24 }, // Mismagius (Electric Tera)
  ] } },
  { id: 'kofu-paldea', name: 'Kofu (Paldea)', generation: '9th Generation', team: { name: 'Water Leader', slots: [
    { id: 976, level: 29 }, // Veluza
    { id: 961, level: 29 }, // Wugtrio
    { id: 740, level: 30 }, // Crabominable (Water Tera)
  ] } },
  { id: 'larry-paldea', name: 'Larry (Paldea)', generation: '9th Generation', team: { name: 'Normal Leader', slots: [
    { id: 775, level: 35 }, // Komala
    { id: 982, level: 35 }, // Dudunsparce
    { id: 398, level: 36 }, // Staraptor (Normal Tera)
  ] } },
  { id: 'ryme-paldea', name: 'Ryme (Paldea)', generation: '9th Generation', team: { name: 'Ghost Leader', slots: [
    { id: 354, level: 41 }, // Banette
    { id: 778, level: 41 }, // Mimikyu
    { id: 972, level: 41 }, // Houndstone
    { id: 849, level: 42 }, // Toxtricity (Amped, Ghost Tera)
  ] } },
  { id: 'tulip-paldea', name: 'Tulip (Paldea)', generation: '9th Generation', team: { name: 'Psychic Leader', slots: [
    { id: 981, level: 44 }, // Farigiraf
    { id: 282, level: 44 }, // Gardevoir
    { id: 956, level: 44 }, // Espathra
    { id: 671, level: 45 }, // Florges (Psychic Tera)
  ] } },
  { id: 'grusha-paldea', name: 'Grusha (Paldea)', generation: '9th Generation', team: { name: 'Ice Leader', slots: [
    { id: 873, level: 47 }, // Frosmoth
    { id: 614, level: 47 }, // Beartic
    { id: 975, level: 47 }, // Cetitan
    { id: 334, level: 48 }, // Altaria (Ice Tera)
  ] } },
  { id: 'geeta-champion-paldea', name: 'Geeta (Top Champion)', generation: '9th Generation', team: { name: 'Paldea Champion', slots: [
    { id: 956, level: 61 }, // Espathra
    { id: 713, level: 61 }, // Avalugg
    { id: 983, level: 61 }, // Kingambit
    { id: 976, level: 61 }, // Veluza
    { id: 673, level: 61 }, // Gogoat
    { id: 970, level: 62 }, // Glimmora
  ] } },
];
