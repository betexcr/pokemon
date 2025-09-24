'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      
      // Apply modal styles
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center w-full h-full p-2 sm:p-4 md:p-6"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        visibility: 'visible',
        opacity: 1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh'
      }}
      data-testid="auth-modal"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative bg-surface text-text border border-border shadow-2xl overflow-hidden w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl"
        style={{
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-surface/90 hover:bg-surface rounded-full p-2 shadow-lg border border-border cursor-pointer flex items-center justify-center hover:scale-105 transition-all duration-200 z-10 backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted" />
        </button>
        
        {/* Hero Image */}
        <div className="w-full overflow-hidden" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
          <Image
            src="/header-icons/auth-hero.png"
            alt="Authentication"
            width={1200}
            height={360}
            className={`w-full object-cover ${mode === 'login' ? 'h-20 sm:h-24 md:h-28' : 'h-16 sm:h-20 md:h-24'}`}
            priority
          />
        </div>
        
        {/* Auth Form */}
        <div className={`px-4 sm:px-6 md:px-8 py-6 sm:py-8 ${mode === 'login' ? 'pb-6 sm:pb-8' : 'pb-8 sm:pb-10'}`}>
          {mode === 'login' ? (
            <LoginForm 
              onToggleMode={() => setMode('register')} 
              onSuccess={onClose}
            />
          ) : (
            <RegisterForm 
              onToggleMode={() => setMode('login')} 
              onSuccess={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Create portal to document.body
  return createPortal(modalContent, document.body);
}