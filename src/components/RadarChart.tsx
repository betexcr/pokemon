'use client'

import { useTheme } from './ThemeProvider'

interface RadarChartProps {
  data: {
    name: string
    stats: {
      hp: number
      attack: number
      defense: number
      'special-attack': number
      'special-defense': number
      speed: number
    }
    color?: string
  }[]
  size?: number
  className?: string
}

export default function RadarChart({ data, size = 300, className = '' }: RadarChartProps) {
  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  const isRetro = theme === 'gold' || theme === 'red' || theme === 'ruby'
  
  // Calculate polygon points for each Pokémon
  const calculatePoints = (stats: {
    hp: number;
    attack: number;
    defense: number;
    'special-attack': number;
    'special-defense': number;
    speed: number;
  }, radius: number, center: number) => {
    const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
    const maxStat = 255 // Maximum stat value in Pokémon
    
    return statNames.map((stat, index) => {
      const angle = (index * Math.PI * 2) / 6 - Math.PI / 2 // Start from top
      const value = (stats[stat] / maxStat) * radius
      const x = center + value * Math.cos(angle)
      const y = center + value * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  const center = size / 2
  const maxRadius = center * 0.8

  // Generate grid circles for retro themes - always show them
  const gridCircles = Array.from({ length: 5 }, (_, i) => {
    const radius = (maxRadius * (i + 1)) / 5
    return (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={theme === 'red' ? '#8B0000' : theme === 'gold' ? '#B8860B' : theme === 'ruby' ? '#FF69B4' : '#666666'}
        strokeWidth="1"
        opacity="0.3"
      />
    )
  })

  // Generate stat lines for retro themes - always show them
  const statLines = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 6 - Math.PI / 2
    const x = center + maxRadius * Math.cos(angle)
    const y = center + maxRadius * Math.sin(angle)
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke={theme === 'red' ? '#8B0000' : theme === 'gold' ? '#B8860B' : theme === 'ruby' ? '#FF69B4' : '#666666'}
        strokeWidth="1"
        opacity="0.3"
      />
    )
  })

  // Stat labels for retro themes - always show them
  const statLabels = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE'].map((label, i) => {
    const angle = (i * Math.PI * 2) / 6 - Math.PI / 2
    const x = center + (maxRadius + 20) * Math.cos(angle)
    const y = center + (maxRadius + 20) * Math.sin(angle)
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`text-xs font-bold ${
          theme === 'red' ? 'fill-red-800' : 
          theme === 'gold' ? 'fill-yellow-800' : 
          theme === 'ruby' ? 'fill-pink-800' :
          theme === 'dark' ? 'fill-gray-200' :
          'fill-gray-800'
        }`}
      >
        {label}
      </text>
    )
  })

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="block">
        {/* Background for modern themes */}
        {!isRetro && (
          <circle
            cx={center}
            cy={center}
            r={maxRadius}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="1"
          />
        )}

        {/* Grid circles for retro themes */}
        {gridCircles}

        {/* Stat lines for retro themes */}
        {statLines}

        {/* Stat labels for retro themes */}
        {statLabels}

        {/* Pokémon polygons */}
        {data.map((pokemon, index) => {
          const points = calculatePoints(pokemon.stats, maxRadius, center)
          const color = pokemon.color || (
            theme === 'red' ? '#FF0000' :
            theme === 'gold' ? '#FFD700' :
            theme === 'ruby' ? '#FF69B4' :
            '#2563EB'
          )
          
          return (
            <g key={pokemon.name}>
              {/* Fill polygon */}
              <polygon
                points={points}
                fill={color}
                opacity={0.3}
              />
              {/* Border polygon */}
              <polygon
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="3"
                opacity={0.8}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend for modern themes */}
      {!isRetro && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {data.map((pokemon, index) => (
            <div key={pokemon.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: pokemon.color || '#2563EB' }}
              />
              <span className="text-sm font-medium capitalize">
                {pokemon.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend for retro themes */}
      {isRetro && (
        <div className={`mt-4 text-center font-gbc text-sm ${
          theme === 'red' ? 'text-red-800' : 
          theme === 'gold' ? 'text-yellow-800' : 
          'text-pink-800'
        }`}>
          {data.map((pokemon, index) => (
            <div key={pokemon.name} className="mb-1">
              {pokemon.name.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
