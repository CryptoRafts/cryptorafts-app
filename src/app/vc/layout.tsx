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
      const onboardingPages = ['/vc/register', '/vc/kyb', '/vc/pending-approval'];
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
            const kybStatus = (userData.kybStatus || userData.kyb?.status || 'not_submitted').toLowerCase();
            
            // Validate flow: register → kyb → pending-approval
            if (pathname?.includes('/vc/register')) {
              // On register page - allow access
              console.log('🛡️ Allowing access to register page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/vc/kyb')) {
              // On KYB page - only allow if profile is completed
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from KYB page');
                router.push('/vc/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              console.log('🛡️ Allowing access to KYB page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/vc/pending-approval')) {
              // On pending-approval page - only allow if profile completed AND KYB submitted
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from pending-approval');
                router.push('/vc/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kybStatus === 'not_submitted' || !kybStatus) {
                console.log('🛡️ KYB not submitted, redirecting to KYB page from pending-approval');
                router.push('/vc/kyb');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kybStatus === 'approved' || kybStatus === 'verified') {
                console.log('🛡️ KYB already approved, redirecting to dashboard');
                router.push('/vc/dashboard');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              // KYB is pending/submitted/rejected - allow access to pending-approval page
              console.log('🛡️ Allowing access to pending-approval page');
              setChecking(false);
              setHasChecked(true);
              return;
            }
          }
          
          // Default: allow access to onboarding pages
          console.log('🛡️ Allowing access to onboarding page:', pathname);
          setChecking(false);
          setHasChecked(true);
          return;
        } catch (error) {
          console.error('Error validating onboarding flow:', error);
          // On error, allow access to onboarding pages
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
        // FIXED: Wait for Firebase before checking
        const isReady = await waitForFirebase(5000);
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
          // No user doc, redirect to register
          console.log('🛡️ No user document found, redirecting to register');
          setHasChecked(true);
          router.push('/vc/register');
          setChecking(false);
          return;
        }

        const userData = userDoc.data();
        console.log('🛡️ VC User data:', { 
          role: userData.role, 
          profileCompleted: userData.profileCompleted,
          kybStatus: userData.kybStatus || userData.kyb?.status 
        });

        // Step 1: Check if profile is completed
        if (!userData.profileCompleted) {
          console.log('🛡️ Profile not completed, redirecting to register');
          setHasChecked(true);
          router.push('/vc/register');
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
          router.push('/vc/kyb');
          setChecking(false);
          return;
        }

        // If pending or submitted, redirect to pending approval
        if (kybStatus === 'pending' || kybStatus === 'submitted') {
          console.log('🛡️ KYB pending approval, redirecting to pending approval');
          setHasChecked(true);
          router.push('/vc/pending-approval');
          setChecking(false);
          return;
        }

        // If rejected, redirect to KYB page to resubmit
        if (kybStatus === 'rejected') {
          console.log('🛡️ KYB rejected, redirecting to KYB page');
          setHasChecked(true);
          router.push('/vc/kyb');
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
        router.push('/vc/register');
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

export default function VCLayout({
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
