"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon, CheckCircleIcon, UserIcon, BoltIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminBypassPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const grantAdminAccess = () => {
    setIsGrantingAccess(true);
    
    // Set admin role
    localStorage.setItem('userRole', 'admin');
    console.log('✅ Admin role granted!');
    
    // Redirect to dashboard
    setTimeout(() => {
      router.replace('/admin/dashboard');
    }, 1000);
  };

  const directAccess = () => {
    // Set admin role and redirect immediately
    localStorage.setItem('userRole', 'admin');
    window.location.href = '/admin/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Preparing admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-300">Get instant admin privileges</p>
          </div>

          <div className="space-y-6">
            {/* Direct Access Button */}
            <button
              onClick={directAccess}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <BoltIcon className="w-5 h-5" />
              Instant Admin Access
            </button>

            {/* Grant Access Button */}
            <button
              onClick={grantAdminAccess}
              disabled={isGrantingAccess}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
            >
              {isGrantingAccess ? (
                <>
                  <LoadingSpinner size="sm" />
                  Granting Access...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Grant Admin Access
                </>
              )}
            </button>

            {/* Console Command Info */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-300 text-sm font-medium mb-2">Console Commands:</p>
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-mono">grantAdminAccess()</p>
                <p className="text-gray-400 text-xs font-mono">clearAdminAccess()</p>
              </div>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                This bypasses all authentication for testing purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}