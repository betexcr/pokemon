---
name: vercel-deploy
description: >-
  Guides Vercel deployment, environment variables, and production verification
  for this Next.js app. Use when deploying, configuring env vars, debugging
  preview/production issues, or setting canonical site URLs.
---

# Vercel Deploy

## Platform

- **Host:** Vercel — build via `npm run build` ([`vercel.json`](../../vercel.json))
- **Canonical prod URL:** `https://pokemon-indol-tau.vercel.app`
- **Retired:** `pokemon.ultharcr.com` — do not use in metadata, sitemap, or env defaults

Also deployed to GitHub Pages via `.github/workflows/deploy.yml` (secondary/legacy static path).

## Build notes

- `trailingSlash: true` in `next.config.ts`
- `typescript.ignoreBuildErrors: true` — build proceeds despite TS errors; fix locally anyway
- `serverExternalPackages: ['firebase-admin']`
- Dev server: `npm run dev` → port **3002**

## Required env vars

### Client (Firebase features)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

### Site / routing

```
NEXT_PUBLIC_SITE_URL=https://pokemon-indol-tau.vercel.app
NEXT_PUBLIC_BASE_URL=              # server-side absolute URL resolution
NEXT_PUBLIC_POKEAPI_BASE_URL=/api/pokeapi   # optional BFF proxy
NEXT_PUBLIC_CDN_URL=               # assetPrefix in next.config.ts
NEXT_PUBLIC_E2E=true               # RTDBBattleComponent E2E mode only
```

### Server-only (Vercel)

```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
FIREBASE_SERVICE_ACCOUNT_KEY       # JSON string for RTDB admin ops
```

Template: [`.env.example`](../../.env.example). CI uses GitHub Actions `vars.*` / `secrets.*`.

## Verify production

1. Open production URL or feature path (e.g. `/battle`, `/championship`)
2. Vercel → Deployments → confirm **Ready** deployment matches expected Git commit
3. Compare: `git log -1 --oneline` locally vs deployed commit SHA

## Deploy commands

```bash
npm run build          # local build check
npm run build:prod     # NODE_ENV=production build
```

Use Vercel CLI or GitHub integration for preview/production deploys. Never commit secrets.

## Common production issues

| Symptom | Check |
|---------|-------|
| Battles stuck on "Loading" | `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, RTDB rules |
| PokeAPI slow / rate limited | Enable proxy + Upstash vars |
| Wrong OG/sitemap URLs | `NEXT_PUBLIC_SITE_URL` |
| Turn submit 403/500 | `FIREBASE_SERVICE_ACCOUNT_KEY` on server |

## Related docs

- [docs/ARCHITECTURE_AND_HOSTING.md](../../docs/ARCHITECTURE_AND_HOSTING.md)
- [NETLIFY_ENV_VARS.md](../../docs/NETLIFY_ENV_VARS.md) (Netlify alt — secondary)
