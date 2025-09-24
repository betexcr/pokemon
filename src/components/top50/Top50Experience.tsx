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
    
    // Wait for the nav DOM to exist and layout to settle (handles slower renders and mobile layout changes)
    let tries = 0
    const maxTries = 30 // Increased retry count for phase transitions
    
    const tryScroll = () => {
      const phasesNav = document.getElementById('top50-phases-nav') as HTMLElement | null
      const section = document.getElementById('top50-popup-book') as HTMLElement | null
      
      // Check if navigation is properly rendered and visible
      const isNavReady = phasesNav && 
        phasesNav.getBoundingClientRect().height > 0 && 
        phasesNav.offsetParent !== null
      
      if (!isNavReady && !section) {
        if (tries++ < maxTries) {
          // Use longer delay for phase transitions
          const delay = tries < 10 ? 16 : 50
          return setTimeout(() => window.requestAnimationFrame(tryScroll), delay)
        }
        return
      }
      
      // Account for sticky header height when scrolling
      const header = document.querySelector('header.sticky') as HTMLElement | null
      const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0
      const padding = 16
      let y: number
      
      if (isNavReady) {
        // Scroll to show the content that comes right after the navigation
        const rect = phasesNav.getBoundingClientRect()
        const bottom = rect.bottom + window.scrollY
        
        // Scroll to the bottom of the navigation to show the content that follows
        y = Math.max(0, bottom - headerHeight - padding)
      } else if (section) {
        // Fallback: scroll to the top of the popup book section
        const top = section.getBoundingClientRect().top + window.scrollY
        y = Math.max(0, top - headerHeight - padding)
      } else {
        return
      }
      
      window.scrollTo({ top: y, behavior: 'smooth' })

      // After scrolling, move focus to the nav for accessibility
      if (isNavReady) {
        window.setTimeout(() => {
          try { phasesNav.focus({ preventScroll: true }) } catch {}
        }, 250)
      }
    }
    
    // Add a longer delay for phase transitions to ensure layout has settled
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const initialDelay = isMobile ? 150 : 100 // Increased delay for phase transitions
    
    setTimeout(() => window.requestAnimationFrame(tryScroll), initialDelay)
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
