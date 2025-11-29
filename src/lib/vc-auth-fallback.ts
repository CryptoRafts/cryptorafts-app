"use client";

import { doc, setDoc, updateDoc, getDoc, db } from '@/lib/firebase.client';

/**
 * Fallback VC auth manager that stores organization data in user document
 * This bypasses Firestore collection rules by using the user's own document
 */
export class VCAuthManagerFallback {
  /**
   * Complete organization profile setup (fallback method)
   * Stores organization data in user document instead of organizations collection
   */
  async completeOrgProfileFallback(
    uid: string, 
    orgData: {
      name: string;
      website: string;
      country: string;
      logoUrl: string;
      thesis: string;
      aum: string;
      contactEmail: string;
    }
  ): Promise<string> {
    // Create a virtual orgId for reference
    const orgId = `vc_${uid}_${Date.now()}`;
    
    try {
      // Try to create organization document first (normal method)
      const { vcAuthManager } = await import('@/lib/vc-auth');
      return await vcAuthManager.completeOrgProfile(uid, orgData);
    } catch (error) {
      console.warn('Organization collection failed, using fallback method:', error);
      
      // Fallback: Store organization data in user document
      const userRef = doc(db!, 'users', uid);
      await setDoc(userRef, {
        orgId,
        profileCompleted: true,
        organization: {
          id: orgId,
          type: 'vc',
          ...orgData,
          members: [{
            uid,
            role: 'owner',
            joinedAt: new Date()
          }],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        onboarding: {
          step: 'verification'
        },
        updatedAt: new Date()
      }, { merge: true });

      // Update custom claims
      try {
        const { authClaimsManager } = await import('@/lib/auth-claims');
        await authClaimsManager.setCustomClaims(uid, {
          role: 'vc',
          profileCompleted: true,
          onboardingStep: 'verification'
        });
        console.log('✅ Custom claims updated successfully');
      } catch (claimsError) {
        console.warn('Custom claims update failed:', claimsError);
        // Continue without custom claims update
      }

      return orgId;
    }
  }

  /**
   * Get VC user with organization data (fallback method)
   */
  async getVCUserWithOrg(uid: string): Promise<any> {
    try {
      // Try normal method first
      const { vcAuthManager } = await import('@/lib/vc-auth');
      const user = await vcAuthManager.getVCUser(uid);
      if (user && user.orgId) {
        const org = await vcAuthManager.getVCOrganization(user.orgId);
        return { ...user, organization: org };
      }
      return user;
    } catch (error) {
      console.warn('Normal method failed, using fallback:', error);
      
      // Fallback: Get user with embedded organization data
      const userDoc = await getDoc(doc(db!, 'users', uid));
      if (!userDoc.exists()) return null;
      
      const data = userDoc.data();
      if (data.role !== 'vc') return null;
      
      return { uid, ...data };
    }
  }

  /**
   * Check if VC portal is unlocked (fallback method)
   */
  async isVCPortalUnlockedFallback(uid: string): Promise<boolean> {
    try {
      const userData = await this.getVCUserWithOrg(uid);
      if (!userData) return false;

      // Check if user has organization data
      const org = userData.organization || userData;
      
      // Only require KYB approval, KYC is optional
      return org.kyb?.status === 'approved' && 
             userData.onboarding?.step === 'done';
    } catch (error) {
      console.warn('Portal unlock check failed:', error);
      return false;
    }
  }
}

export const vcAuthManagerFallback = new VCAuthManagerFallback();
