// Comprehensive Pokémon Damage Calculator (Gen VI+ baseline)
// Adapted from modern competitive Pokémon damage calculation standards

export type TypeName = 
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice" 
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug" 
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

// Complete type effectiveness chart (Gen VI+)
export const TYPE_CHART: Record<TypeName, Partial<Record<TypeName, number>>> = {
  "Normal":   {"Rock":0.5,"Ghost":0,"Steel":0.5},
  "Fire":     {"Fire":0.5,"Water":0.5,"Grass":2,"Ice":2,"Bug":2,"Rock":0.5,"Dragon":0.5,"Steel":2,"Poison":0.5},
  "Water":    {"Fire":2,"Water":0.5,"Grass":0.5,"Ground":2,"Rock":2,"Dragon":0.5},
  "Electric": {"Water":2,"Electric":0.5,"Grass":0.5,"Ground":0,"Flying":2,"Dragon":0.5},
  "Grass":    {"Fire":0.5,"Water":2,"Grass":0.5,"Poison":0.5,"Ground":2,"Flying":0.5,"Bug":0.5,"Rock":2,"Dragon":0.5,"Steel":0.5},
  "Ice":      {"Fire":0.5,"Water":0.5,"Grass":2,"Ice":0.5,"Ground":2,"Flying":2,"Dragon":2,"Steel":0.5},
  "Fighting": {"Normal":2,"Ice":2,"Poison":0.5,"Flying":0.5,"Psychic":0.5,"Bug":1,"Rock":2,"Ghost":0,"Dark":2,"Steel":2,"Fairy":0.5},
  "Poison":   {"Grass":2,"Poison":0.5,"Ground":0.5,"Rock":0.5,"Ghost":0.5,"Steel":0,"Fairy":2},
  "Ground":   {"Fire":2,"Electric":2,"Grass":0.5,"Poison":2,"Flying":0,"Bug":1,"Rock":2,"Steel":2},
  "Flying":   {"Electric":0.5,"Grass":2,"Fighting":2,"Bug":2,"Rock":0.5,"Steel":0.5},
  "Psychic":  {"Fighting":2,"Poison":2,"Psychic":0.5,"Dark":0,"Steel":0.5},
  "Bug":      {"Fire":0.5,"Grass":2,"Fighting":0.5,"Poison":0.5,"Flying":0.5,"Psychic":2,"Ghost":0.5,"Dark":2,"Steel":0.5,"Fairy":0.5},
  "Rock":     {"Fire":2,"Ice":2,"Fighting":0.5,"Ground":0.5,"Flying":2,"Bug":2,"Steel":0.5},
  "Ghost":    {"Normal":0,"Psychic":2,"Ghost":2,"Dark":0.5},
  "Dragon":   {"Dragon":2,"Steel":0.5,"Fairy":0},
  "Dark":     {"Fighting":0.5,"Psychic":2,"Ghost":2,"Dark":0.5,"Fairy":0.5},
  "Steel":    {"Fire":0.5,"Water":0.5,"Electric":0.5,"Ice":2,"Rock":2,"Fairy":2,"Steel":0.5},
  "Fairy":    {"Fire":0.5,"Fighting":2,"Poison":0.5,"Dragon":2,"Dark":2,"Steel":0.5}
};

// Calculate type effectiveness for dual-type defenders
export function calculateTypeEffectiveness(attackType: TypeName, defenderTypes: TypeName[]): number {
  return defenderTypes.reduce((product, defenderType) => {
    // Convert to proper case (first letter uppercase, rest lowercase)
    const normalizedAttackType = attackType.charAt(0).toUpperCase() + attackType.slice(1).toLowerCase() as TypeName;
    const normalizedDefenderType = defenderType.charAt(0).toUpperCase() + defenderType.slice(1).toLowerCase() as TypeName;
    
    const effectiveness = TYPE_CHART[normalizedAttackType]?.[normalizedDefenderType] ?? 1;
    return product * effectiveness;
  }, 1);
}

// Convert stat stages to multipliers
export function getStatStageMultiplier(stage: number): number {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 + Math.abs(stage));
  }
}

