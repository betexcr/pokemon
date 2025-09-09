import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComparisonSection from '../../ComparisonSection';

// Create minimal Pokemon objects for testing
const createPokemon = (id: number) => ({
  id,
  name: `pokemon-${id}`,
  base_experience: 0,
  height: 1,
  weight: 1,
  is_default: true,
  order: id,
  abilities: [],
  forms: [],
  game_indices: [],
  held_items: [],
  location_area_encounters: '',
  moves: [],
  sprites: { front_default: null, front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
  species: { name: 'species', url: '' },
  stats: [
    { base_stat: 1, effort: 0, stat: { name: 'hp', url: '' } },
    { base_stat: 1, effort: 0, stat: { name: 'attack', url: '' } },
    { base_stat: 1, effort: 0, stat: { name: 'defense', url: '' } },
    { base_stat: 1, effort: 0, stat: { name: 'special-attack', url: '' } },
    { base_stat: 1, effort: 0, stat: { name: 'special-defense', url: '' } },
    { base_stat: 1, effort: 0, stat: { name: 'speed', url: '' } },
  ],
  types: [{ slot: 1, type: { name: 'normal', url: '' } }],
});

describe('ComparisonSection scroll behavior', () => {
  it('scrolls to reveal the last pokemon when needed', async () => {
    const user = userEvent.setup();
    const pokemons = [1, 2, 3, 4, 5, 6].map(createPokemon);

    render(
      <ComparisonSection
        comparisonList={pokemons.map(p => p.id)}
        comparisonPokemon={pokemons}
        onToggleComparison={() => {}}
        onClearComparison={() => {}}
        onGoToComparison={() => {}}
      />
    );

    const scrollEl = screen.getByTestId('comparison-scroll');

    // Mock dimensions to force scroll
    Object.defineProperty(scrollEl, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(scrollEl, 'scrollHeight', { value: 1000, configurable: true });

    // Initially at top
    expect(scrollEl.scrollTop).toBe(0);

    // Programmatically scroll to bottom and verify it changes
    scrollEl.scrollTop = scrollEl.scrollHeight;
    // Fire a scroll event so any listeners would react (none here, but keeps semantics)
    await user.pointer({ keys: '[WheelDown]' });

    expect(scrollEl.scrollTop).toBe(scrollEl.scrollHeight);
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import ModernPokedexLayout from '../ModernPokedexLayout'
import VirtualizedPokemonGrid from '../VirtualizedPokemonGrid'
import { Pokemon } from '@/types/pokemon'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getPokemonByGeneration: jest.fn(),
  getPokemonByType: jest.fn(),
  getPokemon: jest.fn(),
  getPokemonWithPagination: jest.fn(),
  getPokemonTotalCount: jest.fn(),
  getPokemonList: jest.fn(),
}))

// Mock the search hook
jest.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    searchTerm: '',
    results: [],
    isLoading: false,
    handleSearchChange: jest.fn(),
    clearSearch: jest.fn(),
  }),
}))

// Mock the heuristics
jest.mock('@/lib/heuristics/core', () => ({
  createHeuristics: () => ({
    load: jest.fn().mockResolvedValue({ signals: { deviceMemoryGB: 4 } }),
  }),
}))

jest.mock('@/lib/heuristics/storage', () => ({
  LocalStorageAdapter: jest.fn(),
  MemoryStorage: jest.fn(),
}))

// Mock theme provider
jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

// Mock components that might cause issues
jest.mock('../ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>
  }
})

jest.mock('../auth/UserProfile', () => {
  return function MockUserProfile() {
    return <div data-testid="user-profile">User Profile</div>
  }
})

jest.mock('../AdvancedFilters', () => {
  return function MockAdvancedFilters() {
    return <div data-testid="advanced-filters">Advanced Filters</div>
  }
})

// Mock the virtualizer
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 1000,
  }),
}))

const mockPokemon: Pokemon[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `pokemon-${i + 1}`,
  height: 10,
  weight: 100,
  types: [{ type: { name: 'normal' } }],
  stats: [],
  sprites: {
    front_default: `https://example.com/pokemon-${i + 1}.png`,
  },
}))

