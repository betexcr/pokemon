/**
 * Hook for managing request cancellation on route changes and component unmount
 * Automatically cancels all in-flight requests when user navigates away
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { requestManager } from '@/lib/requestManager';

interface UseRequestCancellationOptions {
  /**
   * Specific contexts to cancel (e.g., 'pokedex', 'search')
   * If not provided, cancels ALL requests on navigation
   */
  contexts?: string[];
  /**
   * Don't cancel on route change, useful for components that persist across routes
   */
  skipNavigation?: boolean;
  /**
   * Custom callback when route changes
   */
  onRouteChange?: (newPath: string) => void;
}

/**
 * Hook to automatically cancel requests on navigation or unmount
 */
export function useRequestCancellation(options: UseRequestCancellationOptions = {}) {
  const { contexts, skipNavigation = false, onRouteChange } = options;
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // Cancel requests when component unmounts
  useEffect(() => {
    return () => {
      if (contexts) {
        contexts.forEach(context => requestManager.cancelContext(context));
      } else {
        // Only cancel if not skipping navigation (we'll handle that separately)
        if (!skipNavigation) {
          requestManager.cancelAll();
        }
      }
    };
  }, [contexts, skipNavigation]);

  // Cancel requests when route changes
  useEffect(() => {
    if (skipNavigation) return;

    if (prevPathnameRef.current !== pathname) {
      console.log(`🛑 Route changed from ${prevPathnameRef.current} to ${pathname}, cancelling requests`);

      if (contexts) {
        contexts.forEach(context => requestManager.cancelContext(context));
      } else {
        requestManager.cancelAll();
      }

      onRouteChange?.(pathname);
      prevPathnameRef.current = pathname;
    }
  }, [pathname, contexts, skipNavigation, onRouteChange]);

  return {
    cancelAll: () => requestManager.cancelAll(),
    cancelContext: (context: string) => requestManager.cancelContext(context),
    getStats: () => requestManager.getRequestStats(),
  };
}

export default useRequestCancellation;