// Main damage calculation function
export function calculateDamage({
  level,
  movePower,
  attackStat,
  defenseStat,
  isCrit,
  stab,
  typeEffect,
  weatherMod,
  burnMod,
  otherMods = 1
}: {
  level: number;
  movePower: number;
  attackStat: number;
  defenseStat: number;
  isCrit: boolean;
  stab: number;
  typeEffect: number;
  weatherMod: number;
  burnMod: number;
  otherMods?: number;
}): number {
  // Critical hit multiplier (Gen VI+)
  const crit = isCrit ? 1.5 : 1.0;
  
  // Random factor (85-100%)
  const rand = 0.85 + Math.random() * 0.15;
  
  // Base damage calculation
  const base = Math.floor(
    Math.floor(((2 * level / 5 + 2) * movePower * attackStat / defenseStat) / 50) + 2
  );
  
  // Final modifier
  const modifier = stab * typeEffect * weatherMod * crit * burnMod * rand * otherMods;
  
  // Return damage (minimum 1 if not immune, 0 if immune)
  if (typeEffect === 0) {
    return 0;
  }
  return Math.max(1, Math.floor(base * modifier));
}

// Weather modifiers
export function getWeatherModifier(moveType: TypeName, weather: 'None' | 'Rain' | 'Sun' | 'Sandstorm' | 'Hail'): number {
  switch (weather) {
    case 'Rain':
      return moveType === 'Water' ? 1.5 : moveType === 'Fire' ? 0.5 : 1;
    case 'Sun':
      return moveType === 'Fire' ? 1.5 : moveType === 'Water' ? 0.5 : 1;
    default:
      return 1;
  }
}

// Burn modifier
export function getBurnModifier(isBurned: boolean, isPhysical: boolean, hasGuts: boolean = false): number {
  if (isBurned && isPhysical && !hasGuts) {
    return 0.5;
  }
  return 1;
}

// STAB calculation
export function getStabMultiplier(moveType: TypeName, attackerTypes: TypeName[], hasAdaptability: boolean = false): number {
  const hasStab = attackerTypes.includes(moveType);
  if (!hasStab) return 1;
  return hasAdaptability ? 2.0 : 1.5;
}

// Critical hit chance calculation
export function getCriticalHitChance(baseCritRate: number = 0.0625, hasHighCritMove: boolean = false, hasSuperLuck: boolean = false): boolean {
  let critRate = baseCritRate;
  
  if (hasHighCritMove) {
    critRate = 0.125; // High crit moves like Slash, Cross Chop
  }
  
  if (hasSuperLuck) {
    critRate *= 2; // Super Luck ability doubles crit rate
  }
  
  return Math.random() < critRate;
}

