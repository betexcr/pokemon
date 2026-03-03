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
  const [isMounted, setIsMounted] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Track mount status to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // Don't return null - always show the scrollbar UI
  // Just disable interactive features if scrollContainer is not available
  const isEnabled = isMounted && !!scrollContainer

  return (
    <div 
      className="fixed right-0 top-20 bottom-3 w-10 flex flex-col items-center gap-2 z-40 rounded-2xl border border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md"
      style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}
    >
      {/* Jump to Top */}
      <button
        onClick={() => scrollToPercentage(0)}
        disabled={isLoading}
        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-poke-blue/30 shadow-sm hover:shadow-md hover:border-poke-blue/60 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump to top"
      >
        <ChevronsUp className="w-4 h-4 text-poke-blue" />
      </button>

      {/* Scrollbar Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="flex-1 w-3 bg-gray-300 dark:bg-gray-700 rounded-full relative cursor-pointer hover:w-4 transition-all shadow-inner"
      >
        {/* Progress Track */}
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-poke-blue to-poke-blue/60 rounded-full transition-all"
          style={{ height: `${virtualScrollPercentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-7 h-8 bg-white dark:bg-gray-800 border-2 border-poke-blue rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-all flex items-center justify-center"
          style={{ top: `${virtualScrollPercentage}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleThumbMouseDown}
        >
          <div className="w-1.5 h-4 bg-poke-blue rounded-full" />
        </div>

        {/* Position Indicator */}
        <div
          className="absolute right-full mr-8 bg-poke-blue text-white text-[11px] px-3 py-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none border border-white/20"
          style={{ 
            top: `${virtualScrollPercentage}%`, 
            transform: 'translateY(-50%)'
          }}
        >
          #{estimatedPokemonIndex + 1}
        </div>
      </div>

      {/* Jump to Bottom / Load All */}
      <button
        onClick={jumpToEnd}
        disabled={isLoading}
        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-poke-red/30 shadow-sm hover:shadow-md hover:border-poke-red/60 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative"
        title={hasMorePokemon ? "Load all & jump to end" : "Jump to bottom"}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-poke-red border-t-transparent rounded-full animate-spin" />
        ) : (
          <ChevronsDown className="w-4 h-4 text-poke-red" />
        )}
        {hasMorePokemon && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-poke-red rounded-full animate-pulse" />
        )}
      </button>


    </div>
  )
}
