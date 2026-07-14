# Production operations

Canonical production URL: **https://pokemon-indol-tau.vercel.app**  
Retired domain (do not use): `pokemon.ultharcr.com`

Platform of record: **Vercel** (Git integration). Legacy GitHub Pages / Firebase Hosting static-export workflows are disabled.

## Required environment (Vercel Production)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Auth, RTDB, client Firebase |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Admin SDK for battle create/submit |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limits + PokeAPI proxy cache (**required in production**) |
| `NEXT_PUBLIC_POKEAPI_BASE_URL=/api/pokeapi` | Route PokeAPI through BFF |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata |

Optional:

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (no-op when unset) |
| `NEXT_PUBLIC_CDN_URL` | `assetPrefix` for static assets |
| `NEXT_PUBLIC_ANALYTICS_URL` | Custom analytics beacon |

See [`.env.example`](../.env.example).

## Health checks

- Liveness: `GET /api/health` → `{ ok: true }`
- Readiness: `GET /api/ready` → `{ ready, components }`  
  In `VERCEL_ENV=production`, missing/failing Redis or Firebase Admin → **503**.

## Promote & rollback

1. Open Vercel → Project → **Deployments**
2. Confirm Preview deployment looks good (smoke below)
3. **Promote** to Production, or merge to `main` if production tracks `main`
4. **Instant rollback:** Deployments → previous successful Production → **Promote to Production**

Compare local `git log -1 --oneline` with the deployment commit SHA after promote.

## Post-deploy smoke

1. `/` loads  
2. `/api/health` → 200  
3. `/api/ready` → 200 with `components.redis` / `firebaseAdmin` = `ok`  
4. Sign in  
5. Lobby / create room smoke (if Firebase configured)  
6. Spot-check Pokédex search (proxy path). Cached Dex reads do **not** count toward the Upstash upstream rate limit; only cache-misses do (600/min/IP).

## After credential scrub (docs)

If Upstash tokens were ever committed to the repo:

1. Rotate the Upstash REST token in the Upstash console  
2. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel Production + Preview  
3. Confirm `/api/ready` reports Redis `ok`

## CI

GitHub Actions [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs lint (`max-warnings=0`), `test:unit`, `test:security`, and `build` on PRs to `main`. Prefer requiring this check before merge.

## Follow-ups (not automated here)

- Slim RTDB public `battleLog` growth  
- Enable `typescript.ignoreBuildErrors: false` once `tsc` is clean  
- Dependabot / CODEOWNERS / Vercel “deploy only if CI green”
