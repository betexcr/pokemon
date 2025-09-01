// This test file tests the real API without Jest mocking interference
// Run this with: npm test -- src/__tests__/real-api.test.ts

// Temporarily restore the real fetch for these tests
const originalFetch = global.fetch

describe('Real API Tests (No Mocking)', () => {
  beforeAll(() => {
    // Restore real fetch for these tests
    global.fetch = originalFetch
  })

  afterAll(() => {
    // Restore the mock for other tests
    global.fetch = jest.fn()
  })

  it('should fetch pokemon list from real API', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=5')
    
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.count).toBeGreaterThan(0)
    expect(data.results).toHaveLength(5)
    expect(data.results[0]).toHaveProperty('name')
    expect(data.results[0]).toHaveProperty('url')
  }, 15000)

  it('should fetch individual pokemon from real API', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/bulbasaur')
    
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    
    const pokemon = await response.json()
    expect(pokemon.id).toBe(1)
    expect(pokemon.name).toBe('bulbasaur')
    expect(pokemon.types).toBeDefined()
    expect(pokemon.stats).toBeDefined()
  }, 15000)

  it('should fetch types from real API', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/type')
    
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    
    const types = await response.json()
    expect(types.count).toBe(18)
    expect(types.results).toHaveLength(18)
  }, 15000)

  it('should handle API errors gracefully', async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/nonexistent-pokemon')
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  }, 15000)
})



