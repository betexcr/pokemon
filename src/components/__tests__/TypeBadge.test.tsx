import { render, screen } from '@testing-library/react'
import TypeBadge from '../TypeBadge'

describe('TypeBadge', () => {
  it('should render type badge correctly', () => {
    render(<TypeBadge type="fire" />)
    
    expect(screen.getByText('Fire')).toBeInTheDocument()
  })

  it('should handle unknown types gracefully', () => {
    render(<TypeBadge type="unknown-type" />)
    
    expect(screen.getByText('unknown-type')).toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    const { container } = render(<TypeBadge type="water" />)
    
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'px-2', 'py-0.5', 'text-xs', 'font-semibold', 'border')
    expect(badge).toHaveClass('bg-type-water')
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



