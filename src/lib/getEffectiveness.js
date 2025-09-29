import { typeChart } from "./typeChart.js";

const allTypes = [
  "Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground",
  "Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"
];

export function getEffectiveness(attackingType) {
  if (!allTypes.includes(attackingType)) {
    throw new Error("Invalid attacking type");
  }

  const results = {};

  for (const def of allTypes) {
    const mult = typeChart[attackingType]?.[def] ?? 1; // default neutral
    results[def] = mult;
  }

  return {
    x2: Object.keys(results).filter(t => results[t] === 2),
    x0_5: Object.keys(results).filter(t => results[t] === 0.5),
    x0_25: Object.keys(results).filter(t => results[t] === 0.25),
    x0: Object.keys(results).filter(t => results[t] === 0),
    x1: Object.keys(results).filter(t => results[t] === 1),
  };
}