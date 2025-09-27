'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import Top50Experience from '@/components/top50/Top50Experience'
import { top50Pokemon } from '@/data/top50Pokemon'
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation'

export default function Top50PageClient() {
  const searchParams = useSearchParams()
  const [initialRank, setInitialRank] = useState<number | undefined>(undefined)
  const router = useRouter()
  const [hasInteracted, setHasInteracted] = useState(false)
  const top50Ref = useRef<{ resetToCover: () => void } | null>(null)

  // Parse search parameters on client side
  useEffect(() => {
    const rankParam = searchParams.get('rank') || searchParams.get('r')
    if (rankParam) {
      const rank = parseInt(rankParam, 10)
      if (Number.isFinite(rank) && rank >= 1 && rank <= 50) {
        setInitialRank(rank)
      }
    }
  }, [searchParams])

  // Store current page as referrer for smart back navigation
  useReferrerStorage()
  
  // Use smart back navigation with custom logic for top50
  const { backLink, backLabel } = useSmartBackNavigation({
    defaultBackLink: hasInteracted ? "/top50" : "/",
    defaultBackLabel: hasInteracted ? "Back to Top 50" : "Back to PokéDex"
  })

  const handleInteraction = useCallback(() => {
    setHasInteracted(true)
  }, [])

  const handleBack = useCallback((event?: React.MouseEvent) => {
    // Prevent default navigation when user has interacted
    if (event) {
      event.preventDefault()
    }
    
    if (hasInteracted && top50Ref.current) {
      // User has interacted, reset to cover phase within top 50
      top50Ref.current.resetToCover()
    } else {
      // User hasn't interacted, go back to the smart back link
      router.push(backLink)
    }
  }, [hasInteracted, backLink, router])

  return (
    <>
      <AppHeader
        title="Top 50 Popularity"
        subtitle="Popup-book storytelling for the community's most beloved Pokémon."
        iconKey="top50"
        backLink={backLink}
        backLabel={backLabel}
        showSidebar={false}
        showToolbar={true}
        onBackClick={hasInteracted ? handleBack : undefined}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Top50Experience 
          pokemon={top50Pokemon} 
          initialRank={initialRank}
          onInteraction={handleInteraction}
          ref={top50Ref}
        />
      </main>
    </>
  )
}
