'use client'

import { useState } from 'react'
import { HelpCircle, X, ArrowRight, Star, Heart, Zap, Sparkles } from 'lucide-react'

interface ContestHelpGuideProps {
  currentRound?: 'intro' | 'talent' | 'results'
  selectedCategory?: string | null
}

export default function ContestHelpGuide({ currentRound, selectedCategory }: ContestHelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const helpSteps = [
    {
      title: "Welcome to Pokémon Contests!",
      content: "Contests are performance competitions where Pokémon showcase their talents. There are two main rounds: Introduction and Talent.",
      icon: "🎭"
    },
    {
      title: "Choose Your Contest Category",
      content: "Pick from 5 categories: Cool (❄️), Beauty (🌸), Cute (💖), Clever (🧠), or Tough (💪). Each has unique moves and strategies!",
      icon: "🏆"
    },
    {
      title: "Introduction Round - Feed Pokéblocks",
      content: "Feed colored Pokéblocks to boost your Pokémon's contest stats. Red=Coolness, Blue=Beauty, Pink=Cuteness, Green=Cleverness, Yellow=Toughness. Rainbow blocks boost all stats!",
      icon: "🍬"
    },
    {
      title: "Talent Round - Use Appeal Moves",
      content: "Select moves for your Pokémon to perform. Moves matching your contest category give bonus hearts and fill the Excite Meter!",
      icon: "✨"
    },
    {
      title: "Excite Meter & Spectacular Talent",
      content: "When the Excite Meter fills up, your next move becomes a Spectacular Talent with massive bonus points!",
      icon: "🎆"
    },
    {
      title: "Avoid Repetition",
      content: "Don't use the same move twice in a row - the audience gets bored and you'll lose hearts! Variety is key to success.",
      icon: "😴"
    },
    {
      title: "Scoring System",
      content: "Earn stars from the Introduction Round and hearts from the Talent Round. Higher scores unlock better ranks: Normal → Super → Hyper → Master!",
      icon: "⭐"
    }
  ]

  const getCurrentStepContent = () => {
    if (currentRound === 'intro') {
      return {
        title: "Introduction Round Guide",
        content: "Feed Pokéblocks to boost your Pokémon's contest stats before the performance!",
        tips: [
          "🍬 Click colored Pokéblocks to feed them to your Pokémon",
          "📊 Watch the stat bars fill up as you feed blocks",
          "🌈 Rainbow blocks boost all stats at once",
          "💡 Match block colors to the contest category for best results"
        ]
      }
    } else if (currentRound === 'talent') {
      return {
        title: "Talent Round Guide",
        content: "Choose appeal moves for your Pokémon to perform! Strategy is key to success.",
        tips: [
          "✨ Use moves that match your contest category for bonus hearts",
          "🎆 Fill the Excite Meter to trigger Spectacular Talent",
          "😴 Don't repeat the same move twice - the audience gets bored",
          "⭐ Higher power moves give more hearts"
        ]
      }
    } else if (currentRound === 'results') {
      return {
        title: "Results & Ranks",
        content: "Your performance determines your rank and rewards!",
        tips: [
          "🏆 Master Rank: 50+ points (Master Ribbon)",
          "💎 Hyper Rank: 35-49 points (Hyper Ribbon)",
          "🥇 Super Rank: 20-34 points (Super Ribbon)",
          "🏅 Normal Rank: 0-19 points (Participation Ribbon)"
        ]
      }
    }
    return null
  }

  const currentContent = getCurrentStepContent()

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="Open Help Guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Contest Help Guide
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {currentContent ? (
                <div className="space-y-6">
                  {/* Current Round Guide */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-3">
                      {currentContent.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {currentContent.content}
                    </p>
                    <div className="space-y-2">
                      {currentContent.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-lg">{tip.split(' ')[0]}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {tip.substring(tip.indexOf(' ') + 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Steps */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      Complete Contest Guide
                    </h4>
                    {helpSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="text-2xl">{step.icon}</div>
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                            {step.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    How to Play Pokémon Contests
                  </h3>
                  {helpSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl">{step.icon}</div>
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                          {step.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {step.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Tips */}
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  💡 Pro Tips
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Plan your moves in advance - variety is key!</li>
                  <li>• Save your most powerful moves for when the Excite Meter is nearly full</li>
                  <li>• Watch the mascot judge for real-time feedback on your performance</li>
                  <li>• Read the fun facts to learn more about contest history and strategies</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>Need more help? Check the fun facts below!</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
