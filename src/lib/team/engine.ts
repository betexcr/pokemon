import { TYPES, type TypeName } from '@/lib/type/data';
import { calcEffectiveness } from '@/lib/type/utils';
import type { SimplePokemon } from '@/lib/battle/sampleData';

// --- Role Types ---

type PokemonRole =
  | 'Physical Sweeper'
  | 'Special Sweeper'
  | 'Mixed Attacker'
  | 'Physical Wall'
  | 'Special Wall'
  | 'Pivot'
  | 'Support'
  | 'Hazard Setter'
  | 'Hazard Remover'
  | 'Speed Control';

export type AbilitySynergy = {
  pokemon: [string, string];
  abilities: [string, string];
  label: string;
};

export type MoveSynergy = {
  pokemon: string;
  move: string;
  label: string;
};

export type RoleEntry = { pokemon: string; role: PokemonRole };

export type TeamAnalysis = {
  weaknesses: Record<TypeName, number>;
  resistances: Record<TypeName, number>;
  net: Record<TypeName, number>;
  abilitySynergies: AbilitySynergy[];
  moveSynergies: MoveSynergy[];
  roles: RoleEntry[];
  roleWarnings: string[];
};

// --- Ability Synergy Map ---

const WEATHER_SETTERS: Record<string, string[]> = {
  drought: ['chlorophyll', 'flower-gift', 'solar-power', 'leaf-guard', 'harvest'],
  drizzle: ['swift-swim', 'rain-dish', 'hydration', 'dry-skin'],
  'sand-stream': ['sand-rush', 'sand-force', 'sand-veil'],
  'snow-warning': ['slush-rush', 'ice-body', 'snow-cloak'],
};

const TERRAIN_SETTERS: Record<string, string[]> = {
  'electric-surge': ['surge-surfer'],
  'grassy-surge': ['grass-pelt'],
  'psychic-surge': [],
  'misty-surge': [],
};

const PARTNER_COMBOS: [string, string, string][] = [
  ['intimidate', 'defiant', 'Intimidate triggers Defiant boost'],
  ['intimidate', 'competitive', 'Intimidate triggers Competitive boost'],
  ['lightning-rod', 'discharge', 'Lightning Rod redirects Discharge'],
  ['storm-drain', 'surf', 'Storm Drain redirects Surf'],
];

// --- Hazard / Pivot Moves ---

const HAZARD_MOVES = ['stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web'];
const HAZARD_REMOVAL = ['rapid-spin', 'defog', 'court-change', 'tidy-up', 'mortal-spin'];
const PIVOT_MOVES = ['u-turn', 'volt-switch', 'flip-turn', 'teleport', 'parting-shot', 'baton-pass'];
const SPEED_CONTROL_MOVES = ['tailwind', 'trick-room', 'icy-wind', 'electroweb', 'sticky-web', 'thunder-wave'];
const SCREEN_MOVES = ['reflect', 'light-screen', 'aurora-veil'];
const SUPPORT_MOVES = ['wish', 'heal-bell', 'aromatherapy', 'defog', 'toxic', 'will-o-wisp', 'thunder-wave', 'knock-off', ...SCREEN_MOVES];

function norm(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

// --- Core Analysis ---

export function analyzeTeam(team: SimplePokemon[]): TeamAnalysis {
  const weaknesses = {} as Record<TypeName, number>;
  const resistances = {} as Record<TypeName, number>;
  const net = {} as Record<TypeName, number>;

  TYPES.forEach((t) => { weaknesses[t] = 0; resistances[t] = 0; net[t] = 0; });

  team.forEach((p) => {
    if (!p) return;
    TYPES.forEach((atk) => {
      const eff = calcEffectiveness(atk, p.types);
      if (eff > 1) weaknesses[atk] += 1;
      if (eff < 1 && eff > 0) resistances[atk] += 1;
    });
  });

  TYPES.forEach((t) => { net[t] = (resistances[t] || 0) - (weaknesses[t] || 0); });

  const abilitySynergies = detectAbilitySynergies(team);
  const moveSynergies = detectMoveSynergies(team);
  const roles = classifyRoles(team);
  const roleWarnings = checkRoleBalance(team, roles);

  return { weaknesses, resistances, net, abilitySynergies, moveSynergies, roles, roleWarnings };
}

// --- Ability Synergy Detection ---

function detectAbilitySynergies(team: SimplePokemon[]): AbilitySynergy[] {
  const synergies: AbilitySynergy[] = [];
  if (team.length < 2) return synergies;

  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const a = team[i], b = team[j];
      if (!a.abilities || !b.abilities) continue;
      for (const abilA of a.abilities) {
        for (const abilB of b.abilities) {
          const nA = norm(abilA), nB = norm(abilB);

          // Weather setter + beneficiary
          for (const [setter, beneficiaries] of Object.entries(WEATHER_SETTERS)) {
            if (nA === setter && beneficiaries.includes(nB)) {
              synergies.push({ pokemon: [a.name, b.name], abilities: [abilA, abilB], label: `${abilA} powers ${abilB}` });
            }
            if (nB === setter && beneficiaries.includes(nA)) {
              synergies.push({ pokemon: [b.name, a.name], abilities: [abilB, abilA], label: `${abilB} powers ${abilA}` });
            }
          }

          // Terrain setter + beneficiary
          for (const [setter, beneficiaries] of Object.entries(TERRAIN_SETTERS)) {
            if (nA === setter && beneficiaries.includes(nB)) {
              synergies.push({ pokemon: [a.name, b.name], abilities: [abilA, abilB], label: `${abilA} activates ${abilB}` });
            }
            if (nB === setter && beneficiaries.includes(nA)) {
              synergies.push({ pokemon: [b.name, a.name], abilities: [abilB, abilA], label: `${abilB} activates ${abilA}` });
            }
          }

          // Partner combos
          for (const [src, tgt, label] of PARTNER_COMBOS) {
            if (nA === src && nB === tgt) synergies.push({ pokemon: [a.name, b.name], abilities: [abilA, abilB], label });
            if (nB === src && nA === tgt) synergies.push({ pokemon: [b.name, a.name], abilities: [abilB, abilA], label });
          }
        }
      }
    }
  }
  return synergies;
}

