import { TYPES, type TypeName } from '@/lib/type/data';
import { calcEffectiveness } from '@/lib/type/utils';
import type { SimplePokemon } from '@/lib/battle/sampleData';

export type TeamAnalysis = {
  weaknesses: Record<TypeName, number>;
  resistances: Record<TypeName, number>;
  net: Record<TypeName, number>; // resistances - weaknesses
};

export function analyzeTeam(team: SimplePokemon[]): TeamAnalysis {
  console.log('analyzeTeam called with team:', team.map(p => ({ name: p.name, types: p.types })));
  
  const weaknesses = {} as Record<TypeName, number>;
  const resistances = {} as Record<TypeName, number>;
  const net = {} as Record<TypeName, number>;

  TYPES.forEach((t) => {
    weaknesses[t] = 0;
    resistances[t] = 0;
    net[t] = 0;
  });

  team.forEach((p) => {
    if (!p) {
      console.log('Skipping null Pokemon');
      return;
    }
    
    console.log(`Analyzing ${p.name} with types:`, p.types);
    
    TYPES.forEach((atk) => {
      const eff = calcEffectiveness(atk, p.types);
      console.log(`Effectiveness of ${atk} vs ${p.types.join('/')}: ${eff}`);
      if (eff > 1) weaknesses[atk] += 1;
      if (eff < 1 && eff > 0) resistances[atk] += 1;
    });
  });

  TYPES.forEach((t) => {
    net[t] = (resistances[t] || 0) - (weaknesses[t] || 0);
  });

  const result = { weaknesses, resistances, net };
  console.log('Analysis result:', result);
  return result;
}

export function suggestImprovements(analysis: TeamAnalysis): string[] {
  // If there is no data (all zeros), prompt user to add Pokémon
  const totalWeak = Object.values(analysis.weaknesses).reduce((a, b) => a + (b || 0), 0)
  const totalRes = Object.values(analysis.resistances).reduce((a, b) => a + (b || 0), 0)
  if (totalWeak === 0 && totalRes === 0) {
    return [
      'Add a Pokémon to start receiving suggestions about weaknesses and coverage.'
    ]
  }
  // Find the top 3 most exposed weaknesses
  const weakSorted = Object.entries(analysis.weaknesses)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .filter(([, v]) => v > 0);

  const counters: Record<TypeName, string[]> = {
    Normal: ['Fighting'],
    Fire: ['Water', 'Rock', 'Ground'],
    Water: ['Grass', 'Electric'],
    Grass: ['Fire', 'Flying', 'Ice', 'Bug', 'Poison'],
    Electric: ['Ground'],
    Ice: ['Fire', 'Fighting', 'Rock', 'Steel'],
    Fighting: ['Psychic', 'Flying', 'Fairy'],
    Poison: ['Ground', 'Psychic'],
    Ground: ['Water', 'Grass', 'Ice'],
    Flying: ['Electric', 'Rock', 'Ice'],
    Psychic: ['Bug', 'Ghost', 'Dark'],
    Bug: ['Fire', 'Flying', 'Rock'],
    Rock: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'],
    Ghost: ['Ghost', 'Dark'],
    Dragon: ['Ice', 'Dragon', 'Fairy'],
    Dark: ['Fighting', 'Bug', 'Fairy'],
    Steel: ['Fire', 'Fighting', 'Ground'],
    Fairy: ['Poison', 'Steel'],
  } as Record<TypeName, string[]>;

  const tips: string[] = [];
  for (const [type, count] of weakSorted) {
    const c = counters[type as TypeName] || [];
    tips.push(`Your team has ${count} weakness(es) to ${type}. Consider adding ${c.slice(0, 2).join(' or ') || 'a resist'} coverage.`);
  }

  if (tips.length === 0) tips.push('Nice balance! No major shared weaknesses detected.');
  return tips;
}

export function offensiveCoverage(team: SimplePokemon[]): Record<TypeName, number> {
  const cover = {} as Record<TypeName, number>;
  TYPES.forEach((t) => (cover[t] = 0));
  team.forEach((p) => {
    p.moves.forEach((m) => {
      TYPES.forEach((def) => {
        const eff = calcEffectiveness(m.type, [def]);
        if (eff > 1) cover[def] += 1;
      });
    });
  });
  return cover;
}
