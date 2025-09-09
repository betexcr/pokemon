import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModernPokedexLayout from '../ModernPokedexLayout'
import { Pokemon } from '@/types/pokemon'

// Mock Next.js router
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the search hook (no results by default)
jest.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    searchTerm: '',
    results: [],
    isLoading: false,
    handleSearchChange: jest.fn(),
    clearSearch: jest.fn(),
  }),
}))

// Mock theme provider
jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

// Disable virtualization in these tests
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  }),
}))

// Minimal pokemon data
const buildPokemon = (id: number): Pokemon => ({
  id,
  name: `pokemon-${id}`,
  height: 10,
  weight: 100,
  types: [{ type: { name: 'normal' } }],
  stats: [],
  sprites: { front_default: `https://example.com/${id}.png` },
}) as unknown as Pokemon

describe('Card clickability near bottom of page', () => {
  beforeEach(() => {
    pushMock.mockReset()
    // Mock IntersectionObserver to avoid errors from layout code
    // @ts-ignore
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('clicking a card near the bottom navigates to its detail page', async () => {
    const user = userEvent.setup()
    const pokemonList: Pokemon[] = Array.from({ length: 60 }, (_, i) => buildPokemon(i + 1))

    render(
      <ModernPokedexLayout
        pokemonList={pokemonList}
        selectedPokemon={null}
        onSelectPokemon={jest.fn()}
        onToggleComparison={jest.fn()}
        onClearComparison={jest.fn()}
        comparisonList={[]}
        // filters prop is unused in this component signature (kept for backward types in tests)
        // @ts-expect-error legacy prop in tests only
        filters={{}}
        // @ts-expect-error legacy prop in tests only
        setFilters={jest.fn()}
      />
    )

    // Make the main scroll container appear scrollable and scrolled near the bottom
    const container = document.querySelector('.flex-1.min-h-0.overflow-y-auto') as HTMLElement
    expect(container).toBeTruthy()
    if (container) {
      Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })
      Object.defineProperty(container, 'scrollHeight', { value: 4000, configurable: true })
      Object.defineProperty(container, 'scrollTop', { value: 3400, writable: true })
    }

    // Click the last card (id 60) which would be rendered near the bottom
    const lastCard = document.querySelector('[data-pokemon-id="60"]') as HTMLElement
    expect(lastCard).toBeTruthy()
    await user.click(lastCard)

    expect(pushMock).toHaveBeenCalledWith('/pokemon/60')
  })
})


