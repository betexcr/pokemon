'use client'

import React from 'react'

export function Badge({
  children,
  className = '',
  tone = 'pink',
}: React.PropsWithChildren<{ className?: string; tone?: 'pink'|'blue'|'green'|'amber'|'violet' }>) {
  const map: Record<string, string> = {
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[tone]} ${className}`}>
      {children}
    </span>
  )
}


