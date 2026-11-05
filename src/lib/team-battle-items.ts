import { effectiveItem } from './battle-item-access';
import { changeStatStage } from './team-battle-stat-stages';
import { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { clearStatus } from './team-battle-status';
import { rngNextInt, rngRollChance } from './battle-rng';

function teamHasUnnerveOnField(team: BattleTeam): boolean {
  return team.pokemon.some(
    (p) => p.currentHp > 0 && ['unnerve', 'as-one-glastrier', 'as-one-spectrier'].includes(p.currentAbility?.toLowerCase() ?? '')
  );
}

/** Berries that cure one status (or confusion). */
export const STATUS_CURE_BERRIES: Record<string, Array<NonNullable<BattlePokemon['status']>> | 'confusion'> = {
  'cheri-berry': ['paralyzed'],
  'chesto-berry': ['asleep'],
  'pecha-berry': ['poisoned', 'badly-poisoned'],
  'rawst-berry': ['burned'],
  'aspear-berry': ['frozen'],
  'persim-berry': 'confusion',
};

/** Berries that heal 1/3 max HP at 1/4 HP. */
export const THIRD_HEAL_BERRIES: ReadonlySet<string> = new Set(['figy-berry', 'wiki-berry', 'mago-berry', 'aguav-berry', 'iapapa-berry']);

export const STAT_BOOST_BERRIES: Record<string, keyof BattlePokemon['statModifiers']> = {
  'liechi-berry': 'attack',
  'ganlon-berry': 'defense',
  'salac-berry': 'speed',
  'petaya-berry': 'specialAttack',
  'apicot-berry': 'specialDefense',
};

export const TYPE_RESIST_BERRIES: Record<string, string> = {
  'occa-berry': 'fire',
  'passho-berry': 'water',
  'wacan-berry': 'electric',
  'rindo-berry': 'grass',
  'yache-berry': 'ice',
  'chople-berry': 'fighting',
  'kebia-berry': 'poison',
  'shuca-berry': 'ground',
  'coba-berry': 'flying',
  'payapa-berry': 'psychic',
  'tanga-berry': 'bug',
  'charti-berry': 'rock',
  'kasib-berry': 'ghost',
  'haban-berry': 'dragon',
  'colbur-berry': 'dark',
  'babiri-berry': 'steel',
  'roseli-berry': 'fairy',
  'chilan-berry': 'normal',
};

/** Ripen doubles what a berry does. */
const ripen = (mon: BattlePokemon) => (mon.currentAbility?.toLowerCase() === 'ripen' ? 2 : 1);

/** Cheek Pouch heals 1/3 after eating a berry; Cud Chew eats it again at the end of the next turn. */
function afterBerryEaten(state: Pick<BattleState, 'battleLog'> | undefined, mon: BattlePokemon, berry: string, repeat = false) {
  const ability = mon.currentAbility?.toLowerCase();
  if (ability === 'cheek-pouch' && state && mon.currentHp > 0 && mon.currentHp < mon.maxHp) {
    const before = mon.currentHp;
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + Math.floor(mon.maxHp / 3));
    state.battleLog.push({ type: 'healing', message: `${mon.pokemon.name} restored HP with Cheek Pouch!`, pokemon: mon.pokemon.name, healing: Math.round(((mon.currentHp - before) / mon.maxHp) * 100) });
  }
  if (ability === 'cud-chew' && !repeat) mon.volatile.cudChew = { berry, turns: 1 };
}

function consumeItem(target: BattlePokemon, state?: Pick<BattleState, 'battleLog'>) {
  const item = target.heldItem;
  target.volatile.lastConsumedBerry = target.heldItem;
  if (target.heldItem?.endsWith('-berry')) target.ateBerry = true;
  target.consumedItem = target.heldItem;
  target.volatile.consumedThisTurn = true;
  target.heldItem = undefined;
  if (item?.endsWith('-berry')) afterBerryEaten(state, target, item);
  if (target.currentAbility?.toLowerCase() === 'unburden') {
    target.volatile.unburdenActive = true;
  }
}

/** Clear held item (Knock Off etc.) and activate Unburden if applicable. */
export function removeHeldItem(target: BattlePokemon): string | undefined {
  const removed = target.heldItem;
  if (!removed) return undefined;
  target.heldItem = undefined;
  if (target.currentAbility?.toLowerCase() === 'unburden') {
    target.volatile.unburdenActive = true;
  }
  return removed;
}

