"use client";

import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VCTestPage() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && claims?.role === 'vc') {
      console.log('✅ VC Test: User authenticated as VC');
      console.log('User:', user.email);
      console.log('Claims:', claims);
    }
  }, [isLoading, user, claims]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Authenticated</h1>
          <p className="text-white/60 mb-4">Please log in to access VC features</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (claims?.role !== 'vc') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-4">This page is for VCs only</p>
          <p className="text-white/40 text-sm">Your role: {claims?.role || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🎉 VC Test Page - Working!</h1>
          <p className="text-white/60">VC authentication is working correctly</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {claims?.role}</p>
              <p><strong>User ID:</strong> {user.uid}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">VC Features Test</h2>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/vc/dashboard')}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go to VC Dashboard
              </button>
              <button
                onClick={() => router.push('/vc/register')}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Go to VC Registration
              </button>
              <button
                onClick={() => router.push('/vc/kyb')}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Go to VC KYB
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
