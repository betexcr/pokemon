import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site/siteUrl'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      { userAgent: 'facebookexternalhit', allow: '/' },
      { userAgent: 'Twitterbot', allow: '/' },
      { userAgent: 'LinkedInBot', allow: '/' },
      { userAgent: 'WhatsApp', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

