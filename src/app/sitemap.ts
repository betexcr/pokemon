import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemon-indol-tau.vercel.app'
  const lastModified = new Date()

  const staticRoutes = [
    '',
    '/battle',
    '/battle-lite',
    '/team-builder',
    '/team',
    '/type-matchups',
    '/evolutions',
    '/usage',
    '/trends',
    '/top50',
    '/meta',
    '/checklist',
    '/compare',
    '/lobby',
    '/championship',
    '/contests',
    '/insights',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  const pokemonEntries: MetadataRoute.Sitemap = Array.from(
    { length: 1025 },
    (_, i) => ({
      url: `${baseUrl}/pokemon/${i + 1}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  )

  return [...staticEntries, ...pokemonEntries]
}
