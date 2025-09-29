'use client'

import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import PokemonDetails from '@/components/PokemonDetails'
import { Pokemon } from '@/types/pokemon'
import { useSmartBackNavigation } from '@/hooks/useSmartBackNavigation'
import { isSpecialForm } from '@/lib/specialForms'

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

  // Generate subtitle with special form indicator
  const getSubtitle = () => {
    let subtitle = `#${pokemon.id.toString().padStart(3, '0')}`
    if (pokemon.special_form) {
      subtitle += ` • ${pokemon.special_form.type === 'mega' ? 'Mega' : 'Primal'} Form`
    }
    return subtitle
  }

  return (
    <>
      <AppHeader
        title={pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        subtitle={getSubtitle()}
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
