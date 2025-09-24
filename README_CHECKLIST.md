Pokédex Checklist & Progress Tracker

This adds a /checklist page to the existing Next.js (App Router) project with a personal Pokédex tracker. Anonymous users persist to localStorage; signed-in users sync to Firebase (Auth + Firestore) with conflict-free merging and offline support.

Stack
- Next.js App Router + TypeScript
- TailwindCSS (uses existing project styles)
- Framer Motion (progress animations, respects reduced motion)
- Firebase Auth + Firestore (client SDK with offline persistence)

Key Files
- src/app/checklist/page.tsx — page shell, wires components
- src/app/checklist/loading.tsx — skeletons
- src/components/checklist/AuthGate.tsx — Google sign-in/out, sync indicator
- src/components/checklist/DexGrid.tsx — grid of cards + checkboxes
- src/components/checklist/Filters.tsx — gen/type/caught/search (URL-synced)
- src/components/checklist/ProgressBar.tsx — overall + per-gen progress
- src/components/checklist/StatsPanel.tsx — totals, per-gen, badges, streak
- src/components/checklist/ShareModal.tsx — URL-encoded snapshot share link
- src/components/checklist/ChecklistProvider.tsx — client store + debounce sync
- src/lib/checklist/types.ts — DexEntry, ProgressState, Snapshot
- src/lib/checklist/mockDex.ts — small sample dataset (dev)
- src/lib/checklist/storage.local.ts — localStorage driver + streak helpers
- src/lib/checklist/storage.firebase.ts — Firestore driver (merge-friendly)
- src/lib/checklist/state.ts — merge + toggle helpers
- src/lib/firebase/client.ts — Firebase init (browser-only, offline persistence)
- firestore.rules — secure rules for users/* and shares/*

Environment
Create .env.local in project root (values from Firebase console):

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

Install

# bun
bun add firebase framer-motion

# or npm
npm i firebase framer-motion

Usage
- Visit /checklist
- Toggle caught/uncaught to update immediately.
- Sign in with Google to merge local+cloud (unions caught/seen; updatedAt = max).
- While signed in, local saves immediately and cloud writes are debounced (~1s).
- Filters synchronize to the URL. Refresh keeps state.
- Share button creates a URL-encoded snapshot (no server needed).

Notes
- Conflict-free merge: unions caught/seen, prefers additive merges. No catches are lost.
- Offline: Firestore offline persistence is enabled (best-effort on supported browsers).
- Accessibility: native checkboxes with labels and visible % on progress bars.
- Performance: mock dataset is small; for a full dex, consider virtualization.

Extensibility hooks
- Add game-specific dimensions by extending document shape in storage.firebase.ts
- Add app/api/share/route.ts for Firestore-backed share IDs if desired

