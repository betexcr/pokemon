/**
 * Move scripts that set/clear volatiles and hazards (Battle Engine M1+).
 * Called from executeMoveAction once a status (or special damage) move resolves.
 */
import type { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';
import { getCurrentPokemon } from './team-battle-engine';
import type { SideHazards } from './team-battle-types';

const BINDING_MOVES: Record<string, { kind: string; fraction: number }> = {
  'fire-spin': { kind: 'Fire Spin', fraction: 1 / 8 },
  whirlpool: { kind: 'Whirlpool', fraction: 1 / 8 },
  wrap: { kind: 'Wrap', fraction: 1 / 8 },
  'sand-tomb': { kind: 'Sand Tomb', fraction: 1 / 8 },
  'magma-storm': { kind: 'Magma Storm', fraction: 1 / 8 },
  infestation: { kind: 'Infestation', fraction: 1 / 8 },
  'snap-trap': { kind: 'Snap Trap', fraction: 1 / 8 },
  clamp: { kind: 'Clamp', fraction: 1 / 8 },
  bind: { kind: 'Bind', fraction: 1 / 8 },
};

export function lastUsedMoveId(pokemon: BattlePokemon): string | undefined {
  if (pokemon.volatile.lastMoveUsed) return pokemon.volatile.lastMoveUsed;
  const lock = pokemon.volatile.choiceLock;
  if (typeof lock === 'string' && lock) return lock;
  // Fall back to first move with reduced PP if unknown
  return pokemon.moves.find((m) => m.pp < m.maxPp)?.id ?? pokemon.moves[0]?.id;
}

export function clearSideHazards(hazards: SideHazards): void {
  hazards.stealthRock = false;
  hazards.spikes = 0;
  hazards.toxicSpikes = 0;
  hazards.stickyWeb = false;
}

export function swapSideHazards(a: SideHazards, b: SideHazards): void {
  const tmp = { ...a };
  a.stealthRock = b.stealthRock;
  a.spikes = b.spikes;
  a.toxicSpikes = b.toxicSpikes;
  a.stickyWeb = b.stickyWeb;
  b.stealthRock = tmp.stealthRock;
  b.spikes = tmp.spikes;
  b.toxicSpikes = tmp.toxicSpikes;
  b.stickyWeb = tmp.stickyWeb;
}

/** Tailwind lives on screens.tailwind (timer + speed share one path). */
export function setTailwind(side: BattleTeam, turns = 4): void {
  side.sideConditions.screens.tailwind = { turns };
  // Clear legacy duplicate key if present
  if (side.sideConditions.tailwind) delete side.sideConditions.tailwind;
}

/**
 * Status / special script moves: Encore, Taunt, Disable, Sub, Leech Seed, Yawn,
 * Perish Song, Wish, Safeguard, Tailwind, Defog, Rapid Spin, Mortal Spin, Court Change.
 * Returns true if the move was fully handled.
 */
export function applyVolatileAndHazardScripts(
  state: BattleState,
  moveLower: string,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  isPlayer: boolean
): boolean {
  const attackerSide = isPlayer ? state.player : state.opponent;
  const defenderSide = isPlayer ? state.opponent : state.player;

  if (moveLower === 'encore') {
    const moveId = lastUsedMoveId(defender);
    if (!moveId || moveId === 'struggle' || defender.volatile.encore) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    defender.volatile.encore = { move: moveId, turns: 3 };
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} received an encore!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'taunt') {
    if (defender.volatile.taunt) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    defender.volatile.taunt = { turns: 3 };
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} fell for the taunt!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'disable') {
    const moveId = lastUsedMoveId(defender);
    if (!moveId || moveId === 'struggle' || defender.volatile.disable) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    defender.volatile.disable = { move: moveId, turns: 4 };
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s ${moveId} was disabled!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'substitute') {
    if (attacker.volatile.substitute || attacker.currentHp <= Math.floor(attacker.maxHp / 4)) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    const cost = Math.max(1, Math.floor(attacker.maxHp / 4));
    attacker.currentHp = Math.max(1, attacker.currentHp - cost);
    attacker.volatile.substitute = { hp: cost };
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} put up a substitute!`,
      pokemon: attacker.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'leech-seed') {
    const types = defender.pokemon.types.map((t) =>
      (typeof t === 'string' ? t : t.type?.name || '').toLowerCase()
    );
    if (types.includes('grass') || defender.volatile.leechSeed) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    defender.volatile.leechSeed = true;
    defender.volatile.leechSeedSource = {
      owner: isPlayer ? 'player' : 'opponent',
      index: attackerSide.currentIndex,
    };
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} was seeded!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'yawn') {
    if (defender.status || defender.volatile.yawn) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    defender.volatile.yawn = { turns: 2 };
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} grew drowsy!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'perish-song') {
    for (const side of [state.player, state.opponent]) {
      const mon = getCurrentPokemon(side);
      if (mon.currentHp > 0 && !mon.volatile.perishSong) {
        mon.volatile.perishSong = { turns: 3 };
      }
    }
    state.battleLog.push({
      type: 'status_effect',
      message: 'All Pokémon that heard the song will faint in three turns!',
    });
    return true;
  }

  if (moveLower === 'wish') {
    attacker.volatile.wish = {
      turns: 2,
      heal: Math.max(1, Math.floor(attacker.maxHp / 2)),
    };
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} made a wish!`,
      pokemon: attacker.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'safeguard') {
    attackerSide.sideConditions.screens.safeguard = { turns: 5 };
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name}'s team became cloaked in a mystical veil!`,
    });
    return true;
  }

  if (moveLower === 'tailwind') {
    if (attackerSide.sideConditions.screens.tailwind) {
      state.battleLog.push({ type: 'status_effect', message: 'But it failed!' });
      return true;
    }
    setTailwind(attackerSide, 4);
    state.battleLog.push({
      type: 'status_effect',
      message: `The Tailwind blew from behind ${attacker.pokemon.name}'s team!`,
    });
    return true;
  }

  if (moveLower === 'rapid-spin' || moveLower === 'mortal-spin') {
    clearSideHazards(attackerSide.sideConditions.hazards);
    // Also clear binding / leech seed on user
    attacker.volatile.binding = undefined;
    attacker.volatile.leechSeed = undefined;
    attacker.volatile.leechSeedSource = undefined;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} blew away hazards with ${moveLower === 'mortal-spin' ? 'Mortal Spin' : 'Rapid Spin'}!`,
      pokemon: attacker.pokemon.name,
    });
    // Mortal Spin also poisons — handled by ailment if present; spin itself continues as damaging move
    return false;
  }

  if (moveLower === 'defog') {
    clearSideHazards(defenderSide.sideConditions.hazards);
    clearSideHazards(attackerSide.sideConditions.hazards);
    // Lower foe evasion by 1
    defender.statModifiers.evasion = Math.max(-6, defender.statModifiers.evasion - 1);
    // Remove screens on both sides
    delete attackerSide.sideConditions.screens.reflect;
    delete attackerSide.sideConditions.screens.lightScreen;
    delete attackerSide.sideConditions.screens.auroraVeil;
    delete defenderSide.sideConditions.screens.reflect;
    delete defenderSide.sideConditions.screens.lightScreen;
    delete defenderSide.sideConditions.screens.auroraVeil;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} blew away the obstacles with Defog!`,
      pokemon: attacker.pokemon.name,
    });
    return true;
  }

  if (moveLower === 'court-change') {
    swapSideHazards(attackerSide.sideConditions.hazards, defenderSide.sideConditions.hazards);
    const aScr = { ...attackerSide.sideConditions.screens };
    attackerSide.sideConditions.screens = { ...defenderSide.sideConditions.screens };
    defenderSide.sideConditions.screens = aScr;
    state.battleLog.push({
      type: 'status_effect',
      message: `${attacker.pokemon.name} swapped the battle effects with Court Change!`,
      pokemon: attacker.pokemon.name,
    });
    return true;
  }

  return false;
}

/** Apply binding after a damaging trap move hits. */
export function applyBindingOnHit(
  state: BattleState,
  moveLower: string,
  defender: BattlePokemon
): void {
  const info = BINDING_MOVES[moveLower];
  if (!info || defender.currentHp <= 0) return;
  if (defender.volatile.binding) return;
  defender.volatile.binding = { kind: info.kind, turnsLeft: 4, fraction: info.fraction };
  state.battleLog.push({
    type: 'status_effect',
    message: `${defender.pokemon.name} was trapped by ${info.kind}!`,
    pokemon: defender.pokemon.name,
  });
}

export { BINDING_MOVES };
