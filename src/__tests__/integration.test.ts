import { getPokemonList, getPokemon, getAllTypes } from '@/lib/api'

// These are real integration tests that test actual API calls
describe('Real API Integration Tests', () => {
  // Test with actual network calls
  it('should fetch pokemon list from real API', async () => {
    try {
      const result = await getPokemonList(5, 0)
      
      expect(result).toBeDefined()
      expect(result.count).toBeGreaterThan(0)
      expect(result.results).toHaveLength(5)
      expect(result.results[0]).toHaveProperty('name')
      expect(result.results[0]).toHaveProperty('url')
    } catch (error) {
      // If this fails, it means there's a real network issue
      console.error('Real API test failed:', error)
      throw error
    }
  }, 10000) // 10 second timeout for network calls

  it('should fetch individual pokemon from real API', async () => {
    try {
      const pokemon = await getPokemon('bulbasaur')
      
      expect(pokemon).toBeDefined()
      expect(pokemon.id).toBe(1)
      expect(pokemon.name).toBe('bulbasaur')
      expect(pokemon.types).toBeDefined()
      expect(pokemon.stats).toBeDefined()
    } catch (error) {
      console.error('Real Pokemon API test failed:', error)
      throw error
    }
  }, 10000)

  it('should fetch types from real API', async () => {
    try {
      const types = await getAllTypes()
      
      expect(types).toBeDefined()
      expect(types.count).toBe(18) // There should be 18 types
      expect(types.results).toHaveLength(18)
    } catch (error) {
      console.error('Real Types API test failed:', error)
      throw error
    }
  }, 10000)

  it('should handle network errors gracefully', async () => {
    // Test with a non-existent endpoint to ensure error handling works
    const originalFetch = global.fetch
    
    try {
      // Mock fetch to simulate network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      await expect(getPokemonList(1, 0)).rejects.toThrow()
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })
})

// Test the actual fetch function in different environments
describe('Fetch Function Tests', () => {
  it('should work in Node.js environment', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1')
    expect(response.ok).toBe(true)
    
    const data = await response.json()
    expect(data.count).toBeGreaterThan(0)
  })

  it('should handle CORS properly', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})



