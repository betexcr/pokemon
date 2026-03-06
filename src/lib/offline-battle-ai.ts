import { BattlePokemon, BattleTeam, getCurrentPokemon } from './team-battle-engine';
import { calculateTypeEffectiveness, TypeName } from './damage-calculator';

function getTypeNames(pokemon: BattlePokemon): TypeName[] {
  return (pokemon.pokemon.types || []).map((t: any) => {
    const name = typeof t === 'string' ? t : t.type?.name || t.name || 'normal';
    return (name.charAt(0).toUpperCase() + name.slice(1)) as TypeName;
  });
}

function getMoveType(move: any): TypeName {
  const raw = move.type || 'normal';
  const name = typeof raw === 'string' ? raw : raw.name || 'normal';
  return (name.charAt(0).toUpperCase() + name.slice(1)) as TypeName;
}

function estimateMovePower(move: any): number {
  if (typeof move.power === 'number' && move.power > 0) return move.power;
  if (typeof move.basePower === 'number' && move.basePower > 0) return move.basePower;
  return 0;
}

function scoreMoveAgainst(move: any, attacker: BattlePokemon, defender: BattlePokemon): number {
  const moveType = getMoveType(move);
  const defenderTypes = getTypeNames(defender);
  const attackerTypes = getTypeNames(attacker);
  const effectiveness = calculateTypeEffectiveness(moveType, defenderTypes);

  if (effectiveness === 0) return -100;

  const power = estimateMovePower(move);
  if (power === 0) {
    // Status move: give moderate score for status-inflicting moves
    const moveId = (move.id || move.name || '').toLowerCase();
    if (defender.status) return 5; // already statused, less valuable
    if (['thunder-wave', 'toxic', 'will-o-wisp', 'spore', 'sleep-powder', 'hypnosis'].includes(moveId)) return 40;
    if (['stealth-rock', 'spikes', 'toxic-spikes'].includes(moveId)) return 30;
    if (['swords-dance', 'nasty-plot', 'calm-mind', 'dragon-dance'].includes(moveId)) return 35;
    if (['recover', 'soft-boiled', 'roost', 'synthesis', 'moonlight'].includes(moveId)) {
      return attacker.currentHp < attacker.maxHp * 0.5 ? 50 : 10;
    }
    return 15;
  }

  let score = power * effectiveness;

  // STAB bonus
  if (attackerTypes.includes(moveType)) {
    score *= 1.5;
  }

  // Category advantage: use the higher offensive stat
  const isPhysical = (move.damage_class || move.category || '').toLowerCase() === 'physical';
  const atkStat = attacker.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === (isPhysical ? 'attack' : 'special-attack'))?.base_stat ?? 50;
  const defStat = defender.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === (isPhysical ? 'defense' : 'special-defense'))?.base_stat ?? 50;
  score *= (atkStat / Math.max(1, defStat));

  // Accuracy penalty
  if (typeof move.accuracy === 'number' && move.accuracy < 100) {
    score *= (move.accuracy / 100);
  }

  return score;
}

export type AIAction = 
  | { type: 'move'; moveId: string }
  | { type: 'switch'; switchIndex: number };

export function chooseAIAction(aiTeam: BattleTeam, playerTeam: BattleTeam): AIAction {
  const aiActive = getCurrentPokemon(aiTeam);
  const playerActive = getCurrentPokemon(playerTeam);

  if (aiActive.currentHp <= 0) {
    for (let i = 0; i < aiTeam.pokemon.length; i++) {
      if (i !== aiTeam.currentIndex && aiTeam.pokemon[i].currentHp > 0) {
        return { type: 'switch', switchIndex: i };
      }
    }
    return { type: 'move', moveId: aiActive.moves[0]?.id || 'struggle' };
  }

  const availableMoves = aiActive.moves.filter(m => m.pp > 0 && !m.disabled);
  if (availableMoves.length === 0) {
    return { type: 'move', moveId: 'struggle' };
  }

  // Score each move
  const moveScores = availableMoves.map(move => ({
    moveId: move.id,
    score: scoreMoveAgainst(move, aiActive, playerActive),
  }));

  // Consider switching if current matchup is bad
  const bestMoveScore = Math.max(...moveScores.map(m => m.score));
  let bestSwitchScore = -Infinity;
  let bestSwitchIndex = -1;

  for (let i = 0; i < aiTeam.pokemon.length; i++) {
    if (i === aiTeam.currentIndex) continue;
    const candidate = aiTeam.pokemon[i];
    if (candidate.currentHp <= 0) continue;

    const candidateMoves = candidate.moves.filter(m => m.pp > 0);
    if (candidateMoves.length === 0) continue;

    const candidateBestScore = Math.max(
      ...candidateMoves.map(m => scoreMoveAgainst(m, candidate, playerActive))
    );
    // Penalize switching (switching costs a turn)
    const switchScore = candidateBestScore * 0.7;
    if (switchScore > bestSwitchScore) {
      bestSwitchScore = switchScore;
      bestSwitchIndex = i;
    }
  }

  // Switch if the best switch option is significantly better than attacking
  if (bestSwitchIndex >= 0 && bestSwitchScore > bestMoveScore * 1.5 && bestMoveScore < 50) {
    return { type: 'switch', switchIndex: bestSwitchIndex };
  }

  // Pick the best move with some randomness for variety
  moveScores.sort((a, b) => b.score - a.score);
  // 80% pick the best, 20% pick second-best if available
  if (moveScores.length > 1 && Math.random() < 0.2) {
    return { type: 'move', moveId: moveScores[1].moveId };
  }

  return { type: 'move', moveId: moveScores[0].moveId };
}
