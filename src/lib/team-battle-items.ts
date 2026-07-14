import { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { clearStatus } from './team-battle-status';
import { rngRollChance } from './battle-rng';

function teamHasUnnerveOnField(team: BattleTeam): boolean {
  return team.pokemon.some(
    (p) => p.currentHp > 0 && p.currentAbility?.toLowerCase() === 'unnerve'
  );
}

const STAT_BOOST_BERRIES: Record<string, keyof BattlePokemon['statModifiers']> = {
  'liechi-berry': 'attack',
  'ganlon-berry': 'defense',
  'salac-berry': 'speed',
  'petaya-berry': 'specialAttack',
  'apicot-berry': 'specialDefense',
};

const TYPE_RESIST_BERRIES: Record<string, string> = {
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

function consumeItem(target: BattlePokemon) {
  target.volatile.lastConsumedBerry = target.heldItem;
  target.heldItem = undefined;
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
  if (!target.heldItem || target.currentHp <= 0) return;
  const item = target.heldItem.toLowerCase();

  const foe = targetSide === 'player' ? state.opponent : state.player;
  if (teamHasUnnerveOnField(foe)) {
    return;
  }

  // Sitrus Berry: restore 25% HP when below 50%
  if (item === 'sitrus-berry') {
    const threshold = Math.floor(target.maxHp / 2);
    if (target.currentHp <= threshold) {
      const heal = Math.floor(target.maxHp / 4);
      target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
      consumeItem(target);
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
        consumeItem(target);
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
      consumeItem(target);
      state.battleLog.push({
        type: 'status_effect',
        message: `${target.pokemon.name}'s Lum Berry cured its ${cured}!`,
        pokemon: target.pokemon.name,
      });
    }
    if (target.volatile.confusion) {
      target.volatile.confusion = undefined;
      if (target.heldItem) {
        consumeItem(target);
        state.battleLog.push({
          type: 'status_effect',
          message: `${target.pokemon.name}'s Lum Berry cured its confusion!`,
          pokemon: target.pokemon.name,
        });
      }
    }
    return;
  }

  // Stat-boosting berries: +1 stat at 25% HP
  if (item in STAT_BOOST_BERRIES) {
    const threshold = Math.floor(target.maxHp / 4);
    if (target.currentHp <= threshold) {
      const stat = STAT_BOOST_BERRIES[item];
      const old = target.statModifiers[stat];
      target.statModifiers[stat] = Math.min(6, old + 1);
      consumeItem(target);
      const statDisplay: Record<string, string> = {
        attack: 'Attack', defense: 'Defense', speed: 'Speed',
        specialAttack: 'Sp. Atk', specialDefense: 'Sp. Def',
      };
      state.battleLog.push({
        type: 'status_effect',
        message: `${target.pokemon.name}'s ${formatBerryName(item)} raised its ${statDisplay[stat] || stat}!`,
        pokemon: target.pokemon.name,
      });
    }
    return;
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
  if (!target.heldItem || target.currentHp <= 0) return 1;
  const foe = targetSide === 'player' ? state.opponent : state.player;
  if (teamHasUnnerveOnField(foe)) return 1;

  const item = target.heldItem.toLowerCase();

  if (!(item in TYPE_RESIST_BERRIES)) return 1;

  const resistType = TYPE_RESIST_BERRIES[item];
  const moveTypeNorm = moveType.toLowerCase();

  // Chilan Berry halves any Normal move; other resist berries need super-effective hits
  const activates =
    item === 'chilan-berry'
      ? moveTypeNorm === 'normal'
      : moveTypeNorm === resistType && effectiveness > 1;

  if (activates) {
    consumeItem(target);
    state.battleLog.push({
      type: 'status_effect',
      message: `${target.pokemon.name}'s ${formatBerryName(item)} weakened the ${moveType}-type attack!`,
      pokemon: target.pokemon.name,
    });
    return 0.5;
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
