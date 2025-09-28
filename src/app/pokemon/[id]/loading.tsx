export default function PokemonLoading() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-poke-blue mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Loading Pokémon Details</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fetching data from the PokéAPI...
        </p>
      </div>
    </div>
  )
}
