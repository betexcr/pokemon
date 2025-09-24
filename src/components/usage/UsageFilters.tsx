'use client';

import { useState, useEffect } from 'react';
import { UsageFilters, Platform, Generation, Format } from '@/types/usage';
import { ChevronDown, X } from 'lucide-react';

interface UsageFiltersProps {
  filters: UsageFilters;
  onFiltersChange: (filters: UsageFilters) => void;
}

const PLATFORM_OPTIONS: { value: Platform; label: string; description: string }[] = [
  { value: 'SMOGON_SINGLES', label: 'Smogon Singles', description: 'Pokémon Showdown competitive singles' },
  { value: 'VGC_OFFICIAL', label: 'VGC Official', description: 'Video Game Championships doubles' },
  { value: 'BSS_OFFICIAL', label: 'BSS Official', description: 'Battle Stadium Singles cartridge' }
];

const GENERATION_OPTIONS: { value: Generation; label: string; description: string }[] = [
  { value: 'GEN5', label: 'Gen V', description: 'Black/White era' },
  { value: 'GEN6', label: 'Gen VI', description: 'X/Y era' },
  { value: 'GEN7', label: 'Gen VII', description: 'Sun/Moon era' },
  { value: 'GEN8', label: 'Gen VIII', description: 'Sword/Shield era' },
  { value: 'GEN9', label: 'Gen IX', description: 'Scarlet/Violet era' }
];

// Generate format options dynamically based on platform and generation
const getFormatOptions = (platform: Platform, generation: Generation): { value: Format; label: string }[] => {
  const formatMap: Record<Platform, Record<Generation, { value: Format; label: string }[]>> = {
    'SMOGON_SINGLES': {
      'GEN5': [
        { value: 'OU', label: 'OverUsed' },
        { value: 'UU', label: 'UnderUsed' },
        { value: 'RU', label: 'RarelyUsed' },
        { value: 'NU', label: 'NeverUsed' },
        { value: 'UBERS', label: 'Ubers' },
        { value: 'PU', label: 'PU' }
      ],
      'GEN6': [
        { value: 'OU', label: 'OverUsed' },
        { value: 'UU', label: 'UnderUsed' },
        { value: 'RU', label: 'RarelyUsed' },
        { value: 'NU', label: 'NeverUsed' },
        { value: 'UBERS', label: 'Ubers' },
        { value: 'PU', label: 'PU' }
      ],
      'GEN7': [
        { value: 'OU', label: 'OverUsed' },
        { value: 'UU', label: 'UnderUsed' },
        { value: 'RU', label: 'RarelyUsed' },
        { value: 'NU', label: 'NeverUsed' },
        { value: 'UBERS', label: 'Ubers' },
        { value: 'PU', label: 'PU' }
      ],
      'GEN8': [
        { value: 'OU', label: 'OverUsed' },
        { value: 'UU', label: 'UnderUsed' },
        { value: 'RU', label: 'RarelyUsed' },
        { value: 'NU', label: 'NeverUsed' },
        { value: 'UBERS', label: 'Ubers' },
        { value: 'PU', label: 'PU' },
        { value: 'MONOTYPE', label: 'Monotype' }
      ],
      'GEN9': [
        { value: 'OU', label: 'OverUsed' },
        { value: 'UU', label: 'UnderUsed' },
        { value: 'RU', label: 'RarelyUsed' },
        { value: 'NU', label: 'NeverUsed' },
        { value: 'UBERS', label: 'Ubers' },
        { value: 'PU', label: 'PU' },
        { value: 'MONOTYPE', label: 'Monotype' }
      ]
    },
    'VGC_OFFICIAL': {
      'GEN5': [
        { value: 'VGC_REG_A', label: 'VGC Regulation A' }
      ],
      'GEN6': [
        { value: 'VGC_REG_A', label: 'VGC Regulation A' }
      ],
      'GEN7': [
        { value: 'VGC_REG_A', label: 'VGC Regulation A' }
      ],
      'GEN8': [
        { value: 'VGC_REG_A', label: 'VGC Regulation A' },
        { value: 'VGC_REG_B', label: 'VGC Regulation B' },
        { value: 'VGC_REG_C', label: 'VGC Regulation C' },
        { value: 'VGC_REG_D', label: 'VGC Regulation D' }
      ],
      'GEN9': [
        { value: 'VGC_REG_A', label: 'VGC Regulation A' },
        { value: 'VGC_REG_B', label: 'VGC Regulation B' },
        { value: 'VGC_REG_C', label: 'VGC Regulation C' },
        { value: 'VGC_REG_D', label: 'VGC Regulation D' },
        { value: 'VGC_REG_E', label: 'VGC Regulation E' },
        { value: 'VGC_REG_F', label: 'VGC Regulation F' },
        { value: 'VGC_REG_G', label: 'VGC Regulation G' },
        { value: 'VGC_REG_H', label: 'VGC Regulation H' },
        { value: 'VGC_REG_I', label: 'VGC Regulation I' }
      ]
    },
    'BSS_OFFICIAL': {
      'GEN5': [
        { value: 'BSS_SERIES_8', label: 'BSS Series 8' }
      ],
      'GEN6': [
        { value: 'BSS_SERIES_8', label: 'BSS Series 8' }
      ],
      'GEN7': [
        { value: 'BSS_SERIES_8', label: 'BSS Series 8' }
      ],
      'GEN8': [
        { value: 'BSS_SERIES_8', label: 'BSS Series 8' },
        { value: 'BSS_SERIES_9', label: 'BSS Series 9' }
      ],
      'GEN9': [
        { value: 'BSS_SERIES_12', label: 'BSS Series 12' },
        { value: 'BSS_SERIES_13', label: 'BSS Series 13' },
        { value: 'BSS_REG_C', label: 'BSS Regulation C' },
        { value: 'BSS_REG_D', label: 'BSS Regulation D' },
        { value: 'BSS_REG_E', label: 'BSS Regulation E' },
        { value: 'BSS_REG_I', label: 'BSS Regulation I' }
      ]
    },
    'OTHER': {
      'GEN5': [],
      'GEN6': [],
      'GEN7': [],
      'GEN8': [],
      'GEN9': []
    }
  };

  return formatMap[platform]?.[generation] || [];
};

