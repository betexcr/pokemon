"use client";

import { ReactNode, useCallback, useRef } from 'react';

interface PokemonCardFrameProps {
  children: ReactNode;
  isSelected?: boolean;
  className?: string;
  density?: '3cols' | '6cols' | '9cols' | '10cols' | 'list';
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMouseEnter?: () => void;
  'aria-label'?: string;
  'data-pokemon-id'?: number;
  fullViewport?: boolean;
  forceSquare?: boolean;
}

export default function PokemonCardFrame({
  children,
  isSelected = false,
  className = '',
  density = '6cols',
  onClick,
  onKeyDown,
  onMouseEnter,
  'aria-label': ariaLabel,
  'data-pokemon-id': pokemonId,
  fullViewport = false,
  forceSquare = false
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
      group relative bg-surface border border-border ${density !== '9cols' ? 'overflow-hidden' : 'overflow-visible'}
      transition-all duration-200 hover:shadow-lg focus:outline-none
      focus:ring-2 focus:ring-poke-blue focus:ring-offset-2 focus:ring-offset-bg
      w-full h-full ml-0 p-0 cq-card
      ${isSelected ? 'ring-2 ring-poke-blue ring-offset-2' : ''}
      ${className}
    `

    // Layout and styling based on density with flexible aspect ratio
    const densityClasses = {
      '3cols': forceSquare ? 'rounded-xl hover:scale-[1.02] aspect-square shadow-md hover:shadow-lg' : 'rounded-xl hover:scale-[1.02] min-h-[400px] max-h-[600px] shadow-md hover:shadow-lg',
      '6cols': forceSquare ? 'rounded-lg hover:scale-[1.02] aspect-square shadow-sm hover:shadow-md' : 'rounded-lg hover:scale-[1.02] shadow-sm hover:shadow-md',
      '9cols': forceSquare ? 'rounded-md hover:scale-[1.01] aspect-square shadow-sm hover:shadow-md z-[10]' : 'rounded-md hover:scale-[1.01] shadow-sm hover:shadow-md z-[10]',
      '10cols': forceSquare ? 'rounded-sm hover:scale-[1.01] aspect-square shadow-sm hover:shadow-md z-[10]' : 'rounded-sm hover:scale-[1.01] shadow-sm hover:shadow-md z-[10]',
      list: 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center h-[60px] px-4 py-3 border-l-4 border-l-transparent hover:border-l-poke-blue transition-all duration-200'
    } as const

    return `${baseClasses} ${densityClasses[density]}`
  }

  return (
    <div
      onClick={handleClick}
      className={`${getCardClasses()} ${fullViewport ? 'w-screen h-screen' : ''}`}
      style={{
        height: fullViewport ? '100vh' : 'auto',
        width: fullViewport ? '100vw' : undefined,
        margin: 0,
        padding: 0
      }}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      data-pokemon-id={pokemonId}
      data-density={density}
    >
      {children}
    </div>
  );
}
