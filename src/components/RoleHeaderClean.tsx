"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSimpleAuth, useSimpleAuthActions } from '@/lib/auth-simple';

// Icons
const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MagnifyingGlassIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// Helper functions
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

const getRoleColor = (role: string) => {
  switch (role) {
    case 'founder': return 'bg-blue-500';
    case 'vc': return 'bg-purple-500';
    case 'exchange': return 'bg-green-500';
    case 'ido': return 'bg-red-500';
    case 'influencer': return 'bg-yellow-500';
    case 'agency': return 'bg-indigo-500';
    case 'admin': return 'bg-gray-700';
    default: return 'bg-gray-500';
  }
};

const getRoleDashboardPath = (role: string) => {
  switch (role) {
    case 'founder': return '/founder/dashboard';
    case 'vc': return '/vc/dashboard';
    case 'exchange': return '/exchange/dashboard';
    case 'ido': return '/ido/dashboard';
    case 'influencer': return '/influencer/dashboard';
    case 'agency': return '/agency/dashboard';
    case 'admin': return '/admin/dashboard';
    default: return '/dashboard';
  }
};

export default function RoleHeaderClean() {
  const { user, profile, isAuthed } = useSimpleAuth();
  const { signOut } = useSimpleAuthActions();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28 md:h-32 lg:h-36 xl:h-40">
          {/* Logo - 2x Bigger */}
          <div className="logo-container flex-shrink-0">
            <Link href="/" className="flex items-center hover:opacity-90 transition-all duration-300 hover:scale-105">
              <img
                src="/cryptorafts.logo (1).svg"
                alt="Cryptorafts"
                className="h-[360px] md:h-[396px] lg:h-[432px] xl:h-[468px] w-auto drop-shadow-[0_0_32px_rgba(255,255,255,.15)] filter brightness-110"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Compact Professional Search */}
          <div className="search-container hidden lg:flex">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="actions-container">
            {/* AI Assistant Button - Enhanced */}
            <button className="btn btn-ghost hidden md:flex group relative overflow-hidden">
              <div className="relative">
                <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <span className="hidden xl:block text-sm font-medium group-hover:text-cyan-300 transition-colors duration-300">AI ASSISTANT</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
            </button>

            {/* User Menu - Enhanced */}
            {isAuthed ? (
              <div className="user-menu relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="btn btn-ghost group relative overflow-hidden"
                >
                  <div className={`user-avatar ${getRoleColor(profile?.role || '')} relative group-hover:scale-105 transition-transform duration-300`}>
                    {profile?.role ? (
                      <>
                        <span className="relative z-10">{getRoleDisplayName(profile.role).charAt(0)}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                      </>
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium group-hover:text-blue-300 transition-colors duration-300">
                      {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300">
                      {profile?.role ? getRoleDisplayName(profile.role) : 'No Role'}
                    </div>
                  </div>
                  {/* Dropdown Arrow */}
                  <div className="hidden md:block ml-2">
                    <svg className={`w-4 h-4 text-white/60 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* User Dropdown - Enhanced */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[60] animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className={`w-14 h-14 rounded-full ${getRoleColor(profile?.role || '')} flex items-center justify-center text-white font-semibold text-xl relative`}>
                          {profile?.role ? (
                            <>
                              <span className="relative z-10">{getRoleDisplayName(profile.role).charAt(0)}</span>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                            </>
                          ) : (
                            <UserIcon className="w-7 h-7" />
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-lg">
                            {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-white/60 text-sm">
                            {profile?.role ? getRoleDisplayName(profile.role) : 'No Role'}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-400 ml-2">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href="/profile"
                        className="flex items-center w-full px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-200">
                          <UserIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="ml-3 font-medium">Profile Settings</span>
                        <div className="ml-auto">
                          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-3 py-2 text-white/80 hover:text-white hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
                          <LogoutIcon className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="ml-3 font-medium">Sign Out</span>
                        <div className="ml-auto">
                          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="btn btn-ghost hidden md:flex items-center group"
                >
                  <svg className="w-4 h-4 mr-2 text-white/70 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Log in</span>
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary hidden md:flex items-center group relative overflow-hidden"
                >
                  <svg className="w-4 h-4 mr-2 text-white group-hover:text-blue-100 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Sign up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-all duration-300"></div>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button - Enhanced */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn btn-ghost md:hidden relative group"
              aria-label="Open mobile menu"
            >
              <div className="relative">
                {isMobileMenuOpen ? (
                  <CloseIcon />
                ) : (
                  <>
                    <MenuIcon />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Enhanced */}
      {isMobileMenuOpen && (
        <div className="mobile-menu md:hidden bg-black/95 backdrop-blur-xl border-t border-white/20 z-[60] animate-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-6 space-y-4">
            {isAuthed && profile?.role ? (
              <>
                <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
                  <div className={`w-10 h-10 rounded-full ${getRoleColor(profile?.role || '')} flex items-center justify-center text-white font-semibold`}>
                    {profile?.role ? getRoleDisplayName(profile.role).charAt(0) : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {profile?.role ? getRoleDisplayName(profile.role) : 'No Role'}
                    </p>
                  </div>
                </div>
                
                <Link
                  href={getRoleDashboardPath(profile.role)}
                  className="flex items-center w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-200">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                    </svg>
                  </div>
                  <span className="ml-3 font-medium">Dashboard</span>
                </Link>
                
                <Link
                  href="/profile"
                  className="flex items-center w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-200">
                    <UserIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="ml-3 font-medium">Profile Settings</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-3 text-white/80 hover:text-white hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
                    <LogoutIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="ml-3 font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="btn btn-outline w-full flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary w-full flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay for user menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-[40]"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
