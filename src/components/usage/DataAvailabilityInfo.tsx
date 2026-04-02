'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info, Calendar, Database, AlertCircle } from 'lucide-react';

interface DataAvailabilityInfoProps {
  platform: string;
  generation: string;
  format: string;
}

export default function DataAvailabilityInfo({ platform, generation, format }: DataAvailabilityInfoProps) {
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const params = new URLSearchParams({ platform });
        const res = await fetch(`/api/usage/availability?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const formats: string[] = data.formats || [];
        const monthsForSelection: string[] = data.availability?.[format]?.[generation] || [];
        setAvailableFormats(formats);
        setAvailableMonths(monthsForSelection);
      } catch {
        if (!cancelled) {
          setAvailableFormats([]);
          setAvailableMonths([]);
        }
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [platform, generation, format]);

  const title = useMemo(() => {
    if (platform === 'SMOGON_SINGLES') return 'Smogon Singles Data';
    if (platform === 'VGC_OFFICIAL') return 'VGC Official Data';
    if (platform === 'BSS_OFFICIAL') return 'Battle Stadium Singles Data';
    return 'Usage Data';
  }, [platform]);

  const description = useMemo(() => {
    if (platform === 'SMOGON_SINGLES') return 'Smogon usage statistics for selected generation and tier.';
    if (platform === 'VGC_OFFICIAL') return 'VGC usage data availability for selected regulations.';
    if (platform === 'BSS_OFFICIAL') return 'Battle Stadium Singles usage data for selected regulations.';
    return 'Availability based on the selected usage source.';
  }, [platform]);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {title}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            {description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Available Months
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableMonths.slice(0, 8).map(month => (
                  <span 
                    key={month}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
                  >
                    {month}
                  </span>
                ))}
                {availableMonths.length > 8 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                    +{availableMonths.length - 8} more
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Available Formats
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableFormats.map(format => (
                  <span 
                    key={format}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Availability reflects data currently reachable by the selected platform, generation, and format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
