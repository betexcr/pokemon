/**
 * Shared tables for battle move scripts (status self-targets, pivots, crit rates, etc.).
 * Keep battle-role lists here — do not merge with team-builder tagging lists in `team/engine.ts`.
 */

export const CRIT_STAGE_RATES = [1 / 24, 1 / 8, 1 / 2, 1, 1] as const;

export const GUTS_ACTIVE_STATUSES = [
  'burned',
  'paralyzed',
  'poisoned',
  'badly-poisoned',
  'asleep',
  'frozen',
] as const;

/** Item → boosted move type (×1.2 power). */
export const TYPE_BOOST_ITEMS: Readonly<Record<string, string>> = {
  charcoal: 'fire',
  'mystic-water': 'water',
  magnet: 'electric',
  'miracle-seed': 'grass',
  'never-melt-ice': 'ice',
  'black-belt': 'fighting',
  'poison-barb': 'poison',
  'soft-sand': 'ground',
  'sharp-beak': 'flying',
  'twisted-spoon': 'psychic',
  'silver-powder': 'bug',
  'hard-stone': 'rock',
  'spell-tag': 'ghost',
  'dragon-fang': 'dragon',
  'black-glasses': 'dark',
  'metal-coat': 'steel',
  'fairy-feather': 'fairy',
  'silk-scarf': 'normal',
};

/** Status / setup moves that do not target the foe (Psychic Terrain / Prankster Dark gates). */
export const SELF_STATUS_MOVES = new Set([
  'recover', 'soft-boiled', 'milk-drink', 'roost', 'synthesis', 'moonlight',
  'morning-sun', 'shore-up', 'slack-off', 'rest', 'protect', 'detect',
  'baneful-bunker', 'kings-shield', 'king-s-shield', 'spiky-shield',
  'reflect', 'light-screen', 'aurora-veil', 'heal-bell', 'aromatherapy',
  'swords-dance', 'dragon-dance', 'calm-mind', 'bulk-up', 'nasty-plot',
  'work-up', 'growth', 'hone-claws', 'coil', 'agility', 'rock-polish',
  'sunny-day', 'rain-dance', 'sandstorm', 'hail', 'snowscape',
  'electric-terrain', 'grassy-terrain', 'misty-terrain', 'psychic-terrain',
  'trick-room', 'stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web',
  'life-dew', 'wish', 'substitute', 'belly-drum', 'shell-smash',
]);

/** Damaging (or Parting Shot) moves that force a mid-turn switch. */
export const PIVOT_MOVES = new Set(['u-turn', 'volt-switch', 'flip-turn', 'parting-shot']);

/** Lock the user into the move for 2–3 turns, then confuse (Outrage / Petal Dance / Thrash). */
export const RAMPAGE_MOVES = new Set([
  'outrage',
  'petal-dance',
  'thrash',
  'raging-fury',
]);

/** Deal damage, then force a recharge turn (Hyper Beam family). */
export const RECHARGE_MOVES = new Set([
  'hyper-beam',
  'giga-impact',
  'blast-burn',
  'frenzy-plant',
  'hydro-cannon',
  'rock-wrecker',
  'roar-of-time',
  'prismatic-laser',
  'meteor-assault',
  'eternabeam',
]);

/**
 * Two-turn moves: charge on turn 1, execute on turn 2.
 * Values: `semi` = also semi-invulnerable while charging; `charge` = visible charge only.
 */
export const TWO_TURN_MOVES: Readonly<Record<string, 'semi' | 'charge'>> = {
  dig: 'semi',
  fly: 'semi',
  dive: 'semi',
  bounce: 'semi',
  'phantom-force': 'semi',
  'shadow-force': 'semi',
  'solar-beam': 'charge',
  'solar-blade': 'charge',
  'skull-bash': 'charge',
  'razor-wind': 'charge',
  'sky-attack': 'charge',
  'freeze-shock': 'charge',
  'ice-burn': 'charge',
  geomancy: 'charge',
  'meteor-beam': 'charge',
  'electro-shot': 'charge',
};

/** Skip the charge turn of these moves under matching weather. */
export const TWO_TURN_WEATHER_SKIP: Readonly<Record<string, string>> = {
  'solar-beam': 'sun',
  'solar-blade': 'sun',
  'electro-shot': 'rain',
};
