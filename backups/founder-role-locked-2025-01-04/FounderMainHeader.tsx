"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { 
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function FounderMainHeader() {
  const { user, signOut } = useAuth();
  const { profile } = useFounderAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/founder/dashboard" className="flex items-center">
              <Image
                src="/cryptorafts.logo.png"
                alt="Cryptorafts"
                width={40}
                height={40}
                sizes="40px"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="ml-3 text-xl font-bold text-white">Cryptorafts</span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/founder/dashboard"
              className="text-white hover:text-blue-400 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/founder/projects"
              className="text-white hover:text-blue-400 transition-colors font-medium"
            >
              Projects
            </Link>
            <Link
              href="/founder/deal-rooms"
              className="text-white hover:text-blue-400 transition-colors font-medium"
            >
              Deal Rooms
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* AI Assistant */}
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
              AI Assistant
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {profile?.profile_image_url && !profile.profile_image_url.startsWith('uploads/') ? (
                  <Image
                    src={profile.profile_image_url}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-white/20"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20">
                    <span className="text-white text-sm font-semibold">
                      {(profile?.display_name || user?.displayName || 'F').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-white font-medium hidden sm:block">
                  {profile?.display_name || user?.displayName || 'Founder'}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-xl">
                  <div className="py-2">
                    <Link
                      href="/founder/profile"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/founder/settings"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/founder/billing"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Billing
                    </Link>
                    <hr className="my-2 border-white/10" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/founder/dashboard"
                className="text-white hover:text-blue-400 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/founder/projects"
                className="text-white hover:text-blue-400 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/founder/deal-rooms"
                className="text-white hover:text-blue-400 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Deal Rooms
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
