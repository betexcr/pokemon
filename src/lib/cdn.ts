/**
 * CDN URL helper for static assets.
 *
 * When NEXT_PUBLIC_CDN_URL is set, assets served from /public or _next/static
 * are served from the CDN instead. Use this helper for image URLs that
 * are not automatically handled by Next.js `assetPrefix`.
 *
 * Cache headers configuration is expected to be set on the CDN / storage
 * bucket side (e.g., Cache-Control: public, max-age=31536000, immutable).
 */

const CDN_PREFIX = process.env.NEXT_PUBLIC_CDN_URL ?? '';

/**
 * Prefix a local asset path with the CDN base URL (if configured).
 * Paths must start with `/`.
 *
 * @example cdnUrl('/sprites/pikachu.png') → 'https://cdn.example.com/sprites/pikachu.png'
 */
export function cdnUrl(path: string): string {
  if (!CDN_PREFIX || !path.startsWith('/')) return path;
  return `${CDN_PREFIX}${path}`;
}

export function isCdnConfigured(): boolean {
  return CDN_PREFIX.length > 0;
}
