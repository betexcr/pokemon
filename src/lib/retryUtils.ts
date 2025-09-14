// Utility for dynamic retry logic with exponential backoff and jitter

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 10,
  baseDelayMs: 500,
  maxDelayMs: 30000, // 30 seconds max
  jitterMs: 1000, // 1 second jitter
  backoffMultiplier: 1.5,
  shouldRetry: (error: any, attempt: number) => {
    // Retry on network errors, timeout errors, and document not found
    if (error?.code === 'unavailable' || 
        error?.message?.includes('not found') || 
        error?.message?.includes('does not exist')) {
      return true;
    }
    // Don't retry on authentication or permission errors
    if (error?.code === 'permission-denied' || 
        error?.code === 'unauthenticated') {
      return false;
    }
    return true;
  }
};

export class DynamicRetry {
  private config: RetryConfig;
  private onProgress?: (attempt: number, delay: number, error?: any) => void;

  constructor(config: Partial<RetryConfig> = {}, onProgress?: (attempt: number, delay: number, error?: any) => void) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.onProgress = onProgress;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        console.log(`✅ Operation succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!this.config.shouldRetry?.(error, attempt)) {
          console.log(`❌ Error not retryable on attempt ${attempt}:`, error);
          throw error;
        }
        
        // Don't delay after the last attempt
        if (attempt === this.config.maxAttempts) {
          console.log(`❌ All ${this.config.maxAttempts} attempts failed`);
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        
        console.log(`⏳ Attempt ${attempt} failed, retrying in ${delay}ms...`, {
          error: error?.message || error,
          nextAttempt: attempt + 1,
          maxAttempts: this.config.maxAttempts
        });
        
        this.onProgress?.(attempt, delay, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.config.jitterMs;
    
    // Cap at max delay
    const totalDelay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);
    
    return Math.round(totalDelay);
  }

  // Static method for simple retry operations
  static async retry<T>(
    operation: () => Promise<T>, 
    config: Partial<RetryConfig> = {},
    onProgress?: (attempt: number, delay: number, error?: any) => void
  ): Promise<T> {
    const retry = new DynamicRetry(config, onProgress);
    return retry.execute(operation);
  }
}

// Specialized retry configs for different scenarios
export const BATTLE_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 15,
  baseDelayMs: 1000,
  maxDelayMs: 20000,
  jitterMs: 2000,
  backoffMultiplier: 1.3,
  shouldRetry: (error: any, attempt: number) => {
    // More aggressive retry for battle documents
    if (error?.message?.includes('does not exist') || 
        error?.message?.includes('not found')) {
      return true;
    }
    // Retry on network issues
    if (error?.code === 'unavailable' || 
        error?.code === 'deadline-exceeded') {
      return true;
    }
    return false;
  }
};

export const ROOM_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 8,
  baseDelayMs: 300,
  maxDelayMs: 5000,
  jitterMs: 500,
  backoffMultiplier: 1.5
};
