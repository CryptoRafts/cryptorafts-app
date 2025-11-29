"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';

interface FounderRedirectGuardProps {
  children: React.ReactNode;
}

export default function FounderRedirectGuard({ children }: FounderRedirectGuardProps) {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const { profile, profileLoading } = useFounderAuth();
  const router = useRouter();
  const pathname = usePathname();

  const legacyProfile = (profile as Record<string, any> | null) || null;

  useEffect(() => {
    if (isLoading || profileLoading) return;

    // If not authenticated or not founder, redirect to login
    if (!isAuthenticated || claims?.role !== 'founder') {
      router.replace('/login');
      return;
    }

    // If no profile data, redirect to registration
    if (!profile) {
      if (pathname !== '/founder/register') {
        router.replace('/founder/register');
      }
      return;
    }

    const onboardingState = (profile.onboardingStep || legacyProfile?.onboarding_state) as string | undefined;
    const kycStatus = profile.kycStatus || legacyProfile?.kyc_status || profile.kyc?.status;

    // Define protected routes that require KYC approval
    const protectedRoutes = ['/founder/dashboard', '/founder/projects', '/founder/deal-rooms', '/founder/pitch'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Handle onboarding flow - enforce proper sequence
    // First check if profile setup is complete
    const isProfileComplete = Boolean(
      (profile.displayName || legacyProfile?.display_name) &&
      (legacyProfile?.founder_legal_name || legacyProfile?.company_name || legacyProfile?.tagline)
    );
    // Profile image optional

    // If profile is not complete, force to profile setup
    if (!isProfileComplete || onboardingState === 'REGISTRATION_REQUIRED' || !onboardingState) {
      if (pathname !== '/founder/register') {
        router.replace('/founder/register');
      }
      return;
    }

    // Only allow KYC if profile is complete and KYC not yet approved
    const isKYCCompleted =
      kycStatus === 'approved' ||
      profile.kyc?.status === 'approved' ||
      onboardingState === 'DONE' ||
      onboardingState === 'KYC_APPROVED';
    
    if (!isKYCCompleted && (onboardingState === 'KYC_PENDING' || onboardingState === 'KYC_REJECTED') && isProfileComplete) {
      if (pathname !== '/founder/kyc') {
        router.replace('/founder/kyc');
      }
      return;
    }


    // KYC completion check (already defined above)

    // Debug logging
    console.log('FounderRedirectGuard Debug:', {
      pathname,
      kycStatus,
      onboardingState,
      profileKycStatus: profile.kyc?.status,
      onboardingStep: profile.onboardingStep,
      isKYCCompleted,
      isProfileComplete,
      profile: profile
    });

    if (isKYCCompleted) {
      // If KYC approved and trying to access protected routes, allow
      if (isProtectedRoute) {
        return;
      }
      
      // If on onboarding pages but KYC approved, redirect to dashboard
      if (pathname === '/founder/register' || pathname === '/founder/kyc') {
        router.replace('/founder/dashboard');
        return;
      }
    }

    // If KYC not approved and trying to access protected routes
    if (isProtectedRoute && !isKYCCompleted) {
      router.replace('/founder/register');
      return;
    }

  }, [
    isLoading,
    profileLoading,
    isAuthenticated,
    claims?.role,
    profile,
    pathname,
    router
  ]);

  // Show loading while checking
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if redirecting
  if (!isAuthenticated || claims?.role !== 'founder' || !profile) {
    return null;
  }

  // Always render children - the redirect logic above handles navigation
  return <>{children}</>;
}
