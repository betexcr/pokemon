'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  onFiltersClick,
  className = ''
}: HeaderIconsProps) {
  const router = useRouter()

  const handleTeamClick = () => {
    router.push('/team')
  }

  const handleBattleClick = () => {
    router.push('/battle')
  }

  const handleCompareClick = () => {
    if (comparisonList.length > 0) {
      router.push('/compare')
    }
  }

  const handleFiltersClick = () => {
    if (onFiltersClick) {
      onFiltersClick()
    }
  }

  return (
    <>
      <button 
        className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${showSidebar ? 'bg-poke-blue/10 border-poke-blue' : ''}`}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
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
          e.currentTarget.style.backgroundColor = 'var(--color-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }}
        onClick={handleFiltersClick}
        title="Advanced Filters"
      >
        <Image 
          src="/header-icons/advanced_filters.png" 
          alt="Advanced Filters" 
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
      </button>
      
      <button 
        className="w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500" 
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
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
          e.currentTarget.style.backgroundColor = 'var(--color-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }}
        onClick={handleTeamClick}
        title="Team Builder"
      >
        <Image 
          src="/header-icons/team_builder.png" 
          alt="Team Builder" 
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
      </button>
      
      <button 
        className="w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500" 
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
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
          e.currentTarget.style.backgroundColor = 'var(--color-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }}
        onClick={handleBattleClick}
        title="Battles"
      >
        <Image 
          src="/header-icons/battle.png" 
          alt="Battles" 
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
      </button>
      
      <button 
        className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${comparisonList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '50%',
          width: '64px',
          height: '64px',
          minWidth: '64px',
          minHeight: '64px',
          maxWidth: '64px',
          maxHeight: '64px',
        }}
        onMouseEnter={(e) => {
          if (comparisonList.length > 0) {
            e.currentTarget.style.borderColor = 'var(--color-muted)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }}
        onClick={handleCompareClick}
        disabled={comparisonList.length === 0}
        title={comparisonList.length === 0 ? 'Select Pokémon to enable comparison' : 'Compare'}
        aria-disabled={comparisonList.length === 0}
      >
        <Image 
          src="/header-icons/compare.png" 
          alt="Compare" 
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
      </button>
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
    <button 
      className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
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
        e.currentTarget.style.backgroundColor = 'var(--color-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
      }}
      onClick={onClick}
      title="Toggle menu"
    >
      <Image 
        src="/header-icons/hamburger-menu.png" 
        alt="Menu" 
        width={48}
        height={48}
        className="w-12 h-12 object-contain"
      />
    </button>
  )
}
