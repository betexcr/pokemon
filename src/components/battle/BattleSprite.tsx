"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, getPokemonImageWithFallbacks, formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils';

export interface BattleSpriteRef {
  play: (animName: string) => Promise<void>;
}

interface BattleSpriteProps {
  species: string;
  level: number;
  hp: { cur: number; max: number };
  status?: string | null;
  volatiles?: {
    taunt?: { turnsLeft: number };
    encore?: { turnsLeft: number };
    recharge?: boolean;
    protectUsedLastTurn?: boolean;
    subHp?: number;
  };
  types: string[];
  side: 'player' | 'opponent';
  field?: {
    safeguardTurns?: number;
    mistTurns?: number;
    reflectTurns?: number;
    lightScreenTurns?: number;
  };
  className?: string;
  onAnimationComplete?: (animName: string) => void;
  spriteMode?: 'static' | 'animated';
}

export const BattleSprite = forwardRef<BattleSpriteRef, BattleSpriteProps>(({
  species,
  level,
  hp,
  status,
  volatiles,
  types,
  side,
  field,
  className = '',
  onAnimationComplete,
  spriteMode = 'static'
}, ref) => {
  console.log('🎨 BattleSprite render:', { species, side, spriteMode });
  const spriteRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const pokemonId = getPokemonIdFromSpecies(species);
  const variant = side === 'player' ? 'back' : 'front';
  // Decide sprite source based on mode
  const useAnimated = spriteMode === 'animated';
  
  // Use comprehensive fallback system
  const { primary, fallbacks } = pokemonId ? getPokemonImageWithFallbacks(pokemonId, species, variant) : { primary: '', fallbacks: [] };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  console.log('🎨 BattleSprite image URLs:', { 
    species, 
    variant, 
    spriteMode, 
    primary, 
    currentImage: currentImageIndex === 0 ? primary : fallbacks[currentImageIndex - 1]
  });

  // Reset image state when species changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
  }, [species, variant]);

  // Animation system
  useImperativeHandle(ref, () => ({
    play: async (animName: string) => {
      if (!spriteRef.current || isAnimating) return;
      
      setIsAnimating(true);
      const element = spriteRef.current;
      
      // Remove any existing animation classes
      element.className = element.className.replace(/animate-\w+/g, '');
      
      // Add the new animation
      element.classList.add(animName);
      
      // Wait for animation to complete
      await new Promise(resolve => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.classList.remove(animName);
          setIsAnimating(false);
          onAnimationComplete?.(animName);
          resolve(void 0);
        };
        element.addEventListener('animationend', handleAnimationEnd);
      });
    }
  }));

  const hpPercentage = (hp.cur / hp.max) * 100;
  const isLowHp = hpPercentage <= 25;
  const isCriticalHp = hpPercentage <= 10;

  // Status effect colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAR': return 'text-yellow-600 bg-yellow-100';
      case 'PSN': return 'text-purple-600 bg-purple-100';
      case 'BRN': return 'text-red-600 bg-red-100';
      case 'SLP': return 'text-blue-600 bg-blue-100';
      case 'FRZ': return 'text-cyan-600 bg-cyan-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Type colors
  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      normal: 'bg-gray-500',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-500',
      grass: 'bg-green-500',
      ice: 'bg-cyan-500',
      fighting: 'bg-orange-500',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-indigo-500',
      psychic: 'bg-pink-500',
      bug: 'bg-lime-500',
      rock: 'bg-yellow-700',
      ghost: 'bg-indigo-700',
      dragon: 'bg-purple-700',
      dark: 'bg-gray-800',
      steel: 'bg-gray-400',
      fairy: 'bg-pink-300'
    };
    return typeColors[type.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <div 
      ref={spriteRef}
      className={`relative ${className} ${isAnimating ? 'pointer-events-none' : ''}`}
    >
      {/* Main Pokemon Sprite */}
      <div className="relative w-32 h-32 mx-auto mb-2">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-lg" />
        )}
        
        <img
          src={currentImageIndex === 0 ? primary : fallbacks[currentImageIndex - 1]}
          alt={`${formatPokemonName(species)} ${variant}`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isLowHp ? 'grayscale' : ''} ${isCriticalHp ? 'brightness-75' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const nextIndex = currentImageIndex + 1;
            
            if (nextIndex <= fallbacks.length) {
              // Try next fallback
              setCurrentImageIndex(nextIndex);
              setImageLoaded(false);
              setImageError(false);
            } else {
              // All fallbacks failed
              setImageError(true);
            }
          }}
          loading="lazy"
        />
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <span className="text-2xl">?</span>
          </div>
        )}

        {/* Field Auras */}
        {(volatiles?.subHp ?? 0) > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            S
          </div>
        )}
        
        {volatiles?.protectUsedLastTurn && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            P
          </div>
        )}

        {/* Field Effects */}
        {(field?.safeguardTurns ?? 0) > 0 && (
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            SG
          </div>
        )}
        
        {(field?.reflectTurns ?? 0) > 0 && (
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
        )}
        
        {(field?.lightScreenTurns ?? 0) > 0 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            LS
          </div>
        )}
      </div>

      {/* Pokemon Info */}
      <div className="text-center space-y-1">
        {/* Name (hide zero-level display to avoid showing 000) */}
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-bold text-lg capitalize">
            {formatPokemonName(species)}
          </h3>
          {level > 0 && (
            <span className="text-sm text-gray-600">Lv.{level}</span>
          )}
        </div>

        {/* Types */}
        <div className="flex justify-center gap-1">
          {types.map((type, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(type)}`}
            >
              {type.toUpperCase()}
            </span>
          ))}
        </div>

        {/* HP Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              isCriticalHp ? 'bg-red-500' : isLowHp ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        <div className="text-sm font-medium">
          {hp.cur}/{hp.max} HP
        </div>

        {/* Status Effects */}
        {status && (
          <div className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
            {status}
          </div>
        )}

        {/* Volatiles */}
        {volatiles && (
          <div className="flex flex-wrap justify-center gap-1">
            {volatiles.taunt && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                Taunt ({volatiles.taunt.turnsLeft})
              </span>
            )}
            {volatiles.encore && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                Encore ({volatiles.encore.turnsLeft})
              </span>
            )}
            {volatiles.recharge && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Recharge
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

BattleSprite.displayName = 'BattleSprite';
