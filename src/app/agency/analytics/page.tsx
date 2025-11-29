'use client';

import React from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';

export default function AgencyAnalytics() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  Real-time performance insights and metrics
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live data</span>
              </div>
            </div>
          </div>

          {/* Real-time Analytics */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="agency" userId={user.uid} />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
