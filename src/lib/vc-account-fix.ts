"use client";

import { auth, db } from './firebase.client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { globalRules } from './global-rules';
import { roleFlowManager } from './role-flow-manager';

export class VCAccountFix {
  private static instance: VCAccountFix;

  public static getInstance(): VCAccountFix {
    if (!VCAccountFix.instance) {
      VCAccountFix.instance = new VCAccountFix();
    }
    return VCAccountFix.instance;
  }

  /**
   * Fix VC account creation and ensure proper onboarding flow
   */
  async fixVCAccount(userId: string): Promise<{ success: boolean; message: string; route: string }> {
    try {
      console.log('VCAccountFix: Starting VC account fix for user:', userId);

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db!, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('VCAccountFix: User document not found, creating...');
        await this.createVCUserDocument(userId);
      }

      // Check role flow state
      const currentState = await roleFlowManager.getCurrentState();
      console.log('VCAccountFix: Current role flow state:', currentState);

      // Ensure role is set to 'vc'
      if (currentState.role !== 'vc') {
        console.log('VCAccountFix: Setting role to VC...');
        await this.setVCRole(userId);
      }

      // Determine correct route
      const correctRoute = await roleFlowManager.getCorrectRoute();
      console.log('VCAccountFix: Correct route determined:', correctRoute);

      return {
        success: true,
        message: 'VC account fixed successfully',
        route: correctRoute
      };

    } catch (error) {
      console.error('VCAccountFix: Error fixing VC account:', error);
      return {
        success: false,
        message: `Failed to fix VC account: ${error}`,
        route: '/role'
      };
    }
  }

  /**
   * Create VC user document if it doesn't exist
   */
  private async createVCUserDocument(userId: string): Promise<void> {
    const userData = {
      role: 'vc',
      profileCompleted: false,
      onboarding: {
        step: 'profile',
        startedAt: serverTimestamp(),
        completedAt: null
      },
      kyc: {
        status: 'pending',
        submittedAt: null,
        approvedAt: null
      },
      kyb: {
        status: 'pending',
        submittedAt: null,
        approvedAt: null
      },
      orgId: `vc-org-${userId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db!, 'users', userId), userData);
    console.log('VCAccountFix: VC user document created');
  }

  /**
   * Set user role to VC
   */
  private async setVCRole(userId: string): Promise<void> {
    await updateDoc(doc(db!, 'users', userId), {
      role: 'vc',
      updatedAt: serverTimestamp()
    });

    // Also update global rules
    try {
      await globalRules.lockRole('vc');
      console.log('VCAccountFix: VC role locked in global rules');
    } catch (error) {
      console.warn('VCAccountFix: Failed to lock role in global rules:', error);
    }
  }

  /**
   * Reset VC onboarding state
   */
  async resetVCOnboarding(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db!, 'users', userId), {
        profileCompleted: false,
        'onboarding.step': 'profile',
        'onboarding.completedAt': null,
        'kyb.status': 'pending',
        'kyb.submittedAt': null,
        'kyb.approvedAt': null,
        updatedAt: serverTimestamp()
      });

      // Reset role flow manager redirect flag
      roleFlowManager.resetRedirectFlag();
      
      console.log('VCAccountFix: VC onboarding reset successfully');
    } catch (error) {
      console.error('VCAccountFix: Error resetting VC onboarding:', error);
      throw error;
    }
  }

  /**
   * Complete VC onboarding steps
   */
  async completeVCOnboardingStep(userId: string, step: string): Promise<void> {
    try {
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      switch (step) {
        case 'profile':
          updates.profileCompleted = true;
          updates['onboarding.step'] = 'kyb';
          break;
        case 'kyb':
          updates['kyb.status'] = 'approved';
          updates['kyb.approvedAt'] = serverTimestamp();
          updates['onboarding.step'] = 'done';
          updates['onboarding.completedAt'] = serverTimestamp();
          break;
      }

      await updateDoc(doc(db!, 'users', userId), updates);
      console.log(`VCAccountFix: Completed VC onboarding step: ${step}`);
    } catch (error) {
      console.error('VCAccountFix: Error completing VC onboarding step:', error);
      throw error;
    }
  }
}

export const vcAccountFix = VCAccountFix.getInstance();
