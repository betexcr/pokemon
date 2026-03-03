import type { Metadata } from 'next'
import ContestsPageClient from './ContestsPageClient'
import AppHeader from '@/components/AppHeader'
import OptimizedLink from '@/components/OptimizedLink'

export const metadata: Metadata = {
  title: 'Pokémon Contests - Interactive Simulator',
  description: 'Experience Pokemon Contests with interactive gameplay, pokeblock feeding, talent rounds, and kawaii visuals.',
  alternates: { canonical: 'https://pokemon.ultharcr.com/contests' },
  openGraph: {
    title: 'Pokémon Contests - Interactive Simulator',
    description: 'Experience Pokemon Contests with interactive gameplay, pokeblock feeding, talent rounds, and kawaii visuals.',
    url: 'https://pokemon.ultharcr.com/contests',
    type: 'website'
  }
}

export default function ContestsPage() {
  return (
    <div>
      <AppHeader
        title="Contest Simulator"
        subtitle="Feed Pokéblocks, perform moves, and climb the ranks"
        iconKey="contests"
        showIcon={true}
        showToolbar={true}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Local tabs */}
        <nav aria-label="Contests sections" className="-mt-4 mb-4">
          <ul className="flex items-center gap-2 text-sm">
            <li>
              <span className="inline-flex items-center rounded-full px-3 py-1 border border-border bg-surface text-text shadow-card">
                Simulator
              </span>
            </li>
            <li>
              <OptimizedLink
                href="/contests/facts"
                className="inline-flex items-center rounded-full px-3 py-1 border border-border hover:bg-surface/60 text-text"
              >
                Fun Facts
              </OptimizedLink>
            </li>
          </ul>
        </nav>

        {/* Simulator content */}
        <ContestsPageClient />
      </main>
    </div>
  )
}
