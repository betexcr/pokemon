import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import ThemeProvider from '@/components/ThemeProvider'
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}))
jest.mock('@/components/ThemeToggle', () => () => null)

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

describe('Modern header behavior', () => {
  const pokemonList = [mkPokemon(1, 'bulbasaur')]

  beforeEach(() => {
    // Clean theme persistence
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      },
      configurable: true
    })
  })

  it('toggles sort direction', () => {
    render(
      <ThemeProvider>
        <ModernPokedexLayout
          pokemonList={pokemonList}
          selectedPokemon={null}
          onSelectPokemon={() => {}}
          onToggleComparison={() => {}}
          onClearComparison={() => {}}
          comparisonList={[]}
          filters={{ search: '', types: [], sortBy: 'id', sortOrder: 'asc', generation: '' }}
          setFilters={() => {}}
        />
      </ThemeProvider>
    )

    const dirBtn = screen.getByTitle(/Sort/i)
    expect(screen.getByText('ASC')).toBeInTheDocument()
    fireEvent.click(dirBtn)
    expect(screen.getByText('DESC')).toBeInTheDocument()
  })

  it('persists theme selection', () => {
    render(
      <ThemeProvider>
        <ModernPokedexLayout
          pokemonList={pokemonList}
          selectedPokemon={null}
          onSelectPokemon={() => {}}
          onToggleComparison={() => {}}
          onClearComparison={() => {}}
          comparisonList={[]}
          filters={{ search: '', types: [], sortBy: 'id', sortOrder: 'asc', generation: '' }}
          setFilters={() => {}}
        />
      </ThemeProvider>
    )

    const themeSelect = screen.getByTitle('Change theme') as HTMLSelectElement
    fireEvent.change(themeSelect, { target: { value: 'dark' } })
    // Verify localStorage persistence
    expect(window.localStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark')
  })
})


