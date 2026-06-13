---
name: testing
description: >-
  Guides Vitest unit/integration tests and Playwright E2E tests for this repo.
  Use when writing tests, debugging CI failures, or choosing which test command
  to run after a change.
---

# Testing

## Runners

| Runner | Config | Scope |
|--------|--------|-------|
| **Vitest** | defaults + `src/lib/__tests__/rtdb-test-config.ts` | Unit, integration, component |
| **Playwright** | `playwright.config.ts` | E2E browser tests |
| **ESLint** | `eslint.config.mjs` | Lint (`npm run lint`, `--max-warnings=0`) |

Dev server for E2E: **port 3002** — Playwright auto-starts `npm run dev`.

## Vitest commands

| Command | Scope |
|---------|---------|
| `npm run test` | Watch mode |
| `npm run test:unit` | RTDB service, engine, state conversion, bracket, dex gen |
| `npm run test:component` | RTDBBattleComponent |
| `npm run test:integration` | battle-flow + rtdb-integration |
| `npm run test:performance` | RTDB perf |
| `npm run test:security` | RTDB security rules |
| `npm run test:all` | Full RTDB runner |
| `npm run test:coverage` | Coverage report |
| `npm run test:ci` | CI JSON + HTML output |

Test home: `src/lib/__tests__/`. Component tests: `src/components/__tests__/`.

## Change → test mapping

| Change area | Run |
|-------------|-----|
| Battle engine / damage | `test:unit` + `test:integration` |
| RTDB service / resolution | `test:unit` + `test:security` |
| RTDBBattleComponent | `test:component` |
| Offline battle UI | `offline-battle.spec.ts` |
| Lobby / multiplayer | `test:e2e:multiplayer` |
| Bracket logic | `test:unit` |
| Lint only | `npm run lint` |

## Playwright commands

| Command | Scope |
|---------|-----|
| `npm run test:e2e` | All E2E specs |
| `npm run test:e2e:multiplayer` | `complete-multiplayer-flow` |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:debug` | Debug mode |
| `npm run test:e2e:report` | Show HTML report |

Specs live in `tests/playwright/` (24 files). See [workflows.md](workflows.md) for common runs.

## Conventions

- Mock network at boundaries; no live PokeAPI/Firebase in unit tests
- RTDB tests use `rtdb-test-utils.ts` and `rtdb-test-setup.ts`
- Keep tests deterministic — avoid arbitrary timeouts
- Several Playwright specs embed test-only Firebase keys — never copy to production

## CI

`.github/workflows/ci.yml`: vitest, lint, build with Firebase env vars from GitHub secrets/vars.

## Additional resources

- [workflows.md](workflows.md) — runnable Playwright workflows
- [src/lib/__tests__/README.md](../../src/lib/__tests__/README.md)
- [tests/playwright/README.md](../../tests/playwright/README.md)
- [`.cursor/workflows/`](../workflows/) — turbo-run workflow files
