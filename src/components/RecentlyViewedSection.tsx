'use client'

import { useRouter } from 'next/navigation'
import { Clock, X } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { formatPokemonName } from '@/lib/utils'
import Image from 'next/image'

export default function RecentlyViewedSection() {
  const router = useRouter()
  const { recentlyViewed, clearRecentlyViewed, removeRecentlyViewed } = useRecentlyViewed()

  if (recentlyViewed.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-surface/60 border-b border-border">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Recently Viewed</h3>
          </div>
          <button
            onClick={clearRecentlyViewed}
            className="text-xs text-muted hover:text-text transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {recentlyViewed.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/pokemon/${item.id}`)}
              className="group relative flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-surface hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeRecentlyViewed(item.id)
                }}
                className="absolute top-0 right-0 p-0.5 rounded-full bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from recently viewed"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="w-12 h-12 relative">
                <Image
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-medium text-center">
                #{String(item.id).padStart(3, '0')}
              </span>
              <span className="text-xs text-muted text-center max-w-[80px] truncate">
                {formatPokemonName(item.name)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
