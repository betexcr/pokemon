import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pokemon.ultharcr.com'
  const lastModified = new Date()

  const routes = [
    '',
    '/battle',
    '/battle-lite',
    '/team-builder',
    '/type-matchups',
    '/evolutions',
    '/usage',
    '/usage-demo',
    '/trends',
    '/top50',
    '/meta',
    '/checklist'
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8
  }))
}


