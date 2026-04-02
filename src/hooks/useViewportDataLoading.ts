"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { getPokemon } from '@/lib/api';

interface UseViewportDataLoadingProps {
  pokemonList: Pokemon[];
  scrollIdleDelay?: number;
}

function isPermanentPokemonLoadFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('404') || msg.includes('does not exist');
}

export function useViewportDataLoading({
  pokemonList,
  scrollIdleDelay = 300
}: UseViewportDataLoadingProps) {
  const [loadedPokemon, setLoadedPokemon] = useState<Map<number, Pokemon>>(new Map());
  const [loadingPokemon, setLoadingPokemon] = useState<Set<number>>(new Set());
  const failedPokemonRef = useRef<Set<number>>(new Set());
  const loadedPokemonRef = useRef<Map<number, Pokemon>>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollIdleRef = useRef(true);
  const hasUserInteractedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  useEffect(() => {
    loadedPokemonRef.current = loadedPokemon;
  }, [loadedPokemon]);

  // Mark Pokemon as loaded
  const markPokemonLoaded = useCallback((pokemon: Pokemon) => {
    loadedPokemonRef.current.set(pokemon.id, pokemon);
    inFlightRef.current.delete(pokemon.id);
    setLoadedPokemon(prev => new Map(prev).set(pokemon.id, pokemon));
    setLoadingPokemon(prev => {
      const newSet = new Set(prev);
      newSet.delete(pokemon.id);
      return newSet;
    });
  }, []);

  // Load Pokemon data (refs avoid nested setState + duplicate in-flight fetches)
  const loadPokemonData = useCallback((pokemonId: number) => {
    if (failedPokemonRef.current.has(pokemonId)) return;
    if (loadedPokemonRef.current.has(pokemonId)) return;
    if (inFlightRef.current.has(pokemonId)) return;

    inFlightRef.current.add(pokemonId);
    setLoadingPokemon(prev => new Set(prev).add(pokemonId));

    getPokemon(pokemonId)
      .then(pokemonData => {
        if (!unmountedRef.current) {
          markPokemonLoaded(pokemonData);
        } else {
          inFlightRef.current.delete(pokemonId);
        }
      })
      .catch(err => {
        inFlightRef.current.delete(pokemonId);
        if (!unmountedRef.current) {
          setLoadingPokemon(prev => {
            const next = new Set(prev);
            next.delete(pokemonId);
            return next;
          });
        }
        // Only treat real missing species as permanent; aborts / timeouts / 503s can retry
        if (isPermanentPokemonLoadFailure(err)) {
          failedPokemonRef.current.add(pokemonId);
        }
      });
  }, [markPokemonLoaded]);

  // Load data for currently visible Pokemon with optimized viewport detection
  const loadVisiblePokemonData = useCallback(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Reduced debounce for faster response
    loadingTimeoutRef.current = setTimeout(() => {
      // Use DOM-based visibility detection for more accuracy
      const pokemonCards = document.querySelectorAll('[data-pokemon-id]');
      const visiblePokemonIds = new Set<number>();
      
      if (pokemonCards.length === 0) {
        return; // No cards rendered yet, skip loading
      }
      
      // Get the scroll container (the main scrollable area)
      const scrollContainer = document.querySelector('[data-main-scroll]') || window;
      const containerRect = scrollContainer === window ? 
        { top: 0, bottom: window.innerHeight } : 
        (scrollContainer as Element).getBoundingClientRect();
      
      pokemonCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        
        // Generous buffer so virtualized rows near the edge still schedule loads
        const buffer = 220;
        const isVisible = rect.bottom > (containerRect.top - buffer) && 
                         rect.top < (containerRect.bottom + buffer);
        
        if (isVisible) {
          const pokemonId = parseInt(card.getAttribute('data-pokemon-id') || '0');
          if (pokemonId > 0) {
            visiblePokemonIds.add(pokemonId);
          }
        }
      });
      
      // Load data for Pokemon in the visible range immediately
      if (visiblePokemonIds.size > 0) {
        const visibleIdsArray = Array.from(visiblePokemonIds).sort((a, b) => a - b);
        visibleIdsArray.forEach(pokemonId => {
          loadPokemonData(pokemonId);
        });
      }
    }, 25); // Further reduced debounce to 25ms for even faster response
  }, [loadPokemonData]);

  const loadInitialBatch = useCallback(() => {
    const initialBatchSize = Math.min(6, pokemonList.length);
    for (let i = 0; i < initialBatchSize; i++) {
      loadPokemonData(pokemonList[i].id);
    }
  }, [loadPokemonData, pokemonList]);

  // Catch-up loading for fast scrolling scenarios
  const loadCatchUpData = useCallback(() => {
    // Find Pokemon that are visible but don't have loaded data
    const pokemonCards = document.querySelectorAll('[data-pokemon-id]');
    const scrollContainer = document.querySelector('[data-main-scroll]') || window;
    const containerRect = scrollContainer === window ? 
      { top: 0, bottom: window.innerHeight } : 
      (scrollContainer as Element).getBoundingClientRect();
    
    const buffer = 220;
    const missedPokemonIds: number[] = [];
    
    pokemonCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.bottom > (containerRect.top - buffer) && 
                       rect.top < (containerRect.bottom + buffer);
      
      if (isVisible) {
        const pokemonId = parseInt(card.getAttribute('data-pokemon-id') || '0');
        if (
          pokemonId > 0 &&
          !loadedPokemonRef.current.has(pokemonId) &&
          !inFlightRef.current.has(pokemonId) &&
          !failedPokemonRef.current.has(pokemonId)
        ) {
          missedPokemonIds.push(pokemonId);
        }
      }
    });
    
    if (missedPokemonIds.length > 0) {
      missedPokemonIds.forEach(pokemonId => {
        loadPokemonData(pokemonId);
      });
    }
  }, [loadPokemonData]);

  // Handle scroll idle detection with immediate loading for better UX
  const handleScroll = useCallback(() => {
    // Mark that user has interacted
    hasUserInteractedRef.current = true;
    isScrollIdleRef.current = false;
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    
    // Load data immediately on scroll for better responsiveness
    loadVisiblePokemonData();
    
    // Set a new timeout to load data when scrolling stops (for additional loading)
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollIdleRef.current = true;
      // Load data for visible Pokemon when scroll stops
      loadVisiblePokemonData();
      // Also run catch-up loading to ensure no Pokemon were missed during fast scrolling
      loadCatchUpData();
    }, scrollIdleDelay);
  }, [scrollIdleDelay, loadVisiblePokemonData, loadCatchUpData]);

  // No intersection observer needed - using scroll-based approach instead

  // When the visible list range changes (filters, infinite scroll, sort), load again
  const listLen = pokemonList.length;
  const listFirstId = listLen > 0 ? pokemonList[0].id : 0;
  const listLastId = listLen > 0 ? pokemonList[listLen - 1].id : 0;

  useEffect(() => {
    if (listLen === 0) return;

    const id = setTimeout(() => {
      hasUserInteractedRef.current = true;
      isScrollIdleRef.current = true;
      loadVisiblePokemonData();
    }, 100);
    return () => clearTimeout(id);
  }, [listLen, listFirstId, listLastId, loadVisiblePokemonData]);

  // Periodic catch-up loading to ensure no Pokemon are missed
  useEffect(() => {
    if (pokemonList.length === 0) return;

    const interval = setInterval(() => {
      // Only run catch-up if user has interacted and we're not actively scrolling
      if (hasUserInteractedRef.current && isScrollIdleRef.current) {
        loadCatchUpData();
      }
    }, 2000); // Run every 2 seconds

    return () => clearInterval(interval);
  }, [pokemonList.length, loadCatchUpData]);

  // Set up scroll listener
  useEffect(() => {
    // Listen to the main scroll container instead of window
    const scrollContainer = document.querySelector('[data-main-scroll]');
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    window.addEventListener('resize', handleScroll, { passive: true });

    // Listen for Pokemon type retry events
    const handleTypeRetry = (event: CustomEvent) => {
      const { pokemonId } = event.detail;
      if (pokemonId && !loadedPokemon.has(pokemonId) && !loadingPokemon.has(pokemonId) && !failedPokemonRef.current.has(pokemonId)) {
        loadPokemonData(pokemonId);
      }
    };

    window.addEventListener('pokemon-type-retry', handleTypeRetry as EventListener);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('pokemon-type-retry', handleTypeRetry as EventListener);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [handleScroll, loadPokemonData]);

  // Get Pokemon with loaded data or skeleton
  const getPokemonWithData = useCallback((pokemon: Pokemon): Pokemon => {
    return loadedPokemon.get(pokemon.id) ?? pokemon;
  }, [loadedPokemon]);

  // Check if Pokemon is loaded
  const isPokemonLoaded = useCallback((pokemonId: number): boolean => {
    return loadedPokemon.has(pokemonId);
  }, [loadedPokemon]);

  // Check if Pokemon is loading
  const isPokemonLoading = useCallback((pokemonId: number): boolean => {
    return loadingPokemon.has(pokemonId);
  }, [loadingPokemon]);

  return {
    getPokemonWithData,
    isPokemonLoaded,
    isPokemonLoading,
    loadedCount: loadedPokemon.size,
    totalCount: pokemonList.length
  };
}
