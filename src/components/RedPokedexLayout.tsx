"use client";

import { useState } from 'react';
import { Pokemon, FilterState } from '@/types/pokemon';
import { formatPokemonName, getPokemonDescription } from '@/lib/utils';
import { searchPokemonByName } from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import PokemonComparison from './PokemonComparison';
import RadarChart from './RadarChart';
import VirtualizedPokemonList from './VirtualizedPokemonList';

interface RedPokedexLayoutProps {
  pokemonList: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelectPokemon: (pokemon: Pokemon) => void;
  onToggleFavorite: (id: number) => void;
  favorites: number[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function RedPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  onToggleFavorite,
  favorites,
  filters,
  setFilters
}: RedPokedexLayoutProps) {
  const [menuSelection, setMenuSelection] = useState<'data' | 'cry' | 'area' | 'quit'>('data');
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>(pokemonList);

  const menuOptions = [
    { id: 'data', label: 'DATA' },
    { id: 'cry', label: 'CRY' },
    { id: 'area', label: 'AREA' },
    { id: 'quit', label: 'QUIT' }
  ] as const;

  return (
    <div className="min-h-screen pokemon-red-bg font-gbc text-black">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Authentic GBC PokéDex Header */}
      <div className="bg-red-100 border-b-4 border-red-600 p-4">
        <h1 className="text-2xl font-bold text-center text-red-800">POKéDEX</h1>
      </div>

      {/* Main PokéDex Interface - Split Panel Design */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Pokémon List */}
        <div className="w-1/2 bg-red-50 border-r-4 border-red-600 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold border-b-2 border-red-600 pb-2 text-red-800">CONTENTS</h2>
          </div>
          
          <div className="space-y-1 max-h-[calc(100vh-200px)]">
            <VirtualizedPokemonList
              pokemonList={filteredPokemon}
              onSelectPokemon={onSelectPokemon}
              selectedPokemon={selectedPokemon}
              containerHeight={400}
              itemHeight={30}
              className="font-gbc"
            />
          </div>
        </div>

        {/* Right Panel - Stats and Menu */}
        <div className="w-1/2 bg-red-50 p-4">
          {selectedPokemon ? (
            <>
              {/* Stats Section */}
              <div className="mb-6">
                <div className="text-sm space-y-1">
                  <div>SEEN {pokemonList.length}</div>
                  <div>OWN {favorites.length}</div>
                </div>
                <div className="border-t-2 border-black my-2"></div>
              </div>

              {/* Menu Options */}
              <div className="space-y-2">
                {menuOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer p-1 ${
                      menuSelection === option.id ? 'bg-red-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setMenuSelection(option.id)}
                  >
                    {option.label}
                  </div>
                ))}
                <div
                  className={`cursor-pointer p-1 ${
                    showComparison ? 'bg-red-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  COMPARE
                </div>
              </div>

              {/* Pokémon Detail Section */}
              {menuSelection === 'data' && selectedPokemon && (
                <div className="mt-6 border-4 border-red-600 p-4 bg-white">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-red-800">{formatPokemonName(selectedPokemon.name).toUpperCase()}</h3>
                    <p className="text-sm text-red-600">POKéMON</p>
                  </div>
                  
                  <div className="flex">
                    {/* Pokémon Image */}
                    <div className="w-1/2 flex justify-center">
                      <img
                        src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default || ''}
                        alt={selectedPokemon.name}
                        className="w-32 h-32 object-contain image-render-pixel"
                      />
                    </div>
                    
                    {/* Stats */}
                    <div className="w-1/2 text-sm space-y-2">
                      <div className="font-bold">No.{String(selectedPokemon.id).padStart(3, '0')}</div>
                      <div>HT {(selectedPokemon.height / 10).toFixed(1)}m</div>
                      <div>WT {(selectedPokemon.weight / 10).toFixed(1)}kg</div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mt-4 border-t-2 border-red-600 pt-2">
                    <p className="text-xs leading-relaxed text-black">
                      {getPokemonDescription(selectedPokemon)}
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Radar Chart */}
              {menuSelection === 'data' && selectedPokemon && (
                <div className="mt-6 border-4 border-red-600 p-4 bg-white">
                  <h3 className="text-lg font-bold text-red-800 mb-4 text-center">STATS</h3>
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
                      color: '#FF0000'
                    }]}
                    size={250}
                    className="mx-auto"
                  />
                </div>
              )}

              {/* Comparison Panel */}
              {showComparison && (
                <div className="mt-6 border-4 border-red-600 p-4 bg-white">
                  <h3 className="text-lg font-bold text-red-800 mb-4 text-center">COMPARE POKéMON</h3>
                  <PokemonComparison pokemonList={pokemonList} />
                </div>
              )}

              {menuSelection === 'cry' && (
                <div className="mt-6 border-2 border-black p-4 text-center">
                  <p className="text-sm">CRY - Audio feature</p>
                  <p className="text-xs text-gray-600 mt-2">(Would play Pokémon cry in real game)</p>
                </div>
              )}

              {menuSelection === 'area' && (
                <div className="mt-6 border-2 border-black p-4">
                  <h4 className="font-bold mb-2">AREA</h4>
                  <p className="text-sm">This Pokémon can be found in various locations throughout the region.</p>
                </div>
              )}

              {menuSelection === 'quit' && (
                <div className="mt-6 border-2 border-black p-4 text-center">
                  <p className="text-sm">Return to main menu</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p>Select a Pokémon from the list</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar (Authentic Style) */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white border-4 border-red-600 p-2">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim()) {
                setSearchLoading(true);
                searchPokemonByName(e.target.value).then(results => {
                  setFilteredPokemon(results);
                  setSearchLoading(false);
                });
              } else {
                setFilteredPokemon(pokemonList);
              }
            }}
            className="w-full bg-transparent outline-none font-gameboy text-sm"
          />
          {searchLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
