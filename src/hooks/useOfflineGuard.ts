'use client'

import { useNetworkState, type NetworkState } from '@/lib/offlineManager'

export interface OfflineGuardState {
  isOffline: boolean
  isSlowConnection: boolean
  networkState: NetworkState
  /** True when the feature requires network and user is offline */
  isFeatureBlocked: boolean
}

/**
 * Hook for pages/components that need offline awareness.
 * Pass `requiresNetwork` to indicate the feature needs connectivity.
 */
export function useOfflineGuard(requiresNetwork = false): OfflineGuardState {
  const networkState = useNetworkState()
  return {
    isOffline: !networkState.isOnline,
    isSlowConnection: networkState.isSlowConnection,
    networkState,
    isFeatureBlocked: requiresNetwork && !networkState.isOnline,
  }
}
