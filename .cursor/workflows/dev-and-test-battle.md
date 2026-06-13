---
description: Start dev server and run offline battle E2E
---

# Dev and Test Offline Battle

Starts the Next.js dev server and runs the offline battle Playwright spec.

## Prerequisites

- Player team in localStorage (build via `/team-builder` in headed mode first, or let the test seed data if supported)

## Step 1 — Start dev server (if not already running)

Dev runs on port **3002**:

```bash
npm run dev
```

## Step 2 — Run offline battle E2E

In a separate terminal:

// turbo
```bash
npx playwright test tests/playwright/offline-battle.spec.ts
```

Headed (debug UI):

```bash
npx playwright test tests/playwright/offline-battle.spec.ts --headed
```

## Notes

- Offline battles do not require Firebase multiplayer — only a saved team + champion selection
- Playwright config can auto-start dev server; manual start optional
- See [`.cursor/skills/battle-system/SKILL.md`](../skills/battle-system/SKILL.md) for offline vs RTDB split
