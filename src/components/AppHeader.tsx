'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import HeaderIcons from '@/components/HeaderIcons'
import UserDropdown from '@/components/UserDropdown'
import { getHeaderIcon, getPageIconKey } from '@/lib/headerIcons'
import { triggerViewTransition } from '@/components/ViewTransitions'
import Tooltip from '@/components/Tooltip'

interface AppHeaderProps {
  title?: string
  subtitle?: string | ReactNode
  backLink?: string
  backLabel?: string
  comparisonList?: number[]
  showSidebar?: boolean
  onToggleSidebar?: () => void
  rightContent?: ReactNode
  showToolbar?: boolean
  showThemeToggle?: boolean
  iconKey?: string
  showIcon?: boolean
  onBackClick?: () => void
}

export default function AppHeader({
  title = 'PokéDex',
  subtitle,
  backLink,
  backLabel = 'Back',
  comparisonList = [],
  showSidebar = false,
  onToggleSidebar,
  rightContent,
  showToolbar = true,
  showThemeToggle = true,
  iconKey,
  showIcon = true,
  onBackClick
}: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Determine icon to use
  const effectiveIconKey = iconKey || getPageIconKey(pathname)
  const iconConfig = getHeaderIcon(effectiveIconKey)
  const IconComponent = iconConfig.icon

  const handleBack = (event?: React.MouseEvent) => {
    // Handle middle click (button 1) or Ctrl+click for new tab
    if (event && (event.button === 1 || event.ctrlKey || event.metaKey)) {
      // Let the browser handle the middle click or Ctrl+click to open in new tab
      return
    }

    // Prevent default for left click to handle transition
    if (event) {
      event.preventDefault()
    }

    if (onBackClick) {
      // Use custom back handler if provided
      onBackClick()
    } else if (backLink) {
      // Use reverse transition for back navigation
      const currentPage = pathname
      const isFromPokemonPage = currentPage.startsWith('/pokemon/')
      const isFromBattlePage = currentPage.startsWith('/battle')
      const isFromComparePage = currentPage.startsWith('/compare')
      const isFromTeamPage = currentPage.startsWith('/team')
      
      let transitionType: 'pokeball' | 'battle-flash' | 'pokedex-swipe' | 'pokedex-swipe-inverted' | 'tile-flip' | 'default' = 'default'
      
      if (isFromPokemonPage) transitionType = 'pokeball'
      else if (isFromBattlePage) transitionType = 'pokedex-swipe-inverted'
      else if (isFromComparePage) transitionType = 'pokedex-swipe-inverted'
      else if (isFromTeamPage) transitionType = 'pokedex-swipe-inverted'
      
      triggerViewTransition(transitionType, () => {
        router.push(backLink)
      })
    }
  }




  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-surface via-surface to-surface border-b border-border shadow-lg" suppressHydrationWarning>
      <div className="w-full max-w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-16 lg:h-18 xl:h-20 py-1 sm:py-2 md:py-3 list-none min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
            {backLink && (
              <Tooltip content={`Go back to ${backLabel}`} position="bottom">
                <a
                  href={backLink}
                  onClick={handleBack}
                  onMouseDown={(e) => {
                    // Handle middle click
                    if (e.button === 1) {
                      e.preventDefault()
                      window.open(backLink, '_blank')
                    }
                  }}
                  className="flex items-center text-muted hover:text-text transition-colors flex-shrink-0 cursor-pointer"
                  title={backLabel}
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </Tooltip>
            )}
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
              {showIcon && (
                <Tooltip content={`Current page: ${title}`} position="bottom">
                  <div className={`p-1 sm:p-2 rounded-lg flex-shrink-0 ${iconConfig.bgColor} ${iconConfig.color} dark:${iconConfig.darkBgColor} dark:${iconConfig.darkColor}`}>
                    {/* Icon is purely decorative */}
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  </div>
                </Tooltip>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-poke-blue dark:bg-gradient-to-r dark:from-poke-blue dark:via-poke-red dark:to-poke-blue dark:bg-clip-text dark:text-transparent truncate" style={{ fontFamily: 'Pokemon Solid, sans-serif' }}>
                  {title}
                </h2>
                {subtitle ? (
                  <span className="text-xs text-muted font-medium hidden sm:block truncate dark:text-gray-300">
                    {subtitle}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 min-w-0 flex-shrink-0">
            {(showToolbar) && (
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                {showToolbar && (
                  <HeaderIcons 
                    comparisonList={comparisonList}
                    showSidebar={showSidebar}
                    onFiltersClick={onToggleSidebar}
                  />
                )}
              </div>
            )}
            {rightContent}
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}


