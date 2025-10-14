import { BattlePokemon, BattleState } from './team-battle-engine';
import { rngRollChance } from './battle-rng';

export function tryConsumeBerry(state: BattleState, target: BattlePokemon): void {
  if (!target.heldItem) return;
  const item = target.heldItem.toLowerCase();
  if (item === 'sitrus-berry') {
    const threshold = Math.floor(target.maxHp / 2);
    if (target.currentHp > 0 && target.currentHp <= threshold) {
      consumeSitrus(state, target);
    }
  }
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

function consumeSitrus(state: BattleState, target: BattlePokemon): void {
  const heal = Math.floor(target.maxHp / 4);
  if (heal <= 0) return;
  target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
  target.volatile.lastConsumedBerry = target.heldItem;
  target.heldItem = undefined;
  state.battleLog.push({
    type: 'healing',
    message: `${target.pokemon.name} restored HP with its Sitrus Berry!`,
    pokemon: target.pokemon.name,
    healing: Math.round((heal / target.maxHp) * 100),
  });
}

function formatBerryName(item: string): string {
  return item.replace(/-/g, ' ');
}

