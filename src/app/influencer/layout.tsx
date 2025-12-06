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
    // FIXED: Allow project pages to bypass guard checks initially to prevent 404s
    const isProjectPage = pathname?.includes('/influencer/project/') || 
                          pathname?.includes('/influencer/dashboard') || 
                          pathname?.includes('/influencer/dealflow') ||
                          pathname?.includes('/influencer/campaigns') ||
                          pathname?.includes('/influencer/messages') ||
                          pathname?.includes('/influencer/settings') ||
                          pathname?.includes('/influencer/analytics');
    
    // For project pages, skip guard checks to allow immediate rendering
    if (isProjectPage && user) {
      setChecking(false);
      setHasChecked(true);
      return;
    }
    
    // Prevent multiple checks - only check once per session
    if (hasChecked) {
      return;
    }
    
    const checkKYCStatus = async () => {
      // FIXED: Don't show loading if auth is still loading - just wait
      if (isLoading) {
        return;
      }
      
      if (!user) {
        setChecking(false);
        setHasChecked(true);
        return;
      }

      // CRITICAL: Allow access to onboarding pages and project pages, but validate the flow
      const onboardingPages = ['/influencer/register', '/influencer/kyc', '/influencer/pending-approval'];
      const projectPages = ['/influencer/project/', '/influencer/dashboard', '/influencer/dealflow', '/influencer/campaigns', '/influencer/messages', '/influencer/settings', '/influencer/analytics'];
      const isOnboardingPage = onboardingPages.some(page => pathname?.includes(page));
      const isProjectPage = projectPages.some(page => pathname?.includes(page));
      
      // Allow project pages if user is approved
      if (isProjectPage) {
        try {
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
            const kycStatus = (userData.kycStatus || userData.kyc?.status || userData.kyc_status || 'not_submitted').toLowerCase();
            
            // Allow access to project pages if KYC is approved
            if (kycStatus === 'approved' || kycStatus === 'verified') {
              console.log('🛡️ KYC approved, allowing access to project page');
              setChecking(false);
              setHasChecked(true);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking access for project page:', error);
          // Allow access on error to prevent blocking
          setChecking(false);
          setHasChecked(true);
          return;
        }
      }
      
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
            const kycStatus = (userData.kycStatus || userData.kyc?.status || userData.kyc_status || 'not_submitted').toLowerCase();
            
            // Validate flow: register → kyc → pending-approval
            if (pathname?.includes('/influencer/register')) {
              console.log('🛡️ Allowing access to register page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/influencer/kyc')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from KYC page');
                router.push('/influencer/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              console.log('🛡️ Allowing access to KYC page');
              setChecking(false);
              setHasChecked(true);
              return;
            } else if (pathname?.includes('/influencer/pending-approval')) {
              if (!profileCompleted) {
                console.log('🛡️ Profile not completed, redirecting to register from pending-approval');
                router.push('/influencer/register');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kycStatus === 'not_submitted' || !kycStatus) {
                console.log('🛡️ KYC not submitted, redirecting to KYC page from pending-approval');
                router.push('/influencer/kyc');
                setChecking(false);
                setHasChecked(true);
                return;
              }
              if (kycStatus === 'approved' || kycStatus === 'verified') {
                console.log('🛡️ KYC already approved, redirecting to dashboard');
                router.push('/influencer/dashboard');
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
          console.log('🛡️ No user document found, redirecting to register');
          setHasChecked(true);
          router.push('/influencer/register');
          setChecking(false);
          return;
        }

        const userData = userDoc.data();
        console.log('🛡️ Influencer User data:', { 
          role: userData.role, 
          profileCompleted: userData.profileCompleted,
          kycStatus: userData.kycStatus || userData.kyc?.status 
        });

        // Step 1: Check if profile is completed
        if (!userData.profileCompleted) {
          console.log('🛡️ Profile not completed, redirecting to register');
          setHasChecked(true);
          router.push('/influencer/register');
          setChecking(false);
          return;
        }

        // Step 2: Check KYC status
        const kycStatus = (userData.kycStatus || userData.kyc?.status || 'not_submitted').toLowerCase();

        // CRITICAL: If approved, allow access - don't redirect
        if (kycStatus === 'approved') {
          console.log('🛡️ KYC approved, allowing access');
          setHasChecked(true);
          setChecking(false);
          return;
        }

        // If not submitted, redirect to KYC page
        if (kycStatus === 'not_submitted' || !kycStatus) {
          console.log('🛡️ KYC not submitted, redirecting to KYC page');
          setHasChecked(true);
          router.push('/influencer/kyc');
          setChecking(false);
          return;
        }

        // If pending or submitted, redirect to pending approval
        if (kycStatus === 'pending' || kycStatus === 'submitted') {
          console.log('🛡️ KYC pending approval, redirecting to pending approval');
          setHasChecked(true);
          router.push('/influencer/pending-approval');
          setChecking(false);
          return;
        }

        // If rejected, redirect to KYC page to resubmit
        if (kycStatus === 'rejected') {
          console.log('🛡️ KYC rejected, redirecting to KYC page');
          setHasChecked(true);
          router.push('/influencer/kyc');
          setChecking(false);
          return;
        }

        // If approved/verified, allow access to dashboard
        if (kycStatus === 'approved' || kycStatus === 'verified') {
          console.log('🛡️ KYC approved, allowing access');
          setHasChecked(true);
          setChecking(false);
          return;
        }

        // Default: redirect to register if status is unknown
        console.log('🛡️ Unknown KYC status, redirecting to register');
        setHasChecked(true);
        router.push('/influencer/register');
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setHasChecked(true);
      } finally {
        setChecking(false);
      }
    };

    checkKYCStatus();
  }, [user, isLoading, pathname, router, hasChecked]);

  // FIXED: Allow project pages to render even during checks to prevent 404s
  const isProjectPage = pathname?.includes('/influencer/project/') || 
                        pathname?.includes('/influencer/dashboard') || 
                        pathname?.includes('/influencer/dealflow') ||
                        pathname?.includes('/influencer/campaigns') ||
                        pathname?.includes('/influencer/messages') ||
                        pathname?.includes('/influencer/settings') ||
                        pathname?.includes('/influencer/analytics');
  
  // For project pages, allow rendering even if checking (prevents 404s)
  if ((checking || isLoading) && !isProjectPage) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

export default function InfluencerLayout({
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
