// In-battle form changes driven by abilities. Base stats are fixed per form (HP never changes),
// so they are tabled here instead of fetched. The original data is restored on switch-out.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { abilityOf } from './team-battle-ability-rules';

type StatLine = { attack: number; defense: number; 'special-attack': number; 'special-defense': number; speed: number };

const FORMS: Record<string, { stats: StatLine; types?: string[]; message: string }> = {
  'aegislash-blade': { stats: { attack: 140, defense: 50, 'special-attack': 140, 'special-defense': 50, speed: 60 }, message: 'Changed to Blade Forme!' },
  'aegislash-shield': { stats: { attack: 50, defense: 140, 'special-attack': 50, 'special-defense': 140, speed: 60 }, message: 'Changed to Shield Forme!' },
  'darmanitan-zen': {
    stats: { attack: 30, defense: 105, 'special-attack': 140, 'special-defense': 105, speed: 55 },
    types: ['fire', 'psychic'],
    message: 'Zen Mode triggered!',
  },
  'wishiwashi-school': { stats: { attack: 140, defense: 130, 'special-attack': 140, 'special-defense': 135, speed: 30 }, message: 'formed a school!' },
};

function currentForm(mon: BattlePokemon): string | undefined {
  return mon.volatile.formChange?.form;
}

/** Switch `mon` to `form` (no-op if already there). Returns true when it changed. */
export function setForm(state: BattleState, mon: BattlePokemon, form: string): boolean {
  if (currentForm(mon) === form) return false;
  const def = FORMS[form];
  if (!def) return false;
  if (!mon.volatile.formChange) {
    mon.volatile.formChange = { form, types: mon.pokemon.types, stats: mon.pokemon.stats };
  } else {
    mon.volatile.formChange.form = form;
  }
  const original = mon.volatile.formChange;
  const stats = (original.stats ?? []).map((s: any) => {
    const name = s.stat?.name || s.name;
    return name in def.stats ? { ...s, base_stat: def.stats[name as keyof StatLine] } : s;
  });
  mon.pokemon = {
    ...mon.pokemon,
    stats,
    types: def.types ? (def.types.map((t, i) => ({ slot: i + 1, type: { name: t, url: '' } })) as any) : original.types,
  };
  const message = def.message.startsWith('formed') ? `${mon.pokemon.name} ${def.message}` : def.message;
  state.battleLog.push({ type: 'status_effect', message, pokemon: mon.pokemon.name });
  return true;
}

/** Back to the original form mid-battle (Zen Mode / Schooling ending). */
export function clearForm(state: BattleState, mon: BattlePokemon, message: string): void {
  const fc = mon.volatile.formChange;
  if (!fc) return;
  mon.pokemon = { ...mon.pokemon, types: fc.types, stats: fc.stats };
  delete mon.volatile.formChange;
  state.battleLog.push({ type: 'status_effect', message, pokemon: mon.pokemon.name });
}

const isSpecies = (mon: BattlePokemon, species: string) => mon.pokemon.name.toLowerCase().startsWith(species);

/** Stance Change: attacking moves switch to Blade Forme, King's Shield back to Shield Forme. */
export function applyStanceChange(state: BattleState, mon: BattlePokemon, moveId: string, category: string): void {
  if (abilityOf(mon) !== 'stance-change' || !isSpecies(mon, 'aegislash')) return;
  const id = moveId.toLowerCase();
  if (id === 'kings-shield' || id === 'king-s-shield') {
    if (currentForm(mon) === 'aegislash-blade') setForm(state, mon, 'aegislash-shield');
  } else if (category !== 'Status') {
    setForm(state, mon, 'aegislash-blade');
  }
}

/** Zen Mode (at or below half HP) and Schooling (above 1/4 HP, level 20+), checked on entry and at end of turn. */
export function updateHpForms(state: BattleState, mon: BattlePokemon): void {
  if (mon.currentHp <= 0) return;
  const ability = abilityOf(mon);
  if (ability === 'zen-mode' && isSpecies(mon, 'darmanitan')) {
    const low = mon.currentHp <= mon.maxHp / 2;
    if (low && currentForm(mon) !== 'darmanitan-zen') setForm(state, mon, 'darmanitan-zen');
    else if (!low && currentForm(mon) === 'darmanitan-zen') clearForm(state, mon, 'Zen Mode ended!');
  }
  if (ability === 'schooling' && isSpecies(mon, 'wishiwashi') && mon.level >= 20) {
    const strong = mon.currentHp > mon.maxHp / 4;
    if (strong && currentForm(mon) !== 'wishiwashi-school') setForm(state, mon, 'wishiwashi-school');
    else if (!strong && currentForm(mon) === 'wishiwashi-school') clearForm(state, mon, `${mon.pokemon.name} stopped schooling!`);
  }
}

/** Eiscue's two faces; Noice Face persists through switching until snow restores Ice Face. */
const EISCUE_FACES = {
  ice: { defense: 110, 'special-defense': 90, speed: 50 },
  noice: { defense: 70, 'special-defense': 50, speed: 130 },
} as const;

/** Swap Eiscue's base stats for its current face (no-op for other species). */
export function applyIceFaceStats(mon: BattlePokemon, face: 'ice' | 'noice'): void {
  if (!isSpecies(mon, 'eiscue')) return;
  const line = EISCUE_FACES[face];
  const swap = (stats: BattlePokemon['pokemon']['stats']) =>
    (stats ?? []).map((s: any) => {
      const name = s.stat?.name || s.name;
      return name in line ? { ...s, base_stat: line[name as keyof typeof line] } : s;
    });
  mon.pokemon = { ...mon.pokemon, stats: swap(mon.pokemon.stats) };
  // Keep a Transform / form snapshot (restored on switch-out) in the same face
  if (mon.volatile.formChange) mon.volatile.formChange.stats = swap(mon.volatile.formChange.stats);
}
