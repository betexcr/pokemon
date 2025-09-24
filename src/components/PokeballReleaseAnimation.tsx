'use client'

import { useEffect, useState } from 'react'
import { Pokemon } from '@/types/pokemon'

interface PokeballReleaseAnimationProps {
  pokemons: Pokemon[]
  onAnimationComplete?: () => void
}

export default function PokeballReleaseAnimation({ 
  pokemons, 
  onAnimationComplete 
}: PokeballReleaseAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    console.log('PokeballReleaseAnimation mounted with pokemons:', pokemons.length)
    if (pokemons.length > 0) {
      console.log('Starting Pokéball release animation...')
      // Start animation
      setIsAnimating(true)
      
      // Show content after animation completes (longest delay + animation duration)
      const maxDelay = (pokemons.length - 1) * 0.12 // 0.12s per ball
      const animationDuration = 1.65 // Total animation duration
      const totalTime = (maxDelay + animationDuration) * 1000
      
      console.log('Animation will complete in:', totalTime, 'ms')
      
      setTimeout(() => {
        console.log('Animation completed!')
        setShowContent(true)
        setIsAnimating(false)
        onAnimationComplete?.()
      }, totalTime)
    }
  }, [pokemons, onAnimationComplete])

  if (pokemons.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl dark:shadow-3xl border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Releasing Pokémon...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your team is being prepared for battle!
          </p>
        </div>
        
        <ul className="party justify-center">
          {pokemons.slice(0, 6).map((pokemon, index) => (
            <li key={pokemon.id} className="ball">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                alt={pokemon.name}
                className="w-12 h-12 object-contain"
              />
            </li>
          ))}
        </ul>
        
        {showContent && (
          <div className="mt-6 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Pokémon released successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
