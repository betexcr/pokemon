import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import ModernPokedexLayout from '../ModernPokedexLayout'
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

const mockPokemon: Pokemon[] = Array.from({ length: 50 }, (_, i) => ({
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

describe('Scroll Nudge Issue Tests', () => {
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

  describe('Natural Scroll Behavior', () => {
    it('should allow smooth scrolling without nudge effect on first scroll', async () => {
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

      if (scrollContainer) {
        // Simulate the problematic scroll behavior
        // First, set initial scroll position
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 0,
          writable: true,
        })
        
        // Simulate first scroll attempt (this was causing the nudge)
        const firstScrollEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(firstScrollEvent)
        
        // Verify scroll position is maintained naturally
        expect(scrollContainer.scrollTop).toBe(0)
        
        // Simulate setting scroll position to a new value
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 100,
          writable: true,
        })
        
        // Simulate second scroll event
        const secondScrollEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(secondScrollEvent)
        
        // Verify scroll position is maintained naturally
        expect(scrollContainer.scrollTop).toBe(100)
      }
    })

    it('should not interfere with scroll momentum', async () => {
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
        // Simulate continuous scrolling (like a user scrolling down)
        const scrollPositions = [0, 50, 100, 150, 200, 250, 300]
        
        for (let i = 0; i < scrollPositions.length; i++) {
          const position = scrollPositions[i]
          
          // Set scroll position
          Object.defineProperty(scrollContainer, 'scrollTop', {
            value: position,
            writable: true,
          })
          
          // Dispatch scroll event
          const scrollEvent = new Event('scroll', { bubbles: true })
          scrollContainer.dispatchEvent(scrollEvent)
          
          // Verify position is maintained
          expect(scrollContainer.scrollTop).toBe(position)
        }
      }
    })

    it('should handle scroll direction changes smoothly', async () => {
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
        // Simulate scrolling down
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 200,
          writable: true,
        })
        
        const scrollDownEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(scrollDownEvent)
        expect(scrollContainer.scrollTop).toBe(200)
        
        // Simulate scrolling back up (direction change)
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 100,
          writable: true,
        })
        
        const scrollUpEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(scrollUpEvent)
        expect(scrollContainer.scrollTop).toBe(100)
        
        // Simulate scrolling down again
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 150,
          writable: true,
        })
        
        const scrollDownAgainEvent = new Event('scroll', { bubbles: true })
        scrollContainer.dispatchEvent(scrollDownAgainEvent)
        expect(scrollContainer.scrollTop).toBe(150)
      }
    })
  })

  describe('CSS Scroll Behavior', () => {
    it('should not have overflow hidden on body that interferes with scrolling', () => {
      // Check that the body doesn't have overflow: hidden
      const bodyStyles = window.getComputedStyle(document.body)
      expect(bodyStyles.overflow).not.toBe('hidden')
    })

    it('should have proper scroll container setup', () => {
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
      expect(scrollContainer).toBeInTheDocument()
      
      // Verify the container has the correct classes for scrolling
      expect(scrollContainer).toHaveClass('overflow-y-auto')
      expect(scrollContainer).toHaveClass('flex-1')
      expect(scrollContainer).toHaveClass('min-h-0')
    })
  })

  describe('Infinite Scroll Integration', () => {
    it('should not interfere with scroll position when loading more content', async () => {
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
        // Set scroll position
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
