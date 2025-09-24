'use client'

import React from 'react'

type AnimatedPmdSpriteProps = {
  src: string
  size?: number
  className?: string
  durationSec?: number
  title?: string
}

// Simple spritesheet animator that assumes horizontal strip where frameWidth == frameHeight.
// It computes frame count from image natural dimensions and animates with CSS steps().
export default function AnimatedPmdSprite({ src, size = 96, className = '', durationSec = 1.2, title = 'Loading' }: AnimatedPmdSpriteProps) {
  const [frames, setFrames] = React.useState<number>(8)
  const [sheetReady, setSheetReady] = React.useState<boolean>(false)
  const key = React.useMemo(() => `pmd-anim-${Math.random().toString(36).slice(2)}` , [])

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      try {
        const h = img.naturalHeight || 1
        const w = img.naturalWidth || h
        const f = Math.max(1, Math.floor(w / h))
        setFrames(f)
        setSheetReady(true)
      } catch {
        setFrames(8)
        setSheetReady(true)
      }
    }
    img.onerror = () => setSheetReady(true)
    img.src = src
  }, [src])

  const bgStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${src})`,
    backgroundRepeat: 'no-repeat',
    backgroundPositionX: '0%',
    backgroundPositionY: '0%',
    backgroundSize: `${frames * 100}% 100%`,
    imageRendering: 'pixelated'
  }

  return (
    <>
      {/* Inject dynamic keyframes for this instance */}
      <style>{`@keyframes ${key} { from { background-position-x: 0%; } to { background-position-x: -${(frames - 1) / frames * 100}%; } }`}</style>
      <div 
        title={title}
        className={className}
        style={{
          ...bgStyle,
          animation: sheetReady ? `${key} ${durationSec}s steps(${frames}) infinite` : undefined
        }}
      />
    </>
  )
}



