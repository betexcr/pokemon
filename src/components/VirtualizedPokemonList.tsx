'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

interface VirtualizedPokemonListProps {
  pokemonList: Pokemon[]
  onSelectPokemon: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  className?: string
  itemHeight?: number
  containerHeight?: number
}

export default function VirtualizedPokemonList({
  pokemonList,
  onSelectPokemon,
  selectedPokemon,
  className = '',
  itemHeight = 60,
  containerHeight = 400
}: VirtualizedPokemonListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  const isRetro = theme === 'gold' || theme === 'red' || theme === 'ruby'

  const virtualizer = useVirtualizer({
    count: pokemonList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()

  const getItemStyle = (pokemon: Pokemon) => {
    const baseStyle = `flex items-center cursor-pointer p-2 transition-colors ${
      selectedPokemon?.id === pokemon.id 
        ? isRetro 
          ? theme === 'red' ? 'bg-red-200 border-2 border-red-600' 
          : theme === 'gold' ? 'bg-yellow-300 border-2 border-yellow-600'
          : 'bg-pink-300 border-2 border-pink-600'
        : 'hover:bg-gray-100'
        : isRetro
        ? theme === 'red' ? 'hover:bg-red-100' 
        : theme === 'gold' ? 'hover:bg-yellow-100'
        : 'hover:bg-pink-100'
        : 'hover:bg-gray-50'
    }`

    return baseStyle
  }

  const getTextStyle = () => {
    if (isRetro) {
      return theme === 'red' ? 'text-red-800 font-gbc' 
        : theme === 'gold' ? 'text-yellow-800 font-gbc'
        : 'text-pink-800 font-gba'
    }
    return 'text-gray-800'
  }

  return (
    <div className={`${className}`}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const pokemon = pokemonList[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={getItemStyle(pokemon)}
                onClick={() => onSelectPokemon(pokemon)}
              >
                <div className="flex items-center space-x-3 w-full">
                  {/* Pokémon Sprite */}
                  <img
                    src={pokemon.sprites.front_default || ''}
                    alt={pokemon.name}
                    className={`w-8 h-8 object-contain ${
                      isRetro ? 'image-render-pixel' : ''
                    }`}
                  />
                  
                  {/* Pokémon Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${getTextStyle()}`}>
                      {String(pokemon.id).padStart(3, '0')} {formatPokemonName(pokemon.name)}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {pokemon.types.map((type) => (
                        <span
                          key={type.type.name}
                          className={`px-2 py-1 text-xs rounded-full ${
                            isRetro 
                              ? theme === 'red' ? 'bg-red-200 text-red-800' 
                              : theme === 'gold' ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-pink-200 text-pink-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {formatPokemonName(type.type.name)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedPokemon?.id === pokemon.id && (
                    <div className={`w-2 h-2 rounded-full ${
                      isRetro 
                        ? theme === 'red' ? 'bg-red-600' 
                        : theme === 'gold' ? 'bg-yellow-600'
                        : 'bg-pink-600'
                        : 'bg-blue-600'
                    }`} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
            isRetro 
              ? theme === 'red' ? 'border-red-600' 
              : theme === 'gold' ? 'border-yellow-600'
              : 'border-pink-600'
              : 'border-blue-600'
          }`} />
        </div>
      )}
    </div>
  )
}
