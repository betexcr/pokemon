// Pokemon Contest Move Data based on actual Pokemon games
// Moves are categorized by their contest appeal type and properties

export interface ContestMoveData {
  name: string
  category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough'
  appeal: number // Base appeal points (hearts gained)
  jam: number // Jam points (hearts lost by opponents)
  description: string
  effect: string
  comboStarter?: boolean // Can this move start a combo?
  comboFollower?: boolean // Does this move follow in a combo?
  comboMoves?: string[] // List of moves that can combo with this one
}

export const CONTEST_MOVES: Record<string, ContestMoveData> = {
  // Cool Moves
  'ice-beam': {
    name: 'Ice Beam',
    category: 'cool',
    appeal: 2,
    jam: 0,
    description: 'A freezing cold beam attack that may paralyze.',
    effect: 'Standard appeal',
    comboStarter: true,
    comboMoves: ['blizzard', 'aurora-beam']
  },
  'thunder': {
    name: 'Thunder',
    category: 'cool',
    appeal: 2,
    jam: 1,
    description: 'A powerful electric attack.',
    effect: 'Startles all Pokemon',
    comboFollower: true
  },
  'flamethrower': {
    name: 'Flamethrower',
    category: 'cool',
    appeal: 2,
    jam: 0,
    description: 'A scorching flame attack.',
    effect: 'Standard appeal',
    comboStarter: true,
    comboMoves: ['fire-blast', 'heat-wave']
  },
  'blizzard': {
    name: 'Blizzard',
    category: 'cool',
    appeal: 3,
    jam: 0,
    description: 'A devastating ice storm.',
    effect: 'Works better in later turns',
    comboFollower: true
  },
  'hyper-beam': {
    name: 'Hyper Beam',
    category: 'cool',
    appeal: 4,
    jam: 0,
    description: 'An incredibly powerful beam.',
    effect: 'High appeal but makes Pokemon unable to act next turn',
    comboFollower: true
  },
  'dragon-claw': {
    name: 'Dragon Claw',
    category: 'cool',
    appeal: 3,
    jam: 0,
    description: 'Sharp claws slash the target.',
    effect: 'Standard appeal'
  },
  'shadow-ball': {
    name: 'Shadow Ball',
    category: 'cool',
    appeal: 2,
    jam: 1,
    description: 'Hurls a shadowy blob.',
    effect: 'Startles Pokemon that acted before user'
  },
  'surf': {
    name: 'Surf',
    category: 'cool',
    appeal: 2,
    jam: 0,
    description: 'Swamps everything with giant waves.',
    effect: 'Standard appeal'
  },
  
  // Beauty Moves
  'petal-dance': {
    name: 'Petal Dance',
    category: 'beauty',
    appeal: 4,
    jam: 0,
    description: 'A graceful dance with petals.',
    effect: 'Excites the audience a lot'
  },
  'moonlight': {
    name: 'Moonlight',
    category: 'beauty',
    appeal: 1,
    jam: 0,
    description: 'Restores HP under moonlight.',
    effect: 'Works better if audience excitement is low'
  },
  'aurora-beam': {
    name: 'Aurora Beam',
    category: 'beauty',
    appeal: 2,
    jam: 0,
    description: 'A colorful aurora attack.',
    effect: 'Standard appeal',
    comboFollower: true
  },
  'solar-beam': {
    name: 'Solar Beam',
    category: 'beauty',
    appeal: 4,
    jam: 0,
    description: 'A brilliant solar energy beam.',
    effect: 'Works better in later turns',
    comboFollower: true
  },
  'dazzling-gleam': {
    name: 'Dazzling Gleam',
    category: 'beauty',
    appeal: 2,
    jam: 1,
    description: 'A dazzling fairy attack.',
    effect: 'Startles all Pokemon'
  },
  'magical-leaf': {
    name: 'Magical Leaf',
    category: 'beauty',
    appeal: 2,
    jam: 0,
    description: 'Scatters magical leaves.',
    effect: 'Standard appeal'
  },
  'aqua-ring': {
    name: 'Aqua Ring',
    category: 'beauty',
    appeal: 2,
    jam: 0,
    description: 'Envelops user in water.',
    effect: 'Prevents being startled once'
  },
  'feather-dance': {
    name: 'Feather Dance',
    category: 'beauty',
    appeal: 2,
    jam: 0,
    description: 'Envelops target in down.',
    effect: 'Standard appeal'
  },
  
  // Cute Moves
  'charm': {
    name: 'Charm',
    category: 'cute',
    appeal: 1,
    jam: 3,
    description: 'Charms foes with cuteness.',
    effect: 'Badly startles Pokemon that acted before user',
    comboStarter: true,
    comboMoves: ['attract', 'sweet-kiss']
  },
  'sweet-kiss': {
    name: 'Sweet Kiss',
    category: 'cute',
    appeal: 2,
    jam: 2,
    description: 'Confuses with a sweet kiss.',
    effect: 'Startles all Pokemon',
    comboFollower: true
  },
  'play-rough': {
    name: 'Play Rough',
    category: 'cute',
    appeal: 3,
    jam: 0,
    description: 'Plays roughly with the target.',
    effect: 'Standard appeal'
  },
  'baby-doll-eyes': {
    name: 'Baby-Doll Eyes',
    category: 'cute',
    appeal: 2,
    jam: 0,
    description: 'Stares with puppy dog eyes.',
    effect: 'Works well in the first turn'
  },
  'disarming-voice': {
    name: 'Disarming Voice',
    category: 'cute',
    appeal: 2,
    jam: 0,
    description: 'A charming cry.',
    effect: 'Cannot be avoided'
  },
  'attract': {
    name: 'Attract',
    category: 'cute',
    appeal: 1,
    jam: 3,
    description: 'Infatuates the target.',
    effect: 'Makes subsequent Pokemon nervous',
    comboFollower: true
  },
  'tail-whip': {
    name: 'Tail Whip',
    category: 'cute',
    appeal: 2,
    jam: 0,
    description: 'Wags tail cutely.',
    effect: 'Standard appeal'
  },
  'bounce': {
    name: 'Bounce',
    category: 'cute',
    appeal: 1,
    jam: 0,
    description: 'Bounces high, then drops.',
    effect: 'Excites a lot if used first'
  },
  
  // Clever Moves
  'psychic': {
    name: 'Psychic',
    category: 'clever',
    appeal: 2,
    jam: 1,
    description: 'A powerful psychic attack.',
    effect: 'Startles Pokemon that acted before user'
  },
  'confusion': {
    name: 'Confusion',
    category: 'clever',
    appeal: 3,
    jam: 0,
    description: 'A mind-bending attack.',
    effect: 'Standard appeal',
    comboStarter: true,
    comboMoves: ['psychic', 'psybeam']
  },
  'future-sight': {
    name: 'Future Sight',
    category: 'clever',
    appeal: 3,
    jam: 0,
    description: 'Predicts the future.',
    effect: 'Works well in later turns',
    comboFollower: true
  },
  'trick': {
    name: 'Trick',
    category: 'clever',
    appeal: 1,
    jam: 3,
    description: 'Swaps items with target.',
    effect: 'Startles all Pokemon'
  },
  'magic-coat': {
    name: 'Magic Coat',
    category: 'clever',
    appeal: 1,
    jam: 0,
    description: 'Reflects status moves.',
    effect: 'Prevents being startled'
  },
  'calm-mind': {
    name: 'Calm Mind',
    category: 'clever',
    appeal: 1,
    jam: 0,
    description: 'Focuses the mind.',
    effect: 'Ups appeal if same move is used in succession'
  },
  'light-screen': {
    name: 'Light Screen',
    category: 'clever',
    appeal: 2,
    jam: 0,
    description: 'Creates a light barrier.',
    effect: 'Prevents being startled once'
  },
  'psybeam': {
    name: 'Psybeam',
    category: 'clever',
    appeal: 2,
    jam: 0,
    description: 'A peculiar ray.',
    effect: 'Standard appeal',
    comboFollower: true
  },
  
  // Tough Moves
  'rock-slide': {
    name: 'Rock Slide',
    category: 'tough',
    appeal: 1,
    jam: 3,
    description: 'Hurls boulders at the target.',
    effect: 'Badly startles all Pokemon',
    comboStarter: true,
    comboMoves: ['earthquake', 'rock-tomb']
  },
  'earthquake': {
    name: 'Earthquake',
    category: 'tough',
    appeal: 1,
    jam: 3,
    description: 'A powerful ground shake.',
    effect: 'Badly startles all Pokemon',
    comboFollower: true
  },
  'iron-tail': {
    name: 'Iron Tail',
    category: 'tough',
    appeal: 2,
    jam: 1,
    description: 'A hard iron tail attack.',
    effect: 'Works better later'
  },
  'giga-impact': {
    name: 'Giga Impact',
    category: 'tough',
    appeal: 4,
    jam: 0,
    description: 'An incredibly tough attack.',
    effect: 'High appeal but makes unable to act next turn'
  },
  'superpower': {
    name: 'Superpower',
    category: 'tough',
    appeal: 3,
    jam: 0,
    description: 'A super powerful move.',
    effect: 'Standard appeal'
  },
  'focus-punch': {
    name: 'Focus Punch',
    category: 'tough',
    appeal: 4,
    jam: 0,
    description: 'A focused devastating punch.',
    effect: 'Works worse if startled'
  },
  'bulk-up': {
    name: 'Bulk Up',
    category: 'tough',
    appeal: 1,
    jam: 0,
    description: 'Bulks up the body.',
    effect: 'Ups appeal if same move used in succession'
  },
  'rock-tomb': {
    name: 'Rock Tomb',
    category: 'tough',
    appeal: 2,
    jam: 1,
    description: 'Traps with boulders.',
    effect: 'Prevents leading Pokemon from fleeing',
    comboFollower: true
  }
}

