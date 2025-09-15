import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import { Pokemon } from '@/types/pokemon'

// Mock the API functions
vi.mock('@/lib/api', () => ({
  getPokemonWithPagination: vi.fn(),
  getPokemonTotalCount: vi.fn(),
  getPokemonByType: vi.fn(),
  getPokemonByGeneration: vi.fn(),
  getPokemon: vi.fn(),
  getPokemonList: vi.fn(),
}))

// Mock the search hook
vi.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    searchTerm: '',
    results: [],
    isLoading: false,
    handleSearchChange: vi.fn(),
    clearSearch: vi.fn(),
  }),
}))

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}))

// Mock the theme provider
vi.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
  }),
}))

// Mock the heuristics
vi.mock('@/lib/heuristics/core', () => ({
  createHeuristics: () => ({
    load: vi.fn().mockResolvedValue({ signals: { deviceMemoryGB: 4 } }),
  }),
}))

vi.mock('@/lib/heuristics/storage', () => ({
  LocalStorageAdapter: vi.fn(),
  MemoryStorage: vi.fn(),
}))

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the virtualized grid component
vi.mock('@/components/VirtualizedPokemonGrid', () => ({
  default: ({ pokemonList, hasMorePokemon, isLoadingMore }: any) => (
    <div data-testid="virtualized-grid">
      <div data-testid="pokemon-count">{pokemonList.length}</div>
      {hasMorePokemon && !isLoadingMore && (
        <div data-testid="infinite-scroll-sentinel" data-infinite-scroll-sentinel="true" />
      )}
      {isLoadingMore && <div data-testid="loading-indicator">Loading more...</div>}
    </div>
  ),
}))

// Mock the list view component
vi.mock('@/components/PokedexListView', () => ({
  default: ({ pokemonList, hasMorePokemon, isLoadingMore }: any) => (
    <div data-testid="list-view">
      <div data-testid="pokemon-count">{pokemonList.length}</div>
      {hasMorePokemon && !isLoadingMore && (
        <div data-testid="infinite-scroll-sentinel" data-infinite-scroll-sentinel="true" />
      )}
      {isLoadingMore && <div data-testid="loading-indicator">Loading more...</div>}
    </div>
  ),
}))

// Mock other components
vi.mock('@/components/AdvancedFilters', () => ({
  default: () => <div data-testid="advanced-filters">Advanced Filters</div>,
}))

vi.mock('@/components/AppHeader', () => ({
  default: () => <div data-testid="app-header">App Header</div>,
}))

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

vi.mock('@/components/UserDropdown', () => ({
  default: () => <div data-testid="user-dropdown">User Dropdown</div>,
}))

vi.mock('@/components/auth/AuthModal', () => ({
  default: () => <div data-testid="auth-modal">Auth Modal</div>,
}))

vi.mock('@/components/HeaderIcons', () => ({
  default: () => <div data-testid="header-icons">Header Icons</div>,
  HamburgerMenu: () => <div data-testid="hamburger-menu">Hamburger Menu</div>,
}))

describe('Infinite Scroll in List View', () => {
  const mockPokemon: Pokemon[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `pokemon-${i + 1}`,
    height: 10,
    weight: 100,
    types: [{ type: { name: 'normal' } }],
    stats: [],
    sprites: { front_default: '/placeholder.png' },
  }))

  const defaultProps = {
    pokemonList: mockPokemon,
    selectedPokemon: null,
    onSelectPokemon: vi.fn(),
    onToggleComparison: vi.fn(),
    onClearComparison: vi.fn(),
    comparisonList: [],
    filters: {
      searchTerm: '',
      types: [],
      generation: 'all',
      habitat: '',
      heightRange: [0, 20] as [number, number],
      weightRange: [0, 1000] as [number, number],
      legendary: false,
      mythical: false,
    },
    setFilters: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render list view with infinite scroll sentinel when hasMorePokemon is true', async () => {
    const { getPokemonWithPagination, getPokemonTotalCount } = await import('@/lib/api')
    
    // Mock API responses
    vi.mocked(getPokemonWithPagination).mockResolvedValue(mockPokemon)
    vi.mocked(getPokemonTotalCount).mockResolvedValue(100)

    render(<ModernPokedexLayout {...defaultProps} />)

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByTestId('list-view')).toBeInTheDocument()
    })

    // Check if the infinite scroll sentinel is present
    const sentinel = screen.queryByTestId('infinite-scroll-sentinel')
    expect(sentinel).toBeInTheDocument()
    expect(sentinel).toHaveAttribute('data-infinite-scroll-sentinel', 'true')
  })

  it('should not render infinite scroll sentinel when hasMorePokemon is false', async () => {
    const { getPokemonByType } = await import('@/lib/api')
    
    // Mock type filter response (which disables infinite scroll)
    vi.mocked(getPokemonByType).mockResolvedValue(mockPokemon)

    const propsWithTypeFilter = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        types: ['fire'],
      },
    }

    render(<ModernPokedexLayout {...propsWithTypeFilter} />)

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByTestId('list-view')).toBeInTheDocument()
    })

    // Check that the infinite scroll sentinel is not present
    const sentinel = screen.queryByTestId('infinite-scroll-sentinel')
    expect(sentinel).not.toBeInTheDocument()
  })

  it('should show loading indicator when isLoadingMore is true', async () => {
    const { getPokemonWithPagination, getPokemonTotalCount } = await import('@/lib/api')
    
    // Mock API responses
    vi.mocked(getPokemonWithPagination).mockResolvedValue(mockPokemon)
    vi.mocked(getPokemonTotalCount).mockResolvedValue(100)

    render(<ModernPokedexLayout {...defaultProps} />)

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByTestId('list-view')).toBeInTheDocument()
    })

    // The loading indicator should not be visible initially
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
  })
})
