import type { Metadata } from 'next'
import TrendsClient from './TrendsClient'

export const metadata: Metadata = {
  title: 'Popularity Trends Explorer',
  description: 'Explore Pokémon popularity over time with animated lines and a bubble timeline, with accessible fallbacks.',
  alternates: { canonical: 'https://pokemon.ultharcr.com/trends' },
  openGraph: {
    title: 'Popularity Trends Explorer',
    description: 'Interactive popularity trends with motion-aware, accessible visualizations.',
    url: 'https://pokemon.ultharcr.com/trends',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popularity Trends Explorer',
    description: 'Interactive popularity trends with motion-aware, accessible visualizations.'
  }
};

export default function Page() {
  return <TrendsClient />
}
