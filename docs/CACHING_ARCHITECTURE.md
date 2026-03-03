# Pokémon Caching Architecture

## Overview

This document describes the caching architecture used to optimize Pokémon API data retrieval across the application. The system implements a **hybrid caching strategy** with server-side and client-side components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Components / Pages                    │  │
│  │         (main dex, detail pages, battles)             │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         browserCache (IndexedDB/localStorage)         │  │
│  │  - POKEMON_LIST: 24 hours                             │  │
│  │  - POKEMON_DETAIL: 24 hours                           │  │
│  │  - TYPE, ABILITY, MOVE: 30 days                       │  │
│  │  - Max: 1000 items, 50MB limit                        │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │ (miss)                                 │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Fallback Memory Cache                         │  │
│  │    (if IndexedDB/localStorage unavailable)            │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │ (miss)                                 │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ Network Request
                      │ (HTTP/HTTPS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Pokémon API (PokeAPI.co)                         │
│  - Base URL: https://pokeapi.co/api/v2                       │
│  - Endpoints: /pokemon, /type, /ability, /move, etc.         │
│  - Response: JSON data for requested resource                │
└─────────────────────────────────────────────────────────────┘
```

## Caching Layers

### Layer 1: Browser Cache (IndexedDB/localStorage)

**Purpose**: Persistent client-side caching for repeat visits

**Features**:
- **Storage Backend**: IndexedDB (primary) or localStorage (fallback)
- **Max Size**: 50MB limit
- **Max Items**: 1000 entries (LRU eviction)
- **TTL Configuration**:
  ```
  POKEMON_LIST: 24 hours
  POKEMON_DETAIL: 24 hours
  POKEMON_SPECIES: 24 hours
  EVOLUTION_CHAIN: 24 hours
  TYPE: 24 hours
  ABILITY: 24 hours
  MOVE: 24 hours
  POKEMON_TOTALS_COUNT: 24 hours
  ```

**Implementation**: `src/lib/memcached.ts` - `BrowserCache` class

**Advantages**:
- Persists across browser sessions
- No server infrastructure needed
- Reduces API calls significantly
- Fast retrieval (IndexedDB ~1-5ms)

### Layer 2: Fallback Memory Cache

**Purpose**: Fast in-memory caching when IndexedDB/localStorage unavailable

**Features**:
- **Scope**: Runtime only (lost on page refresh)
- **Max Size**: Unlimited (controlled by JavaScript heap)
- **Use Cases**:
  - Browser private mode
  - Storage quota exceeded
  - Storage unavailable

**Implementation**: `src/lib/api.ts` - `fallbackCache` Map

### Layer 3: Negative Cache

**Purpose**: Prevents repeated failed API requests

**Features**:
- **Cache Duration**: 
  - 404s: 600 seconds (10 minutes)
  - Other errors: 300 seconds (5 minutes)
- **Prevents**: Thundering herd on non-existent resources

**Implementation**: `src/lib/api.ts` - `negativeCache` Map

### Layer 4: Redis (Server-side - Currently Unused)

**Status**: ✅ Configured but not actively used

**Setup**:
- **Provider**: Upstash Redis
- **Environment Variables**:
  ```
  UPSTASH_REDIS_REST_URL=https://hardy-jackass-16664.upstash.io
  UPSTASH_REDIS_REST_TOKEN=AUEYAAIncDIzZGVmMmQ1ZTVmMTg0MzI1Yjk3ZmEwMDBiZWRkNTg4YnAyMTY2NjQ
  ```
- **Client**: `@upstash/redis` v1.35.4
- **TTLs**: All set to 24 hours

**Location**: `src/lib/redis.ts` - `RedisCache` class

**Why Currently Unused**:
- No server-side API routes that would benefit from Redis
- All Pokemon data fetching happens client-side
- Upstash REST API would add latency compared to direct client fetch
- Browser cache is sufficient for client-side use

**Potential Future Use**: 
- Caching processed battle results
- Caching user team data
- Caching aggregated statistics
- Rate limiting middleware

## Data Flow

### Cache Hit Scenario (Subsequent Requests)

```
User requests Pokemon #25 → Check browserCache → Cache hit! 
→ Return data (~2ms) → No API call
```

### Cache Miss Scenario (First Request)

```
User requests Pokemon #25 → Check browserCache → Miss 
→ Check fallbackCache → Miss 
→ Check negativeCache → Not failed 
→ Fetch from PokeAPI 
→ Store in browserCache 
→ Return data
```

### Failed Request Scenario

```
User requests non-existent Pokemon → Check negativeCache 
→ Entry exists within TTL → Throw cached error immediately
→ No API call, prevents repeated failures
```

## Cache Keys

Cache keys follow a consistent pattern for organization:

```
pokemon:{prefix}:{JSON.stringify(params)}
```

**Examples**:
```
pokemon:pokemon:{"id":25}
pokemon:pokemon-list:{"limit":100,"offset":0}
pokemon:type:{"id":"electric"}
pokemon:search-pokemon:{"query":"pikachu"}
pokemon:evolution-chain:{"id":1}
```

## Request Deduplication

**Purpose**: Prevent race conditions when multiple requests for the same resource are made simultaneously

**Implementation**: `inFlightRequests` Map in `api.ts`

**How it Works**:
```
Request 1 for Pokemon #25 → Fetch starts, stored as in-flight
Request 2 for Pokemon #25 (same request) → Returns same promise
(Request 2 doesn't make new API call)
Both requests complete successfully
```

## Error Handling & Recovery

### Circuit Breaker Pattern

**Purpose**: Prevent cascading failures when API is down

**Configuration**:
- **Failure Threshold**: 5 consecutive failures
- **Recovery Timeout**: 30 seconds
- **Retry Statuses**: 404, 408, 425, 429, 500, 502, 503, 504

**Behavior**:
```
Success → Reset failures to 0
Failure #1 → Log warning
Failure #2-4 → Continue retrying
Failure #5+ → Open circuit, reject new requests immediately
After 30s → Attempt recovery, reset circuit
```

### Exponential Backoff with Jitter

**Purpose**: Handle transient failures gracefully

**Configuration**:
- **Base Delay**: 500ms
- **Max Attempts**: 5
- **Jitter**: ±200ms (prevents thundering herd)
- **Special Case**: 503 errors get 2x multiplier

**Backoff Schedule**:
```
Attempt 1: 0ms (immediate)
Attempt 2: 500ms + jitter
Attempt 3: 1000ms + jitter
Attempt 4: 2000ms + jitter
Attempt 5: 4000ms + jitter
Special 503: 1000ms, 2000ms, 4000ms, 8000ms, 16000ms
```

## Performance Characteristics

### Cache Hit Performance

| Operation | Time | Source |
|-----------|------|--------|
| Memory cache hit | <1ms | JavaScript Map |
| IndexedDB hit | 1-5ms | Browser storage |
| localStorage hit | 5-10ms | Browser storage |
| Network miss + API | 200-1000ms | PokeAPI + network |

### Storage Usage

| Entry Type | Size | Count | Total |
|-----------|------|-------|-------|
| Pokemon detail | ~50KB | 1000 | 50MB |
| Type data | ~10KB | 20 | 200KB |
| Ability | ~5KB | 300 | 1.5MB |
| Move | ~8KB | 1000 | 8MB |
| **Total** | - | - | **~60MB** |

**Note**: Browser has 50MB limit, so selective caching of popular Pokemon

## Cache Invalidation

### Automatic Invalidation

Entries are invalidated based on TTL (time-to-live):
- **Short TTL** (1-24 hours): Frequently changing data (search results, lists)
- **Long TTL** (7-30 days): Stable data (types, abilities, moves)

### Manual Invalidation

Currently not implemented. Future improvements could include:
- Version-based invalidation (increment cache version)
- Pattern-based clearing (`pokemon:pokemon-list:*`)
- Time-based cleanup of expired entries

## Request Analytics

The system tracks request analytics through `requestAnalytics` manager:

**Metrics Tracked**:
- Request start time
- Request completion time
- Request status (completed, cancelled, failed)
- Request URL and type

**Use Cases**:
- Performance monitoring
- Identifying slow requests
- Tracking cache effectiveness
- Debugging network issues

## Optimization Strategies

### 1. Cache Warming

Strategies for pre-loading popular data:
- Load top 50 Pokemon on app startup
- Pre-fetch type data on type page visit
- Load ability data when hovering over Pokemon

### 2. Request Batching

Batch similar requests together:
- Multiple Pokemon requests → Use pagination API
- Multiple move details → Group into single call

### 3. Smart Prefetching

- When user views Pokemon detail → Prefetch evolution chain
- When user searches → Prefetch top 5 results
- On battle start → Prefetch opponent Pokemon

### 4. Compressed Storage

Potential improvements:
- Compress large JSON responses before caching
- Store only essential fields instead of full API responses
- Use brotli or gzip compression

## Monitoring & Verification

### Health Check Utility

`src/lib/cache-verification.ts` provides:

```typescript
const verification = new CacheVerification()

// Check cache status
const report = await verification.getHealthReport()

// Example output:
{
  redis: { status: 'connected' | 'error', latency?: number },
  browser: { status: 'available' | 'unavailable', storage: 'indexeddb' | 'localstorage' },
  stats: {
    redis: { hits: 0, misses: 0, hitRate: 0 },
    browser: { hits: 123, misses: 45, hitRate: 73.2 }
  },
  recommendations: [...]
}
```

### Cache Metrics

Tracked in `src/lib/cache-strategy.ts`:

```typescript
const metrics = new CacheMetrics()

// Record operations
metrics.recordHit('pokemon', 2.5) // 2.5ms response time
metrics.recordMiss('pokemon')
metrics.recordWrite('pokemon-list')
metrics.recordError('move')

// Get statistics
const hitRate = metrics.getHitRate('pokemon') // 73.2%
const allMetrics = metrics.getAllMetrics()
```

## Configuration Reference

### TTL Values (in seconds)

```typescript
REDIS_CACHE_TTL = {
  POKEMON_LIST: 86400,        // 24 hours
  POKEMON_DETAIL: 86400,      // 24 hours
  POKEMON_SPECIES: 86400,     // 24 hours
  EVOLUTION_CHAIN: 86400,     // 24 hours
  TYPE: 86400,                // 24 hours
  ABILITY: 86400,             // 24 hours
  MOVE: 86400,                // 24 hours
  POKEMON_SKELETONS: 86400,   // 24 hours
  POKEMON_TOTAL_COUNT: 86400, // 24 hours
}
```

### BrowserCache Configuration

```typescript
CACHE_TTL = {
  POKEMON_LIST: 86400,        // 24 hours
  POKEMON_DETAIL: 86400,      // 24 hours
  ... // Same as above
}

MAX_CACHE_SIZE = 50 * 1024 * 1024  // 50MB
MAX_ITEMS = 1000                    // 1000 entries
```

## Best Practices

### For Developers

1. **Always use cache keys consistently**
   ```typescript
   const key = getCacheKey('pokemon', { id: 25 })
   ```

2. **Handle cache misses gracefully**
   ```typescript
   const cached = await getCache(key)
   if (!cached) {
     // Fetch from API
   }
   ```

3. **Respect TTL values**
   - Don't aggressively cache volatile data
   - Use longer TTLs for stable data

4. **Clean up negative cache periodically**
   - Don't cache failed requests indefinitely
   - Use reasonable TTLs (5-10 minutes)

### For Operators

1. **Monitor cache hit rates**
   - Aim for >70% hit rate in production
   - Below 50% indicates issues

2. **Watch storage usage**
   - Monitor IndexedDB/localStorage usage
   - Alert if approaching limits

3. **Track error rates**
   - Monitor circuit breaker activations
   - Check for API degradation

4. **Update TTLs based on data volatility**
   - Check if data is stale
   - Adjust if needed

## Troubleshooting

### Problem: Low Cache Hit Rate

**Investigation**:
1. Check if StorageManager is available (`cacheVerification.verifyBrowserCache()`)
2. Check if TTLs are too short
3. Check cache key consistency

**Solution**:
- Increase TTL for stable data
- Ensure cache key generation is consistent
- Clear browser storage and retry

### Problem: High Memory Usage

**Investigation**:
1. Check if cache is growing without bound
2. Check for memory leaks in inFlightRequests

**Solution**:
- Reduce MAX_ITEMS or MAX_CACHE_SIZE
- Implement more aggressive LRU eviction
- Profile memory usage with DevTools

### Problem: Stale Data

**Investigation**:
1. Check if TTLs are too long
2. Check if version-based invalidation is working
3. Check if manual cache clearing is needed

**Solution**:
- Reduce TTL for frequently changing data
- Implement version-based invalidation
- Add manual cache clear UI

### Problem: Redis Connection Issues

**Investigation**:
1. Check environment variables are set
2. Test Upstash connectivity
3. Check for network issues

**Solution**:
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Test with `redisCache.ping()`
- Check Upstash dashboard for errors

## Future Improvements

1. **Cache Versioning**
   - Implement semantic versioning for cache
   - Auto-invalidate on version mismatch

2. **Redis Integration**
   - Use Redis for server-side response caching
   - Implement cache-aside pattern

3. **Push Invalidation**
   - Server-side events for cache invalidation
   - Real-time cache updates

4. **Compression**
   - Compress large responses before caching
   - Reduce storage usage by 50%+

5. **Analytics Dashboard**
   - Real-time cache metrics
   - Hit rate trends
   - Performance graphs

6. **Adaptive TTLs**
   - Machine learning to predict optimal TTLs
   - Auto-adjust based on data volatility

## References

- [PokeAPI Documentation](https://pokeapi.co/)
- [IndexedDB MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Cache Patterns](https://patterns.dev/posts/cache-aside-pattern/)
- [Upstash Redis Docs](https://upstash.com/docs/redis/overall/getstarted)
