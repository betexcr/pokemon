'use client'

import React, { useMemo } from 'react'
import { useRotatingFact } from '@/hooks/useRotatingFact'
import { factBuckets } from '@/data/contests/funFacts'
import { Badge } from '@/components/ui/Badge'

export function FactsSpotlight({
  variant = 'all',
  title = 'Spotlight',
}: {
  variant?: 'cute'|'beauty'|'cool'|'tough'|'clever'|'all'
  title?: string
}) {
  const bucketIds = variant === 'all' ? undefined : (factBuckets as any)[variant]
  const { fact, index, total } = useRotatingFact({ intervalMs: 10000, bucketIds })

  const tone = useMemo(() => {
    switch (variant) {
      case 'beauty': return 'violet'
      case 'cool': return 'blue'
      case 'tough': return 'amber'
      case 'clever': return 'green'
      case 'cute': return 'pink'
      default: return 'pink'
    }
  }, [variant])

  return (
    <section
      className="
        relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-border
        bg-gradient-to-br from-bg to-surface shadow-card
      "
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-40 bg-pink-300/60" />
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <Badge tone={tone as any}>{variant === 'all' ? 'all' : variant}</Badge>
      </header>
      <div className="flex items-start gap-3">
        <div className="text-2xl select-none" aria-hidden>✨</div>
        <div className="flex-1">
          <p className="text-base sm:text-lg text-slate-800 dark:text-slate-100">
            {fact.text}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {fact.tags.slice(0,3).map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {index+1}/{total}
            </span>
          </div>
        </div>
        <button
          className="ml-2 rounded-full px-3 py-1 text-xs border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-800/60 transition"
          onClick={(e) => {
            const el = e.currentTarget
            el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 180 })
          }}
        >
          Sparkle
        </button>
      </div>
    </section>
  )
}


