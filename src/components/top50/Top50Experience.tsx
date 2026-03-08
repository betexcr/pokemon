'use client'

import { useEffect, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import PopupBook from './PopupBook'
import ReferencesBar from './ReferencesBar'
import type { PopularPokemon } from '@/data/top50Pokemon'

interface Top50ExperienceProps {
  pokemon: PopularPokemon[]
  initialRank?: number
  onInteraction?: () => void
}

export interface Top50ExperienceRef {
  resetToCover: () => void
}

const Top50Experience = forwardRef<Top50ExperienceRef, Top50ExperienceProps>(({ pokemon, initialRank, onInteraction }, ref) => {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [selectedRank, setSelectedRank] = useState(() => {
    return typeof initialRank === 'number' && Number.isFinite(initialRank)
      ? initialRank
      : (pokemon[0]?.rank ?? 1)
  })
  
  // Track if user has interacted with the top 50 section
  const [hasInteracted, setHasInteracted] = useState(false)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resetToCover: () => {
      setCurrentPhase(0)
      setSelectedRank(pokemon[0]?.rank ?? 1)
    }
  }), [pokemon])

  const selectedPokemon = useMemo(() => {
    return pokemon.find(poke => poke.rank === selectedRank) ?? pokemon[0] ?? null
  }, [pokemon, selectedRank])

  const safePhases = useMemo(() => {
    return [
      {
        id: 'cover',
        title: 'Collector\'s Cover',
        description: 'A fold-out prologue summarizing this season\'s community pulse and aggregate trends.',
        accent: 'from-amber-500/70 via-rose-500/60 to-purple-500/70'
      },
      {
        id: 'spotlight',
        title: 'Spotlight Spread',
        description: 'Dive into individual fan darlings with lore, signature moves, and hype metrics.',
        accent: 'from-sky-500/70 via-indigo-500/60 to-fuchsia-500/70'
      },
      {
        id: 'types',
        title: 'Type Atlas',
        description: 'Layered cut-outs visualizing how elemental themes stack up across the Top 50.',
        accent: 'from-emerald-500/70 via-teal-500/60 to-cyan-500/70'
      },
      {
        id: 'trends',
        title: 'Momentum Tracker',
        description: 'Flip to momentum charts and regional call-outs for rising stars.',
        accent: 'from-orange-500/70 via-amber-500/60 to-red-500/70'
      }
    ]
  }, [])

  // Track user interactions to determine back button behavior
  const markInteraction = useCallback(() => {
    setHasInteracted(true)
    onInteraction?.()
  }, [onInteraction])

  const scrollToSpotlight = () => {
    if (typeof window === 'undefined') return

    let retries = 0
    const maxRetries = 60

    // Poll until the spotlight card is mounted in the DOM
    // (handles AnimatePresence "wait" mode where the exit runs
    // before the enter, so the card may not exist for ~500ms).
    const waitForCard = () => {
      const card = document.getElementById('top50-spotlight-card') as HTMLElement | null
      if (!card || card.getBoundingClientRect().height === 0) {
        if (retries++ < maxRetries) {
          setTimeout(waitForCard, 50)
        }
        return
      }
      // Card is mounted — wait for the spring enter animation to settle
      setTimeout(() => {
        const header = document.querySelector('header.sticky') as HTMLElement | null
        const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0
        card.style.scrollMarginTop = `${headerHeight + 8}px`
        card.scrollIntoView({ block: 'start', behavior: 'smooth' })
        try { card.focus({ preventScroll: true }) } catch {}
      }, 550)
    }

    setTimeout(waitForCard, 30)
  }

  // Initialize from URL if a rank is specified (e.g., /top50?rank=46 or hash like #rank=46)
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Prefer explicit prop
    let rank: number | undefined = initialRank
    if (!rank) {
      try {
        const url = new URL(window.location.href)
        const qRank = url.searchParams.get('rank') || url.searchParams.get('r')
        if (qRank) rank = parseInt(qRank, 10)
        if (!rank && url.hash) {
          const m = url.hash.match(/rank(?:=|\-|:)?(\d{1,3})/i)
          if (m && m[1]) rank = parseInt(m[1], 10)
        }
      } catch {}
    }
    if (rank && Number.isFinite(rank)) {
      setSelectedRank(rank)
      setCurrentPhase(1)
      // Delay scroll slightly to ensure spotlight rendered
      setTimeout(() => scrollToSpotlight(), 50)
    }
  // Only run on mount or when initialRank changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRank])

  return (
    <div className="space-y-8">
      <PopupBook
        phases={safePhases}
        pokemon={pokemon}
        selectedPokemon={selectedPokemon}
        currentPhase={currentPhase}
        onPhaseChange={(phase) => {
          setCurrentPhase(phase)
          markInteraction()
        }}
        onSelectPokemon={(rank) => {
          setSelectedRank(rank)
          setCurrentPhase(1)
          markInteraction()
          scrollToSpotlight()
        }}
      />
      <ReferencesBar
        pokemon={pokemon}
        selectedRank={selectedRank}
        onSelectRank={(rank) => {
          setSelectedRank(rank)
          setCurrentPhase(1)
          markInteraction()
          scrollToSpotlight()
        }}
      />
    </div>
  )
})

Top50Experience.displayName = 'Top50Experience'

export default Top50Experience
