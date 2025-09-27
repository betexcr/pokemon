'use client'

interface HPBarProps {
  current?: number
  value?: number
  max: number
  label?: string
  className?: string
}

export default function HPBar({ current, value, max, label, className = '' }: HPBarProps) {
  const hp = current ?? value ?? 0
  const percentage = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, max)) * 100)))
  let color = 'bg-emerald-500'
  if (percentage < 25) color = 'bg-red-500'
  else if (percentage < 50) color = 'bg-amber-500'

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="h-3 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-right text-[10px] font-mono text-muted-foreground">{hp} / {max}</p>
    </div>
  )
}
