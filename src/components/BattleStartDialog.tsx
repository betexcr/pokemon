'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

// Global guard to ensure only one dialog overlay is visible at a time
let __BATTLE_START_DIALOG_ACTIVE__ = false;
let __BATTLE_START_STARTED__ = false;

interface BattleStartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBattleStart: () => void;
  roomId?: string;
}

// Pokemon-themed loading messages
const LOADING_MESSAGES = [
  "Initializing battle arena...",
  "Loading trainer data...",
  "Preparing Pokemon teams...",
  "Setting up battle mechanics...",
  "Synchronizing with opponent...",
  "Finalizing battle environment...",
  "Ready to battle!"
];

export default function BattleStartDialog({ isOpen, onClose, onBattleStart, roomId }: BattleStartDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState<{
    isReady: boolean;
    errors: string[];
    lastCheck: Date | null;
  }>({ isReady: true, errors: [], lastCheck: null });
  const [retryStatus, setRetryStatus] = useState<{
    isRetrying: boolean;
    attempt: number;
    maxAttempts: number;
    nextRetryIn: number;
  }>({ isRetrying: false, attempt: 0, maxAttempts: 0, nextRetryIn: 0 });
  const [progressSteps, setProgressSteps] = useState<{
    roomCheck: boolean;
    playersReady: boolean;
    teamsValid: boolean;
    statusValid: boolean;
    finalCheck: boolean;
  }>({
    roomCheck: false,
    playersReady: false,
    teamsValid: false,
    statusValid: false,
    finalCheck: false
  });

  // Check battle readiness with dynamic retry and progress tracking
  const checkReadiness = async (allowBattlingStatus: boolean = false) => {
    if (!roomId) return;
    
    try {
      const { roomService } = await import('@/lib/roomService');
      const { DynamicRetry, ROOM_RETRY_CONFIG } = await import('@/lib/retryUtils');
      
      // Reset progress steps
      setProgressSteps({
        roomCheck: false,
        playersReady: false,
        teamsValid: false,
        statusValid: false,
        finalCheck: false
      });
      
      const readinessCheck = await DynamicRetry.retry(
        async () => {
          // Step 1: Check if room exists
          setProgressSteps(prev => ({ ...prev, roomCheck: true }));
          setProgress(20);
          
          // Step 2: Check if players are ready
          setProgressSteps(prev => ({ ...prev, playersReady: true }));
          setProgress(40);
          
          // Step 3: Check if teams are valid
          setProgressSteps(prev => ({ ...prev, teamsValid: true }));
          setProgress(60);
          
          // Step 4: Check room status
          setProgressSteps(prev => ({ ...prev, statusValid: true }));
          setProgress(80);
          
          const result = await roomService.checkBattleReadiness(roomId!, allowBattlingStatus);
          
          // Step 5: Final check
          setProgressSteps(prev => ({ ...prev, finalCheck: true }));
          setProgress(100);
          
          return result;
        },
        ROOM_RETRY_CONFIG,
        (attempt, delay, error) => {
          setRetryStatus({
            isRetrying: true,
            attempt,
            maxAttempts: ROOM_RETRY_CONFIG.maxAttempts || 8,
            nextRetryIn: delay
          });
        }
      );
      
      setRetryStatus({ isRetrying: false, attempt: 0, maxAttempts: 0, nextRetryIn: 0 });
      setReadinessStatus({
        isReady: readinessCheck.isReady,
        errors: readinessCheck.errors,
        lastCheck: new Date()
      });
      return readinessCheck.isReady;
    } catch (error) {
      console.error('Failed to check battle readiness:', error);
      setRetryStatus({ isRetrying: false, attempt: 0, maxAttempts: 0, nextRetryIn: 0 });
      setReadinessStatus({
        isReady: false,
        errors: ['Failed to check battle readiness'],
        lastCheck: new Date()
      });
      return false;
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setProgress(0);
      setCurrentMessage(0);
      setIsStarting(false);
      setReadinessStatus({ isReady: true, errors: [], lastCheck: null });
      return;
    }

    // Only start the battle sequence if not already starting
    if (!isStarting) {
      setIsStarting(true);
      // Immediately start readiness polling – no artificial delay
      checkReadiness(true);
    }
    
    // Poll readiness every 500ms and start as soon as it’s ready
    const readinessInterval = setInterval(async () => {
      if (__BATTLE_START_STARTED__) return;
      const ready = await checkReadiness(true);
      if (ready && !__BATTLE_START_STARTED__) {
        __BATTLE_START_STARTED__ = true;
        clearInterval(readinessInterval);
        onBattleStart();
        onClose();
      }
    }, 500);

    // Progress bar will be updated by checkReadiness function
    // No need for timer-based progress animation

    // Loading messages rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => {
        const next = prev + 1;
        if (next >= LOADING_MESSAGES.length) {
          clearInterval(messageInterval);
          return LOADING_MESSAGES.length - 1;
        }
        return next;
      });
    }, 400); // Change message every 400ms

    // Cleanup
    return () => {
      clearInterval(readinessInterval);
      clearInterval(messageInterval);
      // If dialog closes without starting, allow future starts
      if (!readinessStatus.isReady) {
        __BATTLE_START_STARTED__ = false;
      }
    };
  }, [isOpen, onBattleStart, onClose]);

  // Handle escape key
  useEffect(() => {
    // Maintain a singleton overlay: claim/release the global flag
    if (isOpen) {
      if (__BATTLE_START_DIALOG_ACTIVE__) {
        // Another instance is already showing; do not attach listeners for this one
      } else {
        __BATTLE_START_DIALOG_ACTIVE__ = true;
      }
    } else {
      __BATTLE_START_DIALOG_ACTIVE__ = false;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      // Release on unmount just in case
      __BATTLE_START_DIALOG_ACTIVE__ = false;
    };
  }, [isOpen, onClose]);

  // Do not render if closed, not mounted, or another instance is already active
  if (!isOpen || !mounted || __BATTLE_START_DIALOG_ACTIVE__ && !isOpen) return null;
  if (!isOpen || !mounted) return null;

  // Add CSS keyframes for animations
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideInUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes slideOutDown {
      from { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
    }
  `;

  const modalContent = (
    <>
      {/* Inject CSS keyframes */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div 
        className="fixed inset-0 z-[999999] flex items-center justify-center w-screen h-screen m-0 p-4 bg-black/70 backdrop-blur-md transition-all duration-300 ease-out"
        style={{
          animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-in',
          backdropFilter: 'blur(8px) saturate(180%)'
        }}
      >
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-[1000000] mx-auto transform transition-all duration-300 ease-out"
        style={{
          animation: isOpen ? 'slideInUp 0.3s ease-out' : 'slideOutDown 0.3s ease-in',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Hero GIF */}
        <div className="w-full overflow-hidden rounded-t-2xl bg-gradient-to-b from-blue-100 to-blue-200">
          <div className="relative w-full h-48 flex items-center justify-center">
            <Image
              src="/gen1/battle_start.gif"
              alt="Battle Starting"
              width={400}
              height={200}
              className="w-full h-full object-contain"
              priority
              unoptimized // GIFs need unoptimized to work properly
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="px-8 py-6">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ 
                fontFamily: 'Pocket Monk, monospace',
                textShadow: '2px 2px 0px #000',
                letterSpacing: '1px'
              }}
            >
              BATTLE STARTING!
            </h2>
            <p className="text-gray-600 text-sm">
              Prepare for an epic Pokemon battle
            </p>
          </div>

          {/* Readiness Indicator (replaces countdown) */}
          <div className="text-center mb-6">
            <div 
              className="text-2xl font-bold text-poke-red mb-2"
              style={{ 
                fontFamily: 'Pocket Monk, monospace',
                textShadow: '2px 2px 0px #000',
                letterSpacing: '2px'
              }}
            >
              {readinessStatus.isReady ? 'READY' : 'PREPARING...'}
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center mb-6">
            <p 
              className="text-lg font-semibold text-gray-700 min-h-[1.5rem]"
              style={{ 
                fontFamily: 'Pocket Monk, monospace',
                textShadow: '1px 1px 0px #000',
                letterSpacing: '0.5px'
              }}
            >
              {progressSteps.roomCheck && !progressSteps.playersReady && "Checking room status..."}
              {progressSteps.playersReady && !progressSteps.teamsValid && "Verifying player readiness..."}
              {progressSteps.teamsValid && !progressSteps.statusValid && "Validating Pokemon teams..."}
              {progressSteps.statusValid && !progressSteps.finalCheck && "Checking battle status..."}
              {progressSteps.finalCheck && "Finalizing battle setup..."}
              {!progressSteps.roomCheck && LOADING_MESSAGES[currentMessage]}
            </p>
            
            {/* Readiness Status */}
            {readinessStatus.lastCheck && (
              <div className="mt-2 text-sm">
                {readinessStatus.isReady ? (
                  <span 
                    className="text-green-600 font-semibold"
                    style={{ 
                      fontFamily: 'Pocket Monk, monospace',
                      textShadow: '1px 1px 0px #000',
                      letterSpacing: '0.5px'
                    }}
                  >
                    ✅ BATTLE READY
                  </span>
                ) : (
                  <div>
                    <span 
                      className="text-red-600 font-semibold"
                      style={{ 
                        fontFamily: 'Pocket Monk, monospace',
                        textShadow: '1px 1px 0px #000',
                        letterSpacing: '0.5px'
                      }}
                    >
                      ❌ NOT READY
                    </span>
                    {readinessStatus.errors.length > 0 && (
                      <div className="mt-1 text-xs text-red-500">
                        {readinessStatus.errors[0]}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Retry Status */}
                {retryStatus.isRetrying && (
                  <div className="mt-2 text-xs text-blue-600">
                    <div 
                      style={{ 
                        fontFamily: 'Pocket Monk, monospace',
                        textShadow: '1px 1px 0px #000',
                        letterSpacing: '0.5px'
                      }}
                    >
                      🔄 Retrying... ({retryStatus.attempt}/{retryStatus.maxAttempts})
                    </div>
                    <div className="mt-1">
                      Next retry in {Math.round(retryStatus.nextRetryIn / 1000)}s
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pixelated Health Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-sm font-semibold text-gray-700"
                style={{ 
                  fontFamily: 'Pocket Monk, monospace',
                  textShadow: '1px 1px 0px #000',
                  letterSpacing: '0.5px'
                }}
              >
                BATTLE LOADING
              </span>
              <span 
                className="text-sm font-semibold text-gray-700"
                style={{ 
                  fontFamily: 'Pocket Monk, monospace',
                  textShadow: '1px 1px 0px #000',
                  letterSpacing: '0.5px'
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Progress Steps Indicator */}
            <div className="flex justify-center space-x-2 mb-2">
              {[
                { key: 'roomCheck', label: 'Room', color: 'bg-blue-500' },
                { key: 'playersReady', label: 'Players', color: 'bg-green-500' },
                { key: 'teamsValid', label: 'Teams', color: 'bg-yellow-500' },
                { key: 'statusValid', label: 'Status', color: 'bg-purple-500' },
                { key: 'finalCheck', label: 'Final', color: 'bg-red-500' }
              ].map((step, index) => (
                <div
                  key={step.key}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    progressSteps[step.key as keyof typeof progressSteps] 
                      ? step.color 
                      : 'bg-gray-300'
                  }`}
                  style={{
                    imageRendering: 'pixelated',
                    boxShadow: progressSteps[step.key as keyof typeof progressSteps] 
                      ? `0 0 8px ${step.color.replace('bg-', '')}` 
                      : 'none'
                  }}
                  title={`${step.label}: ${progressSteps[step.key as keyof typeof progressSteps] ? '✓' : '⏳'}`}
                />
              ))}
            </div>
            
            {/* Pixelated Progress Bar */}
            <div className="relative">
              {/* Background */}
              <div 
                className="w-full h-8 border-2 border-gray-800 bg-gray-300"
                style={{
                  imageRendering: 'pixelated'
                }}
              >
                {/* Progress Fill */}
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`,
                    imageRendering: 'pixelated',
                    background: `
                      repeating-linear-gradient(
                        90deg,
                        #ef4444 0px,
                        #ef4444 4px,
                        #dc2626 4px,
                        #dc2626 8px
                      )
                    `
                  }}
                />
                
                {/* Pixelated overlay pattern */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 2px,
                        rgba(0,0,0,0.1) 2px,
                        rgba(0,0,0,0.1) 4px
                      ),
                      repeating-linear-gradient(
                        90deg,
                        transparent 0px,
                        transparent 2px,
                        rgba(0,0,0,0.1) 2px,
                        rgba(0,0,0,0.1) 4px
                      )
                    `,
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
              
              {/* Pixelated border effect */}
              <div 
                className="absolute inset-0 border-2 border-gray-800 pointer-events-none"
                style={{
                  imageRendering: 'pixelated',
                  boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.3), inset -2px -2px 0px rgba(255,255,255,0.3)'
                }}
              />
            </div>
          </div>

          {/* Pokemon-themed loading indicators */}
          <div className="flex justify-center space-x-4 mb-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  progress > (index + 1) * 25 ? 'bg-poke-yellow' : 'bg-gray-300'
                }`}
                style={{
                  imageRendering: 'pixelated',
                  boxShadow: progress > (index + 1) * 25 ? '0 0 8px #FFCB05' : 'none'
                }}
              />
            ))}
          </div>

          {/* Battle preparation text */}
          <div className="text-center">
            <p 
              className="text-sm text-gray-600"
              style={{ 
                fontFamily: 'Pocket Monk, monospace',
                textShadow: '1px 1px 0px #000',
                letterSpacing: '0.5px'
              }}
            >
              {readinessStatus.isReady
                ? "Entering the battle arena..."
                : "Get ready to choose your first Pokemon!"}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

