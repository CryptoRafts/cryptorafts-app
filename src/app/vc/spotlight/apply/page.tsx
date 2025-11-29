'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VCSpotlightApply() {
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    description: '',
    investmentFocus: '',
    portfolioSize: '',
    contactEmail: ''
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Spotlight application submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/vc/dashboard-minimal" className="text-white/80 hover:text-white">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">Apply for Spotlight</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white/80 text-sm">
                {user?.email}
              </span>
              <Link 
                href="/logout"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Get Featured on CryptoRafts</h2>
          <p className="text-gray-400 text-lg">
            Showcase your VC firm to founders and the crypto community
          </p>
        </div>

        {/* Application Form */}
        <div className="bg-gray-800 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter your VC firm name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website *
                </label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://your-website.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Tell us about your VC firm, investment philosophy, and track record..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investment Focus *
                </label>
                <select
                  required
                  value={formData.investmentFocus}
                  onChange={(e) => setFormData({...formData, investmentFocus: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select focus area</option>
                  <option value="defi">DeFi</option>
                  <option value="nft">NFTs & Gaming</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="ai">AI & Machine Learning</option>
                  <option value="web3">Web3 Applications</option>
                  <option value="enterprise">Enterprise Blockchain</option>
                  <option value="general">General Crypto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Portfolio Size
                </label>
                <select
                  value={formData.portfolioSize}
                  onChange={(e) => setFormData({...formData, portfolioSize: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select portfolio size</option>
                  <option value="0-10">0-10 companies</option>
                  <option value="11-25">11-25 companies</option>
                  <option value="26-50">26-50 companies</option>
                  <option value="50+">50+ companies</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="contact@your-vc.com"
              />
            </div>

            {/* Benefits Section */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Spotlight Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <h4 className="text-white font-medium">Increased Visibility</h4>
                    <p className="text-gray-400 text-sm">Get featured on our homepage and platform</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <h4 className="text-white font-medium">Quality Deal Flow</h4>
                    <p className="text-gray-400 text-sm">Access to verified, high-quality projects</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <h4 className="text-white font-medium">Network Access</h4>
                    <p className="text-gray-400 text-sm">Connect with other VCs and industry leaders</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <h4 className="text-white font-medium">Premium Support</h4>
                    <p className="text-gray-400 text-sm">Dedicated account manager and priority support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}