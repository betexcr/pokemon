'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Pages that scroll inside their own container (the Pokédex grid, the Pokémon detail page) don't
 * respond to ↑ / ↓ / Page Up / Page Down / Space until something inside them has focus, because the
 * browser scrolls the focused element's scroll container, not this one. This focuses the container
 * (which needs tabIndex={-1}) when the page shows and whenever `key` changes, unless the user is
 * already focused somewhere else, so the keyboard scrolls the page natively from the start.
 */
export function useKeyboardScrollFocus(ref: RefObject<HTMLElement | null>, key?: unknown): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const active = document.activeElement
    if (active && active !== document.body && active !== document.documentElement && !el.contains(active)) return
    if (active && el.contains(active) && active !== el) return
    el.focus({ preventScroll: true })
  }, [ref, key])
}
