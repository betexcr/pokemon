import { CONTEST_MOVES, getMovesByCategory, ContestMoveData } from './contestMoves'

export interface ContestCategory {
  id: string
  name: string
  color: string
  icon: string
  description: string
  stat: string
}

export interface ContestMove {
  name: string
  category: string
  description: string
  power: number
}

export interface ContestRank {
  name: string
  minScore: number
  reward: string
  color: string
}

export const contestData = {
  categories: [
    {
      id: 'cool',
      name: 'Cool',
      color: 'from-blue-400 to-blue-600',
      icon: '❄️',
      description: 'Show off your Pokémon\'s cool and stylish moves!',
      stat: 'coolness'
    },
    {
      id: 'beauty',
      name: 'Beauty',
      color: 'from-pink-400 to-pink-600',
      icon: '🌸',
      description: 'Display your Pokémon\'s beautiful and elegant moves!',
      stat: 'beauty'
    },
    {
      id: 'cute',
      name: 'Cute',
      color: 'from-purple-400 to-purple-600',
      icon: '💖',
      description: 'Showcase your Pokémon\'s adorable and charming moves!',
      stat: 'cuteness'
    },
    {
      id: 'clever',
      name: 'Clever',
      color: 'from-green-400 to-green-600',
      icon: '🧠',
      description: 'Demonstrate your Pokémon\'s smart and clever moves!',
      stat: 'cleverness'
    },
    {
      id: 'tough',
      name: 'Tough',
      color: 'from-red-400 to-red-600',
      icon: '💪',
      description: 'Exhibit your Pokémon\'s strong and tough moves!',
      stat: 'toughness'
    }
  ] as ContestCategory[],

  // Use real contest moves from the engine
  moves: Object.values(CONTEST_MOVES).map(move => ({
    name: move.name,
    category: move.category,
    description: move.description,
    power: move.appeal
  })) as ContestMove[],

  ranks: [
    { name: 'Normal', minScore: 0, reward: 'Participation Ribbon', color: 'from-gray-400 to-gray-600' },
    { name: 'Super', minScore: 20, reward: 'Super Ribbon', color: 'from-green-400 to-green-600' },
    { name: 'Hyper', minScore: 35, reward: 'Hyper Ribbon', color: 'from-blue-400 to-blue-600' },
    { name: 'Master', minScore: 50, reward: 'Master Ribbon', color: 'from-purple-400 to-purple-600' }
  ] as ContestRank[],

  pokeblocks: [
    { color: 'Red', stat: 'coolness', description: 'Raises Coolness' },
    { color: 'Blue', stat: 'beauty', description: 'Raises Beauty' },
    { color: 'Pink', stat: 'cuteness', description: 'Raises Cuteness' },
    { color: 'Green', stat: 'cleverness', description: 'Raises Cleverness' },
    { color: 'Yellow', stat: 'toughness', description: 'Raises Toughness' },
    { color: 'Rainbow', stat: 'all', description: 'Raises All Stats' }
  ]
}

// Helper to get moves for a specific category using the engine
export function getMovesForCategory(category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough'): ContestMove[] {
  const moves = getMovesByCategory(category)
  return moves.map(move => ({
    name: move.name,
    category: move.category,
    description: move.description,
    power: move.appeal
  }))
}
