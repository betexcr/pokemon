# UX UI GUIDELINES

## VIEW RULES

### Headers

- Use `AppHeader` across pages. Set `title`, `subtitle` (optional), and `iconKey` when appropriate.
- Enable back navigation with `backLink` and `backLabel`; for Pokémon details use smart back via `useSmartBackNavigation`.
- Avoid heavy transitions on header actions; prefer fast `router.push` or `OptimizedLink`.
- Header icon sizes: responsive square buttons `w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16`.
- Use tooltip labels for all header actions with concise descriptions.

### Layout

- Root layout sets global providers and theme; do not bypass `ThemeProvider`.
- Page container: `main` should use `mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8` unless a denser layout is justified.
- Keep vertical rhythm using Tailwind spacing tokens; prefer `pt-8 pb-16` on main content.
- Avoid custom CSS files; styling must be Tailwind-only.

### Navigation

- Use `OptimizedLink` or `PokedexLink` for internal routes; avoid plain `<a>`.
- For quick actions in headers, avoid view transitions; for content navigation, `TransitionLink` is acceptable when it improves perceived performance.
- Insights dropdown is hover/click accessible, with role and aria attributes. Keep it lightweight and dismissible on outside click.

### Theming

- Dark mode: controlled via `class` strategy (`darkMode: "class"`). Don’t use `media` strategy.
- Supported themes: `light`, `dark`, `theme-gold`, `theme-red`, `theme-ruby`. Theme class is on `<html>`.
- Use semantic colors from Tailwind config:
  - Surface/background: `bg-bg`, `bg-surface`, borders `border-border`.
  - Text: `text-text`, `text-muted`.
  - Inputs: `bg-input-bg`, `text-input-text`, `placeholder-input-placeholder`.
  - Brand accents: `poke.red`, `poke.yellow`, `poke.blue` via `text-poke-red` etc.
  - Type colors via `type.*` for type badges.
- Do not hardcode hex colors. Use the semantic utilities that map to CSS variables.

### Spacing and Radii

- Spacing scale: use `standard` (2rem), `compact` (1rem), `minimal` (0.5rem) for component presets.
- General page padding: use Tailwind defaults (`px-4 sm:px-6 lg:px-8`).
- Border radius:
  - Default rounded controls: `rounded-md` or `rounded-lg`.
  - Pills/Tags: `rounded-capsule`.
  - Avatars: fully round (set `rounded-full`).

### Elevation and Surfaces

- Cards: use `shadow-card` by default. Compact lists may use `shadow-card-compact`, minimal UI can use `shadow-card-minimal`.
- Theme-specific shadows (when emphasizing brand): `shadow-gold-card`, `shadow-red-card`, `shadow-ruby-card`.
- Surfaces should be translucent where appropriate: `bg-white/90 dark:bg-white/10` for overlays, `backdrop-blur-sm` on menus.

### Typography

- Base font: `font-sans` from global layout.
- Retro/pixel fonts are reserved for decorative headings or themed sections using configured families (`font-retro`, `font-pixel`, `font-gameboy`, etc.). Use sparingly.
- Helper text: use `text-helper leading-helper` or `text-helper-compact leading-helper-compact` for dense UIs.
- Title case for page titles; sentence case for labels and descriptions.

### Buttons and Icon Buttons

- Use semantic sizes (same square sizing as header icons for icon-only buttons).
- States must include focus rings: `focus:outline-none focus:ring-2 focus:ring-blue-500/30`.
- Hover should not dramatically shift layout. Use subtle `hover:bg-*` and `group-hover:opacity-100` where needed.
- Destructive actions: `text-red-600 dark:text-red-400` with matching hover and background states.

### Menus and Popovers

- Use `role="menu"` and `role="menuitem"` with proper `aria-expanded` and `aria-hidden`.
- Open/close should be keyboard accessible (ESC closes, outside click closes, arrow keys optional).
- Transitions: `origin-top-right transition duration-150 ease-out` with scale and opacity.
- Width defaults: 320px max, constrained on small screens with `max-w-[calc(100vw-2rem)]`.

### Forms

- Inputs use semantic tokens: `bg-input-bg text-input-text placeholder-input-placeholder` and `border-border`.
- Always include clear label or aria-label; placeholder is not a label.
- Validate inline with accessible messages; never rely solely on color.
- Hit targets: minimum 44×44px for interactive elements.

### Accessibility

- Color contrast must meet WCAG AA against current theme variables.
- Every interactive element must be reachable by keyboard and have visible focus states.
- Provide `aria-*` attributes and `role` where semantic elements don’t suffice.
- Images must have meaningful `alt` text; decorative images should use `alt=""`.
- Tooltips enhance, not replace, labels. Do not place critical info only in tooltips.

### Motion and Microinteractions

- Use Tailwind animations defined in config: `animate-shake`, `animate-fadeOut`, `animate-slideIn`, `animate-damage`, `animate-heal`, `animate-critical`, `animate-status`, `animate-evolve`, `animate-mega`, `animate-beam`.
- Respect reduced motion user preference. Avoid large layout shifts or excessive motion.
- Keep animations under 700ms and provide clear feedback for actions.

### Performance

- Prefer `next/image` for images with fixed dimensions; include width/height and set `object-contain` for icons.
- Preload critical routes with lightweight links; use `RoutePreloader` strategically.
- Avoid unnecessary transitions in headers to keep navigation fast.
- Use skeletons/placeholders for loading to avoid flashes (see `UserDropdown` mounted/loading states).

### Content and Copy

- Keep descriptions concise and informative; avoid jargon.
- Use consistent nouns: Pokémon, Pokédex, Moves, Abilities, Type Matchups, Evolutions, Usage.
- Titles should be scannable; tooltips provide a one-line explanation.

### Page Patterns

- Pokémon Details
  - Header shows `title` as capitalized name, `subtitle` with `#ID` and special form label.
  - Main container uses standard layout sizes. Place `PokemonDetails` within `main` with consistent padding.
- Insights
  - Dropdown includes links to `Top 50`, `Trends`, `Type Matchups`, `Evolutions`, `Checklist`, `Usage`, `Contests`.
  - Use concise labels and ensure each item is keyboard and hover accessible.

### Do and Don’t

- Do use only Tailwind classes; no CSS overrides.
- Do use semantic tokens and theme classes; never hardcode colors.
- Do provide accessible names for all icons and controls.
- Don’t introduce custom spacing values; use the existing scale.
- Don’t block scroll or trap focus in menus without proper handling and escape routes.

### QA Checklist (per view)

- Theming: Works in `light`, `dark`, `gold`, `red`, `ruby`.
- Responsiveness: Header icons and layout scale across `sm`, `md`, `lg`, `xl`.
- Accessibility: Keyboard nav, focus ring, aria attributes, contrast.
- Performance: No layout shift, images optimized, transitions subtle.
- Consistency: Uses `max-w-6xl` layout, standardized paddings, and tokens.
