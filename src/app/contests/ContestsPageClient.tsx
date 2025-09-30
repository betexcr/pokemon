'use client'

import { useState, useEffect } from 'react'
import AppHeader from '@/components/AppHeader'
import ContestCategory from '@/components/contests/ContestCategory'
import PokeblockFeeder from '@/components/contests/PokeblockFeeder'
import ExciteMeter from '@/components/contests/ExciteMeter'
import TalentRound from '@/components/contests/TalentRound'
import ContestRank from '@/components/contests/ContestRank'
import ContestFunFactCard from '@/components/contests/ContestFunFactCard'
import ContestMascot from '@/components/contests/ContestMascot'
import ContestBackground from '@/components/contests/ContestBackground'
import ContestCelebration from '@/components/contests/ContestCelebration'
import ContestHelpGuide from '@/components/contests/ContestHelpGuide'
import ContestTutorial from '@/components/contests/ContestTutorial'
import ContestUIExplainer from '@/components/contests/ContestUIExplainer'
import { PokeblockTooltip, MoveTooltip, ExciteMeterTooltip, CategoryTooltip } from '@/components/contests/ContestTooltip'
import ContestPokemonDisplay from '@/components/contests/ContestPokemonDisplay'
import PokemonSelector from '@/components/PokemonSelector'
import { contestData } from '@/data/contestData'
import { Heart, Star, Sparkles, Trophy, Ribbon, Users } from 'lucide-react'
import { Pokemon } from '@/types/pokemon'

interface ContestStats {
  coolness: number
  beauty: number
  cuteness: number
  cleverness: number
  toughness: number
}

interface ContestState {
  selectedCategory: string | null
  currentRound: 'intro' | 'talent' | 'results'
  pokemonStats: ContestStats
  exciteMeter: number
  hearts: number
  stars: number
  currentRank: string
  usedMoves: string[]
  lastMove: string | null
  selectedPokemon: Pokemon[]
}

