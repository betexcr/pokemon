import { getPokemonMainPageImage } from '@/lib/api'

describe('API Functions', () => {
  describe('getPokemonMainPageImage', () => {
    it('returns correct image URL for pokemon ID', () => {
      const imageUrl = getPokemonMainPageImage(1)
      expect(imageUrl).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/1.png')
    })

    it('handles different pokemon IDs', () => {
      expect(getPokemonMainPageImage(25)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png')
      expect(getPokemonMainPageImage(150)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/150.png')
    })

    it('handles edge cases', () => {
      expect(getPokemonMainPageImage(0)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/0.png')
      expect(getPokemonMainPageImage(1000)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/1000.png')
    })
  })
})
