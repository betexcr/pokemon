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
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    };
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 1000000,
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg border-none cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors"
          style={{ zIndex: 1000000 }}
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        
        {/* Hero Image */}
        <div className="w-full overflow-hidden rounded-t-2xl">
          <Image
            src="/header-icons/auth-hero.png"
            alt=""
            width={1200}
            height={360}
            className={`w-full object-cover ${mode === 'login' ? 'h-32' : 'h-24'}`}
            priority
          />
        </div>
        
        {/* Auth Form */}
        <div className={`px-6 ${mode === 'login' ? 'pb-6' : 'pb-8'}`}>
          {mode === 'login' ? (
            <LoginForm onToggleMode={() => setMode('register')} />
          ) : (
            <RegisterForm onToggleMode={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );

  console.log('Creating portal to document.body:', document.body);
  
  // Ensure we have a proper container
  const portalContainer = document.body;
  if (!portalContainer) {
    console.error('No document.body found for portal');
    return null;
  }
  
  return createPortal(modalContent, portalContainer);
}