// --- Move Synergy Detection ---

function detectMoveSynergies(team: SimplePokemon[]): MoveSynergy[] {
  const synergies: MoveSynergy[] = [];
  const allMoveNames = new Set<string>();
  const moveOwners = new Map<string, string>();

  team.forEach(p => {
    p.moves.forEach(m => {
      const n = norm(m.name);
      allMoveNames.add(n);
      moveOwners.set(n, p.name);
    });
  });

  const hasHazards = HAZARD_MOVES.some(m => allMoveNames.has(m));
  const hasPhazing = ['whirlwind', 'roar', 'dragon-tail', 'circle-throw'].some(m => allMoveNames.has(m));
  if (hasHazards && hasPhazing) {
    const setter = HAZARD_MOVES.find(m => allMoveNames.has(m))!;
    const phaser = ['whirlwind', 'roar', 'dragon-tail', 'circle-throw'].find(m => allMoveNames.has(m))!;
    synergies.push({ pokemon: moveOwners.get(setter)!, move: setter, label: `Hazards + phazing (${phaser}) forces repeated chip damage` });
  }

  // Screens + setup
  const hasScreens = SCREEN_MOVES.some(m => allMoveNames.has(m));
  const setupMoves = ['swords-dance', 'nasty-plot', 'calm-mind', 'dragon-dance', 'quiver-dance', 'bulk-up', 'iron-defense', 'shell-smash'];
  const hasSetup = setupMoves.some(m => allMoveNames.has(m));
  if (hasScreens && hasSetup) {
    const screen = SCREEN_MOVES.find(m => allMoveNames.has(m))!;
    synergies.push({ pokemon: moveOwners.get(screen)!, move: screen, label: 'Screens provide setup opportunities for sweepers' });
  }

  // Trick Room + slow mons
  if (allMoveNames.has('trick-room')) {
    const slowMons = team.filter(p => (p.stats?.speed ?? 999) <= 60);
    if (slowMons.length >= 1) {
      synergies.push({ pokemon: moveOwners.get('trick-room')!, move: 'trick-room', label: `Trick Room benefits slow team members (${slowMons.map(p => p.name).join(', ')})` });
    }
  }

  // Tailwind + fast sweepers
  if (allMoveNames.has('tailwind')) {
    synergies.push({ pokemon: moveOwners.get('tailwind')!, move: 'tailwind', label: 'Tailwind doubles team speed for 4 turns' });
  }

  return synergies;
}

// --- Role Classification ---

function classifyRoles(team: SimplePokemon[]): RoleEntry[] {
  return team.map(p => {
    const role = classifySingle(p);
    return { pokemon: p.name, role };
  });
}

function classifySingle(p: SimplePokemon): PokemonRole {
  const s = p.stats;
  const moveNames = new Set(p.moves.map(m => norm(m.name)));

  if (HAZARD_REMOVAL.some(m => moveNames.has(m))) return 'Hazard Remover';
  if (HAZARD_MOVES.some(m => moveNames.has(m)) && SUPPORT_MOVES.some(m => moveNames.has(m))) return 'Hazard Setter';
  if (PIVOT_MOVES.some(m => moveNames.has(m))) return 'Pivot';
  if (SPEED_CONTROL_MOVES.some(m => moveNames.has(m))) return 'Speed Control';

  const supportCount = p.moves.filter(m => SUPPORT_MOVES.includes(norm(m.name))).length;
  if (supportCount >= 2) return 'Support';

  if (!s) {
    const physicalMoves = p.moves.filter(m => m.damageClass === 'physical');
    const specialMoves = p.moves.filter(m => m.damageClass === 'special');
    if (physicalMoves.length > specialMoves.length) return 'Physical Sweeper';
    if (specialMoves.length > physicalMoves.length) return 'Special Sweeper';
    return 'Mixed Attacker';
  }

  const atk = s.attack, spa = s.specialAttack, def = s.defense, spd = s.specialDefense, spe = s.speed;
  const bulky = (def + spd) / 2;
  const offensive = Math.max(atk, spa);

  if (def >= 100 && def > atk && def > spa) return 'Physical Wall';
  if (spd >= 100 && spd > atk && spd > spa) return 'Special Wall';
  if (bulky > offensive && bulky >= 90) return def >= spd ? 'Physical Wall' : 'Special Wall';

  if (atk > spa + 20 && spe >= 80) return 'Physical Sweeper';
  if (spa > atk + 20 && spe >= 80) return 'Special Sweeper';
  if (Math.abs(atk - spa) <= 20 && (atk >= 80 || spa >= 80)) return 'Mixed Attacker';
  if (atk >= spa) return 'Physical Sweeper';
  return 'Special Sweeper';
}

