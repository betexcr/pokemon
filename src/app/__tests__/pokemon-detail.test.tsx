import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PokemonDetailPage from '../pokemon/[id]/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getPokemon: jest.fn(),
  getPokemonSpecies: jest.fn(),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ''} />,
}))

describe('Pokemon Detail Page', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  const mockPokemon = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    base_experience: 64,
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      other: {
        'official-artwork': {
          front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          front_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png'
        }
      }
    },
    types: [
      { type: { name: 'grass' } },
      { type: { name: 'poison' } }
    ],
    abilities: [
      { ability: { name: 'overgrow' }, is_hidden: false },
      { ability: { name: 'chlorophyll' }, is_hidden: true }
    ],
    stats: [
      { stat: { name: 'hp' }, base_stat: 45 },
      { stat: { name: 'attack' }, base_stat: 49 },
      { stat: { name: 'defense' }, base_stat: 49 },
      { stat: { name: 'special-attack' }, base_stat: 65 },
      { stat: { name: 'special-defense' }, base_stat: 65 },
      { stat: { name: 'speed' }, base_stat: 45 }
    ],
    moves: [
      {
        move: { name: 'razor-wind' },
        version_group_details: [
          { move_learn_method: { name: 'level-up' }, level_learned_at: 1 }
        ]
      }
    ]
  }

  const mockSpecies = {
    flavor_text_entries: [
      { language: { name: 'en' }, flavor_text: 'A strange seed was planted on its back at birth.' }
    ],
    genera: [
      { language: { name: 'en' }, genus: 'Seed Pokémon' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => '[]'),
        setItem: jest.fn(),
      },
      writable: true,
    })
  })

  it('should render pokemon detail page with outline variant buttons', async () => {
    const api = await import('@/lib/api')
    jest.spyOn(api, 'getPokemon').mockResolvedValue(mockPokemon)
    jest.spyOn(api, 'getPokemonSpecies').mockResolvedValue(mockSpecies)

    render(await PokemonDetailPage({ params: { id: '1' } }))

    // Wait for the content to load
    await screen.findByText('Bulbasaur')

    // Check that the navigation buttons use outline variant
    const previousButton = screen.getByRole('button', { name: /previous pokémon/i })
    const nextButton = screen.getByRole('button', { name: /next pokémon/i })
    const shareButton = screen.getByRole('button', { name: /share pokémon/i })

    // Verify buttons have outline styling (border and transparent background)
    expect(previousButton).toHaveClass('border', 'border-border')
    expect(nextButton).toHaveClass('border', 'border-border')
    expect(shareButton).toHaveClass('border', 'border-border')

    // Verify buttons have proper text contrast
    expect(previousButton).toHaveClass('text-text')
    expect(nextButton).toHaveClass('text-text')
    expect(shareButton).toHaveClass('text-text')
  })

  it('should render comparison button with outline variant', async () => {
    const api = await import('@/lib/api')
    jest.spyOn(api, 'getPokemon').mockResolvedValue(mockPokemon)
    jest.spyOn(api, 'getPokemonSpecies').mockResolvedValue(mockSpecies)

    render(await PokemonDetailPage({ params: { id: '1' } }))

    // Wait for the content to load
    await screen.findByText('Bulbasaur')

    // Check that the comparison button uses outline variant
    const comparisonButton = screen.getByRole('button', { name: /add to comparison/i })

    // Verify button has outline styling
    expect(comparisonButton).toHaveClass('border', 'border-border')
    expect(comparisonButton).toHaveClass('text-text')
  })

  it('should handle comparison button state correctly', async () => {
    const api = await import('@/lib/api')
    jest.spyOn(api, 'getPokemon').mockResolvedValue(mockPokemon)
    jest.spyOn(api, 'getPokemonSpecies').mockResolvedValue(mockSpecies)

    // Mock localStorage to return a list with Bulbasaur
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => '[1]'),
        setItem: jest.fn(),
      },
      writable: true,
    })

    render(await PokemonDetailPage({ params: { id: '1' } }))

    // Wait for the content to load
    await screen.findByText('Bulbasaur')

    // Check that the comparison button shows "in comparison" state
    const comparisonButton = screen.getByRole('button', { name: /remove from comparison/i })

    // Verify button has comparison state styling
    expect(comparisonButton).toHaveClass('scale-110', 'ring-2', 'ring-blue-500')
  })

  it('should render all tab sections correctly', async () => {
    const api = await import('@/lib/api')
    jest.spyOn(api, 'getPokemon').mockResolvedValue(mockPokemon)
    jest.spyOn(api, 'getPokemonSpecies').mockResolvedValue(mockSpecies)

    render(await PokemonDetailPage({ params: { id: '1' } }))

    // Wait for the content to load
    await screen.findByText('Bulbasaur')

    // Check that all tab buttons are present
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.getByText('Moves')).toBeInTheDocument()
    expect(screen.getByText('Evolution')).toBeInTheDocument()
    expect(screen.getByText('Matchups')).toBeInTheDocument()

    // Check that the active tab (Overview) is highlighted
    const overviewTab = screen.getByText('Overview')
    expect(overviewTab).toHaveClass('bg-red-500', 'text-white')
  })

  it('should render pokemon information correctly', async () => {
    const api = await import('@/lib/api')
    jest.spyOn(api, 'getPokemon').mockResolvedValue(mockPokemon)
    jest.spyOn(api, 'getPokemonSpecies').mockResolvedValue(mockSpecies)

    render(await PokemonDetailPage({ params: { id: '1' } }))

    // Wait for the content to load
    await screen.findByText('Bulbasaur')

    // Check that pokemon information is displayed
    expect(screen.getByText('#001')).toBeInTheDocument()
    expect(screen.getByText('Grass')).toBeInTheDocument()
    expect(screen.getByText('Poison')).toBeInTheDocument()
    expect(screen.getByText('Seed Pokémon')).toBeInTheDocument()
  })
})
