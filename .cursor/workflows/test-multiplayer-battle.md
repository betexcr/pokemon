---
description: Run the multiplayer battle Playwright test (headed)
---

# Test Multiplayer Battle

Runs the multiplayer battle E2E test using Playwright in headed mode.

## Prerequisites

- Firebase env vars configured (see `.env.local` or Vercel env)
- Playwright auto-starts dev server on port **3002**

## Related specs

- `tests/playwright/multiplayer-battle.spec.ts` (this workflow)
- `tests/playwright/complete-multiplayer-flow.spec.ts` — full lobby → battle
- `tests/playwright/offline-battle.spec.ts` — offline AI (no Firebase MP required)

See also: [`.cursor/skills/testing/workflows.md`](../skills/testing/workflows.md)

## Run

// turbo
```bash
npx playwright test tests/playwright/multiplayer-battle.spec.ts --headed
```

## Alternative: full multiplayer flow

```bash
npm run test:e2e:multiplayer
```
