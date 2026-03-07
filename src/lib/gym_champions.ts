export type BattleTeam = {
  name: string;
  slots: Array<{ id: number; level: number; name?: string }>;
};

export type Champion = {
  id: string;
  name: string;
  generation: string;
  description?: string;
  team: BattleTeam;
};

// Gym Champions and Elite Four teams based on official game data
export const GYM_CHAMPIONS: Champion[] = [
  // Kanto Gym Leaders (1st Generation)
  {
    id: 'brock-kanto',
    name: 'Brock (Kanto)',
    generation: '1st Generation',
    description: 'The rock-solid Pokemon Trainer from Pewter City. A reliable leader who aspires to become a top-notch Pokemon Breeder.',
    team: {
      name: 'Rock Solid',
      slots: [
        { id: 74, level: 12, name: 'Geodude' },
        { id: 95, level: 14, name: 'Onix' },
      ],
    },
  },
  {
    id: 'misty-kanto',
    name: 'Misty (Kanto)',
    generation: '1st Generation',
    description: 'The tomboyish mermaid of Cerulean City. Her water-type mastery makes her a formidable Gym Leader.',
    team: {
      name: 'Water Pulse',
      slots: [
        { id: 120, level: 18, name: 'Staryu' },
        { id: 121, level: 21, name: 'Starmie' },
      ],
    },
  },
  {
    id: 'lt-surge-kanto',
    name: 'Lt. Surge (Kanto)',
    generation: '1st Generation',
    description: 'The Lightning American. This former military man brings battlefield intensity to every Pokemon match.',
    team: {
      name: 'Electric Shock',
      slots: [
        { id: 100, level: 21, name: 'Voltorb' },
        { id: 25, level: 18, name: 'Pikachu' },
        { id: 26, level: 24, name: 'Raichu' },
      ],
    },
  },
  {
    id: 'erika-kanto',
    name: 'Erika (Kanto)',
    generation: '1st Generation',
    description: "The nature-loving princess of Celadon City. She's gentle with her Grass-type Pokemon but tough in battle.",
    team: {
      name: 'Grass Garden',
      slots: [
        { id: 71, level: 29, name: 'Victreebel' },
        { id: 114, level: 24, name: 'Tangela' },
        { id: 45, level: 29, name: 'Vileplume' },
      ],
    },
  },
  {
    id: 'koga-kanto',
    name: 'Koga (Kanto)',
    generation: '1st Generation',
    description: 'A ninja master who uses Poison-type Pokemon. His cunning strategies make him a dangerous opponent.',
    team: {
      name: 'Poison Master',
      slots: [
        { id: 109, level: 37, name: 'Koffing' },
        { id: 89, level: 39, name: 'Muk' },
        { id: 109, level: 37, name: 'Koffing' },
        { id: 110, level: 43, name: 'Weezing' },
      ],
    },
  },
  {
    id: 'sabrina-kanto',
    name: 'Sabrina (Kanto)',
    generation: '1st Generation',
    description: 'The master of Psychic-type Pokemon from Saffron City. Her powerful mind and cold demeanor unnerve challengers.',
    team: {
      name: 'Psychic Power',
      slots: [
        { id: 64, level: 38, name: 'Kadabra' },
        { id: 122, level: 37, name: 'Mr. Mime' },
        { id: 49, level: 38, name: 'Venomoth' },
        { id: 65, level: 43, name: 'Alakazam' },
      ],
    },
  },
  {
    id: 'blaine-kanto',
    name: 'Blaine (Kanto)',
    generation: '1st Generation',
    description: "The hotheaded quiz master of Cinnabar Island. His fiery passion burns as bright as his Fire-type Pokemon.",
    team: {
      name: 'Fire Blast',
      slots: [
        { id: 58, level: 42, name: 'Growlithe' },
        { id: 77, level: 40, name: 'Ponyta' },
        { id: 78, level: 42, name: 'Rapidash' },
        { id: 59, level: 47, name: 'Arcanine' },
      ],
    },
  },
  {
    id: 'giovanni-kanto',
    name: 'Giovanni (Kanto)',
    generation: '1st Generation',
    description: 'The boss of Team Rocket and Viridian City Gym Leader. A master of Ground-type Pokemon with ruthless ambition.',
    team: {
      name: 'Ground Force',
      slots: [
        { id: 111, level: 45, name: 'Rhyhorn' },
        { id: 51, level: 42, name: 'Dugtrio' },
        { id: 31, level: 44, name: 'Nidoqueen' },
        { id: 34, level: 45, name: 'Nidoking' },
        { id: 112, level: 50, name: 'Rhydon' },
      ],
    },
  },
  
  // Elite Four (1st Generation)
  {
    id: 'lorelei-elite',
    name: 'Lorelei (Elite Four)',
    generation: '1st Generation',
    description: 'An icy Elite Four member who specializes in Ice-type Pokemon. She hails from the Sevii Islands.',
    team: {
      name: 'Ice Queen',
      slots: [
        { id: 87, level: 54, name: 'Dewgong' },
        { id: 91, level: 53, name: 'Cloyster' },
        { id: 80, level: 54, name: 'Slowbro' },
        { id: 124, level: 56, name: 'Jynx' },
        { id: 131, level: 56, name: 'Lapras' },
      ],
    },
  },
  {
    id: 'bruno-elite',
    name: 'Bruno (Elite Four)',
    generation: '1st Generation',
    description: 'A powerful Elite Four member devoted to Fighting-type Pokemon. He trains with his Pokemon in the mountains.',
    team: {
      name: 'Fighting Spirit',
      slots: [
        { id: 95, level: 53, name: 'Onix' },
        { id: 107, level: 55, name: 'Hitmonchan' },
        { id: 106, level: 55, name: 'Hitmonlee' },
        { id: 95, level: 56, name: 'Onix' },
        { id: 68, level: 58, name: 'Machamp' },
      ],
    },
  },
  {
    id: 'agatha-elite',
    name: 'Agatha (Elite Four)',
    generation: '1st Generation',
    description: 'A senior Elite Four member and Ghost-type specialist. She was once a rival of Professor Oak.',
    team: {
      name: 'Ghost Master',
      slots: [
        { id: 94, level: 56, name: 'Gengar' },
        { id: 42, level: 56, name: 'Golbat' },
        { id: 93, level: 55, name: 'Haunter' },
        { id: 24, level: 58, name: 'Arbok' },
        { id: 94, level: 60, name: 'Gengar' },
      ],
    },
  },
  {
    id: 'lance-elite',
    name: 'Lance (Elite Four)',
    generation: '1st Generation',
    description: 'The Dragon Master and leader of the Elite Four. His Dragonite is legendary among Pokemon Trainers.',
    team: {
      name: 'Dragon Master',
      slots: [
        { id: 130, level: 58, name: 'Gyarados' },
        { id: 148, level: 56, name: 'Dragonair' },
        { id: 148, level: 56, name: 'Dragonair' },
        { id: 142, level: 60, name: 'Aerodactyl' },
        { id: 149, level: 62, name: 'Dragonite' },
      ],
    },
  },

  // Generation II - Johto Gym Leaders
  {
    id: 'falkner-johto',
    name: 'Falkner (Johto)',
    generation: '2nd Generation',
    description: "The elegant master of Flying-type Pokemon. He follows in his father's footsteps as Violet City's Gym Leader.",
    team: {
      name: 'Flying Ace',
      slots: [
        { id: 16, level: 7, name: 'Pidgey' },
        { id: 17, level: 9, name: 'Pidgeotto' },
      ],
    },
  },
  {
    id: 'bugsy-johto',
    name: 'Bugsy (Johto)',
    generation: '2nd Generation',
    description: "A Bug-type specialist and Azalea Town Gym Leader. Despite his young age, he's an expert on Bug Pokemon.",
    team: {
      name: 'Bug Swarm',
      slots: [
        { id: 11, level: 14, name: 'Metapod' },
        { id: 14, level: 14, name: 'Kakuna' },
        { id: 123, level: 16, name: 'Scyther' },
      ],
    },
  },
  {
    id: 'whitney-johto',
    name: 'Whitney (Johto)',
    generation: '2nd Generation',
    description: "Goldenrod City's incredibly popular Gym Leader. Her Miltank's Rollout has made many challengers cry.",
    team: {
      name: 'Normal Power',
      slots: [
        { id: 35, level: 18, name: 'Clefairy' },
        { id: 241, level: 20, name: 'Miltank' },
      ],
    },
  },
  {
    id: 'morty-johto',
    name: 'Morty (Johto)',
    generation: '2nd Generation',
    description: 'The mystic seer of Ecruteak City. He uses Ghost-type Pokemon and dreams of seeing the legendary Ho-Oh.',
    team: {
      name: 'Ghost Whisperer',
      slots: [
        { id: 92, level: 21, name: 'Gastly' },
        { id: 93, level: 21, name: 'Haunter' },
        { id: 94, level: 25, name: 'Gengar' },
        { id: 93, level: 23, name: 'Haunter' },
      ],
    },
  },
  {
    id: 'chuck-johto',
    name: 'Chuck (Johto)',
    generation: '2nd Generation',
    description: 'The Fighting-type master of Cianwood City. He trains his body and mind under powerful waterfalls.',
    team: {
      name: 'Fighting Force',
      slots: [
        { id: 57, level: 27, name: 'Primeape' },
        { id: 62, level: 30, name: 'Poliwrath' },
      ],
    },
  },
  {
    id: 'jasmine-johto',
    name: 'Jasmine (Johto)',
    generation: '2nd Generation',
    description: "The Steel-clad defense girl of Olivine City. Gentle and shy, but her steel resolve shines in battle.",
    team: {
      name: 'Steel Defense',
      slots: [
        { id: 81, level: 30, name: 'Magnemite' },
        { id: 81, level: 30, name: 'Magnemite' },
        { id: 208, level: 35, name: 'Steelix' },
      ],
    },
  },
  {
    id: 'pryce-johto',
    name: 'Pryce (Johto)',
    generation: '2nd Generation',
    description: 'The wise elder of Mahogany Town. Decades of experience have made him a formidable Ice-type expert.',
    team: {
      name: 'Ice Storm',
      slots: [
        { id: 86, level: 27, name: 'Seel' },
        { id: 87, level: 29, name: 'Dewgong' },
        { id: 221, level: 31, name: 'Piloswine' },
      ],
    },
  },
  {
    id: 'clair-johto',
    name: 'Clair (Johto)',
    generation: '2nd Generation',
    description: "The blessed user of Dragon-type Pokemon. As Blackthorn City Gym Leader, she's proud and fiercely competitive.",
    team: {
      name: 'Dragon Fury',
      slots: [
        { id: 148, level: 37, name: 'Dragonair' },
        { id: 148, level: 37, name: 'Dragonair' },
        { id: 148, level: 37, name: 'Dragonair' },
        { id: 230, level: 40, name: 'Kingdra' },
      ],
    },
  },

  // Generation II - Elite Four
  {
    id: 'will-elite-johto',
    name: 'Will (Elite Four)',
    generation: '2nd Generation',
    description: "The Psychic-type expert of the Johto Elite Four. He's known for his elegant battle style and sharp mind.",
    team: {
      name: 'Psychic Master',
      slots: [
        { id: 178, level: 40, name: 'Xatu' },
        { id: 103, level: 41, name: 'Exeggutor' },
        { id: 124, level: 41, name: 'Jynx' },
        { id: 80, level: 41, name: 'Slowbro' },
        { id: 178, level: 42, name: 'Xatu' },
      ],
    },
  },
  {
    id: 'koga-elite-johto',
    name: 'Koga (Elite Four)',
    generation: '2nd Generation',
    description: 'Now an Elite Four member, this former Gym Leader brings ninja tactics and Poison-type mastery.',
    team: {
      name: 'Poison Master',
      slots: [
        { id: 168, level: 40, name: 'Ariados' },
        { id: 49, level: 41, name: 'Venomoth' },
        { id: 205, level: 43, name: 'Forretress' },
        { id: 89, level: 42, name: 'Muk' },
        { id: 169, level: 44, name: 'Crobat' },
      ],
    },
  },
  {
    id: 'bruno-elite-johto',
    name: 'Bruno (Elite Four)',
    generation: '2nd Generation',
    description: 'The Fighting-type specialist returns in the Johto Elite Four with an even stronger team.',
    team: {
      name: 'Fighting Spirit',
      slots: [
        { id: 237, level: 42, name: 'Hitmontop' },
        { id: 106, level: 42, name: 'Hitmonlee' },
        { id: 107, level: 42, name: 'Hitmonchan' },
        { id: 95, level: 43, name: 'Onix' },
        { id: 68, level: 46, name: 'Machamp' },
      ],
    },
  },
  {
    id: 'karen-elite-johto',
    name: 'Karen (Elite Four)',
    generation: '2nd Generation',
    description: 'The Dark-type master of the Elite Four. She believes truly strong Trainers win with their favorites.',
    team: {
      name: 'Dark Master',
      slots: [
        { id: 197, level: 42, name: 'Umbreon' },
        { id: 45, level: 42, name: 'Vileplume' },
        { id: 94, level: 45, name: 'Gengar' },
        { id: 198, level: 44, name: 'Murkrow' },
        { id: 229, level: 47, name: 'Houndoom' },
      ],
    },
  },
  {
    id: 'lance-champion-johto',
    name: 'Lance (Champion)',
    generation: '2nd Generation',
    description: 'The supreme Dragon Master and Johto Champion. Widely regarded as one of the strongest Trainers alive.',
    team: {
      name: 'Dragon Champion',
      slots: [
        { id: 130, level: 44, name: 'Gyarados' },
        { id: 149, level: 47, name: 'Dragonite' },
        { id: 149, level: 47, name: 'Dragonite' },
        { id: 142, level: 46, name: 'Aerodactyl' },
        { id: 6, level: 46, name: 'Charizard' },
        { id: 149, level: 50, name: 'Dragonite' },
      ],
    },
  },

  // Generation III - Hoenn Gym Leaders
  {
    id: 'roxanne-hoenn',
    name: 'Roxanne (Hoenn)',
    generation: '3rd Generation',
    description: 'A studious Rock-type expert and Rustboro City Gym Leader. She balances her love of learning with Pokemon training.',
    team: {
      name: 'Rock Solid',
      slots: [
        { id: 74, level: 14, name: 'Geodude' },
        { id: 74, level: 14, name: 'Geodude' },
        { id: 299, level: 15, name: 'Nosepass' },
      ],
    },
  },
  {
    id: 'brawly-hoenn',
    name: 'Brawly (Hoenn)',
    generation: '3rd Generation',
    description: 'The big wave surfing Fighting-type Gym Leader of Dewford Town. His relaxed attitude hides fierce battling skills.',
    team: {
      name: 'Fighting Force',
      slots: [
        { id: 66, level: 16, name: 'Machop' },
        { id: 307, level: 16, name: 'Meditite' },
        { id: 296, level: 19, name: 'Makuhita' },
      ],
    },
  },
  {
    id: 'wattson-hoenn',
    name: 'Wattson (Hoenn)',
    generation: '3rd Generation',
    description: 'The jovial Electric-type Gym Leader of Mauville City. His boisterous laughter echoes through every battle.',
    team: {
      name: 'Electric Shock',
      slots: [
        { id: 100, level: 20, name: 'Voltorb' },
        { id: 309, level: 20, name: 'Electrike' },
        { id: 82, level: 22, name: 'Magneton' },
        { id: 310, level: 24, name: 'Manectric' },
      ],
    },
  },
  {
    id: 'flannery-hoenn',
    name: 'Flannery (Hoenn)',
    generation: '3rd Generation',
    description: 'The fiery Gym Leader of Lavaridge Town. She inherited the role from her grandfather and burns with passion.',
    team: {
      name: 'Fire Blast',
      slots: [
        { id: 322, level: 24, name: 'Numel' },
        { id: 218, level: 24, name: 'Slugma' },
        { id: 218, level: 26, name: 'Slugma' },
        { id: 324, level: 29, name: 'Torkoal' },
      ],
    },
  },
  {
    id: 'norman-hoenn',
    name: 'Norman (Hoenn)',
    generation: '3rd Generation',
    description: "The dependable Normal-type Gym Leader of Petalburg City. He's also the player's father in the Hoenn games.",
    team: {
      name: 'Normal Power',
      slots: [
        { id: 327, level: 27, name: 'Spinda' },
        { id: 288, level: 27, name: 'Vigoroth' },
        { id: 264, level: 29, name: 'Linoone' },
        { id: 289, level: 31, name: 'Slaking' },
      ],
    },
  },
  {
    id: 'winona-hoenn',
    name: 'Winona (Hoenn)',
    generation: '3rd Generation',
    description: 'The graceful Flying-type Gym Leader of Fortree City. She soars above opponents with elegant aerial strategies.',
    team: {
      name: 'Flying Ace',
      slots: [
        { id: 277, level: 31, name: 'Swellow' },
        { id: 279, level: 30, name: 'Pelipper' },
        { id: 227, level: 32, name: 'Skarmory' },
        { id: 334, level: 33, name: 'Altaria' },
      ],
    },
  },
  {
    id: 'tate-liza-hoenn',
    name: 'Tate & Liza (Hoenn)',
    generation: '3rd Generation',
    description: 'The twin Psychic-type Gym Leaders of Mossdeep City. Their telepathic bond makes them devastating in Double Battles.',
    team: {
      name: 'Psychic Power',
      slots: [
        { id: 344, level: 41, name: 'Claydol' },
        { id: 178, level: 41, name: 'Xatu' },
        { id: 337, level: 42, name: 'Lunatone' },
        { id: 338, level: 42, name: 'Solrock' },
      ],
    },
  },
  {
    id: 'wallace-hoenn',
    name: 'Wallace (Hoenn)',
    generation: '3rd Generation',
    description: 'The artistic Water-type Gym Leader of Sootopolis City. A Contest Master as graceful as his Pokemon.',
    team: {
      name: 'Water Master',
      slots: [
        { id: 370, level: 40, name: 'Luvdisc' },
        { id: 340, level: 40, name: 'Whiscash' },
        { id: 364, level: 42, name: 'Sealeo' },
        { id: 119, level: 42, name: 'Seaking' },
        { id: 350, level: 43, name: 'Milotic' },
      ],
    },
  },

  // Generation III - Elite Four
  {
    id: 'sidney-elite-hoenn',
    name: 'Sidney (Elite Four)',
    generation: '3rd Generation',
    description: 'The laid-back Dark-type specialist of the Hoenn Elite Four. He respects any Trainer bold enough to challenge him.',
    team: {
      name: 'Dark Master',
      slots: [
        { id: 262, level: 46, name: 'Mightyena' },
        { id: 275, level: 48, name: 'Shiftry' },
        { id: 332, level: 46, name: 'Cacturne' },
        { id: 319, level: 48, name: 'Sharpedo' },
        { id: 359, level: 49, name: 'Absol' },
      ],
    },
  },
  {
    id: 'phoebe-elite-hoenn',
    name: 'Phoebe (Elite Four)',
    generation: '3rd Generation',
    description: 'The cheerful Ghost-type expert of the Hoenn Elite Four. She trained on Mt. Pyre among spirits.',
    team: {
      name: 'Ghost Master',
      slots: [
        { id: 356, level: 48, name: 'Dusclops' },
        { id: 354, level: 49, name: 'Banette' },
        { id: 354, level: 49, name: 'Banette' },
        { id: 302, level: 50, name: 'Sableye' },
        { id: 356, level: 51, name: 'Dusclops' },
      ],
    },
  },
  {
    id: 'glacia-elite-hoenn',
    name: 'Glacia (Elite Four)',
    generation: '3rd Generation',
    description: 'The icy-cool Ice-type specialist of the Hoenn Elite Four. She traveled from a distant land to find worthy opponents.',
    team: {
      name: 'Ice Queen',
      slots: [
        { id: 364, level: 50, name: 'Sealeo' },
        { id: 364, level: 50, name: 'Sealeo' },
        { id: 362, level: 52, name: 'Glalie' },
        { id: 362, level: 52, name: 'Glalie' },
        { id: 365, level: 53, name: 'Walrein' },
      ],
    },
  },
  {
    id: 'drake-elite-hoenn',
    name: 'Drake (Elite Four)',
    generation: '3rd Generation',
    description: 'The seasoned Dragon-type master of the Hoenn Elite Four. A former sea captain with decades of battle experience.',
    team: {
      name: 'Dragon Master',
      slots: [
        { id: 372, level: 52, name: 'Shelgon' },
        { id: 334, level: 54, name: 'Altaria' },
        { id: 330, level: 53, name: 'Flygon' },
        { id: 330, level: 53, name: 'Flygon' },
        { id: 373, level: 55, name: 'Salamence' },
      ],
    },
  },
  {
    id: 'steven-champion-hoenn',
    name: 'Steven (Champion)',
    generation: '3rd Generation',
    description: "The Steel-type Champion of Hoenn and son of Devon Corporation's president. A rare stone collector and powerful Trainer.",
    team: {
      name: 'Steel Champion',
      slots: [
        { id: 227, level: 57, name: 'Skarmory' },
        { id: 344, level: 55, name: 'Claydol' },
        { id: 306, level: 56, name: 'Aggron' },
        { id: 346, level: 56, name: 'Cradily' },
        { id: 348, level: 56, name: 'Armaldo' },
        { id: 376, level: 58, name: 'Metagross' },
      ],
    },
  },

  // ===== Generation IV - Sinnoh (placeholders; teams will be refined) =====
  {
    id: 'roark-sinnoh',
    name: 'Roark (Sinnoh)',
    generation: '4th Generation',
    description: "The Oreburgh City Gym Leader and mining enthusiast. He followed his father Byron's footsteps into Rock-type mastery.",
    team: {
      name: 'Oreburgh Leader',
      slots: [
        { id: 74, level: 12, name: 'Geodude' },
        { id: 95, level: 12, name: 'Onix' },
        { id: 408, level: 14, name: 'Cranidos' },
      ],
    },
  },
  {
    id: 'gardenia-sinnoh',
    name: 'Gardenia (Sinnoh)',
    generation: '4th Generation',
    description: 'The cheerful Grass-type Gym Leader of Eterna City. She loves nature but has an irrational fear of Ghost-types.',
    team: {
      name: 'Eterna Leader',
      slots: [
        { id: 420, level: 19, name: 'Cherubi' },
        { id: 387, level: 19, name: 'Turtwig' },
        { id: 407, level: 22, name: 'Roserade' },
      ],
    },
  },
  {
    id: 'maylene-sinnoh',
    name: 'Maylene (Sinnoh)',
    generation: '4th Generation',
    description: "The barefoot Fighting-type Gym Leader of Veilstone City. Despite her youth, she's a dedicated martial artist.",
    team: {
      name: 'Veilstone Leader',
      slots: [
        { id: 307, level: 27, name: 'Meditite' },
        { id: 67, level: 27, name: 'Machoke' },
        { id: 448, level: 30, name: 'Lucario' },
      ],
    },
  },
  {
    id: 'wake-sinnoh',
    name: 'Crasher Wake (Sinnoh)',
    generation: '4th Generation',
    description: 'The larger-than-life Water-type Gym Leader of Pastoria City. This masked wrestler brings showmanship to every battle.',
    team: {
      name: 'Pastoria Leader',
      slots: [
        { id: 130, level: 27, name: 'Gyarados' },
        { id: 195, level: 27, name: 'Quagsire' },
        { id: 419, level: 30, name: 'Floatzel' },
      ],
    },
  },
  {
    id: 'fantina-sinnoh',
    name: 'Fantina (Sinnoh)',
    generation: '4th Generation',
    description: 'The glamorous Ghost-type Gym Leader of Hearthome City. A Contest star with a distinctive foreign accent.',
    team: {
      name: 'Hearthome Leader',
      slots: [
        { id: 426, level: 24, name: 'Drifblim' },
        { id: 94, level: 24, name: 'Gengar' },
        { id: 429, level: 26, name: 'Mismagius' },
      ],
    },
  },
  {
    id: 'byron-sinnoh',
    name: 'Byron (Sinnoh)',
    generation: '4th Generation',
    description: "The iron-willed Steel-type Gym Leader of Canalave City. Roark's father and a dedicated excavator of fossils.",
    team: {
      name: 'Canalave Leader',
      slots: [
        { id: 436, level: 36, name: 'Bronzor' },
        { id: 208, level: 36, name: 'Steelix' },
        { id: 411, level: 39, name: 'Bastiodon' },
      ],
    },
  },
  {
    id: 'candice-sinnoh',
    name: 'Candice (Sinnoh)',
    generation: '4th Generation',
    description: 'The energetic Ice-type Gym Leader of Snowpoint City. Her upbeat personality belies her fierce battling skills.',
    team: {
      name: 'Snowpoint Leader',
      slots: [
        { id: 459, level: 38, name: 'Snover' },
        { id: 215, level: 38, name: 'Sneasel' },
        { id: 308, level: 40, name: 'Medicham' },
        { id: 460, level: 42, name: 'Abomasnow' },
      ],
    },
  },
  {
    id: 'volkner-sinnoh',
    name: 'Volkner (Sinnoh)',
    generation: '4th Generation',
    description: 'The strongest Gym Leader in Sinnoh, using Electric-type Pokemon. He was bored until a worthy challenger arrived.',
    team: {
      name: 'Sunyshore Leader',
      slots: [
        { id: 26, level: 46, name: 'Raichu' },
        { id: 424, level: 47, name: 'Ambipom' },
        { id: 224, level: 47, name: 'Octillery' },
        { id: 405, level: 49, name: 'Luxray' },
      ],
    },
  },
  {
    id: 'aaron-elite-sinnoh',
    name: 'Aaron (Elite Four)',
    generation: '4th Generation',
    description: 'The Bug-type specialist of the Sinnoh Elite Four. He has a deep bond with his Bug Pokemon.',
    team: {
      name: 'Bug Elite',
      slots: [
        { id: 269, level: 53, name: 'Dustox' },
        { id: 267, level: 53, name: 'Beautifly' },
        { id: 416, level: 54, name: 'Vespiquen' },
        { id: 214, level: 54, name: 'Heracross' },
        { id: 452, level: 57, name: 'Drapion' },
      ],
    },
  },
  {
    id: 'bertha-elite-sinnoh',
    name: 'Bertha (Elite Four)',
    generation: '4th Generation',
    description: 'The Ground-type master of the Sinnoh Elite Four. A wise elder who has trained Pokemon for decades.',
    team: {
      name: 'Ground Elite',
      slots: [
        { id: 195, level: 55, name: 'Quagsire' },
        { id: 340, level: 55, name: 'Whiscash' },
        { id: 76, level: 56, name: 'Golem' },
        { id: 185, level: 56, name: 'Sudowoodo' },
        { id: 450, level: 59, name: 'Hippowdon' },
      ],
    },
  },
  {
    id: 'flint-elite-sinnoh',
    name: 'Flint (Elite Four)',
    generation: '4th Generation',
    description: "The fiery-spirited Fire-type expert of the Sinnoh Elite Four. Volkner's close friend and a passionate battler.",
    team: {
      name: 'Fire Elite',
      slots: [
        { id: 78, level: 58, name: 'Rapidash' },
        { id: 208, level: 57, name: 'Steelix' },
        { id: 426, level: 58, name: 'Drifblim' },
        { id: 428, level: 57, name: 'Lopunny' },
        { id: 392, level: 61, name: 'Infernape' },
      ],
    },
  },
  {
    id: 'lucian-elite-sinnoh',
    name: 'Lucian (Elite Four)',
    generation: '4th Generation',
    description: 'The intellectual Psychic-type specialist of the Sinnoh Elite Four. An avid reader who battles with calm precision.',
    team: {
      name: 'Psychic Elite',
      slots: [
        { id: 122, level: 59, name: 'Mr. Mime' },
        { id: 203, level: 59, name: 'Girafarig' },
        { id: 308, level: 60, name: 'Medicham' },
        { id: 65, level: 60, name: 'Alakazam' },
        { id: 437, level: 63, name: 'Bronzong' },
      ],
    },
  },
  {
    id: 'cynthia-champion-sinnoh',
    name: 'Cynthia (Champion)',
    generation: '4th Generation',
    description: 'The beloved Champion of Sinnoh. Her Garchomp is feared across the world, making her one of the strongest Champions ever.',
    team: {
      name: 'Sinnoh Champion',
      slots: [
        { id: 442, level: 61, name: 'Spiritomb' },
        { id: 407, level: 60, name: 'Roserade' },
        { id: 423, level: 60, name: 'Gastrodon' },
        { id: 448, level: 63, name: 'Lucario' },
        { id: 350, level: 63, name: 'Milotic' },
        { id: 445, level: 66, name: 'Garchomp' },
      ],
    },
  },

  // ===== Generation V - Unova =====
  { id: 'cilan-unova', name: 'Cilan (Unova)', generation: '5th Generation', description: 'One of the Striaton City triplet Gym Leaders specializing in Grass-type Pokemon. A refined Pokemon Connoisseur.', team: { name: 'Striaton (Grass)', slots: [
    { id: 506, level: 12, name: 'Lillipup' },
    { id: 511, level: 14, name: 'Pansage' },
  ] } },
  { id: 'chili-unova', name: 'Chili (Unova)', generation: '5th Generation', description: "The fiery triplet brother of Striaton City. His hotheaded nature matches his Fire-type specialty.", team: { name: 'Striaton (Fire)', slots: [
    { id: 506, level: 12, name: 'Lillipup' },
    { id: 513, level: 14, name: 'Pansear' },
  ] } },
  { id: 'cress-unova', name: 'Cress (Unova)', generation: '5th Generation', description: "The cool and collected Water-type triplet of Striaton City. He approaches battle with elegant composure.", team: { name: 'Striaton (Water)', slots: [
    { id: 506, level: 12, name: 'Lillipup' },
    { id: 515, level: 14, name: 'Panpour' },
  ] } },
  { id: 'lenora-unova', name: 'Lenora (Unova)', generation: '5th Generation', description: "The Normal-type Gym Leader of Nacrene City and museum director. A formidable archaeologist and battler.", team: { name: 'Nacrene Leader', slots: [
    { id: 507, level: 18, name: 'Herdier' },
    { id: 505, level: 20, name: 'Watchog' },
  ] } },
  { id: 'burgh-unova', name: 'Burgh (Unova)', generation: '5th Generation', description: "The Bug-type Gym Leader of Castelia City. A famous artist who finds creative inspiration in his Pokemon.", team: { name: 'Castelia Leader', slots: [
    { id: 544, level: 21, name: 'Whirlipede' },
    { id: 557, level: 21, name: 'Dwebble' },
    { id: 542, level: 23, name: 'Leavanny' },
  ] } },
  { id: 'elesa-unova', name: 'Elesa (Unova)', generation: '5th Generation', description: "The dazzling Electric-type Gym Leader of Nimbasa City. A supermodel whose beauty and strength shine in battle.", team: { name: 'Nimbasa Leader', slots: [
    { id: 587, level: 25, name: 'Emolga' },
    { id: 587, level: 25, name: 'Emolga' },
    { id: 523, level: 27, name: 'Zebstrika' },
  ] } },
  { id: 'clay-unova', name: 'Clay (Unova)', generation: '5th Generation', description: "The Ground-type Gym Leader of Driftveil City. A wealthy mine owner with a tough, no-nonsense attitude.", team: { name: 'Driftveil Leader', slots: [
    { id: 552, level: 29, name: 'Krokorok' },
    { id: 536, level: 29, name: 'Palpitoad' },
    { id: 530, level: 31, name: 'Excadrill' },
  ] } },
  { id: 'skyla-unova', name: 'Skyla (Unova)', generation: '5th Generation', description: "The high-flying Flying-type Gym Leader of Mistralton City. She's also a skilled pilot who delivers cargo by air.", team: { name: 'Mistralton Leader', slots: [
    { id: 528, level: 33, name: 'Swoobat' },
    { id: 521, level: 33, name: 'Unfezant' },
    { id: 581, level: 35, name: 'Swanna' },
  ] } },
  { id: 'brycen-unova', name: 'Brycen (Unova)', generation: '5th Generation', description: "The Ice-type Gym Leader of Icirrus City. A former movie star who now battles with cool composure.", team: { name: 'Icirrus Leader', slots: [
    { id: 583, level: 37, name: 'Vanillish' },
    { id: 615, level: 37, name: 'Cryogonal' },
    { id: 614, level: 39, name: 'Beartic' },
  ] } },
  { id: 'drayden-unova', name: 'Drayden/Iris (Unova)', generation: '5th Generation', description: "The Dragon-type Gym Leader of Opelucid City. Drayden is a stern veteran who has trained Dragons for decades.", team: { name: 'Opelucid Leader', slots: [
    { id: 611, level: 41, name: 'Fraxure' },
    { id: 621, level: 41, name: 'Druddigon' },
    { id: 612, level: 43, name: 'Haxorus' },
  ] } },
  { id: 'shauntal-elite-unova', name: 'Shauntal (Elite Four)', generation: '5th Generation', description: "The Ghost-type specialist of the Unova Elite Four. A novelist who draws writing inspiration from battles.", team: { name: 'Ghost Elite', slots: [
    { id: 563, level: 48, name: 'Cofagrigus' },
    { id: 593, level: 48, name: 'Jellicent' },
    { id: 623, level: 48, name: 'Golurk' },
    { id: 609, level: 50, name: 'Chandelure' },
  ] } },
  { id: 'grimsley-elite-unova', name: 'Grimsley (Elite Four)', generation: '5th Generation', description: "The Dark-type master of the Unova Elite Four. A fallen aristocrat who gambles everything on his battles.", team: { name: 'Dark Elite', slots: [
    { id: 560, level: 48, name: 'Scrafty' },
    { id: 510, level: 48, name: 'Liepard' },
    { id: 625, level: 50, name: 'Bisharp' },
    { id: 553, level: 48, name: 'Krookodile' },
  ] } },
  { id: 'caitlin-elite-unova', name: 'Caitlin (Elite Four)', generation: '5th Generation', description: "The Psychic-type expert of the Unova Elite Four. She traveled from the Battle Frontier to test her powers.", team: { name: 'Psychic Elite', slots: [
    { id: 579, level: 48, name: 'Reuniclus' },
    { id: 561, level: 48, name: 'Sigilyph' },
    { id: 518, level: 48, name: 'Musharna' },
    { id: 576, level: 50, name: 'Gothitelle' },
  ] } },
  { id: 'marshal-elite-unova', name: 'Marshal (Elite Four)', generation: '5th Generation', description: "The Fighting-type master of the Unova Elite Four. He is Alder's apprentice and trains relentlessly.", team: { name: 'Fighting Elite', slots: [
    { id: 538, level: 48, name: 'Throh' },
    { id: 539, level: 48, name: 'Sawk' },
    { id: 534, level: 48, name: 'Conkeldurr' },
    { id: 620, level: 50, name: 'Mienshao' },
  ] } },
  { id: 'alder-champion-unova', name: 'Alder (Champion)', generation: '5th Generation', description: "The wandering Champion of Unova. After the loss of his first partner, he travels seeking the meaning of strength.", team: { name: 'Unova Champion', slots: [
    { id: 617, level: 75, name: 'Accelgor' },
    { id: 626, level: 75, name: 'Bouffalant' },
    { id: 589, level: 75, name: 'Escavalier' },
    { id: 584, level: 75, name: 'Vanilluxe' },
    { id: 621, level: 75, name: 'Druddigon' },
    { id: 637, level: 77, name: 'Volcarona' },
  ] } },
  { id: 'iris-champion-unova', name: 'Iris (Champion B2W2)', generation: '5th Generation', description: "The Dragon-type Champion of Unova in Black 2 and White 2. She grew from a wild child into a powerful Champion.", team: { name: 'B2W2 Champion', slots: [
    { id: 635, level: 57, name: 'Hydreigon' },
    { id: 131, level: 57, name: 'Lapras' },
    { id: 306, level: 57, name: 'Aggron' },
    { id: 567, level: 57, name: 'Archeops' },
    { id: 621, level: 57, name: 'Druddigon' },
    { id: 612, level: 59, name: 'Haxorus' },
  ] } },

  // ===== Generation VI - Kalos =====
  { id: 'viola-kalos', name: 'Viola (Kalos)', generation: '6th Generation', description: "The Bug-type Gym Leader of Santalune City. A talented photographer who captures both Pokemon and moments.", team: { name: 'Santalune Leader', slots: [
    { id: 283, level: 10, name: 'Surskit' },
    { id: 666, level: 12, name: 'Vivillon' },
  ] } },
  { id: 'grant-kalos', name: 'Grant (Kalos)', generation: '6th Generation', description: "The Rock-type Gym Leader of Cyllage City. An avid rock climber who scales walls as nimbly as his Pokemon.", team: { name: 'Cyllage Leader', slots: [
    { id: 698, level: 25, name: 'Amaura' },
    { id: 696, level: 25, name: 'Tyrunt' },
  ] } },
  { id: 'korrina-kalos', name: 'Korrina (Kalos)', generation: '6th Generation', description: "The Fighting-type Gym Leader of Shalour City. She's the successor to Mega Evolution's legacy.", team: { name: 'Shalour Leader', slots: [
    { id: 619, level: 29, name: 'Mienfoo' },
    { id: 67, level: 28, name: 'Machoke' },
    { id: 701, level: 32, name: 'Hawlucha' },
  ] } },
  { id: 'ramos-kalos', name: 'Ramos (Kalos)', generation: '6th Generation', description: "The Grass-type Gym Leader of Coumarine City. A wise old gardener whose battle experience runs deep.", team: { name: 'Coumarine Leader', slots: [
    { id: 189, level: 30, name: 'Jumpluff' },
    { id: 70, level: 31, name: 'Weepinbell' },
    { id: 673, level: 34, name: 'Gogoat' },
  ] } },
  { id: 'clemont-kalos', name: 'Clemont (Kalos)', generation: '6th Generation', description: "The Electric-type Gym Leader of Lumiose City. A young inventor whose gadgets are as impressive as his Pokemon.", team: { name: 'Lumiose Leader', slots: [
    { id: 587, level: 35, name: 'Emolga' },
    { id: 82, level: 35, name: 'Magneton' },
    { id: 695, level: 37, name: 'Heliolisk' },
  ] } },
  { id: 'valerie-kalos', name: 'Valerie (Kalos)', generation: '6th Generation', description: "The Fairy-type Gym Leader of Laverre City. A fashion designer from Johto with an otherworldly aesthetic.", team: { name: 'Laverre Leader', slots: [
    { id: 303, level: 38, name: 'Mawile' },
    { id: 122, level: 39, name: 'Mr. Mime' },
    { id: 700, level: 42, name: 'Sylveon' },
  ] } },
  { id: 'olympia-kalos', name: 'Olympia (Kalos)', generation: '6th Generation', description: "The Psychic-type Gym Leader of Anistar City. Her mysterious prophecies and cosmic power awe challengers.", team: { name: 'Anistar Leader', slots: [
    { id: 561, level: 44, name: 'Sigilyph' },
    { id: 199, level: 45, name: 'Slowking' },
    { id: 678, level: 48, name: 'Meowstic' },
  ] } },
  { id: 'wulfric-kalos', name: 'Wulfric (Kalos)', generation: '6th Generation', description: "The Ice-type Gym Leader of Snowbelle City. A gentle giant whose warm heart contrasts with his icy Pokemon.", team: { name: 'Snowbelle Leader', slots: [
    { id: 460, level: 56, name: 'Abomasnow' },
    { id: 615, level: 55, name: 'Cryogonal' },
    { id: 713, level: 59, name: 'Avalugg' },
  ] } },
  { id: 'kalos-elite-malva', name: 'Malva (Elite Four)', generation: '6th Generation', description: "The Fire-type specialist of the Kalos Elite Four. A former Team Flare member turned news reporter.", team: { name: 'Fire Elite', slots: [
    { id: 668, level: 63, name: 'Pyroar' },
    { id: 324, level: 63, name: 'Torkoal' },
    { id: 609, level: 63, name: 'Chandelure' },
    { id: 663, level: 65, name: 'Talonflame' },
  ] } },
  { id: 'kalos-elite-siebold', name: 'Siebold (Elite Four)', generation: '6th Generation', description: "The Water-type master of the Kalos Elite Four. A renowned chef who views Pokemon battles as an art form.", team: { name: 'Water Elite', slots: [
    { id: 693, level: 63, name: 'Clawitzer' },
    { id: 121, level: 63, name: 'Starmie' },
    { id: 130, level: 63, name: 'Gyarados' },
    { id: 689, level: 65, name: 'Barbaracle' },
  ] } },
  { id: 'kalos-elite-wikstrom', name: 'Wikstrom (Elite Four)', generation: '6th Generation', description: "The Steel-type knight of the Kalos Elite Four. A chivalrous warrior devoted to honor and strength.", team: { name: 'Steel Elite', slots: [
    { id: 707, level: 63, name: 'Klefki' },
    { id: 476, level: 63, name: 'Probopass' },
    { id: 212, level: 63, name: 'Scizor' },
    { id: 681, level: 65, name: 'Aegislash' },
  ] } },
  { id: 'kalos-elite-drasna', name: 'Drasna (Elite Four)', generation: '6th Generation', description: "The Dragon-type expert of the Kalos Elite Four. A kindly grandmother with a fierce love for Dragon Pokemon.", team: { name: 'Dragon Elite', slots: [
    { id: 691, level: 63, name: 'Dragalge' },
    { id: 621, level: 63, name: 'Druddigon' },
    { id: 334, level: 63, name: 'Altaria' },
    { id: 715, level: 65, name: 'Noivern' },
  ] } },
  { id: 'diantha-champion-kalos', name: 'Diantha (Champion)', generation: '6th Generation', description: "The glamorous Champion of Kalos. A famous movie actress whose Gardevoir can Mega Evolve.", team: { name: 'Kalos Champion', slots: [
    { id: 701, level: 64, name: 'Hawlucha' },
    { id: 697, level: 65, name: 'Tyrantrum' },
    { id: 699, level: 65, name: 'Aurorus' },
    { id: 711, level: 65, name: 'Gourgeist' },
    { id: 706, level: 66, name: 'Goodra' },
    { id: 282, level: 68, name: 'Gardevoir' },
  ] } },

  // ===== Generation VII - Alola =====
  { id: 'hala-alola', name: 'Hala (Kahuna)', generation: '7th Generation', description: 'The Fighting-type Kahuna of Melemele Island. A jovial but powerful elder who tests aspiring Trainers.', team: { name: 'Melemele Kahuna', slots: [
    { id: 66, level: 14, name: 'Machop' },
    { id: 296, level: 14, name: 'Makuhita' },
    { id: 739, level: 15, name: 'Crabrawler' },
  ] } },
  { id: 'olivia-alola', name: 'Olivia (Kahuna)', generation: '7th Generation', description: 'The Rock-type Kahuna of Akala Island. Despite her rugged specialty, she has a refined and caring personality.', team: { name: 'Akala Kahuna', slots: [
    { id: 299, level: 26, name: 'Nosepass' },
    { id: 525, level: 26, name: 'Boldore' },
    { id: 745, level: 27, name: 'Lycanroc' },
  ] } },
  { id: 'nanu-alola', name: 'Nanu (Kahuna)', generation: '7th Generation', description: "The Dark-type Kahuna of Ula'ula Island. A lazy but surprisingly strong former International Police officer.", team: { name: 'Ula’ula Kahuna', slots: [
    { id: 302, level: 38, name: 'Sableye' },
    { id: 552, level: 37, name: 'Krokorok' },
    { id: 53, level: 39, name: 'Persian' },
  ] } },
  { id: 'hapu-alola', name: 'Hapu (Kahuna)', generation: '7th Generation', description: "The Ground-type Kahuna of Poni Island. The youngest Kahuna, she earned the title through sheer determination.", team: { name: 'Poni Kahuna', slots: [
    { id: 623, level: 47, name: 'Golurk' },
    { id: 423, level: 47, name: 'Gastrodon' },
    { id: 750, level: 48, name: 'Mudsdale' },
  ] } },
  { id: 'hala-elite-alola', name: 'Hala (Elite Four)', generation: '7th Generation', description: 'Returning as an Elite Four member with his Fighting-type team. Even stronger than in his Kahuna role.', team: { name: 'Fighting Elite', slots: [
    { id: 297, level: 54, name: 'Hariyama' },
    { id: 57, level: 54, name: 'Primeape' },
    { id: 740, level: 55, name: 'Crabominable' },
    { id: 62, level: 54, name: 'Poliwrath' },
    { id: 760, level: 54, name: 'Bewear' },
  ] } },
  { id: 'olivia-elite-alola', name: 'Olivia (Elite Four)', generation: '7th Generation', description: "Taking her Rock-type mastery to the Alola Elite Four. Her battle intensity matches the hardness of stone.", team: { name: 'Rock Elite', slots: [
    { id: 348, level: 54, name: 'Armaldo' },
    { id: 369, level: 54, name: 'Relicanth' },
    { id: 745, level: 55, name: 'Lycanroc' },
    { id: 476, level: 54, name: 'Probopass' },
    { id: 76, level: 54, name: 'Golem' },
  ] } },
  { id: 'acerola-elite-alola', name: 'Acerola (Elite Four)', generation: '7th Generation', description: "The Ghost-type Elite Four member and former Trial Captain. A cheerful girl from Alola's fallen royal family.", team: { name: 'Ghost Elite', slots: [
    { id: 302, level: 54, name: 'Sableye' },
    { id: 426, level: 54, name: 'Drifblim' },
    { id: 771, level: 55, name: 'Pyukumuku' },
    { id: 478, level: 54, name: 'Froslass' },
    { id: 781, level: 54, name: 'Dhelmise' },
  ] } },
  { id: 'kahili-elite-alola', name: 'Kahili (Elite Four)', generation: '7th Generation', description: "The Flying-type Elite Four member and professional golfer. She returned from abroad to defend Alola's league.", team: { name: 'Flying Elite', slots: [
    { id: 227, level: 54, name: 'Skarmory' },
    { id: 630, level: 54, name: 'Mandibuzz' },
    { id: 733, level: 55, name: 'Toucannon' },
    { id: 741, level: 54, name: 'Oricorio' },
    { id: 169, level: 54, name: 'Crobat' },
  ] } },
  { id: 'kukui-champion-alola', name: 'Kukui (Champion)', generation: '7th Generation', description: "Professor Kukui, the Alola region's Pokemon professor. He founded the Alola Pokemon League and serves as its first Champion battle.", team: { name: 'Alola Champion', slots: [
    { id: 745, level: 57, name: 'Lycanroc' },
    { id: 38, level: 56, name: 'Ninetales' },
    { id: 628, level: 56, name: 'Braviary' },
    { id: 462, level: 56, name: 'Magnezone' },
    { id: 143, level: 56, name: 'Snorlax' },
    { id: 724, level: 58, name: 'Decidueye' },
  ] } },
  { id: 'hau-champion-alola', name: 'Hau (USUM Champion)', generation: '7th Generation', description: "The player's upbeat and friendly rival. His sunny disposition and love for malasadas mask a fierce competitive spirit.", team: { name: 'USUM Champion', slots: [
    { id: 26, level: 53, name: 'Raichu' },
    { id: 740, level: 53, name: 'Crabominable' },
    { id: 715, level: 53, name: 'Noivern' },
    { id: 128, level: 53, name: 'Tauros' },
    { id: 136, level: 53, name: 'Flareon' },
    { id: 724, level: 55, name: 'Decidueye' },
  ] } },

  // ===== Generation VIII - Galar =====
  { id: 'milo-galar', name: 'Milo (Galar)', generation: '8th Generation', description: "The Grass-type Gym Leader of Turffield. A gentle farmer whose sunny disposition hides serious battling talent.", team: { name: 'Turf Field Leader', slots: [
    { id: 829, level: 19, name: 'Gossifleur' },
    { id: 830, level: 20, name: 'Eldegoss' },
  ] } },
  { id: 'nessa-galar', name: 'Nessa (Galar)', generation: '8th Generation', description: "The Water-type Gym Leader of Hulbury. A professional model whose waves of power crash over challengers.", team: { name: 'Water Leader', slots: [
    { id: 118, level: 22, name: 'Goldeen' },
    { id: 846, level: 23, name: 'Arrokuda' },
    { id: 834, level: 24, name: 'Drednaw' },
  ] } },
  { id: 'kabu-galar', name: 'Kabu (Galar)', generation: '8th Generation', description: "The Fire-type Gym Leader of Motostoke. A veteran Trainer from Hoenn who reignited his passion in Galar.", team: { name: 'Fire Leader', slots: [
    { id: 38, level: 25, name: 'Ninetales' },
    { id: 59, level: 25, name: 'Arcanine' },
    { id: 851, level: 27, name: 'Centiskorch' },
  ] } },
  { id: 'bea-galar', name: 'Bea (Galar)', generation: '8th Generation', description: "The Fighting-type Gym Leader of Stow-on-Side. A stoic martial artist with incredible focus and discipline.", team: { name: 'Fighting Leader', slots: [
    { id: 237, level: 34, name: 'Hitmontop' },
    { id: 675, level: 34, name: 'Pangoro' },
    { id: 865, level: 35, name: "Sirfetch'd" },
    { id: 68, level: 36, name: 'Machamp' },
  ] } },
  { id: 'allister-galar', name: 'Allister (Galar)', generation: '8th Generation', description: "The Ghost-type Gym Leader of Stow-on-Side. An extremely shy boy who hides behind a mask.", team: { name: 'Ghost Leader', slots: [
    { id: 562, level: 34, name: 'Yamask' },
    { id: 778, level: 34, name: 'Mimikyu' },
    { id: 864, level: 35, name: 'Cursola' },
    { id: 94, level: 36, name: 'Gengar' },
  ] } },
  { id: 'opal-galar', name: 'Opal (Galar)', generation: '8th Generation', description: "The Fairy-type Gym Leader of Ballonlea. An eccentric elderly woman searching for a worthy successor.", team: { name: 'Fairy Leader', slots: [
    { id: 110, level: 36, name: 'Weezing' },
    { id: 303, level: 36, name: 'Mawile' },
    { id: 468, level: 37, name: 'Togekiss' },
    { id: 869, level: 38, name: 'Alcremie' },
  ] } },
  { id: 'gordie-galar', name: 'Gordie (Galar)', generation: '8th Generation', description: "The Rock-type Gym Leader of Circhester. Melony's son who chose Rock-types over his mother's Ice specialty.", team: { name: 'Rock Leader', slots: [
    { id: 689, level: 40, name: 'Barbaracle' },
    { id: 213, level: 40, name: 'Shuckle' },
    { id: 874, level: 41, name: 'Stonjourner' },
    { id: 839, level: 42, name: 'Coalossal' },
  ] } },
  { id: 'melony-galar', name: 'Melony (Galar)', generation: '8th Generation', description: "The Ice-type Gym Leader of Circhester. A motherly figure with a cold and unyielding battle style.", team: { name: 'Ice Leader', slots: [
    { id: 873, level: 40, name: 'Frosmoth' },
    { id: 555, level: 40, name: 'Darmanitan' },
    { id: 875, level: 41, name: 'Eiscue' },
    { id: 131, level: 42, name: 'Lapras' },
  ] } },
  { id: 'piers-galar', name: 'Piers (Galar)', generation: '8th Generation', description: "The Dark-type Gym Leader of Spikemuth. A punk rock musician who refuses to Dynamax his Pokemon.", team: { name: 'Dark Leader', slots: [
    { id: 560, level: 44, name: 'Scrafty' },
    { id: 687, level: 45, name: 'Malamar' },
    { id: 435, level: 45, name: 'Skuntank' },
    { id: 862, level: 46, name: 'Obstagoon' },
  ] } },
  { id: 'raihan-galar', name: 'Raihan (Galar)', generation: '8th Generation', description: "The Dragon-type Gym Leader of Hammerlocke. Leon's self-proclaimed rival who specializes in weather strategies.", team: { name: 'Dragon Leader', slots: [
    { id: 526, level: 46, name: 'Gigalith' },
    { id: 330, level: 47, name: 'Flygon' },
    { id: 844, level: 46, name: 'Sandaconda' },
    { id: 884, level: 48, name: 'Duraludon' },
  ] } },
  { id: 'leon-champion-galar', name: 'Leon (Champion)', generation: '8th Generation', description: "The undefeated Champion of Galar. His Charizard and confident personality have made him a national icon.", team: { name: 'Galar Champion', slots: [
    { id: 681, level: 62, name: 'Aegislash' },
    { id: 612, level: 64, name: 'Haxorus' },
    { id: 887, level: 62, name: 'Dragapult' },
    { id: 537, level: 64, name: 'Seismitoad' },
    { id: 464, level: 64, name: 'Rhyperior' },
    { id: 6, level: 65, name: 'Charizard' },
  ] } },

  // ===== Generation IX - Paldea =====
  { id: 'katy-paldea', name: 'Katy (Paldea)', generation: '9th Generation', description: "The Bug-type Gym Leader of Cortondo. A kind patisserie owner who decorates her Pokemon like pastries.", team: { name: 'Bug Leader', slots: [
    { id: 919, level: 14, name: 'Nymble' },
    { id: 917, level: 14, name: 'Tarountula' },
    { id: 216, level: 15, name: 'Teddiursa' },
  ] } },
  { id: 'brassius-paldea', name: 'Brassius (Paldea)', generation: '9th Generation', description: "The Grass-type Gym Leader of Artazon. An avant-garde artist who expresses himself through Pokemon and sculpture.", team: { name: 'Grass Leader', slots: [
    { id: 548, level: 16, name: 'Petilil' },
    { id: 928, level: 16, name: 'Smoliv' },
    { id: 185, level: 17, name: 'Sudowoodo' },
  ] } },
  { id: 'iono-paldea', name: 'Iono (Paldea)', generation: '9th Generation', description: "The Electric-type Gym Leader of Levincia. A popular livestreamer whose electric personality matches her Pokemon.", team: { name: 'Electric Leader', slots: [
    { id: 940, level: 23, name: 'Wattrel' },
    { id: 939, level: 23, name: 'Bellibolt' },
    { id: 404, level: 23, name: 'Luxio' },
    { id: 429, level: 24, name: 'Mismagius' },
  ] } },
  { id: 'kofu-paldea', name: 'Kofu (Paldea)', generation: '9th Generation', description: "The Water-type Gym Leader of Cascarrafa. A passionate chef who draws battle inspiration from the sea.", team: { name: 'Water Leader', slots: [
    { id: 976, level: 29, name: 'Veluza' },
    { id: 961, level: 29, name: 'Wugtrio' },
    { id: 740, level: 30, name: 'Crabominable' },
  ] } },
  { id: 'larry-paldea', name: 'Larry (Paldea)', generation: '9th Generation', description: "The Normal-type Gym Leader of Medali. A remarkably average office worker who is also secretly an Elite Four member.", team: { name: 'Normal Leader', slots: [
    { id: 775, level: 35, name: 'Komala' },
    { id: 982, level: 35, name: 'Dudunsparce' },
    { id: 398, level: 36, name: 'Staraptor' },
  ] } },
  { id: 'ryme-paldea', name: 'Ryme (Paldea)', generation: '9th Generation', description: "The Ghost-type Gym Leader of Montenevera. A famous rapper whose rhymes and Ghost-types haunt the battlefield.", team: { name: 'Ghost Leader', slots: [
    { id: 354, level: 41, name: 'Banette' },
    { id: 778, level: 41, name: 'Mimikyu' },
    { id: 972, level: 41, name: 'Houndstone' },
    { id: 849, level: 42, name: 'Toxtricity' },
  ] } },
  { id: 'tulip-paldea', name: 'Tulip (Paldea)', generation: '9th Generation', description: "The Psychic-type Gym Leader of Alfornada. A top makeup artist whose beauty techniques enhance her Pokemon.", team: { name: 'Psychic Leader', slots: [
    { id: 981, level: 44, name: 'Farigiraf' },
    { id: 282, level: 44, name: 'Gardevoir' },
    { id: 956, level: 44, name: 'Espathra' },
    { id: 671, level: 45, name: 'Florges' },
  ] } },
  { id: 'grusha-paldea', name: 'Grusha (Paldea)', generation: '9th Generation', description: "The Ice-type Gym Leader of Glaseado. A former professional snowboarder forced to retire due to injury.", team: { name: 'Ice Leader', slots: [
    { id: 873, level: 47, name: 'Frosmoth' },
    { id: 614, level: 47, name: 'Beartic' },
    { id: 975, level: 47, name: 'Cetitan' },
    { id: 334, level: 48, name: 'Altaria' },
  ] } },
  { id: 'geeta-champion-paldea', name: 'Geeta (Top Champion)', generation: '9th Generation', description: "The Top Champion of Paldea and chairwoman of the Pokemon League. A calm and composed leader.", team: { name: 'Paldea Champion', slots: [
    { id: 956, level: 61, name: 'Espathra' },
    { id: 713, level: 61, name: 'Avalugg' },
    { id: 983, level: 61, name: 'Kingambit' },
    { id: 976, level: 61, name: 'Veluza' },
    { id: 673, level: 61, name: 'Gogoat' },
    { id: 970, level: 62, name: 'Glimmora' },
  ] } },
];
