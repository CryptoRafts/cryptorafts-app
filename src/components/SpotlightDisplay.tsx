"use client";

import React, { useState, useEffect } from 'react';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import Link from 'next/link';

interface Spotlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface SpotlightDisplayProps {
  className?: string;
  maxSpotlights?: number;
  showControls?: boolean;
}

// OPTIMIZED: Memoized component to prevent unnecessary re-renders
const SpotlightDisplay = React.memo(function SpotlightDisplay({ 
  className = '', 
  maxSpotlights = 3,
  showControls = true 
}: SpotlightDisplayProps) {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // OPTIMIZED: Load spotlights with faster timeout and no retries
  useEffect(() => {
    // OPTIMIZED: Set loading to false immediately - show UI instantly
    setIsLoading(false);
    setSpotlights([]);
    
    const loadSpotlights = async () => {
      try {
        // FIXED: Longer timeout and retry logic for Firebase initialization
        let isReady = await waitForFirebase(15000);
        
        // Retry once if not ready
        if (!isReady) {
          console.warn('⚠️ Firebase not ready for spotlights, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          isReady = await waitForFirebase(10000);
        }
        
        if (!isReady) {
          console.warn('⚠️ Firebase not initialized after retries. Showing empty spotlight section.');
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.warn('⚠️ Database not initialized. Showing empty spotlight section.');
          return;
        }
        
        console.log('📊 Loading spotlights from Firestore...');
        const spotlightsRef = collection(dbInstance, 'spotlights');
        
        // FIXED: Simplified query to avoid index requirement - filter client-side instead
        // First get all spotlights, then filter and sort client-side
        const simpleQuery = query(spotlightsRef, limit(50)); // Get more than needed, filter client-side
        
        // FIXED: Longer timeout and better error handling
        const queryPromise = getDocs(simpleQuery);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 20000) // Increased to 20 seconds
        );
        
        const snapshot = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        if (!snapshot || !snapshot.docs) {
          console.warn('⚠️ No spotlights found or invalid snapshot');
          return;
        }
        
        console.log(`📊 Found ${snapshot.docs.length} spotlights in Firestore`);
        
        const spotlightsData = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          // Check both isActive and status fields from Firestore
          const isActive = data.isActive !== undefined ? data.isActive : (data.status === 'active');
          return {
            id: doc.id,
            title: data.title || 'Untitled Spotlight',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            link: data.link || '/projects',
            priority: data.priority || 0,
            isActive: isActive,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy || 'admin'
          };
        }) as Spotlight[];
        
        // FIXED: Filter and sort client-side to avoid index requirement
        const activeSpotlights = spotlightsData
          .filter(s => s.isActive === true)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, maxSpotlights);
        
        console.log(`📊 ${activeSpotlights.length} active spotlights after filtering and sorting`);
        
        if (activeSpotlights.length > 0) {
          setSpotlights(activeSpotlights);
          console.log('✅ Spotlights loaded successfully:', activeSpotlights.map(s => s.title));
        } else {
          console.warn('⚠️ No active spotlights found after filtering');
        }
      } catch (error) {
        console.error('❌ Error loading spotlights:', error);
      }
    };

    // Load in background, don't block rendering
    loadSpotlights();
  }, [maxSpotlights]);

  // Auto-rotate spotlights
  useEffect(() => {
    if (spotlights.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % spotlights.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [spotlights.length]);

  const nextSpotlight = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlights.length);
  };

  const prevSpotlight = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlights.length) % spotlights.length);
  };

  // Clear loading state immediately when spotlights are available
  useEffect(() => {
    if (spotlights.length > 0) {
      setIsLoading(false);
    }
  }, [spotlights.length]);

  // CRITICAL: If we have spotlights, show them IMMEDIATELY (don't wait for isLoading)
  // This ensures content appears as soon as data is available
  if (spotlights.length > 0) {
    const currentSpotlight = spotlights[currentIndex];
    
    return (
      <div className={`relative ${className}`}>
        {/* Spotlight Card - Deep Purple Neon */}
        <div className="relative bg-gradient-to-br from-purple-600/30 via-violet-600/30 to-purple-800/30 backdrop-blur-lg border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl">
          {/* Neon Purple Glow Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse opacity-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <NeonCyanIcon type="star" size={24} className="text-purple-300" />
                <span className="text-white font-bold text-sm sm:text-base uppercase tracking-wider">
                  Premium Spotlight
                </span>
              </div>
              {spotlights.length > 1 && (
                <div className="flex items-center gap-1">
                  {spotlights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-yellow-400 w-6' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Text Content */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">
                  {currentSpotlight.title}
                </h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  {currentSpotlight.description}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href={currentSpotlight.link || "/spotlight/apply"}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                  >
                    Apply for Spotlight
                    <NeonCyanIcon type="arrow-right" size={16} className="text-current" />
                  </Link>
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  {currentSpotlight.imageUrl ? (
                    <img
                      src={currentSpotlight.imageUrl}
                      alt={currentSpotlight.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <NeonCyanIcon type="star" size={64} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        {showControls && spotlights.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prevSpotlight}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
              aria-label="Previous spotlight"
            >
              <NeonCyanIcon type="arrow-left" size={20} className="text-current" />
            </button>
            <div className="flex items-center gap-2">
              {spotlights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-yellow-400 scale-125' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to spotlight ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextSpotlight}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
              aria-label="Next spotlight"
            >
              <NeonCyanIcon type="arrow-right" size={20} className="text-white" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // CRITICAL: Never show loading state - always render content immediately
  // This ensures the homepage is always visible, even if Firebase fails
  
  // Show promotional card when no spotlights
  if (spotlights.length === 0) {
    return (
      <div className={`relative ${className}`}>
        {/* Premium Spotlight Promotional Card */}
        <div className="relative bg-gradient-to-br from-purple-600/30 via-violet-600/30 to-purple-800/30 backdrop-blur-lg border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl">
          {/* Neon Purple Glow Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse opacity-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Premium Badge */}
            <div className="flex justify-center mb-6">
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-full px-6 py-2 flex items-center gap-2">
                <NeonCyanIcon type="star" size={20} className="text-purple-300" />
                <span className="text-white font-bold text-sm sm:text-base uppercase tracking-wider">
                  Premium Spotlight
                </span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column - Main Content */}
              <div className="space-y-6">
                {/* Heading */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <NeonCyanIcon type="star" size={48} className="text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-tight">
                    YOUR PROJECT HERE
                  </h2>
                </div>

                {/* Tagline */}
                <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium">
                  Showcase your project to thousands of investors
                </p>

                {/* Description */}
                <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                  Get premium visibility on CryptoRafts homepage. Our spotlight feature puts your project in front of verified investors, VCs, and crypto enthusiasts. Perfect for fundraising, community building, and market exposure.
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-white/70 text-sm sm:text-base">#CryptoRafts</span>
                  <span className="text-white/70 text-sm sm:text-base">#Web3</span>
                  <span className="text-white/70 text-sm sm:text-base">#Startups</span>
                  <span className="text-white/70 text-sm sm:text-base">#VC</span>
                  <span className="text-white/70 text-sm sm:text-base">#KYC</span>
                  <span className="text-white/70 text-sm sm:text-base">#KYB</span>
                  <span className="text-white/70 text-sm sm:text-base">#DueDiligence</span>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-2">
                    <NeonCyanIcon type="check" size={20} className="text-green-400" />
                    <span className="text-white font-semibold text-sm">KYC VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2">
                    <NeonCyanIcon type="check" size={20} className="text-blue-400" />
                    <span className="text-white font-semibold text-sm">KYB VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-2">
                    <NeonCyanIcon type="shield" size={20} className="text-purple-400" />
                    <span className="text-white font-semibold text-sm">RAFTAI VERIFIED</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/spotlight/apply"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-6 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                  >
                    Apply for Spotlight
                    <NeonCyanIcon type="arrow-right" size={20} className="text-white" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 bg-purple-800/50 hover:bg-purple-700/50 border border-purple-500/50 text-white font-semibold px-6 py-4 rounded-xl transition-all hover:scale-105"
                  >
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Right Column - Spotlight Benefits */}
              <div className="bg-purple-700/30 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 space-y-4">
                <h3 className="text-white text-xl sm:text-2xl font-bold mb-6">Spotlight Benefits</h3>
                
                <div className="space-y-4">
                  {/* Premium Visibility */}
                  <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <NeonCyanIcon type="eye" size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base sm:text-lg">Premium Visibility</h4>
                      <p className="text-white/80 text-sm">Top placement on homepage</p>
                    </div>
                  </div>

                  {/* Targeted Audience */}
                  <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <NeonCyanIcon type="users" size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base sm:text-lg">Targeted Audience</h4>
                      <p className="text-white/80 text-sm">Reach verified investors & VCs</p>
                    </div>
                  </div>

                  {/* Analytics & Insights */}
                  <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <NeonCyanIcon type="chart" size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base sm:text-lg">Analytics & Insights</h4>
                      <p className="text-white/80 text-sm">Track engagement metrics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="mt-8 text-center">
              <p className="text-white/80 text-base sm:text-lg">
                Ready to showcase your project?{' '}
                <Link href="/spotlight/apply" className="text-purple-300 hover:text-purple-200 font-semibold inline-flex items-center gap-1 transition-colors">
                  Apply for Spotlight
                  <NeonCyanIcon type="arrow-right" size={16} className="text-purple-300" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSpotlight = spotlights[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Spotlight Card - Deep Purple Neon */}
      <div className="relative bg-gradient-to-br from-purple-600/30 via-violet-600/30 to-purple-800/30 backdrop-blur-lg border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl">
        {/* Neon Purple Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <NeonCyanIcon type="star" size={24} className="text-purple-300" />
              <span className="text-white font-bold text-sm sm:text-base uppercase tracking-wider">
                Premium Spotlight
              </span>
            </div>
            {spotlights.length > 1 && (
              <div className="flex items-center gap-1">
                {spotlights.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-yellow-400 w-6' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Text Content */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">
                {currentSpotlight.title}
              </h3>
              <p className="text-white/80 text-lg leading-relaxed">
                {currentSpotlight.description}
              </p>
              <div className="flex items-center gap-4">
                  <Link
                  href="/spotlight/apply"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                >
                  Apply for Spotlight
                    <NeonCyanIcon type="arrow-right" size={16} className="text-current" />
                  </Link>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                {currentSpotlight.imageUrl ? (
                  <img
                    src={currentSpotlight.imageUrl}
                    alt={currentSpotlight.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <NeonCyanIcon type="star" size={64} className="text-white/20" />
                  </div>
                )}
              </div>
              {/* Image overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {showControls && spotlights.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={prevSpotlight}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
            aria-label="Previous spotlight"
          >
            <NeonCyanIcon type="arrow-left" size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            {spotlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-yellow-400 scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to spotlight ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={nextSpotlight}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
            aria-label="Next spotlight"
          >
            <NeonCyanIcon type="arrow-right" size={20} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
});

export default SpotlightDisplay;
