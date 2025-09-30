import type { Metadata } from 'next'
import ContestFactsPage from './facts/page'

export const metadata: Metadata = {
  title: 'Pokémon Contests - Fun Facts & Learning',
  description: 'Discover Pokémon Contest mechanics and trivia with a pro, info-forward UI. Filters, spotlight, and modal details.',
  alternates: { canonical: 'https://pokemon.ultharcr.com/contests' },
  openGraph: {
    title: 'Pokémon Contests - Fun Facts & Learning',
    description: 'Discover Pokémon Contest mechanics and trivia with a pro, info-forward UI. Filters, spotlight, and modal details.',
    url: 'https://pokemon.ultharcr.com/contests',
    type: 'website'
  }
}

export default function ContestsPage() {
  return <ContestFactsPage />
}
