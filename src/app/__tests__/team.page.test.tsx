import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import TeamBuilderPage from '../team/page'
import { getPokemonList, getPokemon } from '@/lib/api'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock API functions
jest.mock('@/lib/api', () => ({
  getPokemonList: jest.fn(),
  getPokemon: jest.fn()
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Team Builder Page', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockPokemonList = {
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
    ]
  }

  const mockPokemon = {
    id: 1,
    name: 'bulbasaur',
    types: [
      { slot: 1, type: { name: 'grass', url: '' } },
      { slot: 2, type: { name: 'poison', url: '' } }
    ],
    moves: [
      {
        move: { name: 'tackle', url: '' },
        version_group_details: [
          {
            level_learned_at: 1,
            move_learn_method: { name: 'level-up', url: '' },
            version_group: { name: 'red-blue', url: '' }
          }
        ]
      },
      {
        move: { name: 'vine-whip', url: '' },
        version_group_details: [
          {
            level_learned_at: 13,
            move_learn_method: { name: 'level-up', url: '' },
            version_group: { name: 'red-blue', url: '' }
          }
        ]
      }
    ],
    sprites: {
      front_default: 'bulbasaur-front.png',
      other: {
        'official-artwork': { front_default: 'bulbasaur-artwork.png' }
      }
    },
    base_experience: 64,
    height: 7,
    weight: 69,
    is_default: true,
    order: 1,
    abilities: [],
    forms: [],
    game_indices: [],
    held_items: [],
    location_area_encounters: '',
    stats: [],
    species: { name: 'bulbasaur', url: '' },
    evolution_chain: { name: '1', url: '' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getPokemonList as jest.Mock).mockResolvedValue(mockPokemonList)
    ;(getPokemon as jest.Mock).mockResolvedValue(mockPokemon)
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders team builder page with correct title', async () => {
    render(<TeamBuilderPage />)
    
    expect(screen.getByText('Team Builder')).toBeInTheDocument()
    expect(screen.getByText('Add Pokémon')).toBeInTheDocument()
    expect(screen.getByText('Your Team')).toBeInTheDocument()
    expect(screen.getByText('Saved Teams')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<TeamBuilderPage />)
    
    expect(screen.getByText('Loading Team Builder…')).toBeInTheDocument()
  })

  it('loads Pokémon list and shows search functionality', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')).toBeInTheDocument()
    })
  })

  it('allows searching for Pokémon by name', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('#1 bulbasaur')).toBeInTheDocument()
    })
  })

  it('allows searching for Pokémon by ID', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: '1' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('#1 bulbasaur')).toBeInTheDocument()
    })
  })

  it('shows type badges in search results', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Grass')).toBeInTheDocument()
      expect(screen.getByText('Poison')).toBeInTheDocument()
    })
  })

  it('allows adding Pokémon to team slots', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      expect(screen.getByText('#1 bulbasaur')).toBeInTheDocument()
    })
  })

  it('shows moveset selector when Pokémon is added', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Moves (0/4)')).toBeInTheDocument()
    })
  })

  it('allows changing Pokémon level', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '25' } })
      expect(levelInput).toHaveValue(25)
    })
  })

  it('shows available moves based on level', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Available moves:')).toBeInTheDocument()
      expect(screen.getByText('tackle Lv.1')).toBeInTheDocument()
      expect(screen.getByText('vine-whip Lv.13')).toBeInTheDocument()
    })
  })

  it('allows selecting moves for Pokémon', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      const tackleMove = screen.getByText('tackle Lv.1')
      fireEvent.click(tackleMove)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Moves (1/4)')).toBeInTheDocument()
      expect(screen.getByText('tackle')).toBeInTheDocument()
    })
  })

  it('prevents selecting more than 4 moves', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    // Add 4 moves
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      const moves = ['tackle', 'vine-whip', 'growth', 'leech-seed']
      moves.forEach(moveName => {
        const moveButton = screen.getByText(new RegExp(moveName, 'i'))
        fireEvent.click(moveButton)
      })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Moves (4/4)')).toBeInTheDocument()
      // Additional moves should be disabled
      const additionalMove = screen.getByText('razor-leaf')
      expect(additionalMove.closest('button')).toBeDisabled()
    })
  })

  it('allows removing moves from moveset', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      const tackleMove = screen.getByText('tackle Lv.1')
      fireEvent.click(tackleMove)
    })
    
    await waitFor(() => {
      const removeButton = screen.getByText('✕')
      fireEvent.click(removeButton)
      expect(screen.getByText('Moves (0/4)')).toBeInTheDocument()
    })
  })

  it('allows clearing all moves at once', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    // Add some moves
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      const tackleMove = screen.getByText('tackle Lv.1')
      fireEvent.click(tackleMove)
    })
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear')
      fireEvent.click(clearButton)
      expect(screen.getByText('Moves (0/4)')).toBeInTheDocument()
    })
  })

  it('allows saving teams with movesets', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const addButton = screen.getByText('#1 bulbasaur').closest('button')
      fireEvent.click(addButton!)
    })
    
    // Add a move
    await waitFor(() => {
      const levelInput = screen.getByDisplayValue('50')
      fireEvent.change(levelInput, { target: { value: '15' } })
    })
    
    await waitFor(() => {
      const tackleMove = screen.getByText('tackle Lv.1')
      fireEvent.click(tackleMove)
    })
    
    // Save team
    await waitFor(() => {
      const teamNameInput = screen.getByPlaceholderText('Team name')
      fireEvent.change(teamNameInput, { target: { value: 'Test Team' } })
      
      const saveButton = screen.getByText('Save Team')
      fireEvent.click(saveButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeInTheDocument()
      expect(screen.getByText('1 / 6 Pokémon')).toBeInTheDocument()
    })
  })

  it('allows loading saved teams', async () => {
    const savedTeam = {
      id: '123',
      name: 'Saved Team',
      slots: [
        { id: 1, level: 25, moves: ['tackle', 'vine-whip'] },
        { id: null, level: 50, moves: [] },
        { id: null, level: 50, moves: [] },
        { id: null, level: 50, moves: [] },
        { id: null, level: 50, moves: [] },
        { id: null, level: 50, moves: [] }
      ]
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify([savedTeam]))
    
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Saved Team')).toBeInTheDocument()
      expect(screen.getByText('1 / 6 Pokémon')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      const loadButton = screen.getByText('Load')
      fireEvent.click(loadButton)
    })
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Saved Team')).toBeInTheDocument()
      expect(screen.getByText('Moves (2/4)')).toBeInTheDocument()
      expect(screen.getByText('tackle')).toBeInTheDocument()
      expect(screen.getByText('vine-whip')).toBeInTheDocument()
    })
  })

  it('allows deleting saved teams', async () => {
    const savedTeam = {
      id: '123',
      name: 'Saved Team',
      slots: [{ id: 1, level: 25, moves: ['tackle'] }]
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify([savedTeam]))
    
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Saved Team')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Saved Team')).not.toBeInTheDocument()
    })
  })

  it('shows clear search button when searching', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const clearButton = screen.getByTitle('Clear search')
      expect(clearButton).toBeInTheDocument()
    })
  })

  it('clears search when clear button is clicked', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'bulba' } })
    })
    
    await waitFor(() => {
      const clearButton = screen.getByTitle('Clear search')
      fireEvent.click(clearButton)
      expect(searchInput).toHaveValue('')
    })
  })

  it('shows appropriate messages for empty states', async () => {
    render(<TeamBuilderPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Start typing to search for Pokémon...')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name or # (e.g., \'Lugia\', \'249\', \'char\')')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('No Pokémon found. Try a different search term.')).toBeInTheDocument()
    })
  })
})
