'use client'

import { useState, useEffect } from 'react'
import { getCachedImageUrl } from '@/lib/imageCache'

interface UseCachedImageOptions {
  fallbackUrl?: string
  onError?: () => void
  onLoad?: () => void
}

export function useCachedImage(
  url: string, 
  options: UseCachedImageOptions = {}
) {
  const [imageUrl, setImageUrl] = useState<string>(url)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      if (!url) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setHasError(false)
        
        const cachedUrl = await getCachedImageUrl(url)
        
        if (isMounted) {
          setImageUrl(cachedUrl)
          setIsLoading(false)
          options.onLoad?.()
        }
      } catch (error) {
        console.warn('Failed to load cached image:', error)
        
        if (isMounted) {
          setHasError(true)
          setIsLoading(false)
          
          // Try fallback URL if provided
          if (options.fallbackUrl) {
            try {
              const fallbackCachedUrl = await getCachedImageUrl(options.fallbackUrl)
              if (isMounted) {
                setImageUrl(fallbackCachedUrl)
                setHasError(false)
              }
            } catch (fallbackError) {
              console.warn('Fallback image also failed:', fallbackError)
              if (isMounted) {
                setImageUrl(options.fallbackUrl)
              }
            }
          } else {
            setImageUrl(url) // Use original URL as fallback
          }
          
          options.onError?.()
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [url, options.fallbackUrl])

  return {
    imageUrl,
    isLoading,
    hasError
  }
}

// Hook specifically for Pokémon images
export function usePokemonImage(pokemonId: number, variant: 'default' | 'shiny' = 'default') {
  const baseUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`
  const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
  const finalFallbackUrl = '/placeholder-pokemon.png' // Local placeholder
  
  return useCachedImage(baseUrl, {
    fallbackUrl: fallbackUrl,
    onError: () => {
      console.warn(`Failed to load image for Pokémon ${pokemonId}, using fallback`)
    }
  })
}
