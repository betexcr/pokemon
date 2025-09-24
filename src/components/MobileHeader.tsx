'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Users, Menu, X, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import HeaderIcons, { HamburgerMenu } from '@/components/HeaderIcons'
import AuthModal from './auth/AuthModal'
import Tooltip from '@/components/Tooltip'

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
  const [showAuthModal, setShowAuthModal] = useState(false)

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

  const handleTop50Click = () => {
    router.push('/top50')
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
      // Show profile placeholder when logged off with sign in functionality
      return (
        <Tooltip content="Sign in to save your progress, sync across devices, and access premium features" position="bottom">
          <button 
            onClick={() => {
              console.log('Mobile profile picture clicked, opening AuthModal');
              setShowAuthModal(true);
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 touch-manipulation" 
            style={{
              borderColor: 'var(--color-border)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              maxWidth: '40px',
              maxHeight: '40px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
            title="Sign In / Sign Up"
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
        </Tooltip>
      );
    }

    const src = user?.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : undefined;
    const name = user?.displayName || 'User';
    
    if (src && !imageError) {
      return (
        <Tooltip content={`Signed in as ${name} - Click to access account settings`} position="bottom">
          <button 
            className="w-16 h-16 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation" 
            style={{
              borderColor: 'var(--color-border)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              maxWidth: '40px',
              maxHeight: '40px',
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
        </Tooltip>
      );
    }
    
    const initial = name.trim().charAt(0).toUpperCase();
    return (
      <Tooltip content={`Signed in as ${name} - Click to access account settings`} position="bottom">
        <button 
          className="w-16 h-16 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation" 
          style={{
            borderColor: 'var(--color-border)',
            borderRadius: '50%',
            width: '72px',
            height: '72px',
            minWidth: '72px',
            minHeight: '72px',
            maxWidth: '72px',
            maxHeight: '72px',
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
      </Tooltip>
    );
  }

  return (
    <>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-border bg-surface`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Title */}
            <Tooltip content="Modern PokéDex - Your comprehensive Pokémon database and battle companion" position="bottom">
              <div className="flex items-center space-x-2">
                <Zap className={`h-6 w-6 sm:h-8 sm:w-8 ${
                  theme === 'gold' ? 'text-gold-accent' 
                  : theme === 'green' ? 'text-green-accent'
                  : theme === 'red' ? 'text-red-accent'
                  : theme === 'ruby' ? 'text-ruby-accent'
                  : 'text-poke-yellow'
                }`} />
                <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  theme === 'gold' ? 'font-retro text-gold-accent'
                  : theme === 'green' ? 'font-gameboy text-green-accent'
                  : theme === 'red' ? 'font-retro text-red-accent'
                  : theme === 'ruby' ? 'font-retro text-ruby-accent'
                  : 'text-text'
                }`}>
                  PokéDex
                </h1>
              </div>
            </Tooltip>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <Tooltip content={`You have discovered ${pokemonCount} Pokémon in your PokéDex collection`} position="bottom">
                <span className="text-sm text-muted">
                  {pokemonCount} Pokémon discovered
                </span>
              </Tooltip>
              
              {/* Density Controls */}
              <div className="flex items-center space-x-2">
                <Tooltip content="Adjust the display density of Pokémon cards" position="bottom">
                  <span className="text-sm text-muted">Density:</span>
                </Tooltip>
                <div className="flex bg-surface rounded-lg p-1">
                  {(['cozy', 'compact', 'ultra'] as const).map((d) => (
                    <Tooltip 
                      key={d}
                      content={
                        d === 'cozy' ? 'Larger cards with more spacing for better readability' :
                        d === 'compact' ? 'Medium cards with balanced spacing' :
                        'Small cards with minimal spacing for maximum content'
                      } 
                      position="bottom"
                    >
                      <button
                        onClick={() => onDensityChange(d)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          density === d
                            ? 'bg-poke-blue text-white'
                            : 'text-muted hover:text-text hover:bg-white/50'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* PokéDex Toolbar */}
              <HeaderIcons onFiltersClick={handleFiltersClick} />
            </div>

            {/* Mobile Menu Button and Profile Picture - Only visible on mobile */}
            <div className="md:hidden flex items-center space-x-2">
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
                      alt="" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Team Builder</span>
                  </button>
                  <button
                    onClick={handleTop50Click}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/top50.png" 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Top 50 Pokémon</span>
                  </button>
                  <button
                    onClick={handleBattleClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/50 text-text hover:bg-white/70 transition-colors"
                  >
                    <Image 
                      src="/header-icons/battle.png" 
                      alt="" 
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
                      alt="" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span className="font-medium">Compare</span>
                  </button>
              {/* Advanced Filters button removed from mobile menu */}
                </div>
              </div>

              {/* Theme Controls moved to UserDropdown */}

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