// Move combos based on real Pokemon contest mechanics
export const CONTEST_COMBOS: Array<{ starter: string; followers: string[]; bonus: number }> = [
  // Ice combos
  { starter: 'ice-beam', followers: ['blizzard', 'aurora-beam'], bonus: 2 },
  
  // Fire combos
  { starter: 'flamethrower', followers: ['fire-blast', 'heat-wave'], bonus: 2 },
  
  // Psychic combos
  { starter: 'confusion', followers: ['psychic', 'psybeam', 'future-sight'], bonus: 2 },
  
  // Cute combos
  { starter: 'charm', followers: ['attract', 'sweet-kiss'], bonus: 3 },
  
  // Tough combos
  { starter: 'rock-slide', followers: ['earthquake', 'rock-tomb'], bonus: 2 }
]

export function getContestMove(moveName: string): ContestMoveData | undefined {
  const normalizedName = moveName.toLowerCase().replace(/\s+/g, '-')
  return CONTEST_MOVES[normalizedName]
}

export function getMovesByCategory(category: 'cool' | 'beauty' | 'cute' | 'clever' | 'tough'): ContestMoveData[] {
  return Object.values(CONTEST_MOVES).filter(move => move.category === category)
}

export function checkCombo(previousMove: string | null, currentMove: string): { isCombo: boolean; bonus: number } {
  if (!previousMove) return { isCombo: false, bonus: 0 }
  
  const normalizedPrev = previousMove.toLowerCase().replace(/\s+/g, '-')
  const normalizedCurr = currentMove.toLowerCase().replace(/\s+/g, '-')
  
  const combo = CONTEST_COMBOS.find(
    c => c.starter === normalizedPrev && c.followers.includes(normalizedCurr)
  )
  
  return combo ? { isCombo: true, bonus: combo.bonus } : { isCombo: false, bonus: 0 }
}
