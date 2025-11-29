"use client";

import React, { useState, useEffect } from 'react';
import { SpotlightService } from '@/lib/spotlight-service';
import { SpotlightApplication } from '@/lib/spotlight-types';
import { useRouter } from 'next/navigation';
import {
  StarIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function FeaturedSpotlight() {
  const [spotlights, setSpotlights] = useState<SpotlightApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Fetch active featured spotlights
  useEffect(() => {
    const fetchFeaturedSpotlights = async () => {
      try {
        const { featured } = await SpotlightService.getActiveSpotlights();
        setSpotlights(featured);
      } catch (error) {
        console.error('Error fetching featured spotlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedSpotlights();
  }, []);

  // Track impressions for each spotlight
  useEffect(() => {
    spotlights.forEach(spotlight => {
      if (!impressionTracked.has(spotlight.id)) {
        SpotlightService.trackImpression(spotlight.id);
        setImpressionTracked(prev => new Set([...prev, spotlight.id]));
      }
    });
  }, [spotlights, impressionTracked]);

  // Handle spotlight click
  const handleSpotlightClick = async (spotlight: SpotlightApplication) => {
    try {
      // Track click
      await SpotlightService.trackClick(spotlight.id);
      
      // Navigate to project profile (internal)
      router.push(`/project/${spotlight.projectId}`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  // Handle profile view
  const handleProfileView = async (spotlightId: string) => {
    try {
      await SpotlightService.trackProfileView(spotlightId);
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="neo-glass-card rounded-2xl p-6 animate-pulse">
            <div className="h-48 bg-white/10 rounded-xl mb-4" />
            <div className="h-4 bg-white/10 rounded mb-2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (spotlights.length === 0) {
    return null; // Don't render if no active featured spotlights
  }

  return (
    <div className="space-y-8">
      {/* Featured Spotlight Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-6 py-2 mb-4">
          <NeonCyanIcon type="star" size={20} className="text-blue-400" />
          <span className="text-blue-400 font-bold text-sm">FEATURED SPOTLIGHTS</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verified Projects</h2>
        <p className="text-white/70">
          Discover AI-verified projects showcased by our community
        </p>
      </div>

      {/* Featured Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spotlights.map((spotlight) => (
          <div 
            key={spotlight.id}
            className="neo-glass-card rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10 hover:border-blue-500/30"
            onClick={() => handleSpotlightClick(spotlight)}
            onMouseEnter={() => handleProfileView(spotlight.id)}
          >
            {/* Banner Image */}
            <div className="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                src={spotlight.bannerUrl}
                alt={spotlight.projectName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  // Fallback to gradient background
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Featured Badge */}
              <div className="absolute top-3 left-3">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  FEATURED
                </div>
              </div>

              {/* Logo */}
              <div className="absolute bottom-3 left-3">
                <img
                  src={spotlight.logoUrl}
                  alt={spotlight.projectName}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-white/20"
                />
              </div>
            </div>

            {/* Project Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{spotlight.projectName}</h3>
                <p className="text-white/70 text-sm">{spotlight.tagline}</p>
              </div>

              {/* Description */}
              <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                {spotlight.description}
              </p>

              {/* Verification Badges */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
                  <NeonCyanIcon type="shield" size={12} className="text-green-400" />
                  <span className="text-green-400 text-xs font-medium">KYC</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-1">
                  <NeonCyanIcon type="shield" size={12} className="text-blue-400" />
                  <span className="text-blue-400 text-xs font-medium">KYB</span>
                </div>
                <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-2 py-1">
                  <span className="text-purple-400 text-xs font-medium">✅ RAFTAI</span>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-white/60">
                  <EyeIcon className="w-4 h-4" />
                  <span>{spotlight.impressions.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1 text-white/60">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>{Math.ceil((new Date(spotlight.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left</span>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group">
                <span>View Project</span>
                <NeonCyanIcon type="arrow-right" size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apply for Featured Spotlight CTA */}
      <div className="text-center">
        <div className="neo-glass-card rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Want to be featured?</h3>
            <p className="text-white/70">
              Apply for Featured Spotlight and get your verified project in front of thousands of investors and founders.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a 
                href="/spotlight/apply" 
                className="btn-success px-6 py-3"
              >
                Apply for Featured Spotlight
              </a>
              <span className="text-white/50 text-sm">Starting at $150/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

