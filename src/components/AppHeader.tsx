'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import HeaderIcons from '@/components/HeaderIcons'
import { useAuth } from '@/contexts/AuthContext'

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
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const avatarRef = useRef<HTMLButtonElement | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [imageError, setImageError] = useState(false)

  const handleBack = () => {
    if (backLink) router.push(backLink)
  }

  const openMenuAtAvatar = () => {
    const btn = avatarRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const MENU_WIDTH = 200
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const margin = 8
    const computedLeft = Math.min(
      Math.max(margin, rect.right - MENU_WIDTH),
      viewportWidth - MENU_WIDTH - margin
    )
    const computedTop = rect.bottom + margin
    setMenuPos({ top: computedTop, left: computedLeft })
    setMenuOpen((v) => !v)
  }

  const renderProfilePicture = () => {
    if (!user) {
      return (
        <button ref={avatarRef} className="pk-btn-profile" title="Sign In" onClick={openMenuAtAvatar}>
          <Image 
            src="/profile-placeholder.png" 
            alt="Profile Placeholder" 
            width={32} 
            height={32} 
            className="w-full h-full rounded-full object-cover" 
          />
        </button>
      )
    }

    const src = user.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : undefined
    const name = user.displayName || 'User'

    if (src && !imageError) {
      return (
        <button ref={avatarRef} className="pk-btn-profile" title={name} onClick={openMenuAtAvatar}>
          <Image 
            src={src} 
            alt={name} 
            width={32} 
            height={32} 
            className="w-full h-full rounded-full object-cover" 
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        </button>
      )
    }

    const initial = name.trim().charAt(0).toUpperCase()
    return (
      <button ref={avatarRef} className="pk-btn-profile" title={name} onClick={openMenuAtAvatar}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-poke-blue to-poke-red flex items-center justify-center text-white font-semibold">
          {initial}
        </div>
      </button>
    )
  }

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (menuOpen && menuRef.current && !target.closest('[data-profile-menu]')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

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
                <h2 className="text-lg lg:text-xl font-bold text-poke-blue dark:bg-gradient-to-r dark:from-poke-blue dark:via-poke-red dark:to-poke-blue dark:bg-clip-text dark:text-transparent">
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

          <div className="flex items-center space-x-6 min-w-0 flex-shrink-0" data-profile-menu ref={menuRef}>
            {showThemeToggle && (
              <ThemeToggle />
            )}
            {showToolbar && (
              <div className="pk-toolbar">
                <HeaderIcons 
                  comparisonList={comparisonList}
                  showSidebar={showSidebar}
                  onFiltersClick={onToggleSidebar}
                />
              </div>
            )}
            {rightContent}
            <div className="relative">
              {renderProfilePicture()}
              {menuOpen && (
                <div className="fixed z-50 bg-white dark:bg-white text-text border border-border rounded-lg shadow-xl min-w-[180px] max-w-[90vw]"
                     style={{ top: menuPos.top, left: menuPos.left, width: 200 }}>
                  <ul className="py-2">
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-white/60"
                        onClick={() => {
                          setMenuOpen(false)
                          void logout()
                        }}
                      >
                        Log out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


