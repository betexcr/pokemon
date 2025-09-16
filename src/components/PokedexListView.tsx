import Image from "next/image";
import { Pokemon } from '@/types/pokemon';
import { formatPokemonName } from '@/lib/utils';
import { Scale } from 'lucide-react';
import TypeBadge from './TypeBadge';

interface PokedexListViewProps {
  pokemonList: Pokemon[];
  onToggleComparison: (id: number) => void;
  onSelectPokemon?: (pokemon: Pokemon) => void;
  comparisonList: number[];
  isLoadingMore?: boolean;
  hasMorePokemon?: boolean;
  onLoadMore?: () => void;
}

export default function PokedexListView({ 
  pokemonList, 
  onToggleComparison, 
  onSelectPokemon,
  comparisonList,
  isLoadingMore = false,
  hasMorePokemon = false,
  onLoadMore
}: PokedexListViewProps) {
  const handlePokemonClick = (pokemon: Pokemon) => {
    if (onSelectPokemon) {
      onSelectPokemon(pokemon);
    }
  };

  const handleComparisonClick = (e: React.MouseEvent, pokemonId: number) => {
    e.stopPropagation();
    onToggleComparison(pokemonId);
  };

  return (
    <div className="w-full rounded-xl border border-border overflow-hidden bg-surface">
      {/* Rows */}
      <ul role="list" className="divide-y divide-border">
        {pokemonList.map((pokemon) => {
          const isInComparison = comparisonList.includes(pokemon.id);
          
          return (
            <li
              key={pokemon.id}
              className="group flex items-center gap-6 px-4 py-3 hover:bg-surface/40 transition-colors cursor-pointer"
              onClick={() => handlePokemonClick(pokemon)}
            >
              {/* Left: image + text */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Image container keeps consistent size */}
                <div className="w-20 h-20 shrink-0 rounded-md bg-surface/60 grid place-items-center relative">
                  <Image
                    src={pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || '/placeholder-pokemon.png'}
                    alt={pokemon.name}
                    width={80}
                    height={80}
                    className="w-16 h-16 object-contain"
                    onLoadingComplete={(img) => {
                      const wrapper = (img as any).parentElement as HTMLElement | null;
                      if (!wrapper) return;
                      const loader = wrapper.querySelector('[data-img-loader]') as HTMLElement | null;
                      if (loader) loader.style.display = 'none';
                    }}
                    onError={(e) => {
                      const wrapper = (e.currentTarget as any).parentElement as HTMLElement | null;
                      if (!wrapper) return;
                      const loader = wrapper.querySelector('[data-img-loader]') as HTMLElement | null;
                      if (loader) loader.style.display = 'none';
                    }}
                  />
                  <img
                    src="/loading.gif"
                    alt="Loading"
                    width={24}
                    height={24}
                    data-img-loader
                    className="absolute inset-0 m-auto w-6 h-6 opacity-70"
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {pokemon.id !== 0 && <span className="text-xs text-muted">#{pokemon.id.toString().padStart(3, '0')}</span>}
                    <h3 className="font-bold truncate text-text">{formatPokemonName(pokemon.name)}</h3>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pokemon.types.map((type) => (
                      <TypeBadge
                        key={type.type.name}
                        type={type.type.name}
                        variant="span"
                        className="text-xs"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => handleComparisonClick(e, pokemon.id)}
                  className={`
                    p-1.5 rounded-full transition-all duration-200 border
                    ${
                      isInComparison
                        ? "bg-blue-500 text-white border-blue-500 shadow-md"
                        : "bg-white text-gray-400 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  `}
                  aria-label={
                    isInComparison
                      ? "Remove from comparison"
                      : "Add to comparison"
                  }
                >
                  <Scale
                    className={`h-4 w-4 ${isInComparison ? "fill-current" : ""}`}
                  />
                </button>
                <button
                  aria-label="Open details"
                  className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface/60 transition-colors text-text font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePokemonClick(pokemon);
                  }}
                >
                  Details
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Infinite scroll loading indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poke-blue mx-auto mb-2"></div>
          <p className="text-muted text-sm">Loading more Pokémon...</p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMorePokemon && !isLoadingMore && (
        <div 
          data-infinite-scroll-sentinel="true"
          className="h-4 w-full"
        />
      )}

      {/* Footer */}
      <div className="px-4 py-3 text-xs text-muted bg-surface/60 border-t border-border">
        Showing {pokemonList.length} Pokémon
      </div>
    </div>
  );
}
