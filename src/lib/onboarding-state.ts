"use client";

import { auth, db } from './firebase.client';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Single source of truth for onboarding state
export interface OnboardingState {
  registration: 'pending' | 'complete';
  kyc: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  kyb: 'optional' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  pitch_access: 'locked' | 'unlocked';
  first_pitch: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastStepCompleted?: string;
  
  // KYC specific data
  kycData?: {
    fullName: string;
    nationality: string;
    dateOfBirth: string;
    idType: string;
    idNumber: string;
    selfieUrl?: string;
    idImageUrl?: string;
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReasons?: string[];
  };
  
  // KYB specific data
  kybData?: {
    organizationName?: string;
    registrationNumber?: string;
    jurisdiction?: string;
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReasons?: string[];
  };
  
  // First pitch data
  firstPitchData?: {
    projectName?: string;
    sector?: string;
    chain?: string;
    stage?: string;
    valueProposition?: string;
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReasons?: string[];
  };
}

export interface CustomClaims {
  role: 'founder';
  canPitch: boolean;
  kybRequired: boolean;
  onboardingComplete: boolean;
}

export class OnboardingStateManager {
  private static instance: OnboardingStateManager;
  
  public static getInstance(): OnboardingStateManager {
    if (!OnboardingStateManager.instance) {
      OnboardingStateManager.instance = new OnboardingStateManager();
    }
    return OnboardingStateManager.instance;
  }

  /**
   * Get current onboarding state
   */
  async getOnboardingState(uid?: string): Promise<OnboardingState | null> {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) return null;

    try {
      const docRef = doc(db!, 'onboarding', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          kycData: data.kycData ? {
            ...data.kycData,
            submittedAt: data.kycData.submittedAt?.toDate(),
            approvedAt: data.kycData.approvedAt?.toDate(),
            rejectedAt: data.kycData.rejectedAt?.toDate(),
          } : undefined,
          kybData: data.kybData ? {
            ...data.kybData,
            submittedAt: data.kybData.submittedAt?.toDate(),
            approvedAt: data.kybData.approvedAt?.toDate(),
            rejectedAt: data.kybData.rejectedAt?.toDate(),
          } : undefined,
          firstPitchData: data.firstPitchData ? {
            ...data.firstPitchData,
            submittedAt: data.firstPitchData.submittedAt?.toDate(),
            approvedAt: data.firstPitchData.approvedAt?.toDate(),
            rejectedAt: data.firstPitchData.rejectedAt?.toDate(),
          } : undefined,
        } as OnboardingState;
      }
      
