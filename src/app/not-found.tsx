'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

// Array of Pokemon-related 404 messages
const pokemon404Messages = [
  "This Pokémon has used Teleport and vanished!",
  "A wild MissingNo appeared! Wait, that's not right...",
  "This route seems to have been blocked by Snorlax!",
  "The Pokédex entry you're looking for has escaped!",
  "Team Rocket must have stolen this page!",
  "This Pokémon used Fly and went somewhere else!",
  "Looks like this page got hit by a critical miss!",
  "The legendary Pokémon of this page is too elusive!",
  "This area is under construction by the Pokémon Construction Company!",
  "A Ditto transformed this page into something else!",
  "This Pokémon evolved into a 404 error!",
  "The Poké Ball broke! This page couldn't be caught!",
  "This route is blocked by a mysterious force field!",
  "The Pokémon Center is closed for maintenance here!",
  "Looks like this page got confused and wandered off!",
  "A wild 404 appeared! It used 'Page Not Found'!",
  "This Pokémon is not available in your current region!",
  "The Pokédex is having trouble identifying this page!",
  "This page has been hit by a sandstorm and disappeared!",
  "The Pokémon League has temporarily closed this route!"
]

// Array of available 404 images
const pokemon404Images = [
  '/404/272EFAC0-D1CE-4D22-BFA1-1AF6EA409C2B.png',
  '/404/58ED7B70-A39E-4887-A1BC-FB834F6EF7BE.png',
  '/404/932F4094-8D3A-4DE0-BB6F-22D94DA31A99.png',
  '/404/A2D5D410-F70E-48CD-83B9-35D773E1540C.png',
  '/404/B1643751-6112-476D-B2DB-76DD64328869.png',
  '/404/CF013367-44BC-41E0-A4F2-1CDA31A65E0B.png',
  '/404/F450C6CC-873C-49F8-87DD-1E35504FBFCF.png'
]

export default function NotFound() {
  const [randomMessage, setRandomMessage] = useState('')
  const [randomImage, setRandomImage] = useState('')

  useEffect(() => {
    // Randomize message and image on component mount
    const randomMsg = pokemon404Messages[Math.floor(Math.random() * pokemon404Messages.length)]
    const randomImg = pokemon404Images[Math.floor(Math.random() * pokemon404Images.length)]
    
    setRandomMessage(randomMsg)
    setRandomImage(randomImg)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        {/* Random Pokemon Image */}
        <div className="mb-6 flex justify-center">
          {randomImage && (
            <Image
              src={randomImage}
              alt="Pokemon 404"
              width={200}
              height={200}
              className="rounded-lg shadow-lg"
              priority
            />
          )}
        </div>
        
        {/* 404 Title */}
        <h1 className="text-4xl font-bold mb-4 text-red-600 dark:text-red-400">
          404 - Page Not Found
        </h1>
        
        {/* Random Pokemon Message */}
        <p className="text-lg mb-6 text-gray-600 dark:text-gray-400 italic">
          {randomMessage}
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/80 transition-colors font-medium"
          >
            Back to PokéDex
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try searching for a different Pokémon or explore our Pokédex
          </p>
        </div>
      </div>
    </div>
  )
}
