'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export type TransitionType = 
  | 'pokeball' 
  | 'battle-flash' 
  | 'pokedex-swipe' 
  | 'pokedex-swipe-inverted'
  | 'tile-flip' 
  | 'energy-aura' 
  | 'trainer-card'
  | 'electric'
  | 'water'
  | 'default'

interface ViewTransitionsProps {
  children: React.ReactNode
}

// Route-to-transition mapping
const routeTransitions: Record<string, TransitionType> = {
  '/': 'pokeball',
  '/pokemon': 'pokeball',
  '/compare': 'pokedex-swipe',
  '/team': 'tile-flip',
  '/battle': 'battle-flash',
  '/battles': 'battle-flash',
  '/profile': 'trainer-card',
  '/settings': 'trainer-card',
  '/auth': 'energy-aura',
}

// Type-based transitions for Pokémon pages
const getPokemonTypeTransition = (pokemonType?: string): TransitionType => {
  switch (pokemonType?.toLowerCase()) {
    case 'electric':
      return 'electric'
    case 'water':
      return 'water'
    case 'fire':
    case 'fighting':
      return 'battle-flash'
    case 'psychic':
    case 'fairy':
      return 'energy-aura'
    default:
      return 'pokeball'
  }
}

export default function ViewTransitions({ children }: ViewTransitionsProps) {
  const pathname = usePathname()
  const previousPathname = useRef<string>('')
  const transitionClass = useRef<string>('')

  useEffect(() => {
    // Skip transition on initial load
    if (previousPathname.current === '') {
      previousPathname.current = pathname
      return
    }

    // Determine transition type based on route
    let transitionType: TransitionType = 'default'
    
    // Check for specific route patterns
    for (const [route, type] of Object.entries(routeTransitions)) {
      if (pathname.startsWith(route)) {
        transitionType = type
        break
      }
    }

    // Special handling for Pokémon detail pages
    if (pathname.startsWith('/pokemon/') && pathname !== '/pokemon') {
      // Try to get Pokémon type from URL or localStorage
      const pokemonId = pathname.split('/').pop()
      if (pokemonId) {
        try {
          const pokemonData = localStorage.getItem(`pokemon-${pokemonId}`)
          if (pokemonData) {
            const pokemon = JSON.parse(pokemonData)
            const primaryType = pokemon.types?.[0]?.type?.name
            transitionType = getPokemonTypeTransition(primaryType)
          }
        } catch (error) {
          console.warn('Failed to parse Pokémon data for transition:', error)
        }
      }
    }

    // Apply transition class to document
    const transitionClassName = `${transitionType}-transition`
    
    // Remove previous transition class
    if (transitionClass.current) {
      document.documentElement.classList.remove(transitionClass.current)
    }
    
    // Add new transition class
    document.documentElement.classList.add(transitionClassName)
    transitionClass.current = transitionClassName

    // Start the view transition
    if ('startViewTransition' in document) {
      // @ts-ignore - View Transitions API is not fully typed yet
      document.startViewTransition(() => {
        // The actual navigation is handled by Next.js
        // This is just to trigger the transition
      })
    }

    // Clean up transition class after animation
    const cleanup = () => {
      if (transitionClass.current) {
        document.documentElement.classList.remove(transitionClass.current)
        transitionClass.current = ''
      }
    }

    // Clean up after transition duration
    const transitionDuration = getTransitionDuration(transitionType)
    const timeoutId = setTimeout(cleanup, transitionDuration)

    // Update previous pathname
    previousPathname.current = pathname

    return () => {
      clearTimeout(timeoutId)
      cleanup()
    }
  }, [pathname])

  return <>{children}</>
}

// Get transition duration based on type
function getTransitionDuration(transitionType: TransitionType): number {
  switch (transitionType) {
    case 'battle-flash':
    case 'electric':
      return 300
    case 'pokeball':
    case 'pokedex-swipe':
    case 'pokedex-swipe-inverted':
    case 'water':
      return 400
    case 'tile-flip':
    case 'trainer-card':
      return 500
    case 'energy-aura':
      return 600
    default:
      return 400
  }
}

// Utility function to manually trigger a transition
export function triggerViewTransition(
  transitionType: TransitionType = 'default',
  callback: () => void
) {
  if ('startViewTransition' in document) {
    // Apply transition class
    const transitionClassName = `${transitionType}-transition`
    document.documentElement.classList.add(transitionClassName)
    
    // @ts-ignore - View Transitions API is not fully typed yet
    document.startViewTransition(() => {
      callback()
    }).finished.finally(() => {
      // Clean up transition class
      document.documentElement.classList.remove(transitionClassName)
    })
  } else {
    // Fallback for browsers without View Transitions API
    callback()
  }
}

// Utility function to set shared element names for smooth transitions
export function setSharedElementName(element: HTMLElement, name: string) {
  if (element) {
    element.style.viewTransitionName = name
  }
}

// Utility function to clear shared element names
export function clearSharedElementName(element: HTMLElement) {
  if (element) {
    element.style.viewTransitionName = 'none'
  }
}
