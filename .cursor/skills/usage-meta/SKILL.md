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
| `/trends` | Popularity trends from real Wikipedia pageviews (`/api/trends/popularity`) |
| `/meta` | Meta overview |
| `/top50` | Top 50 popular Pokémon (PopupBook UI) |
| `/test-usage` | Usage testing page |

## Key files

| Path | Role |
|------|------|
| `src/lib/usage/` | Usage data ingestion, parsing, types |
| `src/lib/meta/` | Meta aggregation helpers |
| `src/lib/trends/` | Popularity trends: `wikipedia.ts` (pure title selection + aggregation), `popularityService.ts` (server fetch of PokeAPI names + Wikimedia pageviews) |
| `src/data/top50Pokemon.ts` | Static top-50 dataset |
| `src/components/top50/` | PopupBook and related UI |
| `src/components/usage/` | Usage dashboard components |
| `src/components/meta/` | Meta visualization |
| `scripts/seed-usage-data.js` | Seed usage data |
| `scripts/test-real-data.js` | Validate real usage data |

## Data sources

- Smogon usage stats (monthly, by format/generation)
- Wikimedia Pageviews API for `/trends` popularity (keyless; server sends a descriptive User-Agent). Regions are Wikipedia language groups: English (en), Asia (ja/ko/zh), Europe (de/fr/es/it), Global (sum). Metric is average daily user pageviews; legacy `region=US|EU` URLs map to English/Europe.
- Source attribution with clickable links in UI
- Static fallbacks in `src/data/` when live ingest unavailable

## UI patterns

- **PopupBook** (`src/components/top50/PopupBook.tsx`) — 3D phase transitions for top-50
- Rank selection, detail popups, generation/format filters
- Trend charts over time
- **`/trends` selection:** one "Selected Pokémon" list (max 7, the chart palette size). The search dropdown lists every species and clicking adds to the list; the first entry is the highlighted Pokémon (header, insights, monthly chart) and is stored as `poke`, the rest as `compare` in the URL. First-visit defaults are `DEFAULT_SELECTION` in `src/lib/trends/data.ts` (Mew, Meowth, Gengar, Pikachu). Saved preferences use `trends:preferences:v2`; bump the version if the selection model changes again.

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
