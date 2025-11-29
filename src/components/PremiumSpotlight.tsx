"use client";

import React, { useState, useEffect } from 'react';
import { SpotlightService } from '@/lib/spotlight-service';
import { SpotlightApplication } from '@/lib/spotlight-types';
import { useRouter } from 'next/navigation';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function PremiumSpotlight() {
  const [spotlight, setSpotlight] = useState<SpotlightApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // REAL-TIME: Fetch active premium spotlight with live updates
  useEffect(() => {
    console.log('🌟 [HOMEPAGE] Setting up real-time spotlight listener');
    
    // Set up real-time listener for spotlight changes
    const unsubscribe = SpotlightService.listenToApplications((apps) => {
      console.log('📡 [HOMEPAGE] Real-time spotlight update received', apps.length);
      
      // Find active premium spotlight
      const now = new Date();
      const activeSpotlights = apps.filter(a => 
        a.status === 'approved' && 
        a.slotType === 'premium' &&
        new Date(a.startDate) <= now && 
        new Date(a.endDate) >= now
      );

      if (activeSpotlights.length > 0) {
        const premium = activeSpotlights.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0];
        setSpotlight(premium);
        console.log('✅ [HOMEPAGE] Premium spotlight updated:', premium.projectName);
      } else {
        setSpotlight(null);
        console.log('ℹ️ [HOMEPAGE] No active premium spotlight');
      }
      
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔌 [HOMEPAGE] Unsubscribing from spotlight listener');
      unsubscribe();
    };
  }, []);

  // Handle spotlight click
  const handleSpotlightClick = async () => {
    if (!spotlight) return;

    try {
      // Track click
      await SpotlightService.trackClick(spotlight.id);
      
      // Navigate to project profile (internal)
      router.push(`/project/${spotlight.projectId}`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 sm:px-6 py-2">
            <NeonCyanIcon type="star" size={20} className="text-purple-400" />
            <span className="text-purple-400 font-bold text-xs sm:text-sm">PREMIUM SPOTLIGHT</span>
          </div>
        </div>
        <div className="w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-purple-500/20 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-sm sm:text-base">Loading spotlight...</div>
          </div>
        </div>
      </div>
    );
  }

  // Always show spotlight section - with fallback if no active spotlight
  if (!spotlight) {
    return (
      <div className="relative w-full">
        {/* Premium Spotlight Badge */}
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 sm:px-6 py-2">
            <NeonCyanIcon type="star" size={20} className="text-purple-400" />
            <span className="text-purple-400 font-bold text-xs sm:text-sm">PREMIUM SPOTLIGHT</span>
          </div>
        </div>

        {/* Fallback Spotlight Banner */}
        <div className="relative w-full h-auto min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[420px] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-purple-500/20">
          {/* Background Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center py-8 sm:py-10 md:py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
                {/* Left: Main Content */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
                  {/* Logo and Project Name */}
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/40 shadow-xl">
                        <NeonCyanIcon type="star" size={40} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1 sm:mb-2">
                        YOUR PROJECT HERE
                      </h2>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium">
                        Showcase your project to thousands of investors
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-4">
                    Get premium visibility on CryptoRafts homepage. Our spotlight feature puts your project in front of verified investors, VCs, and crypto enthusiasts. Perfect for fundraising, community building, and market exposure.
                  </p>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                    <span className="text-white/60 text-xs sm:text-sm">#CryptoRafts</span>
                    <span className="text-white/60 text-xs sm:text-sm">#Web3</span>
                    <span className="text-white/60 text-xs sm:text-sm">#Startups</span>
                    <span className="text-white/60 text-xs sm:text-sm">#VC</span>
                    <span className="text-white/60 text-xs sm:text-sm">#KYC</span>
                    <span className="text-white/60 text-xs sm:text-sm">#KYB</span>
                    <span className="text-white/60 text-xs sm:text-sm">#DueDiligence</span>
                  </div>

                  {/* Verification Badges */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-green-500 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                      <NeonCyanIcon type="shield" size={16} className="text-white" />
                      <span className="text-white font-bold text-[10px] sm:text-xs">KYC VERIFIED</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-blue-600 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                      <NeonCyanIcon type="shield" size={16} className="text-white" />
                      <span className="text-white font-bold text-[10px] sm:text-xs">KYB VERIFIED</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 bg-purple-600 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                      <NeonCyanIcon type="shield" size={16} className="text-white" />
                      <span className="text-white font-bold text-[10px] sm:text-xs">RAFTAI VERIFIED</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <a 
                      href="/spotlight/apply" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl hover:scale-105 text-center"
                    >
                      <span className="text-xs sm:text-sm">Apply for Spotlight</span>
                      <NeonCyanIcon type="arrow-right" size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    
                    <a 
                      href="/signup"
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20 hover:border-white/30 text-center"
                    >
                      <span className="text-xs sm:text-sm">Get Started</span>
                    </a>
                  </div>
                </div>

                {/* Right: Benefits */}
                <div className="lg:col-span-4 xl:col-span-3">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-center">Spotlight Benefits</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-bold text-xs sm:text-sm">👁</span>
                        </div>
                        <span className="text-white font-medium flex-1 text-xs sm:text-sm">Premium Visibility</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold text-xs sm:text-sm">🎯</span>
                        </div>
                        <span className="text-white font-medium flex-1 text-xs sm:text-sm">Targeted Audience</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-400 font-bold text-xs sm:text-sm">📈</span>
                        </div>
                        <span className="text-white font-medium flex-1 text-xs sm:text-sm">Analytics & Insights</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apply for Spotlight CTA */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center space-x-2 text-white/70 text-sm">
            <span>Ready to showcase your project?</span>
            <a 
              href="/spotlight/apply" 
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Apply for Spotlight →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Premium Spotlight Badge */}
      <div className="flex items-center justify-center mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 sm:px-6 py-2">
          <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          <span className="text-purple-400 font-bold text-xs sm:text-sm">PREMIUM SPOTLIGHT</span>
        </div>
      </div>

      {/* Main Spotlight Banner */}
      <div 
        className="relative w-full h-auto min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[420px] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl"
        onClick={handleSpotlightClick}
      >
        {/* Background Banner Image */}
        <div className="absolute inset-0">
          <img
            src={spotlight.bannerUrl}
            alt={spotlight.projectName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        </div>

        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center py-8 sm:py-10 md:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
              {/* Left: Main Content with Logo */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
                {/* Logo and Project Name */}
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <div className="flex-shrink-0">
                    <img
                      src={spotlight.logoUrl}
                      alt={spotlight.projectName}
                      className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl object-cover border-2 border-white/40 shadow-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80/06b6d4/ffffff?text=Logo';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1 sm:mb-2">
                      {spotlight.projectName.toUpperCase()}
                    </h2>
                    <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium">
                      {spotlight.tagline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-4">
                  {spotlight.description}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  <span className="text-white/60 text-xs sm:text-sm">#CryptoRafts</span>
                  <span className="text-white/60 text-xs sm:text-sm">#Web3</span>
                  <span className="text-white/60 text-xs sm:text-sm">#Startups</span>
                  <span className="text-white/60 text-xs sm:text-sm">#VC</span>
                  <span className="text-white/60 text-xs sm:text-sm">#KYC</span>
                  <span className="text-white/60 text-xs sm:text-sm">#KYB</span>
                  <span className="text-white/60 text-xs sm:text-sm">#DueDiligence</span>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 bg-green-500 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <span className="text-white font-bold text-[10px] sm:text-xs">KYC VERIFIED</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 bg-blue-600 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <span className="text-white font-bold text-[10px] sm:text-xs">KYB VERIFIED</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 bg-purple-600 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <span className="text-white font-bold text-[10px] sm:text-xs">RAFTAI VERIFIED</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl hover:scale-105">
                    <span className="text-xs sm:text-sm">View Project</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  {spotlight.website && (
                    <a 
                      href={spotlight.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20 hover:border-white/30"
                    >
                      <span className="text-xs sm:text-sm">Visit Website</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Right: Social Links */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-center">Connect With Us</h3>
                  {spotlight.socialLinks && (
                    <div className="space-y-2 sm:space-y-3">
                      {spotlight.socialLinks.twitter && (
                        <a 
                          href={spotlight.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all duration-300 group border border-white/10 hover:border-white/20"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-400 font-bold text-xs sm:text-sm">T</span>
                          </div>
                          <span className="text-white font-medium flex-1 text-xs sm:text-sm">Twitter</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
                        </a>
                      )}
                      {spotlight.socialLinks.telegram && (
                        <a 
                          href={spotlight.socialLinks.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all duration-300 group border border-white/10 hover:border-white/20"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-cyan-400 font-bold text-xs sm:text-sm">T</span>
                          </div>
                          <span className="text-white font-medium flex-1 text-xs sm:text-sm">Telegram</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
                        </a>
                      )}
                      {spotlight.socialLinks.discord && (
                        <a 
                          href={spotlight.socialLinks.discord}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all duration-300 group border border-white/10 hover:border-white/20"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-400 font-bold text-xs sm:text-sm">D</span>
                          </div>
                          <span className="text-white font-medium flex-1 text-xs sm:text-sm">Discord</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply for Spotlight CTA */}
      <div className="text-center mt-4 sm:mt-6">
        <div className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-white/70 text-xs sm:text-sm">
          <span>Want to showcase your project?</span>
          <a 
            href="/spotlight/apply" 
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Apply for Spotlight →
          </a>
        </div>
      </div>
    </div>
  );
}
