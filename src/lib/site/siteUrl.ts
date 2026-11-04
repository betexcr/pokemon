/**
 * Canonical public origin of the deployed site.
 *
 * Every absolute URL we emit (canonical link, Open Graph, JSON-LD, sitemap, robots)
 * must point at the domain the site is actually served from. Advertising a different
 * host as canonical makes the page look like a clone of another site, which browser
 * anti-phishing heuristics (e.g. Malwarebytes Browser Guard) flag.
 *
 * Resolution order:
 * 1. `NEXT_PUBLIC_SITE_URL` (explicit override; must be the real production domain)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (set by Vercel to the project's production domain)
 * 3. The production domain below.
 */
export const PRODUCTION_HOST = 'pokebattles.vercel.app';

function normalizeOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export const SITE_URL: string =
  normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  `https://${PRODUCTION_HOST}`;

/** Host shown in visual watermarks (OG images). */
export const SITE_HOST: string = new URL(SITE_URL).host;

export const SITE_NAME = 'PokéBattles';

/** Shown in metadata and the footer so the site is never mistaken for an official property. */
export const FAN_SITE_DISCLAIMER =
  'PokéBattles is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Pokémon and all related names are trademarks of their respective owners.';
