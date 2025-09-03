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

  it('should render as button by default', () => {
    render(<TypeBadge type="fire" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Fire')
  })

  it('should render as span when variant is span', () => {
    render(<TypeBadge type="water" variant="span" />)
    
    const span = screen.getByText('Water')
    expect(span.tagName).toBe('SPAN')
    expect(span).not.toHaveRole('button')
  })

  it('should apply same styling regardless of variant', () => {
    const { container: buttonContainer } = render(<TypeBadge type="grass" />)
    const { container: spanContainer } = render(<TypeBadge type="grass" variant="span" />)
    
    const button = buttonContainer.firstChild as HTMLElement
    const span = spanContainer.firstChild as HTMLElement
    
    // Both should have the same base classes
    expect(button).toHaveClass('rounded-full', 'border', 'text-sm', 'font-medium')
    expect(span).toHaveClass('rounded-full', 'border', 'text-sm', 'font-medium')
  })

  it('should handle custom className with both variants', () => {
    const customClass = 'custom-class'
    
    const { container: buttonContainer } = render(<TypeBadge type="electric" className={customClass} />)
    const { container: spanContainer } = render(<TypeBadge type="electric" variant="span" className={customClass} />)
    
    const button = buttonContainer.firstChild as HTMLElement
    const span = spanContainer.firstChild as HTMLElement
    
    expect(button).toHaveClass(customClass)
    expect(span).toHaveClass(customClass)
  })
})



