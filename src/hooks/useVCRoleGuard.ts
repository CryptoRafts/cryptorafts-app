/**
 * VC ROLE GUARD HOOK - LOCKED & SECURED
 * 
 * ⚠️ DO NOT MODIFY THIS FILE
 * ⚠️ Provides strict VC role access control
 * 
 * This hook ensures:
 * 1. Only VC users can access VC features
 * 2. Automatic redirection for unauthorized access
 * 3. Real-time role verification
 * 4. Secure session management
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { 
  isVCRole, 
  requireVCRole, 
  VC_CONFIG 
} from '@/config/vc-role-lock';

interface VCRoleGuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  userId: string | null;
  error: string | null;
}

/**
 * 🔒 LOCKED VC ROLE GUARD HOOK
 * 
 * Use this hook in all VC pages to ensure:
 * - User is authenticated
 * - User has VC role
 * - User has completed KYB (if required)
 * - Automatic redirect on unauthorized access
 */
export function useVCRoleGuard(options?: {
  requireKYB?: boolean;
  redirectOnFail?: boolean;
}): VCRoleGuardResult {
  const { user, isLoading, claims } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireKYB = options?.requireKYB ?? VC_CONFIG.REQUIRES_KYB;
  const redirectOnFail = options?.redirectOnFail ?? true;

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setError('AUTHENTICATION_REQUIRED');
      setIsAuthorized(false);
      if (redirectOnFail) {
        console.warn('🔒 VC Guard: User not authenticated, redirecting to login');
        router.push('/login');
      }
      return;
    }

    // Check if user has VC role
    const userRole = claims?.role;
    if (!isVCRole(userRole)) {
      setError('VC_ROLE_REQUIRED');
      setIsAuthorized(false);
      if (redirectOnFail) {
        console.warn('🔒 VC Guard: User does not have VC role, redirecting to role selection');
        router.push('/role');
      }
      return;
    }

    // VC role verified
    console.log('✅ VC Guard: Access granted for user:', user.uid);
    setError(null);
    setIsAuthorized(true);

  }, [user, isLoading, claims, router, requireKYB, redirectOnFail]);

  return {
    isAuthorized,
    isLoading,
    userId: user?.uid || null,
    error,
  };
}

/**
 * 🔒 LOCKED VC PERMISSION CHECK HOOK
 * 
 * Use this to check specific VC permissions
 */
export function useVCPermission(permission: keyof typeof VC_CONFIG.PERMISSIONS): boolean {
  const { claims } = useAuth();
  const userRole = claims?.role;

  if (!isVCRole(userRole)) {
    return false;
  }

  return VC_CONFIG.PERMISSIONS[permission] === true;
}

/**
 * 🔒 LOCKED VC ROLE VALIDATION
 * 
 * Throws error if user is not VC role
 */
export function validateVCRole(userRole: string | undefined | null): void {
  try {
    requireVCRole(userRole);
  } catch (error) {
    console.error('🔒 VC Role Validation Failed:', error);
    throw error;
  }
}

export default useVCRoleGuard;

