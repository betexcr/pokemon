'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  onSuccess?: () => void;
}

export default function LoginForm({ onToggleMode, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      console.log('Login successful, calling onSuccess callback');
      onSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      await signInWithGoogle();
      console.log('Google login successful, calling onSuccess callback');
      onSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <h1 className="text-center text-[32px] leading-none font-extrabold text-[#121721] mb-6">
        Sign In
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[18px] mb-4">
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        {/* Email */}
        <label className="block mb-3">
          <span className="block text-[18px] font-semibold text-[#2b2f38] mb-2">Email</span>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[52px] rounded-[18px] border border-black/10 px-4 text-[18px] font-medium outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
            placeholder="Email"
            required
          />
        </label>
        
        {/* Password */}
        <label className="block mb-3">
          <span className="block text-[18px] font-semibold text-[#2b2f38] mb-2">Password</span>
          <div className="relative">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[52px] rounded-[18px] border border-black/10 px-4 text-[18px] font-medium outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
              style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((s) => !s)}
              className="absolute inset-y-0 right-4 text-[15px] text-gray-500"
              aria-pressed={passwordVisible}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        
        {/* Submit */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full h-[56px] rounded-[18px] bg-[#ffcf3a] text-[#0f172a] font-extrabold text-[24px] shadow-[0_6px_18px_rgba(255,207,58,.35)] transition active:translate-y-px hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      

      {/* Google - Updated logo size */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full h-[56px] rounded-[18px] border border-google-border bg-signup-bg flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
      >
        {googleLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-2"></div>
            <span className="text-[#0f172a] font-extrabold text-[30px]">Signing in...</span>
          </div>
        ) : (
          <>
            <div 
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: '20px', height: '20px', overflow: 'hidden' }}
            >
              <svg 
                viewBox="0 0 48 48" 
                style={{ width: '20px', height: '20px', maxWidth: '20px', maxHeight: '20px' }}
                aria-hidden="true"
              >
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.9 1.9 30.37 0 24 0 14.62 0 6.4 5.38 2.54 13.2l8.37 6.49C12.62 13.7 17.86 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.64-.16-3.22-.47-4.75H24v9.01h12.68c-.55 2.98-2.23 5.5-4.75 7.19l7.28 5.65C43.99 37.48 46.5 31.24 46.5 24z"/>
                <path fill="#FBBC05" d="M10.91 19.69l-8.37-6.49C.87 15.34 0 19.55 0 24c0 4.45.87 8.66 2.54 12.8l8.37-6.49C10.35 28.3 10 26.19 10 24s.35-4.3.91-6.31z"/>
                <path fill="#34A853" d="M24 48c6.37 0 11.9-2.1 15.94-5.66l-7.28-5.65c-2.02 1.36-4.62 2.16-8.66 2.16-6.14 0-11.38-4.2-13.09-9.7l-8.37 6.49C6.4 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <span className="font-extrabold text-[24px]">
              Sign in with Google
            </span>
          </>
        )}
      </button>

      {/* Footer */}
      <button
        onClick={onToggleMode}
        className="w-full h-[56px] rounded-[18px] border border-google-border bg-signup-bg flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 mt-4"
      >
        <span className="font-extrabold text-[24px]">
          Don&apos;t have an account?{" "}
          <span className="text-signup-text hover:text-signup-hover">
            Sign up
          </span>
        </span>
      </button>
    </div>
  );
}
