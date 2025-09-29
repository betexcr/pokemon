import { typeChart } from "./typeChart.js";

const allTypes = [
  "Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground",
  "Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"
];

export function getMatchup(defTypes) {
  if (typeof defTypes === "string") defTypes = [defTypes];
  if (!Array.isArray(defTypes) || defTypes.length < 1 || defTypes.length > 2) {
    throw new Error("Provide 1 or 2 defending types");
  }

  const results = {};

  for (const atk of allTypes) {
    let mult = 1;
    for (const def of defTypes) {
      const eff = typeChart[atk]?.[def] ?? 1; // default neutral
      mult *= eff;
    }
    results[atk] = mult;
  }

  return {
    x4: Object.keys(results).filter(t => results[t] === 4),
    x2: Object.keys(results).filter(t => results[t] === 2),
    x0_5: Object.keys(results).filter(t => results[t] === 0.5),
    x0_25: Object.keys(results).filter(t => results[t] === 0.25),
    x0: Object.keys(results).filter(t => results[t] === 0),
  };
}
