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
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const { signIn, signInWithGoogle, signInWithMicrosoft, signInWithTwitter } = useAuth();

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


  const handleMicrosoftSignIn = async () => {
    try {
      setError('');
      setMicrosoftLoading(true);
      await signInWithMicrosoft();
      console.log('Microsoft login successful, calling onSuccess callback');
      onSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Microsoft');
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      setError('');
      setTwitterLoading(true);
      await signInWithTwitter();
      console.log('Twitter login successful, calling onSuccess callback');
      onSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Twitter');
    } finally {
      setTwitterLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <h1 className="text-center text-2xl sm:text-3xl lg:text-[32px] leading-none font-extrabold text-[#121721] mb-4 sm:mb-6">
        Sign In
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[18px] mb-4">
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto w-full">
        {/* Email */}
        <label className="block mb-3">
          <span className="block text-base sm:text-lg font-semibold text-[#2b2f38] mb-2">Email</span>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 px-4 sm:px-5 text-sm sm:text-base font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
            style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
            placeholder="Email"
            required
          />
        </label>
        
        {/* Password */}
        <label className="block mb-3">
          <span className="block text-base sm:text-lg font-semibold text-[#2b2f38] mb-2">Password</span>
          <div className="relative">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 px-4 sm:px-5 text-sm sm:text-base font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
              style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((s) => !s)}
              className="absolute inset-y-0 right-4 sm:right-5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 px-2"
              aria-pressed={passwordVisible}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        
        {/* Submit */}
        <button
          type="submit"
          disabled={loading || googleLoading || microsoftLoading || twitterLoading}
          className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-[#ffcf3a] hover:bg-[#ffd700] text-[#0f172a] font-bold text-base sm:text-lg md:text-xl shadow-[0_4px_12px_rgba(255,207,58,.4)] hover:shadow-[0_6px_20px_rgba(255,207,58,.5)] transition-all duration-200 active:translate-y-0.5 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[0_4px_12px_rgba(255,207,58,.4)]"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-[#0f172a] border-t-transparent"></div>
              <span>Signing In...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      

      {/* Google - Updated logo size */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading || microsoftLoading || twitterLoading}
        className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 sm:gap-4 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-4 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {googleLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-600 border-t-transparent"></div>
            <span className="text-gray-700 font-semibold text-sm sm:text-base">Signing in...</span>
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
            <span className="font-semibold text-sm sm:text-base text-gray-700">
              Sign in with Google
            </span>
          </>
        )}
      </button>


      {/* Microsoft */}
      <button
        type="button"
        onClick={handleMicrosoftSignIn}
        disabled={loading || googleLoading || microsoftLoading || twitterLoading}
        className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 sm:gap-4 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {microsoftLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-600 border-t-transparent"></div>
            <span className="text-gray-700 font-semibold text-sm sm:text-base">Signing in...</span>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                <path fill="#7fba00" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-base text-gray-700">
              Sign in with Microsoft
            </span>
          </>
        )}
      </button>

      {/* Twitter */}
      <button
        type="button"
        onClick={handleTwitterSignIn}
        disabled={loading || googleLoading || microsoftLoading || twitterLoading}
        className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 sm:gap-4 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {twitterLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-600 border-t-transparent"></div>
            <span className="text-gray-700 font-semibold text-sm sm:text-base">Signing in...</span>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} fill="#1DA1F2">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-base text-gray-700">
              Sign in with Twitter
            </span>
          </>
        )}
      </button>

      {/* Footer */}
      <button
        onClick={onToggleMode}
        className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 sm:gap-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-4 hover:scale-[1.01] active:scale-[0.99]"
      >
        <span className="font-semibold text-sm sm:text-base text-gray-700">
          Don&apos;t have an account?{" "}
          <span className="text-blue-600 hover:text-blue-700 font-bold">
            Sign up
          </span>
        </span>
      </button>
    </div>
  );
}
