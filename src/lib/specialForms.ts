// Special forms mapping and data
export interface SpecialFormInfo {
  id: number
  name: string
  japaneseName: string
  basePokemonId: number
  basePokemonName: string
  formType: 'mega' | 'primal'
  variant?: string // For forms like Charizard X/Y
  description: string
}

// Mapping of special form IDs to their base Pokemon
export const SPECIAL_FORM_MAPPINGS: Record<number, SpecialFormInfo> = {
  10033: { id: 10033, name: 'Mega Venusaur', japaneseName: 'メガフシギバナ', basePokemonId: 3, basePokemonName: 'Venusaur', formType: 'mega', description: 'Mega Evolution of Venusaur; temporary powered-up form introduced in Gen VI.' },
  10034: { id: 10034, name: 'Mega Charizard X', japaneseName: 'メガリザードンX', basePokemonId: 6, basePokemonName: 'Charizard', formType: 'mega', variant: 'X', description: 'Black, blue‑flamed Mega form emphasizing physical power; distinct X variant.' },
  10035: { id: 10035, name: 'Mega Charizard Y', japaneseName: 'メガリザードンY', basePokemonId: 6, basePokemonName: 'Charizard', formType: 'mega', variant: 'Y', description: 'Air‑superiority Mega form emphasizing Special Attack; distinct Y variant.' },
  10036: { id: 10036, name: 'Mega Blastoise', japaneseName: 'メガカメックス', basePokemonId: 9, basePokemonName: 'Blastoise', formType: 'mega', description: 'Back‑mounted mega cannon; heightened defenses and firepower.' },
  10037: { id: 10037, name: 'Mega Alakazam', japaneseName: 'メガフーディン', basePokemonId: 65, basePokemonName: 'Alakazam', formType: 'mega', description: 'Gains an extra spoon; supreme psychic focus.' },
  10038: { id: 10038, name: 'Mega Gengar', japaneseName: 'メガゲンガー', basePokemonId: 94, basePokemonName: 'Gengar', formType: 'mega', description: 'Shadow sinks into the ground; amplified mischievous specter.' },
  10039: { id: 10039, name: 'Mega Kangaskhan', japaneseName: 'メガガルーラ', basePokemonId: 115, basePokemonName: 'Kangaskhan', formType: 'mega', description: 'Child fights alongside parent (Parental Bond).' },
  10040: { id: 10040, name: 'Mega Pinsir', japaneseName: 'メガカイロス', basePokemonId: 127, basePokemonName: 'Pinsir', formType: 'mega', description: 'Sprouts ethereal wings; becomes flying menace.' },
  10041: { id: 10041, name: 'Mega Gyarados', japaneseName: 'メガギャラドス', basePokemonId: 130, basePokemonName: 'Gyarados', formType: 'mega', description: 'Bulkier, darker carp dragon; “tyrant” motif.' },
  10042: { id: 10042, name: 'Mega Aerodactyl', japaneseName: 'メガプテラ', basePokemonId: 142, basePokemonName: 'Aerodactyl', formType: 'mega', description: 'Body ossifies with spines; primeval predator vibe.' },
  10043: { id: 10043, name: 'Mega Mewtwo X', japaneseName: 'メガミュウツーX', basePokemonId: 150, basePokemonName: 'Mewtwo', formType: 'mega', variant: 'X', description: 'Martial, muscle‑focused Mega form.' },
  10044: { id: 10044, name: 'Mega Mewtwo Y', japaneseName: 'メガミュウツーY', basePokemonId: 150, basePokemonName: 'Mewtwo', formType: 'mega', variant: 'Y', description: 'Lean, hyper‑psychic Mega form.' },
  10045: { id: 10045, name: 'Mega Ampharos', japaneseName: 'メガデンリュウ', basePokemonId: 181, basePokemonName: 'Ampharos', formType: 'mega', description: 'Gains flowing mane; “dragon” motif emphasized.' },
  10046: { id: 10046, name: 'Mega Scizor', japaneseName: 'メガハッサム', basePokemonId: 212, basePokemonName: 'Scizor', formType: 'mega', description: 'Hardened pincers; industrial red armor.' },
  10047: { id: 10047, name: 'Mega Heracross', japaneseName: 'メガヘラクロス', basePokemonId: 214, basePokemonName: 'Heracross', formType: 'mega', description: 'Massive horn with spikes; grappling specialist.' },
  10048: { id: 10048, name: 'Mega Houndoom', japaneseName: 'メガヘルガー', basePokemonId: 229, basePokemonName: 'Houndoom', formType: 'mega', description: 'Hellhound with longer horns and tail flames.' },
  10049: { id: 10049, name: 'Mega Tyranitar', japaneseName: 'メガバンギラス', basePokemonId: 248, basePokemonName: 'Tyranitar', formType: 'mega', description: 'Armor erupts with vents; sand tyrant amplified.' },
  10050: { id: 10050, name: 'Mega Blaziken', japaneseName: 'メガバシャーモ', basePokemonId: 257, basePokemonName: 'Blaziken', formType: 'mega', description: 'Flame scarf blazes; fiery striker.' },
  10051: { id: 10051, name: 'Mega Gardevoir', japaneseName: 'メガサーナイト', basePokemonId: 282, basePokemonName: 'Gardevoir', formType: 'mega', description: 'Gown‑like veil; protective psychic songstress.' },
  10052: { id: 10052, name: 'Mega Mawile', japaneseName: 'メガクチート', basePokemonId: 303, basePokemonName: 'Mawile', formType: 'mega', description: 'Twin jaws; deceiver’s jaws multiply.' },
  10053: { id: 10053, name: 'Mega Aggron', japaneseName: 'メガボスゴドラ', basePokemonId: 306, basePokemonName: 'Aggron', formType: 'mega', description: 'Drops Rock typing; pure Steel juggernaut.' },
  10054: { id: 10054, name: 'Mega Medicham', japaneseName: 'メガチャーレム', basePokemonId: 308, basePokemonName: 'Medicham', formType: 'mega', description: 'Prayer beads and aura; heightened inner focus.' },
  10055: { id: 10055, name: 'Mega Manectric', japaneseName: 'メガライボルト', basePokemonId: 310, basePokemonName: 'Manectric', formType: 'mega', description: 'Lightning crest; living thunderbolt.' },
  10056: { id: 10056, name: 'Mega Banette', japaneseName: 'メガジュペッタ', basePokemonId: 354, basePokemonName: 'Banette', formType: 'mega', description: 'Curses intensify; zipper mouth unseals malevolence.' },
  10057: { id: 10057, name: 'Mega Absol', japaneseName: 'メガアブソル', basePokemonId: 359, basePokemonName: 'Absol', formType: 'mega', description: 'Angel‑like fur wings; disaster omens misconstrued.' },
  10058: { id: 10058, name: 'Mega Garchomp', japaneseName: 'メガガブリアス', basePokemonId: 445, basePokemonName: 'Garchomp', formType: 'mega', description: 'Scythes enlarge; desert dragon berserker.' },
  10059: { id: 10059, name: 'Mega Lucario', japaneseName: 'メガルカリオ', basePokemonId: 448, basePokemonName: 'Lucario', formType: 'mega', description: 'Aura sensors extend; warrior ascetic.' },
  10060: { id: 10060, name: 'Mega Abomasnow', japaneseName: 'メガユキノオー', basePokemonId: 460, basePokemonName: 'Abomasnow', formType: 'mega', description: 'Blizzard crown; snow king empowered.' },
  10061: { id: 10061, name: 'Mega Latias', japaneseName: 'メガラティアス', basePokemonId: 380, basePokemonName: 'Latias', formType: 'mega', description: 'Streamlined jet dragon; psychic duo sister.' },
  10062: { id: 10062, name: 'Mega Latios', japaneseName: 'メガラティオス', basePokemonId: 381, basePokemonName: 'Latios', formType: 'mega', description: 'Streamlined jet dragon; psychic duo brother.' },
  10063: { id: 10063, name: 'Mega Swampert', japaneseName: 'メガラグラージ', basePokemonId: 260, basePokemonName: 'Swampert', formType: 'mega', description: 'Muscular swamp brute; torrential power.' },
  10064: { id: 10064, name: 'Mega Sceptile', japaneseName: 'メガジュカイン', basePokemonId: 254, basePokemonName: 'Sceptile', formType: 'mega', description: 'Tail launches like a missile; lightning theme.' },
  10065: { id: 10065, name: 'Mega Sableye', japaneseName: 'メガヤミラミ', basePokemonId: 302, basePokemonName: 'Sableye', formType: 'mega', description: 'Hides behind giant ruby; mischief shielded.' },
  10066: { id: 10066, name: 'Mega Altaria', japaneseName: 'メガチルタリス', basePokemonId: 334, basePokemonName: 'Altaria', formType: 'mega', description: 'Cotton cloud dress; fairy aria.' },
  10067: { id: 10067, name: 'Mega Gallade', japaneseName: 'メガエルレイド', basePokemonId: 475, basePokemonName: 'Gallade', formType: 'mega', description: 'Cape‑like arms; duelist knight.' },
  10068: { id: 10068, name: 'Mega Audino', japaneseName: 'メガタブンネ', basePokemonId: 531, basePokemonName: 'Audino', formType: 'mega', description: 'Healer robes; soothing aura.' },
  10069: { id: 10069, name: 'Mega Sharpedo', japaneseName: 'メガサメハダー', basePokemonId: 319, basePokemonName: 'Sharpedo', formType: 'mega', description: 'Body studded with scars; torpedo shark escalation.' },
  10070: { id: 10070, name: 'Mega Slowbro', japaneseName: 'メガヤドラン', basePokemonId: 80, basePokemonName: 'Slowbro', formType: 'mega', description: 'Shellder shell engulfs body like armor.' },
  10071: { id: 10071, name: 'Mega Steelix', japaneseName: 'メガハガネール', basePokemonId: 208, basePokemonName: 'Steelix', formType: 'mega', description: 'Diamonds stud body; subterranean titan.' },
  10072: { id: 10072, name: 'Mega Pidgeot', japaneseName: 'メガピジョット', basePokemonId: 18, basePokemonName: 'Pidgeot', formType: 'mega', description: 'Grand plumage; storm tailwinds.' },
  10073: { id: 10073, name: 'Mega Glalie', japaneseName: 'メガオニゴーリ', basePokemonId: 362, basePokemonName: 'Glalie', formType: 'mega', description: 'Jaw splits open; chilling maw.' },
  10074: { id: 10074, name: 'Mega Diancie', japaneseName: 'メガディアンシー', basePokemonId: 719, basePokemonName: 'Diancie', formType: 'mega', description: 'Gem gown; dazzling prism queen.' },
  10075: { id: 10075, name: 'Mega Metagross', japaneseName: 'メガメタグロス', basePokemonId: 376, basePokemonName: 'Metagross', formType: 'mega', description: 'Four-unit fusion; supercomputer brain.' },
  10076: { id: 10076, name: 'Mega Camerupt', japaneseName: 'メガバクーダ', basePokemonId: 323, basePokemonName: 'Camerupt', formType: 'mega', description: 'Single massive volcano hump; lava reservoir.' },
  10077: { id: 10077, name: 'Primal Kyogre', japaneseName: 'ゲンシカイオーガ', basePokemonId: 382, basePokemonName: 'Kyogre', formType: 'primal', description: 'Primal Reversion to ancient sea deity form.' },
  10078: { id: 10078, name: 'Primal Groudon', japaneseName: 'ゲンシグラードン', basePokemonId: 383, basePokemonName: 'Groudon', formType: 'primal', description: 'Primal Reversion to ancient land deity form.' },
  10079: { id: 10079, name: 'Mega Rayquaza', japaneseName: 'メガレックウザ', basePokemonId: 384, basePokemonName: 'Rayquaza', formType: 'mega', description: 'Achieves Mega form via Dragon Ascent; sky lord.' },
  10080: { id: 10080, name: 'Mega Lopunny', japaneseName: 'メガミミロップ', basePokemonId: 428, basePokemonName: 'Lopunny', formType: 'mega', description: 'Kicking specialist; fighter’s garb.' },
  10081: { id: 10081, name: 'Mega Salamence', japaneseName: 'メガボーマンダ', basePokemonId: 373, basePokemonName: 'Salamence', formType: 'mega', description: 'Wing forms a crescent blade; supersonic glider.' },
  10082: { id: 10082, name: 'Mega Beedrill', japaneseName: 'メガスピアー', basePokemonId: 15, basePokemonName: 'Beedrill', formType: 'mega', description: 'Lance‑like stingers on arms and tail; raid hornet.' },
}

// Helper functions
export function isSpecialForm(id: number): boolean {
  return id >= 10033 && id <= 10082
}

export function getSpecialFormInfo(id: number): SpecialFormInfo | null {
  return SPECIAL_FORM_MAPPINGS[id] || null
}

export function getBasePokemonId(specialFormId: number): number | null {
  const formInfo = getSpecialFormInfo(specialFormId)
  return formInfo ? formInfo.basePokemonId : null
}

export function getSpecialFormsForBasePokemon(basePokemonId: number): SpecialFormInfo[] {
  return Object.values(SPECIAL_FORM_MAPPINGS).filter(form => form.basePokemonId === basePokemonId)
}

export function getSpecialFormDisplayName(formInfo: SpecialFormInfo): string {
  if (formInfo.formType === 'mega') {
    return `Mega ${formInfo.basePokemonName}${formInfo.variant ? ` ${formInfo.variant}` : ''}`
  } else if (formInfo.formType === 'primal') {
    return `Primal ${formInfo.basePokemonName}`
  }
  return formInfo.name
}
