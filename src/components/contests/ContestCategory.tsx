'use client'

import { ContestCategory as ContestCategoryType } from '@/data/contestData'
import { getShowdownAnimatedSprite } from '@/lib/utils'
import Image from 'next/image'

interface ContestCategoryProps {
  category: ContestCategoryType
  onSelect: () => void
}

export default function ContestCategory({ category, onSelect }: ContestCategoryProps) {
  // Map each contest category to a representative Pokémon species for visuals
  const categorySpecies: Record<string, string> = {
    cool: 'greninja',
    beauty: 'milotic',
    cute: 'sylveon',
    clever: 'alakazam',
    tough: 'machamp'
  }
  const species = categorySpecies[category.id] || 'pikachu'

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${category.color} shadow-lg`}
    >
      {/* Background sparkle effect */}
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Representative Pokémon image instead of emoji icon */}
        <div className="mb-3 mx-auto w-20 h-20 relative group-hover:scale-110 transition-transform duration-300">
          {/* Use animated Showdown sprite with fallback to PokeAPI static sprite */}
          <img
            src={getShowdownAnimatedSprite(species, 'front', false)}
            alt={`${category.name} representative: ${species}`}
            width={80}
            height={80}
            className="w-20 h-20 object-contain drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species}.png`
            }}
          />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-white/90 group-hover:text-white transition-colors">
          {category.description}
        </p>
      </div>
      
      {/* Hover sparkle effect */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-yellow-300 text-lg">✨</span>
      </div>
    </button>
  )
}
