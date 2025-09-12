'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Users, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import HeaderIcons, { HamburgerMenu } from '@/components/HeaderIcons'

interface MobileHeaderProps {
  theme: string
  pokemonCount: number
  density: 'cozy' | 'compact' | 'ultra' | 'list'
  onDensityChange: (density: 'cozy' | 'compact' | 'ultra' | 'list') => void
}

export default function MobileHeader({ 
  theme, 
  pokemonCount, 
  density, 
  onDensityChange 
}: MobileHeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleTeamClick = () => {
    router.push('/team')
    setIsMenuOpen(false)
  }

  const handleBattleClick = () => {
    router.push('/battle')
    setIsMenuOpen(false)
  }

  const handleCompareClick = () => {
    router.push('/compare')
    setIsMenuOpen(false)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleFiltersClick = () => {
    // TODO: Implement filters functionality
    console.log('Advanced filters clicked')
  }

  const renderProfilePicture = () => {
    if (!user) {
      // Show profile placeholder when logged off
      return (
        <button 
          className="w-16 h-16 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
          style={{
            borderColor: 'var(--color-border)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          title="Sign In"
        >
          <Image 
            src="/profile-placeholder.png" 
            alt="Profile Placeholder" 
            width={64} 
            height={64} 
            className="w-full h-full rounded-full object-cover" 
            style={{ borderRadius: '50%' }}
          />
        </button>
      );
    }

    const src = user?.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : undefined;
    const name = user?.displayName || 'User';
    
    if (src && !imageError) {
      return (
        <button 
          className="w-16 h-16 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
          style={{
            borderColor: 'var(--color-border)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          title={name}
        >
          <Image 
            src={src} 
            alt={name} 
            width={64} 
            height={64} 
            className="w-full h-full rounded-full object-cover" 
            style={{ borderRadius: '50%' }}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        </button>
      );
    }
    
    const initial = name.trim().charAt(0).toUpperCase();
    return (
      <button 
        className="w-8 h-8 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
        style={{
          borderColor: 'var(--color-border)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          minWidth: '32px',
          minHeight: '32px',
          maxWidth: '32px',
          maxHeight: '32px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-muted)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
        title={name}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-poke-blue to-poke-red flex items-center justify-center text-white font-semibold">
          {initial}
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-border bg-surface`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <Zap className={`h-8 w-8 ${
                theme === 'gold' ? 'text-gold-accent' 
                : theme === 'green' ? 'text-green-accent'
                : theme === 'red' ? 'text-red-accent'
                : theme === 'ruby' ? 'text-ruby-accent'
                : 'text-poke-yellow'
              }`} />
              <h1 className={`text-xl sm:text-2xl font-bold ${
                theme === 'gold' ? 'font-retro text-gold-accent'
                : theme === 'green' ? 'font-gameboy text-green-accent'
                : theme === 'red' ? 'font-retro text-red-accent'
                : theme === 'ruby' ? 'font-retro text-ruby-accent'
                : 'text-text'
              }`}>
                PokéDex
              </h1>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-muted">
                {pokemonCount} Pokémon discovered
              </span>
              
              {/* Density Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted">Density:</span>
                <div className="flex bg-surface rounded-lg p-1">
                  {(['cozy', 'compact', 'ultra'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => onDensityChange(d)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        density === d
                          ? 'bg-poke-blue text-white'
                          : 'text-muted hover:text-text hover:bg-white/50'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* PokéDex Toolbar */}
              <HeaderIcons onFiltersClick={handleFiltersClick} />

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button and Profile Picture - Only visible on mobile */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Profile Picture - Always render to prevent pop-up */}
              {renderProfilePicture()}
              
              {/* Hamburger Menu Button */}
              <HamburgerMenu onClick={toggleMenu} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Only visible on mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1 mobile-menu-scroll">
              {/* Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text">Menu</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="h-5 w-5 text-text" />
                </button>
              </div>

              {/* Pokemon Count */}
              <div className="mb-6 p-3 bg-white/50 rounded-lg">
                <p className="text-sm text-muted">
                  {pokemonCount} Pokémon discovered
                </p>
              </div>

              {/* Density Controls */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text mb-3">Display Density</h3>
                <div className="space-y-2">
                  {(['cozy', 'compact', 'ultra'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        onDensityChange(d)
                        closeMenu()
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        density === d
                          ? 'bg-poke-blue text-white'
                          : 'bg-white/50 text-text hover:bg-white/70'
                      }`}
                    >
                      <span className="font-medium capitalize">{d}</span>
                      <p className="text-xs opacity-75 mt-1">
                        {d === 'cozy' && 'Larger cards with more spacing'}
                        {d === 'compact' && 'Medium cards with balanced spacing'}
                        {d === 'ultra' && 'Small cards with minimal spacing'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text mb-3">Navigation</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleTeamClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/team_builder.png" 
                      alt="Team Builder" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Team Builder</span>
                  </button>
                  <button
                    onClick={handleBattleClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/battle.png" 
                      alt="Battles" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Battles</span>
                  </button>
                  <button
                    onClick={handleCompareClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/compare.png" 
                      alt="Compare" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Compare</span>
                  </button>
                  <button
                    onClick={handleFiltersClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/advanced_filters.png" 
                      alt="Advanced Filters" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Advanced Filters</span>
                  </button>
                </div>
              </div>

              {/* Theme Controls */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text mb-3">Appearance</h3>
                <div className="p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted text-center">
                  Modern PokéDex Application
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
