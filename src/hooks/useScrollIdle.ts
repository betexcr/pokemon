import { useEffect, useState } from 'react'

const IDLE_DELAY_MS = 1000

type Subscriber = (idle: boolean) => void

const subscribers = new Set<Subscriber>()
let idleState = true
let isInitialized = false
let cleanupListeners: (() => void) | null = null
let idleTimeout: number | null = null

const passiveEvents: Array<keyof WindowEventMap> = ['wheel', 'touchmove', 'touchend']

const notifySubscribers = () => {
  subscribers.forEach(callback => callback(idleState))
}

const setIdleState = (next: boolean) => {
  if (idleState === next) return
  idleState = next
  notifySubscribers()
}

const handleScrollEvent = () => {
  if (!isInitialized || typeof window === 'undefined') return
  if (idleState) setIdleState(false)
  if (idleTimeout !== null) window.clearTimeout(idleTimeout)
  idleTimeout = window.setTimeout(() => setIdleState(true), IDLE_DELAY_MS)
}

const ensureListeners = () => {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  const scrollTargets = new Set<Element | Window>()

  const addScrollTarget = (target: Element | Window | null) => {
    if (!target || scrollTargets.has(target)) return
    target.addEventListener('scroll', handleScrollEvent, { passive: true })
    scrollTargets.add(target)
  }

  const clearScrollTargets = () => {
    scrollTargets.forEach(target => {
      target.removeEventListener('scroll', handleScrollEvent)
    })
    scrollTargets.clear()
  }

  const updateScrollTarget = () => {
    const container = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
    clearScrollTargets()
    if (container instanceof Element) {
      addScrollTarget(container)
    }
    addScrollTarget(window)
  }

  updateScrollTarget()

  const observer = new MutationObserver(() => {
    const container = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
    if (container instanceof Element && !scrollTargets.has(container)) {
      clearScrollTargets()
      addScrollTarget(container)
    }
  })

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true })
  }

  passiveEvents.forEach(eventName => {
    window.addEventListener(eventName, handleScrollEvent, { passive: true })
  })

  cleanupListeners = () => {
    clearScrollTargets()
    observer.disconnect()
    passiveEvents.forEach(eventName => {
      window.removeEventListener(eventName, handleScrollEvent)
    })
    if (idleTimeout !== null) {
      window.clearTimeout(idleTimeout)
      idleTimeout = null
    }
    isInitialized = false
    idleState = true
  }
}

export const useScrollIdle = () => {
  const [isIdle, setIsIdle] = useState<boolean>(() => idleState)

  useEffect(() => {
    ensureListeners()

    const handleUpdate: Subscriber = nextIdle => {
      setIsIdle(nextIdle)
    }

    subscribers.add(handleUpdate)

    return () => {
      subscribers.delete(handleUpdate)
      if (subscribers.size === 0 && cleanupListeners) {
        cleanupListeners()
        cleanupListeners = null
      }
    }
  }, [])

  return isIdle
}

export default useScrollIdle
