'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Heart, Star, Flower, Zap, Mountain, Book } from 'lucide-react'
import { getShowdownAnimatedSprite } from '@/lib/utils'

interface ContestBackgroundProps {
  selectedCategory?: string | null
  currentRound?: 'intro' | 'talent' | 'results'
  exciteMeter?: number
  isSpectacular?: boolean
}

export default function ContestBackground({ 
  selectedCategory, 
  currentRound, 
  exciteMeter = 0,
  isSpectacular = false 
}: ContestBackgroundProps) {
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number
    type: 'heart' | 'star' | 'sparkle' | 'flower'
    x: number
    y: number
    delay: number
  }>>([])

  // Generate floating elements based on category and state
  useEffect(() => {
    if (!selectedCategory) return

    const elements: Array<{
      id: number
      type: 'heart' | 'star' | 'sparkle' | 'flower'
      x: number
      y: number
      delay: number
    }> = []

    // Generate elements based on category
    switch (selectedCategory) {
      case 'cute':
        for (let i = 0; i < 8; i++) {
          elements.push({
            id: i,
            type: 'heart',
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 2000
          })
        }
        break
      case 'beauty':
        for (let i = 0; i < 6; i++) {
          elements.push({
            id: i,
            type: 'flower',
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 1500
          })
        }
        break
      case 'cool':
        for (let i = 0; i < 10; i++) {
          elements.push({
            id: i,
            type: 'sparkle',
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 1000
          })
        }
        break
      case 'tough':
        for (let i = 0; i < 5; i++) {
          elements.push({
            id: i,
            type: 'star',
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 2500
          })
        }
        break
      case 'clever':
        for (let i = 0; i < 7; i++) {
          elements.push({
            id: i,
            type: 'sparkle',
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 1800
          })
        }
        break
    }

    setFloatingElements(elements)
  }, [selectedCategory])

  const getCategoryBackground = () => {
    switch (selectedCategory) {
      case 'cute':
        return {
          gradient: 'from-pink-50 via-purple-50 to-pink-100',
          darkGradient: 'from-pink-900/20 via-purple-900/20 to-pink-800/20',
          pattern: '💖'
        }
      case 'beauty':
        return {
          gradient: 'from-rose-50 via-pink-50 to-rose-100',
          darkGradient: 'from-rose-900/20 via-pink-900/20 to-rose-800/20',
          pattern: '🌸'
        }
      case 'cool':
        return {
          gradient: 'from-blue-50 via-cyan-50 to-blue-100',
          darkGradient: 'from-blue-900/20 via-cyan-900/20 to-blue-800/20',
          pattern: '❄️'
        }
      case 'tough':
        return {
          gradient: 'from-red-50 via-orange-50 to-red-100',
          darkGradient: 'from-red-900/20 via-orange-900/20 to-red-800/20',
          pattern: '💪'
        }
      case 'clever':
        return {
          gradient: 'from-green-50 via-emerald-50 to-green-100',
          darkGradient: 'from-green-900/20 via-emerald-900/20 to-green-800/20',
          pattern: '🧠'
        }
      default:
        return {
          gradient: 'from-purple-50 via-pink-50 to-purple-100',
          darkGradient: 'from-purple-900/20 via-pink-900/20 to-purple-800/20',
          pattern: '✨'
        }
    }
  }

  const background = getCategoryBackground()

  const getFloatingIcon = (type: string) => {
    switch (type) {
      case 'heart': return <Heart className="w-4 h-4 text-pink-400" />
      case 'star': return <Star className="w-4 h-4 text-yellow-400" />
      case 'sparkle': return <Sparkles className="w-4 h-4 text-blue-400" />
      case 'flower': return <Flower className="w-4 h-4 text-rose-400" />
      default: return <Sparkles className="w-4 h-4 text-purple-400" />
    }
  }

  // Category -> cute Pokémon species mapping (real species names)
  const categoryPokemon: Record<string, string[]> = {
    cute: [
      'eevee', 'togepi', 'jigglypuff', 'piplup', 'sylveon', 'skitty', 'clefairy', 'pachirisu', 'rowlet', 'sprigatito'
    ],
    beauty: [
      'milotic', 'vulpix', 'lopunny', 'gardevoir', 'primarina', 'alcremie', 'rapidash-galar', 'ninetales', 'altaria', 'lilligant'
    ],
    cool: [
      'greninja', 'charizard', 'lucario', 'zorua', 'umbreon', 'talonflame', 'garchomp', 'cinderace', 'ceruledge', 'decidueye'
    ],
    tough: [
      'machamp', 'rhydon', 'conkeldurr', 'tyranitar', 'aggron', 'golem', 'hariyama', 'kommo-o', 'marowak', 'pangoro'
    ],
    clever: [
      'alakazam', 'metagross', 'espeon', 'porygon-z', 'decidueye', 'farigiraf', 'bronzong', 'gardevoir', 'slowking', 'magnezone'
    ]
  }

  const pokemonForCategory = selectedCategory ? (categoryPokemon[selectedCategory] || []) : []
  const floatingPokemon = pokemonForCategory.length > 0
    ? Array.from({ length: Math.min(12, pokemonForCategory.length) }).map((_, i) => ({
        id: i,
        species: pokemonForCategory[i % pokemonForCategory.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2000
      }))
    : []

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Main Background Gradient (separate layers for light/dark to avoid dynamic class names) */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${background.gradient}
        block dark:hidden transition-all duration-1000
      `} />
      <div className={`
        absolute inset-0 bg-gradient-to-br ${background.darkGradient}
        hidden dark:block transition-all duration-1000
      `} />

      {/* Subtle contrast overlay to improve readability of foreground UI */}
      <div className="absolute inset-0 bg-white/30 dark:bg-black/35" />

      {/* Category Pattern Overlay */}
      {selectedCategory && (
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="grid grid-cols-8 gap-4 h-full w-full p-8">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                {background.pattern}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Cute Pokémon instead of generic icons */}
      {floatingPokemon.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${3000 + Math.random() * 2000}ms`
          }}
        >
          <img
            src={getShowdownAnimatedSprite(p.species, 'front', false)}
            alt={p.species}
            width={36}
            height={36}
            className="w-9 h-9 object-contain pointer-events-none [filter:drop-shadow(0_1px_0.5px_rgba(0,0,0,0.18))] dark:[filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.45))]"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.species}.png`
            }}
          />
        </div>
      ))}

      {/* Spectacular Effects */}
      {isSpectacular && (
        <>
          {/* Confetti */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${2000 + Math.random() * 1000}ms`
              }}
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"></div>
            </div>
          ))}
          
          {/* Central Sparkle Burst */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-ping">
              <Sparkles className="w-16 h-16 text-yellow-400" />
            </div>
          </div>
        </>
      )}

      {/* Stage Lighting Effects */}
      {currentRound === 'talent' && (
        <div className="absolute inset-0">
          {/* Spotlight */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-yellow-200/30 to-transparent rounded-full blur-3xl" />
          
          {/* Side Lights */}
          <div className="absolute top-1/4 left-8 w-32 h-32 bg-gradient-radial from-blue-200/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-1/4 right-8 w-32 h-32 bg-gradient-radial from-pink-200/20 to-transparent rounded-full blur-2xl" />
        </div>
      )}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-confetti, .animate-ping {
            animation: none !important;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        .animate-float {
          animation: float infinite ease-in-out;
        }
        
        .animate-confetti {
          animation: confetti linear;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}
