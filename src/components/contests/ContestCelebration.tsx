'use client'

import { useEffect, useState } from 'react'
import { Heart, Star, Sparkles, Trophy, Ribbon } from 'lucide-react'

interface ContestCelebrationProps {
  trigger: boolean
  type: 'pokeblock' | 'move' | 'spectacular' | 'completion' | 'bored'
  message?: string
  onComplete?: () => void
}

export default function ContestCelebration({ 
  trigger, 
  type, 
  message, 
  onComplete 
}: ContestCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    delay: number
    type: 'heart' | 'star' | 'sparkle'
  }>>([])

  useEffect(() => {
    if (trigger) {
      setIsVisible(true)
      
      // Generate particles based on type
      const newParticles = []
      const particleCount = type === 'spectacular' ? 15 : type === 'completion' ? 20 : 8
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 500,
          type: ['heart', 'star', 'sparkle'][Math.floor(Math.random() * 3)] as 'heart' | 'star' | 'sparkle'
        })
      }
      
      setParticles(newParticles)
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, type === 'spectacular' ? 4000 : type === 'completion' ? 5000 : 2000)
      
      return () => clearTimeout(timer)
    }
  }, [trigger, type, onComplete])

  if (!isVisible) return null

  const getCelebrationConfig = () => {
    switch (type) {
      case 'pokeblock':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-300 dark:border-green-700',
          textColor: 'text-green-700 dark:text-green-300',
          icon: '🍬',
          title: 'Pokéblock Fed!'
        }
      case 'move':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          borderColor: 'border-blue-300 dark:border-blue-700',
          textColor: 'text-blue-700 dark:text-blue-300',
          icon: '✨',
          title: 'Great Move!'
        }
      case 'spectacular':
        return {
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          borderColor: 'border-purple-300 dark:border-purple-700',
          textColor: 'text-purple-700 dark:text-purple-300',
          icon: '🎆',
          title: 'SPECTACULAR TALENT!'
        }
      case 'completion':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          icon: '🏆',
          title: 'Contest Complete!'
        }
      case 'bored':
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          borderColor: 'border-gray-300 dark:border-gray-700',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: '😴',
          title: 'Audience is Bored...'
        }
    }
  }

  const config = getCelebrationConfig()

  const getParticleIcon = (particleType: string) => {
    switch (particleType) {
      case 'heart': return <Heart className="w-4 h-4 text-red-400" />
      case 'star': return <Star className="w-4 h-4 text-yellow-400" />
      case 'sparkle': return <Sparkles className="w-4 h-4 text-blue-400" />
      default: return <Sparkles className="w-4 h-4 text-purple-400" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Main Celebration Card */}
      <div className={`
        relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border-2 ${config.borderColor}
        animate-bounce max-w-sm mx-4
        ${type === 'spectacular' ? 'animate-pulse' : ''}
      `}>
        {/* Background Glow */}
        <div className={`
          absolute inset-0 rounded-2xl ${config.bgColor} opacity-50
          ${type === 'spectacular' ? 'animate-ping' : ''}
        `} />
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-2 animate-bounce">
            {config.icon}
          </div>
          <h3 className={`text-xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h3>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          )}
        </div>

        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: `${2000 + Math.random() * 1000}ms`
            }}
          >
            {getParticleIcon(particle.type)}
          </div>
        ))}

        {/* Special Effects for Spectacular */}
        {type === 'spectacular' && (
          <>
            <div className="absolute -top-4 -left-4 animate-ping">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute -top-4 -right-4 animate-ping delay-150">
              <Ribbon className="w-6 h-6 text-pink-500" />
            </div>
            <div className="absolute -bottom-4 -left-4 animate-ping delay-300">
              <Star className="w-6 h-6 text-purple-500" />
            </div>
            <div className="absolute -bottom-4 -right-4 animate-ping delay-500">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
          </>
        )}
      </div>

      {/* Confetti for Spectacular and Completion */}
      {(type === 'spectacular' || type === 'completion') && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`,
                animationDuration: `${3000 + Math.random() * 1000}ms`
              }}
            >
              <div className={`
                w-2 h-2 rounded-full
                ${['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]}
              `} />
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
          100% { transform: translateY(-40px) rotate(360deg); opacity: 0; }
        }
        
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        .animate-float {
          animation: float ease-out forwards;
        }
        
        .animate-confetti {
          animation: confetti linear;
        }
      `}</style>
    </div>
  )
}