// Comprehensive damage calculation with all modifiers
export function calculateComprehensiveDamage({
  level,
  movePower,
  moveType,
  attackerTypes,
  defenderTypes,
  attackStat,
  defenseStat,
  attackStatStages = 0,
  defenseStatStages = 0,
  isPhysical,
  weather = 'None',
  isBurned = false,
  hasGuts = false,
  hasAdaptability = false,
  hasLifeOrb = false,
  hasExpertBelt = false,
  hasReflect = false,
  hasLightScreen = false,
  isMultiTarget = false,
  terrain = 'None',
  hasTintedLens = false,
  hasFilter = false,
  hasSolidRock = false,
  hasMultiscale = false,
  isFullHp = true,
  hasHugePower = false,
  hasPurePower = false,
  hasSniper = false,
  isHighCritMove = false,
  hasSuperLuck = false
}: {
  level: number;
  movePower: number;
  moveType: TypeName;
  attackerTypes: TypeName[];
  defenderTypes: TypeName[];
  attackStat: number;
  defenseStat: number;
  attackStatStages?: number;
  defenseStatStages?: number;
  isPhysical: boolean;
  weather?: 'None' | 'Rain' | 'Sun' | 'Sandstorm' | 'Hail';
  isBurned?: boolean;
  hasGuts?: boolean;
  hasAdaptability?: boolean;
  hasLifeOrb?: boolean;
  hasExpertBelt?: boolean;
  hasReflect?: boolean;
  hasLightScreen?: boolean;
  isMultiTarget?: boolean;
  terrain?: 'None' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty';
  hasTintedLens?: boolean;
  hasFilter?: boolean;
  hasSolidRock?: boolean;
  hasMultiscale?: boolean;
  isFullHp?: boolean;
  hasHugePower?: boolean;
  hasPurePower?: boolean;
  hasSniper?: boolean;
  isHighCritMove?: boolean;
  hasSuperLuck?: boolean;
}): { damage: number; effectiveness: number; critical: boolean; effectivenessText: string } {
  
  // Apply stat stage modifiers
  const modifiedAttackStat = attackStat * getStatStageMultiplier(attackStatStages);
  const modifiedDefenseStat = defenseStat * getStatStageMultiplier(defenseStatStages);
  
  // Apply ability stat modifiers
  let finalAttackStat = modifiedAttackStat;
  if (hasHugePower || hasPurePower) {
    finalAttackStat *= 2;
  }
  
  // Calculate type effectiveness
  let typeEffect = calculateTypeEffectiveness(moveType, defenderTypes);
  
  // Apply Tinted Lens (doubles not-very-effective damage)
  if (hasTintedLens && typeEffect < 1) {
    typeEffect *= 2;
  }
  
  // Apply Filter/Solid Rock (reduces super-effective damage)
  if ((hasFilter || hasSolidRock) && typeEffect > 1) {
    typeEffect *= 0.75;
  }
  
  // Calculate STAB
  const stab = getStabMultiplier(moveType, attackerTypes, hasAdaptability);
  
  // Calculate weather modifier
  const weatherMod = getWeatherModifier(moveType, weather);
  
  // Calculate burn modifier
  const burnMod = getBurnModifier(isBurned, isPhysical, hasGuts);
  
  // Calculate other modifiers
  let otherMods = 1;
  
  // Life Orb
  if (hasLifeOrb) {
    otherMods *= 1.3;
  }
  
  // Expert Belt (only if super-effective)
  if (hasExpertBelt && typeEffect > 1) {
    otherMods *= 1.2;
  }
  
  // Screens
  if (hasReflect && isPhysical) {
    otherMods *= 0.5;
  }
  if (hasLightScreen && !isPhysical) {
    otherMods *= 0.5;
  }
  
  // Multi-target penalty
  if (isMultiTarget) {
    otherMods *= 0.75;
  }
  
  // Terrain modifiers
  if (terrain === 'Electric' && moveType === 'Electric') {
    otherMods *= 1.3;
  }
  if (terrain === 'Grassy' && moveType === 'Grass') {
    otherMods *= 1.3;
  }
  if (terrain === 'Psychic' && moveType === 'Psychic') {
    otherMods *= 1.3;
  }
  
  // Multiscale/Shadow Shield
  if (hasMultiscale && isFullHp) {
    otherMods *= 0.5;
  }
  
  // Check for critical hit
  const isCrit = getCriticalHitChance(0.0625, isHighCritMove, hasSuperLuck);
  
  // Apply Sniper ability (extra crit damage)
  let critMultiplier = isCrit ? 1.5 : 1.0;
  if (isCrit && hasSniper) {
    critMultiplier = 2.25;
  }
  
  // Calculate final damage
  const damage = calculateDamage({
    level,
    movePower,
    attackStat: finalAttackStat,
    defenseStat: modifiedDefenseStat,
    isCrit,
    stab,
    typeEffect,
    weatherMod,
    burnMod,
    otherMods
  });
  
  // Determine effectiveness text
  let effectivenessText: string;
  if (typeEffect === 0) {
    effectivenessText = 'no_effect';
  } else if (typeEffect >= 2) {
    effectivenessText = 'super_effective';
  } else if (typeEffect <= 0.5) {
    effectivenessText = 'not_very_effective';
  } else {
    effectivenessText = 'normal';
  }
  
  return {
    damage,
    effectiveness: typeEffect,
    critical: isCrit,
    effectivenessText: effectivenessText as 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal'
  };
}
