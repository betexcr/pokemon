'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, LogIn } from 'lucide-react';
import AuthModal from './AuthModal';

interface UserProfileProps {
  isMobile?: boolean;
}

export default function UserProfile({ isMobile = false }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset image error state when user changes
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.uid]);

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
          className="pk-btn-profile"
          title="Sign In"
        >
          <img
            src="/profile-placeholder.png"
            alt="Profile Placeholder"
            className="w-full h-full rounded-full object-cover"
          />
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
    // Generate initials from display name or email
    const name = user.displayName || user.email || 'User';
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // If there's a photoURL and no error, try to show the image
    if (user.photoURL && !imageLoadError) {
      return (
        <img
          src={user.photoURL}
          alt={user.displayName || user.email || 'User'}
          className="w-full h-full rounded-full object-cover"
          onError={() => {
            console.warn('Failed to load profile image, falling back to initials');
            setImageLoadError(true);
          }}
          referrerPolicy="no-referrer"
          onLoad={() => {
            console.log('Profile image loaded successfully');
          }}
        />
      );
    }
    
    // Fallback to initials (either no photoURL or image failed to load)
    return (
      <div className="w-full h-full rounded-full bg-gradient-to-br from-poke-blue to-poke-red flex items-center justify-center text-white font-bold">
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
        className="pk-btn-profile"
        title={user.displayName || user.email || 'User Profile'}
      >
        {getProfilePicture()}
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
