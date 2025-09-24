'use client';

import { useState, useMemo } from 'react';
import { UsageRow } from '@/types/usage';
import { ChevronUp, ChevronDown, Info, ExternalLink } from 'lucide-react';
import SourceTooltip from './SourceTooltip';
import LazyImage from '@/components/LazyImage';
import { getPokemonImageUrl, getPokemonFallbackImage } from '@/lib/api';

interface UsageTableProps {
  rows: UsageRow[];
  onRowClick?: (row: UsageRow) => void;
  sortable?: boolean;
  showSubstats?: boolean;
}

type SortField = 'rank' | 'usage' | 'name';
type SortOrder = 'asc' | 'desc';

export default function UsageTable({ 
  rows, 
  onRowClick, 
  sortable = true,
  showSubstats = false 
}: UsageTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const sortedRows = useMemo(() => {
    if (!sortable) return rows;

    return [...rows].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'usage':
          aValue = a.usagePercent;
          bValue = b.usagePercent;
          break;
        case 'name':
          aValue = a.pokemonName.toLowerCase();
          bValue = b.pokemonName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortOrder, sortable]);

  const handleSort = (field: SortField) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (!sortable || sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const formatUsage = (usage: number) => {
    return `${usage.toFixed(1)}%`;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 20) return 'text-red-600 dark:text-red-400 font-semibold';
    if (usage >= 10) return 'text-orange-600 dark:text-orange-400 font-medium';
    if (usage >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRankColor = (rank: number) => {
    if (rank <= 5) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    if (rank <= 10) return 'text-gray-600 dark:text-gray-400 font-semibold';
    return 'text-gray-500 dark:text-gray-500';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th 
              className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${
                sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              }`}
              onClick={() => handleSort('rank')}
            >
              <div className="flex items-center gap-2">
                Rank
                {getSortIcon('rank')}
              </div>
            </th>
            <th 
              className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${
                sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              }`}
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Pokémon
                {getSortIcon('name')}
              </div>
            </th>
            <th 
              className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${
                sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              }`}
              onClick={() => handleSort('usage')}
            >
              <div className="flex items-center gap-2">
                Usage
                {getSortIcon('usage')}
              </div>
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Platform
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Format
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Sample
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={`${row.platform}-${row.format}-${row.month}-${row.pokemonId}-${index}`}
              className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
              } ${
                hoveredRow === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="py-3 px-4">
                <span className={`${getRankColor(row.rank)}`}>
                  #{row.rank}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <LazyImage
                      srcList={[
                        getPokemonImageUrl(row.pokemonId, 'default', 'medium'),
                        getPokemonFallbackImage(row.pokemonId),
                        "/placeholder-pokemon.png"
                      ]}
                      alt={row.pokemonName}
                      width={40}
                      height={40}
                      imgClassName="w-10 h-10 object-contain"
                      rootMargin="50px"
                      threshold={0.01}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {row.pokemonName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      #{row.pokemonId}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={`${getUsageColor(row.usagePercent)}`}>
                    {formatUsage(row.usagePercent)}
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(row.usagePercent * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {row.platform.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {row.format}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {row.sampleSize ? row.sampleSize.toLocaleString() : '—'}
              </td>
              <td className="py-3 px-4">
                <SourceTooltip source={row.source}>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </SourceTooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedRows.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}
