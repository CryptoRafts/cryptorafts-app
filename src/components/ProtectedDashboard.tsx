"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc } from '@/lib/firebase.client';
import { checkOnboardingCompletion, getNextOnboardingStep, UserProfile } from '@/lib/access-control';
import FastLoader from '@/components/ui/FastLoader';

interface ProtectedDashboardProps {
  children: React.ReactNode;
  requiredRole: string;
  fallbackMessage?: string;
}

export default function ProtectedDashboard({ 
  children, 
  requiredRole, 
  fallbackMessage = "Access denied" 
}: ProtectedDashboardProps) {
  const { user, isLoading, claims } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!isLoading && user) {
        try {
          const firestore = db;
          if (!firestore) {
            throw new Error('Firestore not initialized');
          }
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setUserProfile(profileData);
            
            // Check access control
            const accessResult = checkOnboardingCompletion(profileData);
            
            if (!accessResult.allowed) {
              console.log('🔒 Access denied:', accessResult.reason);
              console.log('🎯 Redirecting to:', accessResult.redirectTo);
              
              if (accessResult.redirectTo) {
                router.push(accessResult.redirectTo);
                return;
              }
            }
            
            // Check role match
            if (profileData.role !== requiredRole) {
              console.log('🔒 Role mismatch. Required:', requiredRole, 'User role:', profileData.role);
              router.push('/role');
              return;
            }
            
            console.log('✅ Access granted to dashboard');
          } else {
            console.log('❌ No user document found');
            router.push('/role');
            return;
          }
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          setAccessDenied(true);
        } finally {
          setIsLoadingProfile(false);
        }
      } else if (!isLoading && !user) {
        router.push('/login');
        return;
      }
    }

    loadProfile();
  }, [user, isLoading, router, requiredRole]);

  // Show loading while checking access
  if (isLoading || isLoadingProfile) {
    return (
      <FastLoader 
        message={`Loading ${requiredRole.toUpperCase()} Dashboard...`} 
      />
    );
  }

  // Show access denied if user doesn't have permission
  if (!user || claims?.role !== requiredRole || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            🚫
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">{fallbackMessage}</p>
          <button
            onClick={() => router.push('/role')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Role Selection
          </button>
        </div>
      </div>
    );
  }

  // Final verification before rendering dashboard
  const accessResult = checkOnboardingCompletion(userProfile);
  if (!accessResult.allowed) {
    console.log('🔒 Final access check failed:', accessResult.reason);
    if (accessResult.redirectTo) {
      router.push(accessResult.redirectTo);
      return null;
    }
  }

  // Render the protected dashboard
  return <>{children}</>;
}
