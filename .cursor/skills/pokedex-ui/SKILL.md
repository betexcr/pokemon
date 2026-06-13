---
name: pokedex-ui
description: >-
  Guides Pokédex layouts, theme system, search/filter, virtualization, i18n,
  and performance. Use when editing ModernPokedexLayout, theme layouts, search,
  filters, or Pokédex page performance.
---

# Pokédex UI

## Main layouts

| Component | Theme / mode |
|-----------|--------------|
| `ModernPokedexLayout.tsx` | Default modern grid/list |
| `RedPokedexLayout.tsx` | Game Boy Red theme |
| `GoldPokedexLayout.tsx` | Game Boy Gold theme |
| `RubyPokedexLayout.tsx` | Game Boy Advance Ruby theme |
| `VirtualizedPokemonGrid.tsx` | Performance grid |
| `VirtualizedPokemonList.tsx` | Performance list |

Home route: `src/app/page.tsx` — loads Pokémon with progressive fetching + search.

Detail route: `src/app/pokemon/[id]/page.tsx`

## Theme system

Themes applied via `<html>` classes:

| Class | Theme |
|-------|-------|
| `dark` | Dark mode |
| `theme-gold` | Pokémon Gold |
| `theme-red` | Pokémon Red |
| `theme-ruby` | Pokémon Ruby |

- Persist preference in localStorage
- **Tailwind only** — semantic tokens: `bg`, `surface`, `border`, `text`, `muted`, `poke.*`, `type.*`
- No custom CSS files beyond `globals.css` + `tokens.css`

## Search & filters

- Debounced search (~300ms) via `api.ts`
- Type filter ribbon with authentic type colors
- Generation, height/weight sliders, legendary/mythical toggles
- Advanced filters sidebar (`AdvancedFilters.tsx`)
- Comparison mode: up to 6 Pokémon (`ComparisonSection.tsx`)

## Performance

- Virtualized lists/grids for large datasets
- Progressive loading + skeleton states
- Request cancellation via `requestManager` on navigation
- See [reference.md](reference.md) for perf docs

Key doc: [docs/POKEDEX_PERFORMANCE_QUICK_START.md](../../docs/POKEDEX_PERFORMANCE_QUICK_START.md)

## i18n

- `next-intl` plugin via `src/i18n/request.ts`
- Messages: `messages/en.json`, `messages/ja.json`, `messages/es.json`
- Add keys to all locale files when adding user-facing strings

## Images & sprites

- `next/image` with global `unoptimized: true`
- PMD assets: `public/assets/pmd/{id}/`
- Showdown animated sprites via `getShowdownAnimatedSprite()` in `utils.ts`
- Fallback chain on image error (PokeAPI sprites)

## Error UX

- `ErrorTip.tsx` — bottom-left error toasts with Pokémon mascots by error type
- `ErrorProvider` + `GlobalErrorCatcher` — global error capture
- Gengar (0094) = unknown error mascot, not the failing Pokémon

## Rules

1. Keep page-specific logic in `*PageClient.tsx`, not in shared layout components.
2. Use `@/` imports; co-locate types in `src/types/pokemon.ts`.
3. Respect a11y: keyboard nav, focus rings, alt text ([docs/coding_standards.md](../../docs/coding_standards.md)).

## Additional resources

- [reference.md](reference.md)
- [docs/ux_guidelines.md](../../docs/ux_guidelines.md)
- [docs/POKEDEX_PERFORMANCE_OPTIMIZATIONS.md](../../docs/POKEDEX_PERFORMANCE_OPTIMIZATIONS.md)
