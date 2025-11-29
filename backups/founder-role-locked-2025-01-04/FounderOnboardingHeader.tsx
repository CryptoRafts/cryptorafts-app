"use client";

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/providers/AuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';

export default function FounderOnboardingHeader() {
  const { user } = useAuth();
  const { profile } = useFounderAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo */}
          <div className="flex items-center">
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
          </div>

          {/* Right: Profile Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profile?.profile_image_url && !profile.profile_image_url.startsWith('uploads/') ? (
                <Image
                  src={profile.profile_image_url}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20">
                  <span className="text-white text-sm font-semibold">
                    {(profile?.display_name || user?.displayName || 'F').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {profile?.display_name || user?.displayName || 'Founder'}
              </p>
              <p className="text-xs text-gray-400">Identity Verification</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
