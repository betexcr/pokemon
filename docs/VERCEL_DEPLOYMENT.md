# Vercel deployment guide

Production: **https://pokebattles.vercel.app** (Vercel Git integration; every push builds a deployment, `main` → Production).

Run this before every push that touches dependencies, `next.config.ts`, `vercel.json`, or server-rendered pages:

```bash
npm run verify:deploy            # lockfile checks + the same `npm run build` Vercel runs
npm run verify:deploy -- --no-build   # lockfile checks only (~5s)
```

## Commit author must be the Vercel account owner (most common failure)

The Vercel project lives on the **Hobby** plan of Vercel account **`albmunmu`**, connected to GitHub user **`betexcr`**. Hobby projects do not allow collaborators, so Vercel **blocks any deployment whose Git commit author is not that account** (*"Deployment Blocked: the commit author did not have contributing access to the project"*). The build never even starts.

Deployments that work are authored by:

| Field | Value |
|-------|-------|
| Commit author | `Alberto Munoz <betomunozcr@gmail.com>` |
| GitHub user | `betexcr` |
| Vercel account | `albmunmu` |

Before committing from any new machine, container, CI job, or AI agent (Cursor, Claude Code, Copilot, etc.):

```bash
git config user.name  "Alberto Munoz"
git config user.email "betomunozcr@gmail.com"
git log -1 --format='%an <%ae>'   # verify before pushing
```

Rules:

- Vercel checks the commit a push points at (the branch head). If an agent pushed commits under another identity, add a commit authored by `betomunozcr@gmail.com` on top (or re-author the branch) and push again.
- `Co-authored-by:` trailers are fine; only the **author** field matters.
- When merging a PR into `main`, use **Create a merge commit** or **Squash and merge** from GitHub while logged in as `betexcr` (the resulting commit is authored by you). **Rebase and merge** keeps the original authors and gets blocked if any are not you.
- `npm run verify:deploy` warns when the configured `git config user.email` differs from `betomunozcr@gmail.com`.
- Alternatives if more people/agents need to deploy: upgrade the Vercel project to Pro and invite them, or deploy via the Vercel CLI with a token (`vercel --prod`), which is not subject to the Git author check.

## How Vercel builds this project

| Setting | Value | Source of truth |
|---------|-------|-----------------|
| Framework | Next.js 15 (App Router) | `vercel.json` → `framework` |
| Node | 22.x | `package.json` → `engines.node` (also `.nvmrc`) |
| Package manager | **npm only** | `package-lock.json` (no other lockfiles) |
| Install | `npm ci` | `vercel.json` → `installCommand` |
| Build | `npm run build` (`next build`) | `vercel.json` → `buildCommand` |

Do not override these in the Vercel dashboard (Project → Settings → Build & Deployment): leave the overrides off so `vercel.json` / `package.json` win and the repo stays the single source of truth.

## Rules that keep deployments green

1. **Keep `package-lock.json` in sync with `package.json`.** Change dependencies only with `npm install <pkg>` / `npm uninstall <pkg>` and commit both files together. `npm ci` (Vercel and CI) refuses to install from a stale lockfile. Never hand-edit versions in `package.json` without re-running `npm install`.
2. **One package manager.** Do not commit `bun.lock`, `bun.lockb`, `yarn.lock`, or `pnpm-lock.yaml`. Vercel chooses the installer from the lockfile it detects; a stray lockfile silently switches installers and resolves different versions.
3. **No required network calls at build time.** `next build` prerenders static routes. Anything a page fetches during prerender (PokeAPI, Smogon, Firebase) must either:
   - be wrapped in `try/catch` with a fallback render (see `src/app/evolutions/page.tsx`), or
   - be rendered on demand: return `[]` (or a tiny list) from `generateStaticParams` and set `export const revalidate = …` (see `src/app/pokemon/[id]/page.tsx`).

   Prerendering 1,000+ PokeAPI pages made builds slow and failed them whenever PokeAPI timed out or rate-limited. A good test: `npm run build` must pass **with no internet access**.
4. **No build-time env requirements.** The build must pass with zero env vars set (Firebase, Upstash, Sentry all no-op when unset). Read secrets at request time, not at module top level in code that runs during prerender.
5. **Node 22.** Match `engines.node` locally (`nvm use`).

## Why deployments were failing (Nov 2026)

| Cause | Symptom | Fix |
|-------|---------|-----|
| Commits pushed by an AI agent were authored as `Claude <noreply@anthropic.com>`, not the Vercel account owner | Deployment **Blocked** before build (Hobby plan: author lacks access) | Commit as `Alberto Munoz <betomunozcr@gmail.com>` (see section above) |
| `package-lock.json` drifted from `package.json` after `@sentry/nextjs`, `@vercel/analytics`, `@vercel/speed-insights` and `next@15.5.9` were added (commit `54c603ae`) | `npm ci` fails: *"package.json and package-lock.json … are not in sync"*. GitHub CI died ~18s into every run | Regenerated lockfile; Vercel install pinned to `npm ci`; `verify:deploy` checks sync |
| Stale `bun.lock` (March 2026) next to `package-lock.json` | Vercel could pick Bun and resolve a different dependency tree than npm | Removed `bun.lock` / `bunfig.toml` |
| `/pokemon/[id]` prerendered every Pokémon (~1,050 pages) from PokeAPI at build | Very long builds; any PokeAPI timeout/429 failed the build or baked a 404 into it | On-demand ISR (`generateStaticParams` → `[]`, `revalidate = 3600`) |
| `/evolutions` threw when PokeAPI was unreachable during prerender | `Export encountered an error on /evolutions/page` | `try/catch` with empty-graph fallback; ISR retries |

## Debugging a failed deployment

1. Vercel → Project → **Deployments** → failed deployment → **Build Logs**. Find the first `Error`.
2. Reproduce locally on Node 22 with a clean install:
   ```bash
   rm -rf node_modules .next
   npm ci
   npm run build
   ```
3. Match the error:

| Log line | Meaning / fix |
|----------|---------------|
| Deployment shows **Blocked** / *commit author did not have contributing access* (no build log) | Wrong commit author; see *Commit author must be the Vercel account owner* |
| `npm ci can only install packages when your package.json and package-lock.json … are in sync` | Run `npm install`, commit `package-lock.json` |
| `Error occurred prerendering page "/x"` / `fetch failed` / `ENOTFOUND` | Page fetches at build time; add fallback or render on demand (rule 3) |
| `Static page generation for /x is still timing out` | Too many / too slow prerenders; shrink `generateStaticParams` |
| `Failed to compile` / ESLint errors | `npm run lint`; `next build` lints `src/` |
| `Module not found` | Missing dependency or case-sensitive import path (Vercel is Linux) |
| Build OK but runtime 500s | Missing runtime env vars, see [PRODUCTION_OPS.md](./PRODUCTION_OPS.md) |

4. After fixing, run `npm run verify:deploy` and push. Confirm the deployment is **Ready** and its commit SHA matches `git log -1 --oneline`, then run the smoke checks in [PRODUCTION_OPS.md](./PRODUCTION_OPS.md).

## Environment variables

Build needs none. Runtime list and meanings: [PRODUCTION_OPS.md](./PRODUCTION_OPS.md#required-environment-vercel-production) and [`.env.example`](../.env.example). `NEXT_PUBLIC_SITE_URL` must be `https://pokebattles.vercel.app` (or unset); a different host there causes canonical/OG mismatches and anti-phishing warnings.
