'use client'

import { useEffect, useState, useMemo } from 'react'
import type { FxKind } from './fx/MoveFX.types'

interface AttackAnimatorProps {
  kind: FxKind
  from: { x: number; y: number }
  to: { x: number; y: number }
  playKey: number
  power?: number
  onDone?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  dx: number
  dy: number
}

export default function AttackAnimator({ kind, from, to, playKey, power = 1, onDone }: AttackAnimatorProps) {
  const [phase, setPhase] = useState<'active' | 'done'>('active')
  const [shake, setShake] = useState(false)

  const animDuration = Math.min(800, 400 + power * 40)

  useEffect(() => {
    setPhase('active')
    const shakeTimer = power >= 80 ? window.setTimeout(() => setShake(true), animDuration * 0.6) : undefined
    const shakeEnd = shakeTimer ? window.setTimeout(() => setShake(false), animDuration * 0.6 + 200) : undefined
    const timer = window.setTimeout(() => {
      setPhase('done')
      onDone?.()
    }, animDuration + 100)
    return () => {
      window.clearTimeout(timer)
      if (shakeTimer) window.clearTimeout(shakeTimer)
      if (shakeEnd) window.clearTimeout(shakeEnd)
    }
  }, [playKey, onDone, animDuration, power])

  const particles = useMemo(() => {
    const count = Math.min(20, 6 + Math.floor(power / 15))
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: from.x + (to.x - from.x) * (i / count),
      y: from.y + (to.y - from.y) * (i / count),
      size: 4 + Math.random() * 6,
      delay: (i / count) * animDuration * 0.5,
      duration: 300 + Math.random() * 300,
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
    })) as Particle[]
  }, [playKey, from, to, power, animDuration])

  if (phase === 'done') return null

  const theme = FX_THEMES[kind] || FX_THEMES.default
  const beamWidth = Math.max(0.4, Math.min(power / 60, 2.5))

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${shake ? 'animate-battle-shake' : ''}`}
      style={{ '--shake-intensity': `${Math.min(6, power / 20)}px` } as React.CSSProperties}
    >
      {/* Beam */}
      <span
        key={`beam-${playKey}`}
        className="absolute origin-left rounded-full"
        style={{
          ...computeBeamStyle({ from, to, color: theme.primary, power: beamWidth }),
          animation: `beam-travel ${animDuration}ms ease-out forwards`,
          opacity: 0.85,
        }}
      />

      {/* Origin glow */}
      <span
        key={`glow-start-${playKey}`}
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${from.x * 100}%`,
          top: `${from.y * 100}%`,
          width: `${12 + power / 10}px`,
          height: `${12 + power / 10}px`,
          background: `radial-gradient(circle, ${theme.primary}, transparent)`,
          animation: `pulse-glow ${animDuration * 0.6}ms ease-out forwards`,
        }}
      />

      {/* Impact glow */}
      <span
        key={`glow-end-${playKey}`}
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          width: `${16 + power / 8}px`,
          height: `${16 + power / 8}px`,
          background: `radial-gradient(circle, ${theme.secondary}, transparent)`,
          animation: `pulse-glow ${animDuration * 0.5}ms ease-out ${animDuration * 0.5}ms forwards`,
          opacity: 0,
        }}
      />

      {/* Particles */}
      {particles.map(p => (
        <span
          key={`p-${playKey}-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `calc(${p.x * 100}% + ${p.dx}px)`,
            top: `calc(${p.y * 100}% + ${p.dy}px)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.id % 2 === 0 ? theme.primary : theme.secondary,
            boxShadow: `0 0 ${p.size}px ${theme.primary}`,
            animation: `particle-burst ${p.duration}ms ease-out ${p.delay}ms forwards`,
            opacity: 0,
            ...theme.particleExtra,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes beam-travel {
          0% { transform: translateY(-50%) scaleX(0); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateY(-50%) scaleX(1); opacity: 0; }
        }
        @keyframes pulse-glow {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes particle-burst {
          0% { transform: scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scale(1.5) translate(var(--dx, 0px), var(--dy, 0px)); opacity: 0; }
        }
        .animate-battle-shake {
          animation: shake-screen 200ms ease-in-out;
        }
        @keyframes shake-screen {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(var(--shake-intensity), calc(var(--shake-intensity) * -0.5)); }
          40% { transform: translate(calc(var(--shake-intensity) * -0.8), var(--shake-intensity)); }
          60% { transform: translate(var(--shake-intensity), calc(var(--shake-intensity) * 0.3)); }
          80% { transform: translate(calc(var(--shake-intensity) * -0.5), calc(var(--shake-intensity) * -0.8)); }
        }
      `}</style>
    </div>
  )
}

type FxTheme = {
  primary: string
  secondary: string
  particleExtra?: React.CSSProperties
}

const FX_THEMES: Record<string, FxTheme> = {
  fire: { primary: '#fb7185', secondary: '#fbbf24', particleExtra: { borderRadius: '30% 70%' } },
  water: { primary: '#38bdf8', secondary: '#818cf8', particleExtra: { borderRadius: '50%' } },
  electric: { primary: '#facc15', secondary: '#fef08a', particleExtra: { borderRadius: '10%' } },
  grass: { primary: '#4ade80', secondary: '#a3e635', particleExtra: { borderRadius: '50% 0' } },
  ice: { primary: '#67e8f9', secondary: '#e0f2fe', particleExtra: { borderRadius: '50%' } },
  psychic: { primary: '#c084fc', secondary: '#f0abfc', particleExtra: { borderRadius: '50%' } },
  fairy: { primary: '#f472b6', secondary: '#fbcfe8', particleExtra: { borderRadius: '50%' } },
  dark: { primary: '#6b7280', secondary: '#1f2937', particleExtra: { borderRadius: '50%' } },
  fighting: { primary: '#ef4444', secondary: '#f97316', particleExtra: { borderRadius: '20%' } },
  dragon: { primary: '#8b5cf6', secondary: '#6366f1', particleExtra: { borderRadius: '40%' } },
  ghost: { primary: '#a78bfa', secondary: '#581c87', particleExtra: { borderRadius: '50%' } },
  rock: { primary: '#a8a29e', secondary: '#78716c', particleExtra: { borderRadius: '15%' } },
  ground: { primary: '#d97706', secondary: '#92400e', particleExtra: { borderRadius: '25%' } },
  steel: { primary: '#94a3b8', secondary: '#cbd5e1', particleExtra: { borderRadius: '50%' } },
  poison: { primary: '#a855f7', secondary: '#7e22ce', particleExtra: { borderRadius: '50%' } },
  bug: { primary: '#84cc16', secondary: '#65a30d', particleExtra: { borderRadius: '30%' } },
  flying: { primary: '#93c5fd', secondary: '#bfdbfe', particleExtra: { borderRadius: '50%' } },
  normal: { primary: '#a8a29e', secondary: '#d6d3d1', particleExtra: { borderRadius: '50%' } },
  default: { primary: '#94a3b8', secondary: '#cbd5e1' },
}

function computeBeamStyle({
  from, to, color, power,
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
    height: `${power * 0.75}rem`,
    transformOrigin: 'left center',
    transform: `translateY(-50%) rotate(${angle}rad)`,
    background: `linear-gradient(90deg, ${color}, transparent)`,
  } as React.CSSProperties
}
