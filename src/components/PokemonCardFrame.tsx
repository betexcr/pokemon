"use client";

import { ReactNode, useCallback, useRef } from 'react';

interface PokemonCardFrameProps {
  children: ReactNode;
  isSelected?: boolean;
  className?: string;
  density?: '3cols' | '6cols' | '9cols' | 'list';
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
  'data-pokemon-id'?: number;
  fullViewport?: boolean;
}

export default function PokemonCardFrame({
  children,
  isSelected = false,
  className = '',
  density = '6cols',
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  'data-pokemon-id': pokemonId,
  fullViewport = false
}: PokemonCardFrameProps) {
  // Prevent rapid double triggers on click (throttle)
  const lastClickTimeRef = useRef<number>(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) return; // 500ms throttle window
    lastClickTimeRef.current = now;
    if (onClick) onClick(e);
  }, [onClick]);
  // Calculate card styling based on density
  const getCardClasses = () => {
    const baseClasses = `
      group relative bg-surface border border-border overflow-hidden
      transition-all duration-200 hover:shadow-lg focus:outline-none
      focus:ring-2 focus:ring-poke-blue focus:ring-offset-2 focus:ring-offset-bg
      w-full h-full ml-0 p-0 cq-card
      ${isSelected ? 'ring-2 ring-poke-blue ring-offset-2' : ''}
      ${className}
    `

    // Layout and styling based on density with aspect ratio constraints
    const densityClasses = {
      '3cols': 'rounded-xl hover:scale-[1.02] aspect-[4/5] max-h-[360px] shadow-md hover:shadow-lg', // Aspect ratio constraint
      '6cols': 'rounded-lg hover:scale-[1.02] aspect-[4/5] max-h-[280px] shadow-sm hover:shadow-md', // Aspect ratio constraint
      '9cols': 'rounded-md hover:scale-[1.01] aspect-[4/5] max-h-[200px] shadow-sm hover:shadow-md', // Aspect ratio constraint
      list: 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center h-[60px] px-4 py-3 border-l-4 border-l-transparent hover:border-l-poke-blue transition-all duration-200'
    }

    return `${baseClasses} ${densityClasses[density]}`
  }

  return (
    <div
      onClick={handleClick}
      className={`${getCardClasses()} ${fullViewport ? 'w-screen h-screen' : ''}`}
      style={{
        height: fullViewport ? '100vh' : (density === 'list' ? 'auto' : '100%'),
        width: fullViewport ? '100vw' : undefined,
        margin: 0,
        padding: 0
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
