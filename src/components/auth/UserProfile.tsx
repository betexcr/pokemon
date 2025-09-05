'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, LogIn } from 'lucide-react';
import AuthModal from './AuthModal';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update button position on scroll/resize
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          setButtonRect(buttonRef.current.getBoundingClientRect());
        }
      };

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showDropdown]);

  if (!user) {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={() => setShowAuthModal(true)}
          className="flex items-center space-x-2 px-2 py-1 rounded-full bg-surface border border-border hover:bg-white/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <LogIn size={18} />
          <span className="hidden sm:block text-sm font-medium">Sign In</span>
        </button>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    );
  }

  // Get user's profile picture or generate initials
  const getProfilePicture = () => {
    console.log('UserProfile - User data:', {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid
    });
    
    if (user.photoURL) {
      console.log('Using photoURL:', user.photoURL);
      return (
        <img
          src={user.photoURL}
          alt={user.displayName || user.email || 'User'}
          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
          onError={(e) => {
            console.error('Failed to load profile image:', user.photoURL);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Profile image loaded successfully');
          }}
        />
      );
    }
    
    // Generate initials from display name or email
    const name = user.displayName || user.email || 'User';
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-poke-blue to-poke-red flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm">
        {initials}
      </div>
    );
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="flex items-center space-x-2 px-2 py-1 rounded-full bg-surface border border-border hover:bg-white/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md group"
      >
        {getProfilePicture()}
        <span className="hidden sm:block text-sm font-medium text-text group-hover:text-primary">
          {user.displayName || user.email?.split('@')[0]}
        </span>
      </button>

      {showDropdown && buttonRect && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="fixed w-56 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl z-[9999]"
            style={{
              top: buttonRect.bottom + 8,
              right: window.innerWidth - buttonRect.right,
            }}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getProfilePicture()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="p-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
