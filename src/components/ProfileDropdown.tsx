"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSimpleAuth, useSimpleAuthActions } from '@/lib/auth-simple';
// Fallback SVG icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowRightOnRectangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = '' }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { user, profile, isAuthed } = useSimpleAuth();
  const { signOut } = useSimpleAuthActions();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (profile?.role === 'admin') return <ShieldCheckIcon className="w-4 h-4" />;
    if (profile?.role === 'founder') return <SparklesIcon className="w-4 h-4" />;
    if (profile?.role === 'vc') return <BuildingOfficeIcon className="w-4 h-4" />;
    if (profile?.role === 'exchange') return <BuildingOfficeIcon className="w-4 h-4" />;
    if (profile?.role === 'ido') return <BuildingOfficeIcon className="w-4 h-4" />;
    if (profile?.role === 'influencer') return <UserGroupIcon className="w-4 h-4" />;
    if (profile?.role === 'agency') return <BuildingOfficeIcon className="w-4 h-4" />;
    return <UserIcon className="w-4 h-4" />;
  };

  const getRoleLabel = () => {
    if (profile?.role === 'admin') return 'Admin';
    if (profile?.role === 'founder') return 'Founder';
    if (profile?.role === 'vc') return 'VC';
    if (profile?.role === 'exchange') return 'Exchange';
    if (profile?.role === 'ido') return 'IDO';
    if (profile?.role === 'influencer') return 'Influencer';
    if (profile?.role === 'agency') return 'Agency';
    return 'User';
  };

  const getDashboardHref = () => {
    if (profile?.role === 'admin') return '/admin/dashboard';
    if (profile?.role === 'founder') return '/founder/dashboard';
    if (profile?.role === 'vc') return '/vc/dashboard';
    if (profile?.role === 'exchange') return '/exchange/dashboard';
    if (profile?.role === 'ido') return '/ido/dashboard';
    if (profile?.role === 'influencer') return '/influencer/dashboard';
    if (profile?.role === 'agency') return '/agency/dashboard';
    return '/dashboard';
  };

  if (!isAuthed || !user) {
    return (
      <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
        <Link 
          href="/login" 
          className="text-sm text-white/80 hover:text-white transition-colors duration-200 px-2 py-1 rounded hover:bg-white/10"
        >
          Log in
        </Link>
        <Link 
          href="/signup" 
          className="px-3 md:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500/30 rounded-lg text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2 p-2"
        aria-label="Profile menu"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
          {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        
        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs">
          {getRoleIcon()}
          <span>{getRoleLabel()}</span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[90vw] bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getRoleIcon()}
                  <span className="text-xs text-blue-400 font-medium">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href={getDashboardHref()}
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="w-4 h-4" />
              View Profile
            </Link>
            
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </Link>

            {(profile?.role === 'admin' || profile?.email === 'anasshamsiggc@gmail.com') && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Sign Out */}
          <div className="py-2">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors duration-200 disabled:opacity-50"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
