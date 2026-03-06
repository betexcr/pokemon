/**
 * Hook for viewport-aware request cancellation
 * Automatically cancels requests for Pokemon that are no longer visible in the viewport
 * Useful for infinite scroll lists where users scroll past Pokemon quickly
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { requestManager } from '@/lib/requestManager';

interface UseViewportCancellationOptions {
  /**
   * Margin in pixels beyond viewport where requests are still kept active
   * Helps with preloading and smoother scrolling
   */
  bufferMargin?: number;
  
  /**
   * Enable/disable viewport cancellation
   */
  enabled?: boolean;
  
  /**
   * Context prefix for viewport requests (e.g., 'viewport-pokemon')
   */
  contextPrefix?: string;
  
  /**
   * Callback when requests are cancelled
   */
  onCancel?: (count: number) => void;
}

export function useViewportCancellation(options: UseViewportCancellationOptions = {}) {
  const {
    bufferMargin = 1000, // 1000px beyond viewport
    enabled = true,
    contextPrefix = 'viewport',
    onCancel
  } = options;

  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const lastProcessTimeRef = useRef(0);
  const processDebounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check which Pokemon are outside viewport and cancel their requests
   */
  const processViewport = useCallback(async () => {
    if (!enabled) return;

    const scrollContainer = scrollContainerRef.current || document.querySelector('[data-main-scroll]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const viewportTop = scrollTop - bufferMargin;
    const viewportBottom = scrollTop + clientHeight + bufferMargin;

    // Get all visible Pokemon elements
    const pokemonElements = document.querySelectorAll('[data-pokemon-id]');
    const visibleIds = new Set<number>();

    pokemonElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      const elementBottom = rect.bottom + scrollTop;

      // Check if element is within viewport + buffer
      const isInViewport = elementBottom >= viewportTop && elementTop <= viewportBottom;

      if (isInViewport) {
        const pokemonId = element.getAttribute('data-pokemon-id');
        if (pokemonId) {
          visibleIds.add(parseInt(pokemonId));
        }
      }
    });

    // Cancel requests for Pokemon outside viewport
    const activeRequests = requestManager.getActiveRequests();
    let cancelledCount = 0;

    activeRequests.forEach(entry => {
      if (entry.context.includes(contextPrefix)) {
        // Extract Pokemon ID from context if possible
        const match = entry.context.match(/\d+$/);
        if (match) {
          const pokemonId = parseInt(match[0]);
          if (!visibleIds.has(pokemonId)) {
            requestManager.cancelRequest(entry.context + '-' + pokemonId);
            cancelledCount++;
          }
        }
      }
    });

    if (cancelledCount > 0 && onCancel) {
      onCancel(cancelledCount);
    }
  }, [enabled, bufferMargin, contextPrefix, onCancel]);

  /**
   * Debounced viewport processing
   */
  const debouncedProcessViewport = useCallback(() => {
    if (processDebounceRef.current) {
      clearTimeout(processDebounceRef.current);
    }

    processDebounceRef.current = setTimeout(() => {
      processViewport();
      lastProcessTimeRef.current = Date.now();
    }, 300); // Debounce by 300ms
  }, [processViewport]);

  /**
   * Set up scroll listener for viewport-aware cancellation
   */
  useEffect(() => {
    if (!enabled) return;

    const scrollContainer = document.querySelector('[data-main-scroll]');
    if (!scrollContainer) return;

    scrollContainerRef.current = scrollContainer as HTMLElement;

    // Set up scroll listener
    const handleScroll = () => {
      debouncedProcessViewport();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Initial process
    processViewport();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (processDebounceRef.current) {
        clearTimeout(processDebounceRef.current);
      }
    };
  }, [enabled, processViewport, debouncedProcessViewport]);

  return {
    /**
     * Manually trigger viewport check
     */
    checkViewport: processViewport,
    
    /**
     * Get list of currently visible Pokemon IDs
     */
    getVisiblePokemonIds: (): number[] => {
      const scrollContainer = scrollContainerRef.current || document.querySelector('[data-main-scroll]');
      if (!scrollContainer) return [];

      const { scrollTop, clientHeight } = scrollContainer;
      const viewportTop = scrollTop - bufferMargin;
      const viewportBottom = scrollTop + clientHeight + bufferMargin;

      const visibleIds: number[] = [];
      const pokemonElements = document.querySelectorAll('[data-pokemon-id]');

      pokemonElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementBottom = rect.bottom + scrollTop;

        if (elementBottom >= viewportTop && elementTop <= viewportBottom) {
          const pokemonId = element.getAttribute('data-pokemon-id');
          if (pokemonId) {
            visibleIds.push(parseInt(pokemonId));
          }
        }
      });

      return visibleIds;
    }
  };
}

export default useViewportCancellation;
