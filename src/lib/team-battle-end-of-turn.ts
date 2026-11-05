// End of turn: residual damage and healing, field timers, Gravity, Curse / Salt Cure, items, abilities,
// volatile timers, Future Sight and other delayed effects. Split out of team-battle-engine-additional.ts.

import { BattleState, BattleTeam, getCurrentPokemon, effectiveItem, syncItemSuppression } from './team-battle-engine';
import { calculateComprehensiveDamage, calculateTypeEffectiveness } from './damage-calculator';
import { isGrounded, getPokemonTypes } from './team-battle-hazards';
import { clearTwoTurnState, completeTwoTurnCharge } from './battle-multiturn';
import { applyWeatherResidual, applyTerrainHealing, decrementFieldTimers, applyLeechSeed, applyBindingDamage } from './team-battle-field';
import { applyEndOfTurnStatus, clearStatus, applyStatus, terrainPreventsStatus } from './team-battle-status';
import { rngRollChance } from './battle-rng';
import { tryConsumeBerry, tryHarvestBerry } from './team-battle-items';
import { GRAVITY_BLOCKED_MOVES } from './battle-move-constants';
import { toDamageTypeName } from './battle-damage-modifiers';
import { changeStatStage } from './team-battle-stat-stages';
import { abilityOf } from './team-battle-ability-rules';
import { updateParadoxBoosts } from './team-battle-paradox';
import { rawStat, stageMultiplier } from './battle-stats';
import { applyEndOfTurnAbilities, updateWeatherTerrainForms } from './team-battle-gen9-abilities';
import { applyIceFaceStats, updateHpForms } from './team-battle-forms';
import { absorbHitWithSubstitute } from './team-battle-move-helpers';

// Process end-of-turn effects
export async function processEndOfTurn(state: BattleState): Promise<void> {
  // 1. Residual damage/heal
  applyWeatherResidual(state);
  processResidualDamage(state);
  applyTerrainHealing(state);
  applyLeechSeed(state);
  applyBindingDamage(state);
  const roomsBefore = { ...(state.field.rooms ?? {}) };
  decrementFieldTimers(state.field, {
    player: state.player.sideConditions.screens,
    opponent: state.opponent.sideConditions.screens,
  });
  const roomsAfter = state.field.rooms ?? {};
  if (roomsBefore.trickRoom && !roomsAfter.trickRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'The twisted dimensions returned to normal!' });
  }
  if (roomsBefore.magicRoom && !roomsAfter.magicRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'Magic Room wore off, and held items regained their effects!' });
  }
  if (roomsBefore.wonderRoom && !roomsAfter.wonderRoom) {
    state.battleLog.push({ type: 'status_effect', message: 'Wonder Room wore off, and Defense and Sp. Def stats returned to normal!' });
  }
  if (roomsBefore.gravity && !roomsAfter.gravity) {
    state.battleLog.push({ type: 'status_effect', message: 'Gravity returned to normal!' });
  }
  syncItemSuppression(state);
  syncGravity(state);
  applyCurseAndSaltCure(state);
  for (const team of [state.player, state.opponent]) {
    updateHpForms(state, getCurrentPokemon(team));
  }
  restoreIceFaces(state);

  applyEndOfTurnStatus(state, getCurrentPokemon(state.player));
  applyEndOfTurnStatus(state, getCurrentPokemon(state.opponent));
  
  // 2. Item residuals
  processItemResiduals(state);
  processStatusOrbs(state);
  
  // 3. End-of-turn abilities
  processEndOfTurnAbilities(state);
  
  // 4. Volatile decrements
  processVolatileDecrements(state);
  processGen9EndOfTurn(state);
  
  // 5. Check faints from residuals
  checkResidualFaints(state);
  noteFaintTurns(state);

  // 6. Weather / terrain that just ended may switch paradox boosts off (or trigger Booster Energy)
  updateParadoxBoosts(state);
}

