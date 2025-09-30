"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, LogIn, RotateCcw } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { useToastContext } from './ToastProvider';

interface UserDropdownProps {
  isMobile?: boolean;
}

export default function UserDropdown({ isMobile = false }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, logout, loading } = useAuth();
  const { addToast } = useToastContext();

  // Ensure component is mounted before hydrating
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close AuthModal when user successfully logs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);



  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Hover handlers for desktop
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMobile) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      closeTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  const handleClick = () => {
    if (isMobile) {
      setOpen((v) => !v);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResetPokeTips = () => {
    try {
      // Remove all help assistant preferences
      localStorage.removeItem('help-assistant-hide-forever');
      
      // Remove all path-specific preferences
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('help-assistant-hide:')) {
          localStorage.removeItem(key);
        }
      });
      
      setOpen(false);
      
      // Dispatch custom event to notify HelpAssistant to show immediately
      window.dispatchEvent(new CustomEvent('poke-tips-reset'));
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Poke-Tips Reset!',
        message: 'The help assistant will now appear on all pages.',
        duration: 4000
      });
    } catch (error) {
      console.error('Error resetting Poke-Tips:', error);
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Error resetting Poke-Tips. Please try again.',
        duration: 4000
      });
    }
  };

  // Get user's initials
  const getInitials = () => {
    if (!user) return 'A';
    const name = user.displayName || user.email || 'User';
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render interactive elements until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="relative inline-block text-left user-dropdown-container">
        <button 
          className="w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 user-dropdown-button touch-manipulation" 
          style={{
            borderRadius: '50% !important',
            aspectRatio: '1 / 1 !important',
            '--user-dropdown-size': '40px'
          } as React.CSSProperties}
          title="Loading..."
        >
          <Image 
            src="/profile-placeholder.png" 
            alt="Profile Placeholder" 
            width={64}
            height={64}
            className="w-full h-full rounded-full object-cover user-dropdown-image"
            style={{
              borderRadius: '50% !important',
              width: '100% !important',
              height: '100% !important',
              aspectRatio: '1 / 1 !important',
              objectFit: 'cover' as const,
              minWidth: '0 !important',
              minHeight: '0 !important'
            }}
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
    );
  }

  // During auth loading, render a neutral placeholder to avoid "logged off" flash
  if (loading) {
    return (
      <div className="relative inline-block text-left user-dropdown-container">
        <button 
          className="w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full overflow-hidden border-2 border-gray-300 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 bg-white/60 dark:bg-gray-800/60"
          style={{ borderRadius: '50%' } as React.CSSProperties}
          aria-label="Loading account"
          title=""
        >
          <Image 
            src="/profile-placeholder.png" 
            alt="" 
            width={64}
            height={64}
            className="w-full h-full rounded-full object-cover opacity-70"
            style={{ borderRadius: '50%' }}
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
    );
  }

  // Show offline placeholder when no user (only after loading finished)
  if (!user) {
    return (
      <div 
        className="relative inline-block text-left user-dropdown-container" 
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={handleClick}
          aria-haspopup="menu"
          aria-expanded={open}
          className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70 user-dropdown-button"
          style={{
            borderRadius: '50% !important',
            aspectRatio: '1 / 1 !important',
            '--user-dropdown-size': '40px'
          } as React.CSSProperties}
          title="Sign In"
        >
          <img
            src="/profile-placeholder.png"
            alt="Profile Placeholder"
            className="w-full h-full rounded-full object-cover user-dropdown-image"
            style={{ 
              borderRadius: '50% !important',
              width: '100% !important',
              height: '100% !important',
              aspectRatio: '1 / 1 !important',
              objectFit: 'cover' as const,
              minWidth: '0 !important',
              minHeight: '0 !important'
            }}
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Dropdown for offline state */}
        <div
          role="menu"
          aria-hidden={!open}
          className={[
            "absolute right-0 mt-2 rounded-lg border shadow-lg z-50",
            "border-gray-200 dark:border-gray-700",
            "bg-white dark:bg-gray-900",
            "origin-top-right transition duration-150 ease-out",
            open
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-1 scale-95 pointer-events-none",
          ].join(" ")}
          style={{
            width: '320px',
            maxWidth: 'calc(100vw - 2rem)',
            right: '0',
            left: 'auto',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
            pointerEvents: open ? 'auto' : 'none'
          }}
          data-testid="user-dropdown-menu"
        >
          <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
            Not signed in
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800" />
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
            Sign in to access your profile and teams
          </div>
          {/* Appearance - Theme toggle */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800" />
          
          {/* Reset Poke-Tips button for offline users */}
          <button
            onClick={handleResetPokeTips}
            className="flex w-full items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/40 focus:bg-blue-50 dark:focus:bg-blue-950/40"
            type="button"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Poke-Tips
          </button>
          
          <div className="border-t border-gray-100 dark:border-gray-800" />
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAuthModal(true);
              setOpen(false);
            }}
            className="flex w-full items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/40 focus:bg-blue-50 dark:focus:bg-blue-950/40 rounded-b-lg"
            type="button"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In / Sign Up
          </button>
        </div>

        {/* Auth Modal for non-authenticated users */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div 
      className="relative inline-block text-left user-dropdown-container" 
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar trigger */}
      <button
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 overflow-hidden aspect-square border-2 border-gray-300 bg-white/80 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation dark:border-gray-600 dark:bg-gray-800/70 dark:hover:bg-gray-700/70 user-dropdown-button"
        style={{
          borderRadius: '50% !important',
          aspectRatio: '1 / 1 !important',
          '--user-dropdown-size': '40px'
        } as React.CSSProperties}
        title={user?.displayName || user?.email || 'User Profile'}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || 'User'}
            className="w-full h-full rounded-full object-cover user-dropdown-image"
            style={{ 
              borderRadius: '50% !important',
              width: '100% !important',
              height: '100% !important',
              aspectRatio: '1 / 1 !important',
              objectFit: 'cover' as const,
              minWidth: '0 !important',
              minHeight: '0 !important'
            }}
            onError={(e) => {
              console.warn('Failed to load profile image, falling back to initials');
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className={`w-full h-full rounded-full bg-gradient-to-br from-poke-blue to-poke-red flex items-center justify-center text-white font-semibold ${user?.photoURL ? 'hidden' : ''}`} style={{ borderRadius: '50%' }}>
          {getInitials()}
        </div>
      </button>

      {/* Dropdown (kept mounted for exit animation) */}
      <div
        role="menu"
        aria-hidden={!open}
        className={[
          "absolute right-0 mt-2 rounded-lg border shadow-lg z-50",
          "border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-900",
          "origin-top-right transition duration-150 ease-out",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-1 scale-95 pointer-events-none",
        ].join(" ")}
        style={{
          width: '320px',
          maxWidth: 'calc(100vw - 2rem)',
          right: '0',
          left: 'auto',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
          pointerEvents: open ? 'auto' : 'none'
        }}
        data-testid="user-dropdown-menu"
      >
        <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          Signed in as <span className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
         </div>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Appearance - Theme toggle */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Reset Poke-Tips button */}
        <button
          onClick={handleResetPokeTips}
          role="menuitem"
          className="flex w-full items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 transition
                     hover:text-blue-700 dark:hover:text-blue-300
                     hover:bg-blue-50 dark:hover:bg-blue-900/40
                     focus:bg-blue-50 dark:focus:bg-blue-900/40
                     active:bg-blue-100 dark:active:bg-blue-900/60"
        >
          <RotateCcw className="mr-2 h-4 w-4 text-current" />
          Reset Poke-Tips
        </button>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        <button
          onClick={handleLogout}
          role="menuitem"
          className="flex w-full items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 transition
                     hover:text-red-700 dark:hover:text-red-300
                     hover:bg-red-50 dark:hover:bg-red-900/40
                     focus:bg-red-50 dark:focus:bg-red-900/40
                     active:bg-red-100 dark:active:bg-red-900/60
                     rounded-b-lg"
        >
          <LogOut className="mr-2 h-4 w-4 text-current" />
          Log out
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