export function tryConsumeBerry(
  state: BattleState,
  target: BattlePokemon,
  targetSide: 'player' | 'opponent'
): void {
  const item = effectiveItem(target);
  if (!item || target.currentHp <= 0) return;

  const foe = targetSide === 'player' ? state.opponent : state.player;
  if (teamHasUnnerveOnField(foe)) {
    return;
  }

  // Sitrus Berry: restore 25% HP when below 50%
  if (item === 'sitrus-berry') {
    const threshold = Math.floor(target.maxHp / 2);
    if (target.currentHp <= threshold) {
      const heal = Math.floor((target.maxHp / 4) * ripen(target));
      target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
      consumeItem(target, state);
      state.battleLog.push({
        type: 'healing',
        message: `${target.pokemon.name} restored HP with its Sitrus Berry!`,
        pokemon: target.pokemon.name,
        healing: Math.round((heal / target.maxHp) * 100),
      });
    }
    return;
  }

  // Oran Berry: restore 10 HP when at or below 50% max HP
  if (item === 'oran-berry') {
    const threshold = Math.floor(target.maxHp / 2);
    if (target.currentHp <= threshold) {
      const heal = Math.min(10, target.maxHp - target.currentHp);
      if (heal > 0) {
        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
        consumeItem(target, state);
        state.battleLog.push({
          type: 'healing',
          message: `${target.pokemon.name} restored HP with its Oran Berry!`,
          pokemon: target.pokemon.name,
          healing: Math.round((heal / target.maxHp) * 100),
        });
      }
    }
    return;
  }

  // Lum Berry: cure any status
  if (item === 'lum-berry') {
    if (target.status) {
      const cured = target.status;
      clearStatus(target);
      consumeItem(target, state);
      state.battleLog.push({
        type: 'status_effect',
        message: `${target.pokemon.name}'s Lum Berry cured its ${cured}!`,
        pokemon: target.pokemon.name,
      });
    }
    if (target.volatile.confusion) {
      target.volatile.confusion = undefined;
      if (target.heldItem) {
        consumeItem(target, state);
        state.battleLog.push({
          type: 'status_effect',
          message: `${target.pokemon.name}'s Lum Berry cured its confusion!`,
          pokemon: target.pokemon.name,
        });
      }
    }
    return;
  }

  // Status-curing berries
  const cure = STATUS_CURE_BERRIES[item];
  if (cure) {
    if (cure === 'confusion') {
      if (!target.volatile.confusion) return;
      target.volatile.confusion = undefined;
    } else {
      if (!target.status || !cure.includes(target.status)) return;
      clearStatus(target);
    }
    consumeItem(target, state);
    state.battleLog.push({
      type: 'status_effect',
      message: `${target.pokemon.name}'s ${formatBerryName(item)} cured its ${cure === 'confusion' ? 'confusion' : 'status'}!`,
      pokemon: target.pokemon.name,
    });
    return;
  }

  // Leppa Berry: restores 10 PP to a move that ran out
  if (item === 'leppa-berry') {
    const empty = target.moves.find((m) => m.pp <= 0);
    if (!empty) return;
    empty.pp = Math.min(empty.maxPp, empty.pp + 10);
    consumeItem(target, state);
    state.battleLog.push({ type: 'status_effect', message: `${target.pokemon.name} restored PP to ${empty.id} with its Leppa Berry!`, pokemon: target.pokemon.name });
    return;
  }

  // Gluttony eats pinch berries at half HP
  const gluttony = target.currentAbility?.toLowerCase() === 'gluttony';
  const atQuarter = target.currentHp <= Math.floor(target.maxHp / (gluttony ? 2 : 4));

  // Figy / Wiki / Mago / Aguav / Iapapa: heal 1/3 at 1/4 HP
  if (THIRD_HEAL_BERRIES.has(item)) {
    if (!atQuarter) return;
    const heal = Math.floor((target.maxHp / 3) * ripen(target));
    target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
    consumeItem(target, state);
    state.battleLog.push({
      type: 'healing',
      message: `${target.pokemon.name} restored HP with its ${formatBerryName(item)}!`,
      pokemon: target.pokemon.name,
      healing: Math.round((heal / target.maxHp) * 100),
    });
    return;
  }

  // Lansat (+2 crit stages), Starf (a random stat +2), Micle (next move's accuracy x1.2) at 1/4 HP
  if (item === 'lansat-berry' || item === 'starf-berry' || item === 'micle-berry') {
    if (!atQuarter) return;
    consumeItem(target, state);
    if (item === 'lansat-berry') {
      target.volatile.critBoost = 2;
      state.battleLog.push({ type: 'status_effect', message: `${target.pokemon.name} used its Lansat Berry to get pumped!`, pokemon: target.pokemon.name });
    } else if (item === 'micle-berry') {
      target.volatile.micleBoost = true;
      state.battleLog.push({ type: 'status_effect', message: `${target.pokemon.name} boosted the accuracy of its next move using its Micle Berry!`, pokemon: target.pokemon.name });
    } else {
      const stats = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const;
      const open = stats.filter((st) => target.statModifiers[st] < 6);
      if (open.length) changeStatStage(state, target, open[rngNextInt(state.rng, open.length)], 2, { reason: 'thanks to its Starf Berry' });
    }
    return;
  }

  // Stat-boosting berries: +1 stat at 25% HP
  if (item in STAT_BOOST_BERRIES) {
    if (atQuarter) {
      const stat = STAT_BOOST_BERRIES[item];
      consumeItem(target, state);
      changeStatStage(state, target, stat, ripen(target), { reason: `thanks to its ${formatBerryName(item)}` });
    }
    return;
  }
}

