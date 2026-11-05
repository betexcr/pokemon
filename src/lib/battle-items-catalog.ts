// Held items players can pick in the team builder: only items the battle engine implements.
// Shared by the team builder UI, offline battle setup and server-side team normalization.

export type BattleItemCategory = 'Choice & power' | 'Recovery & defense' | 'Berries' | 'Field & utility' | 'Type boost';

export type BattleItemInfo = { id: string; label: string; category: BattleItemCategory; effect: string };

const TYPE_BOOST: Array<[string, string]> = [
  ['charcoal', 'Fire'], ['mystic-water', 'Water'], ['magnet', 'Electric'], ['miracle-seed', 'Grass'],
  ['never-melt-ice', 'Ice'], ['black-belt', 'Fighting'], ['poison-barb', 'Poison'], ['soft-sand', 'Ground'],
  ['sharp-beak', 'Flying'], ['twisted-spoon', 'Psychic'], ['silver-powder', 'Bug'], ['hard-stone', 'Rock'],
  ['spell-tag', 'Ghost'], ['dragon-fang', 'Dragon'], ['black-glasses', 'Dark'], ['metal-coat', 'Steel'],
  ['fairy-feather', 'Fairy'], ['silk-scarf', 'Normal'],
];

const RESIST_BERRIES: Array<[string, string]> = [
  ['occa-berry', 'Fire'], ['passho-berry', 'Water'], ['wacan-berry', 'Electric'], ['rindo-berry', 'Grass'],
  ['yache-berry', 'Ice'], ['chople-berry', 'Fighting'], ['kebia-berry', 'Poison'], ['shuca-berry', 'Ground'],
  ['coba-berry', 'Flying'], ['payapa-berry', 'Psychic'], ['tanga-berry', 'Bug'], ['charti-berry', 'Rock'],
  ['kasib-berry', 'Ghost'], ['haban-berry', 'Dragon'], ['colbur-berry', 'Dark'], ['babiri-berry', 'Steel'],
  ['roseli-berry', 'Fairy'], ['chilan-berry', 'Normal'],
];

