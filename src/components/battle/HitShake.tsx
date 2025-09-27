'use client'

import { useEffect, useRef } from 'react'

interface HitShakeProps {
  active: boolean
  children: React.ReactNode
}

/**
 * Minimal stand-in for the original HitShake component.
 * Applies a brief translate animation whenever `active` toggles true.
 */
export default function HitShake({ active, children }: HitShakeProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const node = ref.current
    node.classList.add('animate-hitshake')
    const timeout = window.setTimeout(() => {
      node.classList.remove('animate-hitshake')
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [active])

  return (
    <div ref={ref} className="inline-flex">
      {children}
      <style jsx>{`
        .animate-hitshake {
          animation: hitshake 0.4s ease-out;
        }
        @keyframes hitshake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
        }
      `}</style>
    </div>
  )
}
