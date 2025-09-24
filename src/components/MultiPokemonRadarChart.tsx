'use client'

import { useState, useEffect, useRef } from 'react'
import { formatPokemonName } from '@/lib/utils'
import { Pokemon } from '@/types/pokemon'

// Static export for Next.js 15 compatibility
export const dynamic = 'force-dynamic'

// Minimal shape needed for the radar chart; compatible with full Pokemon
type RadarPokemon = {
  id: number
  name: string
  stats: Array<{ stat: { name: string }; base_stat: number }>
}

interface MultiPokemonRadarChartProps {
  pokemons: RadarPokemon[]
  highlightedPokemonId?: number | null
}

interface Point {
  x: number
  y: number
}

export default function MultiPokemonRadarChart({ pokemons, highlightedPokemonId = null }: MultiPokemonRadarChartProps) {
  const [hoveredPokemon, setHoveredPokemon] = useState<RadarPokemon | null>(null)
  const [hoveredStatIndex, setHoveredStatIndex] = useState<number | null>(null)
  const [cursorPos, setCursorPos] = useState<{x:number;y:number}>({x:0,y:0})
  const [containerSize, setContainerSize] = useState({ width: 360, height: 360 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Resize observer to handle container size changes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    
    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Early return after all hooks to avoid hooks order issues
  if (pokemons.length === 0) return null

  const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
  const maxStat = 255
  
  // Dynamic sizing based on container
  const size = Math.min(containerSize.width, containerSize.height, 360)
  const radius = (size * 0.4) // 40% of container size
  const centerX = size / 2
  const centerY = size / 2

  // Generate colors for each Pokémon
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ]

  // Match StatsSection slider colors
  const getStatBaseColor = (statName: string) => {
    switch (statName.toLowerCase()) {
      case 'hp': return '#ef4444' // red-500
      case 'attack': return '#f97316' // orange-500
      case 'defense': return '#3b82f6' // blue-500
      case 'special-attack': return '#8b5cf6' // purple-500
      case 'special-defense': return '#10b981' // green-500
      case 'speed': return '#eab308' // yellow-500
      default: return '#6b7280' // gray-500
    }
  }

  // Calculate points for each stat
  const getStatPoints = (pokemon: RadarPokemon) => {
    const points: Point[] = []
    
    stats.forEach((statName, index) => {
      const stat = pokemon.stats.find((s: any) => s.stat.name === statName)
      const value = stat?.base_stat || 0
      const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2
      const distance = (value / maxStat) * radius
      
      points.push({
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle)
      })
    })
    
    return points
  }

  // Precompute polygon points and derived metrics
  const polygonData = pokemons.map((pokemon, index) => {
    const pts = getStatPoints(pokemon)
    // Compute simple area proxy (sum of radii) to rank small->large
    const avgRadius = pts.reduce((s, p) => s + Math.hypot(p.x - centerX, p.y - centerY), 0) / pts.length
    const color = colors[index % colors.length]
    return { pokemon, points: pts, avgRadius, color }
  })

  // Point-in-polygon (ray casting)
  const isPointInPolygon = (x: number, y: number, pts: Point[]): boolean => {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y
      const xj = pts[j].x, yj = pts[j].y
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  // Generate grid circles
  const gridCircles = Array.from({ length: 5 }, (_, i) => {
    const r = (radius * (i + 1)) / 5
    const strokeWidth = Math.max(0.5, size * 0.003)
    return (
      <circle
        key={i}
        cx={centerX}
        cy={centerY}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity="0.2"
        className="text-gray-400 dark:text-gray-600"
      />
    )
  })

  // Generate stat lines
  const statLines = stats.map((stat, index) => {
    const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2
    const endX = centerX + radius * Math.cos(angle)
    const endY = centerY + radius * Math.sin(angle)
    const strokeWidth = Math.max(0.5, size * 0.003)
    
    return (
      <line
        key={stat}
        x1={centerX}
        y1={centerY}
        x2={endX}
        y2={endY}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity="0.2"
        className="text-gray-400 dark:text-gray-600"
      />
    )
  })

  // Get stat abbreviation
  const getStatAbbreviation = (statName: string) => {
    switch (statName.toLowerCase()) {
      case 'hp': return 'HP';
      case 'attack': return 'ATK';
      case 'defense': return 'DEF';
      case 'special-attack': return 'SPA';
      case 'special-defense': return 'SPD';
      case 'speed': return 'SPE';
      default: return statName.toUpperCase();
    }
  };

  // Generate stat labels
  const statLabels = stats.map((stat, index) => {
    const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2
    const labelRadius = radius + (size * 0.06) // Responsive label distance
    const x = centerX + labelRadius * Math.cos(angle)
    const y = centerY + labelRadius * Math.sin(angle)
    
    // Responsive font size based on container size
    const fontSize = Math.max(10, size * 0.04)
    
    return (
      <text
        key={stat}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-medium fill-gray-600 dark:fill-gray-300"
        style={{ fontSize: `${fontSize}px` }}
      >
        {getStatAbbreviation(stat)}
      </text>
    )
  })

  // Generate polygons for each Pokémon
  const pokemonPolygons = polygonData.map(({ pokemon, points, color }) => {
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ')
    const isExternallyHighlighted = highlightedPokemonId !== null && pokemon.id === highlightedPokemonId
    const isHovered = hoveredPokemon?.id === pokemon.id
    const isActive = isExternallyHighlighted || (highlightedPokemonId === null && isHovered)
    const dimOthers = highlightedPokemonId !== null
    
    // Responsive stroke width
    const baseStrokeWidth = Math.max(1, size * 0.008)
    const activeStrokeWidth = Math.max(2, size * 0.012)
    
    return (
      <g key={pokemon.id}>
        <polygon
          points={pointsString}
          fill={color}
          fillOpacity={isActive ? 0.35 : dimOthers ? 0.08 : 0.2}
          stroke={color}
          strokeWidth={isActive ? activeStrokeWidth : baseStrokeWidth}
          onMouseEnter={() => {
            setHoveredPokemon(pokemon)
          }}
          onMouseLeave={() => {
            setHoveredPokemon(null)
          }}
          style={{ cursor: 'pointer' }}
          pointerEvents="all"
        />
        {points.map((point, pointIndex) => {
          // Responsive circle radius based on container size
          const circleRadius = Math.max(3, size * 0.012)
          const strokeWidth = Math.max(1, size * 0.006)
          
          return (
            <circle
              key={pointIndex}
              cx={point.x}
              cy={point.y}
              r={circleRadius}
              fill={color}
              stroke="white"
              strokeWidth={strokeWidth}
              onMouseEnter={() => {
                setHoveredPokemon(pokemon)
              }}
              onMouseLeave={() => {
                setHoveredPokemon(null)
              }}
              style={{ cursor: 'pointer' }}
              pointerEvents="all"
              opacity={isActive ? 1 : dimOthers ? 0.4 : 0.8}
            />
          )
        })}
      </g>
    )
  })

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px]">
      <svg
        width={size}
        height={size}
        className="mx-auto block"
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseMove={(e) => {
          const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          setCursorPos({ x, y })
          // Determine hovered polygon by checking smallest avg radius first
          const containing = polygonData
            .filter(pd => isPointInPolygon(x, y, pd.points))
            .sort((a, b) => a.avgRadius - b.avgRadius)
          if (containing.length > 0) {
            setHoveredPokemon(containing[0].pokemon)
          } else if (!highlightedPokemonId) {
            setHoveredPokemon(null)
          }
          const dx = x - centerX
          const dy = y - centerY
          const distance = Math.sqrt(dx*dx + dy*dy)
          // Only activate when near the radar area
          if (distance > radius * 0.4 && distance < radius * 1.15) {
            let angle = Math.atan2(dy, dx) // -PI..PI with 0 on +X
            angle = angle < -Math.PI/2 ? angle + 2*Math.PI : angle // keep continuity around -PI/2
            // Our axes start at -PI/2 (top) and proceed clockwise
            const adjusted = angle + Math.PI/2
            const sector = (adjusted + 2*Math.PI) % (2*Math.PI)
            const index = Math.round((sector / (2*Math.PI)) * stats.length) % stats.length
            setHoveredStatIndex(index)
          } else {
            setHoveredStatIndex(null)
          }
        }}
        onMouseLeave={() => { setHoveredStatIndex(null); setHoveredPokemon(null) }}
      >
        {/* Grid circles */}
        {gridCircles}
        
        {/* Stat lines */}
        {statLines}
        
        {/* Pokémon polygons */}
        {pokemonPolygons}
        
        {/* Stat labels */}
        {statLabels}
      </svg>
      
      {/* Tooltip: specific stat under cursor */}
      {hoveredStatIndex !== null && (
        <div
          className="absolute z-10 text-gray-800 px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none border border-gray-200"
          style={{
            left: cursorPos.x + 12,
            top: cursorPos.y + 12,
            // White base with stat-colored overlay - 30% more transparent
            background: `linear-gradient(180deg, ${getStatBaseColor(stats[hoveredStatIndex])}15 0%, transparent 60%), rgba(255, 255, 255, 0.7)`
          }}
        >
          <div className="font-semibold mb-1">
            {getStatAbbreviation(stats[hoveredStatIndex])}
          </div>
          <div className="text-xs text-gray-700 space-y-0.5">
            {[...pokemons]
              .map((p) => ({
                p,
                value: p.stats.find(s => s.stat.name === stats[hoveredStatIndex!])?.base_stat ?? 0
              }))
              .sort((a,b) => b.value - a.value)
              .map(({p, value}) => {
              // Use the same color as the polygon for this Pokemon
              const pokemonIndex = pokemons.findIndex(po => po.id === p.id)
              const color = colors[pokemonIndex % colors.length]
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{p.name}</span>
                  <span className="ml-auto font-mono">{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tooltip: full pokemon when hovering points/polygons (match stat tooltip styling) */}
      {hoveredPokemon && hoveredStatIndex === null && (
        <div
          className="absolute z-10 text-gray-800 px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none border border-gray-200"
          style={{
            left: cursorPos.x + 12,
            top: cursorPos.y + 12,
            background: `linear-gradient(180deg, ${colors[pokemons.findIndex(p => p.id === hoveredPokemon.id) % colors.length]}15 0%, transparent 60%), rgba(255, 255, 255, 0.9)`
          }}
        >
          <div className="font-semibold mb-1 capitalize">
            {formatPokemonName(hoveredPokemon.name)}
          </div>
          <div className="text-xs text-gray-700 space-y-0.5">
            {hoveredPokemon.stats.map(stat => (
              <div key={stat.stat.name} className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors[pokemons.findIndex(p => p.id === hoveredPokemon.id) % colors.length] }} />
                <span>{getStatAbbreviation(stat.stat.name)}</span>
                <span className="ml-auto font-mono">{stat.base_stat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
