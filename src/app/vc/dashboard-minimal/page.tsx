'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VCDashboardMinimal() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">VC Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white/80 text-sm">
                Welcome, {user?.email}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to Your VC Dashboard
          </h2>
          <p className="text-white/90">
            Manage your investments, track deals, and connect with founders.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Apply for Spotlight */}
          <Link href="/vc/spotlight/apply">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Apply for Spotlight</h3>
                  <p className="text-gray-400 text-sm">Get featured on our platform</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Add Team */}
          <Link href="/vc/team">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Team</h3>
                  <p className="text-gray-400 text-sm">Manage your team members</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Portfolio */}
          <Link href="/vc/portfolio">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Portfolio</h3>
                  <p className="text-gray-400 text-sm">View your investments</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Pipeline Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Investment Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pipeline Stages */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">KYB</h4>
              <div className="text-2xl font-bold text-blue-400">✅</div>
              <p className="text-gray-400 text-xs">Completed</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Due Diligence</h4>
              <div className="text-2xl font-bold text-yellow-400">⏳</div>
              <p className="text-gray-400 text-xs">In Progress</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Company Check</h4>
              <div className="text-2xl font-bold text-gray-400">⏸️</div>
              <p className="text-gray-400 text-xs">Pending</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Token Audit</h4>
              <div className="text-2xl font-bold text-gray-400">⏸️</div>
              <p className="text-gray-400 text-xs">Pending</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <div>
                <p className="text-white text-sm">KYB verification completed</p>
                <p className="text-gray-400 text-xs">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-sm">📝</span>
              </div>
              <div>
                <p className="text-white text-sm">Profile setup completed</p>
                <p className="text-gray-400 text-xs">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}