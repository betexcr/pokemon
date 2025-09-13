"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface UserDropdownProps {
  isMobile?: boolean;
}

export default function UserDropdown({ isMobile = false }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();


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

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user's initials
  const getInitials = () => {
    if (!user) return 'A';
    const name = user.displayName || user.email || 'User';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative inline-block text-left user-dropdown-container" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 user-dropdown-button"
        style={{
          width: '64px !important',
          height: '64px !important',
          borderRadius: '50% !important',
          aspectRatio: '1 / 1 !important',
          minWidth: '64px !important',
          minHeight: '64px !important',
          maxWidth: '64px !important',
          maxHeight: '64px !important',
          '--user-dropdown-size': '64px'
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
              objectFit: 'cover !important',
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
          "absolute right-0 mt-2 rounded-lg border border-gray-200 shadow-lg z-50",
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
          backgroundColor: '#ffffff',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
          pointerEvents: open ? 'auto' : 'none'
        }}
        data-testid="user-dropdown-menu"
      >
        <div className="px-4 py-3 text-sm text-gray-700">
          Signed in as <span className="font-semibold text-gray-900">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
         </div>

        <div className="border-t border-gray-100" />

        <button
          onClick={handleLogout}
          role="menuitem"
          className="flex w-full items-center px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 focus:bg-red-50 rounded-b-lg"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
