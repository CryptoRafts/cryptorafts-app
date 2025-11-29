"use client";

import { 
  auth, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification,
  onAuthStateChanged
} from './firebase.client';
import { 
  db, doc, setDoc, getDoc, updateDoc, serverTimestamp 
} from './firebase.client';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';
  onboardingStep: 'role' | 'profile' | 'kyc' | 'kyb' | 'complete';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kybStatus: 'pending' | 'verified' | 'rejected';
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
  profile?: UserProfile;
  error?: string;
  requiresRole?: boolean;
  requiresKyc?: boolean;
  requiresKyb?: boolean;
  onboardingStep?: string;
}

class CompleteAuthService {
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

      // Update last login
      await updateDoc(doc(db!, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      // Create a stable reference to prevent infinite re-renders
      const stableProfile = this.userProfile ? { ...this.userProfile } : null;
      listener(this.currentUser, stableProfile);
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
        return {
          success: false,
          error: 'Google sign-in is not available in this environment'
        };
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      return {
        success: true,
        user,
        profile: this.userProfile ?? undefined,
        requiresRole: !this.userProfile?.role,
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
      
      return {
        success: true,
        user,
        profile: this.userProfile ?? undefined,
        requiresRole: !this.userProfile?.role,
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
      
      return {
        success: true,
        user,
        profile: this.userProfile ?? undefined,
        requiresRole: true,
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
        onboardingStep: 'complete',
        updatedAt: serverTimestamp()
      });

      this.userProfile.role = role;
      this.userProfile.onboardingStep = 'complete';
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  public isAdmin(): boolean {
    return this.userProfile?.role === 'admin' || 
           this.userProfile?.email === 'anasshamsiggc@gmail.com';
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
export const completeAuthService = new CompleteAuthService();

// Hook for auth state
export function useCompleteAuth() {
  const [state, setState] = useState<{
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAuthed: boolean;
  }>({
    user: null,
    profile: null,
    loading: true,
    isAuthed: false
  });

  useEffect(() => {
    const unsubscribe = completeAuthService.addAuthListener((user, profile) => {
      setState({
        user,
        profile,
        loading: false,
        isAuthed: !!user
      });
    });

    return unsubscribe;
  }, []);

  return state;
}

// Auth actions hook
export function useAuthActions() {
  const signInWithGoogle = async () => {
    return await completeAuthService.signInWithGoogle();
  };

  const signInWithEmail = async (email: string, password: string) => {
    return await completeAuthService.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    return await completeAuthService.signUpWithEmail(email, password, displayName);
  };

  const signOut = async () => {
    return await completeAuthService.signOut();
  };

  const updateRole = async (role: UserProfile['role']) => {
    return await completeAuthService.updateUserRole(role);
  };

  return {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateRole
  };
}
