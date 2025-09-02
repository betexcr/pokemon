import { render, screen } from '@testing-library/react'
import TypeBadge from '../TypeBadge'

describe('TypeBadge', () => {
  it('should render type badge correctly', () => {
    render(<TypeBadge type="fire" />)
    
    expect(screen.getByText('Fire')).toBeInTheDocument()
  })

  it('should handle unknown types gracefully', () => {
    render(<TypeBadge type="unknown-type" />)
    
    // Component title-cases the label
    expect(screen.getByText('Unknown-type')).toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    const { container } = render(<TypeBadge type="water" />)
    
    const badge = container.firstChild as HTMLElement
    // Updated classes in component
    expect(badge).toHaveClass('rounded-full', 'border')
    expect(badge).toHaveStyle({ backgroundColor: expect.any(String) })
  })

  it('should render all type badges without errors', () => {
    const types = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ]

    types.forEach(type => {
      const { unmount } = render(<TypeBadge type={type} />)
      expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument()
      unmount()
    })
  })
})



