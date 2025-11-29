/**
 * Validates onboarding flow for role-specific pages
 * Ensures users follow the correct flow: register → kyc/kyb → pending-approval → dashboard
 */

export interface OnboardingFlowConfig {
  role: string;
  verificationType: 'kyc' | 'kyb';
  registerPath: string;
  verificationPath: string;
  pendingApprovalPath: string;
}

export interface OnboardingFlowResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
}

export function validateOnboardingFlow(
  pathname: string,
  userData: any,
  config: OnboardingFlowConfig
): OnboardingFlowResult {
  const { role, verificationType, registerPath, verificationPath, pendingApprovalPath } = config;
  
  const profileCompleted = userData.profileCompleted || false;
  const verificationStatus = (
    verificationType === 'kyc' 
      ? (userData.kycStatus || userData.kyc?.status || userData.kyc_status || 'not_submitted')
      : (userData.kybStatus || userData.kyb?.status || userData.kyb_status || 'not_submitted')
  ).toLowerCase();

  // On register page - always allow
  if (pathname?.includes(registerPath)) {
    return { allowed: true };
  }

  // On verification (KYC/KYB) page - only allow if profile is completed
  if (pathname?.includes(verificationPath)) {
    if (!profileCompleted) {
      return {
        allowed: false,
        redirectTo: registerPath,
        reason: 'Profile not completed'
      };
    }
    return { allowed: true };
  }

  // On pending-approval page - only allow if profile completed AND verification submitted
  if (pathname?.includes(pendingApprovalPath)) {
    if (!profileCompleted) {
      return {
        allowed: false,
        redirectTo: registerPath,
        reason: 'Profile not completed'
      };
    }
    if (verificationStatus === 'not_submitted' || !verificationStatus) {
      return {
        allowed: false,
        redirectTo: verificationPath,
        reason: 'Verification not submitted'
      };
    }
    if (verificationStatus === 'approved' || verificationStatus === 'verified') {
      return {
        allowed: false,
        redirectTo: `/${role}/dashboard`,
        reason: 'Verification already approved'
      };
    }
    // Status is pending/submitted/rejected - allow access
    return { allowed: true };
  }

  // For dashboard or other pages - check full flow
  if (!profileCompleted) {
    return {
      allowed: false,
      redirectTo: registerPath,
      reason: 'Profile not completed'
    };
  }
  if (verificationStatus === 'not_submitted' || !verificationStatus) {
    return {
      allowed: false,
      redirectTo: verificationPath,
      reason: 'Verification not submitted'
    };
  }
  if (verificationStatus === 'pending' || verificationStatus === 'submitted') {
    return {
      allowed: false,
      redirectTo: pendingApprovalPath,
      reason: 'Verification pending approval'
    };
  }
  if (verificationStatus === 'rejected') {
    return {
      allowed: false,
      redirectTo: verificationPath,
      reason: 'Verification rejected, needs resubmission'
    };
  }
  // Approved/verified - allow access
  return { allowed: true };
}

