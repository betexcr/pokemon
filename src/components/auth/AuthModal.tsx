'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text hover:text-primary transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
}
