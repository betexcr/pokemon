// Error reporting utilities for non-React contexts

// Global error reporting function that can be called from anywhere
let globalErrorReporter: ((error: any) => void) | null = null

export function setGlobalErrorReporter(reporter: (error: any) => void) {
  globalErrorReporter = reporter
}

export function reportError(error: any) {
  if (globalErrorReporter) {
    // Defer error reporting to avoid setState during render
    setTimeout(() => {
      globalErrorReporter!(error)
    }, 0)
  } else {
    // Fallback to console if no reporter is set
    console.error('Error reported but no global reporter set:', error)
  }
}

export function reportDataLoadingError(message: string, context?: any) {
  reportError({
    message,
    type: 'data_loading',
    severity: 'medium',
    context,
    retryable: true
  })
}

export function reportApiError(message: string, context?: any) {
  reportError({
    message,
    type: 'api_error',
    severity: 'high',
    context,
    retryable: true
  })
}

export function reportNetworkError(message: string, context?: any) {
  reportError({
    message,
    type: 'network_error',
    severity: 'high',
    context,
    retryable: true
  })
}
