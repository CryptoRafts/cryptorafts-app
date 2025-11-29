"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SimpleAuthProvider, useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';
import { checkOnboardingCompletion } from '@/lib/access-control';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // FIXED: Start with false to prevent white screen
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Prevent multiple checks - only check once per session
    if (hasChecked) {
      return;
    }
    
    const checkOnboarding = async () => {
      // FIXED: Don't show loading if auth is still loading - just wait
      if (isLoading) {
        return;
      }
      
      // If no user after auth finishes loading, redirect to login
      if (!user) {
        console.log('🛡️ No user in layout guard, redirecting to login');
        router.push('/login');
        setChecking(false);
        setHasChecked(true);
        return;
      }

      console.log('🛡️ Checking onboarding for user:', user.uid, 'pathname:', pathname);

      // Allow access to onboarding pages and messages, but validate the flow
      const onboardingPages = ['/founder/register', '/founder/kyc', '/founder/pending-approval', '/founder/messages'];
      const isOnboardingPage = onboardingPages.some(page => pathname?.includes(page));
      
      if (isOnboardingPage) {
        // Still need to check user data to validate flow
        try {
          const isReady = await waitForFirebase(5000);
          if (!isReady) {
            setChecking(false);
            setHasChecked(true);
            return;
          }
          
          const dbInstance = ensureDb();
          if (!dbInstance) {
            setChecking(false);
            setHasChecked(true);
            return;
          }

          const userDocRef = doc(dbInstance, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profileCompleted = userData.profileCompleted || false;
            // Check all possible KYC status fields - prioritize actual status values
            let kycStatus = userData.kyc_status || userData.kycStatus || userData.kyc?.status;
            // If no status found but KYC data exists, treat as pending
            if (!kycStatus && (userData.kyc || userData.kycStatus || userData.kyc_status)) {
              kycStatus = 'pending';
            }
            // Default to 'not_submitted' only if truly no KYC data exists
            if (!kycStatus) {
              kycStatus = 'not_submitted';
            }
            const normalizedKycStatus = String(kycStatus).toLowerCase();
            
            // Validate flow: register → kyc → pending-approval
            if (pathname?.includes('/founder/register')) {
              console.log('🛡️ Allowing access to register page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/founder/kyc')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from KYC page');
                router.push('/founder/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              console.log('🛡️ Allowing access to KYC page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/founder/pending-approval')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from pending-approval');
                router.push('/founder/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              // If truly not submitted (no KYC data at all), redirect to KYC page
              if (normalizedKycStatus === 'not_submitted' && 
                  !userData.kyc && !userData.kycStatus && !userData.kyc_status) {
                console.log('🛡️ KYC not submitted, redirecting to KYC page from pending-approval');
                router.push('/founder/kyc');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              // If approved/verified, redirect to dashboard
              if (normalizedKycStatus === 'approved' || normalizedKycStatus === 'verified') {
                console.log('🛡️ KYC already approved, redirecting to dashboard');
                router.push('/founder/dashboard');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              // Allow access if status is pending, submitted, or any other status (including empty if KYC data exists)
              console.log('🛡️ Allowing access to pending-approval page', { normalizedKycStatus, hasKycData: !!(userData.kyc || userData.kycStatus || userData.kyc_status) });
              setChecking(false);
              setHasChecked(true);
              return;
            }
          }
          
          console.log('🛡️ Allowing access to onboarding page:', pathname);
          setChecking(false);
          setHasChecked(true);
          return;
        } catch (error) {
          console.error('Error validating onboarding flow:', error);
          setChecking(false);
          setHasChecked(true);
          return;
        }
      }

      // Check if role selection just happened - clear the flag
      const roleSelectionInProgress = sessionStorage.getItem('roleSelectionInProgress');
      if (roleSelectionInProgress) {
        sessionStorage.removeItem('roleSelectionInProgress');
        sessionStorage.removeItem('selectedRole');
      }

      try {
        // Wait for Firebase to be ready
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          console.log('🛡️ Firebase not ready, allowing access to register page');
          if (pathname !== '/founder/register') {
            router.push('/founder/register');
          }
          setChecking(false);
          return;
        }
        
        // Ensure database is available
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.log('🛡️ Database not available, allowing access to register page');
          if (pathname !== '/founder/register') {
            router.push('/founder/register');
          }
          setChecking(false);
          return;
        }

        // Check user's onboarding status
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (!userDoc.exists()) {
          // No user doc, redirect to register
          console.log('🛡️ No user document found, redirecting to register');
          setHasChecked(true);
          router.push('/founder/register');
          setChecking(false);
          return;
        }

        const userData = userDoc.data();
        console.log('🛡️ User data found:', { 
          role: userData.role, 
          profileCompleted: userData.profileCompleted,
          kycStatus: userData.kycStatus 
        });
        
        // Temporary bypass: if user has role but no profile, allow access to register
        if (userData.role === 'founder' && !userData.profileCompleted) {
          console.log('🛡️ User has founder role but no profile, redirecting to register');
          setHasChecked(true);
          router.push('/founder/register');
          setChecking(false);
          return;
        }
        
        // Allow access to messages page even if KYC is pending (as long as profile is completed)
        if (pathname?.includes('/founder/messages')) {
          if (userData.profileCompleted) {
            console.log('🛡️ Allowing access to messages page');
            setHasChecked(true);
            setChecking(false);
            return;
          } else {
            console.log('🛡️ Profile not completed, redirecting to register from messages');
            setHasChecked(true);
            router.push('/founder/register');
            setChecking(false);
            return;
          }
        }

        const accessResult = checkOnboardingCompletion(userData as any);

        if (!accessResult.allowed && accessResult.redirectTo) {
          console.log('🛡️ Access denied, redirecting to:', accessResult.redirectTo);
          setHasChecked(true);
          router.push(accessResult.redirectTo);
          setChecking(false);
          return;
        }
        
        // All checks passed
        setHasChecked(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setHasChecked(true);
        // On error, allow access to register page
        if (pathname !== '/founder/register') {
          router.push('/founder/register');
        }
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, isLoading, pathname, router, hasChecked]);

  // FIXED: Reduce loading time - show content faster with black background
  if (checking || isLoading) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{
          backgroundColor: '#000000',
          background: '#000000'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleAuthProvider>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
    </SimpleAuthProvider>
  );
}