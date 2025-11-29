"use client";

import { auth, db } from './firebase.client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';

export type Role = 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';

export interface GlobalRules {
  // Forward-only onboarding enforcement
  isStepCompleted: (step: string) => boolean;
  canAccessStep: (step: string) => boolean;
  
  // Role locking enforcement
  isRoleLocked: () => boolean;
  lockRole: (role: Role) => Promise<void>;
  
  // KYC/KYB gating
  isKYCApproved: () => boolean;
  isKYCRejected: () => boolean;
  isKYCPending: () => boolean;
  isKYBApproved: () => boolean;
  canAccessPortal: () => boolean;
  
  // Pitch-once policy
  hasPitchSubmitted: () => boolean;
  canSubmitPitch: () => boolean;
  
  // Real-time data enforcement
  useRealTimeData: () => boolean;
  
  // Security and audit
  logAuditEvent: (action: string, subject: string, details?: any) => Promise<void>;
}

export class GlobalRulesManager implements GlobalRules {
  private static instance: GlobalRulesManager;
  private userClaims: any = null;
  private userProfile: any = null;
  
  public static getInstance(): GlobalRulesManager {
    if (!GlobalRulesManager.instance) {
      GlobalRulesManager.instance = new GlobalRulesManager();
    }
    return GlobalRulesManager.instance;
  }

