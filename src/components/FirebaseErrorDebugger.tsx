/**
 * Firebase Error Debugger Component
 * 
 * This component displays Firebase permission errors and provides
 * debugging information for developers and users experiencing issues.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBattleErrorLogger } from '@/hooks/useFirebaseErrorLogger';
import { Bug, AlertTriangle, Download, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface FirebaseErrorDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseErrorDebugger({ isOpen, onClose }: FirebaseErrorDebuggerProps) {
  const { getErrorSummary, getRecentErrors, exportLogs, clearLogs, isErrorFrequent } = useBattleErrorLogger();
  const [summary, setSummary] = useState<any>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshData = () => {
    setSummary(getErrorSummary());
    setRecentErrors(getRecentErrors(10)); // Last 10 minutes
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const handleExportLogs = () => {
    const logs = exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-errors-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      clearLogs();
      refreshData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Firebase Error Debugger
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-md ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Summary */}
          {summary && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Error Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {summary.totalErrors}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Total Errors</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {summary.recentErrors}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Recent (5min)</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summary.errorTypes.firestore || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Firestore</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.errorTypes.auth || 0}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Auth</div>
                </div>
              </div>

              {/* Common Errors */}
              {summary.commonErrors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Most Common Errors
                  </h4>
                  <div className="space-y-2">
                    {summary.commonErrors.slice(0, 3).map((error: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {error.code}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {error.message}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">
                          {error.count}x
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {summary.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Suggested Actions
                  </h4>
                  <div className="space-y-1">
                    {summary.suggestions.slice(0, 5).map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Recent Errors (Last 10 minutes)
              </h3>
              <div className="space-y-3">
                {recentErrors.map((error, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          error.errorType === 'firestore' ? 'bg-blue-100 text-blue-800' :
                          error.errorType === 'auth' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {error.errorType.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {error.errorCode}
                        </span>
                        {isErrorFrequent(error.errorCode) && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            FREQUENT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {error.errorMessage}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Operation: {error.operation}
                    </div>
                    {showDetails && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        <div className="font-medium mb-1">Context:</div>
                        <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Errors */}
          {(!summary || summary.totalErrors === 0) && (
            <div className="text-center py-8">
              <div className="text-green-500 text-4xl mb-2">✓</div>
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No Firebase Errors
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your Firebase operations are working correctly!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {summary && `Last updated: ${new Date().toLocaleTimeString()}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
