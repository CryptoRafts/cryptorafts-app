"use client";
import React from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DocsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access documents.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-3xl p-8 mb-8 border border-cyan-400/20">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                <NeonCyanIcon type="document" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Documents</h1>
                <p className="text-white/80 text-lg">Manage your project documents and files</p>
              </div>
            </div>
          </div>

          {/* Documents Content */}
          <div className="neo-glass-card rounded-2xl p-12 text-center border border-cyan-400/20">
            <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-400/20">
              <NeonCyanIcon type="document" size={40} className="text-cyan-400/70" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Documents Yet</h3>
            <p className="text-cyan-400/70 text-lg mb-8">Upload your project documents to get started. Documents will appear here once uploaded.</p>
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              Upload Documents
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}