// Generate month options (last 24 months)
const MONTH_OPTIONS = (() => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    months.push({ value: monthStr, label });
  }
  return months;
})();

export default function UsageFiltersComponent({ 
  filters, 
  onFiltersChange 
}: UsageFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availability, setAvailability] = useState<{ availability: Record<string, any>; formats: string[] } | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  useEffect(() => {
    const platform = filters.platforms[0];
    if (!platform) return;
    let cancelled = false;
    async function loadAvailability() {
      setLoadingAvail(true);
      try {
        // Query all-gen availability for the platform so we can filter gens too
        const params = new URLSearchParams({ platform });
        const res = await fetch(`/api/usage/availability?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAvailability({ availability: data.availability || {}, formats: data.formats || [] });
        // Determine first valid gen/format/month across availability
        const gensOrder: Generation[] = ['GEN9','GEN8','GEN7','GEN6','GEN5'];
        const findFirstValid = () => {
          for (const gen of gensOrder) {
            for (const fmt of (data.formats || [])) {
              const months = data.availability?.[fmt]?.[gen] || [];
              if (months.length > 0) return { gen, fmt, month: months[0] };
            }
          }
          return null;
        };
        const currentGen = filters.generations[0];
        const currentFmt = filters.formats[0];
        const monthsForCurrent = data.availability?.[currentFmt]?.[currentGen] || [];
        if (!monthsForCurrent.length) {
          const picked = findFirstValid();
          if (picked) {
            onFiltersChange({ ...filters, generations: [picked.gen], formats: [picked.fmt as any], month: picked.month });
          }
        } else if (!monthsForCurrent.includes(filters.month)) {
          onFiltersChange({ ...filters, month: monthsForCurrent[0] });
        }
      } catch (e) {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setLoadingAvail(false);
      }
    }
    loadAvailability();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.platforms]);

  // Ensure selected format and month remain valid when generation/format changes
  useEffect(() => {
    if (!availability?.availability) return;
    const gen = filters.generations[0];
    if (!gen) return;
    const currentFmt = filters.formats[0];
    const allFormats: Format[] = (availability.formats || []) as any;
    const validFormats = allFormats.filter((f: any) => {
      const months = availability.availability?.[f]?.[gen] || [];
      return months.length > 0;
    });
    let nextFmt = currentFmt as any;
    if (!validFormats.includes(nextFmt)) {
      nextFmt = validFormats[0];
    }
    const months = (availability.availability?.[nextFmt]?.[gen] || []) as string[];
    let nextMonth = filters.month;
    if (!months.includes(nextMonth)) {
      nextMonth = months[0] || '';
    }
    if (nextFmt !== currentFmt || nextMonth !== filters.month) {
      onFiltersChange({ ...filters, formats: nextFmt ? [nextFmt] : [], month: nextMonth });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.generations, filters.formats, availability]);

  // Get available formats based on selected platform and generation
  const availableFormats = (() => {
    if (filters.platforms.length === 0 || filters.generations.length === 0) {
      return [];
    }
    // Since we now use single-select, check the first (and only) selected platform/generation
    const base = getFormatOptions(filters.platforms[0], filters.generations[0]);
    // If availability loaded, filter to formats that have any months available for current gen
    if (availability?.availability) {
      const gen = filters.generations[0];
      return base.filter(f => ((availability.availability[f.value]?.[gen] || []).length || 0) > 0);
    }
    return base;
  })();

  const updateFilters = (updates: Partial<UsageFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      platforms: ['SMOGON_SINGLES'], // Default to Smogon Singles
      generations: ['GEN9'], // Default to Gen 9
      formats: ['OU'], // Default to OU format
      month: '', // Leave empty to auto-select first available month via availability
      top50Only: false,
      sortBy: 'rank',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = 
    filters.platforms.length > 0 ||
    filters.generations.length > 0 ||
    filters.formats.length > 0 ||
    filters.month ||
    filters.top50Only;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Platform
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map(platform => (
              <button
                key={platform.value}
                onClick={() => {
                  // Single select: only allow one platform at a time
                  const newPlatforms = filters.platforms.includes(platform.value) 
                    ? [] // Deselect if already selected
                    : [platform.value]; // Select only this platform
                  updateFilters({ platforms: newPlatforms });
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.platforms.includes(platform.value)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generation
          </label>
          <div className="flex flex-wrap gap-2">
            {GENERATION_OPTIONS.filter(generation => {
              if (!availability?.availability) return true;
              // Keep gens that have at least one format with months
              return (availability.formats || []).some((fmt: string) => {
                const months = availability.availability?.[fmt]?.[generation.value] || [];
                return months.length > 0;
              });
            }).map(generation => (
              <button
                key={generation.value}
                onClick={() => {
                  // Single select: only allow one generation at a time
                  const newGenerations = filters.generations.includes(generation.value)
                    ? [] // Deselect if already selected
                    : [generation.value]; // Select only this generation
                  updateFilters({ generations: newGenerations });
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.generations.includes(generation.value)
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {generation.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formats */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format ({availableFormats.length} available)
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableFormats.map(format => (
              <button
                key={format.value}
                onClick={() => {
                  // Single select: only allow one format at a time
                  const newFormats = filters.formats.includes(format.value)
                    ? [] // Deselect if already selected
                    : [format.value]; // Select only this format
                  updateFilters({ formats: newFormats });
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.formats.includes(format.value)
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => updateFilters({ month: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {MONTH_OPTIONS.filter(m => {
              const fmt = filters.formats[0];
              const gen = filters.generations[0];
              if (!availability?.availability || !fmt || !gen) return true;
              const allowed = availability.availability[fmt]?.[gen] || [];
              return allowed.includes(m.value);
            }).map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.top50Only}
              onChange={(e) => updateFilters({ top50Only: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Only Top 50 Pokémon
            </span>
          </label>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="rank">Rank</option>
            <option value="usage">Usage %</option>
            <option value="name">Name</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
}
