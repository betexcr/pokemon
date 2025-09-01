import { render, screen } from '@testing-library/react'
import Button from '../ui/Button'

describe('Button Component', () => {
  it('should render with default variant (secondary)', () => {
    render(<Button>Test Button</Button>)
    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-surface', 'text-text', 'border', 'border-border')
  })

  it('should render with primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByRole('button', { name: 'Primary Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-poke-red', 'text-white')
  })

  it('should render with cta variant', () => {
    render(<Button variant="cta">CTA Button</Button>)
    const button = screen.getByRole('button', { name: 'CTA Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-poke-yellow', 'text-black')
  })

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button', { name: 'Secondary Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-surface', 'text-text', 'border', 'border-border')
  })

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: 'Outline Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-transparent', 'text-text', 'border', 'border-border')
  })

  it('should render with ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button', { name: 'Ghost Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-transparent', 'text-text')
  })

  it('should render with link variant', () => {
    render(<Button variant="link">Link Button</Button>)
    const button = screen.getByRole('button', { name: 'Link Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-transparent', 'text-poke-blue')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>)
    let button = screen.getByRole('button', { name: 'Small Button' })
    expect(button).toHaveClass('h-9', 'px-4', 'text-sm')

    rerender(<Button size="md">Medium Button</Button>)
    button = screen.getByRole('button', { name: 'Medium Button' })
    expect(button).toHaveClass('h-11', 'px-5', 'text-sm')

    rerender(<Button size="lg">Large Button</Button>)
    button = screen.getByRole('button', { name: 'Large Button' })
    expect(button).toHaveClass('h-12', 'px-6', 'text-base')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    const button = screen.getByRole('button', { name: 'Clickable Button' })
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50', 'pointer-events-none')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button', { name: 'Custom Button' })
    expect(button).toHaveClass('custom-class')
  })

  it('should have proper focus styles', () => {
    render(<Button>Focusable Button</Button>)
    const button = screen.getByRole('button', { name: 'Focusable Button' })
    expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-offset-2')
  })

  it('should have proper base classes', () => {
    render(<Button>Base Button</Button>)
    const button = screen.getByRole('button', { name: 'Base Button' })
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-xl',
      'font-semibold',
      'transition-colors',
      'ring-offset-bg',
      'mx-1'
    )
  })
})
