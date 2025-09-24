// Human-readable labels
export const TYPE_LABELS: Record<string, string> = {
  normal: "Normal", 
  fire: "Fire", 
  water: "Water", 
  electric: "Electric", 
  grass: "Grass",
  ice: "Ice", 
  fighting: "Fighting", 
  poison: "Poison", 
  ground: "Ground", 
  flying: "Flying",
  psychic: "Psychic", 
  bug: "Bug", 
  rock: "Rock", 
  ghost: "Ghost", 
  dragon: "Dragon",
  dark: "Dark", 
  steel: "Steel", 
  fairy: "Fairy",
};

// Types that need white text (dark backgrounds)
const DARK_TYPES = new Set([
  "fire","fighting","poison","ghost","dragon","dark","rock","steel"
]);

/**
 * Returns background class for type
 * e.g. bg-type-fire
 */
export function typeBgClass(t: string) {
  return `bg-type-${t.toLowerCase()}`;
}

/**
 * Returns text color class for contrast
 * e.g. text-white or text-black
 */
export function typeTextContrast(t: string) {
  return DARK_TYPES.has(t.toLowerCase()) ? "text-white" : "text-black";
}

/**
 * Utility for chips/buttons — returns full class list
 */
export function typeChipClasses(t: string, extra?: string) {
  return [
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border shadow-sm",
    typeBgClass(t),
    typeTextContrast(t),
    "border-black/10",
    extra,
  ].join(" ");
}



