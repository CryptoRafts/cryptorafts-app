"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ensureDb, waitForFirebase, safeFirebaseOperation } from "@/lib/firebase-utils";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        router.push(`/${userRole}/dashboard`);
      } else {
        router.push('/role');
      }
    }
  }, [user, authLoading, router]);

  // Show loading state while checking auth or during signup - FIXED: Black background
  if (authLoading || isLoading) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{
          backgroundColor: '#000000',
          background: '#000000'
        }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4 animate-pulse">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{isLoading ? 'Creating your account...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Don't render signup form if already authenticated - FIXED: Black background
  if (user) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{
          backgroundColor: '#000000',
          background: '#000000'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

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
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;
      
      // Get auth token immediately (ensures token is ready for Firestore rules)
      // Force refresh and wait a bit for token to be fully available
      await user.getIdToken(true); // Force refresh to ensure token is available
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for token propagation
      
      // Wait for Firebase DB to be ready (with shorter retry)
      let dbInstance = null;
      retries = 0;
      const dbMaxRetries = 10; // Reduced from 20 for faster signup
      
      while (!dbInstance && retries < dbMaxRetries) {
        try {
          dbInstance = ensureDb();
          if (dbInstance) break;
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
        retries++;
      }
      
      // Create user document in Firestore with retry logic
      // Use safeFirebaseOperation which handles retries internally
      await safeFirebaseOperation(
        async () => {
          // Ensure DB is ready before each attempt
          const db = ensureDb();
          if (!db) {
            throw new Error('Database not ready');
          }
          // Use user.uid directly - user object from credential is always valid
          // Ensure we're using the correct user ID
          const userId = user.uid;
          if (!userId) {
            throw new Error('User ID is missing');
          }
          return setDoc(doc(db, 'users', userId), {
            email: user.email,
            displayName: user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            role: null,
            profileCompleted: false,
            onboardingComplete: false,
            kycStatus: 'not_submitted',
            kybStatus: 'not_submitted',
            onboardingStep: 'role_selection'
          }, { merge: false }); // Don't merge - create new document
        },
        'Create user document',
        5 // Increased retries for better reliability
      );
      
      // Clear any existing role data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      
      // Small delay to ensure document is written and auth state is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to role selection with full page reload to ensure auth state is updated
      window.location.href = '/role';
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // User-friendly error messages
      let errorMessage = "Signup failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please sign in instead.";
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use a stronger password.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message && error.message.includes('not ready')) {
        errorMessage = "Service is initializing. Please wait a moment and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(authInstance, provider);
      const user = userCredential.user;
      
      // Get auth token immediately (ensures token is ready for Firestore rules)
      // Force refresh and wait a bit for token to be fully available
      await user.getIdToken(true); // Force refresh to ensure token is available
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for token propagation
      
      // Wait for Firebase DB to be ready (with shorter retry)
      let dbInstance = null;
      retries = 0;
      const dbMaxRetries = 10; // Reduced from 20 for faster signup
      
      while (!dbInstance && retries < dbMaxRetries) {
        try {
          dbInstance = ensureDb();
          if (dbInstance) break;
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
        retries++;
      }
      
      // Create or update user document in Firestore with retry logic
      await safeFirebaseOperation(
        async () => {
          // Ensure DB is ready before each attempt
          const db = ensureDb();
          if (!db) {
            throw new Error('Database not ready');
          }
          // Use user.uid directly - user object from credential is always valid
          // Ensure we're using the correct user ID
          const userId = user.uid;
          if (!userId) {
            throw new Error('User ID is missing');
          }
          return setDoc(doc(db, 'users', userId), {
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            role: null,
            profileCompleted: false,
            onboardingComplete: false,
            kycStatus: 'not_submitted',
            kybStatus: 'not_submitted',
            onboardingStep: 'role_selection'
          }, { merge: true });
        },
        'Create/update user document',
        3 // Reduced retries for faster signup
      );
      
      // Clear any existing role data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      
      // Small delay to ensure document is written and auth state is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to role selection with full page reload to ensure auth state is updated
      window.location.href = '/role';
    } catch (error: any) {
      console.error("Google signup error:", error);
      
      // User-friendly error messages
      let errorMessage = "Google signup failed. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups and try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message && error.message.includes('not ready')) {
        errorMessage = "Service is initializing. Please wait a moment and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-black pt-20 sm:pt-24 md:pt-28"
    >
      <div className="max-w-md w-full mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-white/70">Join the future of crypto innovation</p>
        </div>

        {/* Signup Form */}
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
                  autoComplete="new-password"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all duration-200"
                  placeholder="Create a password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all duration-200"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10"
                  style={{ zIndex: 10, pointerEvents: 'auto' }}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                  Creating account...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Create Account
                </>
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
              onClick={handleGoogleSignup}
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

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-cyan-400/70">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-cyan-400/50 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}