// --- Role Balance ---

function checkRoleBalance(team: SimplePokemon[], roles: RoleEntry[]): string[] {
  const warnings: string[] = [];
  if (team.length < 3) return warnings;

  const roleSet = new Set(roles.map(r => r.role));
  const moveNames = new Set<string>();
  team.forEach(p => p.moves.forEach(m => moveNames.add(norm(m.name))));

  if (!HAZARD_REMOVAL.some(m => moveNames.has(m))) {
    warnings.push('No hazard removal (Rapid Spin / Defog). Entry hazards will chip your team.');
  }

  if (!PIVOT_MOVES.some(m => moveNames.has(m)) && !roleSet.has('Pivot')) {
    warnings.push('No pivoting moves (U-turn, Volt Switch, Flip Turn). Consider adding momentum options.');
  }

  const sweepers = roles.filter(r => r.role.includes('Sweeper') || r.role === 'Mixed Attacker');
  const walls = roles.filter(r => r.role.includes('Wall'));
  if (sweepers.length === team.length) {
    warnings.push('All-out offense with no defensive backbone. Add a bulky Pokemon for longevity.');
  }
  if (walls.length === team.length) {
    warnings.push('Very defensive team with limited offensive pressure. Add a sweeper or wallbreaker.');
  }

  const physOnly = sweepers.every(r => r.role === 'Physical Sweeper');
  const specOnly = sweepers.every(r => r.role === 'Special Sweeper');
  if (sweepers.length >= 2 && physOnly) {
    warnings.push('All attackers are physical. Consider a special attacker to break physical walls.');
  }
  if (sweepers.length >= 2 && specOnly) {
    warnings.push('All attackers are special. Consider a physical attacker to break special walls.');
  }

  return warnings;
}

// --- Suggestions ---

export function suggestImprovements(analysis: TeamAnalysis): string[] {
  const totalWeak = Object.values(analysis.weaknesses).reduce((a, b) => a + (b || 0), 0);
  const totalRes = Object.values(analysis.resistances).reduce((a, b) => a + (b || 0), 0);
  if (totalWeak === 0 && totalRes === 0) {
    return ['Add a Pokemon to start receiving suggestions about weaknesses and coverage.'];
  }

  const tips: string[] = [];

  // Type weakness tips
  const weakSorted = Object.entries(analysis.weaknesses)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .filter(([, v]) => v > 0);

  const counters: Record<TypeName, string[]> = {
    Normal: ['Fighting'], Fire: ['Water', 'Rock', 'Ground'], Water: ['Grass', 'Electric'],
    Grass: ['Fire', 'Flying', 'Ice', 'Bug', 'Poison'], Electric: ['Ground'],
    Ice: ['Fire', 'Fighting', 'Rock', 'Steel'], Fighting: ['Psychic', 'Flying', 'Fairy'],
    Poison: ['Ground', 'Psychic'], Ground: ['Water', 'Grass', 'Ice'],
    Flying: ['Electric', 'Rock', 'Ice'], Psychic: ['Bug', 'Ghost', 'Dark'],
    Bug: ['Fire', 'Flying', 'Rock'], Rock: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'],
    Ghost: ['Ghost', 'Dark'], Dragon: ['Ice', 'Dragon', 'Fairy'],
    Dark: ['Fighting', 'Bug', 'Fairy'], Steel: ['Fire', 'Fighting', 'Ground'],
    Fairy: ['Poison', 'Steel'],
  } as Record<TypeName, string[]>;

  for (const [type, count] of weakSorted) {
    const c = counters[type as TypeName] || [];
    tips.push(`Your team has ${count} weakness(es) to ${type}. Consider adding ${c.slice(0, 2).join(' or ') || 'a resist'} coverage.`);
  }

  // Ability synergy tips
  for (const syn of analysis.abilitySynergies) {
    tips.push(`Synergy: ${syn.pokemon[0]} + ${syn.pokemon[1]} — ${syn.label}.`);
  }

  // Move synergy tips
  for (const syn of analysis.moveSynergies) {
    tips.push(`Combo: ${syn.label}.`);
  }

  // Role warnings
  for (const w of analysis.roleWarnings) {
    tips.push(w);
  }

  if (tips.length === 0) tips.push('Nice balance! No major issues detected.');
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
