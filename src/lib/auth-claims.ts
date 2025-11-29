"use client";

import { auth } from './firebase.client';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

const functions = getFunctions();

export interface CustomClaims {
  role?: string;
  profileCompleted?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  kybStatus?: 'pending' | 'approved' | 'rejected' | 'skipped';
  kybSkipped?: boolean;
  pitchSubmitted?: boolean;
  onboardingStep?: string;
}

export class AuthClaimsManager {
  private static instance: AuthClaimsManager;
  
  public static getInstance(): AuthClaimsManager {
    if (!AuthClaimsManager.instance) {
      AuthClaimsManager.instance = new AuthClaimsManager();
    }
    return AuthClaimsManager.instance;
  }

  /**
   * Set custom claims for a user (simplified for development)
   */
  async setCustomClaims(uid: string, claims: Partial<CustomClaims>): Promise<void> {
    try {
      // For development, we'll store claims in Firestore and simulate the behavior
      // In production, this would use Firebase Admin SDK on the server
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase.client');
      
      await updateDoc(doc(db!, 'users', uid), {
        customClaims: claims,
        claimsUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Force token refresh to get updated claims
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
  }

  /**
   * Get current user's custom claims
   */
  async getCustomClaims(): Promise<CustomClaims | null> {
    try {
      if (!auth.currentUser) return null;
      
      // First try to get from Firestore (our custom claims)
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase.client');
      
      const userDoc = await getDoc(doc(db!, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.customClaims) {
          return userData.customClaims as CustomClaims;
        }
      }
      
      // Fallback to Firebase Auth claims
      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      return tokenResult.claims as CustomClaims;
    } catch (error) {
      console.error('Error getting custom claims:', error);
      return null;
    }
  }

  /**
   * Update role and onboarding step
   */
  async setRole(uid: string, role: string, onboardingStep: string = 'profile'): Promise<void> {
    await this.setCustomClaims(uid, {
      role,
      onboardingStep,
      profileCompleted: false,
      kycStatus: 'pending',
      kybStatus: 'pending',
      kybSkipped: false,
      pitchSubmitted: false
    });
  }

  /**
   * Mark profile as completed
   */
  async markProfileCompleted(uid: string): Promise<void> {
    await this.setCustomClaims(uid, {
      profileCompleted: true,
      onboardingStep: 'kyc'
    });
  }

  /**
   * Update KYC status
   */
  async updateKYCStatus(uid: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    const updates: Partial<CustomClaims> = {
      kycStatus: status
    };

    if (status === 'approved') {
      updates.onboardingStep = 'kyb_decision';
    }

    await this.setCustomClaims(uid, updates);
  }

  /**
   * Update KYB status
   */
  async updateKYBStatus(uid: string, status: 'pending' | 'approved' | 'rejected' | 'skipped'): Promise<void> {
    const updates: Partial<CustomClaims> = {
      kybStatus: status
    };

    if (status === 'skipped') {
      updates.kybSkipped = true;
      updates.onboardingStep = 'pitch';
    } else if (status === 'approved') {
      updates.onboardingStep = 'pitch';
    }

    await this.setCustomClaims(uid, updates);
  }

  /**
   * Mark pitch as submitted
   */
  async markPitchSubmitted(uid: string): Promise<void> {
    await this.setCustomClaims(uid, {
      pitchSubmitted: true,
      onboardingStep: 'home'
    });
  }

  /**
   * Check if user can access pitch
   */
  async canAccessPitch(): Promise<boolean> {
    const claims = await this.getCustomClaims();
    return claims?.kycStatus === 'approved' && !claims?.pitchSubmitted;
  }

  /**
   * Get current onboarding step
   */
  async getCurrentStep(): Promise<string> {
    const claims = await this.getCustomClaims();
    return claims?.onboardingStep || 'profile';
  }

  /**
   * Check if step is completed
   */
  async isStepCompleted(step: string): Promise<boolean> {
    const claims = await this.getCustomClaims();
    
    switch (step) {
      case 'profile':
        return claims?.profileCompleted === true;
      case 'kyc':
        return claims?.kycStatus === 'approved';
      case 'kyb':
        return claims?.kybStatus === 'approved' || claims?.kybSkipped === true;
      case 'pitch':
        return claims?.pitchSubmitted === true;
      default:
        return false;
    }
  }
}

export const authClaimsManager = AuthClaimsManager.getInstance();
