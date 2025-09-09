"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Pokemon, FilterState } from '@/types/pokemon';
import { formatPokemonName, getPokemonDescription } from '@/lib/utils';
import { searchPokemonByName, getPokemon } from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import PokemonComparison from './PokemonComparison';
import RadarChart from './RadarChart';
import VirtualizedPokemonList from './VirtualizedPokemonList';
import UserProfile from './auth/UserProfile';

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
  filters: _filters,
  setFilters: _setFilters
}: RubyPokedexLayoutProps) {
  const router = useRouter()
  const [menuSelection, setMenuSelection] = useState<'page' | 'area' | 'cry' | 'size'>('page');
  const [currentPage, setCurrentPage] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>(pokemonList);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [detailsCache, setDetailsCache] = useState<Map<number, Pokemon>>(new Map());
  const fetchingRef = useRef<Set<number>>(new Set());

  // Ensure we have full stats when sorting by a specific stat
  useEffect(() => {
    const statKeys = new Set(['hp','attack','defense','special-attack','special-defense','speed']);
    if (!statKeys.has(sortBy)) return;
    const missing = filteredPokemon
      .filter(p => (p.stats?.length || 0) === 0 && !detailsCache.has(p.id))
      .map(p => p.id)
      .filter(id => !fetchingRef.current.has(id));
    if (missing.length === 0) return;
    missing.forEach(id => fetchingRef.current.add(id));
    Promise.all(missing.map(id => getPokemon(id).catch(() => null)))
      .then(results => {
        setDetailsCache(prev => {
          const next = new Map(prev);
          results.forEach(p => { if (p) next.set(p.id, p); });
          return next;
        });
      })
      .finally(() => {
        missing.forEach(id => fetchingRef.current.delete(id));
      });
  }, [sortBy, filteredPokemon, detailsCache]);

  const menuOptions = [
    { id: 'page', label: 'PAGE' },
    { id: 'area', label: 'AREA' },
    { id: 'cry', label: 'CRY' },
    { id: 'size', label: 'SIZE' }
  ] as const;

  return (
    <div className="min-h-screen pokemon-ruby-bg font-gba text-white">
      {/* Theme Toggle - Hidden on mobile */}
      <div className="hidden md:block absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Top Menu Bar */}
      <div className="bg-surface border-b-4 border-border p-3 flex flex-wrap items-center justify-between gap-2 relative">
        <div className="flex flex-wrap gap-2 items-center">
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

          {/* Sort controls - Hidden on mobile */}
          <div className="hidden md:flex ml-4 items-center gap-2">
            <span className="text-xs font-bold tracking-wider">SORT</span>
            <select
              value={sortBy}
              onChange={(e)=>setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 bg-surface border-2 border-border text-white text-sm font-bold control-keep"
            >
              <option value="id">Number</option>
              <option value="name">Name</option>
              <option value="stats">Total</option>
              <option value="hp">HP</option>
              <option value="attack">Attack</option>
              <option value="defense">Defense</option>
              <option value="special-attack">Sp. Atk</option>
              <option value="special-defense">Sp. Def</option>
              <option value="speed">Speed</option>
            </select>
            <button
              onClick={()=>setSortOrder(prev=>prev==='asc'?'desc':'asc')}
              title={`Sort ${sortOrder==='asc'?'Descending':'Ascending'}`}
              className="px-2 py-1 border-2 border-border text-white text-sm font-bold bg-surface hover:bg-ruby-tab/20 flex items-center gap-2 control-keep"
            >
              <span>{sortOrder==='asc'?'ASC':'DESC'}</span>
              <span className="inline-block transform" style={{ transform: sortOrder==='asc'?'rotate(0deg)':'rotate(180deg)' }}>▲</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <UserProfile />
          <button 
            onClick={() => router.push('/team')}
            className="px-4 py-2 border-2 border-border text-white text-sm font-bold transition-colors bg-surface hover:bg-ruby-tab/20"
            title="Go to Team Builder"
          >
            🎮 TEAM
          </button>
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
        <div className="absolute top-2 right-2">
          <button onClick={() => setShowDesktopMenu(true)} className="md:hidden px-3 py-1 bg-white text-black border-2 border-border rounded font-bold">MENU</button>
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
                  <Image
                    src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default || ''}
                    alt={selectedPokemon.name}
                    width={256}
                    height={256}
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
            key={`${sortBy}-${sortOrder}`}
            pokemonList={useMemo(() => {
              const data = [...filteredPokemon];
              const cmp = (a: Pokemon, b: Pokemon) => {
                let comparison = 0;
                if (sortBy === 'name') {
                  comparison = a.name.localeCompare(b.name);
                } else if (sortBy === 'stats') {
                  const aSrc = (a.stats?.length ? a : (detailsCache.get(a.id) || a));
                  const bSrc = (b.stats?.length ? b : (detailsCache.get(b.id) || b));
                  const aStats = (aSrc.stats || []).reduce((sum, s) => sum + s.base_stat, 0);
                  const bStats = (bSrc.stats || []).reduce((sum, s) => sum + s.base_stat, 0);
                  comparison = aStats - bStats;
                } else if (sortBy === 'hp' || sortBy === 'attack' || sortBy === 'defense' || sortBy === 'special-attack' || sortBy === 'special-defense' || sortBy === 'speed') {
                  const aSrc = (a.stats?.length ? a : (detailsCache.get(a.id) || a));
                  const bSrc = (b.stats?.length ? b : (detailsCache.get(b.id) || b));
                  const aVal = (aSrc.stats || []).find(s => s.stat.name === sortBy)?.base_stat || 0;
                  const bVal = (bSrc.stats || []).find(s => s.stat.name === sortBy)?.base_stat || 0;
                  comparison = aVal - bVal;
                } else {
                  comparison = a.id - b.id;
                }
                return sortOrder === 'desc' ? -comparison : comparison;
              };
              return data.sort(cmp);
            }, [filteredPokemon, sortBy, sortOrder, detailsCache])}
            onSelectPokemon={onSelectPokemon}
            selectedPokemon={selectedPokemon}
            containerHeight={300}
            itemHeight={50}
            className="font-gba"
          />
        </div>
      </div>

      {/* Desktop Drawer (Retro) */}
      {typeof window !== 'undefined' && showDesktopMenu && createPortal(
        <div id="desktop-drawer" className="fixed inset-0" style={{ zIndex: 2147483000 }}>
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2147483000 }} onClick={() => setShowDesktopMenu(false)} />
          <aside className="fixed right-0 top-0 h-full w-[320px] overflow-y-auto bg-white border-l-4 border-border p-4 space-y-4" style={{ zIndex: 2147483001 }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">MENU</h3>
              <button onClick={() => setShowDesktopMenu(false)} className="px-2 py-1 border-2 border-border text-black rounded">CLOSE</button>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Search</label>
              <input type="text" className="w-full border-2 border-border p-2 text-black" placeholder="Search..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
            </div>
            <div>
              <button onClick={()=>window.location.href='/compare'} className="w-full px-3 py-2 bg-black text-white font-bold">GO TO COMPARISON</button>
            </div>
          </aside>
        </div>, document.body)
      }

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
