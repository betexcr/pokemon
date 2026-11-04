"use client"

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface PopularityChartSeries {
  key: string
  label: string
  /** One value per x label; `null` means no data for that point. */
  values: Array<number | null>
  /** National Dex number, used for the tooltip sprite when a single series is shown. */
  spriteId?: number
}

interface Props {
  title: string
  subtitle?: string
  xLabels: string[]
  series: PopularityChartSeries[]
  formatValue: (value: number) => string
  ariaLabel: string
  /** Index of the x label to emphasise (e.g. the selected year). */
  highlightIndex?: number
  onSelectIndex?: (index: number) => void
  /** Optional per-label note shown in the tooltip (e.g. "partial year"). */
  labelNotes?: Array<string | undefined>
}

const COLOR_PALETTE = ['#2563eb', '#10b981', '#f97316', '#ec4899', '#a855f7', '#14b8a6', '#f59e0b']

export function seriesColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}

function getSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function PopularityChart({
  title,
  subtitle,
  xLabels,
  series,
  formatValue,
  ariaLabel,
  highlightIndex,
  onSelectIndex,
  labelNotes,
}: Props) {
  const reduceMotion = useReducedMotion()
  const gradientId = `popularity-grid-${useId().replace(/:/g, '')}`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dims, setDims] = useState({ width: 640, height: 300 })
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

  const coloredSeries = useMemo(
    () => series.map((entry, index) => ({ ...entry, color: seriesColor(index) })),
    [series]
  )

  const maxY = useMemo(() => {
    const all = coloredSeries.flatMap((entry) => entry.values.filter((v): v is number => v != null))
    const max = Math.max(0, ...all)
    if (max <= 0) return 10
    // Round the axis up to a "nice" number.
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    return Math.ceil(max / magnitude) * magnitude
  }, [coloredSeries])

  const padding = { left: 56, right: 24, top: 24, bottom: 40 }
  const { width, height } = dims
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const stepX = xLabels.length > 1 ? innerWidth / (xLabels.length - 1) : 0
  const xFor = (index: number) => (xLabels.length > 1 ? index * stepX : innerWidth / 2)
  const yFor = (value: number) => innerHeight - (value / maxY) * innerHeight

  const hoverPayload = useMemo(() => {
    if (hoverIndex == null || hoverIndex >= xLabels.length) return null
    return {
      label: xLabels[hoverIndex],
      note: labelNotes?.[hoverIndex],
      rows: coloredSeries.map((entry) => ({ key: entry.key, label: entry.label, color: entry.color, value: entry.values[hoverIndex] })),
    }
  }, [hoverIndex, coloredSeries, xLabels, labelNotes])

  const indexFromClientX = (clientX: number) => {
    const svgLeft = containerRef.current?.getBoundingClientRect().left ?? 0
    const x = clientX - svgLeft - padding.left
    if (innerWidth <= 0 || xLabels.length <= 1) return 0
    const ratio = Math.min(1, Math.max(0, x / innerWidth))
    return Math.round(ratio * (xLabels.length - 1))
  }

  const singleSprite = coloredSeries.length === 1 ? coloredSeries[0].spriteId : undefined
  // Thin out x labels on narrow screens.
  const labelEvery = Math.max(1, Math.ceil((xLabels.length * 44) / Math.max(innerWidth, 1)))

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {coloredSeries.map((entry) => (
            <span key={entry.key} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.label}
            </span>
          ))}
        </div>
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchEnd={() => setHoverIndex(null)}
        onMouseMove={(event) => setHoverIndex(indexFromClientX(event.clientX))}
        onTouchMove={(event) => {
          if (event.touches?.[0]) setHoverIndex(indexFromClientX(event.touches[0].clientX))
        }}
        onClick={(event) => onSelectIndex?.(indexFromClientX(event.clientX))}
        className={`w-full ${onSelectIndex ? 'cursor-pointer' : ''}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.35)" />
            <stop offset="80%" stopColor="rgba(148, 163, 184, 0.1)" />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          {highlightIndex != null && highlightIndex >= 0 && highlightIndex < xLabels.length ? (
            <rect
              x={xFor(highlightIndex) - Math.max(stepX / 2, 12)}
              y={0}
              width={Math.max(stepX, 24)}
              height={innerHeight}
              className="fill-blue-500/10 dark:fill-blue-400/10"
            />
          ) : null}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = innerHeight - innerHeight * ratio
            return (
              <g key={ratio}>
                <line x1={0} x2={innerWidth} y1={y} y2={y} stroke={`url(#${gradientId})`} strokeWidth={ratio === 0 ? 1.2 : 0.7} />
                <text x={-10} y={y + 4} textAnchor="end" fontSize={11} className="fill-slate-500 dark:fill-slate-400">
                  {formatValue(maxY * ratio)}
                </text>
              </g>
            )
          })}
          {xLabels.map((label, index) =>
            index % labelEvery === 0 || index === xLabels.length - 1 ? (
              <g key={label}>
                <text
                  x={xFor(index)}
                  y={innerHeight + 20}
                  fontSize={11}
                  textAnchor="middle"
                  className={index === highlightIndex ? 'fill-blue-600 font-semibold dark:fill-blue-300' : 'fill-slate-500 dark:fill-slate-400'}
                >
                  {label}
                </text>
                <line x1={xFor(index)} x2={xFor(index)} y1={innerHeight} y2={innerHeight + 6} stroke="#94a3b8" strokeOpacity={0.4} />
              </g>
            ) : null
          )}

          {coloredSeries.map((entry, seriesIndex) => {
            let started = false
            const path = entry.values
              .map((value, index) => {
                if (value == null) {
                  started = false
                  return ''
                }
                const command = started ? 'L' : 'M'
                started = true
                return `${command}${xFor(index)},${yFor(value)}`
              })
              .filter(Boolean)
              .join(' ')
            const isPrimary = seriesIndex === 0
            return (
              <motion.path
                key={`${entry.key}-${xLabels.length}`}
                d={path}
                fill="none"
                stroke={entry.color}
                strokeWidth={isPrimary ? 2.8 : 1.8}
                strokeOpacity={isPrimary ? 1 : 0.75}
                initial={reduceMotion ? undefined : { pathLength: 0 }}
                animate={reduceMotion ? undefined : { pathLength: 1 }}
                transition={reduceMotion ? undefined : { duration: 0.9, ease: 'easeOut' }}
              />
            )
          })}

          {hoverIndex != null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={0}
              y2={innerHeight}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}

          {coloredSeries.map((entry) =>
            entry.values.map((value, index) => {
              if (value == null) return null
              const isActive = hoverIndex === index
              return (
                <circle
                  key={`${entry.key}-${xLabels[index]}`}
                  cx={xFor(index)}
                  cy={yFor(value)}
                  r={isActive ? 4.2 : 3}
                  fill={entry.color}
                  fillOpacity={isActive ? 1 : 0.75}
                  stroke={isActive ? '#0f172a' : 'transparent'}
                  strokeWidth={isActive ? 1.2 : 0}
                  tabIndex={0}
                  onFocus={() => setHoverIndex(index)}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && onSelectIndex) {
                      event.preventDefault()
                      onSelectIndex(index)
                    }
                  }}
                  aria-label={`${entry.label} ${xLabels[index]}: ${formatValue(value)}`}
                />
              )
            })
          )}
        </g>
      </svg>
      {hoverPayload && hoverIndex != null && (
        <div
          className="pointer-events-none absolute top-16 z-10 rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/95"
          style={{ left: clampTooltipPosition(padding.left + xFor(hoverIndex), width), maxWidth: '280px' }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            {singleSprite ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getSpriteUrl(singleSprite)}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : null}
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {hoverPayload.label}
                {hoverPayload.note ? <span className="ml-1 text-xs font-normal text-slate-500">({hoverPayload.note})</span> : null}
              </div>
              {hoverPayload.rows.map(({ key, label, color, value }) => (
                <div key={key} className="flex justify-between gap-6 text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <span className="tabular-nums">{value == null ? '—' : formatValue(value)}</span>
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
  const tooltipWidth = 280
  const edge = 16
  const maxX = width - tooltipWidth - edge
  if (x > maxX) return Math.max(edge, x - tooltipWidth)
  if (x < edge) return edge
  return x
}
