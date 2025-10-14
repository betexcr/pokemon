import { BattleState, getCurrentPokemon } from './team-battle-engine';
import { BattlePokemon } from './team-battle-engine';
import type { FieldState } from './team-battle-types';

export function handleOnEntryAbilities(state: BattleState, side: 'player' | 'opponent', incoming: BattlePokemon): void {
  const ability = incoming.currentAbility?.toLowerCase();
  if (!ability) return;

  const opponentTeam = side === 'player' ? state.opponent : state.player;
  const opponentActive = getCurrentPokemon(opponentTeam);

  const setWeather = (kind: FieldState['weather']['kind']) => {
    state.field.weather = {
      kind,
      turns: 5,
      source: incoming.pokemon.name,
    };
  };

  const setTerrain = (kind: FieldState['terrain']['kind']) => {
    state.field.terrain = {
      kind,
      turns: 5,
      source: incoming.pokemon.name,
    };
  };

  switch (ability) {
    case 'intimidate': {
      if (opponentActive.currentHp > 0) {
        opponentActive.statModifiers.attack = Math.max(-6, opponentActive.statModifiers.attack - 1);
        state.battleLog.push({
          type: 'status_effect',
          message: `${opponentActive.pokemon.name}'s Attack fell due to Intimidate!`,
          pokemon: opponentActive.pokemon.name,
        });
      }
      break;
    }
    case 'drizzle': {
      setWeather('rain');
      state.battleLog.push({
        type: 'status_effect',
        message: `It started to rain!`,
      });
      break;
    }
    case 'drought': {
      setWeather('sun');
      state.battleLog.push({
        type: 'status_effect',
        message: `Harsh sunlight turned the battlefield bright!`,
      });
      break;
    }
    case 'sand-stream': {
      setWeather('sandstorm');
      state.battleLog.push({
        type: 'status_effect',
        message: `A sandstorm kicked up!`,
      });
      break;
    }
    case 'snow-warning': {
      setWeather('snow');
      state.battleLog.push({
        type: 'status_effect',
        message: `It started to snow!`,
      });
      break;
    }
    case 'electric-surge': {
      setTerrain('electric');
      state.battleLog.push({
        type: 'status_effect',
        message: `An electric current runs across the battlefield!`,
      });
      break;
    }
    case 'grassy-surge': {
      setTerrain('grassy');
      state.battleLog.push({
        type: 'status_effect',
        message: `Grassy Terrain spread across the battlefield!`,
      });
      break;
    }
    case 'misty-surge': {
      setTerrain('misty');
      state.battleLog.push({
        type: 'status_effect',
        message: `Misty Terrain enveloped the battlefield!`,
      });
      break;
    }
    case 'psychic-surge': {
      setTerrain('psychic');
      state.battleLog.push({
        type: 'status_effect',
        message: `Psychic Terrain twisted the dimensions!`,
      });
      break;
    }
    case 'cloud-nine':
    case 'air-lock': {
      if (state.field.weather) {
        state.field.weather.turns = 0;
        state.battleLog.push({
          type: 'status_effect',
          message: `The weather's effects were nullified!`,
        });
      }
      break;
    }
    default:
      break;
  }
}