      // Return default state if no document exists
      return this.getDefaultOnboardingState();
    } catch (error) {
      console.error('Error getting onboarding state:', error);
      return null;
    }
  }

  /**
   * Update onboarding state
   */
  async updateOnboardingState(
    updates: Partial<OnboardingState>, 
    uid?: string
  ): Promise<void> {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) throw new Error('No user ID available');

    try {
      const docRef = doc(db!, 'onboarding', userId);
      const currentState = await this.getOnboardingState(userId);
      
      const newState = {
        ...currentState,
        ...updates,
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Log audit entry
      await this.logAuditEvent('onboarding_state_update', updates, userId);
      
    } catch (error) {
      console.error('Error updating onboarding state:', error);
      throw error;
    }
  }

  /**
   * Complete registration step
   */
  async completeRegistration(registrationData: any, uid?: string): Promise<void> {
    await this.updateOnboardingState({
      registration: 'complete',
      lastStepCompleted: 'registration',
    }, uid);
  }

  /**
   * Start KYC process
   */
  async startKYC(kycData: any, uid?: string): Promise<void> {
    await this.updateOnboardingState({
      kyc: 'in_progress',
      kycData: {
        ...kycData,
        submittedAt: new Date(),
      },
      lastStepCompleted: 'kyc_start',
    }, uid);
  }

  /**
   * Complete KYC (approved)
   */
  async completeKYC(uid?: string): Promise<void> {
    await this.updateOnboardingState({
      kyc: 'approved',
      pitch_access: 'unlocked',
      kycData: {
        ...(await this.getOnboardingState(uid))?.kycData,
        approvedAt: new Date(),
      },
      lastStepCompleted: 'kyc',
    }, uid);

    // Update custom claims
    await this.updateCustomClaims({
      canPitch: true,
      onboardingComplete: false, // Still need first pitch
    }, uid);
  }

  /**
   * Reject KYC
   */
  async rejectKYC(rejectionReasons: string[], uid?: string): Promise<void> {
    await this.updateOnboardingState({
      kyc: 'rejected',
      kycData: {
        ...(await this.getOnboardingState(uid))?.kycData,
        rejectedAt: new Date(),
        rejectionReasons,
      },
      lastStepCompleted: 'kyc_rejected',
    }, uid);
  }

  /**
   * Start first pitch
   */
  async startFirstPitch(pitchData: any, uid?: string): Promise<void> {
    await this.updateOnboardingState({
      first_pitch: 'in_progress',
      firstPitchData: {
        ...pitchData,
        submittedAt: new Date(),
      },
      lastStepCompleted: 'first_pitch_start',
    }, uid);
  }

  /**
   * Complete first pitch
   */
  async completeFirstPitch(uid?: string): Promise<void> {
    await this.updateOnboardingState({
      first_pitch: 'approved',
      lastStepCompleted: 'first_pitch',
    }, uid);

    // Update custom claims
    await this.updateCustomClaims({
      onboardingComplete: true,
    }, uid);
  }

  /**
   * Get current step for navigation
   */
  getCurrentStep(state: OnboardingState): string {
    if (state.registration !== 'complete') return 'registration';
    if (state.kyc === 'not_started') return 'kyc';
    if (state.kyc === 'in_progress' || state.kyc === 'submitted') return 'kyc_waiting';
    if (state.kyc === 'rejected') return 'kyc_rejected';
    if (state.kyc === 'approved' && state.pitch_access === 'locked') return 'pitch_access';
    if (state.pitch_access === 'unlocked' && state.first_pitch === 'not_started') return 'first_pitch';
    if (state.first_pitch === 'in_progress' || state.first_pitch === 'submitted') return 'first_pitch_waiting';
    if (state.first_pitch === 'rejected') return 'first_pitch_rejected';
    if (state.first_pitch === 'approved') return 'dashboard';
    
    return 'dashboard';
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(state: OnboardingState, step: string): boolean {
    switch (step) {
      case 'registration':
        return state.registration === 'complete';
      case 'kyc':
        return state.kyc === 'approved';
      case 'first_pitch':
        return state.first_pitch === 'approved';
      default:
        return false;
    }
  }

  /**
   * Get default onboarding state
   */
  private getDefaultOnboardingState(): OnboardingState {
    return {
      registration: 'pending',
      kyc: 'not_started',
      kyb: 'optional',
      pitch_access: 'locked',
      first_pitch: 'not_started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update custom claims
   */
  private async updateCustomClaims(claims: Partial<CustomClaims>, uid?: string): Promise<void> {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) throw new Error('No user ID available');

    try {
      // Update claims in user document
      const userRef = doc(db!, 'users', userId);
      await updateDoc(userRef, {
        customClaims: {
          role: 'founder',
          canPitch: false,
          kybRequired: false,
          onboardingComplete: false,
          ...claims,
        },
        claimsUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Force token refresh
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }

    } catch (error) {
      console.error('Error updating custom claims:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    action: string, 
    details: any, 
    uid?: string
  ): Promise<void> {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) return;

    try {
      const auditRef = doc(db!, 'audits', `${userId}_${Date.now()}`);
      await setDoc(auditRef, {
        userId,
        action,
        details,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        ipHash: 'hashed_ip', // In production, hash the IP
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}

export const onboardingStateManager = OnboardingStateManager.getInstance();
