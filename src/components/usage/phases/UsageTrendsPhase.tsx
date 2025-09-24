'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UsageFilters, UsagePhaseState, UsagePhase, UsageRow } from '@/types/usage';

interface UsageTrendsPhaseProps {
  filters: UsageFilters;
  phaseState: UsagePhaseState;
  onPhaseChange: (phase: UsagePhase) => void;
}

interface TrendDataPoint {
  month: string;
  [pokemonName: string]: string | number;
}

interface HistoricalData {
  month: string;
  data: UsageRow[];
}

export default function UsageTrendsPhase({ 
  filters, 
  phaseState, 
  onPhaseChange 
}: UsageTrendsPhaseProps) {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [rankData, setRankData] = useState<TrendDataPoint[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<string>('Great Tusk');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePokemon, setAvailablePokemon] = useState<string[]>([]);

  // Generate list of recent months for trend analysis
  const getRecentMonths = (count: number = 6): string[] => {
    const months: string[] = [];
    const now = new Date();
    
    // Use a conservative approach - start from a known good month and go backwards
    // Since we know 2024-10 works, let's start from there
    const startYear = 2024;
    const startMonth = 10; // October 2024
    
    for (let i = 0; i < count; i++) {
      const date = new Date(startYear, startMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    
    return months.reverse(); // Reverse to get chronological order
  };

  // Fetch historical data for trends
  const fetchTrendsData = async () => {
    if (!filters.platforms[0] || !filters.generations[0] || !filters.formats[0]) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try the new trends API first
      try {
        const response = await fetch(
          `/api/usage/trends?platform=${filters.platforms[0]}&generation=${filters.generations[0]}&format=${filters.formats[0]}&months=6`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.historicalData && result.historicalData.length > 0) {
            const historicalData = result.historicalData;
            
            // Get top 6 Pokémon from the most recent month
            const latestData = historicalData[historicalData.length - 1];
            const topPokemon = latestData.data
              .slice(0, 6)
              .map((pokemon: any) => pokemon.name);
            
            setAvailablePokemon(topPokemon);
            if (topPokemon.length > 0 && !topPokemon.includes(selectedPokemon)) {
              setSelectedPokemon(topPokemon[0]);
            }

            // Transform data for charts
            const trendChartData: TrendDataPoint[] = historicalData.map((monthData: any) => {
              const dataPoint: TrendDataPoint = { month: monthData.month };
              
              topPokemon.forEach((pokemonName: string) => {
                const pokemonData = monthData.data.find((p: any) => p.name === pokemonName);
                dataPoint[pokemonName] = pokemonData ? pokemonData.usagePercent : 0;
              });
              
              return dataPoint;
            });

            const rankChartData: TrendDataPoint[] = historicalData.map((monthData: any) => {
              const dataPoint: TrendDataPoint = { month: monthData.month };
              
              topPokemon.forEach((pokemonName: string) => {
                const pokemonData = monthData.data.find((p: any) => p.name === pokemonName);
                dataPoint[pokemonName] = pokemonData ? pokemonData.rank : 0;
              });
              
              return dataPoint;
            });

            setTrendData(trendChartData);
            setRankData(rankChartData);
            setLoading(false);
            return;
          }
        }
      } catch (trendsApiErr) {
        console.warn('Trends API failed, falling back to monthly API:', trendsApiErr);
      }

      // Fallback to individual monthly API calls
      const months = getRecentMonths(6);
      const historicalData: HistoricalData[] = [];
      
      // Fetch data for each month
      for (const month of months) {
        try {
          const response = await fetch(
            `/api/usage/monthly?platform=${filters.platforms[0]}&generation=${filters.generations[0]}&format=${filters.formats[0]}&month=${month}`
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
              historicalData.push({
                month,
                data: result.data
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${month}:`, err);
        }
      }

      if (historicalData.length === 0) {
        setError('No historical data available for the selected filters');
        setLoading(false);
        return;
      }

      // Get top 6 Pokémon from the most recent month
      const latestData = historicalData[historicalData.length - 1];
      const topPokemon = latestData.data
        .slice(0, 6)
        .map((pokemon: any) => pokemon.name);
      
      setAvailablePokemon(topPokemon);
      if (topPokemon.length > 0 && !topPokemon.includes(selectedPokemon)) {
        setSelectedPokemon(topPokemon[0]);
      }

      // Transform data for charts
      const trendChartData: TrendDataPoint[] = historicalData.map(monthData => {
        const dataPoint: TrendDataPoint = { month: monthData.month };
        
        topPokemon.forEach((pokemonName: string) => {
          const pokemonData = monthData.data.find((p: any) => p.name === pokemonName);
          dataPoint[pokemonName] = pokemonData ? pokemonData.usagePercent : 0;
        });
        
        return dataPoint;
      });

      const rankChartData: TrendDataPoint[] = historicalData.map(monthData => {
        const dataPoint: TrendDataPoint = { month: monthData.month };
        
        topPokemon.forEach((pokemonName: string) => {
          const pokemonData = monthData.data.find((p: any) => p.name === pokemonName);
          dataPoint[pokemonName] = pokemonData ? pokemonData.rank : 0;
        });
        
        return dataPoint;
      });

      setTrendData(trendChartData);
      setRankData(rankChartData);
      
    } catch (err) {
      setError('Failed to fetch trends data');
      console.error('Trends data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendsData();
  }, [filters.platforms, filters.generations, filters.formats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const RankTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: #{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Usage Trends Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Loading historical data...
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Usage Trends Analysis
          </h2>
          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Usage Trends Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No historical data available for the selected filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Usage Trends Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track usage patterns and rank changes over time
        </p>
      </div>

      {/* Pokemon Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Pokémon to Focus:
        </label>
        <select
          value={selectedPokemon}
          onChange={(e) => setSelectedPokemon(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {availablePokemon.map(pokemon => (
            <option key={pokemon} value={pokemon}>{pokemon}</option>
          ))}
        </select>
      </div>

      {/* Usage Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Usage Percentage Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {availablePokemon.map((pokemon, index) => {
                const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
                return (
                  <Line 
                    key={pokemon}
                    type="monotone" 
                    dataKey={pokemon} 
                    stroke={colors[index % colors.length]} 
                    strokeWidth={3}
                    dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rank Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Rank Changes Over Time
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rankData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                reversed
                label={{ value: 'Rank', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<RankTooltip />} />
              <Legend />
              {availablePokemon.map((pokemon, index) => {
                const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
                return (
                  <Line 
                    key={pokemon}
                    type="monotone" 
                    dataKey={pokemon} 
                    stroke={colors[index % colors.length]} 
                    strokeWidth={3}
                    dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Latest Month Usage Comparison
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData.slice(-1)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {availablePokemon.map((pokemon, index) => {
                const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
                return (
                  <Bar key={pokemon} dataKey={pokemon} fill={colors[index % colors.length]} />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Insights */}
      {(() => {
        if (trendData.length < 2) return null;
        
        const latest = trendData[trendData.length - 1];
        const previous = trendData[trendData.length - 2];
        
        const trends = availablePokemon.map(pokemon => {
          const latestUsage = latest[pokemon] as number;
          const previousUsage = previous[pokemon] as number;
          const change = latestUsage - previousUsage;
          return { pokemon, change, latestUsage };
        }).sort((a, b) => b.change - a.change);
        
        const trendingUp = trends.filter(t => t.change > 0);
        const trendingDown = trends.filter(t => t.change < 0);
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingUp.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📈 Trending Up
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {trendingUp.slice(0, 2).map(trend => (
                    <li key={trend.pokemon}>
                      • {trend.pokemon}: +{trend.change.toFixed(1)}% this month
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {trendingDown.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  📉 Trending Down
                </h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  {trendingDown.slice(0, 2).map(trend => (
                    <li key={trend.pokemon}>
                      • {trend.pokemon}: {trend.change.toFixed(1)}% this month
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
