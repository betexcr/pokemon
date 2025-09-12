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

const mockPokemonSingleType = {
  id: 25,
  name: 'pikachu',
  types: [
    { type: { name: 'electric' } }
  ]
}

describe('PokemonCard Component', () => {
  const defaultProps = {
    pokemon: mockPokemon,
    isFavorite: false,
    onToggleFavorite: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders pokemon card with basic information', () => {
    render(<PokemonCard {...defaultProps} />)
    
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
    expect(screen.getByText('#0001')).toBeInTheDocument()
    expect(screen.getByText('Grass')).toBeInTheDocument()
    expect(screen.getByText('Poison')).toBeInTheDocument()
  })

  it('displays pokemon image with correct src', () => {
    render(<PokemonCard {...defaultProps} />)
    
    const image = screen.getByAltText('Bulbasaur')
    expect(image).toHaveAttribute('src', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/1.png')
  })

  it('shows favorite heart when pokemon is favorited', () => {
    render(<PokemonCard {...defaultProps} isFavorite={true} />)
    
    const heartButton = screen.getByRole('button', { name: /favorite/i })
    expect(heartButton).toHaveTextContent('❤️')
  })

  it('shows unfavorite heart when pokemon is not favorited', () => {
    render(<PokemonCard {...defaultProps} isFavorite={false} />)
    
    const heartButton = screen.getByRole('button', { name: /favorite/i })
    expect(heartButton).toHaveTextContent('♡')
  })

  it('calls onToggleFavorite when heart is clicked', () => {
    const mockToggleFavorite = jest.fn()
    render(<PokemonCard {...defaultProps} onToggleFavorite={mockToggleFavorite} />)
    
    const heartButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(heartButton)
    expect(mockToggleFavorite).toHaveBeenCalledWith(1)
  })

  it('renders comparison button when onToggleComparison is provided', () => {
    const mockToggleComparison = jest.fn()
    render(<PokemonCard {...defaultProps} onToggleComparison={mockToggleComparison} />)
    
    const compareButton = screen.getByText('Compare')
    expect(compareButton).toBeInTheDocument()
  })

  it('shows "Remove" when pokemon is in comparison', () => {
    const mockToggleComparison = jest.fn()
    render(
      <PokemonCard 
        {...defaultProps} 
        onToggleComparison={mockToggleComparison}
        isInComparison={true}
      />
    )
    
    const removeButton = screen.getByText('Remove')
    expect(removeButton).toBeInTheDocument()
  })

  it('calls onToggleComparison when comparison button is clicked', () => {
    const mockToggleComparison = jest.fn()
    render(<PokemonCard {...defaultProps} onToggleComparison={mockToggleComparison} />)
    
    const compareButton = screen.getByText('Compare')
    fireEvent.click(compareButton)
    expect(mockToggleComparison).toHaveBeenCalledWith(1)
  })

  it('renders with different card sizes', () => {
    const { rerender } = render(<PokemonCard {...defaultProps} cardSize="cozy" />)
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()

    rerender(<PokemonCard {...defaultProps} cardSize="compact" />)
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()

    rerender(<PokemonCard {...defaultProps} cardSize="ultra" />)
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
  })

  it('handles pokemon with single type', () => {
    render(<PokemonCard {...defaultProps} pokemon={mockPokemonSingleType} />)
    
    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('#0025')).toBeInTheDocument()
    expect(screen.getByText('Electric')).toBeInTheDocument()
  })

  it('has correct link href', () => {
    render(<PokemonCard {...defaultProps} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/pokemon/1')
  })
})

describe('TypeBadge Component', () => {
  it('renders type badge with correct text', () => {
    render(<TypeBadge type="fire" />)
    expect(screen.getByText('Fire')).toBeInTheDocument()
  })

  it('applies correct styling for type', () => {
    render(<TypeBadge type="fire" />)
    const badge = screen.getByText('Fire')
    expect(badge).toHaveStyle('backgroundColor: var(--type-fire)')
  })

  it('renders as button by default', () => {
    render(<TypeBadge type="fire" />)
    const badge = screen.getByRole('button')
    expect(badge).toBeInTheDocument()
  })

  it('renders as span when variant is span', () => {
    render(<TypeBadge type="fire" variant="span" />)
    const badge = screen.getByText('Fire')
    expect(badge.tagName).toBe('SPAN')
  })

  it('applies custom className', () => {
    render(<TypeBadge type="fire" className="custom-class" />)
    const badge = screen.getByText('Fire')
    expect(badge).toHaveClass('custom-class')
  })
})

describe('Button Component', () => {
  it('renders button with default variant and size', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-surface')
  })

  it('renders primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByRole('button', { name: 'Primary Button' })
    expect(button).toHaveClass('bg-poke-red')
  })

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-12')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })
})
