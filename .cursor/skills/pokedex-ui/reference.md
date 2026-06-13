# Pokédex UI Reference

## Related routes

| Route | File |
|-------|------|
| `/` | `src/app/page.tsx` |
| `/pokemon/[id]` | `src/app/pokemon/[id]/page.tsx` |
| `/compare` | `src/app/compare/page.tsx` |
| `/evolutions` | `src/app/evolutions/page.tsx` |
| `/type-matchups` | `src/app/type-matchups/page.tsx` |
| `/design-standards` | `src/app/design-standards/page.tsx` |
| `/debug-sprites` | `src/app/debug-sprites/page.tsx` |

## Header & navigation

| File | Role |
|------|------|
| `src/components/HeaderIcons.tsx` | Nav icon bar |
| `src/lib/headerIcons.ts` | Icon key → route mapping |
| `AppHeader` | Page headers on sub-routes |

## Filter / search components

| Component | Role |
|-----------|------|
| `AdvancedFilters.tsx` | Sidebar filters |
| `PokemonSelector.tsx` | Multi-select Pokémon |
| `PokedexScrollbar.tsx` | Scroll progress |
| `TypeBadge` / type colors | Authentic type styling |

## Performance docs

| Doc | Focus |
|-----|-------|
| [POKEDEX_PERFORMANCE_QUICK_START.md](../../docs/POKEDEX_PERFORMANCE_QUICK_START.md) | Quick wins |
| [POKEDEX_PERFORMANCE_OPTIMIZATIONS.md](../../docs/POKEDEX_PERFORMANCE_OPTIMIZATIONS.md) | Deep optimizations |
| [REQUEST_MANAGEMENT_GUIDE.md](../../docs/REQUEST_MANAGEMENT_GUIDE.md) | Request cancellation |

## UX docs

| Doc | Focus |
|-----|-------|
| [ux_guidelines.md](../../docs/ux_guidelines.md) | Design patterns |
| [design-standards page](../../src/app/design-standards/page.tsx) | In-app standards reference |

## Asset scripts

```bash
npm run assets:pmd        # Download PMD assets
npm run assets:pmd:top50  # Top 50 PMD sprites
npm run assets:pmd:id     # Single ID via $PMD_ID env
```

## Tailwind config

Semantic tokens defined in `tailwind.config.ts` — use these, not hardcoded hex colors.
