"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SimpleAuthProvider, useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

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
    
    const checkKYBStatus = async () => {
      // FIXED: Don't show loading if auth is still loading - just wait
      if (isLoading) {
        return;
      }
      
      if (!user) {
        setChecking(false);
        setHasChecked(true);
        return;
      }

      // CRITICAL: Allow access to onboarding pages, but validate the flow
      const onboardingPages = ['/exchange/register', '/exchange/kyb', '/exchange/pending-approval'];
      const isOnboardingPage = onboardingPages.some(page => pathname?.includes(page));
      
      if (isOnboardingPage) {
        // Still need to check user data to validate flow
        try {
          // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
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
            const kybStatus = (userData.kybStatus || userData.kyb?.status || 'not_submitted').toLowerCase();
            
            // Validate flow: register → kyb → pending-approval
            if (pathname?.includes('/exchange/register')) {
              console.log('🛡️ Allowing access to register page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/exchange/kyb')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from KYB page');
                router.push('/exchange/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              console.log('🛡️ Allowing access to KYB page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/exchange/pending-approval')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from pending-approval');
                router.push('/exchange/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kybStatus === 'not_submitted' || !kybStatus) {
                console.log('🛡️ KYB not submitted, redirecting to KYB page from pending-approval');
                router.push('/exchange/kyb');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kybStatus === 'approved' || kybStatus === 'verified') {
                console.log('🛡️ KYB already approved, redirecting to dashboard');
                router.push('/exchange/dashboard');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              console.log('🛡️ Allowing access to pending-approval page');
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
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
        if (!isReady) {
          setChecking(false);
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setChecking(false);
          return;
        }

        // Check user's onboarding status
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('🛡️ No user document found, redirecting to register');
          setHasChecked(true);
          router.push('/exchange/register');
          setChecking(false);
          return;
        }

        const userData = userDoc.data();
        console.log('🛡️ Exchange User data:', { 
          role: userData.role, 
          profileCompleted: userData.profileCompleted,
          kybStatus: userData.kybStatus || userData.kyb?.status 
        });

        // Step 1: Check if profile is completed
        if (!userData.profileCompleted) {
          console.log('🛡️ Profile not completed, redirecting to register');
          setHasChecked(true);
          router.push('/exchange/register');
          setChecking(false);
          return;
        }

        // Step 2: Check KYB status
        const kybStatus = (userData.kybStatus || userData.kyb?.status || 'not_submitted').toLowerCase();

        // CRITICAL: If approved, allow access - don't redirect
        if (kybStatus === 'approved') {
          console.log('🛡️ KYB approved, allowing access');
          setHasChecked(true);
          setChecking(false);
          return;
        }

        // If not submitted, redirect to KYB page
        if (kybStatus === 'not_submitted' || !kybStatus) {
          console.log('🛡️ KYB not submitted, redirecting to KYB page');
          setHasChecked(true);
          router.push('/exchange/kyb');
          setChecking(false);
          return;
        }

        // If pending or submitted, redirect to pending approval
        if (kybStatus === 'pending' || kybStatus === 'submitted') {
          console.log('🛡️ KYB pending approval, redirecting to pending approval');
          setHasChecked(true);
          router.push('/exchange/pending-approval');
          setChecking(false);
          return;
        }

        // If rejected, redirect to KYB page to resubmit
        if (kybStatus === 'rejected') {
          console.log('🛡️ KYB rejected, redirecting to KYB page');
          setHasChecked(true);
          router.push('/exchange/kyb');
          setChecking(false);
          return;
        }

        // If approved/verified, allow access to dashboard
        if (kybStatus === 'approved' || kybStatus === 'verified') {
          console.log('🛡️ KYB approved, allowing access');
          setHasChecked(true);
          setChecking(false);
          return;
        }

        // Default: redirect to register if status is unknown
        console.log('🛡️ Unknown KYB status, redirecting to register');
        setHasChecked(true);
        router.push('/exchange/register');
      } catch (error) {
        console.error('Error checking KYB status:', error);
        setHasChecked(true);
      } finally {
        setChecking(false);
      }
    };

    checkKYBStatus();
  }, [user, isLoading, pathname, router, hasChecked]);

  if (checking || isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

export default function ExchangeLayout({
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
