// Test utility for the new hybrid image cache
'use client'

import { imageCache } from './imageCache'

export class CacheTest {
  static async testImageCache() {
    console.log('🧪 Testing Hybrid Image Cache...')
    
    // Test URLs
    const testUrls = [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png', // Bulbasaur
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png', // Ivysaur
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png', // Venusaur
    ]
    
    console.log('📊 Initial cache stats:', imageCache.getStats())
    
    // Test 1: First load (should fetch from network)
    console.log('\n🔄 Test 1: First load (network fetch)')
    const start1 = performance.now()
    const url1 = await imageCache.getImage(testUrls[0])
    const time1 = performance.now() - start1
    console.log(`✅ Bulbasaur loaded in ${time1.toFixed(2)}ms`)
    console.log('📊 Cache stats after first load:', imageCache.getStats())
    
    // Test 2: Second load (should come from memory cache)
    console.log('\n🔄 Test 2: Second load (memory cache)')
    const start2 = performance.now()
    const url2 = await imageCache.getImage(testUrls[0])
    const time2 = performance.now() - start2
    console.log(`✅ Bulbasaur loaded from memory in ${time2.toFixed(2)}ms`)
    console.log(`🚀 Speed improvement: ${(time1 / time2).toFixed(1)}x faster`)
    
    // Test 3: Load multiple images
    console.log('\n🔄 Test 3: Load multiple images')
    const start3 = performance.now()
    const urls = await Promise.all(testUrls.map(url => imageCache.getImage(url)))
    const time3 = performance.now() - start3
    console.log(`✅ ${testUrls.length} images loaded in ${time3.toFixed(2)}ms`)
    console.log('📊 Final cache stats:', imageCache.getStats())
    
    // Test 4: Service Worker cache test (after page refresh)
    console.log('\n🔄 Test 4: Service Worker cache test')
    console.log('💡 Refresh the page and run this test again to see Service Worker cache in action')
    
    return {
      memoryCacheTime: time2,
      networkTime: time1,
      speedImprovement: time1 / time2,
      cacheStats: imageCache.getStats()
    }
  }
  
  static async testCachePersistence() {
    console.log('🧪 Testing Cache Persistence...')
    
    // Load an image
    const testUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' // Pikachu
    await imageCache.getImage(testUrl)
    
    console.log('✅ Image loaded and cached')
    console.log('📊 Cache stats:', imageCache.getStats())
    console.log('💡 Refresh the page to test Service Worker persistence')
    
    return imageCache.getStats()
  }
  
  static clearCache() {
    console.log('🧹 Clearing image cache...')
    imageCache.clear()
    console.log('✅ Cache cleared')
    console.log('📊 Cache stats after clear:', imageCache.getStats())
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).CacheTest = CacheTest
}



