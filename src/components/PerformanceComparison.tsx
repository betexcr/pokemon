'use client'

import { useState, useEffect, useRef } from 'react'

interface PerformanceData {
  timestamp: number
  cardCount: number
  renderTime: number
  memoryUsage: number
  scrollFPS: number
}

export default function PerformanceComparison() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [comparison, setComparison] = useState<{
    old: PerformanceData[]
    new: PerformanceData[]
  } | null>(null)
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number>()

  const startRecording = () => {
    setPerformanceData([])
    setIsRecording(true)
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const clearData = () => {
    setPerformanceData([])
    setComparison(null)
  }

  const calculateComparison = () => {
    if (performanceData.length < 2) return

    const midPoint = Math.floor(performanceData.length / 2)
    const oldData = performanceData.slice(0, midPoint)
    const newData = performanceData.slice(midPoint)

    setComparison({ old: oldData, new: newData })
  }

  // Performance monitoring
  useEffect(() => {
    if (!isRecording) return

    const updateMetrics = () => {
      const now = performance.now()
      const deltaTime = now - lastTimeRef.current
      
      frameCountRef.current++
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime)
        frameCountRef.current = 0
        lastTimeRef.current = now
        
        const memoryUsage = 'memory' in performance 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0

        setPerformanceData(prev => [...prev, {
          timestamp: now,
          cardCount: prev.length > 0 ? prev[prev.length - 1].cardCount + 20 : 20,
          renderTime: 0, // Would need to be measured per render
          memoryUsage,
          scrollFPS: fps
        }])
      }
      
      animationFrameRef.current = requestAnimationFrame(updateMetrics)
    }
    
    animationFrameRef.current = requestAnimationFrame(updateMetrics)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording])

  const getAverageMetric = (data: PerformanceData[], metric: keyof PerformanceData) => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + (item[metric] as number), 0)
    return Math.round(sum / data.length)
  }

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-4 rounded-lg text-sm font-mono z-50 max-w-sm">
      <h3 className="text-lg font-bold mb-3">Performance Monitor</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Recording:</span>
          <span className={isRecording ? 'text-green-400' : 'text-red-400'}>
            {isRecording ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Data Points:</span>
          <span>{performanceData.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg FPS:</span>
          <span>{getAverageMetric(performanceData, 'scrollFPS')}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg Memory:</span>
          <span>{getAverageMetric(performanceData, 'memoryUsage')}MB</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full px-3 py-1 rounded text-sm ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <button
          onClick={calculateComparison}
          disabled={performanceData.length < 2}
          className="w-full px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Calculate Comparison
        </button>
        
        <button
          onClick={clearData}
          className="w-full px-3 py-1 rounded text-sm bg-gray-600 hover:bg-gray-700"
        >
          Clear Data
        </button>
      </div>

      {comparison && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <h4 className="font-bold mb-2">Comparison Results</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>FPS Improvement:</span>
              <span className="text-green-400">
                +{getAverageMetric(comparison.new, 'scrollFPS') - getAverageMetric(comparison.old, 'scrollFPS')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Reduction:</span>
              <span className="text-green-400">
                -{getAverageMetric(comparison.old, 'memoryUsage') - getAverageMetric(comparison.new, 'memoryUsage')}MB
              </span>
            </div>
            <div className="flex justify-between">
              <span>Performance Score:</span>
              <span className="text-yellow-400">
                {Math.round(
                  ((getAverageMetric(comparison.new, 'scrollFPS') / getAverageMetric(comparison.old, 'scrollFPS')) * 100)
                )}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
