import { getPokemon } from '@/lib/api'
import type { Pokemon } from '@/types/pokemon'

type LoaderStatus = 'pending' | 'loading' | 'loaded' | 'failed'

interface ViewportPriorityLoaderOptions {
  concurrency?: number
  retryDelayMs?: number
}

export default class ViewportPriorityLoader {
  private readonly onPokemonLoaded: (pokemon: Pokemon) => void
  private readonly status = new Map<number, LoaderStatus>()
  private readonly queue: number[] = []
  private readonly failed = new Set<number>()
  private readonly inFlight = new Set<number>()
  private processing = false
  private readonly maxConcurrency: number
  private readonly retryDelayMs: number

  constructor(onPokemonLoaded: (pokemon: Pokemon) => void, options: ViewportPriorityLoaderOptions = {}) {
    this.onPokemonLoaded = onPokemonLoaded
    this.maxConcurrency = Math.max(1, options.concurrency ?? 3)
    this.retryDelayMs = Math.max(0, options.retryDelayMs ?? 2_000)
  }

  loadWithPriority(ids: number[]): Promise<void> {
    if (ids.length === 0) return Promise.resolve()

    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i]
      const current = this.status.get(id)
      if (current === 'loaded' || this.inFlight.has(id)) {
        continue
      }

      this.status.set(id, current === 'failed' ? 'failed' : 'pending')
      this.enqueue(id)
    }

    return this.processQueue()
  }

  async retryFailedPokemon(): Promise<void> {
    if (this.failed.size === 0) return

    const toRetry = Array.from(this.failed)
    this.failed.clear()

    // Re-enqueue failed IDs keeping their priority (front of the queue)
    for (let i = toRetry.length - 1; i >= 0; i--) {
      const id = toRetry[i]
      this.status.set(id, 'pending')
      this.queue.unshift(id)
    }

    await this.processQueue(true)
  }

  forceViewportUpdate(): Promise<void> {
    return this.processQueue()
  }

  private enqueue(id: number) {
    // Remove any existing occurrences so newest request has higher priority
    const existingIndex = this.queue.indexOf(id)
    if (existingIndex !== -1) {
      this.queue.splice(existingIndex, 1)
    }
    this.queue.unshift(id)
  }

  private async processQueue(isRetry = false): Promise<void> {
    if (this.processing) return
    this.processing = true

    try {
      while (this.queue.length > 0 || this.inFlight.size > 0) {
        while (this.queue.length > 0 && this.inFlight.size < this.maxConcurrency) {
          const nextId = this.queue.shift()
          if (nextId === undefined) break

          if (this.inFlight.has(nextId) || this.status.get(nextId) === 'loaded') {
            continue
          }

          this.fetchPokemon(nextId).catch(() => {
            /* errors handled inside fetchPokemon */
          })
        }

        if (this.inFlight.size === 0) {
          break
        }

        await new Promise(resolve => setTimeout(resolve, 25))
      }

      if (isRetry && this.failed.size > 0 && this.retryDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs))
      }
    } finally {
      this.processing = false
    }
  }

  private async fetchPokemon(id: number): Promise<void> {
    try {
      this.inFlight.add(id)
      this.status.set(id, 'loading')

      const pokemon = await getPokemon(id)
      this.status.set(id, 'loaded')
      this.failed.delete(id)
      this.onPokemonLoaded(pokemon)
    } catch (error) {
      console.warn(`ViewportPriorityLoader failed to load Pokémon #${id}:`, error)
      this.status.set(id, 'failed')
      this.failed.add(id)
    } finally {
      this.inFlight.delete(id)
    }
  }
}


