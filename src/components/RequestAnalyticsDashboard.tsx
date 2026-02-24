/**
 * Request Analytics Dashboard Component
 * Optional debug component for monitoring request performance
 * Import and add to a page to see real-time analytics
 */

'use client';

import React, { useState } from 'react';
import { useRequestAnalytics } from '@/hooks/useRequestAnalytics';

interface RequestAnalyticsDashboardProps {
  /**
   * Show by default or collapsed
   */
  defaultOpen?: boolean;
  
  /**
   * Position on screen
   */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export default function RequestAnalyticsDashboard({
  defaultOpen = false,
  position = 'bottom-right'
}: RequestAnalyticsDashboardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const analytics = useRequestAnalytics({
    autoPrune: true,
    updateInterval: 1000
  });

  const stats = analytics.getDisplayStats();
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-50 px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors shadow-lg`}
        title="Open Request Analytics"
      >
        📊 Stats
      </button>
    );
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4 max-w-sm max-h-96 overflow-y-auto border border-gray-700`}
      style={{ fontFamily: 'monospace' }}
    >
      <div className="mb-3 pb-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-sm">📊 Request Analytics</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Requests Summary */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-blue-300 mb-1">Requests</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>Total: <span className="text-white font-bold">{stats.requests.total}</span></div>
          <div>✓: <span className="text-green-400 font-bold">{stats.requests.completed}</span></div>
          <div>✗: <span className="text-red-400 font-bold">{stats.requests.cancelled}</span></div>
          <div>⚠: <span className="text-yellow-400 font-bold">{stats.requests.failed}</span></div>
          <div colSpan={2} className="text-red-400">
            Cancel Rate: <span className="font-bold">{stats.requests.cancelled_percent}%</span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-purple-300 mb-1">Performance</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>Avg: <span className="text-white font-bold">{stats.performance.avg_ms}ms</span></div>
          <div>Max: <span className="text-white font-bold">{stats.performance.slowest_ms}ms</span></div>
          <div>Min: <span className="text-white font-bold">{stats.performance.fastest_ms}ms</span></div>
        </div>
      </div>

      {/* Pool Status */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-cyan-300 mb-1">Request Pool</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>Active: <span className="text-white font-bold">{stats.pool.active}/{stats.pool.max}</span></div>
          <div>Queued: <span className="text-yellow-400 font-bold">{stats.pool.queued}</span></div>
          <div colSpan={2}>Utilization: <span className="text-white font-bold">{stats.pool.utilization_percent}%</span></div>
        </div>
      </div>

      {/* Top Contexts */}
      {stats.topContexts.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-700">
          <div className="text-xs font-semibold text-green-300 mb-1">Top Contexts</div>
          <div className="space-y-1">
            {stats.topContexts.map(ctx => (
              <div key={ctx.context} className="text-xs">
                <span className="text-gray-400">{ctx.context}:</span> <span className="text-white font-bold">{ctx.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => analytics.reset()}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => analytics.setLogging(!analytics.analytics.totalRequests ? false : true)}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
        >
          Logs
        </button>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 break-words">
          {analytics.getSummary()}
        </div>
      </div>
    </div>
  );
}
