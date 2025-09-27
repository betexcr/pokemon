'use client'

import { useEffect } from 'react'
import { useGlobalErrorCatcher } from '@/hooks/useGlobalErrorCatcher'

export default function GlobalErrorCatcher() {
  // Initialize the global error catcher
  useGlobalErrorCatcher({
    enableConsoleCapture: true,
    enableUnhandledRejection: true,
    enableNetworkErrorCapture: true,
    enableDataLoadingErrorCapture: true
  })

  // This component doesn't render anything, it just initializes the error catching
  return null
}
