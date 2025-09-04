import { BattlePokemon, BattleState, Move } from "./battle-engine";
import { getTypeEffectiveness } from "./battle-engine";

export type Difficulty = "easy" | "normal" | "hard";

// AI move selection heuristics based on modern Pokemon games
export class BattleAI {
  private difficulty: Difficulty;
  
  constructor(difficulty: Difficulty = "normal") {
    this.difficulty = difficulty;
  }
  
  // Main AI decision function
  selectAction(state: BattleState): { type: 'move'; moveIndex: number } {
    const aiPokemon = state.opponent;
    const playerPokemon = state.player;
    
    // Get available moves
    const availableMoves = aiPokemon.moves
      .map((move, index) => ({ move, index }))
      .filter(({ move }) => move && move.power > 0);
    
    if (availableMoves.length === 0) {
      return { type: 'move', moveIndex: 0 };
    }
    
    // Score each move based on difficulty
    const scoredMoves = availableMoves.map(({ move, index }) => ({
      move,
      index,
      score: this.scoreMove(move, aiPokemon, playerPokemon)
    }));
    
    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Apply difficulty-based selection
    return this.selectMoveByDifficulty(scoredMoves);
  }
  
  // Score a move based on various factors
  private scoreMove(move: Move, aiPokemon: BattlePokemon, playerPokemon: BattlePokemon): number {
    let score = 0;
    
    // Base power score
    score += (move.power || 0) * 0.3;
    
    // Type effectiveness
    const effectiveness = getTypeEffectiveness(move.type, playerPokemon.pokemon.types);
    score += effectiveness * 50;
    
    // STAB bonus
    if (aiPokemon.pokemon.types.includes(move.type)) {
      score += 20;
    }
    
    // Accuracy consideration
    const accuracy = move.accuracy || 100;
    score += accuracy * 0.2;
    
    // Status moves get bonus points
    if (move.power === 0 && move.effect) {
      score += 15;
    }
    
    // High power moves get bonus
    if ((move.power || 0) > 100) {
      score += 25;
    }
    
    // Consider player's HP - if low, prioritize finishing moves
    const playerHpPercent = playerPokemon.currentHp / playerPokemon.maxHp;
    if (playerHpPercent < 0.3 && (move.power || 0) > 80) {
      score += 30;
    }
    
    // Consider AI's HP - if low, prioritize healing or high damage
    const aiHpPercent = aiPokemon.currentHp / aiPokemon.maxHp;
    if (aiHpPercent < 0.3) {
      if (move.name.toLowerCase().includes('heal') || move.name.toLowerCase().includes('recover')) {
        score += 40;
      } else if ((move.power || 0) > 90) {
        score += 20;
      }
    }
    
    return score;
  }
  
  // Select move based on difficulty
  private selectMoveByDifficulty(scoredMoves: Array<{ move: Move; index: number; score: number }>): { type: 'move'; moveIndex: number } {
    switch (this.difficulty) {
      case "easy":
        // Easy AI: sometimes picks suboptimal moves
        if (Math.random() < 0.3 && scoredMoves.length > 1) {
          const randomIndex = Math.floor(Math.random() * Math.min(3, scoredMoves.length));
          return { type: 'move', moveIndex: scoredMoves[randomIndex].index };
        }
        return { type: 'move', moveIndex: scoredMoves[0].index };
        
      case "normal":
        // Normal AI: usually picks best move, sometimes second best
        if (Math.random() < 0.2 && scoredMoves.length > 1) {
          return { type: 'move', moveIndex: scoredMoves[1].index };
        }
        return { type: 'move', moveIndex: scoredMoves[0].index };
        
      case "hard":
        // Hard AI: always picks optimal move, considers more factors
        return { type: 'move', moveIndex: scoredMoves[0].index };
        
      default:
        return { type: 'move', moveIndex: scoredMoves[0].index };
    }
  }
  
  // Advanced AI tactics for hard difficulty
  private getAdvancedScore(move: Move, aiPokemon: BattlePokemon, playerPokemon: BattlePokemon): number {
    let score = this.scoreMove(move, aiPokemon, playerPokemon);
    
    // Consider stat boosts/debuffs
    if (move.effect && move.effect.includes('stat')) {
      score += 25;
    }
    
    // Consider weather moves
    if (move.name.toLowerCase().includes('rain') || move.name.toLowerCase().includes('sunny')) {
      score += 15;
    }
    
    // Consider priority moves
    if (move.priority && move.priority > 0) {
      score += 20;
    }
    
    // Consider multi-hit moves
    if (move.name.toLowerCase().includes('fury') || move.name.toLowerCase().includes('multi')) {
      score += 10;
    }
    
    return score;
  }
}

// Factory function to create AI with difficulty
export function createBattleAI(difficulty: Difficulty): BattleAI {
  return new BattleAI(difficulty);
}

// Utility function to get AI move selection with delay (for UI)
export async function getAIMove(
  state: BattleState, 
  difficulty: Difficulty,
  delayMs: number = 1000
): Promise<{ type: 'move'; moveIndex: number }> {
  const ai = createBattleAI(difficulty);
  
  // Add delay to make AI feel more natural
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  return ai.selectAction(state);
}
