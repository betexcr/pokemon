import { render, screen } from '@testing-library/react'
import StatsSlider from '../StatsSlider'

describe('StatsSlider Component', () => {
  it('renders with correct label', () => {
    render(<StatsSlider label="HP" value={45} />)
    expect(screen.getByText('HP')).toBeInTheDocument()
  })

  it('displays the stat value correctly', () => {
    render(<StatsSlider label="Attack" value={49} />)
    expect(screen.getByText('49')).toBeInTheDocument()
  })

  it('uses default max value of 255', () => {
    render(<StatsSlider label="Defense" value={65} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuemax', '255')
  })

  it('allows custom max value', () => {
    render(<StatsSlider label="Speed" value={80} max={100} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('allows custom min value', () => {
    render(<StatsSlider label="HP" value={45} min={0} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
  })

  it('clamps value between min and max', () => {
    render(<StatsSlider label="Attack" value={300} max={255} min={0} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '255')
  })

  it('clamps negative value to min', () => {
    render(<StatsSlider label="Defense" value={-10} max={255} min={0} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  it('calculates percentage correctly', () => {
    render(<StatsSlider label="Special Attack" value={100} max={255} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    // 100/255 = 39.21568627450981%
    expect(fillBar).toHaveStyle({ width: '39.21568627450981%' })
  })

  it('applies custom className when provided', () => {
    render(<StatsSlider label="Special Defense" value={80} className="custom-class" />)
    const container = screen.getByText('Special Defense').closest('div')?.parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('uses default color class when not specified', () => {
    render(<StatsSlider label="Speed" value={60} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    // Should use default red-500 color
    expect(fillBar).toHaveStyle({ backgroundColor: '#ef4444' })
  })

  it('applies custom color class correctly', () => {
    render(<StatsSlider label="HP" value={45} colorClass="bg-blue-500" />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveStyle({ backgroundColor: '#3b82f6' })
  })

  it('maps color classes to hex values correctly', () => {
    const testCases = [
      { colorClass: 'bg-red-500', expectedHex: '#ef4444' },
      { colorClass: 'bg-orange-500', expectedHex: '#f97316' },
      { colorClass: 'bg-blue-500', expectedHex: '#3b82f6' },
      { colorClass: 'bg-purple-500', expectedHex: '#a855f7' },
      { colorClass: 'bg-green-500', expectedHex: '#22c55e' },
      { colorClass: 'bg-yellow-500', expectedHex: '#eab308' }
    ]

    testCases.forEach(({ colorClass, expectedHex }) => {
      const { unmount } = render(<StatsSlider label="Test" value={50} colorClass={colorClass} />)
      const progressBar = screen.getByRole('progressbar')
      const fillBar = progressBar.querySelector('div[style*="width"]')
      expect(fillBar).toHaveStyle({ backgroundColor: expectedHex })
      unmount()
    })
  })

  it('applies fallback color for unknown color classes', () => {
    render(<StatsSlider label="Test" value={50} colorClass="bg-unknown" />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveStyle({ backgroundColor: '#6b7280' })
  })

  it('ensures minimum width for small values', () => {
    render(<StatsSlider label="HP" value={5} max={255} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    // 5/255 = 1.96%, should have minWidth of 12px
    expect(fillBar).toHaveStyle({ minWidth: '12px' })
  })

  it('sets minWidth to 0 for zero values', () => {
    render(<StatsSlider label="Attack" value={0} max={255} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveStyle({ minWidth: '0px' })
  })

  it('has correct accessibility attributes', () => {
    render(<StatsSlider label="Defense" value={63} max={255} min={0} />)
    const progressBar = screen.getByRole('progressbar')
    
    expect(progressBar).toHaveAttribute('aria-label', 'Defense')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '255')
    expect(progressBar).toHaveAttribute('aria-valuenow', '63')
  })

  it('applies correct styling classes', () => {
    render(<StatsSlider label="Speed" value={45} />)
    const progressBar = screen.getByRole('progressbar')
    
    expect(progressBar).toHaveClass(
      'relative',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'border-2',
      'border-gray-300',
      'dark:border-gray-600',
      'shadow-inner'
    )
  })

  it('applies correct fill bar styling', () => {
    render(<StatsSlider label="HP" value={80} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveClass(
      'absolute',
      'left-0',
      'top-0',
      'h-full',
      'rounded-full',
      'transition-all',
      'duration-700',
      'ease-out',
      'shadow-lg'
    )
  })

  it('handles edge case of max equals min', () => {
    render(<StatsSlider label="Test" value={50} max={100} min={100} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    // Should handle division by zero gracefully
    expect(fillBar).toBeInTheDocument()
  })

  it('renders with 100% width for max value', () => {
    render(<StatsSlider label="Max Stat" value={255} max={255} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveStyle({ width: '100%' })
  })

  it('renders with 0% width for min value', () => {
    render(<StatsSlider label="Min Stat" value={0} max={255} min={0} />)
    const progressBar = screen.getByRole('progressbar')
    const fillBar = progressBar.querySelector('div[style*="width"]')
    
    expect(fillBar).toHaveStyle({ width: '0%' })
  })
})
