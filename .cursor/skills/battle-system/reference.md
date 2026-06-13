# Battle System Reference

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/battle_mechanics.md](../../docs/battle_mechanics.md) | Full Gen9 mechanics reference |
| [docs/battle_mechanics_intro.md](../../docs/battle_mechanics_intro.md) | Intro / overview |
| [docs/battle_mechanics_coverage.md](../../docs/battle_mechanics_coverage.md) | Implemented vs planned mechanics |
| [docs/MULTIPLAYER_ARCHITECTURE.md](../../docs/MULTIPLAYER_ARCHITECTURE.md) | Lobby → RTDB → resolution flow |
| [docs/QUICK_START_MULTIPLAYER.md](../../docs/QUICK_START_MULTIPLAYER.md) | Local multiplayer testing |

## Engine module map

| Module | Purpose |
|--------|---------|
| `team-battle-types.ts` | `BattleState`, `BattlePokemon`, field/hazard types |
| `team-battle-engine.ts` | Core turn queue, legality, team defeat checks |
| `team-battle-engine-additional.ts` | `runBattleTurnFromQueue`, entry sequence |
| `team-battle-status.ts` | Status conditions (burn, paralysis, etc.) |
| `team-battle-items.ts` | Held item effects |
| `team-battle-abilities.ts` | Ability triggers |
| `damage-calculator.ts` | Damage + type chart |
| `battle-rng.ts` | Seeded RNG for sync |
| `battle-engine-rtdb.ts` | RTDB state conversion helpers |

## UI components

| Component | Path |
|-----------|------|
| Offline battle | `src/components/OfflineBattleComponent.tsx` |
| RTDB battle | `src/components/RTDBBattleComponent.tsx` |
| Battle sprites | `src/components/battle/BattleSprite.tsx` |
| End screen | `src/components/multiplayer/BattleEndScreen.tsx` |
| Turn manager | `src/components/multiplayer/BattleTurnManager.tsx` |
| Trainer roster | `src/components/battle/TrainerRoster.tsx` |

## Test files

| Test | Path |
|------|------|
| Battle flow integration | `src/lib/__tests__/battle-flow-integration.test.ts` |
| RTDB component | `src/components/__tests__/RTDBBattleComponent.test.tsx` |
| Battle log display | `src/lib/__tests__/battle-log-display.test.ts` |
| Offline E2E | `tests/playwright/offline-battle.spec.ts` |
| Gen9 mechanics E2E | `tests/playwright/gen9-battle-mechanics.spec.ts` |

## Types

Shared battle types: `src/types/battle.ts`
