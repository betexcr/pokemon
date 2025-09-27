import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import Top50PageClient from './Top50PageClient'
import { top50Pokemon } from '@/data/top50Pokemon'

export const metadata: Metadata = {
  title: 'Pokémon Top 50 Popularity Popup Book',
  description: 'Flip through an interactive popup book that showcases the 50 most beloved Pokémon with animated spreads, type atlases, and trend insights.',
  alternates: { canonical: 'https://pokemon.ultharcr.com/top50' },
  openGraph: {
    title: 'Pokémon Top 50 Popularity Popup Book',
    description: 'An interactive Quinpart-inspired experience that turns community Pokémon rankings into a popup book journey.',
    url: 'https://pokemon.ultharcr.com/top50',
    type: 'website'
  }
}

export default function Top50Page() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Script
        id="jsonld-top50-itemlist"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Top 50 Pokémon Popularity',
            description: 'Interactive popup book of the 50 most beloved Pokémon with animated spreads and insights.',
            itemListOrder: 'http://schema.org/ItemListOrderAscending',
            url: 'https://pokemon.ultharcr.com/top50',
            numberOfItems: Array.isArray(top50Pokemon) ? top50Pokemon.length : undefined,
            itemListElement: Array.isArray(top50Pokemon)
              ? top50Pokemon.map((p: any, idx: number) => ({
                  '@type': 'ListItem',
                  position: idx + 1,
                  name: typeof p === 'string' ? p : (p?.name ?? `Rank ${idx + 1}`),
                  url: `https://pokemon.ultharcr.com/top50?rank=${idx + 1}`
                }))
              : []
          })
        }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <Top50PageClient />
      </Suspense>
    </div>
  )
}
