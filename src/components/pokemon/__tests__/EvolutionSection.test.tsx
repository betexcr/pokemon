import { render, screen } from '@testing-library/react'
import EvolutionSection from '../EvolutionSection'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: React.ComponentProps<'a'>) {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('EvolutionSection Component', () => {
  const mockChain = [
    {
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      condition: undefined
    },
    {
      id: 2,
      name: 'ivysaur',
      types: ['grass', 'poison'],
      condition: 'Level 16'
    },
    {
      id: 3,
      name: 'venusaur',
      types: ['grass', 'poison'],
      condition: 'Level 32'
    }
  ]

  it('renders evolution chain correctly', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    expect(screen.getByText('bulbasaur')).toBeInTheDocument()
    expect(screen.getByText('ivysaur')).toBeInTheDocument()
    expect(screen.getByText('venusaur')).toBeInTheDocument()
  })

  it('displays evolution conditions', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    expect(screen.getByText('Level 16')).toBeInTheDocument()
    expect(screen.getByText('Level 32')).toBeInTheDocument()
  })

  it('renders type badges for each evolution', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    // Should show Grass and Poison types for each evolution
    expect(screen.getAllByText('Grass')).toHaveLength(3)
    expect(screen.getAllByText('Poison')).toHaveLength(3)
  })

  it('applies correct styling classes', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const section = screen.getByText('bulbasaur').closest('section')
    expect(section).toHaveClass('py-4')
  })

  it('renders evolution arrows between stages', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    // Should have 2 arrows for 3 evolution stages
    const arrows = screen.getAllByText('→')
    expect(arrows).toHaveLength(2)
  })

  it('applies correct image styling', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const images = screen.getAllByAltText(/bulbasaur|ivysaur|venusaur/i)
    images.forEach(image => {
      expect(image).toHaveClass(
        'object-contain',
        'w-full',
        'h-full'
      )
    })
  })

  it('renders evolution cards with correct styling', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const evolutionCards = screen.getAllByText(/bulbasaur|ivysaur|venusaur/i)
    evolutionCards.forEach(card => {
      const cardContainer = card.closest('a')
      expect(cardContainer).toHaveClass(
        'group',
        'block'
      )
    })
  })

  it('applies gradient background styling', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const gradientContainers = document.querySelectorAll('.rounded-xl.bg-surface.overflow-hidden.border.border-border')
    expect(gradientContainers.length).toBeGreaterThan(0)
  })

  it('shows type accent bars', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    // Should have type accent bars for each evolution
    const accentBars = document.querySelectorAll('[style*="background: linear-gradient"]')
    expect(accentBars.length).toBeGreaterThan(0)
  })

  it('handles single evolution stage', () => {
    const singleStage = [{ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] }]
    render(<EvolutionSection chain={singleStage} />)
    
    expect(screen.getByText('bulbasaur')).toBeInTheDocument()
    // Should not show any arrows
    expect(screen.queryByText('→')).not.toBeInTheDocument()
  })

  it('handles empty evolution chain', () => {
    render(<EvolutionSection chain={[]} />)
    
    // Should render nothing when chain is empty
    expect(document.querySelector('section')).not.toBeInTheDocument()
  })

  it('applies hover effects to evolution cards', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const evolutionCards = screen.getAllByText(/bulbasaur|ivysaur|venusaur/i)
    evolutionCards.forEach(card => {
      const cardContainer = card.closest('a')
      // The hover effect is on the inner div, not the link
      const innerDiv = cardContainer?.querySelector('div')
      expect(innerDiv).toHaveClass('hover:shadow-card')
    })
  })

  it('renders evolution names with correct styling', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const evolutionNames = screen.getAllByText(/bulbasaur|ivysaur|venusaur/i)
    evolutionNames.forEach(name => {
      expect(name).toHaveClass(
        'capitalize',
        'font-semibold'
      )
    })
  })

  it('applies transition effects', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const evolutionCards = screen.getAllByText(/bulbasaur|ivysaur|venusaur/i)
    evolutionCards.forEach(card => {
      const cardContainer = card.closest('a')
      // The transition effect is on the inner div, not the link
      const innerDiv = cardContainer?.querySelector('div')
      expect(innerDiv).toHaveClass('transition-all', 'duration-200')
    })
  })

  it('handles evolution conditions with special characters', () => {
    const specialConditionChain = [
      { id: 1, name: 'test', types: ['normal'], condition: 'Use Fire Stone' },
      { id: 2, name: 'evolved', types: ['fire'], condition: 'Trade while holding Metal Coat' }
    ]
    
    render(<EvolutionSection chain={specialConditionChain} />)
    
    expect(screen.getByText('Trade while holding Metal Coat')).toBeInTheDocument()
  })

  it('renders with default sprite when selectedSprite is not provided', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const images = screen.getAllByAltText(/bulbasaur|ivysaur|venusaur/i)
    images.forEach(image => {
      expect(image).toHaveAttribute('src', expect.stringContaining('official-artwork'))
    })
  })

  it('renders with shiny sprite when selectedSprite is shiny', () => {
    render(<EvolutionSection chain={mockChain} selectedSprite="shiny" />)
    
    const images = screen.getAllByAltText(/bulbasaur|ivysaur|venusaur/i)
    images.forEach(image => {
      expect(image).toHaveAttribute('src', expect.stringContaining('shiny'))
    })
  })

  it('applies correct spacing between evolution stages', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const evolutionStages = document.querySelectorAll('.flex.items-center.gap-4')
    expect(evolutionStages.length).toBeGreaterThan(0)
  })

  it('renders type badges with correct styling', () => {
    render(<EvolutionSection chain={mockChain} />)
    
    const typeBadges = screen.getAllByText(/grass|poison/i)
    typeBadges.forEach(badge => {
      expect(badge).toHaveClass(
        'px-3',
        'py-1',
        'rounded-full',
        'text-sm',
        'font-medium',
        'border',
        'transition-all',
        'duration-200',
        'whitespace-nowrap'
      )
    })
  })

  it('handles evolution chain with missing condition', () => {
    const chainWithMissingCondition = [
      { id: 1, name: 'base', types: ['normal'] },
      { id: 2, name: 'evolved', types: ['normal'], condition: undefined }
    ]
    
    render(<EvolutionSection chain={chainWithMissingCondition} />)
    
    expect(screen.getByText('base')).toBeInTheDocument()
    expect(screen.getByText('evolved')).toBeInTheDocument()
    // Should show "—" for missing condition
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
