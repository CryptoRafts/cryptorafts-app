/**
 * Agency Role Guard Hook
 * Strict access control for agency portal with tenant isolation
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc } from '@/lib/firebase.client';

interface AgencyGuardOptions {
  requireProfile?: boolean;
  requireKYC?: boolean;
  requireKYB?: boolean;
  redirectOnFail?: boolean;
}

export function useAgencyGuard(options: AgencyGuardOptions = {}) {
  const {
    requireProfile = true,
    requireKYC = false,
    requireKYB = false,
    redirectOnFail = true
  } = options;

  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return;

      try {
        // Check 1: User must be authenticated
        if (!user) {
          setError('Not authenticated');
          if (redirectOnFail) {
            router.push('/login?redirect=/agency/dashboard');
          }
          setIsLoading(false);
          return;
        }

        // Check 2: Role must be 'agency'
        if (claims?.role !== 'agency') {
          setError('Access denied - agency role required');
          if (redirectOnFail) {
            router.push('/role');
          }
          setIsLoading(false);
          return;
        }

        // Check 3: Load profile and verify requirements
        if (!db) {
          setError('Database not available');
          setIsLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db!, 'users', user.uid));
        
        if (!userDoc.exists()) {
          setError('Profile not found');
          if (redirectOnFail) {
            router.push('/register/agency');
          }
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        setProfile(userData);

        // Check 4: Profile completed
        if (requireProfile && !userData.profileCompleted) {
          setError('Profile not completed');
          if (redirectOnFail) {
            router.push('/register/agency');
          }
          setIsLoading(false);
          return;
        }

        // Check 5: KYC approved (representative verification)
        if (requireKYC) {
          const kycStatus = userData.kycStatus || userData.kyc?.status;
          if (kycStatus !== 'approved') {
            setError('KYC verification required');
            if (redirectOnFail) {
              router.push('/agency/kyc');
            }
            setIsLoading(false);
            return;
          }
        }

        // Check 6: KYB approved (organization verification)
        if (requireKYB) {
          const kybStatus = userData.kybStatus || userData.kyb?.status;
          if (kybStatus !== 'approved') {
            setError('KYB verification required');
            if (redirectOnFail) {
              router.push('/agency/kyb');
            }
            setIsLoading(false);
            return;
          }
        }

        // All checks passed
        setIsAuthorized(true);
        setError(null);
        setIsLoading(false);

      } catch (err: any) {
        console.error('Agency guard error:', err);
        setError(err.message || 'Access check failed');
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user, claims, authLoading, requireProfile, requireKYC, requireKYB, redirectOnFail, router]);

  return {
    isLoading,
    isAuthorized,
    error,
    profile,
    orgId: profile?.orgId,
    user,
    claims
  };
}

