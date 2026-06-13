---
name: usage-meta
description: >-
  Guides competitive usage statistics, Smogon data, trends, and meta dashboards.
  Use when editing usage ingestion, top50, trends UI, meta pages, or competitive
  statistics features.
---

# Usage & Meta

## Overview

Competitive Pokémon usage tracking across Smogon Singles, VGC, BSS — generations 5–9. Interactive dashboards with trend analysis and top-50 focus.

## Routes

| Route | Purpose |
|-------|---------|
| `/usage` | Usage meta dashboard |
| `/usage-simple` | Simplified usage view |
| `/usage-demo` | Demo / prototype |
| `/trends` | Usage trend analysis |
| `/meta` | Meta overview |
| `/top50` | Top 50 popular Pokémon (PopupBook UI) |
| `/test-usage` | Usage testing page |

## Key files

| Path | Role |
|------|------|
| `src/lib/usage/` | Usage data ingestion, parsing, types |
| `src/lib/meta/` | Meta aggregation helpers |
| `src/lib/trends/` | Trend calculation |
| `src/data/top50Pokemon.ts` | Static top-50 dataset |
| `src/components/top50/` | PopupBook and related UI |
| `src/components/usage/` | Usage dashboard components |
| `src/components/meta/` | Meta visualization |
| `scripts/seed-usage-data.js` | Seed usage data |
| `scripts/test-real-data.js` | Validate real usage data |

## Data sources

- Smogon usage stats (monthly, by format/generation)
- Source attribution with clickable links in UI
- Static fallbacks in `src/data/` when live ingest unavailable

## UI patterns

- **PopupBook** (`src/components/top50/PopupBook.tsx`) — 3D phase transitions for top-50
- Rank selection, detail popups, generation/format filters
- Trend charts over time

## Scripts

```bash
npm run seed-usage      # node scripts/seed-usage-data.js
npm run test-real-data  # node scripts/test-real-data.js
npm run ingest          # node scripts/ingest.js
```

## Rules

1. Attribute data sources in UI — do not present third-party stats without attribution.
2. Keep usage pages performant — lazy load heavy chart/data modules.
3. Prefer cached/static data for build-time or ISR where applicable.

## Testing

- Unit test pure parsing/aggregation in `src/lib/usage/`
- Manual verification on `/usage` and `/top50` after data shape changes

## Related

- Pokédex detail pages link to competitive context
- Team builder may reference usage for suggestions
- [docs/coding_standards.md](../../docs/coding_standards.md)
