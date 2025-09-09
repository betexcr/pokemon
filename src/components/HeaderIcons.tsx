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
        className={`pk-btn ${showSidebar ? 'ring-2 ring-poke-blue ring-offset-2' : ''}`}
        onClick={handleFiltersClick}
        title="Advanced Filters"
      >
        <Image 
          src="/header-icons/advanced_filters.png" 
          alt="Advanced Filters" 
          width={32} 
          height={32} 
        />
      </button>
      
      <button 
        className="pk-btn" 
        onClick={handleTeamClick}
        title="Team Builder"
      >
        <Image 
          src="/header-icons/team_builder.png" 
          alt="Team Builder" 
          width={32} 
          height={32} 
        />
      </button>
      
      <button 
        className="pk-btn" 
        onClick={handleBattleClick}
        title="Battles"
      >
        <Image 
          src="/header-icons/battle.png" 
          alt="Battles" 
          width={32} 
          height={32} 
        />
      </button>
      
      <button 
        className={`pk-btn ${comparisonList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleCompareClick}
        disabled={comparisonList.length === 0}
        title={comparisonList.length === 0 ? 'Select Pokémon to enable comparison' : 'Compare'}
        aria-disabled={comparisonList.length === 0}
      >
        <Image 
          src="/header-icons/compare.png" 
          alt="Compare" 
          width={32} 
          height={32} 
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
      className={`pk-btn ${className}`}
      onClick={onClick}
      title="Toggle menu"
    >
      <Image 
        src="/header-icons/hamburger-menu.png" 
        alt="Menu" 
        width={32} 
        height={32} 
      />
    </button>
  )
}
