import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

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

// Mock API functions
jest.mock('@/lib/api', () => ({
  getPokemonMainPageImage: jest.fn((id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`),
  getPokemonByGeneration: jest.fn(),
  getPokemonByType: jest.fn(),
  getPokemon: jest.fn(),
  getPokemonWithPagination: jest.fn(),
  getPokemonTotalCount: jest.fn(),
  getPokemonList: jest.fn(),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  formatPokemonName: jest.fn((name: string) => name.charAt(0).toUpperCase() + name.slice(1)),
  typeColors: {
    fire: { bg: 'bg-type-fire', text: 'text-white', border: 'border-type-fire/20' },
    grass: { bg: 'bg-type-grass', text: 'text-white', border: 'border-type-grass/20' },
    water: { bg: 'bg-type-water', text: 'text-white', border: 'border-type-water/20' },
    electric: { bg: 'bg-type-electric', text: 'text-black', border: 'border-type-electric/20' },
    poison: { bg: 'bg-type-poison', text: 'text-white', border: 'border-type-poison/20' },
    normal: { bg: 'bg-type-normal', text: 'text-black', border: 'border-type-normal/20' },
  },
}))

import PokemonCard from '@/components/PokemonCard'
import TypeBadge from '@/components/TypeBadge'
import Button from '@/components/ui/Button'

const mockPokemon = {
  id: 1,
  name: 'bulbasaur',
  types: [
    { type: { name: 'grass' } },
    { type: { name: 'poison' } }
  ]
}

describe('Pokemon App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Pokemon Card with Type Badges', () => {
    it('renders pokemon card with type badges correctly', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      // Check pokemon info
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
      
      // Check type badges
      expect(screen.getByText('Grass')).toBeInTheDocument()
      expect(screen.getByText('Poison')).toBeInTheDocument()
      
      // Check image
      const image = screen.getByAltText('Bulbasaur')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Comparison Feature Integration', () => {
    it('allows full comparison workflow', () => {
      const mockToggleComparison = jest.fn()
      const { rerender } = render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={mockToggleComparison}
          isInComparison={false}
        />
      )
      
      // Initially shows Compare button
      expect(screen.getByText('Compare')).toBeInTheDocument()
      
      // Click to add to comparison
      fireEvent.click(screen.getByText('Compare'))
      expect(mockToggleComparison).toHaveBeenCalledWith(1)
      
      // Simulate state change - now in comparison
      rerender(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={mockToggleComparison}
          isInComparison={true}
        />
      )
      
      // Now shows Remove button
      expect(screen.getByText('Remove')).toBeInTheDocument()
      expect(screen.queryByText('Compare')).not.toBeInTheDocument()
      
      // Click to remove from comparison
      fireEvent.click(screen.getByText('Remove'))
      expect(mockToggleComparison).toHaveBeenCalledWith(1)
    })
  })

  describe('Favorites Feature Integration', () => {
    it('allows full favorites workflow', () => {
      const mockToggleFavorite = jest.fn()
      const { rerender } = render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={mockToggleFavorite}
        />
      )
      
      // Initially shows empty heart
      const heartButton = screen.getByRole('button', { name: /favorite/i })
      expect(heartButton).toHaveTextContent('♡')
      
      // Click to add to favorites
      fireEvent.click(heartButton)
      expect(mockToggleFavorite).toHaveBeenCalledWith(1)
      
      // Simulate state change - now favorited
      rerender(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={true}
          onToggleFavorite={mockToggleFavorite}
        />
      )
      
      // Now shows filled heart
      expect(heartButton).toHaveTextContent('❤️')
      
      // Click to remove from favorites
      fireEvent.click(heartButton)
      expect(mockToggleFavorite).toHaveBeenCalledWith(1)
    })
  })

  describe('Multiple Pokemon Cards', () => {
    const mockPokemonList = [
      {
        id: 1,
        name: 'bulbasaur',
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }]
      },
      {
        id: 4,
        name: 'charmander',
        types: [{ type: { name: 'fire' } }]
      },
      {
        id: 7,
        name: 'squirtle',
        types: [{ type: { name: 'water' } }]
      }
    ]

    it('renders multiple pokemon cards correctly', () => {
      const { rerender } = render(
        <div>
          {mockPokemonList.map(pokemon => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              isFavorite={false}
              onToggleFavorite={jest.fn()}
            />
          ))}
        </div>
      )
      
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('Charmander')).toBeInTheDocument()
      expect(screen.getByText('Squirtle')).toBeInTheDocument()
      
      expect(screen.getByText('Grass')).toBeInTheDocument()
      expect(screen.getByText('Poison')).toBeInTheDocument()
      expect(screen.getByText('Fire')).toBeInTheDocument()
      expect(screen.getByText('Water')).toBeInTheDocument()
    })

    it('handles different favorite states for multiple cards', () => {
      render(
        <div>
          <PokemonCard
            pokemon={mockPokemonList[0]}
            isFavorite={true}
            onToggleFavorite={jest.fn()}
          />
          <PokemonCard
            pokemon={mockPokemonList[1]}
            isFavorite={false}
            onToggleFavorite={jest.fn()}
          />
          <PokemonCard
            pokemon={mockPokemonList[2]}
            isFavorite={true}
            onToggleFavorite={jest.fn()}
          />
        </div>
      )
      
      const heartButtons = screen.getAllByRole('button', { name: /favorite/i })
      expect(heartButtons).toHaveLength(3)
      expect(heartButtons[0]).toHaveTextContent('❤️') // Bulbasaur favorited
      expect(heartButtons[1]).toHaveTextContent('♡') // Charmander not favorited
      expect(heartButtons[2]).toHaveTextContent('❤️') // Squirtle favorited
    })
  })

  describe('Type Badge Integration', () => {
    it('renders type badges with correct styling', () => {
      render(
        <div>
          <TypeBadge type="grass" />
          <TypeBadge type="fire" />
          <TypeBadge type="water" />
        </div>
      )
      
      expect(screen.getByText('Grass')).toBeInTheDocument()
      expect(screen.getByText('Fire')).toBeInTheDocument()
      expect(screen.getByText('Water')).toBeInTheDocument()
    })

    it('renders type badges correctly', () => {
      render(
        <TypeBadge type="grass" />
      )
      
      expect(screen.getByText('Grass')).toBeInTheDocument()
    })
  })

  describe('Button Component Integration', () => {
    it('renders different button variants correctly', () => {
      render(
        <div>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
      )
      
      expect(screen.getByText('Primary')).toBeInTheDocument()
      expect(screen.getByText('Secondary')).toBeInTheDocument()
      expect(screen.getByText('Outline')).toBeInTheDocument()
    })

    it('handles button interactions', () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick}>Click me</Button>
      )
      
      fireEvent.click(screen.getByText('Click me'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Card Size Variations Integration', () => {
    const cardSizes = ['cozy', 'compact', 'ultra'] as const

    cardSizes.forEach(size => {
      it(`renders correctly with ${size} card size`, () => {
        render(
          <PokemonCard 
            pokemon={mockPokemon}
            isFavorite={false}
            onToggleFavorite={jest.fn()}
            cardSize={size}
          />
        )
        
        expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
        expect(screen.getByText('#0001')).toBeInTheDocument()
        expect(screen.getByText('Grass')).toBeInTheDocument()
        expect(screen.getByText('Poison')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles pokemon with missing data gracefully', () => {
      const incompletePokemon = {
        id: 999,
        name: 'unknown-pokemon',
        types: []
      }
      
      render(
        <PokemonCard 
          pokemon={incompletePokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('Unknown pokemon')).toBeInTheDocument()
      expect(screen.getByText('#0999')).toBeInTheDocument()
    })

    it('handles image load errors', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      const image = screen.getByAltText('Bulbasaur')
      
      // Simulate image error
      fireEvent.error(image)
      
      // Card should still be functional
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
    })
  })
})
