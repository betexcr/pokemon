---
name: battle-system
description: >-
  Guides battle engine work, offline AI battles, and multiplayer RTDB battle UI.
  Use when editing turn resolution, damage, move legality, battle components,
  useBattleState, useOfflineBattleState, or team-battle-engine files.
---

# Battle System

## Two battle modes

| Mode | Entry | Hook | Component |
|------|-------|------|-----------|
| **Offline AI** | `/battle/runtime/?opponentKind=champion&opponentId=...` | `useOfflineBattleState` | `OfflineBattleComponent` |
| **Multiplayer RTDB** | `/battle/runtime/?battleId=...` | `useBattleState` | `RTDBBattleComponent` |

Both share the same engine in `src/lib/team-battle-engine.ts` and `team-battle-engine-additional.ts`.

## Hard rules

1. **Never resolve multiplayer turns on the client.** Resolution runs server-side only:
   - `src/lib/battle-resolution.ts`
   - `src/app/api/battles/[id]/submit/route.ts`
   - `functions/src/index.ts` (Firebase Functions mirror)

2. **Use deterministic RNG** for multiplayer: `createBattleRng()` in `src/lib/battle-rng.ts` — seed lives in RTDB meta.

3. **UI parity:** Battle log rendering uses `battleLogToDisplayLines()` from `src/lib/battle-log-display.ts`. When changing `GameTextBox` or log display, update **both** `RTDBBattleComponent.tsx` and `OfflineBattleComponent.tsx`.

4. **Offline battles** need a player team from localStorage (`pokemon-current-team` or `pokemon-team-builder`). Champion teams come from `src/lib/gym_champions.ts`.

## Key files

| File | Role |
|------|------|
| `src/lib/team-battle-engine.ts` | State machine, action queue, damage hooks |
| `src/lib/team-battle-engine-additional.ts` | Turn execution, entry hazards, replacements |
| `src/lib/damage-calculator.ts` | Type effectiveness, damage formula |
| `src/lib/battle-resolution.ts` | Server turn resolution + RTDB writes |
| `src/lib/offline-battle-ai.ts` | AI move/switch selection |
| `src/lib/battle-log-display.ts` | Log → UI display lines |
| `src/hooks/useOfflineBattleState.ts` | Local battle init + turn loop |
| `src/hooks/useBattleState.ts` | RTDB listeners (meta, public, private, choices) |
| `src/app/battle/runtime/page.tsx` | Dispatches offline vs RTDB component |

## RTDB battle schema (multiplayer)

```
battles/{id}/meta          — phase, turn, players, winner, RNG seed
battles/{id}/public        — field, active mons, bench (public)
battles/{id}/private/{uid} — full team, PP, items
battles/{id}/turns/{n}/choices/{uid}  — move | switch | forfeit
battles/{id}/turns/{n}/resolution     — turn result (written by server)
```

## Offline init flow

1. Load player team from config or localStorage
2. `hydrateSlot()` fetches Pokémon stats/moves via `getPokemon()` when needed
3. Champion slots hydrated from `gym_champions.ts`; moves backfilled from API if only tackle
4. Local `BattleState` runs engine + `chooseAIAction()` each turn

## Testing after changes

| Change | Command |
|--------|---------|
| Engine / damage / mechanics | `npm run test:unit` + `npm run test:integration` |
| RTDBBattleComponent | `npm run test:component` |
| Offline UI | `npx playwright test tests/playwright/offline-battle.spec.ts` |
| Full MP flow | `npm run test:e2e:multiplayer` |

## Common pitfalls

- Editing `battleService.ts` (Firestore) when the live path is RTDB
- Adding client-side turn execution in `RTDBBattleComponent` or `useBattleState`
- Forgetting to hydrate moves/stats before engine runs (see `hydrateSlot` in `useOfflineBattleState.ts` and `battle-resolution.ts`)
- Mismatched battle log types: display lines are `{ message, isEngineWarning }`, not raw strings

## Additional resources

- [reference.md](reference.md) — mechanics docs and file index
- [docs/battle_mechanics.md](../../docs/battle_mechanics.md)
- [docs/MULTIPLAYER_ARCHITECTURE.md](../../docs/MULTIPLAYER_ARCHITECTURE.md)
