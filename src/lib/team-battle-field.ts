import { BattleState, getCurrentPokemon, BattleTeam } from './team-battle-engine';
import { FieldState, FieldSideScreens } from './team-battle-types';
import { getPokemonTypes, isGrounded } from './team-battle-hazards';
import { BattlePokemon } from './team-battle-engine';

export function decrementFieldTimers(field: FieldState, screens: { player: FieldSideScreens; opponent: FieldSideScreens }): void {
  if (field.weather && field.weather.turns > 0) {
    field.weather.turns -= 1;
    if (field.weather.turns <= 0) {
      delete field.weather;
    }
  }

  if (field.terrain && field.terrain.turns > 0) {
    field.terrain.turns -= 1;
    if (field.terrain.turns <= 0) {
      delete field.terrain;
    }
  }

  if (!field.rooms) field.rooms = {};
  if (field.rooms.trickRoom) {
    field.rooms.trickRoom.turns -= 1;
    if (field.rooms.trickRoom.turns <= 0) {
      delete field.rooms.trickRoom;
    }
  }

  const decrementScreens = (side: FieldSideScreens) => {
    if (side.reflect) {
      side.reflect.turns -= 1;
      if (side.reflect.turns <= 0) delete side.reflect;
    }
    if (side.lightScreen) {
      side.lightScreen.turns -= 1;
      if (side.lightScreen.turns <= 0) delete side.lightScreen;
    }
    if (side.auroraVeil) {
      side.auroraVeil.turns -= 1;
      if (side.auroraVeil.turns <= 0) delete side.auroraVeil;
    }
    if (side.safeguard) {
      side.safeguard.turns -= 1;
      if (side.safeguard.turns <= 0) delete side.safeguard;
    }
    if (side.tailwind) {
      side.tailwind.turns -= 1;
      if (side.tailwind.turns <= 0) delete side.tailwind;
    }
  };

  decrementScreens(screens.player);
  decrementScreens(screens.opponent);
}

export function applyWeatherResidual(state: BattleState): void {
  const weather = state.field.weather?.kind;
  if (weather === 'sandstorm') {
    [state.player, state.opponent].forEach(team => {
      const pokemon = getCurrentPokemon(team);
      if (pokemon.currentHp <= 0) return;
      const types = getPokemonTypes(pokemon);
      const immune = types.includes('rock') || types.includes('ground') || types.includes('steel');
      if (!immune) {
        const damage = Math.floor(pokemon.maxHp / 16);
        if (damage > 0) {
          pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
          state.battleLog.push({
            type: 'status_damage',
            message: `${pokemon.pokemon.name} is buffeted by the sandstorm!`,
            pokemon: pokemon.pokemon.name,
            damage: Math.round((damage / pokemon.maxHp) * 100),
          });
        }
      }
    });
  }
}

export function applyTerrainHealing(state: BattleState): void {
  const terrain = state.field.terrain?.kind;
  if (terrain === 'grassy') {
    [state.player, state.opponent].forEach(team => {
      const pokemon = getCurrentPokemon(team);
      if (pokemon.currentHp <= 0) return;
      const healed = Math.floor(pokemon.maxHp / 16);
      if (healed > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healed);
        state.battleLog.push({
          type: 'healing',
          message: `${pokemon.pokemon.name} recovered HP from Grassy Terrain!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round((healed / pokemon.maxHp) * 100),
        });
      }
    });
  }
}

export function applyLeechSeed(state: BattleState): void {
  const applySeed = (owner: BattleTeam, target: BattleTeam) => {
    const targetPokemon = getCurrentPokemon(target);
    if (targetPokemon.currentHp <= 0) return;
    const seedInfo = targetPokemon.volatile.leechSeedSource;
    if (!seedInfo) return;

    const ownerTeam = seedInfo.owner === 'player' ? state.player : state.opponent;
    const seeder = ownerTeam.pokemon[seedInfo.index];
    if (!seeder || seeder.currentHp <= 0) {
      targetPokemon.volatile.leechSeedSource = undefined;
      return;
    }

    const damage = Math.floor(targetPokemon.maxHp / 8);
    if (damage <= 0) return;

    targetPokemon.currentHp = Math.max(0, targetPokemon.currentHp - damage);
    seeder.currentHp = Math.min(seeder.maxHp, seeder.currentHp + damage);

    state.battleLog.push({
      type: 'status_damage',
      message: `${targetPokemon.pokemon.name} had its energy drained!`,
      pokemon: targetPokemon.pokemon.name,
      damage: Math.round((damage / targetPokemon.maxHp) * 100),
    });

    state.battleLog.push({
      type: 'healing',
      message: `${seeder.pokemon.name} absorbed nutrients with Leech Seed!`,
      pokemon: seeder.pokemon.name,
      healing: Math.round((damage / seeder.maxHp) * 100),
    });
  };

  applySeed(state.player, state.opponent);
  applySeed(state.opponent, state.player);
}

export function applyBindingDamage(state: BattleState): void {
  const processBinding = (team: BattleTeam) => {
    const pokemon = getCurrentPokemon(team);
    const binding = pokemon.volatile.binding;
    if (!binding) return;

    const damage = Math.max(1, Math.floor(pokemon.maxHp * binding.fraction));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
    binding.turnsLeft -= 1;

    state.battleLog.push({
      type: 'status_damage',
      message: `${pokemon.pokemon.name} is hurt by ${binding.kind}!`,
      pokemon: pokemon.pokemon.name,
      damage: Math.round((damage / pokemon.maxHp) * 100),
    });

    if (binding.turnsLeft <= 0) {
      pokemon.volatile.binding = undefined;
      state.battleLog.push({
        type: 'status_effect',
        message: `${pokemon.pokemon.name} was freed from ${binding.kind}!`,
        pokemon: pokemon.pokemon.name,
      });
    }
  };

  processBinding(state.player);
  processBinding(state.opponent);
}

