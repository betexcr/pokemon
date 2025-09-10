'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface BattleStartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBattleStart: () => void;
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

export default function BattleStartDialog({ isOpen, onClose, onBattleStart }: BattleStartDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [minCloseAt, setMinCloseAt] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setCountdown(3);
      setProgress(0);
      setCurrentMessage(0);
      setIsStarting(false);
      setMinCloseAt(0);
      return;
    }

    // Start the battle sequence
    setIsStarting(true);
    // Enforce minimum visible time of 3 seconds
    setMinCloseAt(Date.now() + 3000);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start battle after countdown, but ensure dialog stayed up at least 3s
          const remaining = Math.max(0, minCloseAt - Date.now());
          setTimeout(() => {
            onBattleStart();
            onClose();
          }, Math.max(500, remaining));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Progress bar animation (3 seconds total)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / 30); // 30 updates per second for smooth animation
      });
    }, 33); // ~30fps

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
      clearInterval(countdownInterval);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isOpen, onBattleStart, onClose, minCloseAt]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // Block closing with Escape until minimum display time elapses
        if (Date.now() >= minCloseAt) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, minCloseAt]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '32rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 1000000,
          margin: 'auto'
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

          {/* Countdown Timer */}
          <div className="text-center mb-6">
            <div 
              className="text-6xl font-bold text-poke-red mb-2"
              style={{ 
                fontFamily: 'Pocket Monk, monospace',
                textShadow: '3px 3px 0px #000',
                letterSpacing: '2px'
              }}
            >
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            {countdown === 0 && (
              <div 
                className="text-2xl font-bold text-poke-yellow animate-pulse"
                style={{ 
                  fontFamily: 'Pocket Monk, monospace',
                  textShadow: '2px 2px 0px #000',
                  letterSpacing: '1px'
                }}
              >
                LET&apos;S BATTLE!
              </div>
            )}
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
              {LOADING_MESSAGES[currentMessage]}
            </p>
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
              {countdown > 0 
                ? "Get ready to choose your first Pokemon!" 
                : "Entering the battle arena..."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

