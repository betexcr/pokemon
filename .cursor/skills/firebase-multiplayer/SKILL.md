---
name: firebase-multiplayer
description: >-
  Guides Firebase Auth, Firestore, and Realtime Database usage for lobbies,
  teams, championships, and live battles. Use when editing roomService, RTDB
  paths, security rules, firebase client init, or multiplayer sync bugs.
---

# Firebase & Multiplayer

## Storage split

| Store | Use for | Do NOT use for |
|-------|---------|----------------|
| **Firestore** | Rooms, saved teams, championships, checklist | Live battle turn sync |
| **RTDB** | Live battle state, choices, resolutions | Persistent user data |
| **Auth** | User identity | — |

## Client entry points

| File | Pattern | When to use |
|------|---------|-------------|
| `src/lib/firebase.ts` | Eager init: Auth, Firestore, RTDB, Functions | Battles, auth-heavy pages |
| `src/lib/firebase/client.ts` | Lazy `getDb()` | Lobby, checklist — avoids eager connections |

Both read trimmed `NEXT_PUBLIC_FIREBASE_*` env vars. Graceful fallback when config incomplete.

## Firestore collections

| Collection | Service | Purpose |
|------------|---------|---------|
| `battle_rooms` | `roomService.ts` | Lobby state, ready flags, `battleId` ref |
| `userTeams` | `userTeams.ts` | Saved teams per user |
| `championships` | `championshipService.ts` | Tournament brackets |
| `users/{uid}/dex/default` | `checklist/storage.firebase.ts` | Pokédex checklist sync |
| `battles` | `battleService.ts` | **Legacy** — RTDB is live battle path |

## RTDB schema

```
battles/{battleId}/
  meta/                    phase, turn, players, winnerUid, rngSeed
  public/                  field, p1/p2 active + bench (public info)
  private/{uid}/           full team, PP, items
  turns/{turnNumber}/
    choices/{uid}/         { type: 'move'|'switch'|'forfeit', ... }
    resolution/            written by server after both choices
```

Primary service: `src/lib/firebase-rtdb-service.ts`

## Multiplayer flow

1. `roomService` creates/joins Firestore `battle_rooms`
2. Both players ready → host starts → RTDB battle created, `battleId` set on room
3. Navigate to `/battle/runtime/?battleId=...`
4. `useBattleState` listens to RTDB; writes choices to `turns/{n}/choices/{uid}`
5. `POST /api/battles/{id}/submit` triggers `battle-resolution.resolveTurn` when both ready
6. `handleBattleEnd` updates Firestore room on victory/forfeit

## Server-side Firebase

| File | Role |
|------|------|
| `src/lib/rtdb-access.ts` | Admin SDK or REST fallback for API routes |
| `src/app/api/battles/[id]/submit/route.ts` | Vercel serverless turn handler |
| `functions/src/index.ts` | Firebase Functions mirror |
| `src/lib/multiplayer/handleBattleEnd.ts` | End-of-battle Firestore updates |

Server-only env: `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string).

## Security rules

| File | Scope |
|------|-------|
| `src/lib/firebase-rtdb-rules.json` | **Source of truth** for RTDB (deployed via `firebase.json`) |
| `database.rules.json` | Kept in sync as a deploy fallback / mirror |
| `firestore.rules` | Firestore rules (field-level lobby + championships) |
| `firestore.indexes.json` | Composite indexes |

Deploy RTDB + Firestore rules (separate from Vercel):

```bash
firebase deploy --only database,firestore:rules
```

Battle creation must go through `POST /api/battles/create` (Admin SDK). Clients must not write `meta` / `public` / `private`.

## Hard rules

1. Never log Firebase tokens, service account keys, or user PII.
2. Use lazy `getDb()` for lobby/checklist unless RTDB is immediately needed.
3. Do not write turn resolutions from the client — server only.
4. Production requires `FIREBASE_SERVICE_ACCOUNT_KEY` — resolution and battle create fail closed without Admin.
5. Test auth flows with Playwright test credentials only in test specs, never in production code.

## Testing

| Change | Command |
|--------|---------|
| RTDB service | `npm run test:unit` |
| Security rules | `npm run test:security` |
| Integration | `npm run test:integration` |
| Full MP E2E | `npm run test:e2e:multiplayer` |

## Additional resources

- [reference.md](reference.md) — path tables and lobby files
- [docs/MULTIPLAYER_ARCHITECTURE.md](../../docs/MULTIPLAYER_ARCHITECTURE.md)
- [docs/MULTIPLAYER_STATUS.md](../../docs/MULTIPLAYER_STATUS.md)
