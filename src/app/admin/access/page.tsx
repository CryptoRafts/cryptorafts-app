"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminAccessPage() {
  const [email, setEmail] = useState('admin@cryptorafts.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in as admin
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'admin') {
                router.replace('/admin/dashboard');
              }
            }
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!auth) {
        setError('Authentication not available');
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Set admin role
      localStorage.setItem('userRole', 'admin');
      setSuccess('Admin access granted! Redirecting...');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.replace('/admin/dashboard');
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = () => {
    setEmail('admin@cryptorafts.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-300">Get admin privileges to access the admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@cryptorafts.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <KeyIcon className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Getting Admin Access...
                </>
              ) : (
                'Get Admin Access'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleQuickAccess}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Use Demo Credentials
            </button>
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-gray-300 text-sm font-medium mb-2">Demo Admin Credentials:</p>
              <p className="text-gray-400 text-xs">
                Email: admin@cryptorafts.com<br />
                Password: admin123
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">
              This is a demo admin access page for testing purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
