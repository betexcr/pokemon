'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface RoomPokeballReleaseAnimationProps {
  slots: Array<{ id?: number | null }>
  onAnimationComplete?: (ballIndex: number) => void
  onCatchComplete?: (ballIndex: number) => void
  onBallClick?: (index: number) => void
  playerType: 'host' | 'guest'
  remoteAnimatingBalls?: Set<number>
  remoteReleasedBalls?: Set<number>
  isLocalPlayer?: boolean
}

export default function RoomPokeballReleaseAnimation({ 
  slots, 
  onAnimationComplete,
  onCatchComplete,
  onBallClick,
  playerType,
  remoteAnimatingBalls = new Set(),
  remoteReleasedBalls = new Set(),
  isLocalPlayer = false
}: RoomPokeballReleaseAnimationProps) {
  const [localAnimatingBalls, setLocalAnimatingBalls] = useState<Set<number>>(new Set())
  const [localReleasedBalls, setLocalReleasedBalls] = useState<Set<number>>(new Set())
  const [localCatchingBalls, setLocalCatchingBalls] = useState<Set<number>>(new Set())
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    return () => {
      timersRef.current.forEach(id => clearTimeout(id))
      timersRef.current.clear()
    }
  }, [])

  const POKEBALL_ICON = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
  const getPixelSprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
  const getPokemonGif = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`

  const handleBallClick = (index: number) => {
    const slot = slots[index]
    const isAnimating = localAnimatingBalls.has(index) || localCatchingBalls.has(index)
    const isReleased = localReleasedBalls.has(index)
    if (!slot?.id || isAnimating) {
      return
    }

    // If already released, catch it back: show ball arc immediately while sprite shrinks
    if (isReleased) {
      setLocalCatchingBalls(prev => new Set(prev).add(index))
      const catchDuration = 700
      const catchTimer = setTimeout(() => {
        timersRef.current.delete(catchTimer)
        setLocalCatchingBalls(prev => { const next = new Set(prev); next.delete(index); return next })
        setLocalReleasedBalls(prev => { const next = new Set(prev); next.delete(index); return next })
        onCatchComplete?.(index)
      }, catchDuration)
      timersRef.current.add(catchTimer)
      return
    }

    // Start local release animation
    setLocalAnimatingBalls(prev => new Set(prev).add(index))
    // Broadcast
    onBallClick?.(index)
    const animationDuration = 1650
    const releaseTimer = setTimeout(() => {
      timersRef.current.delete(releaseTimer)
      setLocalAnimatingBalls(prev => { const next = new Set(prev); next.delete(index); return next })
      setLocalReleasedBalls(prev => new Set(prev).add(index))
      onAnimationComplete?.(index)
    }, animationDuration)
    timersRef.current.add(releaseTimer)
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
    <div className="flex items-center gap-3">
      {pokeballSlots.map((slot, index) => {
        // Combine local and remote animation states
        const isAnimating = localAnimatingBalls.has(index) || remoteAnimatingBalls.has(index)
        const isReleased = localReleasedBalls.has(index) || remoteReleasedBalls.has(index)
        const isCatching = localCatchingBalls.has(index)
        const canClick = slot.filled && !isAnimating && isLocalPlayer
        
        return (
          <div 
            key={index} 
            className={`w-8 h-8 relative ${slot.filled ? '' : 'opacity-30'}`}
          >
            {slot.filled ? (
              <>
                {/* Pokéball - hidden after release */}
                {!isReleased && (
                  <div 
                    className={`ball ${isAnimating ? 'animate' : ''}`}
                    role={canClick ? 'button' : undefined}
                    tabIndex={canClick ? 0 : undefined}
                    onClick={() => canClick && handleBallClick(index)}
                    onKeyDown={(e) => { if (canClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleBallClick(index) } }}
                    style={{ cursor: canClick ? 'pointer' : 'default' }}
                  >
                    <Image 
                      src={POKEBALL_ICON} 
                      alt="Poké Ball" 
                      width={32} 
                      height={32}
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {/* Pokémon sprite - shown after release */}
                {isReleased && (
                  <div 
                    className={`sprite-released ${isCatching ? 'animate-capture-out' : 'animate-scale-in'}`}
                    role={canClick ? 'button' : undefined}
                    tabIndex={canClick ? 0 : undefined}
                    onClick={() => canClick && handleBallClick(index)}
                    onKeyDown={(e) => { if (canClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleBallClick(index) } }}
                    style={{ cursor: canClick ? 'pointer' : 'default', animationDelay: isCatching ? '0.15s' : undefined }}
                  >
                    <Image
                      src={getPokemonGif(slot.id!)}
                      alt={`Pokemon ${slot.id}`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain block"
                      onLoad={() => {}}
                      onError={() => {
                        console.error(`${playerType} Failed to load Pokémon ${slot.id} gif, falling back to sprite`);
                        // Fallback to static sprite if GIF fails
                        const img = document.querySelector(`img[alt="Pokemon ${slot.id}"]`) as HTMLImageElement;
                        if (img) {
                          img.src = getPixelSprite(slot.id!);
                        }
                      }}
                    />
                  </div>
                )}
                {isReleased && isCatching && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className={`absolute inset-0 ${playerType === 'host' ? 'animate-ball-arc-in-left' : 'animate-ball-arc-in-right'}`}>
                      <Image 
                        src={POKEBALL_ICON}
                        alt="Poké Ball"
                        width={32}
                        height={32}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="absolute inset-0 animate-impact-flash" style={{ animationDelay: '0.55s' }}></div>
                  </div>
                )}
              </>
            ) : (
              <Image 
                src={POKEBALL_ICON} 
                alt="Poké Ball" 
                width={32} 
                height={32}
                className="w-full h-full opacity-30"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
