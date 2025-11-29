'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UniversalDashboardWrapperProps {
  children: React.ReactNode;
  requiredRole: string;
}

export default function UniversalDashboardWrapper({ children, requiredRole }: UniversalDashboardWrapperProps) {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (isLoading) return;
      
      if (!user) {
        console.log('❌ No user authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (!db) {
        console.error('❌ Firebase not initialized');
        setAccessDenied(true);
        setIsLoadingProfile(false);
        return;
      }

      try {
        const dbInstance = db;
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (!userDoc.exists()) {
          console.log('❌ No user document found');
          router.push('/role');
          return;
        }

        const profileData = userDoc.data();
        setUserProfile(profileData);
        
        console.log('🔍 Checking dashboard access for role:', requiredRole);
        console.log('📊 User profile:', {
          role: profileData.role,
          profileCompleted: profileData.profileCompleted,
          kycStatus: profileData.kycStatus,
          kybStatus: profileData.kybStatus,
          emailVerified: profileData.emailVerified
        });
        
        // Step 1: Check role match
        if (profileData.role !== requiredRole) {
          console.log('🔒 Role mismatch. Required:', requiredRole, 'User role:', profileData.role);
          router.push('/role');
          return;
        }
        
        // Step 2: Check if profile is completed
        if (!profileData.profileCompleted) {
          console.log('🔒 Profile not completed, redirecting to registration');
          router.push(`/${requiredRole}/register`);
          return;
        }
        
        // Step 3: Check KYC/KYB verification based on role
        if (['founder', 'influencer'].includes(requiredRole)) {
          // Individual roles require KYC - support both naming conventions
          const kycStatus = profileData.kycStatus || profileData.kyc_status || profileData.kyc?.status || 'not_submitted';
          const kycStatusLower = String(kycStatus).toLowerCase();
          
          console.log('🔍 KYC Status Check:', {
            kycStatus: kycStatus,
            kycStatusLower: kycStatusLower,
            profileData: {
              kycStatus: profileData.kycStatus,
              kyc_status: profileData.kyc_status,
              kyc: profileData.kyc
            }
          });
          
          if (!kycStatus || kycStatusLower === 'not_submitted') {
            console.log('🔒 KYC not submitted, redirecting to KYC page');
            router.push(`/${requiredRole}/kyc`);
            return;
          }
          
          if (kycStatusLower === 'pending' || kycStatusLower === 'submitted') {
            console.log('⏳ KYC pending approval, redirecting to pending page');
            router.push(`/${requiredRole}/pending-approval`);
            return;
          }
          
          if (kycStatusLower === 'rejected') {
            console.log('❌ KYC rejected, redirecting to KYC page to resubmit');
            router.push(`/${requiredRole}/kyc`);
            return;
          }
          
          if (kycStatusLower !== 'approved' && kycStatusLower !== 'verified') {
            console.log('🔒 KYC not approved, redirecting to KYC page');
            router.push(`/${requiredRole}/kyc`);
            return;
          }
        }
        
        if (['vc', 'exchange', 'ido', 'agency'].includes(requiredRole)) {
          // Business roles require KYB (business verification), not KYC - support both naming conventions
          const kybStatus = profileData.kybStatus || profileData.kyb_status || profileData.kyb?.status || 'not_submitted';
          const kybStatusLower = String(kybStatus).toLowerCase();
          
          console.log('🔍 KYB Status Check:', {
            kybStatus: kybStatus,
            kybStatusLower: kybStatusLower,
            profileData: {
              kybStatus: profileData.kybStatus,
              kyb_status: profileData.kyb_status,
              kyb: profileData.kyb
            }
          });
          
          if (!kybStatus || kybStatusLower === 'not_submitted' || kybStatusLower === 'rejected') {
            console.log('🔒 KYB not completed, redirecting to KYB page');
            if (requiredRole === 'vc') {
              router.push('/vc/kyb-minimal');
            } else {
              router.push(`/${requiredRole}/kyb-simple`);
            }
            return;
          }
          
          if (kybStatusLower === 'pending' || kybStatusLower === 'submitted') {
            console.log('⏳ KYB pending approval, redirecting to waiting page');
            if (requiredRole === 'vc') {
              router.push('/vc/kyb-waiting-minimal');
            } else {
              router.push(`/${requiredRole}/kyb-waiting-simple`);
            }
            return;
          }
         
          if (kybStatusLower !== 'approved' && kybStatusLower !== 'verified') {
            console.log('🔒 KYB not approved, redirecting to KYB page');
            if (requiredRole === 'vc') {
              router.push('/vc/kyb-minimal');
            } else {
              router.push(`/${requiredRole}/kyb-simple`);
            }
            return;
          }
        }
        
        console.log('✅ Dashboard access granted for role:', requiredRole);
        
        // For VC role, redirect to main dashboard
        if (requiredRole === 'vc') {
          router.push('/vc/dashboard');
          return;
        }
        
      } catch (err) {
        console.error('❌ Error checking access:', err);
        setAccessDenied(true);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    checkAccess();
  }, [isLoading, user, requiredRole, router]);

  if (isLoading || isLoadingProfile) {
    return <LoadingSpinner />;
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}