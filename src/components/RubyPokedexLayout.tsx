"use client";

import { useState } from 'react';
import { Pokemon, FilterState } from '@/types/pokemon';
import { formatPokemonName, getPokemonDescription } from '@/lib/utils';
import { searchPokemonByName } from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import PokemonComparison from './PokemonComparison';
import RadarChart from './RadarChart';
import VirtualizedPokemonList from './VirtualizedPokemonList';

interface RubyPokedexLayoutProps {
  pokemonList: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelectPokemon: (pokemon: Pokemon) => void;
  onToggleComparison: (id: number) => void;
  comparisonList: number[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function RubyPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  onToggleComparison,
  comparisonList,
  filters,
  setFilters
}: RubyPokedexLayoutProps) {
  const [menuSelection, setMenuSelection] = useState<'page' | 'area' | 'cry' | 'size'>('page');
  const [currentPage, setCurrentPage] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>(pokemonList);

  const menuOptions = [
    { id: 'page', label: 'PAGE' },
    { id: 'area', label: 'AREA' },
    { id: 'cry', label: 'CRY' },
    { id: 'size', label: 'SIZE' }
  ] as const;

  return (
    <div className="min-h-screen pokemon-ruby-bg font-gba text-white">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Top Menu Bar */}
      <div className="bg-surface border-b-4 border-border p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              className={`px-4 py-2 border-2 border-border text-white text-sm font-bold transition-colors ${
                menuSelection === option.id 
                  ? 'bg-ruby-tab text-white shadow-lg' 
                  : 'bg-surface hover:bg-ruby-tab/20'
              }`}
              onClick={() => setMenuSelection(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 border-2 border-border text-white text-sm font-bold transition-colors ${
              showComparison 
                ? 'bg-ruby-tab text-white shadow-lg' 
                : 'bg-surface hover:bg-ruby-tab/20'
            }`}
          >
            COMPARE
          </button>
          <button className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-border">
            B
          </button>
          <span className="text-white text-sm font-bold">CANCEL</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Central Information Panel */}
        <div className="bg-ruby-panel border-4 border-border p-6 rounded-lg shadow-lg">
          {selectedPokemon ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side - Pokémon Sprite */}
              <div className="flex justify-center lg:w-1/2">
                <div className="relative">
                  <img
                    src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default || ''}
                    alt={selectedPokemon.name}
                    className="w-48 h-48 lg:w-64 lg:h-64 object-contain image-render-pixel"
                  />
                  {/* Favorite Button */}
                  <button
                    onClick={() => onToggleComparison(selectedPokemon.id)}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-border flex items-center justify-center transition-colors ${
                      comparisonList.includes(selectedPokemon.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {comparisonList.includes(selectedPokemon.id) ? '❤️' : '♡'}
                  </button>
                </div>
              </div>
              
              {/* Right Side - Pokémon Info */}
              <div className="lg:w-1/2 text-ruby-text space-y-4">
                <div className="text-2xl lg:text-3xl font-bold border-b-2 border-border pb-2">
                  No{String(selectedPokemon.id).padStart(3, '0')} {formatPokemonName(selectedPokemon.name).toUpperCase()}
                </div>
                <div className="text-lg font-semibold">
                  {selectedPokemon.types.map(type => formatPokemonName(type.type.name)).join('/')} POKéMON
                </div>
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div className="bg-white/20 p-3 rounded border border-border">
                    <div className="font-bold">HT</div>
                    <div>{(selectedPokemon.height / 10).toFixed(1)}m</div>
                  </div>
                  <div className="bg-white/20 p-3 rounded border border-border">
                    <div className="font-bold">WT</div>
                    <div>{(selectedPokemon.weight / 10).toFixed(1)}kg</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedPokemon.types.map((type) => (
                    <span
                      key={type.type.name}
                      className="px-3 py-1 rounded-full text-sm font-bold border-2 border-border"
                      style={{ backgroundColor: `var(--type-${type.type.name})` }}
                    >
                      {formatPokemonName(type.type.name).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-ruby-text py-12">
              <div className="text-4xl mb-4">★</div>
              <p className="text-xl font-bold">Select a Pokémon from the list</p>
            </div>
          )}
        </div>

        {/* Lower Text Description Panel */}
        <div className="bg-ruby-panel border-4 border-border p-6 rounded-lg shadow-lg relative">
          {/* Page Tab */}
          <div className="absolute -left-2 top-0 bg-ruby-tab text-white px-4 py-2 text-sm font-bold border-2 border-border rounded-b-lg">
            PAGE {currentPage}
          </div>
          
          <div className="text-ruby-text text-base leading-relaxed mt-6">
            {selectedPokemon ? (
              <div>
                <p className="text-lg">{getPokemonDescription(selectedPokemon)}</p>
              </div>
            ) : (
              <p className="text-lg text-center">Select a Pokémon to view its description.</p>
            )}
          </div>
          
          {/* Background Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="text-8xl text-gray-400">★</div>
          </div>
        </div>

        {/* Stats Radar Chart */}
        {selectedPokemon && menuSelection === 'page' && (
          <div className="bg-ruby-panel border-4 border-border p-6 rounded-lg shadow-lg">
            <div className="text-ruby-text text-xl font-bold mb-6 text-center border-b-2 border-border pb-2">
              STATS ANALYSIS
            </div>
            <div className="flex justify-center">
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
                  color: '#FF69B4'
                }]}
                                 size={300}
                className="mx-auto"
              />
            </div>
          </div>
        )}

        {/* Comparison Panel */}
        {showComparison && (
          <div className="bg-ruby-panel border-4 border-border p-6 rounded-lg shadow-lg">
            <div className="text-ruby-text text-xl font-bold mb-6 text-center border-b-2 border-border pb-2">
              COMPARE POKéMON
            </div>
            <PokemonComparison pokemonList={pokemonList} />
          </div>
        )}

        {/* Pokémon List */}
        <div className="bg-surface border-4 border-border p-4 rounded-lg shadow-lg">
          <div className="text-white text-lg font-bold mb-4 text-center">
            POKéMON LIST ({filteredPokemon.length})
          </div>
          <VirtualizedPokemonList
            pokemonList={filteredPokemon}
            onSelectPokemon={onSelectPokemon}
            selectedPokemon={selectedPokemon}
            containerHeight={300}
            itemHeight={50}
            className="font-gba"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
        <div className="bg-ruby-panel border-4 border-border p-3 rounded-lg shadow-lg">
          <div className="relative">
            <input
              type="text"
                              placeholder="Search Pokémon by name or #..."
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
              className="w-full bg-transparent outline-none font-gba text-lg text-ruby-text placeholder-ruby-text/60 pr-10"
            />
            {searchLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ruby-tab"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
