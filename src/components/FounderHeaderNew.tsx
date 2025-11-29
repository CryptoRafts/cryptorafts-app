"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { onboardingStateManager, OnboardingState } from '@/lib/onboarding-state';
import { 
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { signOut as firebaseSignOut, auth } from '@/lib/firebase.client';

export default function FounderHeaderNew() {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const state = await onboardingStateManager.getOnboardingState();
      setOnboardingState(state);
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  };

  const isOnboardingComplete = onboardingState?.first_pitch === 'approved';
  const currentStep = onboardingState ? onboardingStateManager.getCurrentStep(onboardingState) : '';

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show minimal header during onboarding
  if (!isOnboardingComplete) {
    return (
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            
            {/* Left: Logo */}
            <div className="flex items-center">
              <Image
                src="/cryptorafts.logo.png"
                alt="Cryptorafts"
                width={120}
                height={120}
                sizes="120px"
                className="logo-3x"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="ml-3 text-xl font-bold text-white">Cryptorafts</span>
            </div>

            {/* Right: User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.displayName || 'Founder'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email}
                </p>
              </div>
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20">
                  <span className="text-white text-sm font-semibold">
                    {(user?.displayName || user?.email || 'F').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Show full header after onboarding completion
  return (
    <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Image
              src="/cryptorafts.logo.png"
              alt="Cryptorafts"
              width={120}
              height={120}
              style={{ width: 'auto', height: 'auto' }}
              sizes="120px"
              className="logo-3x"
              priority
            />
            <span className="ml-3 text-xl font-bold text-white">Cryptorafts</span>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/founder/dashboard" className="text-white hover:text-blue-400 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/founder/projects" className="text-white hover:text-blue-400 transition-colors font-medium">
              Projects
            </Link>
            <Link href="/founder/messages" className="text-white hover:text-blue-400 transition-colors font-medium">
              Messages
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20">
                    <span className="text-white text-sm font-semibold">
                      {(user?.displayName || user?.email || 'F').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium">
                  {user?.displayName || 'Founder'}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-white/10 py-2 z-50">
                  <Link
                    href="/founder/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/founder/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors w-full text-left"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <nav className="space-y-2">
              <Link
                href="/founder/dashboard"
                className="block px-4 py-2 text-white hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/founder/projects"
                className="block px-4 py-2 text-white hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/founder/messages"
                className="block px-4 py-2 text-white hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
