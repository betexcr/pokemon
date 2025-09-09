'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password, displayName);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[18px] mb-4">
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        {/* Name */}
        <label className="block mb-3">
          <span className="block text-[18px] font-semibold text-[#2b2f38] mb-2">Name</span>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-[52px] rounded-[18px] border border-black/10 bg-white px-4 text-[18px] font-medium text-[#20262f] placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
            placeholder="Ash K."
            required
          />
        </label>

        {/* Email */}
        <label className="block mb-3">
          <span className="block text-[18px] font-semibold text-[#2b2f38] mb-2">Email</span>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[52px] rounded-[18px] border border-black/10 bg-white px-4 text-[18px] font-medium text-[#20262f] placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
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
              className="w-full h-[52px] rounded-[18px] border border-black/10 bg-white px-4 text-[18px] font-medium text-[#20262f] placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
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

        {/* Confirm Password */}
        <label className="block mb-4">
          <span className="block text-[18px] font-semibold text-[#2b2f38] mb-2">
            Confirm Password
          </span>
          <div className="relative">
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-[52px] rounded-[18px] border border-black/10 bg-white px-4 text-[18px] font-medium text-[#20262f] placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-500"
              placeholder="Confirm password"
              required
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible((s) => !s)}
              className="absolute inset-y-0 right-4 text-[15px] text-gray-500"
              aria-pressed={confirmPasswordVisible}
            >
              {confirmPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[56px] rounded-[18px] bg-[#ffcf3a] text-[#0f172a] font-extrabold text-[24px] shadow-[0_6px_18px_rgba(255,207,58,.35)] transition active:translate-y-px hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      

      {/* Footer */}
      <button
        onClick={onToggleMode}
        className="w-full h-[56px] rounded-[18px] border border-black/10 bg-white flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 mt-4"
      >
        <span className="text-[#0f172a] font-extrabold text-[24px]">
          Already have an account?{" "}
          <span className="text-blue-600">
            Sign in
          </span>
        </span>
      </button>
    </div>
  );
}
