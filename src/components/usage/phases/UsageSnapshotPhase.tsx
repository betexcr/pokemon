'use client';

import { useState, useEffect } from 'react';
import { UsageFilters, UsagePhaseState, UsagePhase } from '@/types/usage';
import UsageTable from '../UsageTable';
import UsagePodium from '../UsagePodium';
import DataAvailabilityInfo from '../DataAvailabilityInfo';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface UsageSnapshotPhaseProps {
  filters: UsageFilters;
  phaseState: UsagePhaseState;
  onPhaseChange: (phase: UsagePhase) => void;
}

interface UsageSnapshotData {
  data?: any[];  // Real data structure
  rows?: any[];  // Mock data structure
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

export default function UsageSnapshotPhase({ 
  filters, 
  phaseState, 
  onPhaseChange 
}: UsageSnapshotPhaseProps) {
  const [data, setData] = useState<UsageSnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when we have a concrete platform, generation, format, and month
    if (filters.platforms.length && filters.generations.length && filters.formats.length && filters.month) {
      fetchSnapshotData();
    } else {
      setData(null);
    }
  }, [filters]);

  const fetchSnapshotData = async () => {
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

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatChange = (change?: number) => {
    if (!change) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

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
            onClick={fetchSnapshotData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
        
        <DataAvailabilityInfo 
          platform={filters.platforms[0] || 'SMOGON_SINGLES'}
          generation={filters.generations[0] || 'GEN9'}
          format={filters.formats[0] || 'OU'}
        />
      </div>
    );
  }

  // Real data only
  const rows = data?.data || [];
  
  if (!data || rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="text-gray-600 dark:text-gray-400 mb-2">No data found</div>
          <div className="text-gray-500 dark:text-gray-500 text-sm">
            Try adjusting your filters or selecting a different time period
          </div>
        </div>
        
        <DataAvailabilityInfo 
          platform={filters.platforms[0] || 'SMOGON_SINGLES'}
          generation={filters.generations[0] || 'GEN9'}
          format={filters.formats[0] || 'OU'}
        />
      </div>
    );
  }

  const top3 = rows.slice(0, 3);
  const totalUsage = rows.reduce((sum, row) => sum + row.usagePercent, 0);
  const averageUsage = totalUsage / rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Meta Snapshot
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Current competitive landscape overview
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Info className="h-4 w-4" />
          <span>
            {rows.length} Pokémon • {filters.platforms.length > 0 ? filters.platforms[0].replace('_', ' ') : 'All Platforms'} • {filters.formats.length > 0 ? filters.formats[0] : 'All Formats'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {rows.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pokémon Tracked
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalUsage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Usage
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {averageUsage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Average Usage
          </div>
        </div>
      </div>

      {/* Podium */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Top Performers
        </h3>
        <UsagePodium top3={top3} />
      </div>

      {/* Usage Table */}
      <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Complete Rankings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Full usage statistics with trends and sample sizes
          </p>
        </div>
        <UsageTable
          rows={rows}
          onRowClick={(row) => {
            // Navigate to deep dive phase with selected Pokémon
            onPhaseChange('deepdive');
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onPhaseChange('trends')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          View Trends
        </button>
      </div>
    </div>
  );
}
