"use client";

import { 
  auth, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification,
  getIdToken, onAuthStateChanged
} from './firebase.client';
import { 
  db, doc, setDoc, getDoc, updateDoc, serverTimestamp 
} from './firebase.client';
// import { customClaimsService } from './custom-claims.service';
import type { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kybStatus: 'pending' | 'verified' | 'rejected';
  onboardingStep: 'role' | 'profile' | 'kyc' | 'kyb' | 'complete';
  createdAt: any;
  updatedAt: any;
  lastLoginAt: any;
  isActive: boolean;
  department?: string;
  permissions?: string[];
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresKyc?: boolean;
  requiresKyb?: boolean;
  onboardingStep?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;
  private listeners: ((user: User | null, profile: UserProfile | null) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user);
        await this.refreshToken();
      } else {
        this.userProfile = null;
      }
      this.notifyListeners();
    });
  }

  private async loadUserProfile(user: User): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db!, 'users', user.uid));
      if (userDoc.exists()) {
        this.userProfile = { ...userDoc.data(), uid: user.uid } as UserProfile;
      } else {
        // Create new user profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          kycStatus: 'pending',
          kybStatus: 'pending',
          onboardingStep: 'role',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true
        };
        
        await setDoc(doc(db!, 'users', user.uid), newProfile);
        this.userProfile = { ...newProfile, uid: user.uid };
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    if (this.currentUser) {
      try {
        // Force token refresh to get updated custom claims
        await getIdToken(this.currentUser, true);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.currentUser, this.userProfile);
    });
  }

  // Public methods
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  public addAuthListener(listener: (user: User | null, profile: UserProfile | null) => void): () => void {
    this.listeners.push(listener);
    // Call immediately with current state
    listener(this.currentUser, this.userProfile);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async signInWithGoogle(): Promise<AuthResult> {
    try {
      if (!googleProvider) {
        return { success: false, error: 'Google sign-in is not available in this environment' };
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Update last login
      await updateDoc(doc(db!, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.refreshToken();
      
      return {
        success: true,
        user,
        requiresKyc: this.userProfile?.kycStatus === 'pending',
        requiresKyb: this.userProfile?.kybStatus === 'pending',
        onboardingStep: this.userProfile?.onboardingStep
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Google sign-in failed'
      };
    }
  }

  public async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update last login
      await updateDoc(doc(db!, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.refreshToken();
      
      return {
        success: true,
        user,
        requiresKyc: this.userProfile?.kycStatus === 'pending',
        requiresKyb: this.userProfile?.kybStatus === 'pending',
        onboardingStep: this.userProfile?.onboardingStep
      };
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Email sign-in failed'
      };
    }
  }

  public async signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update profile
      await updateProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        photoURL: user.photoURL || undefined,
        kycStatus: 'pending',
        kybStatus: 'pending',
        onboardingStep: 'role',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true
      };
      
      await setDoc(doc(db!, 'users', user.uid), userProfile);
      this.userProfile = { ...userProfile, uid: user.uid };
      
      await this.refreshToken();
      
      return {
        success: true,
        user,
        requiresKyc: false,
        requiresKyb: false,
        onboardingStep: 'role'
      };
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      return {
        success: false,
        error: error.message || 'Email sign-up failed'
      };
    }
  }

  public async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.userProfile = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  public async updateUserRole(role: UserProfile['role']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        role,
        onboardingStep: 'profile',
        updatedAt: serverTimestamp()
      });

      this.userProfile.role = role;
      this.userProfile.onboardingStep = 'profile';
      
      // Update custom claims (disabled for now)
      // await customClaimsService.updateUserClaims(this.currentUser.uid, { role });
      
      await this.refreshToken();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  public async updateOnboardingStep(step: UserProfile['onboardingStep']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        onboardingStep: step,
        updatedAt: serverTimestamp()
      });

      this.userProfile.onboardingStep = step;
      
      // Update custom claims (disabled for now)
      // await customClaimsService.updateUserClaims(this.currentUser.uid, { onboardingStep: step });
      
      await this.refreshToken();
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  public async updateKycStatus(status: UserProfile['kycStatus']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        kycStatus: status,
        updatedAt: serverTimestamp()
      });

      this.userProfile.kycStatus = status;
      
      // Update custom claims (disabled for now)
      // await customClaimsService.updateUserClaims(this.currentUser.uid, { kyc_verified: status === 'verified' });
      
      await this.refreshToken();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  public async updateKybStatus(status: UserProfile['kybStatus']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        kybStatus: status,
        updatedAt: serverTimestamp()
      });

      this.userProfile.kybStatus = status;
      
      // Update custom claims (disabled for now)
      // await customClaimsService.updateUserClaims(this.currentUser.uid, { kyb_verified: status === 'verified' });
      
      await this.refreshToken();
    } catch (error) {
      console.error('Error updating KYB status:', error);
      throw error;
    }
  }

  public async getFreshToken(): Promise<string | null> {
    if (!this.currentUser) return null;
    
    try {
      return await getIdToken(this.currentUser, true);
    } catch (error) {
      console.error('Error getting fresh token:', error);
      return null;
    }
  }

  public isAdmin(): boolean {
    return this.userProfile?.role === 'admin' || 
           this.userProfile?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  }

  public hasRole(role: UserProfile['role']): boolean {
    return this.userProfile?.role === role;
  }

  public isKycVerified(): boolean {
    return this.userProfile?.kycStatus === 'verified';
  }

  public isKybVerified(): boolean {
    return this.userProfile?.kybStatus === 'verified';
  }

  public isOnboardingComplete(): boolean {
    return this.userProfile?.onboardingStep === 'complete';
  }
}

// Export singleton instance
export const authService = new AuthService();