const title = (id: string) => id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const BATTLE_ITEMS: readonly BattleItemInfo[] = [
  { id: 'choice-band', label: 'Choice Band', category: 'Choice & power', effect: 'Attack x1.5, locked into one move' },
  { id: 'choice-specs', label: 'Choice Specs', category: 'Choice & power', effect: 'Sp. Atk x1.5, locked into one move' },
  { id: 'choice-scarf', label: 'Choice Scarf', category: 'Choice & power', effect: 'Speed x1.5, locked into one move' },
  { id: 'life-orb', label: 'Life Orb', category: 'Choice & power', effect: 'Moves x1.3, lose 10% HP per hit' },
  { id: 'expert-belt', label: 'Expert Belt', category: 'Choice & power', effect: 'Super-effective moves x1.2' },
  { id: 'weakness-policy', label: 'Weakness Policy', category: 'Choice & power', effect: '+2 Atk / Sp. Atk after a super-effective hit' },
  { id: 'booster-energy', label: 'Booster Energy', category: 'Choice & power', effect: 'Activates Protosynthesis / Quark Drive' },
  { id: 'leftovers', label: 'Leftovers', category: 'Recovery & defense', effect: 'Restores 1/16 HP each turn' },
  { id: 'black-sludge', label: 'Black Sludge', category: 'Recovery & defense', effect: 'Poison types heal 1/16; others are hurt' },
  { id: 'shell-bell', label: 'Shell Bell', category: 'Recovery & defense', effect: 'Heals 1/8 of damage dealt' },
  { id: 'focus-sash', label: 'Focus Sash', category: 'Recovery & defense', effect: 'Survives one KO from full HP' },
  { id: 'focus-band', label: 'Focus Band', category: 'Recovery & defense', effect: '10% chance to survive a KO' },
  { id: 'assault-vest', label: 'Assault Vest', category: 'Recovery & defense', effect: 'Sp. Def x1.5, attacking moves only' },
  { id: 'eviolite', label: 'Eviolite', category: 'Recovery & defense', effect: 'Def / Sp. Def x1.5' },
  { id: 'rocky-helmet', label: 'Rocky Helmet', category: 'Recovery & defense', effect: 'Contact attackers lose 1/6 HP' },
  { id: 'air-balloon', label: 'Air Balloon', category: 'Recovery & defense', effect: 'Immune to Ground until hit' },
  { id: 'white-herb', label: 'White Herb', category: 'Recovery & defense', effect: 'Restores lowered stats once' },
  { id: 'heavy-duty-boots', label: 'Heavy-Duty Boots', category: 'Field & utility', effect: 'Ignores entry hazards' },
  { id: 'safety-goggles', label: 'Safety Goggles', category: 'Field & utility', effect: 'Immune to weather damage' },
  { id: 'eject-button', label: 'Eject Button', category: 'Field & utility', effect: 'Switches out after being hit' },
  { id: 'eject-pack', label: 'Eject Pack', category: 'Field & utility', effect: 'Switches out when stats are lowered' },
  { id: 'red-card', label: 'Red Card', category: 'Field & utility', effect: 'Forces the attacker out after a hit' },
  { id: 'flame-orb', label: 'Flame Orb', category: 'Field & utility', effect: 'Burns the holder at end of turn' },
  { id: 'toxic-orb', label: 'Toxic Orb', category: 'Field & utility', effect: 'Badly poisons the holder at end of turn' },
  { id: 'iron-ball', label: 'Iron Ball', category: 'Field & utility', effect: 'Halves Speed, grounds the holder' },
  { id: 'light-clay', label: 'Light Clay', category: 'Field & utility', effect: 'Screens last 8 turns' },
  { id: 'heat-rock', label: 'Heat Rock', category: 'Field & utility', effect: 'Sun lasts 8 turns' },
  { id: 'damp-rock', label: 'Damp Rock', category: 'Field & utility', effect: 'Rain lasts 8 turns' },
  { id: 'smooth-rock', label: 'Smooth Rock', category: 'Field & utility', effect: 'Sandstorm lasts 8 turns' },
  { id: 'icy-rock', label: 'Icy Rock', category: 'Field & utility', effect: 'Snow lasts 8 turns' },
  { id: 'terrain-extender', label: 'Terrain Extender', category: 'Field & utility', effect: 'Terrain lasts 8 turns' },
  { id: 'muscle-band', label: 'Muscle Band', category: 'Choice & power', effect: 'Physical moves x1.1' },
  { id: 'wise-glasses', label: 'Wise Glasses', category: 'Choice & power', effect: 'Special moves x1.1' },
  { id: 'punching-glove', label: 'Punching Glove', category: 'Choice & power', effect: 'Punches x1.1 and make no contact' },
  { id: 'metronome', label: 'Metronome', category: 'Choice & power', effect: '+20% per consecutive use of a move (up to x2)' },
  { id: 'loaded-dice', label: 'Loaded Dice', category: 'Choice & power', effect: 'Multi-hit moves hit 4-5 times' },
  { id: 'scope-lens', label: 'Scope Lens', category: 'Choice & power', effect: 'Raises critical-hit ratio' },
  { id: 'razor-claw', label: 'Razor Claw', category: 'Choice & power', effect: 'Raises critical-hit ratio' },
  { id: 'kings-rock', label: "King's Rock", category: 'Choice & power', effect: '10% chance to make the target flinch' },
  { id: 'razor-fang', label: 'Razor Fang', category: 'Choice & power', effect: '10% chance to make the target flinch' },
  { id: 'wide-lens', label: 'Wide Lens', category: 'Choice & power', effect: 'Accuracy x1.1' },
  { id: 'zoom-lens', label: 'Zoom Lens', category: 'Choice & power', effect: 'Accuracy x1.2 when moving after the target' },
  { id: 'quick-claw', label: 'Quick Claw', category: 'Choice & power', effect: '20% chance to move first in its priority bracket' },
  { id: 'throat-spray', label: 'Throat Spray', category: 'Choice & power', effect: '+1 Sp. Atk after using a sound move' },
  { id: 'blunder-policy', label: 'Blunder Policy', category: 'Choice & power', effect: '+2 Speed after a miss' },
  { id: 'adrenaline-orb', label: 'Adrenaline Orb', category: 'Choice & power', effect: '+1 Speed when Intimidated' },
  { id: 'room-service', label: 'Room Service', category: 'Choice & power', effect: '-1 Speed when Trick Room starts' },
  { id: 'power-herb', label: 'Power Herb', category: 'Choice & power', effect: 'Skips a two-turn move\'s charge turn once' },
  { id: 'mirror-herb', label: 'Mirror Herb', category: 'Choice & power', effect: "Copies the foe's stat boosts once" },
  { id: 'absorb-bulb', label: 'Absorb Bulb', category: 'Choice & power', effect: '+1 Sp. Atk when hit by a Water move' },
  { id: 'cell-battery', label: 'Cell Battery', category: 'Choice & power', effect: '+1 Attack when hit by an Electric move' },
  { id: 'snowball', label: 'Snowball', category: 'Choice & power', effect: '+1 Attack when hit by an Ice move' },
  { id: 'luminous-moss', label: 'Luminous Moss', category: 'Recovery & defense', effect: '+1 Sp. Def when hit by a Water move' },
  { id: 'big-root', label: 'Big Root', category: 'Recovery & defense', effect: 'Draining moves and Leech Seed heal 30% more' },
  { id: 'bright-powder', label: 'Bright Powder', category: 'Recovery & defense', effect: "Lowers foes' accuracy (x0.9)" },
  { id: 'lax-incense', label: 'Lax Incense', category: 'Recovery & defense', effect: "Lowers foes' accuracy (x0.9)" },
  { id: 'clear-amulet', label: 'Clear Amulet', category: 'Recovery & defense', effect: 'Foes cannot lower its stats' },
  { id: 'covert-cloak', label: 'Covert Cloak', category: 'Recovery & defense', effect: 'Blocks secondary effects of moves' },
  { id: 'mental-herb', label: 'Mental Herb', category: 'Recovery & defense', effect: 'Cures Taunt, Encore and Disable once' },
  { id: 'ability-shield', label: 'Ability Shield', category: 'Field & utility', effect: 'Its ability cannot be ignored (Mold Breaker)' },
  { id: 'protective-pads', label: 'Protective Pads', category: 'Field & utility', effect: 'Its moves make no contact' },
  { id: 'utility-umbrella', label: 'Utility Umbrella', category: 'Field & utility', effect: 'Ignores sun and rain' },
  { id: 'shed-shell', label: 'Shed Shell', category: 'Field & utility', effect: 'Can always switch out, even when trapped' },
  { id: 'binding-band', label: 'Binding Band', category: 'Field & utility', effect: 'Binding moves deal 1/6 per turn' },
  { id: 'grip-claw', label: 'Grip Claw', category: 'Field & utility', effect: 'Binding moves last 7 turns' },
  { id: 'sitrus-berry', label: 'Sitrus Berry', category: 'Berries', effect: 'Restores 1/4 HP at half HP' },
  { id: 'oran-berry', label: 'Oran Berry', category: 'Berries', effect: 'Restores 10 HP at half HP' },
  { id: 'lum-berry', label: 'Lum Berry', category: 'Berries', effect: 'Cures any status once' },
  { id: 'liechi-berry', label: 'Liechi Berry', category: 'Berries', effect: '+1 Attack at 1/4 HP' },
  { id: 'ganlon-berry', label: 'Ganlon Berry', category: 'Berries', effect: '+1 Defense at 1/4 HP' },
  { id: 'salac-berry', label: 'Salac Berry', category: 'Berries', effect: '+1 Speed at 1/4 HP' },
  { id: 'petaya-berry', label: 'Petaya Berry', category: 'Berries', effect: '+1 Sp. Atk at 1/4 HP' },
  { id: 'apicot-berry', label: 'Apicot Berry', category: 'Berries', effect: '+1 Sp. Def at 1/4 HP' },
  { id: 'lansat-berry', label: 'Lansat Berry', category: 'Berries', effect: 'Raises critical-hit ratio at 1/4 HP' },
  { id: 'starf-berry', label: 'Starf Berry', category: 'Berries', effect: 'A random stat +2 at 1/4 HP' },
  { id: 'micle-berry', label: 'Micle Berry', category: 'Berries', effect: "Next move's accuracy x1.2 at 1/4 HP" },
  { id: 'custap-berry', label: 'Custap Berry', category: 'Berries', effect: 'Moves first once at 1/4 HP' },
  { id: 'kee-berry', label: 'Kee Berry', category: 'Berries', effect: '+1 Defense when hit by a physical move' },
  { id: 'maranga-berry', label: 'Maranga Berry', category: 'Berries', effect: '+1 Sp. Def when hit by a special move' },
  { id: 'jaboca-berry', label: 'Jaboca Berry', category: 'Berries', effect: 'Physical attacker loses 1/8 HP' },
  { id: 'rowap-berry', label: 'Rowap Berry', category: 'Berries', effect: 'Special attacker loses 1/8 HP' },
  { id: 'enigma-berry', label: 'Enigma Berry', category: 'Berries', effect: 'Restores 1/4 HP after a super-effective hit' },
  { id: 'leppa-berry', label: 'Leppa Berry', category: 'Berries', effect: 'Restores 10 PP to a move that runs out' },
  { id: 'cheri-berry', label: 'Cheri Berry', category: 'Berries', effect: 'Cures paralysis' },
  { id: 'chesto-berry', label: 'Chesto Berry', category: 'Berries', effect: 'Cures sleep' },
  { id: 'pecha-berry', label: 'Pecha Berry', category: 'Berries', effect: 'Cures poison' },
  { id: 'rawst-berry', label: 'Rawst Berry', category: 'Berries', effect: 'Cures a burn' },
  { id: 'aspear-berry', label: 'Aspear Berry', category: 'Berries', effect: 'Cures freezing' },
  { id: 'persim-berry', label: 'Persim Berry', category: 'Berries', effect: 'Cures confusion' },
  ...['figy', 'wiki', 'mago', 'aguav', 'iapapa'].map((b): BattleItemInfo => ({
    id: `${b}-berry`, label: title(`${b}-berry`), category: 'Berries', effect: 'Restores 1/3 HP at 1/4 HP',
  })),
  ...RESIST_BERRIES.map(([id, type]): BattleItemInfo => ({
    id, label: title(id), category: 'Berries', effect: `Halves one super-effective ${type} hit${type === 'Normal' ? ' (any Normal hit)' : ''}`,
  })),
  ...TYPE_BOOST.map(([id, type]): BattleItemInfo => ({ id, label: title(id), category: 'Type boost', effect: `${type} moves x1.2` })),
];

const BY_ID = new Map(BATTLE_ITEMS.map((i) => [i.id, i]));

export function getBattleItem(id: unknown): BattleItemInfo | undefined {
  return typeof id === 'string' ? BY_ID.get(id.trim().toLowerCase().replace(/[\s_]+/g, '-')) : undefined;
}

/** Normalized item id when it is one the engine supports, else undefined. */
export function sanitizeBattleItem(id: unknown): string | undefined {
  return getBattleItem(id)?.id;
}
