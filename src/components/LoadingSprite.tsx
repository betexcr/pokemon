'use client'

import React from 'react'
import { PMD_TOP50_PORTRAITS, PMD_TOP50_SPRITES_IDLE, PMD_TOP50_SPRITES_WALK } from '@/data/pmdManifest'
import dynamic from 'next/dynamic'
const AnimatedPmdSprite = dynamic(() => import('./AnimatedPmdSprite'), { ssr: false })

type LoadingSpriteProps = {
  variant?: 'portrait' | 'sprite'
  size?: number
  className?: string
  title?: string
}

export default function LoadingSprite({ variant = 'portrait', size = 64, className = '', title = 'Loading' }: LoadingSpriteProps) {
  const list = variant === 'portrait' ? PMD_TOP50_PORTRAITS : PMD_TOP50_SPRITES_WALK
  const src = React.useMemo(() => list[Math.floor(Math.random() * list.length)] || '/loading.gif', [list])
  if (variant === 'sprite') {
    return <AnimatedPmdSprite src={src} size={size} className={className} title={title} />
  }
  const style: React.CSSProperties = { width: size, height: size }
  return <img src={src} alt={title} title={title} style={style} className={className} />
}


