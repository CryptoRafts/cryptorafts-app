"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

export default function AdminBypassPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Force admin role and redirect to dashboard
    const redirectToAdmin = () => {
      console.log('🚀 FORCING ADMIN ACCESS - Setting admin role...');
      localStorage.setItem('userRole', 'admin');
      
      // Also set a mock user for testing
      const mockUser = {
        email: 'admin@cryptorafts.com',
        uid: 'admin-uid',
        displayName: 'Admin User'
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      
      console.log('✅ Admin role set! Redirecting to admin dashboard...');
      
      // Redirect to comprehensive admin dashboard
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 1000);
    };

    redirectToAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ShieldCheckIcon className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Admin Access Bypass</h1>
        <p className="text-gray-300 mb-6">Forcing admin access to show admin header with all options...</p>
        
        <LoadingSpinner size="lg" message="Setting up admin header..." />
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h3 className="text-white font-semibold mb-3">Admin Header Will Show:</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>✅ Dashboard</p>
            <p>✅ Users</p>
            <p>✅ KYC</p>
            <p>✅ KYB</p>
            <p>✅ Projects</p>
            <p>✅ Spotlights</p>
            <p>✅ Add Spotlight</p>
            <p>✅ Pitch</p>
            <p>✅ Analytics</p>
            <p>✅ Departments</p>
            <p>✅ Audit</p>
            <p>✅ Settings</p>
            <p>✅ Test</p>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Redirecting to: <span className="text-blue-400">/admin/dashboard</span></p>
          <p className="mt-1">You will see the admin header with all navigation options!</p>
        </div>
      </div>
    </div>
  );
}
