'use client'

import { useEffect } from 'react'
import type { FxKind } from './fx/MoveFX.types'

interface AttackAnimatorProps {
  kind: FxKind
  from: { x: number; y: number }
  to: { x: number; y: number }
  playKey: number
  power?: number
  onDone?: () => void
}

/**
 * Lightweight placeholder for the legacy AttackAnimator.
 * In this simplified version we just render a transient beam between two points
 * and call onDone once the short animation finishes.
 */
export default function AttackAnimator({ kind, from, to, playKey, power = 1, onDone }: AttackAnimatorProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDone?.()
    }, 600)
    return () => window.clearTimeout(timeout)
  }, [playKey, onDone])

  const color = getFxColor(kind)
  const start = { left: `${from.x * 100}%`, top: `${from.y * 100}%` }
  const end = { left: `${to.x * 100}%`, top: `${to.y * 100}%` }

  return (
    <>
      <span
        key={`attack-start-${playKey}`}
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
        style={{ ...start, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
      />
      <span
        key={`attack-end-${playKey}`}
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
        style={{ ...end, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
      />
      <span
        key={`attack-beam-${playKey}`}
        className="pointer-events-none absolute origin-left rounded-full opacity-80"
        style={computeBeamStyle({ from, to, color, power })}
      />
    </>
  )
}

function getFxColor(kind: FxKind): string {
  switch (kind) {
    case 'electric':
      return '#facc15'
    case 'water':
      return '#38bdf8'
    case 'fire':
      return '#fb7185'
    case 'grass':
      return '#4ade80'
    case 'ice':
      return '#38bdf8'
    case 'psychic':
      return '#c084fc'
    case 'fairy':
      return '#f472b6'
    default:
      return '#94a3b8'
  }
}

function computeBeamStyle({
  from,
  to,
  color,
  power,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  power: number
}) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const angle = Math.atan2(dy, dx)
  const distance = Math.sqrt(dx * dx + dy * dy)

  return {
    left: `${from.x * 100}%`,
    top: `${from.y * 100}%`,
    width: `${distance * 100}%`,
    height: `${Math.max(0.5, Math.min(power, 2)) * 0.75}rem`,
    transform: `translate(-4px, -50%) rotate(${angle}rad)`,
    background: `linear-gradient(90deg, ${color}, transparent)`
  } as React.CSSProperties
}
