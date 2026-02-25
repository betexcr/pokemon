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
  const [virtualScrollPercentage, setVirtualScrollPercentage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Update virtual scroll percentage based on loaded Pokemon count
  // This represents position in the FULL Pokemon list (0-100% of total Pokemon)
  useEffect(() => {
    if (!scrollContainer || totalPokemon === 0) return

    const handleScroll = () => {
      // Calculate what percentage of total Pokemon are currently visible
      // Use loaded Pokemon count vs total as the basis for scroll position
      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
      
      if (scrollHeight <= 0) {
        setVirtualScrollPercentage(0)
        return
      }
      
      // Calculate actual scroll percentage within loaded content
      const actualScrollPercentage = (scrollTop / scrollHeight) * 100
      
      // Convert to virtual percentage based on total Pokemon
      // If we've loaded 200 out of 1302 Pokemon and scrolled to bottom of those 200,
      // we're at about 15% of the total list
      const loadedPercentage = (loadedPokemon / totalPokemon) * 100
      const virtualPercentage = (actualScrollPercentage / 100) * loadedPercentage
      
      setVirtualScrollPercentage(Math.min(100, Math.max(0, virtualPercentage)))
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial update

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainer, loadedPokemon, totalPokemon])

  // Calculate Pokemon index based on virtual scroll position
  const estimatedPokemonIndex = Math.floor((virtualScrollPercentage / 100) * totalPokemon)

  // Load Pokemon up to a specific index and scroll to that position
  const loadAndScrollToIndex = useCallback(async (targetIndex: number) => {
    if (!scrollContainer) return
    
    // If target index is beyond loaded Pokemon, we need to load more first
    if (targetIndex >= loadedPokemon && hasMorePokemon) {
      setIsLoading(true)
      try {
        // Load to that position if callback provided
        if (onJumpToPosition) {
          await onJumpToPosition(targetIndex)
        } else if (onLoadToEnd && targetIndex >= totalPokemon - 1) {
          // If jumping near the end, just load everything
          await onLoadToEnd()
        }
        
        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 100))
      } finally {
        setIsLoading(false)
      }
    }
    
    // Calculate scroll position as percentage of loaded content
    const targetPercentageOfLoaded = Math.min(100, (targetIndex / loadedPokemon) * 100)
    const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
    const targetScrollTop = (targetPercentageOfLoaded / 100) * scrollHeight
    
    scrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }, [scrollContainer, loadedPokemon, totalPokemon, hasMorePokemon, onJumpToPosition, onLoadToEnd])

  // Scroll to specific percentage of total Pokemon list
  const scrollToPercentage = useCallback(async (percentage: number) => {
    const targetIndex = Math.floor((percentage / 100) * totalPokemon)
    await loadAndScrollToIndex(targetIndex)
  }, [totalPokemon, loadAndScrollToIndex])

  // Jump to specific Pokemon index
  const jumpToPokemon = useCallback(async (index: number) => {
    await loadAndScrollToIndex(index)
  }, [loadAndScrollToIndex])

  // Jump to end and load all Pokemon
  const jumpToEnd = useCallback(async () => {
    if (onLoadToEnd && hasMorePokemon) {
      setIsLoading(true)
      try {
        await onLoadToEnd()
        // After loading, scroll to bottom
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            })
          }
        }, 100)
      } finally {
        setIsLoading(false)
      }
    } else {
      await scrollToPercentage(100)
    }
  }, [hasMorePokemon, onLoadToEnd, scrollToPercentage, scrollContainer])

  // Handle track click to jump to position
  const handleTrackClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDragging) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const percentage = (clickY / rect.height) * 100
    
    await scrollToPercentage(percentage)
  }, [isDragging, scrollToPercentage])

  // Handle thumb drag
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging || !trackRef.current) return

    const handleMouseMove = async (e: MouseEvent) => {
      if (!trackRef.current) return
      
      const rect = trackRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const percentage = Math.min(100, Math.max(0, (y / rect.height) * 100))
      
      // Update visual position immediately for responsiveness
      setVirtualScrollPercentage(percentage)
    }

    const handleMouseUp = async () => {
      setIsDragging(false)
      // When drag ends, load Pokemon if needed and scroll to final position
      await scrollToPercentage(virtualScrollPercentage)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, virtualScrollPercentage, scrollToPercentage])

  if (!scrollContainer) return null

  return (
    <div className="absolute right-2 top-2 bottom-2 w-12 flex flex-col items-center gap-2 z-40">
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
          style={{ height: `${virtualScrollPercentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-6 h-8 bg-white dark:bg-gray-800 border-2 border-poke-blue rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-all flex items-center justify-center"
          style={{ top: `${virtualScrollPercentage}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleThumbMouseDown}
        >
          <div className="w-1 h-3 bg-poke-blue rounded-full" />
        </div>

        {/* Position Indicator */}
        <div
          className="absolute left-full ml-2 bg-poke-blue text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{ 
            top: `${virtualScrollPercentage}%`, 
            transform: 'translateY(-50%)',
            opacity: isDragging || virtualScrollPercentage > 0 ? 1 : 0,
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
