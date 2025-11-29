"use client";

import { useEffect, useState } from 'react';
import { authService, UserProfile } from './auth.service';
import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthed: boolean;
  role?: string;
  isKycVerified: boolean;
  isKybVerified: boolean;
  onboardingStep?: string;
  isAdmin: boolean;
}

// Main authentication hook
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthed: false,
    isKycVerified: false,
    isKybVerified: false,
    isAdmin: false
  });

  useEffect(() => {
    const unsubscribe = authService.addAuthListener((user, profile) => {
      setState({
        user,
        profile,
        loading: false,
        isAuthed: !!user,
        role: profile?.role,
        isKycVerified: profile?.kycStatus === 'verified',
        isKybVerified: profile?.kybStatus === 'verified',
        onboardingStep: profile?.onboardingStep,
        isAdmin: authService.isAdmin()
      });
    });

    return unsubscribe;
  }, []);

  return state;
}

// Role-specific hooks
export function useFounderAuth() {
  const auth = useAuth();
  const isFounder = auth.role === 'founder';
  return {
    ...auth,
    isFounder,
    canPitch: isFounder && auth.isKycVerified && auth.onboardingStep === 'complete'
  };
}

export function useVCAuth() {
  const auth = useAuth();
  const isVC = auth.role === 'vc';
  return {
    ...auth,
    isVC,
    canAccessDealflow: isVC && auth.isKycVerified && auth.isKybVerified
  };
}

export function useExchangeAuth() {
  const auth = useAuth();
  const isExchange = auth.role === 'exchange';
  return {
    ...auth,
    isExchange,
    canAccessListings: isExchange && auth.isKycVerified && auth.isKybVerified
  };
}

export function useIDOAuth() {
  const auth = useAuth();
  const isIDO = auth.role === 'ido';
  return {
    ...auth,
    isIDO,
    canAccessLaunches: isIDO && auth.isKycVerified && auth.isKybVerified
  };
}

export function useInfluencerAuth() {
  const auth = useAuth();
  const isInfluencer = auth.role === 'influencer';
  return {
    ...auth,
    isInfluencer,
    canAccessCampaigns: isInfluencer && auth.isKycVerified
  };
}

export function useAgencyAuth() {
  const auth = useAuth();
  const isAgency = auth.role === 'agency';
  return {
    ...auth,
    isAgency,
    canAccessProposals: isAgency && auth.isKycVerified && auth.isKybVerified
  };
}

export function useAdminAuth() {
  const auth = useAuth();
  return {
    ...auth,
    isAdmin: auth.isAdmin,
    canAccessAdmin: auth.isAdmin && auth.isAuthed
  };
}

// Authentication actions
export function useAuthActions() {
  const signInWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  const signInWithEmail = async (email: string, password: string) => {
    return await authService.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    return await authService.signUpWithEmail(email, password, displayName);
  };

  const signOut = async () => {
    return await authService.signOut();
  };

  const updateRole = async (role: UserProfile['role']) => {
    return await authService.updateUserRole(role);
  };

  const updateOnboardingStep = async (step: UserProfile['onboardingStep']) => {
    return await authService.updateOnboardingStep(step);
  };

  const getFreshToken = async () => {
    return await authService.getFreshToken();
  };

  return {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateRole,
    updateOnboardingStep,
    getFreshToken
  };
}

// Route protection hooks
export function useRouteProtection(requirements: {
  requireAuth?: boolean;
  requireRole?: string;
  requireKyc?: boolean;
  requireKyb?: boolean;
  requireOnboardingComplete?: boolean;
}) {
  const auth = useAuth();

  const canAccess = !auth.loading && (
    (!requirements.requireAuth || auth.isAuthed) &&
    (!requirements.requireRole || auth.role === requirements.requireRole) &&
    (!requirements.requireKyc || auth.isKycVerified) &&
    (!requirements.requireKyb || auth.isKybVerified) &&
    (!requirements.requireOnboardingComplete || auth.onboardingStep === 'complete')
  );

  const redirectTo = () => {
    if (!auth.isAuthed) return '/login';
    if (!auth.role) return '/role';
    if (auth.role === 'founder' && !auth.isKycVerified) return '/founder/kyc';
    if ((auth.role === 'vc' || auth.role === 'exchange' || auth.role === 'agency') && !auth.isKybVerified) {
      return `/${auth.role}/kyb`;
    }
    if (auth.onboardingStep !== 'complete') {
      switch (auth.role) {
        case 'founder': return auth.isKycVerified ? '/founder/pitch' : '/founder/kyc';
        case 'vc': return auth.isKybVerified ? '/vc/dashboard' : '/vc/kyb';
        case 'exchange': return auth.isKybVerified ? '/exchange/dashboard' : '/exchange/kyb';
        case 'ido': return auth.isKybVerified ? '/ido/dashboard' : '/ido/kyb';
        case 'influencer': return auth.isKycVerified ? '/influencer/dashboard' : '/influencer/kyc';
        case 'agency': return auth.isKybVerified ? '/agency/dashboard' : '/agency/kyb';
        default: return '/dashboard';
      }
    }
    return null;
  };

  return {
    canAccess,
    redirectTo: redirectTo(),
    auth,
    loading: auth.loading
  };
}
