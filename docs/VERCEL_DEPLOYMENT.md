# Vercel deployment guide

Production: **https://pokebattles.vercel.app** (Vercel Git integration; every push builds a deployment, `main` → Production).

Run this before every push that touches dependencies, `next.config.ts`, `vercel.json`, or server-rendered pages:

```bash
npm run verify:deploy            # lockfile checks + the same `npm run build` Vercel runs
npm run verify:deploy -- --no-build   # lockfile checks only (~5s)
```

## Commit author must be the Vercel account owner (most common failure)

The Vercel project lives on the **Hobby** plan of Vercel account **`albmunmu`**, connected to GitHub user **`betexcr`**. Hobby projects do not allow collaborators, so Vercel **blocks any deployment whose Git commit author is not that account** (*"Deployment Blocked: the commit author did not have contributing access to the project"*). The build never even starts.

Vercel resolves the commit author to a GitHub account, so any email GitHub maps to **`betexcr`** works:

| Accepted author email | Notes |
|-----------------------|-------|
| `betomunozcr@gmail.com` | Verified email on `betexcr` |
| `121463215+betexcr@users.noreply.github.com` | `betexcr`'s GitHub noreply address (derived from `gh auth`) |

| Field | Value |
|-------|-------|
| GitHub user | `betexcr` (id `121463215`) |
| Vercel account | `albmunmu` |

Not accepted: work/other identities such as `alberto@atreyus.ai`, or AI-agent identities such as `noreply@anthropic.com`.

### Option A: take the identity from `gh auth` (recommended)

Set it **per repo** (no `--global`, so other repos keep their own identity). Check `gh auth status` shows `betexcr` first.

PowerShell:

```powershell
$u = gh api user | ConvertFrom-Json
git config user.name  $u.login
git config user.email "$($u.id)+$($u.login)@users.noreply.github.com"
git log -1 --format='%an <%ae>'
```

bash:

```bash
git config user.name  "$(gh api user --jq .login)"
git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
git log -1 --format='%an <%ae>'
```

### Option B: set it explicitly

```bash
git config user.name  "Alberto Munoz"
git config user.email "betomunozcr@gmail.com"
```

### AI agents (Claude Code, Cursor, …)

An agent's local `git commit` uses whatever identity its environment configures (often a bot address that Vercel blocks). Agents connected to GitHub as `betexcr` should create commits **through the GitHub API** (e.g. the GitHub MCP `push_files` / `create_or_update_file` tools): GitHub authors those as `betexcr` **and signs them**, so they deploy on Vercel and show as **Verified**. Otherwise, set the repo identity with Option A before committing.

Rules:

- Vercel checks the commit a push points at (the branch head). If commits were pushed under another identity, add a commit authored by `betexcr` on top (simplest: any small commit via the GitHub web UI or API), or re-author the branch with the correct identity configured:
  `git rebase <base> --exec 'git commit --amend --no-edit --reset-author'` then `git push --force-with-lease`. Run `git config user.email` **first**: `--reset-author` uses whatever identity is configured.
- `Co-authored-by:` trailers are fine; only the **author** field matters.
- When merging a PR into `main`, use **Create a merge commit** or **Squash and merge** from GitHub while logged in as `betexcr` (the resulting commit is authored by you). **Rebase and merge** keeps the original authors and gets blocked if any are not you.
- `npm run verify:deploy` fails when `git config user.email` is not one of the accepted emails and warns when the head commit's author is not.
- Alternatives if more people/agents need to deploy: upgrade the Vercel project to Pro and invite them, or deploy via the Vercel CLI with a token (`vercel --prod`), which is not subject to the Git author check.

## How Vercel builds this project

| Setting | Value | Source of truth |
|---------|-------|-----------------|
| Framework | Next.js 15 (App Router) | `vercel.json` → `framework` |
| Node | 22.x | `package.json` → `engines.node` (also `.nvmrc`) |
| Package manager | **npm only** | `package-lock.json` (no other lockfiles) |
| Install | `npm ci` | `vercel.json` → `installCommand` |
| Build | `npm run build` (`next build`) | `vercel.json` → `buildCommand` |

Keep `vercel.json` to these keys. Legacy options such as `"public": true` are rejected by Vercel's schema (*should NOT have additional property `public`*) and fail the deployment before it builds.

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
| `vercel.json` contained the legacy `"public": true` option | *vercel.json schema validation failed: should NOT have additional property `public`* | Removed `public` |
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
| `The vercel.json schema validation failed … should NOT have additional property …` | Remove that key from `vercel.json` (it is not a valid/current Vercel option) |
| `npm ci can only install packages when your package.json and package-lock.json … are in sync` | Run `npm install`, commit `package-lock.json` |
| `Error occurred prerendering page "/x"` / `fetch failed` / `ENOTFOUND` | Page fetches at build time; add fallback or render on demand (rule 3) |
| `Static page generation for /x is still timing out` | Too many / too slow prerenders; shrink `generateStaticParams` |
| `Failed to compile` / ESLint errors | `npm run lint`; `next build` lints `src/` |
| `Module not found` | Missing dependency or case-sensitive import path (Vercel is Linux) |
| Build OK but runtime 500s | Missing runtime env vars, see [PRODUCTION_OPS.md](./PRODUCTION_OPS.md) |

4. After fixing, run `npm run verify:deploy` and push. Confirm the deployment is **Ready** and its commit SHA matches `git log -1 --oneline`, then run the smoke checks in [PRODUCTION_OPS.md](./PRODUCTION_OPS.md).

## Environment variables

Build needs none. Runtime list and meanings: [PRODUCTION_OPS.md](./PRODUCTION_OPS.md#required-environment-vercel-production) and [`.env.example`](../.env.example). `NEXT_PUBLIC_SITE_URL` must be `https://pokebattles.vercel.app` (or unset); a different host there causes canonical/OG mismatches and anti-phishing warnings.