/** Future Sight / Doom Desire landing, Syrup Bomb, Throat Chop / Lock-On timers, Hunger Switch, Fairy Lock. */
export function processGen9EndOfTurn(state: BattleState): void {
  applyEndOfTurnAbilities(state);
  for (const team of [state.player, state.opponent]) updateWeatherTerrainForms(state, getCurrentPokemon(team));
  for (const team of [state.player, state.opponent]) {
    const fa = team.sideConditions.futureAttack;
    if (fa) {
      fa.turns -= 1;
      if (fa.turns <= 0) {
        team.sideConditions.futureAttack = undefined;
        const target = getCurrentPokemon(team);
        if (target.currentHp > 0) {
          state.battleLog.push({ type: 'status_effect', message: `${target.pokemon.name} took the ${fa.move} attack!`, pokemon: target.pokemon.name });
          const typeName = toDamageTypeName(fa.type.toLowerCase());
          const defTypes = getPokemonTypes(target).map((t) => toDamageTypeName(String(t)));
          if (calculateTypeEffectiveness(typeName, defTypes) === 0) {
            state.battleLog.push({ type: 'status_effect', message: `It doesn't affect ${target.pokemon.name}...`, pokemon: target.pokemon.name });
          } else {
            const result = calculateComprehensiveDamage({
              level: fa.level,
              movePower: fa.power,
              moveType: typeName,
              attackerTypes: fa.attackerTypes.map((t) => toDamageTypeName(t)),
              defenderTypes: defTypes,
              attackStat: fa.attackStat,
              defenseStat: Math.floor(rawStat(target, 'special-defense') * stageMultiplier(target.statModifiers.specialDefense)),
              attackStatStages: 0,
              defenseStatStages: 0,
              isPhysical: false,
              hasLightScreen: !!team.sideConditions.screens.lightScreen,
              hasAuroraVeil: !!team.sideConditions.screens.auroraVeil,
              cannotCrit: true,
              rng: state.rng,
            });
            const dmg = target.volatile.substitute ? 0 : result.damage;
            if (!absorbHitWithSubstitute(state, target, result.damage)) {
              target.currentHp = Math.max(0, target.currentHp - dmg);
              state.battleLog.push({
                type: 'damage_dealt',
                message: `${target.pokemon.name} took ${dmg} damage! (${Math.round((target.currentHp / target.maxHp) * 100)}% HP left)`,
                pokemon: target.pokemon.name,
                damage: dmg,
              });
              if (target.currentHp <= 0) {
                state.battleLog.push({ type: 'pokemon_fainted', message: `${target.pokemon.name} fainted!`, pokemon: target.pokemon.name });
              }
            }
          }
        }
      }
    }

    const mon = getCurrentPokemon(team);
    if (!mon || mon.currentHp <= 0) continue;
    const v = mon.volatile;
    if (v.syrupBomb) {
      changeStatStage(state, mon, 'speed', -1, { reason: 'due to the sticky syrup', quietFailure: true });
      v.syrupBomb.turns -= 1;
      if (v.syrupBomb.turns <= 0) v.syrupBomb = undefined;
    }
    if (v.throatChop) {
      v.throatChop.turns -= 1;
      if (v.throatChop.turns <= 0) v.throatChop = undefined;
    }
    if (v.lockOn) {
      v.lockOn -= 1;
      if (v.lockOn <= 0) v.lockOn = undefined;
    }
    v.fairyLocked = !!state.field.rooms?.fairyLock || undefined;
    // Hunger Switch: Morpeko flips between Full Belly and Hangry Mode
    if (abilityOf(mon) === 'hunger-switch' && !mon.terastallized) {
      v.hangry = !v.hangry;
      state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} transformed!`, pokemon: mon.pokemon.name });
    }
  }
}

/** Remember the turn a team member last fainted (Retaliate). */
export function noteFaintTurns(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const fainted = team.pokemon.filter((p) => p.currentHp <= 0).length;
    if (fainted > (team.faintTally ?? 0)) team.lastFaintTurn = state.turn;
    team.faintTally = fainted;
  }
}

/** Ice Face comes back whenever an Eiscue is out in snow (on entry, when snow starts, at end of turn). */
export function restoreIceFaces(state: BattleState): void {
  if (state.field.weather?.kind !== 'snow') return;
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    if (!mon.iceFaceBroken || mon.currentHp <= 0 || abilityOf(mon) !== 'ice-face') continue;
    mon.iceFaceBroken = false;
    applyIceFaceStats(mon, 'ice');
    state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name}'s Ice Face was restored!`, pokemon: mon.pokemon.name });
  }
}

