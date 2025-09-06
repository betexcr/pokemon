"use client";

import { ReactNode } from 'react';

interface PokemonCardFrameProps {
  children: ReactNode;
  isSelected?: boolean;
  className?: string;
  density?: '3cols' | '6cols' | '9cols' | 'list';
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
  'data-pokemon-id'?: number;
}

export default function PokemonCardFrame({
  children,
  isSelected = false,
  className = '',
  density = '6cols',
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  'data-pokemon-id': pokemonId
}: PokemonCardFrameProps) {
  // Calculate card styling based on density
  const getCardClasses = () => {
    const baseClasses = `
      group relative bg-surface border border-border overflow-hidden
      transition-all duration-200 hover:shadow-lg focus:outline-none
      focus:ring-2 focus:ring-poke-blue focus:ring-offset-2 focus:ring-offset-bg
      ${isSelected ? 'ring-2 ring-poke-blue ring-offset-2' : ''}
      ${className}
    `

    // Layout and styling based on density with proper sizing and containment
    const densityClasses = {
      '3cols': 'rounded-xl hover:scale-[1.02] min-h-[320px] shadow-md hover:shadow-lg', // Larger cards for 3 columns
      '6cols': 'rounded-lg hover:scale-[1.02] min-h-[240px] shadow-sm hover:shadow-md', // Medium cards for 6 columns
      '9cols': 'rounded-md hover:scale-[1.01] min-h-[180px] shadow-sm hover:shadow-md', // Smaller cards for 9 columns
      list: 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center min-h-[60px] px-4 py-3 border-l-4 border-l-transparent hover:border-l-poke-blue transition-all duration-200'
    }

    return `${baseClasses} ${densityClasses[density]}`
  }

  return (
    <div
      onClick={onClick}
      className={getCardClasses()}
      style={{
        height: density === 'list' ? 'auto' : '100%'
      }}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-pokemon-id={pokemonId}
    >
      {children}
    </div>
  );
}
