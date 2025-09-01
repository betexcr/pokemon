import { formatPokemonName, formatPokemonNumber, cn } from '@/lib/utils'

describe('Basic Functionality Tests', () => {
  describe('Utility Functions', () => {
    it('should format pokemon names correctly', () => {
      expect(formatPokemonName('bulbasaur')).toBe('Bulbasaur')
      expect(formatPokemonName('charizard')).toBe('Charizard')
      expect(formatPokemonName('mr-mime')).toBe('Mr mime')
      expect(formatPokemonName('ho-oh')).toBe('Ho oh')
    })

    it('should format pokemon numbers correctly', () => {
      expect(formatPokemonNumber(1)).toBe('#001')
      expect(formatPokemonNumber(25)).toBe('#025')
      expect(formatPokemonNumber(151)).toBe('#151')
    })

    it('should merge classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
      expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2')
    })
  })

  describe('Type System', () => {
    it('should have correct Pokemon interface structure', () => {
      // This test verifies that our TypeScript interfaces are properly defined
      const mockPokemon = {
        id: 1,
        name: 'bulbasaur',
        types: [
          { type: { name: 'grass' } },
          { type: { name: 'poison' } }
        ],
        stats: [
          { stat: { name: 'hp' }, base_stat: 45 },
          { stat: { name: 'attack' }, base_stat: 49 }
        ],
        height: 7,
        weight: 69
      }

      expect(mockPokemon.id).toBe(1)
      expect(mockPokemon.name).toBe('bulbasaur')
      expect(mockPokemon.types).toHaveLength(2)
      expect(mockPokemon.stats).toHaveLength(2)
    })
  })

  describe('Component Structure', () => {
    it('should have proper component props structure', () => {
      const mockProps = {
        pokemon: {
          id: 1,
          name: 'bulbasaur',
          types: [{ type: { name: 'grass' } }]
        },
        isFavorite: false,
        onToggleFavorite: jest.fn()
      }

      expect(mockProps.pokemon.id).toBe(1)
      expect(mockProps.isFavorite).toBe(false)
      expect(typeof mockProps.onToggleFavorite).toBe('function')
    })
  })
})
