'use client'

import { useEffect, useState } from 'react'

export interface StatusEvent {
  id?: string | number
  message?: string
  tone?: 'info' | 'success' | 'warning' | 'danger'
  durationMs?: number
  code?: string
  side?: 'ally' | 'foe'
}

interface StatusPopupsProps {
  events: StatusEvent[]
  anchorAlly?: { x: number; y: number }
  anchorFoe?: { x: number; y: number }
}

export default function StatusPopups({ events }: StatusPopupsProps) {
  const [visibleEvents, setVisibleEvents] = useState(events)

  useEffect(() => {
    if (events.length === 0) {
      setVisibleEvents([])
      return
    }

    const timestamp = Date.now()
    const enriched = events.map((event, index) => {
      const generatedId = `${timestamp}-${index}`
      return {
        ...event,
        id: event.id ?? generatedId,
      }
    })

    setVisibleEvents(enriched)

    const timers = enriched.map((event) => {
      const timeout = window.setTimeout(() => {
        setVisibleEvents((current) => current.filter((item) => item.id !== event.id))
      }, event.durationMs ?? 2000)
      return timeout
    })

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [events])

  if (visibleEvents.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex flex-col items-center gap-2">
      {visibleEvents.map((event, index) => (
        <div
          key={event.id ?? index}
          className={`min-w-[220px] max-w-[320px] rounded-lg border px-4 py-2 text-sm shadow-lg backdrop-blur ${toneStyles[event.tone ?? 'info']}`}
        >
          {event.message || formatStatus(event)}
        </div>
      ))}
    </div>
  )
}

const toneStyles: Record<string, string> = {
  info: 'bg-sky-500/15 border-sky-500/40 text-sky-100',
  success: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100',
  warning: 'bg-amber-500/15 border-amber-500/40 text-amber-100',
  danger: 'bg-red-500/15 border-red-500/40 text-red-100',
}

function formatStatus(event: StatusEvent) {
  const target = event.side === 'ally' ? 'Your side' : event.side === 'foe' ? 'Foe' : 'Battle'
  return `${target}: ${event.code ?? 'Status changed'}`
}
