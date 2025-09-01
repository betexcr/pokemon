import { render, screen, fireEvent } from '@testing-library/react'
import PokemonCard from '../PokemonCard'

const mockPokemon = {
  id: 1,
  name: 'bulbasaur',
  types: [
    { type: { name: 'grass' } },
    { type: { name: 'poison' } }
  ]
}

const mockPokemonSingleType = {
  id: 25,
  name: 'pikachu',
  types: [
    { type: { name: 'electric' } }
  ]
}

const mockPokemonNoTypes = {
  id: 1,
  name: 'bulbasaur',
  types: []
}

describe('PokemonCard', () => {
  it('should render pokemon card correctly', () => {
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />
    )

    expect(screen.getByText('bulbasaur')).toBeInTheDocument()
    expect(screen.getByText('#0001')).toBeInTheDocument()
    expect(screen.getByText('Grass')).toBeInTheDocument()
    expect(screen.getByText('Poison')).toBeInTheDocument()
  })

  it('should show favorite heart when pokemon is favorited', () => {
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isFavorite={true}
        onToggleFavorite={jest.fn()}
      />
    )

    const heartButton = screen.getByRole('button', { name: /favorite/i })
    const heartIcon = heartButton.querySelector('svg')
    expect(heartIcon).toHaveClass('text-red-500')
  })

  it('should call onToggleFavorite when heart is clicked', () => {
    const mockToggleFavorite = jest.fn()
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
      />
    )

    const heartButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(heartButton)
    expect(mockToggleFavorite).toHaveBeenCalledWith(1)
  })

  it('should render pokemon image with correct src', () => {
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />
    )

    const image = screen.getByAltText('bulbasaur')
    expect(image).toHaveAttribute('src', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png')
  })

  it('should have correct link href', () => {
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/pokemon/1')
  })

  it('should handle pokemon with single type', () => {
    render(
      <PokemonCard
        pokemon={mockPokemonSingleType}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />
    )

    expect(screen.getByText('pikachu')).toBeInTheDocument()
    expect(screen.getByText('#0025')).toBeInTheDocument()
    expect(screen.getByText('Electric')).toBeInTheDocument()
  })

  it('should handle pokemon with no types gracefully', () => {
    render(
      <PokemonCard
        pokemon={mockPokemonNoTypes}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
      />
    )

    expect(screen.getByText('bulbasaur')).toBeInTheDocument()
    expect(screen.getByText('#0001')).toBeInTheDocument()
  })
})
