import { render, screen } from '@testing-library/react'
import Button from '../ui/Button'

describe('Button Outline Variant', () => {
  it('should render outline variant without TypeScript errors', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: 'Outline Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-transparent', 'text-text', 'border', 'border-border')
  })

  it('should have proper contrast in light mode', () => {
    render(<Button variant="outline">Test Button</Button>)
    const button = screen.getByRole('button', { name: 'Test Button' })
    
    // Check that the button has proper styling for visibility
    expect(button).toHaveClass('border-border') // Should have border
    expect(button).toHaveClass('text-text') // Should have proper text color
    expect(button).toHaveClass('bg-transparent') // Should have transparent background
  })

  it('should handle hover states correctly', () => {
    render(<Button variant="outline">Hover Button</Button>)
    const button = screen.getByRole('button', { name: 'Hover Button' })
    
    // Check that hover classes are present
    expect(button).toHaveClass('hover:bg-white/50')
  })
})
