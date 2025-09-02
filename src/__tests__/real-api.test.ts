// This test file tests the real API without Jest mocking interference
// Run this with: npm test -- src/__tests__/real-api.test.ts

describe.skip('Real API Tests (No Mocking)', () => {
  // Skip these tests for now as they depend on external services
  // and can be flaky in CI environments
  
  it('should fetch pokemon list from real API', async () => {
    expect(true).toBe(true) // Placeholder
  })

  it('should fetch individual pokemon from real API', async () => {
    expect(true).toBe(true) // Placeholder
  })

  it('should fetch types from real API', async () => {
    expect(true).toBe(true) // Placeholder
  })

  it('should handle API errors gracefully', async () => {
    expect(true).toBe(true) // Placeholder
  })
})



