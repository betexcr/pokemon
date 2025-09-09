'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface RoomPokeballReleaseAnimationProps {
  slots: Array<{ id?: number | null }>
  onAnimationComplete?: (ballIndex: number) => void
  onBallClick?: (index: number) => void
  playerType: 'host' | 'guest'
  remoteAnimatingBalls?: Set<number>
  remoteReleasedBalls?: Set<number>
  isLocalPlayer?: boolean
}

export default function RoomPokeballReleaseAnimation({ 
  slots, 
  onAnimationComplete,
  onBallClick,
  playerType,
  remoteAnimatingBalls = new Set(),
  remoteReleasedBalls = new Set(),
  isLocalPlayer = false
}: RoomPokeballReleaseAnimationProps) {
  const [localAnimatingBalls, setLocalAnimatingBalls] = useState<Set<number>>(new Set())
  const [localReleasedBalls, setLocalReleasedBalls] = useState<Set<number>>(new Set())

  const POKEBALL_ICON = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
  const getPixelSprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

  const handleBallClick = (index: number) => {
    const slot = slots[index]
    if (!slot?.id || localAnimatingBalls.has(index) || localReleasedBalls.has(index)) {
      return // Don't animate if no Pokémon, already animating, or already released
    }

    console.log(`${playerType} Pokéball ${index} clicked, releasing Pokémon ${slot.id}`)
    
    // Start local animation for this specific ball
    setLocalAnimatingBalls(prev => new Set(prev).add(index))
    
    // Call the parent callback to broadcast the event
    onBallClick?.(index)
    
    // Animation duration (same as before)
    const animationDuration = 1650 // 1.65 seconds
    
    setTimeout(() => {
      console.log(`${playerType} Pokéball ${index} animation completed!`)
      setLocalAnimatingBalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
      setLocalReleasedBalls(prev => new Set(prev).add(index))
      onAnimationComplete?.(index)
    }, animationDuration)
  }

  // Create array of 6 slots (filled or empty)
  const pokeballSlots = Array.from({ length: 6 }, (_, i) => {
    const slot = slots[i]
    return {
      id: slot?.id || null,
      filled: Boolean(slot?.id),
      index: i
    }
  })

  return (
    <div className="flex items-center gap-1">
      {pokeballSlots.map((slot, index) => {
        // Combine local and remote animation states
        const isAnimating = localAnimatingBalls.has(index) || remoteAnimatingBalls.has(index)
        const isReleased = localReleasedBalls.has(index) || remoteReleasedBalls.has(index)
        const canClick = slot.filled && !isAnimating && !isReleased && isLocalPlayer
        
        return (
          <div 
            key={index} 
            className={`w-2.5 h-2.5 relative ${slot.filled ? '' : 'opacity-30'}`}
          >
            {slot.filled ? (
              <>
                {/* Pokéball - hidden after release */}
                {!isReleased && (
                  <div 
                    className={`ball ${isAnimating ? 'animate' : ''}`}
                    onClick={() => canClick && handleBallClick(index)}
                    style={{ cursor: canClick ? 'pointer' : 'default' }}
                  >
                    <Image 
                      src={POKEBALL_ICON} 
                      alt="Poké Ball" 
                      width={10} 
                      height={10}
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {/* Pokémon sprite - shown after release */}
                {isReleased && (
                  <div className="animate-scale-in">
                    <Image
                      src={getPixelSprite(slot.id!)}
                      alt={`Pokemon ${slot.id}`}
                      width={10}
                      height={10}
                      className="w-full h-full object-contain"
                      onLoad={() => console.log(`${playerType} Pokémon ${slot.id} sprite loaded`)}
                      onError={() => console.error(`${playerType} Failed to load Pokémon ${slot.id} sprite`)}
                    />
                  </div>
                )}
              </>
            ) : (
              <Image 
                src={POKEBALL_ICON} 
                alt="Poké Ball" 
                width={10} 
                height={10}
                className="w-full h-full opacity-30"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
