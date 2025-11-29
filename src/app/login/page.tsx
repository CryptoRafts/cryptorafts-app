"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useAuth } from "@/providers/SimpleAuthProvider";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  // Check for invitation token in URL or sessionStorage
  const invitationToken = searchParams.get('invitation') || (typeof window !== 'undefined' ? sessionStorage.getItem('pendingInvitationToken') : null);
  const invitationEmail = searchParams.get('email');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // If there's a pending invitation, process it
      if (invitationToken) {
        processInvitationAfterLogin();
        return;
      }
      
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        router.push(`/${userRole}/dashboard`);
      } else {
        router.push('/role');
      }
    }
  }, [user, authLoading, router, invitationToken]);

  const processInvitationAfterLogin = async () => {
    if (!user || !invitationToken) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/team/invitation/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear pending invitation
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingInvitationToken');
        }

        // Redirect based on team type
        const redirectPath = getRedirectPath(data.invitation.teamType);
        router.push(redirectPath);
      } else {
        setError(data.error || 'Failed to process invitation');
      }
    } catch (error: any) {
      console.error('Error processing invitation:', error);
      setError('Failed to process invitation. Please try again.');
    }
  };

  const getRedirectPath = (teamType: string): string => {
    const pathMap: Record<string, string> = {
      vc: '/vc/dashboard',
      founder: '/founder/dashboard',
      exchange: '/exchange/dashboard',
      ido: '/ido/dashboard',
      influencer: '/influencer/dashboard',
      agency: '/agency/dashboard',
    };
    return pathMap[teamType] || '/dashboard';
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-6 animate-pulse">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Ensure auth is initialized - try multiple times with retry
      const { ensureAuth } = await import('@/lib/firebase-utils');
      let authInstance = null;
      let retries = 0;
      const maxRetries = 20; // 20 retries * 250ms = 5 seconds
      
      while (!authInstance && retries < maxRetries) {
        try {
          authInstance = ensureAuth();
          if (authInstance) break;
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 250));
        retries++;
      }
      
      if (!authInstance) {
        throw new Error('Authentication service not ready. Please refresh the page and try again.');
      }
      
      await signInWithEmailAndPassword(authInstance, email, password);
      
      // Clear any existing role data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      
      // Redirect to role selection
      router.push('/role');
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle CORS and network errors specifically
      // CORS errors are usually due to Firebase Auth domain configuration
      // The authDomain in firebase.config should match the authorized domains in Firebase Console
      if (error?.code === 'auth/network-request-failed' ||
          error?.message?.includes('CORS') ||
          error?.message?.includes('cors') ||
          error?.message?.includes('blocked by CORS') ||
          error?.message?.includes('Access-Control-Allow-Origin')) {
        setError('Network error. Please check your internet connection and try again. If the problem persists, the Firebase Auth domain may need to be configured in Firebase Console.');
        setIsLoading(false);
        return;
      }
      
      if (error?.code === 'auth/network-request-failed' || 
          error?.message?.includes('CORS') || 
          error?.message?.includes('network-request-failed') ||
          error?.message?.includes('ERR_FAILED')) {
        setError("Network error. Please check your internet connection and try again. If the problem persists, the authentication service may be temporarily unavailable.");
      } else if (error?.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else if (error?.code === 'auth/wrong-password') {
        setError("Incorrect password.");
      } else if (error?.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error?.code === 'auth/user-disabled') {
        setError("This account has been disabled.");
      } else if (error?.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(error?.message || "An error occurred during login. Please try again.");
      }
      
      // User-friendly error messages
      let errorMessage = "Login failed. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Store invitation token if present
      if (invitationToken && typeof window !== 'undefined') {
        sessionStorage.setItem('pendingInvitationToken', invitationToken);
      }
      // Ensure auth is initialized - try multiple times with retry
      const { ensureAuth } = await import('@/lib/firebase-utils');
      let authInstance = null;
      let retries = 0;
      const maxRetries = 20; // 20 retries * 250ms = 5 seconds
      
      while (!authInstance && retries < maxRetries) {
        try {
          authInstance = ensureAuth();
          if (authInstance) break;
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 250));
        retries++;
      }
      
      if (!authInstance) {
        throw new Error('Authentication service not ready. Please refresh the page and try again.');
      }
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider);
      
      // If there's a pending invitation, process it
      if (invitationToken && typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem('pendingInvitationToken');
        if (storedToken) {
          // Wait a bit for auth state to update, then process invitation
          setTimeout(async () => {
            await processInvitationAfterLogin();
          }, 1000);
          return;
        }
      }
      
      // Clear any existing role data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      
      // Redirect to role selection or dashboard
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        router.push(`/${userRole}/dashboard`);
      } else {
        router.push('/role');
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-black"
    >
      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
      <div className="max-w-md w-full mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70">Sign in to access your crypto ecosystem</p>
        </div>

        {/* Login Form */}
        <div className="bg-black/80 backdrop-blur-lg border-2 border-cyan-400/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/20">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10"
                  style={{ zIndex: 10, pointerEvents: 'auto' }}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-400/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-cyan-400/70">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full mt-4 px-6 py-3 bg-black/60 border-2 border-cyan-400/20 hover:border-cyan-400/50 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-cyan-400/70">
              Don't have an account?{" "}
              <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-cyan-400/50 text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}