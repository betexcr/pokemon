'use client'

interface BattleSceneProps {
  className?: string
  children?: React.ReactNode
}

export default function BattleScene({ className = '', children }: BattleSceneProps) {
  return (
    <div
      className={`relative flex h-72 w-full items-end justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 text-white shadow-xl ${className}`}
    >
      <div className="flex h-40 w-32 flex-col items-center justify-center rounded-xl bg-white/10 p-3 text-center">
        <span className="text-sm uppercase tracking-wide text-white/70">Opponent</span>
        <span className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg">⚔️</span>
      </div>
      <div className="absolute inset-x-8 bottom-10 h-2 rounded-full bg-black/30">
        <div className="h-full w-1/2 rounded-full bg-emerald-400/80" />
      </div>
      <div className="flex h-40 w-32 flex-col items-center justify-center rounded-xl bg-white/10 p-3 text-center">
        <span className="text-sm uppercase tracking-wide text-white/70">You</span>
        <span className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg">🛡️</span>
      </div>
      {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}
    </div>
  )
}
