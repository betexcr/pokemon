// Contest Logic Engine - Core mechanics for Pokemon Contests
// Based on Generation III/IV/VI contest rules

import { CONTEST_MOVES, checkCombo, ContestMoveData } from './contestMoves'

export interface ContestStats {
  coolness: number
  beauty: number
  cuteness: number
  cleverness: number
  toughness: number
}

export interface ContestParticipant {
  id: string
  name: string
  pokemon: {
    name: string
    id: number
    stats: ContestStats
  }
  moves: string[] // Move names
  isPlayer: boolean
}

export interface ContestState {
  round: 'introduction' | 'talent' | 'results'
  category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough'
  participants: ContestParticipant[]
  scores: Record<string, {
    introductionScore: number // Stars from introduction
    talentScore: number // Hearts from talent round
    totalScore: number
    exciteMeter: number // 0-100
    usedMoves: string[]
    lastMove: string | null
    spectacularUsed: boolean
  }>
  currentTurn: number
  maxTurns: number
  turnOrder: string[] // Participant IDs in order
}

// Calculate introduction round score based on Pokemon's contest stat
export function calculateIntroductionScore(
  pokemonStats: ContestStats,
  category: keyof ContestStats
): number {
  const statValue = pokemonStats[category]
  
  // In real contests, stats are 0-255
  // Stars awarded: 0-51 stat = 1 star, 52-102 = 2 stars, 103-153 = 3 stars, etc.
  if (statValue >= 204) return 5
  if (statValue >= 153) return 4
  if (statValue >= 102) return 3
  if (statValue >= 51) return 2
  return 1
}

// Calculate appeal points for a move in talent round
export function calculateAppeal(
  move: ContestMoveData,
  category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough',
  exciteMeter: number,
  lastMove: string | null,
  previousMove: string | null
): {
  hearts: number
  exciteGain: number
  penalty: number
  bonus: number
  isSpectacular: boolean
  isCombo: boolean
  isRepeat: boolean
} {
  let hearts = move.appeal
  let exciteGain = 0
  let penalty = 0
  let bonus = 0
  let isSpectacular = false
  let isCombo = false
  const isRepeat = lastMove === move.name

  // Check if move matches category (bonus excitement)
  const matchesCategory = move.category === category
  if (matchesCategory) {
    exciteGain = 20
    bonus += 1 // Bonus heart for matching category
  }

  // Check for move repetition penalty
  if (isRepeat) {
    penalty = 2 // Lose 2 hearts for repeating
  }

  // Check for combo bonus
  const comboCheck = checkCombo(previousMove, move.name)
  if (comboCheck.isCombo) {
    isCombo = true
    bonus += comboCheck.bonus
  }

  // Spectacular talent (when excite meter is full)
  if (exciteMeter >= 100) {
    isSpectacular = true
    bonus += 5 // Spectacular talent gives +5 hearts
    exciteGain = -100 // Reset meter
  }

  hearts += bonus - penalty

  return {
    hearts: Math.max(0, hearts),
    exciteGain,
    penalty,
    bonus,
    isSpectacular,
    isCombo,
    isRepeat
  }
}

// Initialize a new contest
export function initializeContest(
  category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough',
  playerPokemon: { name: string; id: number; stats: ContestStats; moves: string[] },
  aiOpponents: Array<{ name: string; pokemon: { name: string; id: number; stats: ContestStats; moves: string[] } }>
): ContestState {
  const participants: ContestParticipant[] = [
    {
      id: 'player',
      name: 'You',
      pokemon: playerPokemon,
      moves: playerPokemon.moves,
      isPlayer: true
    },
    ...aiOpponents.map((ai, index) => ({
      id: `ai-${index}`,
      name: ai.name,
      pokemon: ai.pokemon,
      moves: ai.pokemon.moves,
      isPlayer: false
    }))
  ]

  // Calculate turn order based on introduction scores
  const turnOrder = participants
    .map(p => ({
      id: p.id,
      introScore: calculateIntroductionScore(p.pokemon.stats, category)
    }))
    .sort((a, b) => b.introScore - a.introScore) // Higher stats go first
    .map(p => p.id)

  const scores: ContestState['scores'] = {}
  participants.forEach(p => {
    scores[p.id] = {
      introductionScore: calculateIntroductionScore(p.pokemon.stats, category),
      talentScore: 0,
      totalScore: 0,
      exciteMeter: 0,
      usedMoves: [],
      lastMove: null,
      spectacularUsed: false
    }
  })

  return {
    round: 'introduction',
    category,
    participants,
    scores,
    currentTurn: 0,
    maxTurns: 5, // 5 appeal turns standard
    turnOrder
  }
}

