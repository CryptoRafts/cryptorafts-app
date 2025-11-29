"use client";

import { useSimpleAuth, useSimpleAuthActions } from '@/lib/auth-simple';
import { useState } from 'react';

export default function AuthStatus() {
  const { user, profile, loading, isAuthed } = useSimpleAuth();
  const { signOut } = useSimpleAuthActions();
  const [showDetails, setShowDetails] = useState(false);

  // Hide debug badges in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null;
  }

  if (loading) {
    return (
      <div 
        className="auth-status bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-white text-sm shadow-lg"
        data-auth-status="loading"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div 
        className="auth-status bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-white text-sm shadow-lg"
        data-auth-status="not-authenticated"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span>Not authenticated</span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2 text-blue-400 hover:text-blue-300 text-xs"
          >
            {showDetails ? 'Hide' : 'Debug'}
          </button>
        </div>
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
            <div>User: {user ? user.email : 'None'}</div>
            <div>Profile: {profile ? profile.role || 'No role' : 'None'}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="auth-status bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-white text-sm shadow-lg"
      data-auth-status="authenticated"
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        <span className="max-w-xs truncate">Authenticated as {user?.email}</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2 text-blue-400 hover:text-blue-300 text-xs flex-shrink-0"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60 space-y-1">
          <div>Role: {profile?.role || 'No role'}</div>
          <div>KYC: {profile?.kycStatus || 'Unknown'}</div>
          <div>KYB: {profile?.kybStatus || 'Unknown'}</div>
          <div>Step: {profile?.onboardingStep || 'Unknown'}</div>
          <button
            onClick={signOut}
            className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs hover:bg-red-500/30"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
