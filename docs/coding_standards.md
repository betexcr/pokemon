# Coding Standards

## Principles

- Favor clarity and maintainability over cleverness.
- Small, composable modules; single responsibility per component/file.
- Progressive enhancement: work without JS-heavy effects where possible.
- Tailwind-only styling. No CSS overrides or custom stylesheets.

## TypeScript

- Enable strict typing; avoid `any`. Use precise types and generics.
- Exported APIs/interfaces must be explicitly typed.
- Prefer `type` aliases for object shapes; use `interface` when extension is required.
- Narrow types early with guards and helper predicates.
- Never swallow errors; type error paths explicitly.

## Naming

- Files: `PascalCase.tsx` for React components, `kebab-case.ts` for utilities.
- Components: `PascalCase` names; props types `ComponentNameProps`.
- Variables/functions: `camelCase`, descriptive and intention-revealing.
- Booleans start with `is/has/should/can`.
- Event handlers start with `handle` (e.g., `handleSubmit`).
- Hooks start with `use*` and live in `src/hooks/`.

## Formatting

- Use Prettier defaults; no custom line-length exceptions.
- Two-space indentation; no tabs.
- One import per module path; sort: React/Next, third-party, internal `@/`.
- Avoid long inline expressions; extract helpers.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components; no page-specific logic.
- `src/contexts`: Context providers and hooks.
- `src/lib`: Framework-agnostic helpers (API, utils, config).
- `src/data`: Static data and JSON.
- `src/types`: Shared TypeScript types.
- Keep files focused; prefer <300 lines per file.

## React & Next.js

- Prefer Server Components by default; mark interactive components with `'use client'`.
- Co-locate client-only logic carefully; avoid unnecessary client boundaries.
- Use `next/link` and `next/navigation` for routing. Prefer `router.push` for imperative nav.
- Use `next/image` for images; specify width/height, set `priority` for critical assets.
- Avoid prop drilling; use contexts from `src/contexts` for cross-cutting concerns.

## State & Data

- Local UI state: `useState`/`useReducer`. Derived state should be computed, not stored.
- Shared state: React Contexts (e.g., `AuthProvider`, `ErrorProvider`, `ToastProvider`).
- Data fetching and transforms live in `src/lib` (e.g., `api.ts`). Keep components presentational.
- Memoize expensive computations (`useMemo`, `useCallback`) only when profiling justifies.

## Tailwind CSS

- Use semantic tokens from Tailwind config: `bg`, `surface`, `border`, `text`, `muted`, `input.*`, `poke.*`, `type.*`.
- Do not hardcode colors; never use inline styles for presentational color/spacing.
- Prefer utility compositions over custom classes. Extract to components when repeated.
- Respect theme classes on `<html>`: `dark`, `theme-gold`, `theme-red`, `theme-ruby`.

## Accessibility (A11y)

- Keyboard support for all interactive elements (TAB/ESC/ENTER/SPACE).
- Visible focus states: `focus:outline-none focus:ring-2 focus:ring-blue-500/30`.
- Color contrast >= WCAG AA for current theme.
- Provide `aria-*`/`role` when native semantics are insufficient.
- `alt` text on images; `alt=""` for decorative.

## Error Handling

- Use `ErrorProvider` and `GlobalErrorCatcher` for global errors.
- Surface actionable user feedback with `ToastProvider`.
- For async ops, catch and rethrow domain-specific errors with context.
- Avoid silent failures; log with context and user-safe messaging.
- Never leak sensitive data (tokens, PII) in thrown errors or logs.

## Logging

- Use centralized logging utilities in `src/logging` when available.
- Include context: feature, action, identifiers (non-PII), timing.
- Use levels: `debug`, `info`, `warn`, `error`. Default to `info`.
- Strip verbose `console.*` in production builds where possible.

## API & Networking

- Keep HTTP logic in `src/lib/api.ts`. Components call typed functions, not `fetch` directly.
- Validate inputs/outputs at boundaries; narrow unknown/JSON types.
- Handle error states explicitly: network error, 4xx, 5xx, empty, and partial data.
- Use abort controllers for in-flight requests on unmount when applicable.

## Performance

- Avoid layout thrash: batch state updates; prefer CSS transforms for animation.
- Use `RoutePreloader` selectively; don’t preload everything.
- Defer non-critical JS; avoid heavy code in client components.
- Images: correct sizes, `loading="lazy"` where not critical, `priority` when above the fold.

## Security

- Never commit secrets. Use environment variables and server-side only where required.
- Escape and validate any user-provided input before use.
- Follow Content Security Policy best practices; avoid `dangerouslySetInnerHTML` unless essential and sanitized.
- Treat third-party data as untrusted; sanitize/validate.

## Testing

- Unit test pure utilities in `src/lib` and critical hooks in `src/hooks`.
- Prefer integration tests for components with user interactions.
- Mock network boundaries; do not hit live services in tests.
- Keep tests deterministic and fast; avoid reliance on timeouts.

## Git Workflow

- Branch names: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`.
- Commits: imperative mood, present tense: `feat: add team builder tooltip`.
- Small, focused commits with passing lint/tests.
- PRs: clear description, screenshots for UI changes, note a11y/perf impacts.

## Code Review Checklist

- Readability: names, structure, comments where necessary.
- Correctness: types, null/undefined handling, edge cases.
- A11y: keyboard, focus, semantics, contrast.
- Performance: memoization, image usage, client/server boundaries.
- Consistency: Tailwind tokens, spacing, radii, shadows, themes.
- Tests: added/updated where appropriate.
