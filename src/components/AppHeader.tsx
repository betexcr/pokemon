'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import HeaderIcons from '@/components/HeaderIcons'
import UserDropdown from '@/components/UserDropdown'

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
  showThemeToggle = true
}: AppHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backLink) router.push(backLink)
  }




  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-surface via-surface to-surface border-b border-border shadow-lg">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24 py-3 list-none min-w-0">
          <div className="flex items-center space-x-3 lg:space-x-6 min-w-0">
            {backLink && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
                title={backLabel}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium text-text hidden sm:inline">{backLabel}</span>
              </button>
            )}
            <div className="flex items-center space-x-2 lg:space-x-3 mx-auto">
              <div className="flex flex-col">
                <h2 className="text-lg lg:text-xl font-bold text-poke-blue dark:bg-gradient-to-r dark:from-poke-blue dark:via-poke-red dark:to-poke-blue dark:bg-clip-text dark:text-transparent" style={{ fontFamily: 'Pokemon Solid, sans-serif', color: 'var(--color-poke-blue) !important' }}>
                  {title}
                </h2>
                {subtitle ? (
                  <span className="text-xs text-muted font-medium hidden sm:block truncate">
                    {subtitle}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 min-w-0 flex-shrink-0">
            {showThemeToggle && (
              <ThemeToggle />
            )}
            {showToolbar && (
              <div className="flex items-center space-x-2">
                <HeaderIcons 
                  comparisonList={comparisonList}
                  showSidebar={showSidebar}
                  onFiltersClick={onToggleSidebar}
                />
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


