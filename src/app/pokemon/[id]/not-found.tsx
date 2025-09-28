import Link from 'next/link'

export default function PokemonNotFound() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-4 text-red-600 dark:text-red-400">
          Pokémon Not Found
        </h1>
        <p className="text-lg mb-6 text-gray-600 dark:text-gray-400">
          The Pokémon you're looking for doesn't exist or has been removed.
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/80 transition-colors font-medium"
          >
            Back to PokéDex
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try searching for a different Pokémon
          </p>
        </div>
      </div>
    </div>
  )
}
