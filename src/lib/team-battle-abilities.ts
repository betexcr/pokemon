import { effectiveItem } from './battle-item-access';
import { transformInto } from './team-battle-transform';
import { changeStatStage } from './team-battle-stat-stages';
import { BattleState, getCurrentPokemon } from './team-battle-engine';
import { BattlePokemon } from './team-battle-engine';
import type { WeatherKind, TerrainKind } from './team-battle-types';
import { getTerrainDuration, getWeatherDuration } from './team-battle-types';

const INTIMIDATE_IMMUNE = new Set([
  'inner-focus',
  'oblivious',
  'own-tempo',
  'scrappy',
]);

const MOLD_BREAKER_ANNOUNCEMENTS: Record<string, string> = {
  'mold-breaker': 'breaks the mold!',
  teravolt: 'is radiating a bursting aura!',
  turboblaze: 'is radiating a blazing aura!',
};

export function handleOnEntryAbilities(state: BattleState, side: 'player' | 'opponent', incoming: BattlePokemon): void {
  const ability = incoming.currentAbility?.toLowerCase();
  if (!ability) return;

  const opponentTeam = side === 'player' ? state.opponent : state.player;
  const opponentActive = getCurrentPokemon(opponentTeam);
  const item = effectiveItem(incoming);

  const setWeather = (kind: WeatherKind) => {
    if (kind === 'none') return;
    state.field.weather = {
      kind,
      turns: getWeatherDuration(kind, item),
      source: incoming.pokemon.name,
    };
  };

  const setTerrain = (kind: TerrainKind) => {
    if (kind === 'none') return;
    state.field.terrain = {
      kind,
      turns: getTerrainDuration(item),
      source: incoming.pokemon.name,
    };
  };

  switch (ability) {
    case 'intimidate': {
      if (opponentActive.currentHp <= 0) break;
      const foeAbility = opponentActive.currentAbility?.toLowerCase() || '';

      if (INTIMIDATE_IMMUNE.has(foeAbility)) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${opponentActive.pokemon.name}'s ${foeAbility} prevented Intimidate!`,
          pokemon: opponentActive.pokemon.name,
        });
        break;
      }
      if (foeAbility === 'guard-dog') {
        // Guard Dog turns Intimidate into an Attack boost
        changeStatStage(state, opponentActive, 'attack', 1, { reason: 'thanks to Guard Dog' });
        break;
      }

      // Clear Body / Hyper Cutter blocking, Contrary, Defiant / Competitive and White Herb (after entry)
      // are handled by the shared stat-stage logic.
      changeStatStage(state, opponentActive, 'attack', -1, { source: incoming, reason: 'due to Intimidate' });
      break;
    }
    case 'imposter': {
      // Transform into the opposing Pokémon on entry
      if (opponentActive.currentHp > 0 && transformInto(incoming, opponentActive)) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${incoming.pokemon.name} transformed into ${opponentActive.pokemon.name}!`,
          pokemon: incoming.pokemon.name,
        });
      }
      break;
    }
    case 'mold-breaker':
    case 'teravolt':
    case 'turboblaze': {
      state.battleLog.push({
        type: 'status_effect',
        message: `${incoming.pokemon.name} ${MOLD_BREAKER_ANNOUNCEMENTS[ability]}`,
        pokemon: incoming.pokemon.name,
      });
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
    case 'download': {
      const stats = opponentActive.pokemon.stats || [];
      const base = (name: string) =>
        stats.find((s: any) => (s.stat?.name || s.name) === name)?.base_stat ?? 50;
      const def = base('defense');
      const spd = base('special-defense');
      changeStatStage(state, incoming, spd >= def ? 'attack' : 'specialAttack', 1, { reason: 'thanks to Download' });
      break;
    }
    case 'frisk': {
      if (opponentActive.heldItem) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${incoming.pokemon.name} frisked the foe and found its ${opponentActive.heldItem}!`,
          pokemon: incoming.pokemon.name,
        });
      } else {
        state.battleLog.push({
          type: 'status_effect',
          message: `${incoming.pokemon.name} frisked the foe, but it wasn't holding anything!`,
          pokemon: incoming.pokemon.name,
        });
      }
      break;
    }
    case 'unnerve': {
      state.battleLog.push({
        type: 'status_effect',
        message: `${incoming.pokemon.name}'s Unnerve makes the opposing team too nervous to eat Berries!`,
      });
      break;
    }
    default:
      break;
  }
}
