"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, doc, getDoc } from '@/lib/firebase.client';
import { setDoc } from 'firebase/firestore';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { 
  BuildingOfficeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function DepartmentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkDepartmentAccess = async (userId: string, userEmail: string) => {
    console.log('🏢 Checking department access for:', userEmail);

    try {
      if (!db) {
        console.error('Firestore not available');
        return null;
      }
      // Check if user is in departmentMembers collection
      const memberDoc = await getDoc(doc(db!, 'departmentMembers', userId));
      
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        console.log('✅ Department member found:', memberData);

        // Update user document with department info
        await setDoc(doc(db!, 'users', userId), {
          role: 'department_member',
          department: memberData.department,
          departmentRole: memberData.role,
          email: userEmail,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Store in localStorage
        localStorage.setItem('userRole', 'department_member');
        localStorage.setItem('department', memberData.department);
        localStorage.setItem('departmentRole', memberData.role);

        return memberData.department;
      }

      // Check if user has department field in their user document
      const userDoc = await getDoc(doc(db!, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.department) {
          console.log('✅ Department found in user document:', userData.department);
          
          // Store in localStorage
          localStorage.setItem('userRole', 'department_member');
          localStorage.setItem('department', userData.department);
          localStorage.setItem('departmentRole', userData.departmentRole || 'member');

          return userData.department;
        }
      }

      console.log('❌ No department access found');
      return null;
    } catch (error) {
      console.error('Error checking department access:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    console.log('🔐 Department login attempt for:', email);

    try {
      if (!auth) {
        throw new Error('Authentication service unavailable. Please try again shortly.');
      }
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('✅ Firebase auth successful');

      // Check department access
      const department = await checkDepartmentAccess(user.uid, email);

      if (!department) {
        await auth.signOut();
        throw new Error('No department access found for this email. Please contact your admin.');
      }

      console.log('🎉 Department login successful! Redirecting to:', department);

      // Small delay for Firestore
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to department dashboard
      const departmentPath = department.toLowerCase().replace(/\s+/g, '-');
      window.location.href = `/departments/${departmentPath}`;

    } catch (error: any) {
      console.error('❌ Department login error:', error);
      
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    console.log('🔐 Department Google login attempt');

    try {
      if (!auth) {
        throw new Error('Authentication service unavailable. Please try again shortly.');
      }
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      console.log('✅ Google auth successful');

      // Check department access
      const department = await checkDepartmentAccess(user.uid, user.email || '');

      if (!department) {
        await auth.signOut();
        throw new Error('No department access found for this Google account. Please contact your admin.');
      }

      console.log('🎉 Google login successful! Redirecting to:', department);

      // Small delay for Firestore
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to department dashboard
      const departmentPath = department.toLowerCase().replace(/\s+/g, '-');
      window.location.href = `/departments/${departmentPath}`;

    } catch (error: any) {
      console.error('❌ Google login error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen neo-blue-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <BuildingOfficeIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Department Access
          </h1>
          <p className="text-white/70">
            Login to access your assigned department
          </p>
        </div>

        {/* Login Form */}
        <div className="neo-glass-card rounded-2xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="your.email@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-cyan-400 font-semibold text-sm mb-1">
                    Department Members Only
                  </h3>
                  <p className="text-white/70 text-xs">
                    Only users assigned to departments by admin can access this area.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={<BuildingOfficeIcon className="w-5 h-5" />}
            >
              {isSubmitting ? 'Signing In...' : 'Access Department'}
            </AnimatedButton>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900/90 text-white/60">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <AnimatedButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            >
              Sign in with Google
            </AnimatedButton>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-white/40 text-sm">
            Admin? <a href="/admin/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Login as Admin</a>
          </p>
          <p className="text-white/40 text-sm">
            Regular user? <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Go to user login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

