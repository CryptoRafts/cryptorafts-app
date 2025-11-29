"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminAccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Click the button below to access the admin panel with all options visible.');

  const accessAdmin = () => {
    setIsLoading(true);
    setMessage('Granting admin access and redirecting...');
    
    // Set admin role
    localStorage.setItem('userRole', 'admin');
    
    // Redirect to admin dashboard
    setTimeout(() => {
      router.push('/admin/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Admin Panel Access</h1>
          <p className="text-gray-300 mb-6">{message}</p>
          
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-semibold mb-2">Admin Features Available:</h3>
            <div className="text-sm text-blue-300 space-y-1">
              <div>• Dashboard with real-time stats</div>
              <div>• Users management</div>
              <div>• KYC document review</div>
              <div>• KYB organization verification</div>
              <div>• Projects management</div>
              <div>• Spotlights management</div>
              <div>• Pitch submissions</div>
              <div>• Analytics & reports</div>
              <div>• System settings</div>
              <div>• Test & debugging tools</div>
            </div>
          </div>
          
          <button
            onClick={accessAdmin}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Accessing Admin Panel...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5" />
                Access Admin Panel
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Direct Admin URLs:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div><a href="/admin/dashboard" className="text-blue-400 hover:underline">/admin/dashboard</a></div>
              <div><a href="/admin/users" className="text-blue-400 hover:underline">/admin/users</a></div>
              <div><a href="/admin/kyc" className="text-blue-400 hover:underline">/admin/kyc</a></div>
              <div><a href="/admin/kyb" className="text-blue-400 hover:underline">/admin/kyb</a></div>
              <div><a href="/admin/projects" className="text-blue-400 hover:underline">/admin/projects</a></div>
              <div><a href="/admin/spotlights" className="text-blue-400 hover:underline">/admin/spotlights</a></div>
              <div><a href="/admin/pitch" className="text-blue-400 hover:underline">/admin/pitch</a></div>
              <div><a href="/admin/analytics" className="text-blue-400 hover:underline">/admin/analytics</a></div>
              <div><a href="/admin/settings" className="text-blue-400 hover:underline">/admin/settings</a></div>
              <div><a href="/admin/test" className="text-blue-400 hover:underline">/admin/test</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
