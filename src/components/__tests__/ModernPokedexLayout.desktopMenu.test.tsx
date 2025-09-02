import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import ThemeProvider from '@/components/ThemeProvider'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}))

// Avoid ThemeContext requirement in ThemeToggle for these UI tests
jest.mock('@/components/ThemeToggle', () => () => null)

jest.mock('@/hooks/useSearch', () => {
  const stableResults: any[] = []
  const stableHook = {
    searchTerm: '',
    results: stableResults,
    isLoading: false,
    handleSearchChange: jest.fn(),
    clearSearch: jest.fn()
  }
  return {
    useSearch: () => stableHook
  }
})

// Basic pokemon stub that satisfies required fields
const mkPokemon = (id: number, name: string) => ({
  id,
  name,
  base_experience: 0,
  height: 1,
  weight: 1,
  order: id,
  is_default: true,
  abilities: [],
  moves: [],
  stats: [],
  forms: [],
  game_indices: [],
  held_items: [],
  location_area_encounters: '',
  types: [],
  sprites: {
    front_default: null,
    front_shiny: null,
    front_female: null,
    front_shiny_female: null,
    back_default: null,
    back_shiny: null,
    back_female: null,
    back_shiny_female: null,
    other: {
      dream_world: { front_default: null, front_female: null },
      home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
      'official-artwork': { front_default: null, front_shiny: null }
    }
  },
  species: { name: '', url: '' }
})

describe('ModernPokedexLayout desktop menu', () => {
  const pokemonList = [mkPokemon(1, 'bulbasaur'), mkPokemon(2, 'ivysaur')]

  function renderWithProviders() {
    return render(
      <ThemeProvider>
        <ModernPokedexLayout
          pokemonList={pokemonList}
          selectedPokemon={null}
          onSelectPokemon={jest.fn()}
          onToggleComparison={jest.fn()}
          onClearComparison={jest.fn()}
          comparisonList={[]}
          filters={{ search: '', types: [], sortBy: 'id', sortOrder: 'asc' }}
          setFilters={jest.fn()}
        />
      </ThemeProvider>
    )
  }

  beforeEach(() => {
    // Simulate desktop viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    window.dispatchEvent(new Event('resize'))
    document.body.innerHTML = ''
  })

  it('opens the desktop drawer on click and shows menu content', async () => {
    renderWithProviders()

    const toggle = screen.getByTitle('Toggle menu')
    fireEvent.click(toggle)

    // Drawer should appear with heading "Menu" and Search label
    await waitFor(() => expect(screen.getByText('Menu')).toBeInTheDocument())
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('closes when clicking the backdrop', async () => {
    renderWithProviders()
    fireEvent.click(screen.getByTitle('Toggle menu'))

    await waitFor(() => expect(screen.getByText('Menu')).toBeInTheDocument())

    // Click backdrop
    const backdrop = document.querySelector('#desktop-drawer > div') as HTMLElement
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop)

    await waitFor(() => expect(screen.queryByText('Menu')).not.toBeInTheDocument())
  })
})


