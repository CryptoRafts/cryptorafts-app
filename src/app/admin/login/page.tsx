"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in as admin
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'admin') {
                console.log('✅ Already logged in as admin, redirecting...');
                setUser(user);
                // Use window.location for hard redirect
                window.location.href = '/admin/dashboard';
              }
            }
          });
          
          // Cleanup subscription
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!auth) {
        alert('Authentication not available');
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
      const userEmail = email.toLowerCase();
      if (userEmail !== 'anasshamsiggc@gmail.com') {
        setError('Access Denied: Only authorized admin can access this panel.');
        await auth.signOut();
        return;
      }
      
      localStorage.setItem('userRole', 'admin');
      router.replace('/admin/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      if (!auth) {
        setError('Authentication not available. Please refresh the page.');
        setIsGoogleLoading(false);
        return;
      }
      
      console.log('[ADMIN] Admin Google login attempt');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Firebase user authenticated:', user.email);
      
      // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
      const userEmail = user.email?.toLowerCase() || '';
      if (userEmail !== 'anasshamsiggc@gmail.com') {
        setError('Access Denied: Only authorized admin can access this panel.');
        await auth.signOut();
        setIsGoogleLoading(false);
        return;
      }
      
      localStorage.setItem('userRole', 'admin');
      console.log('✅ [ADMIN SUCCESS] Authorized admin access verified');
      
      // Use window.location for hard redirect to ensure it works
      // Small delay to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/admin/dashboard';
      
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      // Better error handling
      let errorMessage = 'Google sign-in failed';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized. Please add this domain to Firebase Console.';
        console.error('🚫 DOMAIN NOT AUTHORIZED - Add to Firebase Console:');
        console.error('   https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-300">Sign in to access the admin panel</p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 border border-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-3 font-semibold"
            >
              {isGoogleLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                'Sign In with Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-400 text-xs font-medium">
                🔐 Admin Access: Only authorized admin email can access this panel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}