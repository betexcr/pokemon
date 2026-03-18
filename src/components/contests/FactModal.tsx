'use client'

import React, { useEffect } from 'react'
import type { ContestFact } from '@/data/contests/funFacts'
import { Badge } from '@/components/ui/Badge'

export function FactModal({
  fact, onClose,
}: {
  fact: ContestFact | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!fact) return null

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for older browsers or permission-denied
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const share = async () => {
    const text = `Pokémon Contest Fun Fact: ${fact.text} (#${fact.id})`
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({ text, title: 'Pokémon Contests' })
      } else {
        await copyToClipboard(text)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        await copyToClipboard(text)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        role="presentation"
        className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fun Fact details"
        className="fixed left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2
                      rounded-3xl border border-border bg-surface shadow-card p-5"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-text">Fun Fact</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full px-3 py-1 text-xs border border-border hover:bg-surface/60"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-text">{fact.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {fact.tags.map(t => <Badge key={t}>{t}</Badge>)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(fact.text)}
              className="rounded-full px-3 py-1 text-xs border border-border hover:bg-surface/60"
            >
              Copy
            </button>
            <button
              onClick={share}
              className="rounded-full px-3 py-1 text-xs border border-border hover:bg-surface/60"
            >
              Share
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">#{fact.id}</p>
      </div>
    </div>
  )
}


