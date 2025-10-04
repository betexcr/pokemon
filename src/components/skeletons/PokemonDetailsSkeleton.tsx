'use client'

import React from 'react'

/**
 * Skeleton component for Pokemon details loading states
 */
export function PokemonDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pokemon Image Skeleton */}
          <div className="w-48 h-48 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
          </div>
          
          {/* Pokemon Info Skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
            </div>
            
            {/* Abilities Skeleton */}
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-24"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-28"></div>
              </div>
            </div>
            
            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
              <div className="flex justify-center">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        {/* Stats Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Moves Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mt-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Evolution Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="flex flex-wrap gap-6 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Matchups Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-28 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for individual stats
 */
export function StatSkeleton() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
    </div>
  )
}

/**
 * Skeleton for move cards
 */
export function MoveSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mt-1"></div>
    </div>
  )
}

/**
 * Skeleton for evolution chain
 */
export function EvolutionSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full mb-2 mx-auto"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto"></div>
    </div>
  )
}

/**
 * Skeleton for type matchups
 */
export function MatchupSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto"></div>
    </div>
  )
}

/**
 * Skeleton for ability badges
 */
export function AbilitySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-24"></div>
    </div>
  )
}

/**
 * Skeleton for description text
 */
export function DescriptionSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
    </div>
  )
}

/**
 * Skeleton for genus badge
 */
export function GenusSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-32"></div>
    </div>
  )
}
