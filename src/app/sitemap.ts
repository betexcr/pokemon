import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site/siteUrl'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL
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
