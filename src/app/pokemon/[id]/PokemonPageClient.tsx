'use client'

import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import PokemonDetails from '@/components/PokemonDetails'
import { Pokemon } from '@/types/pokemon'
import { useSmartBackNavigation } from '@/hooks/useSmartBackNavigation'

interface PokemonPageClientProps {
  pokemon: Pokemon
}

export default function PokemonPageClient({ pokemon }: PokemonPageClientProps) {
  const router = useRouter()

  // Use smart back navigation
  const { backLink, backLabel } = useSmartBackNavigation({
    defaultBackLink: "/",
    defaultBackLabel: "Back to PokéDex"
  })

  const handleBack = () => {
    router.push(backLink)
  }

  return (
    <>
      <AppHeader
        title={pokemon.name}
        subtitle={`#${pokemon.id.toString().padStart(3, '0')}`}
        iconKey="pokemon"
        backLink={backLink}
        backLabel={backLabel}
        showSidebar={false}
        showToolbar={true}
        onBackClick={handleBack}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <PokemonDetails pokemon={pokemon} />
      </main>
    </>
  )
}
