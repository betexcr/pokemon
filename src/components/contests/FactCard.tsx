'use client'

import React from 'react'
import type { ContestFact } from '@/data/contests/funFacts'
import { Badge } from '@/components/ui/Badge'

export function FactCard({
  fact,
  onOpen,
}: {
  fact: ContestFact
  onOpen: (f: ContestFact) => void
}) {
  const tone = (tag?: string) =>
    tag === 'gen3' ? 'amber' :
    tag === 'gen4' ? 'violet' :
    tag === 'bdsp' ? 'blue' :
    tag === 'combo' ? 'green' :
    tag === 'ribbon' ? 'pink' :
    'pink'

  return (
    <article
      tabIndex={0}
      title="Press Enter to open"
      onClick={() => onOpen(fact)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(fact)}
      className="
        group cursor-pointer rounded-2xl border border-border
        bg-surface backdrop-blur shadow-card hover:shadow-card-compact
        transition-all focus:outline-none focus:ring-2 focus:ring-pink-400
        p-4 flex flex-col gap-3
      "
      aria-label={`Open fact ${fact.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">
          Fun Fact
        </h3>
        <div className="flex gap-1">
          {fact.tags.slice(0,3).map((t) => (
            <Badge key={t} tone={tone(t) as any}>{t}</Badge>
          ))}
        </div>
      </div>
      <p className="text-text text-sm leading-relaxed">
        {fact.text}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted">#{fact.id}</span>
        <span className="text-xs text-pink-600 opacity-0 group-hover:opacity-100 transition">
          View details →
        </span>
      </div>
    </article>
  )
}


