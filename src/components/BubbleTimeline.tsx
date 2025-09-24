"use client"

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { computeRegionalRanking, TREND_YEARS } from '@/lib/trends/data'
import type { RegionKey } from '@/lib/trends/types'

interface Props {
  region: RegionKey
  selectedPokemon?: string
}

interface HoverState {
  year: number
  name: string
  rank: number
  percent: number
  national_number: number
  sources: string[]
  x: number
  y: number
}

const regionAccent: Record<RegionKey, string> = {
  Global: '#1d4ed8',
  Asia: '#db2777',
  US: '#059669',
  EU: '#ea580c',
}

function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

function portraitUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export function BubbleTimeline({ region, selectedPokemon }: Props) {
  const reduceMotion = useReducedMotion()
  const [hover, setHover] = useState<HoverState | null>(null)

  const layout = useMemo(() => TREND_YEARS.map((year, yearIndex) => {
    const leaders = computeRegionalRanking(year, region, 5, selectedPokemon)
    return { year, yearIndex, leaders }
  }), [region, selectedPokemon])

  const maxPercent = useMemo(() => {
    const values = layout.flatMap((entry) => entry.leaders.map((leader) => leader.percent))
    return values.length ? Math.max(...values) : 1
  }, [layout])

  const width = 840
  const height = 400
  const padding = { left: 72, right: 48, top: 24, bottom: 80 }
  const columns = TREND_YEARS.length
  const columnWidth = columns > 1 ? (width - padding.left - padding.right) / (columns - 1) : width - padding.left - padding.right
  const rowHeight = 80

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Regional Bubble Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selected Pokémon and nearby competitors per year for {region} audiences.</p>
        </div>
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${region} bubble timeline from 2020 to 2025`}
        className="max-w-full"
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          <line
            x1={0}
            y1={height - padding.top - padding.bottom}
            x2={width - padding.left - padding.right}
            y2={height - padding.top - padding.bottom}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          {layout.map(({ year, yearIndex, leaders }) => {
            const columnX = yearIndex * columnWidth
            return (
              <g key={year} transform={`translate(${columnX},0)`}>
                <line
                  x1={0}
                  x2={0}
                  y1={0}
                  y2={height - padding.top - padding.bottom}
                  stroke="#cbd5f5"
                  strokeOpacity={0.2}
                />
                <text x={0} y={height - padding.top - padding.bottom + 28} textAnchor="middle" fontSize={11} fill="#475569">
                  {year}
                </text>
                {leaders.map((leader) => {
                  // Position bubbles over the year labels (bottom of the chart)
                  const y = height - padding.top - padding.bottom - 60 - (leader.rank - 1) * 40
                  const offset = (leader.rank - (leaders.length + 1) / 2) * 24
                  const wobble = Math.sin(yearIndex * 0.7 + leader.rank) * 4
                  const cx = offset + wobble
                  const radius = Math.max(16, 14 + (leader.percent / maxPercent) * 18)
                  const isSelected = leader.name.toLowerCase() === selectedPokemon?.toLowerCase()
                  const accent = regionAccent[region]
                  const glow = `drop-shadow(0 12px 18px rgba(15,23,42,0.16)) drop-shadow(0 2px 4px rgba(15,23,42,0.18))`
                  return (
                    <motion.g
                      key={`${year}-${leader.name}`}
                      initial={reduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
                      animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                      transition={reduceMotion ? undefined : { duration: 0.6, delay: yearIndex * 0.08 + leader.rank * 0.03 }}
                      onMouseEnter={(event) => {
                        const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                        if (!svgRect) return
                        setHover({
                          year,
                          name: leader.name,
                          rank: leader.rank,
                          percent: leader.percent,
                          national_number: leader.national_number,
                          sources: leader.sources,
                          x: padding.left + columnX + cx,
                          y: padding.top + y,
                        })
                      }}
                      onFocus={(event) => {
                        const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                        if (!svgRect) return
                        setHover({
                          year,
                          name: leader.name,
                          rank: leader.rank,
                          percent: leader.percent,
                          national_number: leader.national_number,
                          sources: leader.sources,
                          x: padding.left + columnX + cx,
                          y: padding.top + y,
                        })
                      }}
                      tabIndex={0}
                      role="presentation"
                    >
                      <circle
                        cx={cx}
                        cy={y}
                        r={radius}
                        fill={accent}
                        fillOpacity={isSelected ? 0.92 : 0.55}
                        stroke={isSelected ? '#0f172a' : 'rgba(148, 163, 184, 0.45)'}
                        strokeWidth={isSelected ? 3 : 1.4}
                        style={!reduceMotion ? { filter: glow } : undefined}
                      />
                      <image
                        href={portraitUrl(leader.national_number)}
                        x={cx - radius}
                        y={y - radius}
                        width={radius * 2}
                        height={radius * 2}
                        preserveAspectRatio="xMidYMid slice"
                        style={{ imageRendering: 'auto' as const }}
                      />
                      <text x={cx} y={y + radius + 16} textAnchor="middle" fontSize={10} fill="#0f172a">
                        #{leader.rank} {leader.name}
                      </text>
                      <text x={cx} y={y + radius + 30} textAnchor="middle" fontSize={9} fill="#475569">
                        {leader.percent}% share
                      </text>
                    </motion.g>
                  )
                })}
              </g>
            )
          })}
        </g>
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200 bg-white p-4 text-sm shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/95"
          style={{ left: clamp(hover.x, 80, width - 80), top: clamp(hover.y - 20, 16, height - 180) }}
        >
          <div className="flex gap-3">
            <img 
              src={portraitUrl(hover.national_number)} 
              alt="" 
              width={64} 
              height={64} 
              style={{ imageRendering: 'auto', objectFit: 'contain' }} 
              className="rounded-lg"
            />
            <div className="space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{hover.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{region} • {hover.year} • Rank #{hover.rank}</div>
              <div className="text-xs font-medium text-slate-900/90 dark:text-slate-100">Peak share: {hover.percent}%</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-500 dark:text-slate-400">
                {hover.sources.slice(0, 3).map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default BubbleTimeline
