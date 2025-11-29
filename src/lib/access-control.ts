/**
 * Access Control System
 * Enforces complete onboarding flow for all users
 */

import { User } from 'firebase/auth';

export interface UserProfile {
  role: string;
  profileCompleted: boolean;
  kycStatus?: string;
  kybStatus?: string;
  kyc?: { status: string };
  kyb?: { status: string };
  onboardingStep?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface AccessControlResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
  requiresVerification?: boolean;
}

/**
 * Check if user has completed all required onboarding steps
 */
export function checkOnboardingCompletion(userProfile: UserProfile): AccessControlResult {
  // Step 1: Check if user has selected a role
  if (!userProfile.role || userProfile.role === 'user') {
    return {
      allowed: false,
      redirectTo: '/role',
      reason: 'User must select a role first'
    };
  }

  // Step 2: Check if profile is completed
  if (!userProfile.profileCompleted) {
    return {
      allowed: false,
      redirectTo: `/${userProfile.role}/register`,
      reason: 'User must complete profile registration'
    };
  }

  // Step 3: Check KYC/KYB verification based on role (email verification skipped for now)
  const verificationResult = checkVerificationStatus(userProfile);
  if (!verificationResult.allowed) {
    return verificationResult;
  }

  // All steps completed
  return {
    allowed: true,
    reason: 'All onboarding steps completed'
  };
}

/**
 * Check KYC/KYB verification status based on user role
 */
function checkVerificationStatus(userProfile: UserProfile): AccessControlResult {
  const role = userProfile.role;
  
  // For individual roles (founder, vc, influencer) - require KYC
  if (['founder', 'vc', 'influencer'].includes(role)) {
    const kycStatus = userProfile.kycStatus || userProfile.kyc?.status;
    const kycStatusLower = String(kycStatus || '').toLowerCase();
    
    // Not submitted or in progress
    if (!kycStatus || kycStatusLower === 'not_submitted') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyc`,
        reason: 'KYC verification required',
        requiresVerification: true
      };
    }
    
    // Pending approval - show pending screen
    if (kycStatusLower === 'pending' || kycStatusLower === 'submitted') {
      return {
        allowed: false,
        redirectTo: `/${role}/pending-approval`,
        reason: 'KYC verification pending approval',
        requiresVerification: true
      };
    }
    
    // Rejected - allow user to resubmit
    if (kycStatusLower === 'rejected') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyc`,
        reason: 'KYC verification rejected, resubmit required',
        requiresVerification: true
      };
    }
    
    // Check if approved
    if (kycStatusLower !== 'approved' && kycStatusLower !== 'verified') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyc`,
        reason: 'KYC verification not approved',
        requiresVerification: true
      };
    }
  }
  
  // For business roles (exchange, ido, agency) - require KYB
  if (['exchange', 'ido', 'agency'].includes(role)) {
    const kybStatus = userProfile.kybStatus || userProfile.kyb?.status;
    const kybStatusLower = String(kybStatus || '').toLowerCase();
    
    // Not submitted or in progress
    if (!kybStatus || kybStatusLower === 'not_submitted') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyb`,
        reason: 'KYB verification required',
        requiresVerification: true
      };
    }
    
    // Pending approval - show pending screen
    if (kybStatusLower === 'pending' || kybStatusLower === 'submitted') {
      return {
        allowed: false,
        redirectTo: `/${role}/pending-approval`,
        reason: 'KYB verification pending approval',
        requiresVerification: true
      };
    }
    
    // Rejected - allow user to resubmit
    if (kybStatusLower === 'rejected') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyb`,
        reason: 'KYB verification rejected, resubmit required',
        requiresVerification: true
      };
    }
    
    // Check if approved
    if (kybStatusLower !== 'approved' && kybStatusLower !== 'verified') {
      return {
        allowed: false,
        redirectTo: `/${role}/kyb`,
        reason: 'KYB verification not approved',
        requiresVerification: true
      };
    }
  }
  
  return {
    allowed: true,
    reason: 'Verification completed'
  };
}

/**
 * Get the next step in the onboarding process
 */
export function getNextOnboardingStep(userProfile: UserProfile): string {
  if (!userProfile.role || userProfile.role === 'user') {
    return '/role';
  }
  
  if (!userProfile.profileCompleted) {
    return `/${userProfile.role}/register`;
  }
  
  // Email verification check removed
  
  const role = userProfile.role;
  if (['founder', 'vc', 'influencer'].includes(role)) {
    const kycStatus = userProfile.kycStatus || userProfile.kyc?.status;
    const kycStatusLower = String(kycStatus || '').toLowerCase();
    
    if (!kycStatus || kycStatusLower === 'not_submitted') {
      return `/${role}/kyc`;
    }
    
    if (kycStatusLower === 'pending' || kycStatusLower === 'submitted') {
      return `/${role}/pending-approval`;
    }
    
    if (kycStatusLower === 'rejected') {
      return `/${role}/kyc`;
    }
    
    if (kycStatusLower !== 'approved' && kycStatusLower !== 'verified') {
      return `/${role}/kyc`;
    }
  }
  
  if (['exchange', 'ido', 'agency'].includes(role)) {
    const kybStatus = userProfile.kybStatus || userProfile.kyb?.status;
    const kybStatusLower = String(kybStatus || '').toLowerCase();
    
    if (!kybStatus || kybStatusLower === 'not_submitted') {
      return `/${role}/kyb`;
    }
    
    if (kybStatusLower === 'pending' || kybStatusLower === 'submitted') {
      return `/${role}/pending-approval`;
    }
    
    if (kybStatusLower === 'rejected') {
      return `/${role}/kyb`;
    }
    
    if (kybStatusLower !== 'approved' && kybStatusLower !== 'verified') {
      return `/${role}/kyb`;
    }
  }
  
  return `/${role}/dashboard`;
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userProfile: UserProfile, route: string): AccessControlResult {
  // Allow access to onboarding steps
  const onboardingRoutes = [
    '/role',
    '/verify-email',
    '/login',
    '/signup'
  ];
  
  // Allow access to role-specific registration, verification, and pending pages
  const role = userProfile.role;
  if (role && role !== 'user') {
    onboardingRoutes.push(`/${role}/register`);
    onboardingRoutes.push(`/${role}/kyc`);
    onboardingRoutes.push(`/${role}/kyb`);
    onboardingRoutes.push(`/${role}/pending-approval`);
  }
  
  if (onboardingRoutes.some(route => route.startsWith(route))) {
    return { allowed: true };
  }
  
  // For dashboard access, check complete onboarding
  if (route.includes('/dashboard')) {
    return checkOnboardingCompletion(userProfile);
  }
  
  return { allowed: true };
}
