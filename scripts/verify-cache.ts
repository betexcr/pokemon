#!/usr/bin/env node

/**
 * Cache Verification Script
 * 
 * Run from CLI to verify caching is working correctly:
 * npx ts-node scripts/verify-cache.ts
 * 
 * Or in browser console:
 * import { runCacheDiagnostics } from '@/lib/cache-integration'
 * runCacheDiagnostics()
 */

import { getPokemon, getPokemonList, getType } from '@/lib/api'
import { runCacheDiagnostics, logCacheHealth, exportCacheDiagnosticsData } from '@/lib/cache-integration'

async function verifyCaching() {
  console.log('🧪 Starting Cache Verification Test\n')

  try {
    // Test 1: Check initial cache state
    console.log('Test 1️⃣: Checking initial cache state...')
    let diagnostics = await exportCacheDiagnosticsData()
    console.log('Initial state:', {
      browserStatus: diagnostics.browser.status,
      browserStorage: diagnostics.browser.storage,
      redisStatus: diagnostics.redis.status,
    })
    console.log('✅ Passed\n')

    // Test 2: Fetch Pokemon and verify cache write
    console.log('Test 2️⃣: Fetching Pokemon #25 (first time)...')
    const startTime1 = performance.now()
    const pokemon1 = await getPokemon(25)
    const time1 = performance.now() - startTime1
    console.log(`✅ Fetched in ${time1.toFixed(2)}ms`)
    console.log(`   Data: ${pokemon1.name} - Type: ${pokemon1.types.map((t: any) => t.type.name).join(', ')}\n`)

    // Test 3: Fetch same Pokemon and verify cache hit
    console.log('Test 3️⃣: Fetching Pokemon #25 (second time - should be cached)...')
    const startTime2 = performance.now()
    const pokemon2 = await getPokemon(25)
    const time2 = performance.now() - startTime2
    console.log(`✅ Fetched in ${time2.toFixed(2)}ms`)

    if (time2 < time1 / 2) {
      console.log(`   ✅ Cache hit confirmed! (${((1 - time2 / time1) * 100).toFixed(0)}% faster)\n`)
    } else {
      console.log(`   ⚠️ Second fetch not significantly faster - cache may not be working\n`)
    }

    // Test 4: Multiple Pokemon
    console.log('Test 4️⃣: Fetching multiple Pokemon (1-5)...')
    const bulkStart = performance.now()
    const bulkPokemon = await Promise.all([
      getPokemon(1),
      getPokemon(2),
      getPokemon(3),
      getPokemon(4),
      getPokemon(5)
    ])
    const bulkTime = performance.now() - bulkStart
    console.log(`✅ Fetched ${bulkPokemon.length} Pokemon in ${bulkTime.toFixed(2)}ms`)
    console.log(`   Avg: ${(bulkTime / bulkPokemon.length).toFixed(2)}ms per Pokemon\n`)

    // Test 5: Fetch Pokemon list
    console.log('Test 5️⃣: Fetching Pokemon list...')
    const listStart = performance.now()
    const list1 = await getPokemonList(20, 0)
    const listTime1 = performance.now() - listStart
    console.log(`✅ Fetched list in ${listTime1.toFixed(2)}ms`)
    console.log(`   Count: ${list1.results.length} Pokemon\n`)

    // Test 6: Fetch same list (should be cached)
    console.log('Test 6️⃣: Fetching same Pokemon list (second time)...')
    const listStart2 = performance.now()
    const list2 = await getPokemonList(20, 0)
    const listTime2 = performance.now() - listStart2
    console.log(`✅ Fetched in ${listTime2.toFixed(2)}ms`)

    if (listTime2 < listTime1 / 2) {
      console.log(`   ✅ Cache hit confirmed! (${((1 - listTime2 / listTime1) * 100).toFixed(0)}% faster)\n`)
    } else {
      console.log(`   ⚠️ List cache may not be working as expected\n`)
    }

    // Test 7: Fetch type data
    console.log('Test 7️⃣: Fetching type data...')
    const typeStart = performance.now()
    const typeData = await getType('electric')
    const typeTime = performance.now() - typeStart
    console.log(`✅ Fetched type in ${typeTime.toFixed(2)}ms`)
    console.log(`   Has ${typeData.pokemon?.length || 0} Pokemon\n`)

    // Test 8: Run diagnostics
    console.log('Test 8️⃣: Running full cache diagnostics...')
    await runCacheDiagnostics()

    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('✅ ALL TESTS COMPLETED')
    console.log('='.repeat(50))

    return { success: true, diagnostics }
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error }
  }
}

export { verifyCaching }

// If running as CLI
if (require.main === module) {
  verifyCaching().then(result => {
    if (!result.success) {
      process.exit(1)
    }
  })
}
