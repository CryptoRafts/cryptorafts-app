"use client";

import { auth, db } from './firebase.client';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getUserRole } from './role-persistence';

export interface RoleFlowState {
  role: string | null;
  onboardingStep: string | null;
  profileCompleted: boolean;
  kycStatus: string | null;
  kybStatus: string | null;
  pitchSubmitted: boolean;
  orgId: string | null;
}

export class RoleFlowManager {
  private static instance: RoleFlowManager;
  private currentState: RoleFlowState | null = null;
  private hasRedirected = false;

  public static getInstance(): RoleFlowManager {
    if (!RoleFlowManager.instance) {
      RoleFlowManager.instance = new RoleFlowManager();
    }
    return RoleFlowManager.instance;
  }

  /**
   * Get the current user's role flow state
   */
  async getCurrentState(): Promise<RoleFlowState> {
    if (!auth || !auth.currentUser) {
      return {
        role: null,
        onboardingStep: null,
        profileCompleted: false,
        kycStatus: null,
        kybStatus: null,
        pitchSubmitted: false,
        orgId: null
      };
    }

    // First try to get data from localStorage (role persistence)
    const storedRoleData = getUserRole();
    if (storedRoleData) {
      console.log('RoleFlowManager: Using stored role data:', storedRoleData.role);
      this.currentState = {
        role: storedRoleData.role,
        onboardingStep: storedRoleData.claims.onboardingStep || null,
        profileCompleted: storedRoleData.claims.profileCompleted || false,
        kycStatus: storedRoleData.claims.kycStatus || 'pending',
        kybStatus: storedRoleData.claims.kybStatus || 'pending',
        pitchSubmitted: storedRoleData.claims.pitchSubmitted || false,
        orgId: storedRoleData.claims.orgId || null
      };
      
      console.log('RoleFlowManager: Current state from localStorage:', this.currentState);
      return this.currentState;
    }

    // Fallback to Firebase if no localStorage data
    try {
      if (!db) throw new Error('Firestore not initialized');
      const userDoc = await getDoc(doc(db!, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        return {
          role: null,
          onboardingStep: null,
          profileCompleted: false,
          kycStatus: null,
          kybStatus: null,
          pitchSubmitted: false,
          orgId: null
        };
      }

      const userData = userDoc.data();
      
      // Get KYB status from organization if orgId exists
      let kybStatus = userData.kyb?.status || 'pending';
      if (userData.orgId) {
        try {
          const orgDoc = await getDoc(doc(db!, 'organizations', userData.orgId));
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            kybStatus = orgData.kyb?.status || 'pending';
          }
        } catch (error) {
          console.warn('Could not fetch organization KYB status:', error);
        }
      }

      this.currentState = {
        role: userData.role || null,
        onboardingStep: userData.onboarding?.step || null,
        profileCompleted: userData.profileCompleted || false,
        kycStatus: userData.kyc?.status || 'pending',
        kybStatus: kybStatus,
        pitchSubmitted: userData.pitch?.submitted || userData.pitchSubmitted || false,
        orgId: userData.orgId || null
      };

      console.log('RoleFlowManager: Current state from Firebase:', {
        userData: {
          role: userData.role,
          onboarding: userData.onboarding,
          profileCompleted: userData.profileCompleted,
          kyc: userData.kyc,
          orgId: userData.orgId
        },
        currentState: this.currentState
      });

      return this.currentState;
    } catch (error) {
      console.error('Error getting role flow state from Firebase:', error);
      
      // Return default state if Firebase fails
      return {
        role: null,
        onboardingStep: null,
        profileCompleted: false,
        kycStatus: null,
        kybStatus: null,
        pitchSubmitted: false,
        orgId: null
      };
    }
  }

  /**
   * Determine the correct route for the user based on their current state
   */
  async getCorrectRoute(): Promise<string> {
    const state = await this.getCurrentState();
    
    // If no role is set, go to role selection
    if (!state.role) {
      return '/role';
    }

    // Role-specific routing
    switch (state.role) {
      case 'vc':
        return this.getVCRoute(state);
      case 'founder':
        return this.getFounderRoute(state);
      case 'exchange':
        return this.getExchangeRoute(state);
      case 'ido':
        return this.getIDORoute(state);
      case 'agency':
        return this.getAgencyRoute(state);
      case 'influencer':
        return this.getInfluencerRoute(state);
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/role';
    }
  }

