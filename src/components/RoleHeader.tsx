"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon, 
  Bars3Icon,
  XMarkIcon,
  CommandLineIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// User Avatar Component with fallback
function UserAvatar({ user, size = 36 }: { user: any; size?: number }) {
  const [imageError, setImageError] = useState(false);
  
  // Generate initials from display name or email
  const getInitials = () => {
    const name = user?.displayName || user?.email || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const sizeClass = size === 32 ? 'w-8 h-8' : 'w-9 h-9';
  const textSize = size === 32 ? 'text-sm' : 'text-base';

  if (user?.photoURL && !imageError) {
    return (
      <img
        src={user.photoURL}
        alt={`${user.displayName || user.email}'s avatar`}
        className={`${sizeClass} rounded-full object-cover border border-white/20`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/20`}>
      <span className={`${textSize} font-medium text-white`}>
        {getInitials()}
      </span>
    </div>
  );
}

export default function RoleHeader() {
  const { user, role, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Refs for accessibility
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'founder': return 'Founder';
      case 'vc': return 'VC';
      case 'exchange': return 'Exchange';
      case 'ido': return 'IDO Launchpad';
      case 'influencer': return 'Influencer';
      case 'agency': return 'Agency';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  const getDashboardPath = (role: string) => {
    return `/${role}/dashboard`;
  };

  // Handle keyboard navigation and focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
        userButtonRef.current?.focus();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isUserMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-black border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo Only - Left */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-300">
                <div className="h-48 w-auto flex items-center justify-center">
                  <img 
                    src="/cryptorafts.logo (1).svg" 
                    alt="Cryptorafts Logo" 
                    className="h-full w-auto object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Center Navigation - Desktop Only */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-white hover:text-white/80 transition-colors">
                Home
              </Link>
              <Link href="/features" className="text-white hover:text-white/80 transition-colors">
                Features
              </Link>
            </nav>

            {/* Right Side - User Block or Empty */}
            <div className="flex items-center space-x-4">
              {user && (
                // User Block - Always visible when signed in
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <UserAvatar user={user} size={32} />
                    <span className="hidden md:block text-white font-medium text-sm">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-white/60" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-black border border-white/20 rounded-lg shadow-lg py-1 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                      >
                        Profile
                      </Link>
                      <Link
                        href={`/${role}/settings`}
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/switch-role"
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                      >
                        Switch Role
                      </Link>
                      <Link
                        href="/help"
                        className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                      >
                        Help
                      </Link>
                      <div className="border-t border-white/10 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                        role="menuitem"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Hamburger Menu - Right */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
                aria-expanded={isMobileMenuOpen}
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hamburger Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-24 left-0 right-0 bg-black border-b border-white/10">
            <div className="px-4 py-6 space-y-6">
              {/* Navigation Links */}
              <nav className="space-y-4">
                <Link 
                  href="/" 
                  className="block text-white hover:text-white/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/features" 
                  className="block text-white hover:text-white/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/pricing" 
                  className="block text-white hover:text-white/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/docs" 
                  className="block text-white hover:text-white/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Docs
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-white hover:text-white/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </nav>

              {/* Search */}
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>Search</span>
                  <div className="flex items-center space-x-1 ml-auto">
                    <CommandLineIcon className="h-4 w-4" />
                    <span className="text-xs">K</span>
                  </div>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSearchOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4">
            <div className="bg-black border border-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center space-x-1 text-white/50 text-sm">
                  <CommandLineIcon className="h-4 w-4" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
