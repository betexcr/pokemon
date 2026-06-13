---
name: checklist-dex
description: >-
  Guides Pokédex checklist progress, local storage, and Firestore cloud sync.
  Use when editing checklist routes, caught/seen state, dex progress UI, or
  offline persistence for the personal dex tracker.
---

# Checklist / Dex Progress

## Overview

Personal Pokédex progress tracker: mark Pokémon caught/seen, filter by generation, sync to cloud when signed in.

Route: `/checklist` → `src/app/checklist/`

## Key files

| File | Role |
|------|------|
| `src/lib/checklist/types.ts` | Checklist state types |
| `src/lib/checklist/state.ts` | State helpers / reducers |
| `src/lib/checklist/storage.local.ts` | localStorage persistence |
| `src/lib/checklist/storage.firebase.ts` | Firestore sync |
| `src/lib/checklist/dex.client.ts` | Client-side dex operations |

## Storage model

| Layer | When |
|-------|------|
| **localStorage** | Always — works offline, anonymous users |
| **Firestore** | Signed-in users — `users/{uid}/dex/default` |

Use lazy Firebase client (`firebase/client.ts` → `getDb()`) for Firestore sync to avoid eager connections.

## Auth

Cloud sync requires authenticated user via `AuthContext`. Merge strategy should be conflict-free (local + remote merge on load).

## Features

- Caught / seen flags per national dex ID
- Generation and type filtering
- Progress statistics (completion %)
- Share snapshots (if implemented in UI)
- Streak / badge tracking (see README)

## Rules

1. Checklist must work **without auth** (local-only mode).
2. Never block UI on Firestore — degrade to local state on error.
3. Use `ErrorProvider` / toasts for sync failures, not silent drops.

## Related UI

Checklist components likely under `src/components/checklist/` or inline in checklist page. Pokédex main UI: `ModernPokedexLayout.tsx` (separate from checklist route).

## Testing

- Prefer unit tests on pure state/storage helpers in `src/lib/checklist/`
- Manual: verify offline → sign in → sync → sign out → data retained locally

## Related docs

- [docs/coding_standards.md](../../docs/coding_standards.md) — error handling patterns
- Firebase skill: `.cursor/skills/firebase-multiplayer/SKILL.md`