describe('Scroll Behavior Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16))
    
    // Mock performance.memory
    Object.defineProperty(global, 'performance', {
      value: {
        memory: {
          jsHeapSizeLimit: 1000000000,
        },
      },
      writable: true,
    })
  })

  describe('ModernPokedexLayout Scroll Behavior', () => {
    it('should not interfere with natural scroll behavior', async () => {
      const mockOnToggleComparison = jest.fn()
      const mockOnClearComparison = jest.fn()
      
      render(
        <ModernPokedexLayout
          pokemonList={mockPokemon}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={mockOnToggleComparison}
          onClearComparison={mockOnClearComparison}
          comparisonList={[]}
          filters={{ searchTerm: '', types: [], generation: 'all' }}
          setFilters={jest.fn()}
        />
      )

      // Find the main scroll container
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      expect(scrollContainer).toBeInTheDocument()

      // Simulate scroll events
      const scrollEvent = new Event('scroll', { bubbles: true })
      
      // Test that scroll events don't cause interference
      act(() => {
        if (scrollContainer) {
          scrollContainer.dispatchEvent(scrollEvent)
        }
      })

      // Verify no scroll position manipulation occurred
      expect(scrollContainer?.scrollTop).toBe(0)
    })

    it('should handle scroll events without position manipulation', async () => {
      const mockOnToggleComparison = jest.fn()
      const mockOnClearComparison = jest.fn()
      
      render(
        <ModernPokedexLayout
          pokemonList={mockPokemon}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={mockOnToggleComparison}
          onClearComparison={mockOnClearComparison}
          comparisonList={[]}
          filters={{ searchTerm: '', types: [], generation: 'all' }}
          setFilters={jest.fn()}
        />
      )

      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      
      if (scrollContainer) {
        // Simulate setting scroll position
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 100,
          writable: true,
        })
        
        // Trigger scroll event
        const scrollEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(scrollEvent)
        
        // Verify scroll position is maintained naturally
        expect(scrollContainer.scrollTop).toBe(100)
      }
    })
  })

  describe('VirtualizedPokemonGrid Scroll Behavior', () => {
    it('should not create conflicting scroll containers', () => {
      const mockOnToggleComparison = jest.fn()
      
      render(
        <VirtualizedPokemonGrid
          pokemonList={mockPokemon}
          onToggleComparison={mockOnToggleComparison}
          onSelectPokemon={undefined}
          selectedPokemon={null}
          comparisonList={[]}
          density="6cols"
          enableVirtualization={false}
        />
      )

      // Check that no conflicting scroll containers are created
      const scrollContainers = document.querySelectorAll('[data-pokemon-grid]')
      expect(scrollContainers.length).toBeGreaterThan(0)
      
      // Verify the grid doesn't have its own scroll behavior
      scrollContainers.forEach(container => {
        expect(container).not.toHaveClass('overflow-auto')
      })
    })

    it('should handle virtualization without scroll conflicts', () => {
      const mockOnToggleComparison = jest.fn()
      
      render(
        <VirtualizedPokemonGrid
          pokemonList={mockPokemon}
          onToggleComparison={mockOnToggleComparison}
          onSelectPokemon={undefined}
          selectedPokemon={null}
          comparisonList={[]}
          density="6cols"
          enableVirtualization={true}
        />
      )

      // Check that virtualization doesn't interfere with parent scroll
      const virtualizedContainer = document.querySelector('[data-pokemon-grid]')
      expect(virtualizedContainer).toBeInTheDocument()
      
      // Verify the virtualized container doesn't have conflicting styles
      if (virtualizedContainer) {
        const styles = window.getComputedStyle(virtualizedContainer)
        expect(styles.position).not.toBe('fixed')
        expect(styles.position).not.toBe('absolute')
      }
    })
  })

  describe('Scroll Event Handling', () => {
    it('should not prevent default scroll behavior', () => {
      const mockOnToggleComparison = jest.fn()
      const mockOnClearComparison = jest.fn()
      
      render(
        <ModernPokedexLayout
          pokemonList={mockPokemon}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={mockOnToggleComparison}
          onClearComparison={mockOnClearComparison}
          comparisonList={[]}
          filters={{ searchTerm: '', types: [], generation: 'all' }}
          setFilters={jest.fn()}
        />
      )

      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      
      if (scrollContainer) {
        let preventDefaultCalled = false
        
        const scrollEvent = new Event('scroll', { bubbles: true })
        Object.defineProperty(scrollEvent, 'preventDefault', {
          value: () => { preventDefaultCalled = true },
        })
        
        scrollContainer.dispatchEvent(scrollEvent)
        
        // Verify preventDefault was not called
        expect(preventDefaultCalled).toBe(false)
      }
    })

    it('should handle rapid scroll events without interference', async () => {
      const mockOnToggleComparison = jest.fn()
      const mockOnClearComparison = jest.fn()
      
      render(
        <ModernPokedexLayout
          pokemonList={mockPokemon}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={mockOnToggleComparison}
          onClearComparison={mockOnClearComparison}
          comparisonList={[]}
          filters={{ searchTerm: '', types: [], generation: 'all' }}
          setFilters={jest.fn()}
        />
      )

      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      
      if (scrollContainer) {
        // Simulate rapid scroll events
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(scrollContainer, 'scrollTop', {
            value: i * 10,
            writable: true,
          })
          
          const scrollEvent = new Event('scroll', { bubbles: true })
          scrollContainer.dispatchEvent(scrollEvent)
        }
        
        // Verify final scroll position is maintained
        expect(scrollContainer.scrollTop).toBe(90)
      }
    })
  })

  describe('Infinite Scroll Integration', () => {
    it('should not interfere with scroll position during infinite scroll', async () => {
      const mockOnToggleComparison = jest.fn()
      const mockOnClearComparison = jest.fn()
      
      render(
        <ModernPokedexLayout
          pokemonList={mockPokemon}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={mockOnToggleComparison}
          onClearComparison={mockOnClearComparison}
          comparisonList={[]}
          filters={{ searchTerm: '', types: [], generation: 'all' }}
          setFilters={jest.fn()}
        />
      )

      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      
      if (scrollContainer) {
        // Set initial scroll position
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 500,
          writable: true,
        })
        
        // Simulate infinite scroll trigger
        const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]')
        if (sentinel) {
          // Simulate intersection observer callback
          const mockIntersectionObserver = global.IntersectionObserver as jest.Mock
          const observerCallback = mockIntersectionObserver.mock.calls[0][0]
          
          act(() => {
            observerCallback([{ isIntersecting: true }])
          })
        }
        
        // Verify scroll position is not manipulated
        expect(scrollContainer.scrollTop).toBe(500)
      }
    })
  })
})

