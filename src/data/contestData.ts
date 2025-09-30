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

  moves: [
    // Cool moves
    { name: 'Ice Beam', category: 'cool', description: 'A freezing beam of ice!', power: 3 },
    { name: 'Thunder', category: 'cool', description: 'A powerful electric attack!', power: 3 },
    { name: 'Flamethrower', category: 'cool', description: 'A scorching flame attack!', power: 3 },
    { name: 'Blizzard', category: 'cool', description: 'A devastating snowstorm!', power: 4 },
    { name: 'Hyper Beam', category: 'cool', description: 'An incredibly powerful beam!', power: 4 },
    
    // Beauty moves
    { name: 'Petal Dance', category: 'beauty', description: 'A graceful dance with petals!', power: 3 },
    { name: 'Moonlight', category: 'beauty', description: 'A beautiful moonlight beam!', power: 3 },
    { name: 'Aurora Beam', category: 'beauty', description: 'A colorful aurora attack!', power: 3 },
    { name: 'Solar Beam', category: 'beauty', description: 'A brilliant solar energy beam!', power: 4 },
    { name: 'Dazzling Gleam', category: 'beauty', description: 'A dazzling fairy attack!', power: 4 },
    
    // Cute moves
    { name: 'Charm', category: 'cute', description: 'An adorable charming move!', power: 2 },
    { name: 'Sweet Kiss', category: 'cute', description: 'A sweet and loving kiss!', power: 2 },
    { name: 'Play Rough', category: 'cute', description: 'A playful roughhousing move!', power: 3 },
    { name: 'Baby-Doll Eyes', category: 'cute', description: 'The cutest puppy dog eyes!', power: 2 },
    { name: 'Disarming Voice', category: 'cute', description: 'A cute voice that charms!', power: 3 },
    
    // Clever moves
    { name: 'Psychic', category: 'clever', description: 'A powerful psychic attack!', power: 3 },
    { name: 'Confusion', category: 'clever', description: 'A mind-bending attack!', power: 2 },
    { name: 'Future Sight', category: 'clever', description: 'A move that predicts the future!', power: 4 },
    { name: 'Trick', category: 'clever', description: 'A clever trick move!', power: 2 },
    { name: 'Magic Coat', category: 'clever', description: 'A magical defensive move!', power: 3 },
    
    // Tough moves
    { name: 'Rock Slide', category: 'tough', description: 'A powerful rock avalanche!', power: 3 },
    { name: 'Earthquake', category: 'tough', description: 'A devastating ground shake!', power: 4 },
    { name: 'Iron Tail', category: 'tough', description: 'A hard iron tail attack!', power: 3 },
    { name: 'Giga Impact', category: 'tough', description: 'An incredibly tough attack!', power: 4 },
    { name: 'Superpower', category: 'tough', description: 'A super powerful move!', power: 4 }
  ] as ContestMove[],

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
