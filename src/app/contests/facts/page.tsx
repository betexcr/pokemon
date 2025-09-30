"use client"
import React, { useMemo, useState } from 'react'
import { contestFunFacts, type ContestFact } from '@/data/contests/funFacts'
import { FactsSpotlight } from '@/components/contests/FactsSpotlight'
import { FactFilters } from '@/components/contests/FactFilters'
import { FactCard } from '@/components/contests/FactCard'
import { FactModal } from '@/components/contests/FactModal'
import AppHeader from '@/components/AppHeader'
import OptimizedLink from '@/components/OptimizedLink'

export default function ContestFactsPage() {
  const [q, setQ] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [open, setOpen] = useState<ContestFact | null>(null)

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase()
    return contestFunFacts.filter(f => {
      const tagOk = tags.length === 0 || f.tags.some(t => tags.includes(t))
      const textOk = !qn || f.text.toLowerCase().includes(qn) || f.id.toLowerCase().includes(qn)
      return tagOk && textOk
    })
  }, [q, tags])

  const onClear = () => {
    setQ('')
    setTags([])
  }

  return (
    <div>
      <AppHeader
        title="Contest Fun Facts"
        subtitle="Learn contest mechanics with spotlights, filters, and details"
        iconKey="contests"
        showIcon={true}
        showToolbar={true}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 space-y-8">
        {/* Local tabs per Navigation guidelines */}
        <nav aria-label="Contests sections" className="-mt-4 mb-2">
          <ul className="flex items-center gap-2 text-sm">
            <li>
              <span className="inline-flex items-center rounded-full px-3 py-1 border border-border bg-surface text-text shadow-card">
                Fun Facts
              </span>
            </li>
            <li>
              <OptimizedLink
                href="/contests/sim"
                className="inline-flex items-center rounded-full px-3 py-1 border border-border hover:bg-surface/60 text-text"
              >
                Simulator
              </OptimizedLink>
            </li>
          </ul>
        </nav>

      {/* Spotlight row mirrors Top-50 "hero/spotlight" feel */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FactsSpotlight variant="all" title="Editor’s Spotlight" />
        <div className="grid gap-4">
          <FactsSpotlight variant="beauty" title="Beauty Focus" />
          <FactsSpotlight variant="cool" title="Cool Focus" />
        </div>
      </div>

      {/* Controls */}
      <section className="space-y-3">
        <FactFilters
          q={q}
          setQ={setQ}
          activeTags={tags}
          setActiveTags={setTags}
          onClear={onClear}
        />
        <p className="text-xs text-muted">
          Showing <span className="font-semibold">{filtered.length}</span> of {contestFunFacts.length} facts
        </p>
      </section>

      {/* Grid */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(f => (
            <FactCard key={f.id} fact={f} onOpen={setOpen} />
          ))}
        </div>
      </section>

      {/* Modal */}
      <FactModal fact={open} onClose={() => setOpen(null)} />
    </main>
    </div>
  )
}


