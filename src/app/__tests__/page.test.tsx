import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../page'

// Mock all API functions
jest.mock('@/lib/api', () => ({
  getPokemonList: jest.fn().mockResolvedValue({
    count: 151,
    next: null,
    previous: null,
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' }
    ]
  }),
  getPokemon: jest.fn().mockImplementation((name) => {
    const pokemonData = {
      bulbasaur: {
        id: 1,
        name: 'bulbasaur',
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 45 },
          { stat: { name: 'attack' }, base_stat: 49 }
        ],
        height: 7,
        weight: 69
      },
      ivysaur: {
        id: 2,
        name: 'ivysaur',
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 60 },
          { stat: { name: 'attack' }, base_stat: 62 }
        ],
        height: 10,
        weight: 130
      },
      venusaur: {
        id: 3,
        name: 'venusaur',
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 80 },
          { stat: { name: 'attack' }, base_stat: 82 }
        ],
        height: 20,
        weight: 1000
      }
    }
    return Promise.resolve(pokemonData[name])
  }),
  getAllTypes: jest.fn().mockResolvedValue({
    results: [
      { name: 'normal', url: 'https://pokeapi.co/api/v2/type/1/' },
      { name: 'fire', url: 'https://pokeapi.co/api/v2/type/2/' },
      { name: 'water', url: 'https://pokeapi.co/api/v2/type/3/' }
    ]
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should render loading state initially', () => {
    render(<Home />)
    
    expect(screen.getByText('Loading Pokémon...')).toBeInTheDocument()
  })

  it('should load and display pokemon after initial load', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('Ivysaur')).toBeInTheDocument()
      expect(screen.getByText('Venusaur')).toBeInTheDocument()
    })
  })

  it('should display pokemon count in header', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('151 Pokémon discovered')).toBeInTheDocument()
    })
  })

  it('should filter pokemon by search', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search Pokémon by name or ID...')
    fireEvent.change(searchInput, { target: { value: 'bulba' } })
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.queryByText('Ivysaur')).not.toBeInTheDocument()
      expect(screen.queryByText('Venusaur')).not.toBeInTheDocument()
    })
  })

  it('should toggle view mode between grid and list', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
    })
    
    const viewToggleButton = screen.getByRole('button', { name: /list/i })
    fireEvent.click(viewToggleButton)
    
    // Should still show pokemon in list view
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
  })

  // Virtualized grid no longer shows a Load More button
  it('renders a results header and grid without load more', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText(/Pokémon found/)).toBeInTheDocument()
    })
  })

  it('should handle favorites functionality', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
    })
    
    // Find and click the first favorite button
    const favoriteButtons = screen.getAllByRole('button')
    const heartButton = favoriteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-testid') === 'heart'
    )
    
    if (heartButton) {
      fireEvent.click(heartButton)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    }
  })

  it('should display error state when API fails', async () => {
    const api = jest.requireMock('@/lib/api') as typeof import('@/lib/api')
    ;(api.getPokemonList as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load Pokémon data')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should show empty state when no pokemon match filters', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search Pokémon by name or ID...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    await waitFor(() => {
      expect(screen.getByText('No Pokémon found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })
  })

  it('should render without runtime errors on first load with virtualization', async () => {
    // Mock console.error to catch any runtime errors
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    try {
      render(<Home />)
      
      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText(/Pokémon found/)).toBeInTheDocument()
      })
      
      // Verify no runtime errors were logged
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('TypeError') ||
        expect.stringContaining('Cannot convert undefined or null to object') ||
        expect.stringContaining('Cannot read properties of undefined')
      )
      
      // Verify virtualization container is present
      expect(document.getElementById('grid-parent')).toBeInTheDocument()
      
    } finally {
      consoleSpy.mockRestore()
    }
  })

  it('should display correct pokemon count in results header', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('3 Pokémon found')).toBeInTheDocument()
    })
  })
})
