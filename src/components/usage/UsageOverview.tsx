'use client';

import { UsageFilters } from '@/types/usage';

interface UsageOverviewProps {
  filters: UsageFilters;
}

export default function UsageOverview({ filters }: UsageOverviewProps) {
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Usage Meta Overview
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Comprehensive competitive usage statistics
      </p>
    </div>
  );
}
