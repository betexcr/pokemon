import { render, screen } from '@testing-library/react'
import AbilityBadge from '../AbilityBadge'

describe('AbilityBadge Component', () => {
  it('renders ability name correctly', () => {
    render(<AbilityBadge ability={{ name: 'overgrow' }} />)
    expect(screen.getByText('Overgrow')).toBeInTheDocument()
  })

  it('capitalizes the first letter of the ability name', () => {
    render(<AbilityBadge ability={{ name: 'chlorophyll' }} />)
    expect(screen.getByText('Chlorophyll')).toBeInTheDocument()
  })

  it('shows hidden indicator for hidden abilities', () => {
    render(<AbilityBadge ability={{ name: 'chlorophyll', is_hidden: true }} />)
    expect(screen.getByText('Hidden')).toBeInTheDocument()
  })

  it('does not show hidden indicator for regular abilities', () => {
    render(<AbilityBadge ability={{ name: 'overgrow', is_hidden: false }} />)
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    render(<AbilityBadge ability={{ name: 'guts' }} />)
    const badge = screen.getByText('Guts')
    
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

  it('renders as a button element', () => {
    render(<AbilityBadge ability={{ name: 'technician' }} />)
    const badge = screen.getByText('Technician')
    expect(badge.tagName).toBe('BUTTON')
  })

  it('has correct button type attribute', () => {
    render(<AbilityBadge ability={{ name: 'huge-power' }} />)
    const badge = screen.getByText('Huge Power')
    expect(badge).toHaveAttribute('type', 'button')
  })

  it('applies custom className when provided', () => {
    render(<AbilityBadge ability={{ name: 'levitate' }} className="custom-class" />)
    const container = screen.getByText('Levitate').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('applies fire-related ability colors', () => {
    const fireAbilities = ['drought', 'flame-body', 'solar-power']
    
    fireAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-fire)' })
    })
  })

  it('applies water-related ability colors', () => {
    const waterAbilities = ['swift-swim', 'hydration', 'storm-drain']
    
    waterAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-water)' })
    })
  })

  it('applies electric-related ability colors', () => {
    const electricAbilities = ['static', 'motor-drive', 'volt-absorb']
    
    electricAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-electric)' })
    })
  })

  it('applies grass-related ability colors', () => {
    const grassAbilities = ['chlorophyll', 'leaf-guard', 'overgrow']
    
    grassAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-grass)' })
    })
  })

  it('applies fighting-related ability colors', () => {
    const fightingAbilities = ['guts', 'huge-power', 'technician']
    
    fightingAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-fighting)' })
    })
  })

  it('applies psychic-related ability colors', () => {
    const psychicAbilities = ['synchronize', 'magic-guard', 'telepathy']
    
    psychicAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-psychic)' })
    })
  })

  it('applies dark-related ability colors', () => {
    const darkAbilities = ['intimidate', 'moxie', 'prankster']
    
    darkAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-dark)' })
    })
  })

  it('applies steel-related ability colors', () => {
    const steelAbilities = ['filter', 'steel-ability']
    
    steelAbilities.forEach(abilityName => {
      const { unmount } = render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      
      // Check if the badge has the steel color applied
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-steel)' })
      unmount()
    })
  })

  it('applies fairy-related ability colors', () => {
    const fairyAbilities = ['cute-charm', 'pixilate', 'fairy-aura']
    
    fairyAbilities.forEach(abilityName => {
      render(<AbilityBadge key={abilityName} ability={{ name: abilityName }} />)
      const formattedName = abilityName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      const badge = screen.getByText(formattedName)
      expect(badge).toHaveStyle({ backgroundColor: 'var(--type-fairy)' })
    })
  })

  it('applies normal color for unknown abilities', () => {
    render(<AbilityBadge ability={{ name: 'unknown-ability' }} />)
    const badge = screen.getByText('Unknown Ability')
    expect(badge).toHaveStyle({ backgroundColor: 'var(--type-normal)' })
  })

  it('handles empty string ability name gracefully', () => {
    render(<AbilityBadge ability={{ name: '' }} />)
    const badge = screen.getByRole('button')
    expect(badge).toBeInTheDocument()
  })

  it('handles single character ability name', () => {
    render(<AbilityBadge ability={{ name: 'a' }} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders hidden ability with correct styling', () => {
    render(<AbilityBadge ability={{ name: 'protean', is_hidden: true }} />)
    
    const abilityName = screen.getByText('Protean')
    const hiddenIndicator = screen.getByText('Hidden')
    
    expect(abilityName).toBeInTheDocument()
    expect(hiddenIndicator).toBeInTheDocument()
    expect(hiddenIndicator).toHaveClass('px-2', 'py-1', 'text-xs', 'rounded-full', 'bg-gray-500', 'text-white')
  })
})
