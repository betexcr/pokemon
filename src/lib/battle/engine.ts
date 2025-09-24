import { calcEffectiveness } from '@/lib/type/utils';
import type { SimplePokemon, Move } from './sampleData';

export function calcDamage(attacker: SimplePokemon, defender: SimplePokemon, move: Move): { damage: number; effectiveness: number } {
  const eff = calcEffectiveness(move.type, defender.types);
  const base = move.power;
  const damage = Math.max(1, Math.floor(base * eff));
  return { damage, effectiveness: eff };
}

export function effectivenessText(eff: number): string {
  if (eff === 0) return "It doesn't affect the foe…";
  if (eff >= 4) return "It's devastatingly effective!";
  if (eff === 2) return "It's super effective!";
  if (eff === 0.5) return "It's not very effective…";
  if (eff <= 0.25) return "It barely had any effect…";
  return 'It had a normal effect.';
}

