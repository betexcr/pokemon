# Cache Verification & Optimization Guide

## Quick Start

### Verify Caches Are Working

**In Browser Console:**
```javascript
import { runCacheDiagnostics } from '@/lib/cache-integration'
await runCacheDiagnostics()
```

Expected output:
```
📊 Browser Cache Status:
  - Storage: indexeddb
  - Status: available
  - Hits: 47
  - Misses: 12
  - Hit Rate: 79.66%

✅ All systems operational!
```

**In CLI:**
```bash
npx ts-node scripts/verify-cache.ts
```

## Current Caching Status

### ✅ What's Working

1. **Browser Cache (IndexedDB)**
   - Stores Pokemon data across sessions
   - 24-hour TTL for most data
   - Up to 1000 items, 50MB max
   - Hit rate should be >70% after first page load

2. **Fallback Memory Cache**
   - Handles requests when IndexedDB unavailable
   - Provides fast in-memory storage
   - Automatically used in private mode

3. **Negative Cache**
   - Prevents repeated API calls for missing Pokemon
   - 10-minute cache for 404 errors
   - 5-minute cache for other errors

4. **Request Deduplication**
   - Multiple simultaneous requests for same resource return single result
   - Prevents race conditions
   - Reduces API load

5. **Error Handling**
   - Circuit breaker stops requests when API is down
   - Exponential backoff with jitter for retries
   - Graceful degradation when cache unavailable

### ⚠️ Not Currently Used

1. **Redis (Server-side)**
   - Configured via Upstash but not integrated
   - No server-side API routes to leverage it
   - Potential future use for battle results, user data

## Monitoring & Diagnostics

### 1. Check Cache Health

```typescript
import { checkCacheHealth } from '@/lib/cache-integration'

// Returns report with status and recommendations
const report = await checkCacheHealth()
```

### 2. Get Hit Rate by Prefix

```typescript
import { getCacheHitRate, getAllCacheHitRates } from '@/lib/cache-integration'

// Single prefix
const pokemonHitRate = getCacheHitRate('pokemon')
console.log(`Pokemon cache hit rate: ${pokemonHitRate}%`)

// All prefixes
const allRates = getAllCacheHitRates()
console.log(allRates)
// Output: { pokemon: 79.5, 'pokemon-list': 85.2, move: 45.3, ... }
```

### 3. Get Cache Metrics

```typescript
import { getCacheMetrics } from '@/lib/cache-integration'

const metrics = getCacheMetrics()
console.log(metrics.browser)
// Output: {
//   pokemon: { hits: 47, misses: 12, writes: 59, errors: 0 },
//   'pokemon-list': { hits: 8, misses: 1, writes: 9, errors: 0 },
//   ...
// }
```

### 4. Export Diagnostics Data

```typescript
import { exportCacheDiagnosticsData } from '@/lib/cache-integration'

const data = await exportCacheDiagnosticsData()
// Save to file or send to logging service
console.log(JSON.stringify(data, null, 2))
```

### 5. Full Diagnostics Report

```typescript
import { runCacheDiagnostics } from '@/lib/cache-integration'

await runCacheDiagnostics()
// Prints comprehensive report to console
```

## Performance Baseline

### Expected Cache Performance

| Scenario | First Load | Subsequent Loads | Difference |
|----------|-----------|-----------------|-----------|
| Pokemon Detail | 150-300ms | 5-10ms | **95%+ faster** |
| Pokemon List | 200-400ms | 10-15ms | **93%+ faster** |
| Type Data | 100-200ms | 2-5ms | **97%+ faster** |

### Target Hit Rates

- **Pokemon Detail**: >85% (popular Pokemon cached)
- **Pokemon List**: >90% (paginated, stable)
- **Type/Ability/Move**: >80% (stable reference data)
- **Overall**: >75% (good balance)

### Storage Usage

- **Average**: 30-40MB after first full load
- **With all 1000 Pokemon**: ~50MB
- **Cleanup**: Automatic LRU eviction at 50MB limit

## Optimization Checklist

- [ ] Cache hit rate >70% within 1 hour of first visit
- [ ] No errors in IndexedDB operations
- [ ] Response times <10ms for cache hits
- [ ] Storage usage staying under 45MB
- [ ] No circuit breaker activations
- [ ] Redis configured and responding (if using server-side caching)

## Common Issues & Solutions

### Issue: Low Cache Hit Rate (<50%)

