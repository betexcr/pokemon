// Public, display-ready summary of everything in effect on the field: weather / terrain / rooms, each
// side's screens, hazards and pending effects, and each active Pokémon's visible conditions (Substitute,
// confusion, trapping, Taunt, Encore, Perish Song, charged, Stellar Tera, ...). Only information both
// players can see in the games is included (no PP, no choice locks, no held items). Multiplayer publishes
// it as `public/conditions`; offline battles project it the same way.

import type { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { isTrapped } from './team-battle-held-items';

export type ConditionTag = {
  id: string;
  label: string;
  /** Turns left, when the effect has a timer. */
  turns?: number;
  tone: 'good' | 'bad' | 'neutral';
};

export type BattleConditions = { field: ConditionTag[]; p1: ConditionTag[]; p2: ConditionTag[] };

const WEATHER_LABEL: Record<string, string> = { sun: 'Harsh sunlight', rain: 'Rain', sandstorm: 'Sandstorm', snow: 'Snow' };
const TERRAIN_LABEL: Record<string, string> = { electric: 'Electric Terrain', grassy: 'Grassy Terrain', misty: 'Misty Terrain', psychic: 'Psychic Terrain' };

const tag = (id: string, label: string, tone: ConditionTag['tone'], turns?: number): ConditionTag =>
  typeof turns === 'number' && turns > 0 ? { id, label, tone, turns } : { id, label, tone };

function sideTags(team: BattleTeam): ConditionTag[] {
  const out: ConditionTag[] = [];
  const sc = team.sideConditions;
  const s = sc.screens ?? {};
  if (s.reflect) out.push(tag('reflect', 'Reflect', 'good', s.reflect.turns));
  if (s.lightScreen) out.push(tag('light-screen', 'Light Screen', 'good', s.lightScreen.turns));
  if (s.auroraVeil) out.push(tag('aurora-veil', 'Aurora Veil', 'good', s.auroraVeil.turns));
  const tailwind = s.tailwind ?? sc.tailwind;
  if (tailwind) out.push(tag('tailwind', 'Tailwind', 'good', tailwind.turns));
  if (s.safeguard) out.push(tag('safeguard', 'Safeguard', 'good', s.safeguard.turns));
  if (s.mist) out.push(tag('mist', 'Mist', 'good', s.mist.turns));
  if (sc.luckyChant) out.push(tag('lucky-chant', 'Lucky Chant', 'good', sc.luckyChant.turns));
  const h = sc.hazards;
  if (h?.stealthRock) out.push(tag('stealth-rock', 'Stealth Rock', 'bad'));
  if (h?.spikes) out.push(tag('spikes', h.spikes > 1 ? `Spikes ×${h.spikes}` : 'Spikes', 'bad'));
  if (h?.toxicSpikes) out.push(tag('toxic-spikes', h.toxicSpikes > 1 ? `Toxic Spikes ×${h.toxicSpikes}` : 'Toxic Spikes', 'bad'));
  if (h?.stickyWeb) out.push(tag('sticky-web', 'Sticky Web', 'bad'));
  if (sc.futureAttack) {
    out.push(tag('future-attack', sc.futureAttack.move === 'doom-desire' ? 'Doom Desire incoming' : 'Future Sight incoming', 'bad', sc.futureAttack.turns));
  }
  if (sc.healingWish) out.push(tag('healing-wish', sc.healingWish === 'lunar-dance' ? 'Lunar Dance' : 'Healing Wish', 'good'));
  return out;
}

function activeTags(mon: BattlePokemon | undefined, foe: BattlePokemon | undefined): ConditionTag[] {
  if (!mon || mon.currentHp <= 0) return [];
  const v = mon.volatile ?? {};
  const out: ConditionTag[] = [];
  if (mon.terastallized && mon.teraType) {
    out.push(tag('tera', mon.teraType === 'stellar' ? 'Tera Stellar' : `Tera ${mon.teraType.charAt(0).toUpperCase()}${mon.teraType.slice(1)}`, 'neutral'));
  }
  if (v.substitute) out.push(tag('substitute', 'Substitute', 'good'));
  if (v.protect?.active) out.push(tag('protect', v.protect.kind === 'endure' ? 'Enduring' : 'Protected', 'good'));
  if (v.charged) out.push(tag('charged', 'Charged', 'good'));
  if (v.stockpile?.count) out.push(tag('stockpile', `Stockpile ×${v.stockpile.count}`, 'good'));
  if (v.aquaRing) out.push(tag('aqua-ring', 'Aqua Ring', 'good'));
  if (v.confusion) out.push(tag('confusion', 'Confused', 'bad'));
  if (v.infatuated) out.push(tag('infatuated', 'Infatuated', 'bad'));
  if (v.leechSeed) out.push(tag('leech-seed', 'Leech Seed', 'bad'));
  if (v.cursed) out.push(tag('curse', 'Cursed', 'bad'));
  if (v.saltCure) out.push(tag('salt-cure', 'Salt Cure', 'bad'));
  if (v.syrupBomb) out.push(tag('syrup-bomb', 'Sticky syrup', 'bad', v.syrupBomb.turns));
  if (v.tarShot) out.push(tag('tar-shot', 'Tar Shot', 'bad'));
  if (v.smackedDown) out.push(tag('smacked-down', 'Grounded', 'bad'));
  if (v.perishSong) out.push(tag('perish-song', `Perish ${v.perishSong.turns}`, 'bad'));
  if (v.yawn) out.push(tag('yawn', 'Drowsy', 'bad'));
  if (v.taunt) out.push(tag('taunt', 'Taunted', 'bad', v.taunt.turns));
  if (v.encore) out.push(tag('encore', 'Encore', 'bad', v.encore.turns));
  if (v.disable) out.push(tag('disable', `${v.disable.move} disabled`, 'bad', v.disable.turns));
  if (v.torment) out.push(tag('torment', 'Tormented', 'bad'));
  if (v.throatChop) out.push(tag('throat-chop', 'Throat Chop', 'bad', v.throatChop.turns));
  if (v.imprisonedMoves?.length) out.push(tag('imprison', 'Imprisoned', 'bad'));
  if (v.binding) out.push(tag('binding', v.binding.kind, 'bad', v.binding.turnsLeft));
  if (v.glaiveRush) out.push(tag('glaive-rush', 'Glaive Rush', 'bad'));
  if (v.slowStart) out.push(tag('slow-start', 'Slow Start', 'bad', v.slowStart));
  if (v.mustRecharge) out.push(tag('recharge', 'Must recharge', 'bad'));
  if (!v.binding && isTrapped(mon, foe)) out.push(tag('trapped', "Can't escape", 'bad'));
  return out;
}

export function describeBattleConditions(state: Pick<BattleState, 'player' | 'opponent' | 'field'>): BattleConditions {
  const field: ConditionTag[] = [];
  const w = state.field.weather;
  if (w?.kind && WEATHER_LABEL[w.kind]) field.push(tag(`weather-${w.kind}`, WEATHER_LABEL[w.kind], 'neutral', w.turns));
  const t = state.field.terrain;
  if (t?.kind && TERRAIN_LABEL[t.kind]) field.push(tag(`terrain-${t.kind}`, TERRAIN_LABEL[t.kind], 'neutral', t.turns));
  const r = state.field.rooms ?? {};
  if (r.trickRoom) field.push(tag('trick-room', 'Trick Room', 'neutral', r.trickRoom.turns));
  if (r.magicRoom) field.push(tag('magic-room', 'Magic Room', 'neutral', r.magicRoom.turns));
  if (r.wonderRoom) field.push(tag('wonder-room', 'Wonder Room', 'neutral', r.wonderRoom.turns));
  if (r.gravity) field.push(tag('gravity', 'Gravity', 'neutral', r.gravity.turns));
  if (r.fairyLock) field.push(tag('fairy-lock', 'Fairy Lock', 'neutral', r.fairyLock.turns));
  const p1Active = state.player.pokemon[state.player.currentIndex];
  const p2Active = state.opponent.pokemon[state.opponent.currentIndex];
  return {
    field,
    p1: [...activeTags(p1Active, p2Active), ...sideTags(state.player)],
    p2: [...activeTags(p2Active, p1Active), ...sideTags(state.opponent)],
  };
}
