---
name: pokeapi-caching
description: >-
  Guides PokeAPI data fetching, BFF proxy, Redis caching, request cancellation,
  and move hydration. Use when editing api.ts, moveCache, requestManager,
  /api/pokeapi routes, or Pokémon load performance issues.
---

# PokeAPI & Caching

## Data flow

```
Component → src/lib/api.ts → PokeAPI (direct)
                          ↘ /api/pokeapi/* → Upstash Redis → PokeAPI (production proxy)
```

Set `NEXT_PUBLIC_POKEAPI_BASE_URL=/api/pokeapi` to route through the Next.js BFF proxy with shared Redis cache.

## Key files

| File | Role |
|------|------|
| `src/lib/api.ts` | Main client fetch layer; typed Pokémon/move helpers |
| `src/lib/pokeapi.ts` | Lower-level PokeAPI utilities |
| `src/lib/moveCache.ts` | Move data cache + `getMove()` |
| `src/lib/requestManager.ts` | Request pooling, cancellation, priority queue |
| `src/lib/requestAnalytics.ts` | Request metrics |
| `src/app/api/pokeapi/[[...path]]/route.ts` | BFF proxy route |
| `src/lib/server/upstashRedis.ts` | Server-side Redis cache |
| `src/lib/adapters/pokeapiMoveAdapter.ts` | Move data normalization |

## Cache TTLs (typical)

| Data | TTL |
|------|-----|
| Individual Pokémon | ~24 hours |
| Search results | ~5 minutes |
| Type / generation lists | ~6 hours |
| Evolution chains | ~12 hours |

See [docs/CACHING_ARCHITECTURE.md](../../docs/CACHING_ARCHITECTURE.md) for full strategy.

## Request cancellation

- `requestManager.createRequest(context, priority)` returns `{ signal, id }`
- `useRequestCancellation` hook cancels on route change
- Contexts: `pokedex-main`, battle hydration, etc.
- Never bypass cancellation for in-flight fetches on unmount

## Rules

1. **Components call `api.ts`**, not raw `fetch` to PokeAPI.
2. **Report errors** via `errorReporting.ts` helpers (`reportApiError`, `reportNetworkError`).
3. **404 on Pokémon** is expected for invalid IDs — do not surface as critical errors (global catcher skips 404).
4. **Server-only secrets**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — never in client code.

## Env vars

```bash
# Client — enable proxy
NEXT_PUBLIC_POKEAPI_BASE_URL=/api/pokeapi
NEXT_PUBLIC_BASE_URL=https://your-domain.com   # server resolves relative proxy URL

# Server — Redis cache (production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Battle hydration

Offline and server battle init call `getPokemon(id)` and `getMove(id)` to hydrate stats/moves when team slots lack full data. Keep these calls compatible with proxy + cache.

## Testing

- Unit tests mock network boundaries — do not hit live PokeAPI in CI
- Cache verification: [docs/CACHE_VERIFICATION_GUIDE.md](../../docs/CACHE_VERIFICATION_GUIDE.md)

## Additional resources

- [docs/CACHING_ARCHITECTURE.md](../../docs/CACHING_ARCHITECTURE.md)
- [docs/REQUEST_MANAGEMENT_GUIDE.md](../../docs/REQUEST_MANAGEMENT_GUIDE.md)
- [docs/CACHE_SUMMARY.md](../../docs/CACHE_SUMMARY.md)
