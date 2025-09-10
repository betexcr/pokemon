"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Pokemon, FilterState } from '@/types/pokemon';
import { formatPokemonName, getPokemonDescription } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import PokemonComparison from './PokemonComparison';
import RadarChart from './RadarChart';
import VirtualizedPokemonList from './VirtualizedPokemonList';
import UserProfile from './auth/UserProfile';

interface GoldPokedexLayoutProps {
  pokemonList: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelectPokemon: (pokemon: Pokemon) => void;
  onToggleComparison: (id: number) => void;
  comparisonList: number[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function GoldPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  // onToggleComparison,
  comparisonList,
  filters,
  setFilters
}: GoldPokedexLayoutProps) {
  const router = useRouter()
  const [showComparison, setShowComparison] = useState(false);
  const [filteredPokemon] = useState<Pokemon[]>(pokemonList);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  return (
    <div className="min-h-screen pokemon-gold-bg font-gbc text-white">
      {/* Theme Toggle - Hidden on mobile */}
      <div className="hidden md:block absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Authentic GBC PokéDex Header */}
      <div className="bg-yellow-200 border-b-4 border-yellow-600 p-2 relative">
        <h1 className="font-['Pocket_Monk'] text-xl font-bold text-center text-yellow-800 tracking-wider">POKéDEX</h1>
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <UserProfile />
          <button onClick={() => router.push('/team')} className="px-3 py-1 bg-white text-yellow-800 border-2 border-yellow-600 rounded font-bold" title="Go to Team Builder">🎮 TEAM</button>
          <button onClick={() => setShowDesktopMenu(true)} className="md:hidden px-3 py-1 bg-white text-yellow-800 border-2 border-yellow-600 rounded font-bold">MENU</button>
        </div>
      </div>

      {/* Main PokéDex Interface - Three Panel Design */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)]">
        {/* Left Panel - Stats and Background Graphic */}
        <div className="w-full md:w-1/4 bg-gradient-to-b from-yellow-800 to-yellow-900 p-4 relative">
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
              {comparisonList.length}
            </div>
          </div>
        </div>

        {/* Central Panel - Pokémon Sprites */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-yellow-800 to-yellow-900 p-4 flex flex-col justify-center">
          {selectedPokemon && (
            <div className="text-center">
              <Image
                src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default || ''}
                alt={selectedPokemon.name}
                width={128}
                height={128}
                className="w-32 h-32 object-contain image-render-pixel mx-auto mb-4"
              />
              <div className="text-white font-bold text-lg">
                {formatPokemonName(selectedPokemon.name).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Pokémon List */}
        <div className="w-full md:w-1/4 bg-yellow-200 border-l-0 md:border-l-4 border-t-4 md:border-t-0 border-yellow-600">
          <div className="h-full">
            {/* Sort Controls - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 p-2 border-b-4 border-yellow-600">
              <span className="text-yellow-800 text-xs font-bold">SORT</span>
              <select
                value={sortBy}
                onChange={(e)=>setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 bg-yellow-100 border-2 border-yellow-600 text-yellow-800 text-xs font-bold control-keep"
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
                className="px-2 py-1 border-2 border-yellow-600 bg-yellow-100 text-yellow-800 text-xs font-bold flex items-center gap-2 control-keep"
                title={`Sort ${sortOrder==='asc'?'Descending':'Ascending'}`}
              >
                <span>{sortOrder==='asc'?'ASC':'DESC'}</span>
                <span className="inline-block transform" style={{ transform: sortOrder==='asc'?'rotate(0deg)':'rotate(180deg)' }}>▲</span>
              </button>
            </div>
            <VirtualizedPokemonList
              key={`${sortBy}-${sortOrder}`}
              pokemonList={useMemo(()=>{
                const data=[...filteredPokemon];
                const cmp=(a:Pokemon,b:Pokemon)=>{
                  let c=0;
                  if(sortBy==='name'){c=a.name.localeCompare(b.name)}
                  else if(sortBy==='stats'){
                    const as=a.stats.reduce((s,t)=>s+t.base_stat,0);
                    const bs=b.stats.reduce((s,t)=>s+t.base_stat,0);
                    c=as-bs;
                  } else if(sortBy==='hp'||sortBy==='attack'||sortBy==='defense'||sortBy==='special-attack'||sortBy==='special-defense'||sortBy==='speed'){
                    const av=a.stats.find(s=>s.stat.name===sortBy)?.base_stat||0;
                    const bv=b.stats.find(s=>s.stat.name===sortBy)?.base_stat||0;
                    c=av-bv;
                  } else {c=a.id-b.id}
                  return sortOrder==='desc'?-c:c;
                };
                return data.sort(cmp);
              },[filteredPokemon,sortBy,sortOrder])}
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

      {/* Desktop Drawer (Retro) */}
      {typeof window !== 'undefined' && showDesktopMenu && createPortal(
        <div id="desktop-drawer" className="fixed inset-0" style={{ zIndex: 2147483000 }}>
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2147483000 }} onClick={() => setShowDesktopMenu(false)} />
          <aside className="fixed right-0 top-0 h-full w-[320px] overflow-y-auto bg-white border-l-4 border-yellow-600 p-4 space-y-4" style={{ zIndex: 2147483001 }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-yellow-800">MENU</h3>
              <button onClick={() => setShowDesktopMenu(false)} className="px-2 py-1 border-2 border-yellow-600 text-yellow-800 rounded">CLOSE</button>
            </div>
            <div>
              <label className="block text-sm font-bold text-yellow-800 mb-1">Search</label>
              <input type="text" className="w-full border-2 border-yellow-600 p-2" placeholder="Search..." style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }} />
            </div>
            <div>
              <button onClick={()=>window.location.href='/compare'} className="w-full px-3 py-2 bg-yellow-600 text-white font-bold">GO TO COMPARISON</button>
            </div>
          </aside>
        </div>, document.body)
      }

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
                              placeholder="Search Pokémon by name or #..."
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
