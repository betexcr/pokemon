// Scripted status moves that need no switching (weather / terrain setters, rooms, Gravity, Curse,
// Destiny Bond, Transform, Trick / Switcheroo, ...). Split out of team-battle-engine-additional.ts.

import { BattleState, BattlePokemon, getCurrentPokemon, effectiveItem, syncItemSuppression } from './team-battle-engine';
import { getPokemonTypes } from './team-battle-hazards';
import { getWeatherDuration, getTerrainDuration } from './team-battle-types';
import { removeHeldItem } from './team-battle-items';
import { changeStatStage } from './team-battle-stat-stages';
import { transformBlocked, transformInto } from './team-battle-transform';
import { isUnremovableItem } from './team-battle-held-items';
import { syncUnburdenAfterItemChange } from './team-battle-move-helpers';
import { groundAirbornePokemon, syncGravity } from './team-battle-end-of-turn';

export type ScriptedStatusMoveHandler = (ctx: {
  state: BattleState;
  attacker: BattlePokemon;
  defender: BattlePokemon;
  isPlayer: boolean;
}) => boolean;

export const scriptedStatusMoveHandlers: Record<string, ScriptedStatusMoveHandler> = {
  'sunny-day': ({ state, attacker }) => {
    state.field.weather = { kind: 'sun', turns: getWeatherDuration('sun', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'The sunlight turned harsh!' });
    return true;
  },
  'rain-dance': ({ state, attacker }) => {
    state.field.weather = { kind: 'rain', turns: getWeatherDuration('rain', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to rain!' });
    return true;
  },
  sandstorm: ({ state, attacker }) => {
    state.field.weather = { kind: 'sandstorm', turns: getWeatherDuration('sandstorm', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'A sandstorm kicked up!' });
    return true;
  },
  hail: ({ state, attacker }) => {
    state.field.weather = { kind: 'snow', turns: getWeatherDuration('snow', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to snow!' });
    return true;
  },
  snowscape: ({ state, attacker }) => {
    state.field.weather = { kind: 'snow', turns: getWeatherDuration('snow', effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'It started to snow!' });
    return true;
  },
  'electric-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'electric', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'An electric current runs across the battlefield!' });
    return true;
  },
  'grassy-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'grassy', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'Grass grew to cover the battlefield!' });
    return true;
  },
  'misty-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'misty', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'Mist swirled around the battlefield!' });
    return true;
  },
  'psychic-terrain': ({ state, attacker }) => {
    state.field.terrain = { kind: 'psychic', turns: getTerrainDuration(effectiveItem(attacker)), source: attacker.pokemon.name };
    state.battleLog.push({ type: 'status_effect', message: 'The battlefield got weird!' });
    return true;
  },
  'trick-room': ({ state, attacker }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.trickRoom) {
      delete state.field.rooms.trickRoom;
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} twisted the dimensions back to normal!` });
    } else {
      state.field.rooms.trickRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} twisted the dimensions!` });
      // Room Service: -1 Speed when Trick Room starts
      for (const team of [state.player, state.opponent]) {
        const mon = getCurrentPokemon(team);
        if (mon.currentHp > 0 && effectiveItem(mon) === 'room-service') {
          removeHeldItem(mon);
          changeStatStage(state, mon, 'speed', -1, { reason: 'due to its Room Service' });
        }
      }
    }
    return true;
  },
  'destiny-bond': ({ state, attacker }) => {
    attacker.volatile.destinyBond = true;
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} is hoping to take its attacker down with it!`, pokemon: attacker.pokemon.name });
    return true;
  },
  gravity: ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.gravity) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    state.field.rooms.gravity = { turns: 5 };
    syncGravity(state);
    state.battleLog.push({ type: 'status_effect', message: 'Gravity intensified!' });
    groundAirbornePokemon(state);
    return true;
  },
  curse: ({ state, attacker, defender }) => {
    const isGhost = getPokemonTypes(attacker).map((t) => String(t).toLowerCase()).includes('ghost');
    if (!isGhost) {
      changeStatStage(state, attacker, 'speed', -1);
      changeStatStage(state, attacker, 'attack', 1);
      changeStatStage(state, attacker, 'defense', 1);
      return true;
    }
    if (defender.volatile.cursed || defender.currentHp <= 0) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 2));
    defender.volatile.cursed = true;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} cut its own HP and laid a curse on ${defender.pokemon.name}!`,
      pokemon: attacker.pokemon.name,
    });
    if (attacker.currentHp <= 0) {
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    }
    return true;
  },
  transform: ({ state, attacker, defender }) => {
    if (transformBlocked(attacker, defender) || !transformInto(attacker, defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    state.battleLog.push({ type: 'status_effect', message: `${attacker.pokemon.name} transformed into ${defender.pokemon.name}!`, pokemon: attacker.pokemon.name });
    return true;
  },
  'magic-room': ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.magicRoom) {
      delete state.field.rooms.magicRoom;
      state.battleLog.push({ type: 'status_effect', message: 'Magic Room wore off, and held items regained their effects!' });
    } else {
      state.field.rooms.magicRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: "It created a bizarre area in which Pokémon's held items lose their effects!" });
    }
    syncItemSuppression(state);
    return true;
  },
  'wonder-room': ({ state }) => {
    if (!state.field.rooms) state.field.rooms = {};
    if (state.field.rooms.wonderRoom) {
      delete state.field.rooms.wonderRoom;
      state.battleLog.push({ type: 'status_effect', message: 'Wonder Room wore off, and Defense and Sp. Def stats returned to normal!' });
    } else {
      state.field.rooms.wonderRoom = { turns: 5 };
      state.battleLog.push({ type: 'status_effect', message: 'It created a bizarre area in which Defense and Sp. Def stats are swapped!' });
    }
    return true;
  },
  trick: ({ state, attacker, defender }) => {
    if (isUnremovableItem(attacker) || isUnremovableItem(defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    const aItem = attacker.heldItem;
    const dItem = defender.heldItem;
    attacker.heldItem = dItem;
    defender.heldItem = aItem;
    attacker.volatile.choiceLock = undefined;
    defender.volatile.choiceLock = undefined;
    syncUnburdenAfterItemChange(attacker, Boolean(aItem), Boolean(attacker.heldItem));
    syncUnburdenAfterItemChange(defender, Boolean(dItem), Boolean(defender.heldItem));
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} switched items with ${defender.pokemon.name}!`,
    });
    return true;
  },
  switcheroo: ({ state, attacker, defender }) => {
    if (isUnremovableItem(attacker) || isUnremovableItem(defender)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    const aItem = attacker.heldItem;
    const dItem = defender.heldItem;
    attacker.heldItem = dItem;
    defender.heldItem = aItem;
    attacker.volatile.choiceLock = undefined;
    defender.volatile.choiceLock = undefined;
    syncUnburdenAfterItemChange(attacker, Boolean(aItem), Boolean(attacker.heldItem));
    syncUnburdenAfterItemChange(defender, Boolean(dItem), Boolean(defender.heldItem));
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} switched items with ${defender.pokemon.name}!`,
    });
    return true;
  },
};
