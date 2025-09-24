'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsageFilters, UsagePhase, UsagePhaseState } from '@/types/usage';
import UsageFiltersComponent from './UsageFilters';
import UsageSnapshotPhase from './phases/UsageSnapshotPhase';
import UsageTrendsPhase from './phases/UsageTrendsPhase';
import UsageDeepDivePhase from './phases/UsageDeepDivePhase';
import { useRouter, useSearchParams } from 'next/navigation';

interface UsagePhaseBookProps {
  initialFilters: UsageFilters;
  initialPhase: UsagePhase;
}

const PHASE_CONFIG = {
  snapshot: {
    title: 'Snapshot',
    description: 'Current meta overview with top performers',
    icon: '📊',
    component: UsageSnapshotPhase
  },
  trends: {
    title: 'Trends',
    description: 'Usage patterns and rank changes over time',
    icon: '📈',
    component: UsageTrendsPhase
  },
  deepdive: {
    title: 'Deep Dive',
    description: 'Detailed move sets, items, and strategies',
    icon: '🔍',
    component: UsageDeepDivePhase
  }
};

export default function UsagePhaseBook({ 
  initialFilters, 
  initialPhase 
}: UsagePhaseBookProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<UsageFilters>(initialFilters);
  const [phaseState, setPhaseState] = useState<UsagePhaseState>({
    current: initialPhase,
    history: [initialPhase],
    data: {}
  });

  // Update URL when filters or phase change
  useEffect(() => {
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
    if (phaseState.current !== 'snapshot') {
      params.set('phase', phaseState.current);
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [filters, phaseState.current, router]);

  const handlePhaseChange = (newPhase: UsagePhase) => {
    setPhaseState(prev => ({
      ...prev,
      current: newPhase,
      history: [...prev.history, newPhase].slice(-10) // Keep last 10 phases
    }));
  };

  const handleFiltersChange = (newFilters: UsageFilters) => {
    setFilters(newFilters);
    // Clear phase-specific data when filters change
    setPhaseState(prev => ({
      ...prev,
      data: {}
    }));
  };

  const currentPhaseConfig = PHASE_CONFIG[phaseState.current];
  const CurrentPhaseComponent = currentPhaseConfig.component;

  return (
    <div className="space-y-6">
      {/* Phase Navigation */}
      <div className="flex flex-wrap gap-2 p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-lg border">
        {Object.entries(PHASE_CONFIG).map(([phaseKey, config]) => (
          <motion.button
            key={phaseKey}
            onClick={() => handlePhaseChange(phaseKey as UsagePhase)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              phaseState.current === phaseKey
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg">{config.icon}</span>
            <div className="text-left">
              <div className="font-medium">{config.title}</div>
              <div className="text-xs opacity-75">{config.description}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-lg border p-6">
        <UsageFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Phase Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseState.current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="min-h-[600px]"
          >
            <CurrentPhaseComponent
              filters={filters}
              phaseState={phaseState}
              onPhaseChange={handlePhaseChange}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase History Breadcrumb */}
      {phaseState.history.length > 1 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Phase History:</span>
          {phaseState.history.map((phase, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className={`px-2 py-1 rounded text-xs ${
                phase === phaseState.current
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {PHASE_CONFIG[phase].title}
              </span>
              {index < phaseState.history.length - 1 && (
                <span className="text-gray-400">→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
