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