  /**
   * Get the correct route for VC users
   */
  private getVCRoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/vc/dashboard';
    }

    // If profile is not completed, go to onboarding
    if (!state.profileCompleted || !state.orgId) {
      return '/vc/onboarding';
    }

    // If KYB is approved, go to dashboard
    if (state.kybStatus === 'approved') {
      return '/vc/dashboard';
    }

    // If KYB is pending or rejected, go to verification
    return '/vc/verification';
  }

  /**
   * Get the correct route for Founder users
   */
  private getFounderRoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/founder/dashboard';
    }

    // If profile is not completed, go to register
    if (!state.profileCompleted) {
      return '/founder/register';
    }

    // If KYC is not completed, go to KYC
    if (state.kycStatus !== 'approved') {
      return '/founder/kyc';
    }

    // If pitch is not submitted, go to pitch
    if (!state.pitchSubmitted) {
      return '/founder/pitch';
    }

    // All steps completed
    return '/founder/dashboard';
  }

  /**
   * Get the correct route for Exchange users
   */
  private getExchangeRoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/exchange/dashboard';
    }

    // If profile is not completed, go to register
    if (!state.profileCompleted) {
      return '/exchange/register';
    }

    // If KYB is approved, go to dashboard
    if (state.kybStatus === 'approved') {
      return '/exchange/dashboard';
    }

    // If KYB is pending or rejected, go to KYB verification
    return '/exchange/kyb';
  }

  /**
   * Get the correct route for IDO users
   */
  private getIDORoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/ido/dashboard';
    }

    // If profile is not completed, go to register
    if (!state.profileCompleted) {
      return '/ido/register';
    }

    // If KYB is approved, go to dashboard
    if (state.kybStatus === 'approved') {
      return '/ido/dashboard';
    }

    // If KYB is pending or rejected, go to KYB verification
    return '/ido/kyb';
  }

  /**
   * Get the correct route for Agency users
   */
  private getAgencyRoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/agency/dashboard';
    }

    // If profile is not completed, go to register
    if (!state.profileCompleted) {
      return '/agency/register';
    }

    // If KYB is approved, go to dashboard
    if (state.kybStatus === 'approved') {
      return '/agency/dashboard';
    }

    // If KYB is pending or rejected, go to KYB verification
    return '/agency/kyb';
  }

  /**
   * Get the correct route for Influencer users
   */
  private getInfluencerRoute(state: RoleFlowState): string {
    // If onboarding is done, go to dashboard
    if (state.onboardingStep === 'done') {
      return '/influencer/dashboard';
    }

    // If profile is not completed, go to register
    if (!state.profileCompleted) {
      return '/influencer/register';
    }

    // If KYC is approved, go to dashboard
    if (state.kycStatus === 'approved') {
      return '/influencer/dashboard';
    }

    // If KYC is pending or rejected, go to KYC verification
    return '/influencer/kyc';
  }

  /**
   * Get the correct route for other roles (fallback)
   */
  private getOtherRoleRoute(state: RoleFlowState): string {
    // For other roles, if profile is completed, go to dashboard
    if (state.profileCompleted) {
      return `/${state.role}/dashboard`;
    }

    // Otherwise go to register
    return `/${state.role}/register`;
  }

  /**
   * Check if user should be redirected and return the target route
   */
  async shouldRedirect(currentPath: string): Promise<string | null> {
    const correctRoute = await this.getCorrectRoute();
    
    // If we're already on the correct route, no redirect needed
    if (currentPath === correctRoute) {
      return null;
    }

    // If we've already redirected in this session, don't redirect again
    if (this.hasRedirected) {
      return null;
    }

    this.hasRedirected = true;
    return correctRoute;
  }

  /**
   * Reset the redirect flag (call this when user navigates manually)
   */
  resetRedirectFlag(): void {
    this.hasRedirected = false;
  }

  /**
   * Mark a step as completed
   */
  async markStepCompleted(step: string): Promise<void> {
    if (!auth || !auth.currentUser) return;

    try {
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      switch (step) {
        case 'profile':
          updates.profileCompleted = true;
          updates['onboarding.step'] = 'verification';
          break;
        case 'kyc':
          updates['kyc.status'] = 'approved';
          updates['onboarding.step'] = 'pitch';
          break;
        case 'kyb':
          updates['onboarding.step'] = 'done';
          updates['onboarding.completedAt'] = Date.now();
          break;
        case 'pitch':
          updates['pitch.submitted'] = true;
          updates['onboarding.step'] = 'done';
          updates['onboarding.completedAt'] = Date.now();
          break;
      }

      if (!db) throw new Error('Firestore not initialized');
      await updateDoc(doc(db!, 'users', auth.currentUser.uid), updates);
      
      // Reset redirect flag so user can be redirected to next step
      this.resetRedirectFlag();
    } catch (error) {
      console.error('Error marking step as completed:', error);
      throw error;
    }
  }

  /**
   * Check if a step is completed
   */
  async isStepCompleted(step: string): Promise<boolean> {
    const state = await this.getCurrentState();
    console.log(`RoleFlowManager: Checking step '${step}' completion:`, {
      step,
      state,
      onboardingStep: state.onboardingStep,
      isOnboardingDone: state.onboardingStep === 'done'
    });
    
    switch (step) {
      case 'profile':
        return state.profileCompleted;
      case 'kyc':
        return state.kycStatus === 'approved';
      case 'kyb':
        return state.kybStatus === 'approved';
      case 'pitch':
        return state.pitchSubmitted;
      case 'onboarding':
        return state.onboardingStep === 'done';
      default:
        return false;
    }
  }
}

export const roleFlowManager = RoleFlowManager.getInstance();
