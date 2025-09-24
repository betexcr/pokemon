"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PokemonTrendView, RegionKey } from '@/lib/trends/types'
import { REGION_KEYS } from '@/lib/trends/data'

const regionColors: Record<RegionKey, string> = {
  Global: '#2563eb',
  Asia: '#ec4899',
  US: '#10b981',
  EU: '#f97316',
}

interface Props {
  pokemon: PokemonTrendView
  activeRegion: RegionKey
}

interface Dimensions {
  width: number
  height: number
}

function getSpriteUrl(entry: PokemonTrendView) {
  const id = entry.national_number
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function PopularityChart({ pokemon, activeRegion }: Props) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dims, setDims] = useState<Dimensions>({ width: 640, height: 280 })
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const resize = () => {
      const rect = el.getBoundingClientRect()
      setDims({ width: Math.max(rect.width, 320), height: 300 })
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pointsByRegion = useMemo(() => {
    return REGION_KEYS.map((region) => ({
      region,
      values: pokemon.trend.map(({ year, values }) => ({ year, value: values[region] })),
    }))
  }, [pokemon])

  const maxY = useMemo(() => {
    return Math.max(10, ...pointsByRegion.flatMap((series) => series.values.map((v) => v.value)))
  }, [pointsByRegion])

  const padding = { left: 48, right: 24, top: 24, bottom: 40 }
  const width = dims.width
  const height = dims.height
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const years = pokemon.trend.map((point) => point.year)
  const stepX = years.length > 1 ? innerWidth / (years.length - 1) : innerWidth

  const hoverPayload = useMemo(() => {
    if (hoverIndex == null) return null
    const year = years[hoverIndex]
    const series = pointsByRegion.map(({ region, values }) => ({ region, value: values[hoverIndex]?.value ?? 0 }))
    return { year, series }
  }, [hoverIndex, pointsByRegion, years])

  const handlePointer = (clientX: number) => {
    const svgLeft = containerRef.current?.getBoundingClientRect().left ?? 0
    const x = clientX - svgLeft - padding.left
    if (innerWidth <= 0) return
    const ratio = Math.min(1, Math.max(0, x / innerWidth))
    const index = Math.round(ratio * (years.length - 1))
    setHoverIndex(index)
  }

  const resetHover = () => setHoverIndex(null)

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{pokemon.name} Popularity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comparative share from 2020 to 2025 across all regions.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {REGION_KEYS.map((region) => (
            <span key={region} className={`flex items-center gap-1 ${region === activeRegion ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: regionColors[region] }} />
              {region}
            </span>
          ))}
        </div>
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${pokemon.name} popularity line chart`}
        onMouseLeave={resetHover}
        onTouchEnd={resetHover}
        onBlur={resetHover}
        onMouseMove={(event) => handlePointer(event.clientX)}
        onTouchMove={(event) => {
          if (event.touches?.[0]) handlePointer(event.touches[0].clientX)
        }}
        className="w-full"
      >
        <defs>
          <linearGradient id="popularity-chart-grid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.35)" />
            <stop offset="80%" stopColor="rgba(148, 163, 184, 0.1)" />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = innerHeight - innerHeight * ratio
            const value = Math.round(maxY * ratio)
            return (
              <g key={ratio}>
                <line x1={0} x2={innerWidth} y1={y} y2={y} stroke="url(#popularity-chart-grid)" strokeWidth={ratio === 0 ? 1.2 : 0.7} />
                <text x={-12} y={y + 4} textAnchor="end" fontSize={11} fill="#475569">
                  {value}%
                </text>
              </g>
            )
          })}
          {years.map((year, index) => {
            const x = index * stepX
            return (
              <g key={year}>
                <text x={x} y={innerHeight + 20} fontSize={11} fill="#475569" textAnchor="middle">
                  {year}
                </text>
                <line x1={x} x2={x} y1={innerHeight} y2={innerHeight + 6} stroke="#94a3b8" strokeOpacity={0.4} />
              </g>
            )
          })}

          {pointsByRegion.map(({ region, values }) => {
            const path = values
              .map((point, index) => {
                const x = index * stepX
                const y = innerHeight - (point.value / maxY) * innerHeight
                const command = index === 0 ? 'M' : 'L'
                return `${command}${x},${y}`
              })
              .join(' ')

            return (
              <motion.path
                key={region}
                d={path}
                fill="none"
                stroke={regionColors[region]}
                strokeWidth={region === activeRegion ? 2.8 : 1.8}
                strokeOpacity={region === activeRegion ? 1 : 0.65}
                initial={reduceMotion ? undefined : { pathLength: 0 }}
                animate={reduceMotion ? undefined : { pathLength: 1 }}
                transition={reduceMotion ? undefined : { duration: 0.9, ease: 'easeOut' }}
              />
            )
          })}

          {hoverIndex != null && (
            <line
              x1={hoverIndex * stepX}
              x2={hoverIndex * stepX}
              y1={0}
              y2={innerHeight}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeOpacity={0.35}
            />
          )}

          {pointsByRegion.map(({ region, values }) =>
            values.map((point, index) => {
              const x = index * stepX
              const y = innerHeight - (point.value / maxY) * innerHeight
              const isActive = hoverIndex === index || region === activeRegion
              const radius = isActive ? 4.2 : 3
              return (
                <circle
                  key={`${region}-${point.year}`}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={regionColors[region]}
                  fillOpacity={isActive ? 1 : 0.75}
                  stroke={region === activeRegion ? '#0f172a' : 'transparent'}
                  strokeWidth={isActive ? 1.2 : 0}
                  tabIndex={0}
                  role="presentation"
                  onFocus={() => setHoverIndex(index)}
                  aria-label={`${pokemon.name} ${region} ${point.year}: ${point.value}%`}
                />
              )
            })
          )}
        </g>
      </svg>
      {hoverPayload && (
        <div
          className="pointer-events-none absolute top-16 z-10 rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/95"
          style={{
            left: clampTooltipPosition(padding.left + hoverIndex! * stepX, width),
            maxWidth: '280px',
          }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <img
              src={getSpriteUrl(pokemon)}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{pokemon.name} • {hoverPayload.year}</div>
              {hoverPayload.series.map(({ region, value }) => (
                <div key={region} className={`flex justify-between gap-6 ${region === activeRegion ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: regionColors[region] }} />
                    {region}
                  </span>
                  <span>{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function clampTooltipPosition(x: number, width: number) {
  const tooltipWidth = 280 // maxWidth from the tooltip
  const padding = 16
  const minX = padding
  const maxX = width - tooltipWidth - padding
  
  // If the tooltip would go off the right edge, position it to the left of the cursor
  if (x > maxX) {
    return Math.max(minX, x - tooltipWidth)
  }
  
  // If the tooltip would go off the left edge, position it to the right of the cursor
  if (x < minX) {
    return minX
  }
  
  return x
}

export default PopularityChart
