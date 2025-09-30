'use client'

import { useState, useEffect } from 'react'
import { Play, SkipForward, RotateCcw, CheckCircle } from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  action?: string
  highlight?: string
  icon: string
}

interface ContestTutorialProps {
  onComplete?: () => void
  onSkip?: () => void
}

export default function ContestTutorial({ onComplete, onSkip }: ContestTutorialProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Pokémon Contests!',
      description: 'Contests are performance competitions where Pokémon showcase their talents. Let\'s learn how to play!',
      icon: '🎭'
    },
    {
      id: 'categories',
      title: 'Choose Your Contest Category',
      description: 'Pick from 5 categories: Cool, Beauty, Cute, Clever, or Tough. Each has unique moves and strategies!',
      action: 'Click on a contest category below',
      highlight: 'contest-categories',
      icon: '🏆'
    },
    {
      id: 'pokeblocks',
      title: 'Feed Pokéblocks in Introduction Round',
      description: 'Feed colored Pokéblocks to boost your Pokémon\'s contest stats before the performance!',
      action: 'Click on colored Pokéblocks to feed them',
      highlight: 'pokeblock-feeder',
      icon: '🍬'
    },
    {
      id: 'introduction',
      title: 'Complete Introduction Round',
      description: 'When you\'re satisfied with your stat boosts, start the Introduction Round to earn stars!',
      action: 'Click "Start Introduction Round" button',
      highlight: 'intro-button',
      icon: '⭐'
    },
    {
      id: 'talent',
      title: 'Talent Round - Use Appeal Moves',
      description: 'Choose moves for your Pokémon to perform. Strategy is key to success!',
      action: 'Select moves from the available list',
      highlight: 'talent-round',
      icon: '✨'
    },
    {
      id: 'excite',
      title: 'Watch the Excite Meter',
      description: 'Moves matching your contest category fill the Excite Meter. When full, your next move becomes Spectacular!',
      action: 'Use matching moves to fill the meter',
      highlight: 'excite-meter',
      icon: '🎆'
    },
    {
      id: 'variety',
      title: 'Avoid Repetition',
      description: 'Don\'t use the same move twice in a row - the audience gets bored and you\'ll lose hearts!',
      action: 'Use different moves each turn',
      highlight: 'move-selection',
      icon: '😴'
    },
    {
      id: 'scoring',
      title: 'Understanding Scoring',
      description: 'Earn stars from Introduction Round and hearts from Talent Round. Higher scores unlock better ranks!',
      action: 'Watch your score increase with good moves',
      highlight: 'score-display',
      icon: '🏅'
    },
    {
      id: 'complete',
      title: 'Complete Your Contest',
      description: 'Finish the Talent Round to see your final rank and rewards!',
      action: 'Click "Complete Contest" when ready',
      highlight: 'complete-button',
      icon: '🎉'
    }
  ]

  const startTutorial = () => {
    setIsActive(true)
    setCurrentStep(0)
    setCompletedSteps(new Set())
  }

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeTutorial = () => {
    setIsActive(false)
    setCurrentStep(0)
    onComplete?.()
  }

  const skipTutorial = () => {
    setIsActive(false)
    setCurrentStep(0)
    onSkip?.()
  }

  const currentStepData = tutorialSteps[currentStep]

  // Auto-advance tutorial based on user actions
  useEffect(() => {
    if (!isActive) return

    const handleUserAction = (action: string) => {
      const expectedAction = currentStepData.action
      if (expectedAction && action.includes(expectedAction.toLowerCase())) {
        setCompletedSteps(prev => new Set([...prev, currentStepData.id]))
        setTimeout(() => nextStep(), 1000)
      }
    }

    // Listen for tutorial-triggered events
    const handleTutorialEvent = (e: CustomEvent) => {
      handleUserAction(e.detail.action)
    }

    window.addEventListener('tutorial-action', handleTutorialEvent as EventListener)
    return () => window.removeEventListener('tutorial-action', handleTutorialEvent as EventListener)
  }, [isActive, currentStep, currentStepData])

  if (!isActive) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={startTutorial}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          <span className="font-bold">Start Tutorial</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentStepData.icon}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={skipTutorial}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Action Required:</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {currentStepData.action}
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-2 mb-6">
            {tutorialSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index < currentStep ? 'bg-green-500 text-white' : 
                    index === currentStep ? 'bg-blue-500 text-white animate-pulse' : 
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                `}>
                  {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`
                  ${index < currentStep ? 'text-green-600 dark:text-green-400 line-through' : 
                    index === currentStep ? 'text-blue-600 dark:text-blue-400 font-bold' : 
                    'text-gray-500 dark:text-gray-400'}
                `}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={skipTutorial}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={currentStep === tutorialSteps.length - 1 ? completeTutorial : nextStep}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Complete' : 'Next'}
              {currentStep < tutorialSteps.length - 1 && <SkipForward className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
