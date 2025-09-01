"use client";

import { useState } from 'react';
import { Pokemon, FilterState } from '@/types/pokemon';
import { formatPokemonName, getPokemonDescription } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import PokemonComparison from './PokemonComparison';
import RadarChart from './RadarChart';
import VirtualizedPokemonList from './VirtualizedPokemonList';

interface GoldPokedexLayoutProps {
  pokemonList: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelectPokemon: (pokemon: Pokemon) => void;
  onToggleFavorite: (id: number) => void;
  favorites: number[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function GoldPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  onToggleFavorite,
  favorites,
  filters,
  setFilters
}: GoldPokedexLayoutProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [filteredPokemon] = useState<Pokemon[]>(pokemonList);

  return (
    <div className="min-h-screen pokemon-gold-bg font-gbc text-white">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Authentic GBC PokéDex Header */}
      <div className="bg-yellow-200 border-b-4 border-yellow-600 p-2">
        <h1 className="text-xl font-bold text-center text-yellow-800">POKéDEX</h1>
      </div>

      {/* Main PokéDex Interface - Three Panel Design */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Stats and Background Graphic */}
        <div className="w-1/4 bg-gradient-to-b from-yellow-800 to-yellow-900 p-4 relative">
          {/* Background "G" graphic */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="text-8xl font-bold text-gray-600">G</span>
          </div>
          
          {/* Stats */}
          <div className="relative z-10 space-y-2">
            <div className="text-white font-bold">SEEN</div>
            <div className="text-black bg-white px-2 py-1 text-right font-mono text-lg">
              {pokemonList.length}
            </div>
            <div className="text-white font-bold">OWN</div>
            <div className="text-black bg-white px-2 py-1 text-right font-mono text-lg">
              {favorites.length}
            </div>
          </div>
        </div>

        {/* Central Panel - Pokémon Sprites */}
        <div className="w-1/2 bg-gradient-to-b from-yellow-800 to-yellow-900 p-4 flex flex-col justify-center">
          {selectedPokemon && (
            <div className="text-center">
              <img
                src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default || ''}
                alt={selectedPokemon.name}
                className="w-32 h-32 object-contain image-render-pixel mx-auto mb-4"
              />
              <div className="text-white font-bold text-lg">
                {formatPokemonName(selectedPokemon.name).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Pokémon List */}
        <div className="w-1/4 bg-yellow-200 border-l-4 border-yellow-600">
          <div className="h-full">
            <VirtualizedPokemonList
              pokemonList={filteredPokemon}
              onSelectPokemon={onSelectPokemon}
              selectedPokemon={selectedPokemon}
              containerHeight={400}
              itemHeight={40}
              className="font-gbc"
            />
          </div>
          
          {/* Scroll arrows */}
          <div className="absolute top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-500"></div>
          <div className="absolute bottom-2 right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      </div>

      {/* Enhanced Data Panel */}
      {selectedPokemon && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-yellow-100 border-4 border-yellow-600 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-yellow-800">POKéMON DATA</h3>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-3 py-1 rounded text-sm ${
                showComparison ? 'bg-yellow-600 text-white' : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {showComparison ? 'HIDE' : 'COMPARE'}
            </button>
          </div>

          {!showComparison ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-bold text-yellow-800">No.{String(selectedPokemon.id).padStart(3, '0')}</div>
                  <div className="text-sm">HT {(selectedPokemon.height / 10).toFixed(1)}m</div>
                  <div className="text-sm">WT {(selectedPokemon.weight / 10).toFixed(1)}kg</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-yellow-800">TYPES</div>
                  <div className="text-sm">
                    {selectedPokemon.types.map(type => formatPokemonName(type.type.name)).join('/')}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-bold text-yellow-800 mb-2">DESCRIPTION</div>
                <p className="text-xs leading-relaxed text-black">
                  {getPokemonDescription(selectedPokemon)}
                </p>
              </div>

              <div className="mb-4">
                <div className="text-sm font-bold text-yellow-800 mb-2 text-center">STATS</div>
                <RadarChart
                  data={[{
                    name: selectedPokemon.name,
                    stats: {
                      hp: selectedPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                      attack: selectedPokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                      defense: selectedPokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                      'special-attack': selectedPokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
                      'special-defense': selectedPokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
                      speed: selectedPokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
                    },
                    color: '#FFD700'
                  }]}
                  size={200}
                  className="mx-auto"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-bold text-yellow-800 mb-4 text-center">COMPARE POKéMON</div>
              <PokemonComparison pokemonList={pokemonList} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <button className="bg-red-600 text-white px-4 py-2 rounded-l-lg border border-gray-600 flex items-center">
          <div className="w-4 h-4 bg-gray-600 rounded-full mr-2"></div>
          <div className="text-xs">
            <div>START</div>
            <div>MENU</div>
          </div>
        </button>
        
        <button className="bg-red-600 text-white px-4 py-2 rounded-l-lg border border-gray-600 flex items-center">
          <div className="w-4 h-4 bg-gray-600 rounded-full mr-2"></div>
          <div className="text-xs">
            <div>SELECT</div>
            <div>SEARCH</div>
          </div>
        </button>
      </div>

      {/* Search Bar (Hidden by default, can be toggled) */}
      {filters.search && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-white border-2 border-gray-600 p-2">
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-transparent outline-none font-gameboy text-sm text-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
