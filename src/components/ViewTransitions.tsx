'use client'

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

function getTransitionDuration(transitionType: TransitionType): number {
  switch (transitionType) {
    case 'battle-flash':
    case 'electric':
      return 200
    case 'pokeball':
    case 'pokedex-swipe':
    case 'pokedex-swipe-inverted':
    case 'water':
      return 250
    case 'tile-flip':
    case 'trainer-card':
      return 300
    case 'energy-aura':
      return 350
    default:
      return 250
  }
}

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

