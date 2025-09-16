"use client";

import { X, Scale, ArrowRight } from 'lucide-react';
import { Pokemon } from '@/types/pokemon';
import { formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils';

interface ComparisonSectionProps {
  comparisonList: number[];
  comparisonPokemon: Pokemon[];
  onToggleComparison: (id: number) => void;
  onClearComparison: () => void;
  onGoToComparison: () => void;
}

export default function ComparisonSection({
  comparisonList,
  comparisonPokemon,
  onToggleComparison,
  onClearComparison,
  onGoToComparison,
}: ComparisonSectionProps) {
  return (
    <div className="h-full flex flex-col bg-blue-100 dark:bg-blue-800 overflow-hidden">
      <div className="p-3 flex-1 min-h-0 flex flex-col">
        {/* Action buttons */}
        <div className="mb-4 flex items-center justify-end space-x-2">
          <button
            onClick={onGoToComparison}
            className={`p-2 rounded-lg bg-surface border border-border transition-all duration-200 shadow-sm text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 hover:shadow-md`}
            title={'Go to Comparison'}
            aria-label="Go to Comparison"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onClearComparison}
            disabled={comparisonList.length === 0}
            className={`p-2 rounded-lg bg-surface border border-border transition-all duration-200 shadow-sm ${comparisonList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30'}`}
            title="Clear Comparison"
            aria-label="Clear Comparison"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {comparisonList.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted mb-3">
              Select Pokémon to compare their stats
            </p>
            <div className="text-4xl mb-2">⚖️</div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            {/* Selected Pokémon List */}
            <div data-testid="comparison-scroll" className="flex-1 min-h-0 overflow-y-auto scrollbar-hide bg-gray-800 rounded-lg border border-gray-700 scroll-pb-24 pb-4 pr-1 overscroll-contain">
              {comparisonPokemon.map((pokemon, index) => (
                <div
                  key={pokemon.id}
                  className={`flex items-center px-3 py-2 ${
                    index < comparisonPokemon.length - 1 
                      ? 'border-b border-gray-700' 
                      : ''
                  }`}
                >
                  <picture className="mr-3">
                    <img
                      src={getShowdownAnimatedSprite(pokemon.name, 'front', false)}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                        if (target.src !== fallback) target.src = fallback
                      }}
                      alt={formatPokemonName(pokemon.name)}
                      className="w-8 h-8 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  <span className="text-white text-sm">
                    {formatPokemonName(pokemon.name)}
                  </span>
                  <button
                    onClick={() => onToggleComparison(pokemon.id)}
                    className="ml-auto p-1 rounded hover:bg-red-600 transition-colors"
                    aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                  >
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              ))}
              {/* Bottom spacer to ensure last item is fully visible */}
              <div aria-hidden className="h-6" />
            </div>
            
            {/* Bottom actions removed; actions moved next to header title */}
          </div>
        )}
      </div>
    </div>
  );
}