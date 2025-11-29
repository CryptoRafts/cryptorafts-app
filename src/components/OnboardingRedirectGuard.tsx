"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { onboardingStateManager, OnboardingState } from '@/lib/onboarding-state';

interface OnboardingRedirectGuardProps {
  children: React.ReactNode;
}

export default function OnboardingRedirectGuard({ children }: OnboardingRedirectGuardProps) {
  const { user, isAuthenticated, isLoading, claims } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Load onboarding state
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      loadOnboardingState();
    }
  }, [isLoading, isAuthenticated, user]);

  const loadOnboardingState = async () => {
    try {
      setIsLoadingState(true);
      const state = await onboardingStateManager.getOnboardingState();
      setOnboardingState(state);
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    } finally {
      setIsLoadingState(false);
    }
  };

  // Handle navigation based on onboarding state
  useEffect(() => {
    if (isLoading || isLoadingState || !isAuthenticated || !user || !onboardingState || hasRedirected) {
      return;
    }

    // Only handle founder routes
    if (!pathname.startsWith('/founder')) {
      return;
    }

    const currentStep = onboardingStateManager.getCurrentStep(onboardingState);
    const targetRoute = getTargetRoute(currentStep);

    console.log('OnboardingRedirectGuard:', {
      pathname,
      currentStep,
      targetRoute,
      onboardingState,
      claims
    });

    // If we're not on the correct route, redirect
    if (pathname !== targetRoute) {
      setHasRedirected(true);
      router.replace(targetRoute);
      return;
    }

    // If we're on the correct route, allow rendering
    setHasRedirected(false);
  }, [isLoading, isLoadingState, isAuthenticated, user, onboardingState, pathname, router, hasRedirected]);

  const getTargetRoute = (step: string): string => {
    switch (step) {
      case 'registration':
        return '/founder/register';
      case 'kyc':
        return '/founder/kyc';
      case 'kyc_waiting':
        return '/founder/kyc-waiting';
      case 'kyc_rejected':
        return '/founder/kyc-rejected';
      case 'pitch_access':
        return '/founder/pitch-access';
      case 'first_pitch':
        return '/founder/first-pitch';
      case 'first_pitch_waiting':
        return '/founder/first-pitch-waiting';
      case 'first_pitch_rejected':
        return '/founder/first-pitch-rejected';
      case 'dashboard':
        return '/founder/dashboard';
      default:
        return '/founder/register';
    }
  };

  // Show loading while determining state
  if (isLoading || isLoadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || claims?.role !== 'founder') {
    router.replace('/login');
    return null;
  }

  // Show loading while redirecting
  if (hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
