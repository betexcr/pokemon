# Firebase & Multiplayer Reference

## Lobby files

| File | Role |
|------|------|
| `src/lib/roomService.ts` | Create/join/start rooms |
| `src/app/lobby/page.tsx` | Lobby list |
| `src/app/lobby/[roomId]/page.tsx` | Room detail |
| `src/app/lobby/room/page.tsx` | Room redirect helper |
| `src/hooks/useLobby.ts` | Lobby state hook (if present) |

## RTDB service API (typical)

See `src/lib/firebase-rtdb-service.ts` for:
- Battle creation from room + teams
- Subscribing to meta/public/private
- Writing player choices
- Reading resolution

## Auth

| File | Role |
|------|------|
| `src/contexts/AuthContext.tsx` | Auth provider + `useAuth()` |
| `src/components/auth/` | Login UI components |

## Env vars (client)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL    # RTDB — required for battles
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID  # optional
```

## Playwright multiplayer specs

| Spec | Scope |
|------|-------|
| `complete-multiplayer-flow.spec.ts` | Full lobby → battle flow |
| `multiplayer-battle.spec.ts` | Battle sync |
| `multiplayer-e2e.spec.ts` | Extended E2E |
| `battle-lobby.spec.ts` | Lobby UI |

## Documentation

- [docs/QUICK_START_MULTIPLAYER.md](../../docs/QUICK_START_MULTIPLAYER.md)
- [docs/MULTIPLAYER_IMPLEMENTATION_PLAN.md](../../docs/MULTIPLAYER_IMPLEMENTATION_PLAN.md)
- [MULTIPLAYER_TEST_GUIDE.md](../../docs/MULTIPLAYER_TEST_GUIDE.md)
