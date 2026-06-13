# Testing Workflows

Runnable commands for common test scenarios. Dev server uses **port 3002**.

## Offline battle E2E

Requires a saved team in localStorage (build via Team Builder first in headed mode, or seed in test setup).

```bash
npx playwright test tests/playwright/offline-battle.spec.ts
```

Headed (debug UI):

```bash
npx playwright test tests/playwright/offline-battle.spec.ts --headed
```

## Multiplayer battle E2E

Full lobby → battle flow:

```bash
npm run test:e2e:multiplayer
```

Single spec (headed):

```bash
npx playwright test tests/playwright/multiplayer-battle.spec.ts --headed
```

See also [`.cursor/workflows/test-multiplayer-battle.md`](../workflows/test-multiplayer-battle.md).

## Battle mechanics validation

```bash
npx playwright test tests/playwright/gen9-battle-mechanics.spec.ts
npx playwright test tests/playwright/gen9-validation.spec.ts
```

## Unit / integration (no browser)

```bash
npm run test:unit
npm run test:integration
npm run test:component
```

## Full pre-PR check

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run build
```

## Playwright spec index

| Spec | Focus |
|------|-------|
| `offline-battle.spec.ts` | Offline AI vs champion |
| `complete-multiplayer-flow.spec.ts` | Full MP flow |
| `multiplayer-battle.spec.ts` | Battle sync |
| `battle-lobby.spec.ts` | Lobby UI |
| `gen9-battle-mechanics.spec.ts` | Mechanics coverage |
| `battle-e2e-authenticated.spec.ts` | Auth + battle |
| `pokemon-detail-retry.spec.ts` | Detail page resilience |

Full list: `tests/playwright/*.spec.ts`
