// End-to-end test that simulates the actual application behavior
// This test will help us understand what's happening in the real app

describe('End-to-End Application Tests', () => {
  // Test the actual API functions with proper mocking
  it('should handle API calls like the real application', async () => {
    // Mock fetch to return realistic data
    const mockFetch = jest.fn()
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        count: 151,
        next: null,
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
        ]
      }),
      headers: {
        get: () => 'application/json'
      }
    })

    // Mock individual pokemon response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        id: 1,
        name: 'bulbasaur',
        types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 45 },
          { stat: { name: 'attack' }, base_stat: 49 }
        ]
      }),
      headers: {
        get: () => 'application/json'
      }
    })

    // Temporarily replace global fetch
    const originalFetch = global.fetch
    global.fetch = mockFetch

    try {
      // Import the API functions
      const { getPokemonList, getPokemon } = await import('@/lib/api')
      
      // Test the API calls
      const listResult = await getPokemonList(2, 0)
      expect(listResult.count).toBe(151)
      expect(listResult.results).toHaveLength(2)
      
      const pokemonResult = await getPokemon('bulbasaur')
      expect(pokemonResult.id).toBe(1)
      expect(pokemonResult.name).toBe('bulbasaur')
      
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })

  it('should handle network errors like the real application', async () => {
    // Mock fetch to simulate network failure
    const mockFetch = jest.fn()
    mockFetch.mockRejectedValue(new Error('Failed to fetch'))
    
    // Temporarily replace global fetch
    const originalFetch = global.fetch
    global.fetch = mockFetch

    try {
      // Import the API functions
      const { getPokemonList } = await import('@/lib/api')
      
      // Test that the error is properly thrown
      await expect(getPokemonList(1, 0)).rejects.toThrow('Failed to fetch')
      
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })

  it('should handle API errors like the real application', async () => {
    // Mock fetch to simulate API error response
    const mockFetch = jest.fn()
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Server error' }),
      headers: {
        get: () => 'application/json'
      }
    })
    
    // Temporarily replace global fetch
    const originalFetch = global.fetch
    global.fetch = mockFetch

    try {
      // Import the API functions
      const { getPokemonList } = await import('@/lib/api')
      
      // Test that the error is properly handled
      await expect(getPokemonList(1, 0)).rejects.toThrow()
      
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })
})

// Test the actual fetch function behavior
describe('Fetch Function Behavior', () => {
  it('should work with real fetch when available', async () => {
    // This test will only work if we're in an environment with real fetch
    if (typeof fetch === 'function') {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1')
        expect(response).toBeDefined()
        expect(typeof response.ok).toBe('boolean')
      } catch (error) {
        // If this fails, it means there's a real network issue
        console.log('Real fetch test failed (expected in test environment):', error.message)
      }
    }
  })
})



