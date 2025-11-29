"use client";

import { auth, db } from './firebase.client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onboardingStateManager, OnboardingState } from './onboarding-state';

export interface CustomClaims {
  role: 'founder';
  canPitch: boolean;
  kybRequired: boolean;
  onboardingComplete: boolean;
}

export class GlobalRulesManager {
  private static instance: GlobalRulesManager;
  
  public static getInstance(): GlobalRulesManager {
    if (!GlobalRulesManager.instance) {
      GlobalRulesManager.instance = new GlobalRulesManager();
    }
    return GlobalRulesManager.instance;
  }

  /**
   * Initialize global rules and check user state
   */
  async initialize(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    // Ensure user document exists
    await this.ensureUserDocument();
    
    // Load onboarding state
    const onboardingState = await onboardingStateManager.getOnboardingState();
    
    // Update custom claims based on onboarding state
    await this.updateCustomClaimsFromOnboardingState(onboardingState);
  }

  /**
   * Check if role is locked
   */
  isRoleLocked(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Get current role
   */
  getCurrentRole(): string | null {
    return 'founder'; // Always founder for this flow
  }

  /**
   * Get current step based on onboarding state
   */
  getCurrentStep(): string {
    // This will be handled by the onboarding state manager
    return 'registration';
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(step: string): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if KYC is approved
   */
  isKYCApproved(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if KYC is rejected
   */
  isKYCRejected(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if KYC is pending
   */
  isKYCPending(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if KYB is approved
   */
  isKYBApproved(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if user can access portal
   */
  canAccessPortal(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if user has submitted pitch
   */
  hasPitchSubmitted(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Check if user can submit pitch
   */
  canSubmitPitch(): boolean {
    // This will be handled by the onboarding state manager
    return false;
  }

  /**
   * Ensure user document exists
   */
  private async ensureUserDocument(): Promise<void> {
    if (!auth.currentUser) return;

    const userRef = doc(db!, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        role: 'founder',
        customClaims: {
          role: 'founder',
          canPitch: false,
          kybRequired: false,
          onboardingComplete: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Update custom claims based on onboarding state
   */
  private async updateCustomClaimsFromOnboardingState(onboardingState: OnboardingState | null): Promise<void> {
    if (!auth.currentUser || !onboardingState) return;

    const claims: Partial<CustomClaims> = {
      role: 'founder',
      canPitch: onboardingState.kyc === 'approved',
      kybRequired: false,
      onboardingComplete: onboardingState.first_pitch === 'approved',
    };

    const userRef = doc(db!, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      customClaims: claims,
      claimsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Force token refresh
    await auth.currentUser.getIdToken(true);
  }
}

export const globalRules = GlobalRulesManager.getInstance();
