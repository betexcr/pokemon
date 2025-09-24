import { TYPE_CHART, TYPES, type TypeName } from './data';

export function calcEffectiveness(attacker: TypeName, defenders: TypeName[]): number {
  const result = defenders.reduce((mult, def) => {
    const chart = TYPE_CHART[attacker];
    const val = chart?.[def] ?? 1;
    console.log(`calcEffectiveness: ${attacker} vs ${def} = ${val} (chart: ${chart?.[def]})`);
    return mult * val;
  }, 1);
  console.log(`calcEffectiveness final: ${attacker} vs [${defenders.join(',')}] = ${result}`);
  return result;
}

export type CategoryBuckets = {
  immune: TypeName[];
  notVery: TypeName[]; // 0.5
  neutral: TypeName[]; // 1
  super: TypeName[]; // 2 (or >2)
};

export function categorize(attacker: TypeName, defenders: TypeName[] = []): CategoryBuckets {
  const immune: TypeName[] = [];
  const notVery: TypeName[] = [];
  const neutral: TypeName[] = [];
  const superEff: TypeName[] = [];

  for (const t of TYPES) {
    const m = calcEffectiveness(attacker, defenders.length ? defenders : [t]);
    if (m === 0) immune.push(t);
    else if (m < 1) notVery.push(t);
    else if (m > 1) superEff.push(t);
    else neutral.push(t);
  }
  return { immune, notVery, neutral, super: superEff };
}

export function parseTypesCSV(csv?: string | null): TypeName[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is TypeName => (TYPES as readonly string[]).includes(s));
}

