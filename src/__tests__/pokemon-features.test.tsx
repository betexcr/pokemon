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

const mockPokemon = {
  id: 1,
  name: 'bulbasaur',
  types: [
    { type: { name: 'grass' } },
    { type: { name: 'poison' } }
  ]
}

describe('Pokemon Features Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Comparison Feature', () => {
    it('allows adding pokemon to comparison', () => {
      const mockToggleComparison = jest.fn()
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={mockToggleComparison}
          isInComparison={false}
        />
      )
      
      const compareButton = screen.getByText('Compare')
      fireEvent.click(compareButton)
      
      expect(mockToggleComparison).toHaveBeenCalledWith(1)
    })

    it('allows removing pokemon from comparison', () => {
      const mockToggleComparison = jest.fn()
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={mockToggleComparison}
          isInComparison={true}
        />
      )
      
      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)
      
      expect(mockToggleComparison).toHaveBeenCalledWith(1)
    })

    it('shows correct button text based on comparison state', () => {
      const { rerender } = render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={jest.fn()}
          isInComparison={false}
        />
      )
      
      expect(screen.getByText('Compare')).toBeInTheDocument()
      expect(screen.queryByText('Remove')).not.toBeInTheDocument()

      rerender(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={jest.fn()}
          isInComparison={true}
        />
      )
      
      expect(screen.getByText('Remove')).toBeInTheDocument()
      expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    })
  })

  describe('Favorites Feature', () => {
    it('allows toggling favorite status', () => {
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

    it('shows correct heart icon based on favorite status', () => {
      const { rerender } = render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('♡')).toBeInTheDocument()
      expect(screen.queryByText('❤️')).not.toBeInTheDocument()

      rerender(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={true}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('❤️')).toBeInTheDocument()
      expect(screen.queryByText('♡')).not.toBeInTheDocument()
    })
  })

  describe('Card Size Variations', () => {
    it('renders correctly with compact size', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          cardSize="compact"
        />
      )
      
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
    })

    it('renders correctly with cozy size', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          cardSize="cozy"
        />
      )
      
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
    })

    it('renders correctly with ultra size', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          cardSize="ultra"
        />
      )
      
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
    })
  })

  describe('Type Display', () => {
    it('displays multiple types correctly', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('Grass')).toBeInTheDocument()
      expect(screen.getByText('Poison')).toBeInTheDocument()
    })

    it('displays single type correctly', () => {
      const singleTypePokemon = {
        id: 25,
        name: 'pikachu',
        types: [{ type: { name: 'electric' } }]
      }
      
      render(
        <PokemonCard 
          pokemon={singleTypePokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('Electric')).toBeInTheDocument()
    })

    it('handles pokemon with no types gracefully', () => {
      const noTypePokemon = {
        id: 1,
        name: 'test-pokemon',
        types: []
      }
      
      render(
        <PokemonCard 
          pokemon={noTypePokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      expect(screen.getByText('Test pokemon')).toBeInTheDocument()
      expect(screen.getByText('#0001')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      // Check that the link exists (aria-label is set in the component)
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      
      const heartButton = screen.getByRole('button', { name: /favorite/i })
      expect(heartButton).toHaveAttribute('aria-label', 'Add to favorites')
    })

    it('has proper ARIA labels for comparison button', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={jest.fn()}
          isInComparison={false}
        />
      )
      
      const compareButton = screen.getByRole('button', { name: /add to comparison/i })
      expect(compareButton).toHaveAttribute('aria-label', 'Add to comparison')
    })

    it('has proper ARIA labels for remove comparison', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
          onToggleComparison={jest.fn()}
          isInComparison={true}
        />
      )
      
      const removeButton = screen.getByRole('button', { name: /remove from comparison/i })
      expect(removeButton).toHaveAttribute('aria-label', 'Remove from comparison')
    })
  })

  describe('Image Handling', () => {
    it('displays pokemon image with fallback', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      const image = screen.getByAltText('Bulbasaur')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', expect.stringContaining('1.png'))
    })

    it('handles image load errors gracefully', () => {
      render(
        <PokemonCard 
          pokemon={mockPokemon}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      )
      
      const image = screen.getByAltText('Bulbasaur')
      
      // Simulate image load error
      fireEvent.error(image)
      
      // Should still be in the document
      expect(image).toBeInTheDocument()
    })
  })
})