export default function ContestsPageClient() {
  const [contestState, setContestState] = useState<ContestState>({
    selectedCategory: null,
    currentRound: 'intro',
    pokemonStats: {
      coolness: 0,
      beauty: 0,
      cuteness: 0,
      cleverness: 0,
      toughness: 0
    },
    exciteMeter: 0,
    hearts: 0,
    stars: 0,
    currentRank: 'Normal',
    usedMoves: [],
    lastMove: null,
    selectedPokemon: []
  })

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [celebrationType, setCelebrationType] = useState<'pokeblock' | 'move' | 'spectacular' | 'completion' | 'bored'>('pokeblock')
  const [isRepeatedMove, setIsRepeatedMove] = useState(false)

  // Handle Pokéblock feeding
  const handlePokeblockFeed = (color: string, stat: keyof ContestStats) => {
    setContestState(prev => ({
      ...prev,
      pokemonStats: {
        ...prev.pokemonStats,
        [stat]: Math.min(prev.pokemonStats[stat] + 20, 255)
      }
    }))

    // Show celebration
    setCelebrationType('pokeblock')
    setCelebrationMessage(`${color} Pokéblock fed! ${stat} increased!`)
    setShowCelebration(true)
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setContestState(prev => ({
      ...prev,
      selectedCategory: category,
      currentRound: 'intro'
    }))
  }

  // Handle introduction round completion
  const handleIntroComplete = () => {
    const category = contestState.selectedCategory
    if (!category) return

    const statValue = contestState.pokemonStats[category as keyof ContestStats]
    const stars = Math.floor(statValue / 50) + 1

    setContestState(prev => ({
      ...prev,
      currentRound: 'talent',
      stars: prev.stars + stars
    }))

    setCelebrationType('completion')
    setCelebrationMessage(`Introduction Round Complete! +${stars} stars!`)
    setShowCelebration(true)
  }

  // Handle move usage in talent round
  const handleMoveUse = (move: string, category: string) => {
    const isMatchingCategory = category === contestState.selectedCategory
    const isRepeatedMove = contestState.lastMove === move
    const isSpectacular = contestState.exciteMeter >= 100

    let heartsGained = 0
    let newExciteMeter = contestState.exciteMeter

    if (isMatchingCategory && !isRepeatedMove) {
      heartsGained = 3
      newExciteMeter = Math.min(contestState.exciteMeter + 20, 100)
    } else if (isMatchingCategory && isRepeatedMove) {
      heartsGained = -1 // Penalty for repeating moves
    } else if (!isMatchingCategory) {
      heartsGained = 1
    }

    if (isSpectacular) {
      heartsGained += 5
      newExciteMeter = 0 // Reset meter
    }

    setContestState(prev => ({
      ...prev,
      hearts: Math.max(0, prev.hearts + heartsGained),
      exciteMeter: newExciteMeter,
      usedMoves: [...prev.usedMoves, move],
      lastMove: move
    }))

    setIsRepeatedMove(isRepeatedMove)

    // Show appropriate celebration
    if (isSpectacular) {
      setCelebrationType('spectacular')
      setCelebrationMessage('SPECTACULAR TALENT!')
    } else if (isMatchingCategory && !isRepeatedMove) {
      setCelebrationType('move')
      setCelebrationMessage('Perfect move!')
    } else if (isRepeatedMove) {
      setCelebrationType('bored')
      setCelebrationMessage('The audience is bored...')
    } else {
      setCelebrationType('move')
      setCelebrationMessage('Good move!')
    }

    setShowCelebration(true)
  }

  // Handle talent round completion
  const handleTalentComplete = () => {
    const totalScore = contestState.stars + contestState.hearts
    let newRank = 'Normal'

    if (totalScore >= 50) newRank = 'Master'
    else if (totalScore >= 35) newRank = 'Hyper'
    else if (totalScore >= 20) newRank = 'Super'

    setContestState(prev => ({
      ...prev,
      currentRound: 'results',
      currentRank: newRank
    }))

    setCelebrationType('completion')
    setCelebrationMessage(`Contest Complete! Rank: ${newRank}`)
    setShowCelebration(true)
  }

  // Handle Pokemon selection
  const handlePokemonSelect = (pokemon: Pokemon) => {
    setContestState(prev => ({
      ...prev,
      selectedPokemon: [...prev.selectedPokemon, pokemon]
    }))
  }

  const handlePokemonRemove = (pokemonId: number) => {
    setContestState(prev => ({
      ...prev,
      selectedPokemon: prev.selectedPokemon.filter(p => p.id !== pokemonId)
    }))
  }

  // Reset contest
  const resetContest = () => {
    setContestState({
      selectedCategory: null,
      currentRound: 'intro',
      pokemonStats: {
        coolness: 0,
        beauty: 0,
        cuteness: 0,
        cleverness: 0,
        toughness: 0
      },
      exciteMeter: 0,
      hearts: 0,
      stars: 0,
      currentRank: 'Normal',
      usedMoves: [],
      lastMove: null,
      selectedPokemon: []
    })
  }

  return (
    <div className="min-h-screen relative">
      {/* Themed Background */}
      <ContestBackground 
        selectedCategory={contestState.selectedCategory}
        currentRound={contestState.currentRound}
        exciteMeter={contestState.exciteMeter}
        isSpectacular={contestState.exciteMeter >= 100}
      />

      <AppHeader
        title="Pokémon Contests"
        subtitle="Kawaii Performance Competition"
        iconKey="contests"
        showIcon={true}
        showToolbar={true}
      />

      {/* Interactive Mascot */}
      <ContestMascot
        selectedCategory={contestState.selectedCategory}
        currentRound={contestState.currentRound}
        exciteMeter={contestState.exciteMeter}
        lastMove={contestState.lastMove}
        isRepeatedMove={isRepeatedMove}
        isSpectacular={contestState.exciteMeter >= 100}
        hearts={contestState.hearts}
        stars={contestState.stars}
      />

      {/* Celebration Animation */}
      <ContestCelebration
        trigger={showCelebration}
        type={celebrationType}
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Help Guide */}
      <ContestHelpGuide 
        currentRound={contestState.currentRound}
        selectedCategory={contestState.selectedCategory}
      />

      {/* Interactive Tutorial */}
      <ContestTutorial 
        onComplete={() => console.log('Tutorial completed')}
        onSkip={() => console.log('Tutorial skipped')}
      />

      {/* UI Explainer */}
      <ContestUIExplainer 
        currentRound={contestState.currentRound}
        selectedCategory={contestState.selectedCategory}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Pokémon Contests
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
            Showcase your Pokémon's talents in kawaii performance competitions! ✨
          </p>
          
          {/* Current Stats Display */}
          <div id="score-display" className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-full px-4 py-2 shadow-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-gray-700 dark:text-gray-300">{contestState.stars}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-full px-4 py-2 shadow-lg">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-gray-700 dark:text-gray-300">{contestState.hearts}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-full px-4 py-2 shadow-lg">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="font-bold text-gray-700 dark:text-gray-300">{contestState.currentRank}</span>
            </div>
          </div>
        </div>

        {/* Pokemon Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
            <Users className="w-6 h-6 inline-block mr-2" />
            Choose Your Contest Pokémon
          </h2>
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 mb-6">
            <p className="text-center text-pink-700 dark:text-pink-300 font-medium">
              🎭 Select up to 3 Pokémon to participate in contests! Each Pokémon can compete in different categories.
            </p>
          </div>
          <PokemonSelector
            selectedPokemon={contestState.selectedPokemon}
            onPokemonSelect={handlePokemonSelect}
            onPokemonRemove={handlePokemonRemove}
            maxSelections={3}
            placeholder="Search for cute Pokémon to compete in contests..."
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Selected Pokemon Display */}
        {contestState.selectedPokemon.length > 0 && (
          <ContestPokemonDisplay
            selectedPokemon={contestState.selectedPokemon}
            selectedCategory={contestState.selectedCategory}
            currentRound={contestState.currentRound}
          />
        )}

        {/* Contest Categories */}
        {!contestState.selectedCategory && contestState.selectedPokemon.length > 0 && (
          <div className="mb-8" id="contest-categories">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
              Choose a Contest Category
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <p className="text-center text-blue-700 dark:text-blue-300 font-medium">
                💡 Each category has unique moves and strategies. Pick the one that matches your Pokémon's strengths!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {contestData.categories.map((category) => (
                <CategoryTooltip key={category.id}>
                  <ContestCategory
                    category={category}
                    onSelect={() => handleCategorySelect(category.id)}
                  />
                </CategoryTooltip>
              ))}
            </div>
          </div>
        )}

        {/* No Pokemon Selected Message */}
        {contestState.selectedPokemon.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                No Pokémon Selected
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Please select at least one Pokémon above to start your contest journey!
              </p>
            </div>
          </div>
        )}

        {/* Pokéblock Feeder */}
        {contestState.selectedCategory && contestState.currentRound === 'intro' && (
          <div className="mb-8" id="pokeblock-feeder">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
              Feed Pokéblocks to Boost Stats
            </h2>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <p className="text-center text-green-700 dark:text-green-300 font-medium">
                🍬 Feed colored Pokéblocks to boost your Pokémon's contest stats! Red=Coolness, Blue=Beauty, Pink=Cuteness, Green=Cleverness, Yellow=Toughness. Rainbow blocks boost all stats!
              </p>
            </div>
            <PokeblockTooltip>
              <PokeblockFeeder
                pokemonStats={contestState.pokemonStats}
                onPokeblockFeed={handlePokeblockFeed}
              />
            </PokeblockTooltip>
            
            <div className="text-center mt-6">
              <button
                id="intro-button"
                onClick={handleIntroComplete}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Introduction Round ✨
              </button>
            </div>
          </div>
        )}

        {/* Talent Round */}
        {contestState.selectedCategory && contestState.currentRound === 'talent' && (
          <div className="mb-8" id="talent-round">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
              Talent Round - Use Appeal Moves!
            </h2>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
              <p className="text-center text-purple-700 dark:text-purple-300 font-medium">
                ✨ Use moves that match your contest category for bonus hearts! Fill the Excite Meter to trigger Spectacular Talent! Don't repeat the same move twice!
              </p>
            </div>
            
            <ExciteMeterTooltip>
              <div id="excite-meter">
                <ExciteMeter value={contestState.exciteMeter} />
              </div>
            </ExciteMeterTooltip>
            
            <MoveTooltip>
              <div id="move-selection">
                <TalentRound
                  selectedCategory={contestState.selectedCategory}
                  onMoveUse={handleMoveUse}
                  usedMoves={contestState.usedMoves}
                />
              </div>
            </MoveTooltip>
            
            <div className="text-center mt-6">
              <button
                id="complete-button"
                onClick={handleTalentComplete}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Complete Contest 🏆
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {contestState.selectedCategory && contestState.currentRound === 'results' && (
          <div className="mb-8">
            <ContestRank
              rank={contestState.currentRank}
              stars={contestState.stars}
              hearts={contestState.hearts}
              totalScore={contestState.stars + contestState.hearts}
            />
            
            <div className="text-center mt-6">
              <button
                onClick={resetContest}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start New Contest 🎉
              </button>
            </div>
          </div>
        )}

        {/* Fun Facts Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
            ✨ Contest Fun Facts ✨
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContestFunFactCard variant="all" />
            {contestState.selectedCategory && (
              <ContestFunFactCard variant={contestState.selectedCategory as any} />
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-center text-gray-700 dark:text-gray-300">
            💡 Contest Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-pink-500">💖</span>
              <span>Feed matching colored Pokéblocks to boost contest stats!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">⭐</span>
              <span>Use moves that match your contest category for bonus hearts!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">⚡</span>
              <span>Don't repeat the same move twice - the audience will get bored!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500">🎆</span>
              <span>Fill the Excite Meter for a spectacular talent performance!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
