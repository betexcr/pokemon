'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { getPokemonWithPagination, getPokemonTotalCount } from '@/lib/api';

interface UseVirtualizedPokemonOptions {
  pageSize?: number;
  initialLoad?: number;
}

interface UseVirtualizedPokemonReturn {
  data: Pokemon[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number | null;
  error: string | null;
  reset: () => void;
}

export function useVirtualizedPokemon({
  pageSize = 100,
  initialLoad = 100
}: UseVirtualizedPokemonOptions = {}): UseVirtualizedPokemonReturn {
  const [data, setData] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const currentOffset = useRef(0);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const lastLoadTimeRef = useRef(0);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    setIsLoading(true);
    setError(null);
    isLoadingRef.current = true;
    
    try {
      // Load initial batch
      const initialPokemon = await getPokemonWithPagination(initialLoad, 0);
      setData(initialPokemon);
      currentOffset.current = initialLoad;
      
      // Get total count
      const total = await getPokemonTotalCount();
      setTotalCount(total);
      
      // Check if we have more data
      const hasMoreData = initialPokemon.length === initialLoad && 
                         (total === null || currentOffset.current < total);
      setHasMore(hasMoreData);
      hasMoreRef.current = hasMoreData;
      
      console.log(`✅ Loaded initial ${initialPokemon.length} Pokémon. Total: ${total}, Has more: ${hasMoreData}`);
    } catch (err) {
      console.error('❌ Error loading initial Pokémon:', err);
      setError('Failed to load Pokémon data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [initialLoad]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) {
      console.log('🚫 Skipping loadMore - already loading or no more data');
      return;
    }
    
    // Protection against rapid calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 500) {
      console.log('🚫 Skipping loadMore - too soon since last call');
      return;
    }
    lastLoadTimeRef.current = now;
    
    setIsLoading(true);
    isLoadingRef.current = true;
    
    try {
      console.log(`🔄 Loading more Pokémon from offset ${currentOffset.current}`);
      const newPokemon = await getPokemonWithPagination(pageSize, currentOffset.current);
      
      if (newPokemon.length === 0) {
        console.log('📭 No more Pokémon to load');
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }
      
      // Deduplicate and add new Pokémon
      setData(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPokemon = newPokemon.filter(p => !existingIds.has(p.id));
        
        if (uniqueNewPokemon.length === 0) {
          console.log('⚠️ All new Pokémon were duplicates');
          return prev;
        }
        
        console.log(`✅ Added ${uniqueNewPokemon.length} new Pokémon`);
        return [...prev, ...uniqueNewPokemon];
      });
      
      currentOffset.current += pageSize;
      
      // Check if we've reached the end
      const hasMoreData = newPokemon.length === pageSize && 
                         (totalCount === null || currentOffset.current < totalCount);
      setHasMore(hasMoreData);
      hasMoreRef.current = hasMoreData;
      
    } catch (err) {
      console.error('❌ Error loading more Pokémon:', err);
      setError('Failed to load more Pokémon');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [pageSize, totalCount]);

  // Reset function
  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setHasMore(true);
    hasMoreRef.current = true;
    currentOffset.current = 0;
    lastLoadTimeRef.current = 0;
    loadInitialData();
  }, [loadInitialData]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    data,
    isLoading,
    hasMore,
    loadMore,
    totalCount,
    error,
    reset
  };
}
