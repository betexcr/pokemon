'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
// Updated responsive sizing for better desktop experience
import Image from 'next/image'
import Link from 'next/link'
import { triggerViewTransition } from './ViewTransitions'
import TransitionLink, { PokedexLink } from './TransitionLink'
import OptimizedLink from './OptimizedLink'
import { Sparkles } from 'lucide-react'
import Tooltip from '@/components/Tooltip'

interface HeaderIconsProps {
  comparisonList?: number[]
  showSidebar?: boolean
  onToggleSidebar?: () => void
  onFiltersClick?: () => void
  className?: string
}

export default function HeaderIcons({
  comparisonList = [],
  showSidebar = false,
  onToggleSidebar,
  onFiltersClick: _onFiltersClick,
  className = ''
}: HeaderIconsProps) {
  const router = useRouter()
  const [openInsights, setOpenInsights] = useState(false)
  const insightsRef = useRef<HTMLDivElement | null>(null)
	const closeInsightsTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!insightsRef.current) return
      const target = e.target as Node
      if (!insightsRef.current.contains(target)) setOpenInsights(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

	// Helpers to make hover more forgiving between button and dropdown
	const openInsightsMenu = () => {
		if (closeInsightsTimeoutRef.current) {
			window.clearTimeout(closeInsightsTimeoutRef.current)
			closeInsightsTimeoutRef.current = null
		}
		setOpenInsights(true)
	}

	const scheduleCloseInsightsMenu = () => {
		if (closeInsightsTimeoutRef.current) {
			window.clearTimeout(closeInsightsTimeoutRef.current)
		}
		closeInsightsTimeoutRef.current = window.setTimeout(() => {
			setOpenInsights(false)
		}, 250)
	}

  const navigate = (path: string) => {
    // Use faster navigation without heavy transitions for header icons
    router.push(path)
    setOpenInsights(false)
  }

  // Advanced Filters trigger removed from headers

  return (
    <>
      {/* Insights Dropdown */}
		<div
			className="relative"
			ref={insightsRef}
			onMouseEnter={openInsightsMenu}
			onMouseLeave={scheduleCloseInsightsMenu}
		>
        <Tooltip content="Access insights and analytics including Top 50, Trends, Type Matchups, Evolutions, Checklist, and Meta data" position="bottom">
          <PokedexLink
            href="/insights"
            transitionType="default"
            className={`group relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 overflow-hidden aspect-square rounded-xl border-2 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none touch-manipulation 
              ${openInsights ? 'border-poke-blue ring-2 ring-poke-blue/30' : 'border-gray-300 dark:border-gray-600'} 
              bg-white/80 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800`}
            aria-haspopup="menu"
            aria-expanded={openInsights}
            aria-label="Open insights menu"
            onClick={() => setOpenInsights(true)}
          >
            <span className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br from-poke-blue/10 via-poke-red/10 to-amber-300/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-1 rounded-lg bg-white/90 dark:bg-white/5" />
            <Sparkles className="relative z-10 h-4 w-4 sm:h-6 sm:w-6 text-poke-blue dark:text-blue-300 group-hover:scale-110 transition-transform" />
          </PokedexLink>
        </Tooltip>
			{openInsights && (
				<div role="menu" className="absolute right-0 mt-2 min-w-64 rounded-xl border bg-white/95 shadow-xl z-50 dark:bg-gray-900/95 dark:border-gray-700 backdrop-blur-sm p-2" onMouseEnter={openInsightsMenu} onMouseLeave={scheduleCloseInsightsMenu}>
          <div className="flex flex-col space-y-1">
            <Tooltip content="View the most popular and powerful Pokémon based on usage statistics and battle performance" position="right">
              <OptimizedLink role="menuitem" href="/top50" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Top 50 Pokémon</OptimizedLink>
            </Tooltip>
            <Tooltip content="Analyze Pokémon usage trends and popularity over time across different regions and generations" position="right">
              <OptimizedLink role="menuitem" href="/trends" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Trends</OptimizedLink>
            </Tooltip>
            <Tooltip content="Explore type effectiveness charts and damage multipliers for strategic battle planning" position="right">
              <OptimizedLink role="menuitem" href="/type-matchups" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Type Matchups</OptimizedLink>
            </Tooltip>
            <Tooltip content="Discover Pokémon evolution chains, requirements, and branching paths" position="right">
              <OptimizedLink role="menuitem" href="/evolutions" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Evolutions</OptimizedLink>
            </Tooltip>
            <Tooltip content="Track your Pokédex completion progress and mark discovered Pokémon" position="right">
              <OptimizedLink role="menuitem" href="/checklist" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Pokédex Checklist</OptimizedLink>
            </Tooltip>
            <Tooltip content="View competitive usage statistics and tier rankings for different battle formats" position="right">
              <OptimizedLink role="menuitem" href="/usage" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => setOpenInsights(false)}>Usage Meta</OptimizedLink>
            </Tooltip>
          </div>
        </div>
        )}
      </div>

      {/* Advanced Filters button removed from headers */}
      
      <Tooltip content="Build and manage your Pokémon team with type coverage analysis and battle strategies" position="bottom">
        <OptimizedLink 
          href="/team"
          priority={true}
          className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16  overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70" 
          title="Team Builder"
        >
          <span className="absolute inset-1 bg-white/90 dark:bg-white/15" />
        <Image 
          src="/header-icons/team_builder.png" 
          alt="" 
          width={48}
          height={48}
          className="relative z-10 w-full h-full object-contain"
        />
        </OptimizedLink>
      </Tooltip>
      
      <Tooltip content="Engage in Pokémon battles with AI opponents and test your team strategies" position="bottom">
        <OptimizedLink 
          href="/battle"
          priority={true}
          className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16  overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70" 
          title="Battles"
        >
          <span className="absolute inset-1 bg-white/90 dark:bg-white/15" />
        <Image 
          src="/header-icons/battle.png" 
          alt="" 
          width={48}
          height={48}
          className="relative z-10 w-full h-full object-contain"
        />
        </OptimizedLink>
      </Tooltip>
      
      <Tooltip content="View the most popular and powerful Pokémon based on usage statistics and battle performance" position="bottom">
        <OptimizedLink 
          href="/top50"
          className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16  overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70" 
          title="Top 50"
        >
          <span className="absolute inset-1 bg-white/90 dark:bg-white/15" />
        <Image 
          src="/header-icons/top50.png" 
          alt="" 
          width={48}
          height={48}
          className="relative z-10 w-full h-full object-contain"
        />
        </OptimizedLink>
      </Tooltip>
      
      <Tooltip content="Compare Pokémon side-by-side to analyze stats, abilities, moves, and type effectiveness" position="bottom">
        <OptimizedLink 
          href="/compare"
          className={`relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16  overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70`}
          title={'Compare'}
        >
          <span className="absolute inset-1 bg-white/90 dark:bg-white/15" />
        <Image 
          src="/header-icons/compare.png" 
          alt="" 
          width={48}
          height={48}
          className="relative z-10 w-full h-full object-contain"
        />
        </OptimizedLink>
      </Tooltip>
    </>
  )
}

// Hamburger Menu Component
interface HamburgerMenuProps {
  onClick: () => void
  className?: string
}

export function HamburgerMenu({ onClick, className = '' }: HamburgerMenuProps) {
  return (
    <Tooltip content="Open mobile navigation menu with all app features and settings" position="bottom">
      <button 
        className={`relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16  overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70 ${className}`}
        onClick={onClick}
        title="Toggle menu"
      >
        <span className="absolute inset-1 bg-white/90 dark:bg-white/15" />
      <Image 
        src="/header-icons/hamburger-menu.png" 
        alt="" 
        width={48}
        height={48}
        className="relative z-10 w-full h-full object-contain"
      />
      </button>
    </Tooltip>
  )
}
