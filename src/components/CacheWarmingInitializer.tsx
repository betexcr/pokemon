"use client";

import { useEffect } from 'react';
import { startProgressiveCacheWarming } from '@/lib/imageCache';

export default function CacheWarmingInitializer() {
  useEffect(() => {
    // Start progressive cache warming after component mounts
    // This runs in the background and doesn't block the UI
    startProgressiveCacheWarming();
  }, []);

  // This component doesn't render anything
  return null;
}