// Execute a move in the talent round
export function executeTalentMove(
  state: ContestState,
  participantId: string,
  moveName: string
): ContestState {
  const participant = state.participants.find(p => p.id === participantId)
  if (!participant) return state

  const move = CONTEST_MOVES[moveName.toLowerCase().replace(/\s+/g, '-')]
  if (!move) return state

  const participantScore = state.scores[participantId]
  const previousMove = participantScore.usedMoves[participantScore.usedMoves.length - 2] || null

  const appeal = calculateAppeal(
    move,
    state.category,
    participantScore.exciteMeter,
    participantScore.lastMove,
    previousMove
  )

  // Update participant's score
  const newScores = { ...state.scores }
  newScores[participantId] = {
    ...participantScore,
    talentScore: participantScore.talentScore + appeal.hearts,
    totalScore: participantScore.introductionScore + participantScore.talentScore + appeal.hearts,
    exciteMeter: Math.max(0, Math.min(100, participantScore.exciteMeter + appeal.exciteGain)),
    usedMoves: [...participantScore.usedMoves, moveName],
    lastMove: moveName,
    spectacularUsed: participantScore.spectacularUsed || appeal.isSpectacular
  }

  // Apply jam effects to other participants if move has jam
  if (move.jam > 0) {
    Object.keys(newScores).forEach(id => {
      if (id !== participantId) {
        newScores[id] = {
          ...newScores[id],
          talentScore: Math.max(0, newScores[id].talentScore - move.jam)
        }
      }
    })
  }

  return {
    ...state,
    scores: newScores,
    currentTurn: state.currentTurn + 1
  }
}

// Simple AI move selection
export function selectAIMove(
  participant: ContestParticipant,
  state: ContestState,
  participantId: string
): string {
  const score = state.scores[participantId]
  const availableMoves = participant.moves
    .map(m => CONTEST_MOVES[m.toLowerCase().replace(/\s+/g, '-')])
    .filter(Boolean) as ContestMoveData[]

  // Strategy: 
  // 1. Avoid repeating last move
  // 2. Prefer moves matching contest category
  // 3. Use combo moves if available
  // 4. Random otherwise

  const matchingMoves = availableMoves.filter(m => m.category === state.category && m.name !== score.lastMove)
  if (matchingMoves.length > 0) {
    return matchingMoves[Math.floor(Math.random() * matchingMoves.length)].name
  }

  const nonRepeatMoves = availableMoves.filter(m => m.name !== score.lastMove)
  if (nonRepeatMoves.length > 0) {
    return nonRepeatMoves[Math.floor(Math.random() * nonRepeatMoves.length)].name
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)].name
}

// Determine contest rank based on final score
export function getContestRank(totalScore: number): {
  rank: 'Normal' | 'Super' | 'Hyper' | 'Master'
  ribbon: string
} {
  if (totalScore >= 50) return { rank: 'Master', ribbon: 'Master Ribbon' }
  if (totalScore >= 35) return { rank: 'Hyper', ribbon: 'Hyper Ribbon' }
  if (totalScore >= 20) return { rank: 'Super', ribbon: 'Super Ribbon' }
  return { rank: 'Normal', ribbon: 'Participation Ribbon' }
}

// Check if player won the contest
export function determineWinner(state: ContestState): { winnerId: string; winnerName: string; finalScore: number } | null {
  if (state.round !== 'results') return null

  let maxScore = -1
  let winnerId = ''
  let winnerName = ''

  Object.entries(state.scores).forEach(([id, score]) => {
    if (score.totalScore > maxScore) {
      maxScore = score.totalScore
      winnerId = id
      winnerName = state.participants.find(p => p.id === id)?.name || 'Unknown'
    }
  })

  return { winnerId, winnerName, finalScore: maxScore }
}