/**
 * Berries that react to being hit (after damage): Kee (+1 Def on a physical hit), Maranga (+1 Sp. Def on a
 * special hit), Jaboca / Rowap (attacker loses 1/8 on a physical / special hit), Enigma (heal 1/4 on a
 * super-effective hit). Unnerve blocks them.
 */
export function applyOnHitBerries(
  state: BattleState,
  attacker: BattlePokemon,
  target: BattlePokemon,
  targetSide: 'player' | 'opponent',
  category: string,
  effectiveness: number,
): void {
  const item = effectiveItem(target);
  if (!item || target.currentHp <= 0) return;
  const foe = targetSide === 'player' ? state.opponent : state.player;
  if (teamHasUnnerveOnField(foe)) return;
  const physical = category === 'Physical';
  const special = category === 'Special';

  if ((item === 'kee-berry' && physical) || (item === 'maranga-berry' && special)) {
    consumeItem(target, state);
    changeStatStage(state, target, item === 'kee-berry' ? 'defense' : 'specialDefense', 1, { reason: `thanks to its ${formatBerryName(item)}` });
    return;
  }
  if (((item === 'jaboca-berry' && physical) || (item === 'rowap-berry' && special)) && attacker.currentHp > 0) {
    consumeItem(target, state);
    const chip = Math.max(1, Math.floor(attacker.maxHp / 8));
    attacker.currentHp = Math.max(0, attacker.currentHp - chip);
    state.battleLog.push({
      type: 'status_damage',
      message: `${attacker.pokemon.name} was hurt by ${target.pokemon.name}'s ${formatBerryName(item)}!`,
      pokemon: attacker.pokemon.name,
    });
    return;
  }
  if (item === 'enigma-berry' && effectiveness > 1) {
    consumeItem(target, state);
    const heal = Math.floor(target.maxHp / 4);
    target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
    state.battleLog.push({ type: 'healing', message: `${target.pokemon.name} restored HP with its Enigma Berry!`, pokemon: target.pokemon.name });
  }
}

/**
 * Check and apply type-resist berry BEFORE damage is finalized.
 * Returns the damage multiplier (0.5 if berry activates, 1 otherwise).
 */
export function checkTypeResistBerry(
  state: BattleState,
  target: BattlePokemon,
  moveType: string,
  effectiveness: number,
  targetSide: 'player' | 'opponent' = 'opponent'
): number {
  const item = effectiveItem(target);
  if (!item || target.currentHp <= 0) return 1;
  const foe = targetSide === 'player' ? state.opponent : state.player;
  if (teamHasUnnerveOnField(foe)) return 1;

  if (!(item in TYPE_RESIST_BERRIES)) return 1;

  const resistType = TYPE_RESIST_BERRIES[item];
  const moveTypeNorm = moveType.toLowerCase();

  // Chilan Berry halves any Normal move; other resist berries need super-effective hits
  const activates =
    item === 'chilan-berry'
      ? moveTypeNorm === 'normal'
      : moveTypeNorm === resistType && effectiveness > 1;

  if (activates) {
    consumeItem(target, state);
    state.battleLog.push({
      type: 'status_effect',
      message: `${target.pokemon.name}'s ${formatBerryName(item)} weakened the ${moveType}-type attack!`,
      pokemon: target.pokemon.name,
    });
    return ripen(target) === 2 ? 0.25 : 0.5;
  }
  return 1;
}

