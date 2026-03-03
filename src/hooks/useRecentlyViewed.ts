import { useState, useEffect, useCallback } from 'react';

const MAX_RECENT_ITEMS = 10;
const STORAGE_KEY = 'pokemon.recentlyViewed';

interface RecentlyViewedPokemon {
  id: number;
  name: string;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedPokemon[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsHydrated(true);
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Sort by timestamp descending (most recent first)
            const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
            setRecentlyViewed(sorted.slice(0, MAX_RECENT_ITEMS));
          }
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    if (!isHydrated) return; // Don't save during initial render
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
      }
    } catch (error) {
      console.error('Error saving recently viewed to localStorage:', error);
    }
  }, [recentlyViewed, isHydrated]);

  // Add a Pokemon to recently viewed
  const addRecentlyViewed = useCallback((id: number, name: string) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== id);
      
      // Add to beginning with current timestamp
      const updated = [
        { id, name, timestamp: Date.now() },
        ...filtered
      ];
      
      // Keep only MAX_RECENT_ITEMS
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  }, []);

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  // Remove a specific Pokemon from recently viewed
  const removeRecentlyViewed = useCallback((id: number) => {
    setRecentlyViewed(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    removeRecentlyViewed
  };
}
