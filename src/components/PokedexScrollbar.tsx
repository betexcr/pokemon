'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'


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
  const [resolvedScrollContainer, setResolvedScrollContainer] = useState<HTMLDivElement | null>(null)
  const [hoverPercentage, setHoverPercentage] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Track mount status to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Resolve scroll container robustly so list mode stays integrated
  useEffect(() => {
    if (scrollContainer) {
      setResolvedScrollContainer(scrollContainer)
      return
    }

    if (typeof document === 'undefined') return

    const fallback = document.querySelector('[data-main-scroll]') as HTMLDivElement | null
    if (fallback) {
      setResolvedScrollContainer(fallback)
    }
  }, [scrollContainer])

  // Update virtual scroll percentage based on loaded Pokemon count
  // This represents position in the FULL Pokemon list (0-100% of total Pokemon)
  useEffect(() => {
    if (!resolvedScrollContainer || totalPokemon === 0) return

    const handleScroll = () => {
      // Calculate what percentage of total Pokemon are currently visible
      // Use loaded Pokemon count vs total as the basis for scroll position
      const scrollTop = resolvedScrollContainer.scrollTop
      const scrollHeight = resolvedScrollContainer.scrollHeight - resolvedScrollContainer.clientHeight
      
      if (scrollHeight <= 0) {
        setVirtualScrollPercentage(0)
        return
      }
      
      // Calculate actual scroll percentage within loaded content
      const actualScrollPercentage = (scrollTop / scrollHeight) * 100
      
      // Convert to virtual percentage based on total Pokemon
      // If we've loaded 200 out of 1025 Pokémon and scrolled to bottom of those 200,
      // we're at about 15% of the total list
      const loadedPercentage = (loadedPokemon / totalPokemon) * 100
      const virtualPercentage = (actualScrollPercentage / 100) * loadedPercentage
      
      setVirtualScrollPercentage(Math.min(100, Math.max(0, virtualPercentage)))
    }

    resolvedScrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial update

    return () => resolvedScrollContainer.removeEventListener('scroll', handleScroll)
  }, [resolvedScrollContainer, loadedPokemon, totalPokemon])

  // Calculate Pokemon index based on virtual scroll position
  const estimatedPokemonIndex = Math.floor((virtualScrollPercentage / 100) * totalPokemon)
  const hoverPokemonIndex = hoverPercentage === null
    ? null
    : Math.floor((hoverPercentage / 100) * totalPokemon)

  // Load Pokemon up to a specific index and scroll to that position
  const loadAndScrollToIndex = useCallback(async (targetIndex: number) => {
    if (!resolvedScrollContainer) return

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const ensureTargetPokemonVisible = () => {
      const targetPokemonId = targetIndex + 1
      const targetElement = resolvedScrollContainer.querySelector(`[data-pokemon-id="${targetPokemonId}"]`) as HTMLElement | null
      if (!targetElement) return false

      const containerRect = resolvedScrollContainer.getBoundingClientRect()
      const targetRect = targetElement.getBoundingClientRect()
      const elementOffsetTop = targetRect.top - containerRect.top + resolvedScrollContainer.scrollTop
      const centeredScrollTop = elementOffsetTop - (resolvedScrollContainer.clientHeight / 2) + (targetElement.clientHeight / 2)

      resolvedScrollContainer.scrollTo({
        top: Math.max(0, centeredScrollTop),
        behavior: 'smooth'
      })

      return true
    }
    
    // If target index is beyond loaded Pokemon, we need to load more first
    if (targetIndex >= loadedPokemon && hasMorePokemon) {
      setIsLoading(true)
      try {
        // Snapshot scrollHeight before loading so we can detect when the DOM updates
        const scrollHeightBefore = resolvedScrollContainer.scrollHeight

        // Load to that position if callback provided
        if (onJumpToPosition) {
          await onJumpToPosition(targetIndex)
        } else if (onLoadToEnd && targetIndex >= totalPokemon - 1) {
          // If jumping near the end, just load everything
          await onLoadToEnd()
        }

        // Poll until scrollHeight has grown (virtualizer re-rendered with new rows)
        // and then stabilized for two consecutive checks (~100ms), ensuring we read
        // the final layout height rather than an intermediate stale value.
        let prevScrollHeight = resolvedScrollContainer.scrollHeight
        let stableCount = 0
        let noGrowthCount = 0
        for (let attempt = 0; attempt < 40; attempt++) {
          await wait(50)
          const currentScrollHeight = resolvedScrollContainer.scrollHeight
          if (currentScrollHeight > scrollHeightBefore) {
            noGrowthCount = 0
            if (currentScrollHeight === prevScrollHeight) {
              stableCount++
              if (stableCount >= 2) break
            } else {
              stableCount = 0
            }
            prevScrollHeight = currentScrollHeight
          } else {
            // scrollHeight hasn't grown yet; bail out after ~300ms with no growth
            noGrowthCount++
            if (noGrowthCount >= 6) break
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    // If target card is rendered, align directly to it for precise jumps
    if (ensureTargetPokemonVisible()) {
      return
    }
    
    // Rough-position the viewport near the target row.
    // Use 'instant' so the virtualizer immediately re-renders rows at the new
    // scroll position rather than waiting for a smooth animation to finish.
    const effectiveLoadedPokemon = Math.max(loadedPokemon, targetIndex + 1)
    const targetPercentageOfLoaded = Math.min(100, (targetIndex / effectiveLoadedPokemon) * 100)
    const scrollHeight = resolvedScrollContainer.scrollHeight - resolvedScrollContainer.clientHeight
    const targetScrollTop = (targetPercentageOfLoaded / 100) * scrollHeight
    
    resolvedScrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'instant'
    })

    // Second-pass: wait for the virtualizer to render rows near the new scroll
    // position, then snap precisely to the target Pokémon's DOM element.
    for (let attempt = 0; attempt < 8; attempt++) {
      await wait(100)
      if (ensureTargetPokemonVisible()) {
        break
      }
    }
  }, [resolvedScrollContainer, loadedPokemon, totalPokemon, hasMorePokemon, onJumpToPosition, onLoadToEnd])

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
          if (resolvedScrollContainer) {
            resolvedScrollContainer.scrollTo({
              top: resolvedScrollContainer.scrollHeight,
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
  }, [hasMorePokemon, onLoadToEnd, scrollToPercentage, resolvedScrollContainer])

  // Handle track click to jump to position
  const handleTrackClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDragging) return

    // Prefer hoverPercentage since it's exactly what the preview tooltip shows
    if (hoverPercentage !== null) {
      await scrollToPercentage(hoverPercentage)
      return
    }

    const rect = trackRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const percentage = (clickY / rect.height) * 100
    
    await scrollToPercentage(percentage)
  }, [isDragging, scrollToPercentage, hoverPercentage])

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
  const isEnabled = isMounted && !!resolvedScrollContainer

  return (
    <div 
      className="fixed -right-px top-14 sm:top-16 lg:top-[4.5rem] xl:top-20 bottom-0 w-24 flex flex-col items-center gap-2 z-40 bg-transparent pointer-events-none"
      style={{ opacity: isEnabled ? 1 : 0.5 }}
    >
      <div className="flex-1 w-full pr-2 flex flex-col items-end pt-4 pb-2" style={{ pointerEvents: isEnabled ? 'auto' : 'none' }}>
        {/* Scrollbar Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseEnter={() => {
            if (hoverPercentage === null) {
              setHoverPercentage(virtualScrollPercentage)
            }
          }}
          onMouseMove={(e) => {
            if (!trackRef.current) return
            const rect = trackRef.current.getBoundingClientRect()
            const y = e.clientY - rect.top
            const percentage = Math.min(100, Math.max(0, (y / rect.height) * 100))
            setHoverPercentage(percentage)
          }}
          onMouseLeave={() => setHoverPercentage(null)}
          className="group flex-1 w-3 bg-gray-300 dark:bg-gray-700 rounded-full relative cursor-pointer hover:w-4 transition-all shadow-inner"
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
          className="absolute right-full mr-8 min-w-[3.5rem] bg-poke-blue text-white text-[11px] font-semibold tabular-nums leading-none text-center px-2.5 py-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ 
            top: `${virtualScrollPercentage}%`, 
            transform: 'translateY(-50%)'
          }}
        >
          #{estimatedPokemonIndex + 1}
        </div>

        {/* Hover jump preview indicator */}
        {hoverPercentage !== null && hoverPokemonIndex !== null && (
          <div
            className="absolute right-full mr-8 min-w-[3.5rem] bg-black/90 text-white text-[11px] font-semibold tabular-nums leading-none text-center px-2.5 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/30"
            style={{
              top: `${hoverPercentage}%`,
              transform: 'translateY(-50%)'
            }}
          >
            #{Math.min(totalPokemon, Math.max(1, hoverPokemonIndex + 1))}
          </div>
        )}
        </div>

      </div>


    </div>
  )
}
