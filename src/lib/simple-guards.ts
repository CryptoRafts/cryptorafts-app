"use client";

import { useMemo } from "react";
import { useSimpleAuth } from "@/lib/auth-simple";

export const ADMIN_EMAIL = "anasshamsiggc@gmail.com";

/** Simple role flags using simple auth service */
export function useSimpleRoleFlags(){
  const { user, profile, loading, isAuthed } = useSimpleAuth();

  const flags = useMemo(()=>{
    const role = profile?.role;
    const kyc = profile?.kycStatus;
    const kyb = profile?.kybStatus;

    // Admin access - super admin or allowlisted email
    const adminAllowlist = ["anasshamsiggc@gmail.com", "ceo@cryptorafts.com", "anasshamsi@cryptorafts.com", "admin@cryptorafts.com", "support@cryptorafts.com"];
    const isAdmin = !!user && (
      profile?.role === 'admin' ||
      adminAllowlist.includes(user.email?.toLowerCase() || "")
    );

    // Onboarding step
    const onboardingStep = profile?.onboardingStep;

    const isKycVerified = kyc === 'verified';
    const isKybVerified = kyb === 'verified';
    const isOnboardingComplete = onboardingStep === 'complete';

    return {
      isAuthed,
      user,
      profile,
      role,
      isAdmin,
      isFounder: role === 'founder',
      isVC: role === 'vc',
      isExchange: role === 'exchange',
      isIDO: role === 'ido',
      isInfluencer: role === 'influencer',
      isAgency: role === 'agency',
      kyc,
      kyb,
      isKycVerified,
      isKybVerified,
      onboardingStep,
      isOnboardingComplete,
      loading,
    };
  }, [isAuthed, user, profile]);

  return { ...flags, loading };
}
