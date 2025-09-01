'use client'

import { useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'

interface MultiPokemonRadarChartProps {
  pokemons: Pokemon[]
}

interface Point {
  x: number
  y: number
}

export default function MultiPokemonRadarChart({ pokemons }: MultiPokemonRadarChartProps) {
  const [hoveredPokemon, setHoveredPokemon] = useState<Pokemon | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  if (pokemons.length === 0) return null

  const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
  const maxStat = 255
  const radius = 120
  const centerX = 150
  const centerY = 150

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

  // Calculate points for each stat
  const getStatPoints = (pokemon: Pokemon, color: string) => {
    const points: Point[] = []
    
    stats.forEach((statName, index) => {
      const stat = pokemon.stats.find(s => s.stat.name === statName)
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

  // Generate grid circles
  const gridCircles = Array.from({ length: 5 }, (_, i) => {
    const r = (radius * (i + 1)) / 5
    return (
      <circle
        key={i}
        cx={centerX}
        cy={centerY}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
        opacity="0.5"
      />
    )
  })

  // Generate stat lines
  const statLines = stats.map((stat, index) => {
    const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2
    const endX = centerX + radius * Math.cos(angle)
    const endY = centerY + radius * Math.sin(angle)
    
    return (
      <line
        key={stat}
        x1={centerX}
        y1={centerY}
        x2={endX}
        y2={endY}
        stroke="#e5e7eb"
        strokeWidth="1"
        opacity="0.5"
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
    const labelRadius = radius + 20
    const x = centerX + labelRadius * Math.cos(angle)
    const y = centerY + labelRadius * Math.sin(angle)
    
    return (
      <text
        key={stat}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium fill-gray-600"
      >
        {getStatAbbreviation(stat)}
      </text>
    )
  })

  // Generate polygons for each Pokémon
  const pokemonPolygons = pokemons.map((pokemon, index) => {
    const color = colors[index % colors.length]
    const points = getStatPoints(pokemon, color)
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ')
    
    return (
      <g key={pokemon.id}>
        <polygon
          points={pointsString}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
          onMouseEnter={(e) => {
            setHoveredPokemon(pokemon)
            setMousePosition({ x: e.clientX, y: e.clientY })
          }}
          onMouseMove={(e) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
          }}
          onMouseLeave={() => {
            setHoveredPokemon(null)
          }}
          style={{ cursor: 'pointer' }}
          pointerEvents="all"
        />
        {points.map((point, pointIndex) => (
          <circle
            key={pointIndex}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
            onMouseEnter={(e) => {
              setHoveredPokemon(pokemon)
              setMousePosition({ x: e.clientX, y: e.clientY })
            }}
            onMouseMove={(e) => {
              setMousePosition({ x: e.clientX, y: e.clientY })
            }}
            onMouseLeave={() => {
              setHoveredPokemon(null)
            }}
            style={{ cursor: 'pointer' }}
            pointerEvents="all"
          />
        ))}
      </g>
    )
  })

  return (
    <div className="relative">
      <svg width="300" height="300" className="mx-auto">
        {/* Grid circles */}
        {gridCircles}
        
        {/* Stat lines */}
        {statLines}
        
        {/* Pokémon polygons */}
        {pokemonPolygons}
        
        {/* Stat labels */}
        {statLabels}
      </svg>
      
      {/* Tooltip */}
      {hoveredPokemon && (
        <div
          className="absolute z-10 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none border border-white/20"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)',
            backgroundColor: colors[pokemons.findIndex(p => p.id === hoveredPokemon.id) % colors.length]
          }}
        >
          <div className="font-semibold capitalize">
            {formatPokemonName(hoveredPokemon.name)}
          </div>
          <div className="text-xs text-white/90">
            {hoveredPokemon.stats.map(stat => (
              <div key={stat.stat.name}>
                {getStatAbbreviation(stat.stat.name)}: {stat.base_stat}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
