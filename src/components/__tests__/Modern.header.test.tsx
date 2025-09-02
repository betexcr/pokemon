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

describe('Modern header controls', () => {
  const pokemonList = [mkPokemon(1, 'bulbasaur')]

  it('renders theme selector and sort with direction', () => {
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

    // Theme selector (by title on select)
    expect(screen.getByTitle('Change theme')).toBeInTheDocument()
    // Sort select
    expect(screen.getByText(/Sort/i)).toBeInTheDocument()
    // Direction button shows ASC/DESC
    expect(screen.getByText(/ASC|DESC/)).toBeInTheDocument()
  })

  it('includes all stat options in sort select', () => {
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

    const select = screen.getByDisplayValue('Number') as HTMLSelectElement
    const options = Array.from(select.querySelectorAll('option')).map(o => o.value)
    ;['hp','attack','defense','special-attack','special-defense','speed'].forEach(k => {
      expect(options).toContain(k)
    })
  })
})


