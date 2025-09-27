'use client'

import { useEffect, useState } from 'react'

interface BattleStartFlashProps {
  onDone?: () => void
  durationMs?: number
}

/**
 * Simple full-screen overlay that flashes a "battle starting" message
 * before handing control back to the battle page.
 */
export default function BattleStartFlash({ onDone, durationMs = 2000 }: BattleStartFlashProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, durationMs)
    return () => window.clearTimeout(timer)
  }, [durationMs, onDone])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
      <div className="flex flex-col items-center gap-6 text-center">
        <img
          src="/loading.gif"
          alt="Battle starting"
          width={128}
          height={128}
          className="h-32 w-32"
        />
        <p className="text-3xl font-bold uppercase tracking-[0.35em]">Battle Start!</p>
        <p className="text-sm text-white/80">Get ready to send out your first Pokémon…</p>
      </div>
    </div>
  )
}
