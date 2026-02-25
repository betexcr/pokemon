'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react'

interface PokedexScrollbarProps {
  scrollContainer: HTMLDivElement | null
  totalPokemon: number
  loadedPokemon: number
  hasMorePokemon?: boolean
  onJumpToPosition?: (pokemonIndex: number) => Promise<void>
  onLoadToEnd?: () => Promise<void>
}

export default function PokedexScrollbar({
  scrollContainer,
  totalPokemon,
  loadedPokemon,
  hasMorePokemon = false,
  onJumpToPosition,
  onLoadToEnd
}: PokedexScrollbarProps) {
  const [scrollPercentage, setScrollPercentage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Update scroll percentage when scrolling
  useEffect(() => {
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
      const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setScrollPercentage(Math.min(100, Math.max(0, percentage)))
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial update

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainer])

  // Calculate estimated Pokemon index based on scroll position
  const estimatedPokemonIndex = Math.floor((scrollPercentage / 100) * loadedPokemon)

  // Scroll to specific percentage
  const scrollToPercentage = useCallback((percentage: number) => {
    if (!scrollContainer) return
    
    const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
    const targetScrollTop = (percentage / 100) * scrollHeight
    
    scrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }, [scrollContainer])

  // Jump to specific Pokemon index
  const jumpToPokemon = useCallback(async (index: number) => {
    if (onJumpToPosition) {
      setIsLoading(true)
      try {
        await onJumpToPosition(index)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Fallback: scroll to estimated position
      const percentage = (index / loadedPokemon) * 100
      scrollToPercentage(percentage)
    }
  }, [loadedPokemon, onJumpToPosition, scrollToPercentage])

  // Jump to end and load all Pokemon
  const jumpToEnd = useCallback(async () => {
    if (onLoadToEnd && hasMorePokemon) {
      setIsLoading(true)
      try {
        await onLoadToEnd()
        // After loading, scroll to bottom
        setTimeout(() => {
          scrollToPercentage(100)
        }, 100)
      } finally {
        setIsLoading(false)
      }
    } else {
      scrollToPercentage(100)
    }
  }, [hasMorePokemon, onLoadToEnd, scrollToPercentage])

  // Handle track click to jump to position
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDragging) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const percentage = (clickY / rect.height) * 100
    
    scrollToPercentage(percentage)
  }, [isDragging, scrollToPercentage])

  // Handle thumb drag
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging || !trackRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return
      
      const rect = trackRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const percentage = Math.min(100, Math.max(0, (y / rect.height) * 100))
      
      scrollToPercentage(percentage)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, scrollToPercentage])

  if (!scrollContainer) return null

  return (
    <div className="fixed right-4 top-24 bottom-24 w-12 flex flex-col items-center gap-2 z-50">
      {/* Jump to Top */}
      <button
        onClick={() => scrollToPercentage(0)}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-poke-blue shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump to top"
      >
        <ChevronsUp className="w-5 h-5 text-poke-blue" />
      </button>

      {/* Scrollbar Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="flex-1 w-3 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer hover:w-4 transition-all shadow-inner"
      >
        {/* Progress Track */}
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-poke-blue to-poke-blue/50 rounded-full transition-all"
          style={{ height: `${scrollPercentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-6 h-8 bg-white dark:bg-gray-800 border-2 border-poke-blue rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-all flex items-center justify-center"
          style={{ top: `${scrollPercentage}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleThumbMouseDown}
        >
          <div className="w-1 h-3 bg-poke-blue rounded-full" />
        </div>

        {/* Position Indicator */}
        <div
          className="absolute left-full ml-2 bg-poke-blue text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{ 
            top: `${scrollPercentage}%`, 
            transform: 'translateY(-50%)',
            opacity: isDragging || scrollPercentage > 0 ? 1 : 0,
            transition: 'opacity 0.2s'
          }}
        >
          #{estimatedPokemonIndex + 1}
        </div>
      </div>

      {/* Jump to Bottom / Load All */}
      <button
        onClick={jumpToEnd}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-poke-red shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative"
        title={hasMorePokemon ? "Load all & jump to end" : "Jump to bottom"}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-poke-red border-t-transparent rounded-full animate-spin" />
        ) : (
          <ChevronsDown className="w-5 h-5 text-poke-red" />
        )}
        {hasMorePokemon && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-poke-red rounded-full animate-pulse" />
        )}
      </button>

      {/* Info Display */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-center shadow-lg">
        <div className="font-bold text-poke-blue">{loadedPokemon}</div>
        <div className="text-gray-500 dark:text-gray-400">of {totalPokemon}</div>
        {hasMorePokemon && (
          <div className="text-poke-red text-[10px] mt-1">More available</div>
        )}
      </div>
    </div>
  )
}
