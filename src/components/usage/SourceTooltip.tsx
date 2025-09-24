'use client';

import { useState, useRef, useEffect } from 'react';
import { UsageSource } from '@/types/usage';
import { ExternalLink, Calendar, Info } from 'lucide-react';

interface SourceTooltipProps {
  source: UsageSource;
  children: React.ReactNode;
}

export default function SourceTooltip({ source, children }: SourceTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      // Adjust horizontal position if tooltip would go off screen
      if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // Adjust vertical position if tooltip would go off screen
      if (top + tooltipRect.height > viewportHeight) {
        top = triggerRect.top - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleSourceClick = () => {
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Data Source
                </span>
              </div>
              {source.url && (
                <button
                  onClick={handleSourceClick}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Open source link"
                >
                  <ExternalLink className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>

            {/* Source Label */}
            <div>
              <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                {source.label}
              </div>
            </div>

            {/* Collection Date */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Collected: {formatDate(source.collectedAt)}</span>
            </div>

            {/* URL (if available) */}
            {source.url && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSourceClick}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline truncate block w-full text-left"
                >
                  {source.url}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
              Click to view original source
            </div>
          </div>
        </div>
      )}
    </>
  );
}
