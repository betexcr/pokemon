'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UsageFilters, UsagePhaseState, UsagePhase, UsageRow } from '@/types/usage';

interface UsageDeepDivePhaseProps {
  filters: UsageFilters;
  phaseState: UsagePhaseState;
  onPhaseChange: (phase: UsagePhase) => void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

interface UsageDeepDiveData {
  data?: UsageRow[];  // Real data structure
  rows?: UsageRow[];  // Mock data structure
  total?: number;
  metadata: {
    platforms?: string[];
    generations?: string[];
    formats?: string[];
    months?: string[];
    sampleSize?: number;
    source?: string;
    lastUpdated?: string;
  };
}

export default function UsageDeepDivePhase({ 
  filters, 
  phaseState, 
  onPhaseChange 
}: UsageDeepDivePhaseProps) {
  const [data, setData] = useState<UsageDeepDiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPokemon, setSelectedPokemon] = useState<UsageRow | null>(null);

  useEffect(() => {
    fetchDeepDiveData();
  }, [filters]);

  useEffect(() => {
    // Set selected pokemon when data loads
    if (data) {
      const rows = data.data || data.rows || [];
      if (rows.length > 0 && !selectedPokemon) {
        setSelectedPokemon(rows[0]);
      }
    }
  }, [data, selectedPokemon]);

  const fetchDeepDiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.platforms.length > 0) {
        params.set('platform', filters.platforms[0]); // Single-select
      }
      if (filters.generations.length > 0) {
        params.set('generation', filters.generations[0]); // Single-select
      }
      if (filters.formats.length > 0) {
        params.set('format', filters.formats[0]); // Single-select
      }
      if (filters.month) {
        params.set('month', filters.month);
      }
      if (filters.top50Only) {
        params.set('top50Only', 'true');
      }
      
      const response = await fetch(`/api/usage/monthly?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatSubstatsData = (substats: any, type: string) => {
    if (!substats || !substats[type]) return [];
    return substats[type].map((item: any) => ({
      name: item.name,
      percentage: item.pct
    }));
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="text-red-600 dark:text-red-400 mb-2">No Data Available</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</div>
          <button
            onClick={fetchDeepDiveData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle both real data (data.data) and mock data (data.rows) structures
  const rows = data?.data || data?.rows || [];
  
  if (!data || rows.length === 0 || !selectedPokemon) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="text-gray-600 dark:text-gray-400 mb-2">No data found</div>
          <div className="text-gray-500 dark:text-gray-500 text-sm">
            Try adjusting your filters or selecting a different time period
          </div>
        </div>
      </div>
    );
  }

  const movesData = formatSubstatsData(selectedPokemon.substats, 'moves');
  const itemsData = formatSubstatsData(selectedPokemon.substats, 'items');
  const abilitiesData = formatSubstatsData(selectedPokemon.substats, 'abilities');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Deep Dive Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed move sets, items, abilities, and strategies
        </p>
      </div>

      {/* Pokemon Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Pokémon for Analysis:
        </label>
        <select
          value={selectedPokemon.pokemonId}
          onChange={(e) => {
            const pokemon = rows.find(p => p.pokemonId === Number(e.target.value));
            if (pokemon) setSelectedPokemon(pokemon);
          }}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {rows.map((pokemon, index) => (
            <option key={`${pokemon.pokemonId}-${pokemon.platform}-${pokemon.format}-${index}`} value={pokemon.pokemonId}>
              {pokemon.pokemonName} ({pokemon.platform} {pokemon.format})
            </option>
          ))}
        </select>
      </div>

      {/* Pokemon Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {selectedPokemon.pokemonId}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {selectedPokemon.pokemonName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              #{selectedPokemon.rank} in {selectedPokemon.platform} {selectedPokemon.format}
            </p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {selectedPokemon.usagePercent}% usage
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedPokemon.rank}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Rank</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedPokemon.usagePercent}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Usage Rate</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedPokemon.sampleSize?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sample Size</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedPokemon.month}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Data Month</div>
          </div>
        </div>
      </div>

      {/* Moves Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Most Popular Moves
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={movesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {movesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Items Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Item Usage Distribution
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {itemsData.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Abilities Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ability Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {abilitiesData.map((ability: any, index: number) => (
            <div key={ability.name} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  {ability.name}
                </h4>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {ability.percentage}%
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${ability.percentage}%` }}
                />
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                Primary ability used in competitive play
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🎯 Strategy Analysis
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• <strong>Primary Role:</strong> {selectedPokemon.pokemonName === 'Great Tusk' ? 'Physical Attacker & Hazard Control' : 
              selectedPokemon.pokemonName === 'Landorus-Therian' ? 'Defensive Pivot & Stealth Rock Setter' :
              selectedPokemon.pokemonName === 'Gholdengo' ? 'Special Attacker & Hazard Control' :
              'Fast Special Attacker & Pivot'}</li>
            <li>• <strong>Key Move:</strong> {movesData[0]?.name || 'N/A'} ({movesData[0]?.percentage}% usage)</li>
            <li>• <strong>Preferred Item:</strong> {itemsData[0]?.name || 'N/A'} ({itemsData[0]?.percentage}% usage)</li>
            <li>• <strong>Meta Position:</strong> {selectedPokemon.usagePercent >= 30 ? 'Tier 1 Threat' : 
              selectedPokemon.usagePercent >= 15 ? 'Tier 2 Threat' : 'Niche Pick'}</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
            📊 Usage Context
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
            <li>• <strong>Platform:</strong> {selectedPokemon.platform.replace('_', ' ')}</li>
            <li>• <strong>Format:</strong> {selectedPokemon.format}</li>
            <li>• <strong>Generation:</strong> {selectedPokemon.generation}</li>
            <li>• <strong>Sample Size:</strong> {selectedPokemon.sampleSize?.toLocaleString() || 'Unknown'} battles</li>
            <li>• <strong>Data Source:</strong> {selectedPokemon.source?.label || 'Unknown'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