**Possible Causes**:
1. Storage quota exceeded (browser won't store more)
2. TTL values too short
3. Cache keys not consistent
4. Private browsing mode (localStorage/IndexedDB disabled)

**Solutions**:
```javascript
// Check storage status
import { cacheVerification } from '@/lib/cache-verification'
const status = await cacheVerification.verifyBrowserCache()
console.log(status)

// Check available storage
navigator.storage.estimate().then(est => {
  console.log(`Usage: ${est.usage}B / ${est.quota}B`)
})

// Clear cache if corrupted
indexedDB.deleteDatabase('pokemon-cache')
localStorage.clear()
```

### Issue: High Memory Usage (>50MB)

**Solutions**:
```javascript
// Manually clear least-used cache entries
import { browserCache } from '@/lib/memcached'
await browserCache.clearPattern('pokemon:move:*') // Clear all moves

// Or clear entire cache
await browserCache.flush() // If implemented
```

### Issue: Slow Initial Load

**Check**:
1. Is circuit breaker open? → Wait 30 seconds
2. Is PokeAPI responding? → Check https://pokeapi.co
3. Are there network errors? → Check browser DevTools

**Solutions**:
```javascript
import { api } from '@/lib/api'
// Check circuit breaker status
const isOpen = circuitBreaker.isOpen()
console.log(`Circuit breaker: ${isOpen ? 'OPEN' : 'CLOSED'}`)
```

### Issue: Redis Not Working

**Check**:
```javascript
import { redis } from '@/lib/redis'
const pong = await redis.ping()
console.log(pong) // Should be 'PONG'
```

**Verify Environment Variables**:
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

If not set, Redis won't work. Add to `.env.local`:
```
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

## Usage Examples

### Example 1: Fetch With Tracking

```typescript
import { getPokemon } from '@/lib/api'
import { getCacheHitRate } from '@/lib/cache-integration'

// Fetch Pokemon (will cache automatically)
const pokemon = await getPokemon(25)

// Check cache effectiveness
const hitRate = getCacheHitRate('pokemon')
console.log(`Pokemon cache hit rate: ${hitRate.toFixed(2)}%`)
```

### Example 2: Monitor During Development

```typescript
import { runCacheDiagnostics } from '@/lib/cache-integration'

// Run after user session
setInterval(async () => {
  await runCacheDiagnostics()
}, 60000) // Every minute
```

### Example 3: Production Monitoring

```typescript
import { exportCacheDiagnosticsData } from '@/lib/cache-integration'

// Send metrics to analytics
window.addEventListener('beforeunload', async () => {
  const data = await exportCacheDiagnosticsData()
  navigator.sendBeacon('/api/analytics/cache', JSON.stringify(data))
})
```

### Example 4: Error Handling

```typescript
import { getCacheHealth } from '@/lib/cache-integration'

async function loadPokemon(id) {
  try {
    // Get current health
    const health = await getCacheHealth()
    
    if (health.browser.status === 'unavailable') {
      console.warn('Browser cache unavailable, using memory cache')
    }
    
    return await getPokemon(id)
  } catch (error) {
    console.error('Failed to load Pokemon:', error)
    // Fallback UI
  }
}
```

## Redis Future Integration

When implementing server-side caching with Redis:

```typescript
// 1. Create API routes that cache responses
export async function cachePokemonResponse(id: number) {
  from '@/lib/redis'
  import { redisCache } from '@/lib/redis'
  
  const cacheKey = `pokemon:${id}`
  
  // Check cache first
  const cached = await redisCache.get(cacheKey)
  if (cached) return cached
  
  // Fetch from PokeAPI
  const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
  
  // Cache for 24 hours
  await redisCache.set(cacheKey, pokemon, 24 * 60 * 60)
  
  return pokemon
}

// 2. Use in API routes
export async function GET(req, res) {
  const id = req.params.id
  const pokemon = await cachePokemonResponse(id)
  res.json(pokemon)
}
```

## Metrics Dashboard

To display cache metrics in UI:

```typescript
// src/components/CacheMetricsDashboard.tsx
import { getAllCacheHitRates, getCacheMetrics } from '@/lib/cache-integration'

export function CacheMetricsDashboard() {
  const [metrics, setMetrics] = useState({})
  
  useEffect(() => {
    const updateMetrics = async () => {
      const hitRates = getAllCacheHitRates()
      const cacheMetrics = getCacheMetrics()
      setMetrics({ hitRates, cacheMetrics })
    }
    
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics()
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2>Cache Metrics</h2>
      {Object.entries(metrics.hitRates).map(([prefix, rate]) => (
        <div key={prefix} className="flex justify-between">
          <span>{prefix}</span>
          <span className={rate > 70 ? 'text-green-600' : 'text-red-600'}>
            {(rate as number).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}
```

## Deployment Checklist

Before deploying:

- [ ] Run `npm run test` to verify cache logic
- [ ] Check cache hit rates on staging
- [ ] Verify Redis credentials in production environment
- [ ] Monitor cache metrics in first hour after deploy
- [ ] Set up alerts for cache errors
- [ ] Document any custom cache strategies

## Support

For issues with caching:

1. Check [CACHING_ARCHITECTURE.md](./CACHING_ARCHITECTURE.md) for detailed design
2. Run `runCacheDiagnostics()` in browser console
3. Review browser DevTools > Application > IndexedDB
4. Check Redis status at Upstash dashboard
5. Review error logs in browser console

## Related Files

- [Architecture Design](./CACHING_ARCHITECTURE.md)
- Cache Implementation: `src/lib/api.ts`
- Browser Cache: `src/lib/memcached.ts`  
- Redis Client: `src/lib/redis.ts`
- Verification: `src/lib/cache-verification.ts`
- Strategy: `src/lib/cache-strategy.ts`
- Integration: `src/lib/cache-integration.ts`
- Test Script: `scripts/verify-cache.ts`
