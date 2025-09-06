'use client'

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pokemon } from '@/types/pokemon';
import PokemonCardFrame from './PokemonCardFrame';
import ModernPokemonCard from './ModernPokemonCard';
import { getPokemonMainPageImage } from '@/lib/api';
import { formatPokemonName } from '@/lib/utils';

type Pokemon = { 
  id: number; 
  name: string; 
  image?: string;
  types: Array<{ type: { name: string } }>;
};

interface VirtualizedPokemonListProps {
  data: Pokemon[];              // all fetched so far (increments of 100)
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;         // () => void, fetch next 100
  rowHeight?: number;           // approx card height (px)
  density?: '3cols' | '6cols' | '9cols' | 'list';
  onToggleComparison: (id: number) => void;
  onSelectPokemon?: (pokemon: Pokemon) => void;
  selectedPokemon: Pokemon | null;
  comparisonList: number[];
  className?: string;
}

export default function VirtualizedPokemonList({
  data,
  isLoading,
  hasMore,
  loadMore,
  rowHeight = 120,
  density = '6cols',
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  className = ''
}: VirtualizedPokemonListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate items per row based on density
  const getItemsPerRow = () => {
    switch (density) {
      case '3cols': return 3;
      case '6cols': return 6;
      case '9cols': return 9;
      case 'list': return 1;
      default: return 6;
    }
  };

  const itemsPerRow = getItemsPerRow();
  const totalRows = Math.ceil(data.length / itemsPerRow);

  // Virtualizer: only render what's visible + overscan buffer
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 16, // ~2–3 screens ahead; tune to taste
  });

  // Infinite load trigger: when the last virtual row is near the end
  useEffect(() => {
    const vItems = rowVirtualizer.getVirtualItems();
    if (!vItems.length || isLoading || !hasMore) return;
    
    const last = vItems[vItems.length - 1];
    if (last.index >= totalRows - 3) { // prefetch when 3 rows from end
      console.log('🚀 Triggering loadMore via virtualization');
      loadMore();
    }
  }, [rowVirtualizer, totalRows, isLoading, hasMore, loadMore]);

  // Only rows that are visible get mounted
  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  // Render a single row of Pokemon cards
  const renderRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, data.length);
    const rowPokemon = data.slice(startIndex, endIndex);

    if (density === 'list') {
      // List view: each row contains one Pokemon
      const pokemon = rowPokemon[0];
      if (!pokemon) return null;

      return (
        <div
          key={pokemon.id}
          className="w-full"
          style={{ height: rowHeight }}
        >
          <PokemonCardFrame
            isSelected={selectedPokemon?.id === pokemon.id}
            density={density}
            onClick={() => onSelectPokemon?.(pokemon)}
            aria-label={`Pokemon ${formatPokemonName(pokemon.name)}`}
            data-pokemon-id={pokemon.id}
          >
            <ModernPokemonCard
              pokemon={pokemon}
              isInComparison={comparisonList.includes(pokemon.id)}
              onToggleComparison={onToggleComparison}
              onSelect={onSelectPokemon}
              isSelected={selectedPokemon?.id === pokemon.id}
              density={density}
            />
          </PokemonCardFrame>
        </div>
      );
    }

    // Grid view: each row contains multiple Pokemon
    return (
      <div
        key={rowIndex}
        className={`grid w-full gap-3`}
        style={{
          height: rowHeight,
          gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
        }}
      >
        {rowPokemon.map((pokemon) => (
          <PokemonCardFrame
            key={pokemon.id}
            isSelected={selectedPokemon?.id === pokemon.id}
            density={density}
            onClick={() => onSelectPokemon?.(pokemon)}
            aria-label={`Pokemon ${formatPokemonName(pokemon.name)}`}
            data-pokemon-id={pokemon.id}
          >
            <ModernPokemonCard
              pokemon={pokemon}
              isInComparison={comparisonList.includes(pokemon.id)}
              onToggleComparison={onToggleComparison}
              onSelect={onSelectPokemon}
              isSelected={selectedPokemon?.id === pokemon.id}
              density={density}
            />
          </PokemonCardFrame>
        ))}
        
        {/* Fill empty slots in the last row */}
        {Array.from({ length: itemsPerRow - rowPokemon.length }).map((_, index) => (
          <div key={`empty-${rowIndex}-${index}`} style={{ height: rowHeight }} />
        ))}
      </div>
    );
  }, [data, itemsPerRow, density, rowHeight, selectedPokemon, comparisonList, onToggleComparison, onSelectPokemon]);

  const items = useMemo(() => virtualItems.map(vRow => {
    return (
      <div
        key={vRow.key}
        className="absolute left-0 right-0 px-3"
        style={{ 
          transform: `translateY(${vRow.start}px)`, 
          height: vRow.size 
        }}
      >
        {renderRow(vRow.index)}
      </div>
    );
  }), [virtualItems, renderRow]);

  return (
    <div className={`w-full max-w-full ${className}`}>
      <div
        ref={parentRef}
        style={{ 
          height: "80vh", 
          overflow: "auto", 
          position: "relative" 
        }}
        aria-label="Pokédex"
      >
        <div style={{ 
          height: totalHeight, 
          position: "relative" 
        }}>
          {items}
        </div>

        {isLoading && (
          <div className="p-4 text-center text-sm text-neutral-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-poke-blue mx-auto mb-2"></div>
            Loading more Pokémon...
          </div>
        )}
      </div>
    </div>
  );
}