export function tryHarvestBerry(state: BattleState, target: BattlePokemon): void {
  if (target.heldItem) return;
  const lastBerry = target.volatile.lastConsumedBerry;
  if (!lastBerry) return;
  const ability = target.currentAbility?.toLowerCase();
  if (ability !== 'harvest') return;

  const isSun = state.field.weather?.kind === 'sun';
  const chance = isSun ? 1 : 0.5;
  if (rngRollChance(state.rng, chance)) {
    target.heldItem = lastBerry;
    target.volatile.lastConsumedBerry = undefined;
    state.battleLog.push({
      type: 'status_effect',
      message: `${target.pokemon.name} harvested a ${formatBerryName(lastBerry)}!`,
      pokemon: target.pokemon.name,
    });
  }
}

function formatBerryName(item: string): string {
  return item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Eat `berry` right now regardless of HP thresholds (Stuff Cheeks, Teatime, Pluck / Bug Bite, Fling).
 * The berry is not removed from anyone here: callers decide whose item it was.
 */
export function forceEatBerry(state: BattleState, mon: BattlePokemon, berry: string, opts: { repeat?: boolean } = {}): void {
  if (!berry.endsWith('-berry') || mon.currentHp <= 0) return;
  mon.ateBerry = true;
  applyForcedBerry(state, mon, berry);
  afterBerryEaten(state, mon, berry, opts.repeat);
}

function applyForcedBerry(state: BattleState, mon: BattlePokemon, berry: string): void {
  const name = formatBerryName(berry);
  const healBy = (amount: number) => {
    const before = mon.currentHp;
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + Math.floor(amount * ripen(mon)));
    if (mon.currentHp > before) {
      state.battleLog.push({ type: 'healing', message: `${mon.pokemon.name} restored HP with the ${name}!`, pokemon: mon.pokemon.name, healing: Math.round(((mon.currentHp - before) / mon.maxHp) * 100) });
    }
  };
  if (berry === 'sitrus-berry') return healBy(mon.maxHp / 4);
  if (berry === 'oran-berry') return healBy(10);
  if (THIRD_HEAL_BERRIES.has(berry)) return healBy(mon.maxHp / 3);
  if (berry === 'lum-berry') {
    if (mon.status) clearStatus(mon);
    mon.volatile.confusion = undefined;
    return;
  }
  const cure = STATUS_CURE_BERRIES[berry];
  if (cure) {
    if (cure === 'confusion') mon.volatile.confusion = undefined;
    else if (mon.status && cure.includes(mon.status)) clearStatus(mon);
    return;
  }
  if (berry === 'leppa-berry') {
    const slot = mon.moves.find((m) => m.pp < m.maxPp);
    if (slot) slot.pp = Math.min(slot.maxPp, slot.pp + 10);
    return;
  }
  if (berry in STAT_BOOST_BERRIES) {
    changeStatStage(state, mon, STAT_BOOST_BERRIES[berry], ripen(mon), { reason: `thanks to the ${name}` });
    return;
  }
  if (berry === 'kee-berry') changeStatStage(state, mon, 'defense', 1, { reason: `thanks to the ${name}` });
  else if (berry === 'maranga-berry') changeStatStage(state, mon, 'specialDefense', 1, { reason: `thanks to the ${name}` });
  else if (berry === 'lansat-berry') mon.volatile.critBoost = 2;
  else if (berry === 'micle-berry') mon.volatile.micleBoost = true;
  else if (berry === 'starf-berry') {
    const stats = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const;
    const open = stats.filter((st) => mon.statModifiers[st] < 6);
    if (open.length) changeStatStage(state, mon, open[rngNextInt(state.rng, open.length)], 2, { reason: `thanks to the ${name}` });
  } else if (berry === 'enigma-berry') healBy(mon.maxHp / 4);
}