export function isBlockedByGravity(state: Pick<BattleState, 'field'>, moveId: string): boolean {
  return !!state.field.rooms?.gravity && GRAVITY_BLOCKED_MOVES.has(moveId.toLowerCase());
}

/** Gravity pulls Pokémon out of the sky mid-Fly / Bounce / Sky Drop. */
export function groundAirbornePokemon(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    const airborne = mon.volatile.semiInvulnerable && GRAVITY_BLOCKED_MOVES.has(mon.volatile.semiInvulnerable);
    if (!airborne) continue;
    clearTwoTurnState(mon);
    mon.volatile.semiInvulnerable = undefined;
    state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name} couldn't stay airborne because of gravity!`, pokemon: mon.pokemon.name });
  }
}

/** Gravity grounds every Pokémon (mirrored onto volatiles so `isGrounded` sees it). */
export function syncGravity(state: BattleState): void {
  const on = !!state.field.rooms?.gravity;
  for (const team of [state.player, state.opponent]) {
    for (const mon of team.pokemon) {
      if (on) mon.volatile.gravityGrounded = true;
      else delete mon.volatile.gravityGrounded;
    }
  }
}

/** End of turn: Curse (1/4 max HP) and Salt Cure (1/8, or 1/4 for Water / Steel). Magic Guard is immune. */
export function applyCurseAndSaltCure(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const mon = getCurrentPokemon(team);
    if (mon.currentHp <= 0 || abilityOf(mon) === 'magic-guard') continue;
    if (mon.volatile.cursed) {
      mon.currentHp = Math.max(0, mon.currentHp - Math.max(1, Math.floor(mon.maxHp / 4)));
      state.battleLog.push({ type: 'status_damage', message: `${mon.pokemon.name} is afflicted by the curse!`, pokemon: mon.pokemon.name });
    }
    if (mon.volatile.saltCure && mon.currentHp > 0) {
      const types = getPokemonTypes(mon).map((t) => String(t).toLowerCase());
      const fraction = types.includes('water') || types.includes('steel') ? 4 : 8;
      mon.currentHp = Math.max(0, mon.currentHp - Math.max(1, Math.floor(mon.maxHp / fraction)));
      state.battleLog.push({ type: 'status_damage', message: `${mon.pokemon.name} is hurt by Salt Cure!`, pokemon: mon.pokemon.name });
    }
  }
}

/** Flame Orb / Toxic Orb: inflict the holder's own status at end of turn (Misty Terrain and immunities still apply). */
export function processStatusOrbs(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0 || pokemon.status) continue;
    const item = effectiveItem(pokemon);
    if (item !== 'flame-orb' && item !== 'toxic-orb') continue;
    const status = item === 'flame-orb' ? 'burned' : 'badly-poisoned';
    const types = getPokemonTypes(pokemon).map((t) => String(t).toLowerCase());
    const ability = abilityOf(pokemon);
    const immune =
      status === 'burned'
        ? types.includes('fire') || ability === 'water-veil' || ability === 'water-bubble' || ability === 'thermal-exchange'
        : types.includes('poison') || types.includes('steel') || ability === 'immunity' || ability === 'pastel-veil';
    if (immune || ability === 'comatose' || terrainPreventsStatus(state.field.terrain?.kind, pokemon, status)) continue;
    applyStatus(pokemon, status);
    state.battleLog.push({
      type: 'status_applied',
      message: `${pokemon.pokemon.name} was ${status === 'burned' ? 'burned' : 'badly poisoned'} by the ${item === 'flame-orb' ? 'Flame Orb' : 'Toxic Orb'}!`,
      pokemon: pokemon.pokemon.name,
      status: status.toUpperCase(),
    });
  }
}

export function processResidualDamage(_state: BattleState): void {
  // Status residual damage (poison, burn) is handled by applyEndOfTurnStatus
}

