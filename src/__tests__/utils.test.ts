import { formatPokemonName, typeColors } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('formatPokemonName', () => {
    it('capitalizes first letter of pokemon name', () => {
      expect(formatPokemonName('bulbasaur')).toBe('Bulbasaur')
      expect(formatPokemonName('charmander')).toBe('Charmander')
      expect(formatPokemonName('squirtle')).toBe('Squirtle')
    })

    it('handles pokemon names with hyphens', () => {
      expect(formatPokemonName('pikachu-rainbow')).toBe('Pikachu rainbow')
      expect(formatPokemonName('nidoran-female')).toBe('Nidoran female')
    })

    it('handles empty string', () => {
      expect(formatPokemonName('')).toBe('')
    })

    it('handles single character', () => {
      expect(formatPokemonName('a')).toBe('A')
    })

    it('handles already capitalized names', () => {
      expect(formatPokemonName('Bulbasaur')).toBe('Bulbasaur')
    })
  })

  describe('typeColors', () => {
    it('contains expected pokemon type colors', () => {
      expect(typeColors).toHaveProperty('normal')
      expect(typeColors).toHaveProperty('fire')
      expect(typeColors).toHaveProperty('water')
      expect(typeColors).toHaveProperty('electric')
      expect(typeColors).toHaveProperty('grass')
      expect(typeColors).toHaveProperty('ice')
      expect(typeColors).toHaveProperty('fighting')
      expect(typeColors).toHaveProperty('poison')
      expect(typeColors).toHaveProperty('ground')
      expect(typeColors).toHaveProperty('flying')
      expect(typeColors).toHaveProperty('psychic')
      expect(typeColors).toHaveProperty('bug')
      expect(typeColors).toHaveProperty('rock')
      expect(typeColors).toHaveProperty('ghost')
      expect(typeColors).toHaveProperty('dragon')
      expect(typeColors).toHaveProperty('dark')
      expect(typeColors).toHaveProperty('steel')
      expect(typeColors).toHaveProperty('fairy')
    })

    it('has valid color structure', () => {
      Object.values(typeColors).forEach(colorObj => {
        expect(typeof colorObj).toBe('object')
        expect(colorObj).toHaveProperty('bg')
        expect(colorObj).toHaveProperty('text')
        expect(colorObj).toHaveProperty('border')
        expect(typeof colorObj.bg).toBe('string')
        expect(typeof colorObj.text).toBe('string')
        expect(typeof colorObj.border).toBe('string')
      })
    })
  })
})
