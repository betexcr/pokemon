'use client'

import { useState, useEffect } from 'react'
import { Info, X, ArrowRight, Star, Heart, Zap, Sparkles, Trophy } from 'lucide-react'

interface UIElement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  position: { x: number; y: number }
  highlight?: boolean
}

interface ContestUIExplainerProps {
  currentRound?: 'intro' | 'talent' | 'results'
  selectedCategory?: string | null
}

export default function ContestUIExplainer({ currentRound, selectedCategory }: ContestUIExplainerProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentElement, setCurrentElement] = useState(0)
  const [elements, setElements] = useState<UIElement[]>([])

  const getUIElements = (): UIElement[] => {
    const baseElements: UIElement[] = [
      {
        id: 'score-display',
        title: 'Score Display',
        description: 'Track your stars (from Introduction Round) and hearts (from Talent Round). Higher scores unlock better ranks!',
        icon: <Star className="w-5 h-5 text-yellow-500" />,
        position: { x: 50, y: 20 }
      },
      {
        id: 'mascot-judge',
        title: 'Interactive Judge',
        description: 'The mascot judge reacts to your performance in real-time. Watch for mood changes and speech bubbles!',
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
        position: { x: 90, y: 80 }
      }
    ]

    if (!selectedCategory) {
      return [
        ...baseElements,
        {
          id: 'contest-categories',
          title: 'Contest Categories',
          description: 'Choose from 5 categories: Cool, Beauty, Cute, Clever, or Tough. Each has unique moves and strategies!',
          icon: <Trophy className="w-5 h-5 text-blue-500" />,
          position: { x: 50, y: 50 }
        }
      ]
    }

    if (currentRound === 'intro') {
      return [
        ...baseElements,
        {
          id: 'pokeblock-feeder',
          title: 'Pokéblock Feeder',
          description: 'Feed colored Pokéblocks to boost your Pokémon\'s contest stats. Red=Coolness, Blue=Beauty, Pink=Cuteness, Green=Cleverness, Yellow=Toughness!',
          icon: <Zap className="w-5 h-5 text-pink-500" />,
          position: { x: 50, y: 50 }
        },
        {
          id: 'intro-button',
          title: 'Start Introduction Round',
          description: 'When you\'re satisfied with your stat boosts, click this button to start the Introduction Round and earn stars!',
          icon: <ArrowRight className="w-5 h-5 text-green-500" />,
          position: { x: 50, y: 80 }
        }
      ]
    }

    if (currentRound === 'talent') {
      return [
        ...baseElements,
        {
          id: 'excite-meter',
          title: 'Excite Meter',
          description: 'This meter fills when you use moves matching your contest category. When full, your next move becomes a Spectacular Talent!',
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          position: { x: 50, y: 30 }
        },
        {
          id: 'move-selection',
          title: 'Move Selection',
          description: 'Choose appeal moves for your Pokémon to perform. Moves matching your category give bonus hearts and fill the Excite Meter!',
          icon: <Zap className="w-5 h-5 text-blue-500" />,
          position: { x: 50, y: 60 }
        },
        {
          id: 'complete-button',
          title: 'Complete Contest',
          description: 'Finish the Talent Round when you\'re ready to see your final rank and rewards!',
          icon: <Trophy className="w-5 h-5 text-yellow-500" />,
          position: { x: 50, y: 90 }
        }
      ]
    }

    if (currentRound === 'results') {
      return [
        ...baseElements,
        {
          id: 'results-display',
          title: 'Contest Results',
          description: 'View your final rank, score breakdown, and rewards. Higher ranks earn better ribbons!',
          icon: <Trophy className="w-5 h-5 text-purple-500" />,
          position: { x: 50, y: 50 }
        }
      ]
    }

    return baseElements
  }

  useEffect(() => {
    setElements(getUIElements())
  }, [currentRound, selectedCategory])

  const startExplainer = () => {
    setIsActive(true)
    setCurrentElement(0)
  }

  const nextElement = () => {
    if (currentElement < elements.length - 1) {
      setCurrentElement(prev => prev + 1)
    } else {
      setIsActive(false)
    }
  }

  const prevElement = () => {
    if (currentElement > 0) {
      setCurrentElement(prev => prev - 1)
    }
  }

  const skipExplainer = () => {
    setIsActive(false)
  }

  if (!isActive) {
    return (
      <div className="fixed bottom-4 left-20 z-40">
        <button
          onClick={startExplainer}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
        >
          <Info className="w-4 h-4" />
          <span>UI Guide</span>
        </button>
      </div>
    )
  }

  const currentElementData = elements[currentElement]

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      {/* Highlight Overlay */}
      <div className="absolute inset-0">
        {elements.map((element, index) => (
          <div
            key={element.id}
            className={`absolute rounded-lg border-2 transition-all duration-300 ${
              index === currentElement
                ? 'border-yellow-400 bg-yellow-200/20 shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}
            style={{
              left: `${element.position.x - 10}%`,
              top: `${element.position.y - 5}%`,
              width: '20%',
              height: '10%',
            }}
          />
        ))}
      </div>

      {/* Explanation Card */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">{currentElementData.icon}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {currentElementData.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentElement + 1} of {elements.length}
              </p>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {currentElementData.description}
          </p>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentElement + 1) / elements.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentElement + 1) / elements.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevElement}
              disabled={currentElement === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={skipExplainer}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={currentElement === elements.length - 1 ? skipExplainer : nextElement}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                {currentElement === elements.length - 1 ? 'Finish' : 'Next'}
                {currentElement < elements.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
