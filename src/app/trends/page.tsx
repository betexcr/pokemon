import type { Metadata } from 'next'
import { Suspense } from 'react'
import TrendsClient from './TrendsClient'

export const metadata: Metadata = {
  title: 'Popularity Trends Explorer',
  description: 'Explore Pokémon popularity over time with animated lines and a bubble timeline, with accessible fallbacks.',
  alternates: { canonical: '/trends' },
  openGraph: {
    title: 'Popularity Trends Explorer',
    description: 'Interactive popularity trends with motion-aware, accessible visualizations.',
    url: '/trends',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popularity Trends Explorer',
    description: 'Interactive popularity trends with motion-aware, accessible visualizations.'
  }
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted animate-pulse">Loading trends...</p></div>}>
      <TrendsClient />
    </Suspense>
  )
}