// Process item residuals
export function processItemResiduals(state: BattleState): void {
  const processItem = (team: BattleTeam, side: 'player' | 'opponent') => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const item = effectiveItem(pokemon);
    if (!item) return;

    if (item === 'shell-bell' && pokemon.volatile.damageDealtThisTurn) {
      const heal = Math.max(1, Math.floor(pokemon.volatile.damageDealtThisTurn / 8));
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: 'healing',
          message: `${pokemon.pokemon.name} restored HP with Shell Bell!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round((heal / pokemon.maxHp) * 100),
        });
      }
    }

    if (item === 'leftovers' || (item === 'black-sludge' && pokemon.pokemon.types.some(t => (typeof t === 'string' ? t : t.type?.name || '') === 'Poison'))) {
      const heal = Math.floor(pokemon.maxHp / 16);
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: 'healing',
          message: `${pokemon.pokemon.name} restored HP with ${item === 'leftovers' ? 'Leftovers' : 'Black Sludge'}!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round((heal / pokemon.maxHp) * 100),
        });
      }
    } else if (item === 'black-sludge') {
      const damage = Math.floor(pokemon.maxHp / 8);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: 'status_damage',
          message: `${pokemon.pokemon.name} was hurt by Black Sludge!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round((damage / pokemon.maxHp) * 100),
        });
      }
    }

    tryConsumeBerry(state, pokemon, side);
  };

  processItem(state.player, 'player');
  processItem(state.opponent, 'opponent');

  // Reset per-turn damage trackers after applying Shell Bell
  getCurrentPokemon(state.player).volatile.damageDealtThisTurn = 0;
  getCurrentPokemon(state.opponent).volatile.damageDealtThisTurn = 0;
}

// Process end-of-turn abilities
export function processEndOfTurnAbilities(state: BattleState): void {
  [state.player, state.opponent].forEach(team => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;

    const ability = pokemon.currentAbility?.toLowerCase();
    switch (ability) {
      case 'speed-boost': {
        changeStatStage(state, pokemon, 'speed', 1, { reason: 'thanks to Speed Boost', quietFailure: true });
        break;
      }
      case 'poison-heal': {
        if (pokemon.status === 'poisoned' || pokemon.status === 'badly-poisoned') {
          const heal = Math.floor(pokemon.maxHp / 8);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Poison Heal!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'shed-skin': {
        if (pokemon.status && rngRollChance(state.rng, 0.3)) {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: 'status_effect',
            message: `${pokemon.pokemon.name} shed its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name,
          });
        }
        break;
      }
      case 'hydration': {
        if (pokemon.status && state.field.weather?.kind === 'rain') {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: 'status_effect',
            message: `${pokemon.pokemon.name}'s Hydration cured its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name,
          });
        }
        break;
      }
      case 'rain-dish': {
        if (state.field.weather?.kind === 'rain') {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Rain Dish!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'dry-skin': {
        if (state.field.weather?.kind === 'rain') {
          const heal = Math.floor(pokemon.maxHp / 8);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Dry Skin!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        } else if (state.field.weather?.kind === 'sun') {
          const damage = Math.floor(pokemon.maxHp / 8);
          if (damage > 0) {
            pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
            state.battleLog.push({
              type: 'status_damage',
              message: `${pokemon.pokemon.name} was hurt by Dry Skin under the sun!`,
              pokemon: pokemon.pokemon.name,
              damage: Math.round((damage / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'solar-power': {
        if (state.field.weather?.kind === 'sun') {
          const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
          state.battleLog.push({
            type: 'status_damage',
            message: `${pokemon.pokemon.name} is hurt by Solar Power!`,
            pokemon: pokemon.pokemon.name,
            damage: Math.round((damage / pokemon.maxHp) * 100),
          });
        }
        break;
      }
      case 'ice-body': {
        if (state.field.weather?.kind === 'snow') {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: 'healing',
              message: `${pokemon.pokemon.name} restored HP with Ice Body!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round((heal / pokemon.maxHp) * 100),
            });
          }
        }
        break;
      }
      case 'harvest': {
        tryHarvestBerry(state, pokemon);
        break;
      }
      default:
        break;
    }
  });
}

