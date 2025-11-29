"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase.client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import AnimatedButton from "@/components/ui/AnimatedButton";
import BlockchainCard from "@/components/ui/BlockchainCard";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export default function EnhancedSignupForm() {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle redirect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/role");
    }
  }, [isAuthenticated, router, isRedirecting]);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please try signing in instead.";
      case "auth/weak-password":
        return "Password should be at least 6 characters long.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/operation-not-allowed":
        return "Email/password accounts are not enabled.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSignup(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoadingSignup(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoadingSignup(false);
      return;
    }

    try {
      if (!auth || !db) {
        setError("Service not available");
        setIsLoadingSignup(false);
        return;
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Create user document in Firestore
      await setDoc(doc(db!, "users", user.uid), {
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0],
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: null, // Will be set during role selection
        onboardingComplete: false,
        kycComplete: false,
        kybComplete: false
      });

      console.log("✅ User created successfully:", user.uid);
      router.push("/role");
    } catch (error: any) {
      console.log("ℹ️ Signup error:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoadingSignup(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoadingSignup(true);
    setError("");

    try {
      if (!auth || !db) {
        setError("Service not available");
        setIsLoadingSignup(false);
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user document in Firestore
      await setDoc(doc(db!, "users", user.uid), {
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0],
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: null, // Will be set during role selection
        onboardingComplete: false,
        kycComplete: false,
        kybComplete: false
      });

      console.log("Google signup successful:", user.uid);
      router.push("/role");
    } catch (error: any) {
      console.error("Google signup error:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoadingSignup(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen neo-blue-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen neo-blue-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-blue-background flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md relative z-20">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/cryptorafts.logo.png" 
              alt="Cryptorafts" 
              className="h-16 w-16"
              width={64}
              height={64}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-white/60">Join the future of crypto innovation</p>
        </div>

        {/* Signup Form */}
        <BlockchainCard variant="glass" size="lg">
          <form onSubmit={handleEmailSignup} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-white/40" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                  style={{ 
                    zIndex: 1000, 
                    position: 'relative',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-white/40" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Create a password"
                  style={{ 
                    zIndex: 1000, 
                    position: 'relative',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/40 hover:text-white/60" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/40 hover:text-white/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-white/40" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your password"
                  style={{ 
                    zIndex: 1000, 
                    position: 'relative',
                    pointerEvents: 'auto',
                    cursor: 'text',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-white/40 hover:text-white/60" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-white/40 hover:text-white/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth={true}
              loading={isLoadingSignup}
              disabled={isLoadingSignup}
              icon={<UserIcon className="w-5 h-5" />}
            >
              Create Account
            </AnimatedButton>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">Or continue with</span>
              </div>
            </div>

            {/* Google Signup Button */}
            <AnimatedButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth={true}
              onClick={handleGoogleSignup}
              disabled={isLoadingSignup}
              loading={isLoadingSignup}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.9 0 3.36.78 4.21 1.59l2.002-2.002C17.15 2.44 14.9 1.67 12.24 1.67c-3.62 0-6.7 2.44-7.8 5.77h2.36c1.09-3.33 4.18-5.77 7.8-5.77z"
                  />
                </svg>
              }
            >
              Continue with Google
            </AnimatedButton>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-white/60">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/60 text-sm mb-3">Have an invite code?</p>
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => router.push('/signup-with-invitation')}
                icon={<UserGroupIcon className="w-4 h-4" />}
              >
                Join with Invite Code
              </AnimatedButton>
            </div>
          </div>
        </BlockchainCard>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 text-white/60">
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm">Secure blockchain authentication</span>
          </div>
          <div className="flex items-center space-x-3 text-white/60">
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm">Real-time project tracking</span>
          </div>
          <div className="flex items-center space-x-3 text-white/60">
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm">AI-powered insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
