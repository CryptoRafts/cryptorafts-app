"use client";

import React from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DealRoomsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-white/60">Please sign in to access deal rooms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Deal Rooms</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">No deal rooms available. Deal rooms will appear here when you have active investment opportunities.</p>
        </div>
      </div>
    </div>
  );
}
