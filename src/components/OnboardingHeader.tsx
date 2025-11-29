"use client";

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';

export default function OnboardingHeader() {
  const { user } = useAuth();
  const { profile } = useFounderAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Image
              src="/cryptorafts.logo.png"
              alt="Logo"
              width={360}
              height={120}
              className="h-24 w-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>

          {/* Right: Profile Picture + Display Name */}
          <div className="flex items-center space-x-3">
            {profile?.profile_image_url && !profile.profile_image_url.startsWith('uploads/') ? (
              <img
                src={profile.profile_image_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {profile?.displayName?.charAt(0) || user?.displayName?.charAt(0) || 'F'}
                </span>
              </div>
            )}
            <span className="text-white font-medium text-sm">
              {profile?.displayName || user?.displayName || 'Founder'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