  /**
   * Initialize with current user data
   */
  async initialize(): Promise<void> {
    if (!auth.currentUser) return;
    
    try {
      // Get user profile (which includes our custom claims)
      const userDoc = await getDoc(doc(db!, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
        // Use custom claims from Firestore, fallback to auth claims
        this.userClaims = this.userProfile.customClaims || {};
      }
    } catch (error) {
      console.error('Error initializing global rules:', error);
    }
  }

  /**
   * Forward-only onboarding: Check if step is completed
   */
  isStepCompleted(step: string): boolean {
    if (!this.userProfile) return false;
    
    switch (step) {
      case 'profile':
        return this.userProfile.profileCompleted || 
               (this.userProfile.display_name && this.userProfile.bio);
      
      case 'kyc':
        return this.userProfile.kyc_status === 'approved' || 
               this.userProfile.kyc?.status === 'approved';
      
      case 'kyb':
        return this.userProfile.kyb_status === 'approved' || 
               this.userProfile.kyb?.status === 'approved' ||
               this.userProfile.kyb_status === 'skipped' ||
               this.userProfile.kyb?.status === 'skipped';
      
      case 'pitch':
        return this.userProfile.pitch?.submitted || 
               this.userProfile.pitchSubmitted ||
               this.userProfile.hasPitch;
      
      default:
        return false;
    }
  }

  /**
   * Forward-only onboarding: Check if user can access step
   */
  canAccessStep(step: string): boolean {
    if (!this.userProfile) return false;
    
    // Special handling for profile step - always allow access
    if (step === 'profile') {
      return true;
    }
    
    // Check if profile setup is actually complete
    const isProfileComplete = this.userProfile.profileCompleted || 
                             (this.userProfile.display_name && this.userProfile.bio);
    
    // If profile is not complete, only allow profile step
    if (!isProfileComplete) {
      return step === 'profile';
    }
    
    const currentStep = this.userProfile.onboardingStep || 'profile';
    const stepOrder = ['profile', 'kyc', 'kyb_decision', 'kyb', 'pitch', 'home'];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    // Can only access current step or completed steps
    return targetIndex <= currentIndex || this.isStepCompleted(step);
  }

  /**
   * Role locking: Check if role is locked
   */
  isRoleLocked(): boolean {
    return !!(this.userClaims?.role && this.userProfile?.role);
  }

  /**
   * Role locking: Lock role permanently
   */
  async lockRole(role: Role): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    try {
      console.log('GlobalRules: Locking role:', role, 'for user:', auth.currentUser.uid);
      
      // Update user profile with role and custom claims
      await updateDoc(doc(db!, 'users', auth.currentUser.uid), {
        role,
        roleLocked: true,
        roleLockedAt: serverTimestamp(),
        customClaims: { role },
        claimsUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('GlobalRules: Role locked successfully');
      
      // Force token refresh
      await auth.currentUser.getIdToken(true);
      
      // Reinitialize
      await this.initialize();
      
    } catch (error) {
      console.error('Error locking role:', error);
      throw error;
    }
  }

  /**
   * KYC gating: Check if KYC is approved
   */
  isKYCApproved(): boolean {
    return this.userClaims?.kycStatus === 'approved' || 
           this.userProfile?.kyc?.status === 'approved' ||
           this.userProfile?.kyc_status === 'approved';
  }

  /**
   * KYC gating: Check if KYC has failed and needs retry
   */
  isKYCRejected(): boolean {
    return this.userProfile?.kyc_status === 'rejected' || 
           this.userProfile?.kyc?.status === 'rejected';
  }

  /**
   * KYC gating: Check if KYC is pending
   */
  isKYCPending(): boolean {
    return this.userProfile?.kyc_status === 'pending' || 
           this.userProfile?.kyc?.status === 'pending';
  }

  /**
   * KYB gating: Check if KYB is approved
   */
  isKYBApproved(): boolean {
    return this.userClaims?.kybStatus === 'approved' || 
           this.userProfile?.kyb?.status === 'approved';
  }

  /**
   * Portal access: Check if user can access founder portal
   */
  canAccessPortal(): boolean {
    if (!this.isRoleLocked()) return false;
    if (this.userClaims?.role !== 'founder') return false;
    return this.isKYCApproved();
  }

  /**
   * Pitch-once policy: Check if pitch is submitted
   */
  hasPitchSubmitted(): boolean {
    return !!(this.userProfile?.pitch?.submitted || this.userClaims?.pitchSubmitted);
  }

  /**
   * Pitch-once policy: Check if user can submit pitch
   */
  canSubmitPitch(): boolean {
    if (!this.canAccessPortal()) return false;
    if (this.hasPitchSubmitted()) return false;
    return true;
  }

  /**
   * Real-time data enforcement
   */
  useRealTimeData(): boolean {
    return true; // Always use real-time data, no mockups
  }

  /**
   * Security and audit: Log critical events
   */
  async logAuditEvent(action: string, subject: string, details?: any): Promise<void> {
    if (!auth.currentUser) return;
    
    try {
      const auditRef = doc(collection(db!, 'audits'));
      await setDoc(auditRef, {
        id: auditRef.id,
        actor: auth.currentUser.uid,
        action,
        subject,
        details: details || {},
        timestamp: serverTimestamp(),
        ipHash: await this.hashIP(), // Simplified for demo
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Hash IP address for privacy
   */
  private async hashIP(): Promise<string> {
    // Simplified IP hashing for demo
    return 'hashed_ip_' + Date.now();
  }

  /**
   * Get current user's role
   */
  getCurrentRole(): Role | null {
    return this.userClaims?.role || this.userProfile?.role || null;
  }

  /**
   * Get current onboarding step
   */
  getCurrentStep(): string {
    // Check if profile setup is actually complete
    const isProfileComplete = this.userProfile?.profileCompleted || 
                             (this.userProfile?.display_name && this.userProfile?.bio);
    
    // If profile is not complete, force to profile step
    if (!isProfileComplete) {
      return 'profile';
    }
    
    // Check KYC status
    const isKYCCompleted = this.userProfile?.kyc_status === 'approved' || 
                          this.userProfile?.kyc?.status === 'approved' ||
                          this.userProfile?.onboarding_state === 'DONE';
    
    // If KYC not completed, return KYC step
    if (!isKYCCompleted) {
      return 'kyc';
    }
    
    // Check if pitch is submitted
    const hasPitch = this.userProfile?.pitch?.submitted || 
                    this.userProfile?.pitchSubmitted || 
                    this.userProfile?.hasPitch;
    
    // If pitch not submitted, return pitch step
    if (!hasPitch) {
      return 'pitch';
    }
    
    // All steps completed
    return 'done';
  }

  /**
   * Mark step as completed
   */
  async markStepCompleted(step: string): Promise<void> {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db!, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const completedSteps = userData.completedSteps || [];
        
        if (!completedSteps.includes(step)) {
          completedSteps.push(step);
          
          await updateDoc(userRef, {
            completedSteps,
            [`${step}CompletedAt`]: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Log audit event
          await this.logAuditEvent('step_completed', step, { userId: auth.currentUser.uid });
        }
      }
    } catch (error) {
      console.error('Error marking step as completed:', error);
      throw error;
    }
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(step: string): Promise<void> {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db!, 'users', auth.currentUser.uid), {
        onboardingStep: step,
        updatedAt: serverTimestamp()
      });
      
      // Update custom claims
      const setClaims = await import('./auth-claims').then(m => m.authClaimsManager);
      await setClaims.setCustomClaims(auth.currentUser.uid, { onboardingStep: step });
      
      // Reinitialize
      await this.initialize();
      
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }
}

export const globalRules = GlobalRulesManager.getInstance();
