"use client";

import React, { useState, useEffect } from 'react';
import { imageCache } from '@/lib/imageCache';
import { preloadPopularPokemon, warmCache, startProgressiveCacheWarming } from '@/lib/imageCache';

interface CacheStats {
  memoryItems: number;
  maxMemoryItems: number;
  useServiceWorker: boolean;
  useIndexedDB: boolean;
  memoryUsage: number;
  cacheEfficiency: number;
  lastUpdated: string;
}

interface ServiceWorkerStats {
  swCacheItems: number;
  swCacheSize: number;
  swCacheUrls: string[];
}

export default function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [swStats, setSwStats] = useState<ServiceWorkerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const refreshStats = async () => {
    try {
      const currentStats = imageCache.getStats();
      setStats(currentStats);
      
      const swStats = await imageCache.getServiceWorkerStats();
      setSwStats(swStats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  const handlePreloadPopular = async () => {
    setIsLoading(true);
    addLog('Starting popular Pokemon preload...');
    try {
      await preloadPopularPokemon();
      addLog('Popular Pokemon preload completed');
      await refreshStats();
    } catch (error) {
      addLog(`Preload failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWarmCache = async () => {
    setIsLoading(true);
    addLog('Starting cache warming...');
    try {
      await warmCache();
      addLog('Cache warming completed');
      await refreshStats();
    } catch (error) {
      addLog(`Cache warming failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProgressiveWarming = () => {
    addLog('Starting progressive cache warming...');
    startProgressiveCacheWarming();
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    addLog('Clearing all caches...');
    try {
      imageCache.clear();
      addLog('All caches cleared');
      await refreshStats();
    } catch (error) {
      addLog(`Cache clear failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return <div className="p-4">Loading cache stats...</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🚀 Image Cache Monitor
      </h2>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Memory Cache</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.memoryItems} / {stats.maxMemoryItems}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {stats.memoryUsage.toFixed(1)}% used
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100">Cache Efficiency</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.cacheEfficiency.toFixed(1)}%
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Performance score
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">Service Worker</h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {swStats ? swStats.swCacheItems : 'N/A'}
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {stats.useServiceWorker ? 'Active' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Cache Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handlePreloadPopular}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Preload Popular'}
        </button>

        <button
          onClick={handleWarmCache}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Warming...' : 'Warm Cache'}
        </button>

        <button
          onClick={handleStartProgressiveWarming}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Progressive Warm
        </button>

        <button
          onClick={handleClearCache}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>

      {/* Service Worker Cache Details */}
      {swStats && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Service Worker Cache Details
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Cached URLs ({swStats.swCacheItems} items):
            </p>
            <div className="max-h-32 overflow-y-auto">
              {swStats.swCacheUrls.map((url, index) => (
                <div key={index} className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {url}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          Activity Log
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No activity yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}




