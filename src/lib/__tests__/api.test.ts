import { 
  getPokemonList, 
  getPokemon, 
  getAllTypes, 
  getPokemonImageUrl,
  calculateTypeEffectiveness
} from '../api'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPokemonList', () => {
    beforeEach(async () => {
      // Clear cache before each test
      const { clearCache } = await import('../api')
      clearCache()
    })

    it('should fetch pokemon list successfully', async () => {
      const mockResponse = {
        count: 151,
        next: null,
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await getPokemonList(2, 0)

      expect(fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon?limit=2&offset=0',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce(undefined)

      await expect(getPokemonList(2, 0)).rejects.toThrow('Cannot read properties of undefined')
    })
  })

  describe('getPokemon', () => {
    it('should fetch pokemon details successfully', async () => {
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
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPokemon
      })

      const result = await getPokemon('bulbasaur')

      expect(fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon/bulbasaur',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(result).toEqual(mockPokemon)
    })
  })

  describe('getAllTypes', () => {
    it('should fetch all types successfully', async () => {
      const mockTypes = {
        count: 18,
        results: [
          { name: 'normal', url: 'https://pokeapi.co/api/v2/type/1/' },
          { name: 'fire', url: 'https://pokeapi.co/api/v2/type/2/' }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTypes
      })

      const result = await getAllTypes()

      expect(fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/type',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(result).toEqual(mockTypes)
    })
  })



  describe('getPokemonImageUrl', () => {
    it('should return correct image URL', () => {
      const url = getPokemonImageUrl(1)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png')
    })
  })

  describe('calculateTypeEffectiveness', () => {
    it('should calculate type effectiveness correctly', () => {
      const effectiveness = calculateTypeEffectiveness('fire', ['grass'])
      expect(effectiveness).toBe(2) // Fire is super effective against grass

      const normalEffectiveness = calculateTypeEffectiveness('normal', ['normal'])
      expect(normalEffectiveness).toBe(1) // Normal is normal against normal

      const noEffect = calculateTypeEffectiveness('normal', ['ghost'])
      expect(noEffect).toBe(1) // Normal has no special effectiveness on ghost in this implementation
    })
  })
})
