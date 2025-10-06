"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { getPokemon } from '@/lib/api';

interface UseViewportDataLoadingProps {
  pokemonList: Pokemon[];
  rootMargin?: string;
  threshold?: number;
  scrollIdleDelay?: number;
}

export function useViewportDataLoading({
  pokemonList,
  rootMargin = '200px',
  threshold = 0.1,
  scrollIdleDelay = 300
}: UseViewportDataLoadingProps) {
  const [loadedPokemon, setLoadedPokemon] = useState<Map<number, Pokemon>>(new Map());
  const [loadingPokemon, setLoadingPokemon] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollIdleRef = useRef(true);
  const visiblePokemonIdsRef = useRef<Set<number>>(new Set());
  const hasUserInteractedRef = useRef(false);
  const lastLoadedRangeRef = useRef<{start: number, end: number} | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadTriggeredRef = useRef(false);

  // Mark Pokemon as loaded
  const markPokemonLoaded = useCallback((pokemon: Pokemon) => {
    console.log(`💾 Marking Pokemon #${pokemon.id} as loaded:`, {
      name: pokemon.name,
      types: pokemon.types?.map(t => t.type?.name).filter(Boolean) || [],
      hasImage: !!pokemon.sprites?.front_default
    });
    setLoadedPokemon(prev => new Map(prev.set(pokemon.id, pokemon)));
    setLoadingPokemon(prev => {
      const newSet = new Set(prev);
      newSet.delete(pokemon.id);
      return newSet;
    });
  }, []);

  // Load Pokemon data
  const loadPokemonData = useCallback(async (pokemonId: number) => {
    // Use functional updates to get the latest state
    setLoadingPokemon(prev => {
      if (prev.has(pokemonId)) {
        return prev; // Already loading
      }
      
      setLoadedPokemon(loadedPrev => {
        if (loadedPrev.has(pokemonId)) {
          return loadedPrev; // Already loaded
        }
        
        // Start loading
        console.log(`🔄 Fetching data for Pokemon #${pokemonId}`);
        
        // Load the data asynchronously
        getPokemon(pokemonId)
          .then(pokemonData => {
            console.log(`✅ Loaded Pokemon #${pokemonId}:`, {
              name: pokemonData.name,
              types: pokemonData.types?.map(t => t.type?.name).filter(Boolean) || [],
              hasImage: !!pokemonData.sprites?.front_default
            });
            markPokemonLoaded(pokemonData);
          })
          .catch(error => {
            console.error(`Failed to load Pokemon ${pokemonId}:`, error);
            setLoadingPokemon(loadingPrev => {
              const newSet = new Set(loadingPrev);
              newSet.delete(pokemonId);
              return newSet;
            });
          });
        
        return loadedPrev;
      });
      
      return new Set(prev).add(pokemonId);
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
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
      const containerRect = scrollContainer === window ? 
        { top: 0, bottom: window.innerHeight } : 
        (scrollContainer as Element).getBoundingClientRect();
      
      pokemonCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        
        // Check if card is visible in the viewport with a smaller buffer
        const buffer = 100; // Reduced buffer to prevent loading off-screen Pokemon
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
        console.log(`Loading data for visible Pokemon: ${visibleIdsArray.slice(0, 5).join(', ')}... (${visibleIdsArray.length} total)`);
        
        // Load Pokemon data immediately for better performance
        visibleIdsArray.forEach(pokemonId => {
          loadPokemonData(pokemonId);
        });
      }
    }, 25); // Further reduced debounce to 25ms for even faster response
  }, [loadPokemonData]);

  // Load initial batch of Pokemon immediately (only first 6 Pokemon)
  const loadInitialBatch = useCallback(() => {
    console.log('Loading initial batch of Pokemon for immediate display');
    
    // Load only the first 6 Pokemon immediately for better performance
    const initialBatchSize = 6;
    for (let i = 1; i <= Math.min(initialBatchSize, pokemonList.length); i++) {
      loadPokemonData(i);
    }
  }, [loadPokemonData, pokemonList.length]);

  // Catch-up loading for fast scrolling scenarios
  const loadCatchUpData = useCallback(() => {
    console.log('Running catch-up loading for any missed Pokemon');
    
    // Find Pokemon that are visible but don't have loaded data
    const pokemonCards = document.querySelectorAll('[data-pokemon-id]');
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
    const containerRect = scrollContainer === window ? 
      { top: 0, bottom: window.innerHeight } : 
      (scrollContainer as Element).getBoundingClientRect();
    
    const buffer = 150; // Smaller buffer for catch-up loading
    const missedPokemonIds: number[] = [];
    
    pokemonCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.bottom > (containerRect.top - buffer) && 
                       rect.top < (containerRect.bottom + buffer);
      
      if (isVisible) {
        const pokemonId = parseInt(card.getAttribute('data-pokemon-id') || '0');
        if (pokemonId > 0 && !loadedPokemon.has(pokemonId) && !loadingPokemon.has(pokemonId)) {
          missedPokemonIds.push(pokemonId);
        }
      }
    });
    
    // Load any missed Pokemon
    if (missedPokemonIds.length > 0) {
      console.log(`Catch-up loading ${missedPokemonIds.length} missed Pokemon:`, missedPokemonIds.slice(0, 10));
      missedPokemonIds.forEach(pokemonId => {
        loadPokemonData(pokemonId);
      });
    }
  }, [loadPokemonData, loadedPokemon, loadingPokemon]);

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

  // Trigger initial loading when Pokemon list becomes available - DISABLED to prevent off-screen loading
  useEffect(() => {
    if (pokemonList.length > 0 && !initialLoadTriggeredRef.current) {
      console.log('Pokemon list available, setting up viewport-only loading (no initial batch)');
      initialLoadTriggeredRef.current = true;
      
      // DISABLED: Load initial batch immediately
      // loadInitialBatch();
      
      // Set up viewport-based loading only when user interacts
      setTimeout(() => {
        hasUserInteractedRef.current = true;
        isScrollIdleRef.current = true;
        loadVisiblePokemonData();
      }, 100); // Slightly longer delay to ensure user interaction
    }
  }, [pokemonList.length, loadVisiblePokemonData]);

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
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    window.addEventListener('resize', handleScroll, { passive: true });

    // Listen for Pokemon type retry events
    const handleTypeRetry = (event: CustomEvent) => {
      const { pokemonId } = event.detail;
      if (pokemonId && !loadedPokemon.has(pokemonId) && !loadingPokemon.has(pokemonId)) {
        console.log(`Retrying type loading for Pokemon #${pokemonId}`);
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
  }, [handleScroll, loadPokemonData, loadedPokemon, loadingPokemon]);

  // Get Pokemon with loaded data or skeleton
  const getPokemonWithData = useCallback((pokemon: Pokemon): Pokemon => {
    const loadedData = loadedPokemon.get(pokemon.id);
    if (loadedData) {
      console.log(`📦 Returning loaded data for Pokemon #${pokemon.id}:`, {
        name: loadedData.name,
        types: loadedData.types?.map(t => t.type?.name).filter(Boolean) || [],
        hasImage: !!loadedData.sprites?.front_default
      });
      return loadedData;
    }
    // Log when returning skeleton data
    if (pokemon.id >= 690 && pokemon.id <= 710) {
      console.log(`🦴 Returning skeleton data for Pokemon #${pokemon.id}:`, {
        name: pokemon.name,
        types: pokemon.types?.map(t => t.type?.name).filter(Boolean) || [],
        hasImage: !!pokemon.sprites?.front_default
      });
    }
    return pokemon;
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
