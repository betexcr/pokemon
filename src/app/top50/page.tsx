import type { Metadata } from 'next'
import AppHeader from '@/components/AppHeader'
import Top50Experience from '@/components/top50/Top50Experience'
import { top50Pokemon } from '@/data/top50Pokemon'
import Script from 'next/script'
import Top50PageClient from './Top50PageClient'

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

export default async function Top50Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await searchParams) || {}
  const rankParam = sp.rank || sp.r
  const initialRank = Array.isArray(rankParam)
    ? parseInt(rankParam[0] as string, 10)
    : rankParam
      ? parseInt(rankParam as string, 10)
      : undefined
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
      <Top50PageClient initialRank={Number.isFinite(initialRank as number) ? (initialRank as number) : undefined} />
    </div>
  )
}
