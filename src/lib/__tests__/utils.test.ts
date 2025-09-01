import { 
  cn, 
  formatPokemonName, 
  formatPokemonNumber, 
  typeColors,
  debounce
} from '../utils'

describe('Utility Functions', () => {
  describe('cn (class merging)', () => {
    it('should merge classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
      expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2')
    })
  })

  describe('formatPokemonName', () => {
    it('should format pokemon names correctly', () => {
      expect(formatPokemonName('bulbasaur')).toBe('Bulbasaur')
      expect(formatPokemonName('charizard')).toBe('Charizard')
      expect(formatPokemonName('mr-mime')).toBe('Mr mime')
      expect(formatPokemonName('ho-oh')).toBe('Ho oh')
    })
  })

  describe('formatPokemonNumber', () => {
    it('should format pokemon numbers correctly', () => {
      expect(formatPokemonNumber(1)).toBe('#001')
      expect(formatPokemonNumber(25)).toBe('#025')
      expect(formatPokemonNumber(151)).toBe('#151')
    })
  })

  describe('typeColors', () => {
    it('should have colors for all types', () => {
      const expectedTypes = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
      ]

      expectedTypes.forEach(type => {
        expect(typeColors[type]).toBeDefined()
        expect(typeColors[type].bg).toBeDefined()
        expect(typeColors[type].text).toBeDefined()
        expect(typeColors[type].border).toBeDefined()
      })
    })

    it('should have valid color values', () => {
      Object.values(typeColors).forEach(color => {
        expect(color.bg).toMatch(/^bg-.*$/)
        expect(color.text).toMatch(/^text-.*$/)
        expect(color.border).toMatch(/^border-.*$/)
      })
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', () => {
      jest.useFakeTimers()
      
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      // Call multiple times quickly
      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(callCount).toBe(0)

      // Fast forward time
      jest.advanceTimersByTime(100)

      expect(callCount).toBe(1)

      jest.useRealTimers()
    })
  })
})
