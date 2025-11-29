"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import FeaturedSpotlight from '@/components/FeaturedSpotlight';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function ExplorePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Explore Verified Projects</h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Discover AI-verified crypto projects, launchpads, and investment opportunities
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="neo-glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search projects, founders, or sectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-white/60" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Projects</option>
                <option value="verified">Verified Only</option>
                <option value="funding">Seeking Funding</option>
                <option value="launchpad">Launchpad Ready</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="gaming">Gaming</option>
                <option value="infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="neo-glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <RocketLaunchIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/70 text-sm mb-1">Total Projects</p>
            <p className="text-2xl font-bold text-white">1,247</p>
          </div>
          
          <div className="neo-glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/70 text-sm mb-1">Verified Projects</p>
            <p className="text-2xl font-bold text-white">892</p>
          </div>
          
          <div className="neo-glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/70 text-sm mb-1">Total Funding</p>
            <p className="text-2xl font-bold text-white">$2.5B+</p>
          </div>
          
          <div className="neo-glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <GlobeAltIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/70 text-sm mb-1">Active Launchpads</p>
            <p className="text-2xl font-bold text-white">342</p>
          </div>
        </div>

        {/* Featured Spotlight Section */}
        <FeaturedSpotlight />

        {/* Additional Content Sections */}
        <div className="mt-16 space-y-16">
          {/* Categories */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'DeFi', icon: '💱', count: '324', color: 'from-blue-500 to-cyan-500' },
                { name: 'NFT', icon: '🎨', count: '189', color: 'from-purple-500 to-pink-500' },
                { name: 'Gaming', icon: '🎮', count: '156', color: 'from-green-500 to-emerald-500' },
                { name: 'Infrastructure', icon: '⚡', count: '278', color: 'from-orange-500 to-red-500' },
                { name: 'Social', icon: '👥', count: '98', color: 'from-indigo-500 to-purple-500' },
                { name: 'AI/ML', icon: '🤖', count: '67', color: 'from-pink-500 to-rose-500' },
                { name: 'Privacy', icon: '🔒', count: '43', color: 'from-gray-500 to-slate-500' },
                { name: 'Other', icon: '🌟', count: '92', color: 'from-yellow-500 to-orange-500' }
              ].map((category) => (
                <div 
                  key={category.name}
                  className="neo-glass-card rounded-xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 group"
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">{category.name}</h3>
                    <p className="text-white/60 text-sm">{category.count} projects</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Benefits */}
          <div className="neo-glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Why Choose Verified Projects?</h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                All projects on Cryptorafts undergo rigorous AI-powered verification to ensure authenticity and compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI-Powered Verification</h3>
                <p className="text-white/70">
                  Advanced AI algorithms verify project authenticity, team credentials, and compliance requirements.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">KYC/KYB Compliant</h3>
                <p className="text-white/70">
                  All founders and organizations complete identity and business verification processes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <GlobeAltIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Global Network</h3>
                <p className="text-white/70">
                  Connect with verified investors, launchpads, and partners worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