// Process volatile decrements
export function processVolatileDecrements(state: BattleState): void {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);

  const processWish = (team: BattleTeam) => {
    // Wish is stored on the mon that used it; heal the current active when it lands
    for (const mon of team.pokemon) {
      if (!mon.volatile.wish) continue;
      mon.volatile.wish.turns -= 1;
      if (mon.volatile.wish.turns > 0) continue;
      const heal = mon.volatile.wish.heal;
      mon.volatile.wish = undefined;
      const active = getCurrentPokemon(team);
      if (active.currentHp <= 0 || heal <= 0) continue;
      const before = active.currentHp;
      active.currentHp = Math.min(active.maxHp, active.currentHp + heal);
      const gained = active.currentHp - before;
      if (gained > 0) {
        state.battleLog.push({
          type: 'healing',
          message: `${active.pokemon.name}'s wish came true!`,
          pokemon: active.pokemon.name,
          healing: Math.round((gained / active.maxHp) * 100),
        });
      }
    }
  };
  processWish(state.player);
  processWish(state.opponent);

  // Dig/Fly/Solar Beam: after the charge turn, mark the move pending for next action
  for (const mon of [playerPokemon, opponentPokemon]) {
    if (mon.volatile.twoTurn?.kind === 'charging') {
      completeTwoTurnCharge(mon);
    }
  }
  
  // Encore turns
  if (playerPokemon.volatile.encore) {
    playerPokemon.volatile.encore.turns--;
    if (playerPokemon.volatile.encore.turns <= 0) {
      playerPokemon.volatile.encore = undefined;
    }
  }
  
  if (opponentPokemon.volatile.encore) {
    opponentPokemon.volatile.encore.turns--;
    if (opponentPokemon.volatile.encore.turns <= 0) {
      opponentPokemon.volatile.encore = undefined;
    }
  }
  
  // Taunt turns
  if (playerPokemon.volatile.taunt) {
    playerPokemon.volatile.taunt.turns--;
    if (playerPokemon.volatile.taunt.turns <= 0) {
      playerPokemon.volatile.taunt = undefined;
    }
  }
  
  if (opponentPokemon.volatile.taunt) {
    opponentPokemon.volatile.taunt.turns--;
    if (opponentPokemon.volatile.taunt.turns <= 0) {
      opponentPokemon.volatile.taunt = undefined;
    }
  }
  
  // Disable turns
  if (playerPokemon.volatile.disable) {
    playerPokemon.volatile.disable.turns--;
    if (playerPokemon.volatile.disable.turns <= 0) {
      playerPokemon.volatile.disable = undefined;
    }
  }
  
  if (opponentPokemon.volatile.disable) {
    opponentPokemon.volatile.disable.turns--;
    if (opponentPokemon.volatile.disable.turns <= 0) {
      opponentPokemon.volatile.disable = undefined;
    }
  }
  
  // Perish Song turns
  if (playerPokemon.volatile.perishSong) {
    playerPokemon.volatile.perishSong.turns--;
    if (playerPokemon.volatile.perishSong.turns <= 0) {
      playerPokemon.currentHp = 0;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${playerPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: playerPokemon.pokemon.name
      });
      // Update fainted count
      state.player.faintedCount = state.player.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
  
  if (opponentPokemon.volatile.perishSong) {
    opponentPokemon.volatile.perishSong.turns--;
    if (opponentPokemon.volatile.perishSong.turns <= 0) {
      opponentPokemon.currentHp = 0;
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${opponentPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: opponentPokemon.pokemon.name
      });
      // Update fainted count
      state.opponent.faintedCount = state.opponent.pokemon.filter(p => p.currentHp <= 0).length;
    }
  }
}

// Check for faints from residuals and resync faintedCount from HP
export function checkResidualFaints(state: BattleState): void {
  const checkSide = (team: BattleTeam) => {
    const pokemon = getCurrentPokemon(team);
    const prevFaintedCount = team.faintedCount;
    team.faintedCount = team.pokemon.filter(p => p.currentHp <= 0).length;
    if (pokemon.currentHp <= 0 && team.faintedCount > prevFaintedCount) {
      state.battleLog.push({
        type: 'pokemon_fainted',
        message: `${pokemon.pokemon.name} fainted!`,
        pokemon: pokemon.pokemon.name
      });
    }
  };

  checkSide(state.player);
  checkSide(state.opponent);
}
