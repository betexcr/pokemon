# Environment variables (legacy Netlify notes)

> **Canonical host is Vercel** (`https://pokemon-indol-tau.vercel.app`). Prefer the checklist in [PRODUCTION_OPS.md](./PRODUCTION_OPS.md) and `.env.example`. Netlify is not the production target.

Copy placeholders into your host’s env UI — **never commit real secrets**.

## Firebase (client)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
```

## Firebase Admin (multiplayer server)

```
FIREBASE_SERVICE_ACCOUNT_KEY=
```

## Redis (PokeAPI proxy + rate limits)

```
UPSTASH_REDIS_REST_URL=https://YOUR_INSTANCE.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_REST_TOKEN
```

## Site

```
NEXT_PUBLIC_SITE_URL=https://pokemon-indol-tau.vercel.app
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_POKEAPI_BASE_URL=/api/pokeapi
```
