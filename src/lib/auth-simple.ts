"use client";

import { 
  auth, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification,
  onAuthStateChanged
} from './firebase.client';
import { 
  db, doc, setDoc, getDoc, updateDoc, serverTimestamp 
} from './firebase.client';
import { useEffect, useState, useRef } from 'react';
import type { User } from 'firebase/auth';

export interface SimpleUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role?: 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';
  onboardingStep: 'role' | 'profile' | 'kyc' | 'kyb_decision' | 'kyb' | 'pitch' | 'complete';
  profileCompleted: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  kybStatus: 'pending' | 'approved' | 'rejected';
  kybSkipped?: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt: any;
  isActive: boolean;
  // Profile data
  bio?: string;
  website?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
    github?: string;
  };
  profilePhotoUrl?: string;
  // KYC data
  kyc?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt?: number;
    cooldownUntil?: number;
  };
  kyb?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt?: number;
  };
}

export interface AuthResult {
  success: boolean;
  user?: User;
  profile?: SimpleUserProfile;
  error?: string;
  requiresRole?: boolean;
  requiresKyc?: boolean;
  requiresKyb?: boolean;
  onboardingStep?: string;
}

class SimpleAuthService {
  private static instance: SimpleAuthService | null = null;
  private currentUser: User | null = null;
  private userProfile: SimpleUserProfile | null = null;
  private listeners: ((user: User | null, profile: SimpleUserProfile | null) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  public static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  private async initializeAuth() {
    // Check for existing user immediately (before onAuthStateChanged fires)
    // This ensures we detect authenticated users right away
    if (auth && auth.currentUser) {
      this.currentUser = auth.currentUser;
      try {
        await this.loadUserProfile(auth.currentUser);
      } catch (err) {
        console.error('Error loading user profile during init:', err);
      }
      this.notifyListeners();
    }
    
    // Set up listener for auth state changes
    if (auth) {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          try {
            await this.loadUserProfile(user);
          } catch (err) {
            console.error('Error loading user profile in auth state change:', err);
          }
        } else {
          this.userProfile = null;
        }
        this.notifyListeners();
      });
    }
  }

      private async loadUserProfile(user: User): Promise<void> {
        try {
          const userDoc = await getDoc(doc(db!, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const newProfile = { 
              uid: user.uid,
              email: data.email || user.email || '',
              displayName: data.displayName || user.displayName || '',
              role: data.role,
              onboardingStep: data.onboardingStep || 'role',
              profileCompleted: data.profileCompleted || false,
              kycStatus: data.kycStatus || 'pending',
              kybStatus: data.kybStatus || 'pending',
              kybSkipped: data.kybSkipped || false,
              bio: data.bio,
              website: data.website,
              socials: data.socials,
              profilePhotoUrl: data.profilePhotoUrl,
              kyc: data.kyc,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              lastLoginAt: data.lastLoginAt,
              isActive: data.isActive !== false
            } as SimpleUserProfile;
            
            // Only update if the profile has actually changed
            if (!this.userProfile || JSON.stringify(this.userProfile) !== JSON.stringify(newProfile)) {
              this.userProfile = newProfile;
            }
          } else {
            // Create new user profile with default values
            const newProfile: SimpleUserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              kycStatus: 'pending',
              kybStatus: 'pending',
              profileCompleted: false,
              kybSkipped: false,
              onboardingStep: 'role',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              isActive: true
            };
            
            try {
              await setDoc(doc(db!, 'users', user.uid), newProfile);
              this.userProfile = { ...newProfile, uid: user.uid };
            } catch (createError) {
              console.error('Error creating user profile:', createError);
              // Use local profile if creation fails
              this.userProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                kycStatus: 'pending',
                kybStatus: 'pending',
                profileCompleted: false,
                kybSkipped: false,
                onboardingStep: 'role',
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date(),
                isActive: true
              };
            }
          }

          // Update last login (don't fail if this fails)
          try {
            await updateDoc(doc(db!, 'users', user.uid), {
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (updateError) {
            console.warn('Error updating last login:', updateError);
            // Continue without failing
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Create a minimal profile if Firestore fails
          this.userProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            kycStatus: 'pending',
            kybStatus: 'pending',
            profileCompleted: false,
            kybSkipped: false,
            onboardingStep: 'role',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            isActive: true
          };
        }
      }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      // Use the same reference to prevent infinite re-renders
      listener(this.currentUser, this.userProfile);
    });
  }

  // Public methods
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getUserProfile(): SimpleUserProfile | null {
    return this.userProfile;
  }

  public addAuthListener(listener: (user: User | null, profile: SimpleUserProfile | null) => void): () => void {
    this.listeners.push(listener);
    
    // Call immediately with current state
    // If we have a current user but profile isn't loaded yet, still pass the user
    // This prevents the "Authentication Required" message from showing while profile loads
    listener(this.currentUser, this.userProfile);
    
    // Enhanced fallback: Check auth.currentUser with retry logic
    // This handles cases where onAuthStateChanged hasn't fired yet
    if (!this.currentUser && typeof window !== 'undefined' && auth) {
      // Check immediately
      const checkAuthUser = () => {
        try {
          const currentAuthUser = auth?.currentUser;
          if (currentAuthUser && !this.currentUser) {
            // We have a user from Firebase auth, but service hasn't loaded it yet
            // Update our current user and pass it to the listener
            this.currentUser = currentAuthUser;
            listener(currentAuthUser, this.userProfile);
            // Load profile if not already loaded
            if (!this.userProfile) {
              this.loadUserProfile(currentAuthUser).catch(err => {
                console.error('Error loading user profile in addAuthListener:', err);
              });
            }
            return true; // Found user
          }
        } catch (err) {
          console.error('Error checking auth.currentUser:', err);
        }
        return false; // No user found
      };
      
      // Check immediately
      if (!checkAuthUser()) {
        // If not found, check again after a short delay (auth might still be initializing)
        const timeoutId = setTimeout(() => {
          checkAuthUser();
        }, 100);
        
        // Also check after a longer delay as final fallback
        const timeoutId2 = setTimeout(() => {
          checkAuthUser();
        }, 500);
        
        // Store timeout IDs for cleanup (though we can't easily clean them up in unsubscribe)
        // This is acceptable as the timeouts are short and will complete quickly
      }
    }
    
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
      
      // Handle specific Firebase errors
      let errorMessage = 'Email sign-up failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please try signing in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
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

  public async updateUserRole(role: SimpleUserProfile['role']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      // Update Firestore
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        role,
        onboardingStep: 'profile',
        profileCompleted: false,
        updatedAt: serverTimestamp()
      });

      // Sync with role-sync API to set cookies
      try {
        const idToken = await this.currentUser.getIdToken(true);
        const response = await fetch('/api/role-sync', {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${idToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ role })
        });
        
        if (!response.ok) {
          throw new Error(`Role sync failed: ${response.statusText}`);
        }
      } catch (apiError) {
        console.warn('Failed to sync role with API:', apiError);
        // Continue even if API sync fails
      }

      this.userProfile.role = role;
      this.userProfile.onboardingStep = 'profile';
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating user role:', error);
      // Update local state even if Firestore fails
      this.userProfile.role = role;
      this.userProfile.onboardingStep = 'profile';
      this.notifyListeners();
    }
  }

  public isAdmin(): boolean {
    return this.userProfile?.role === 'admin' || 
           this.userProfile?.email === 'anasshamsiggc@gmail.com';
  }

  public hasRole(role: SimpleUserProfile['role']): boolean {
    return this.userProfile?.role === role;
  }

  public isKycVerified(): boolean {
    return this.userProfile?.kycStatus === 'approved';
  }

  public isKybVerified(): boolean {
    return this.userProfile?.kybStatus === 'approved';
  }

  public isOnboardingComplete(): boolean {
    return this.userProfile?.onboardingStep === 'complete';
  }

  public async updateProfile(profileData: Partial<SimpleUserProfile>): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      // Update Firestore
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        ...profileData,
        updatedAt: serverTimestamp()
      });

      // Update local profile
      this.userProfile = { ...this.userProfile, ...profileData };
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  public async updateOnboardingStep(step: SimpleUserProfile['onboardingStep']): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(db!, 'users', this.currentUser.uid), {
        onboardingStep: step,
        updatedAt: serverTimestamp()
      });

      this.userProfile.onboardingStep = step;
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  public async updateKYCStatus(status: SimpleUserProfile['kycStatus'], kycData?: any): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      // Helper function to remove undefined values
      const removeUndefined = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        }
        if (obj !== null && typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            if (obj[key] !== undefined) {
              cleaned[key] = removeUndefined(obj[key]);
            }
          }
          return cleaned;
        }
        return obj;
      };

      const updateData: any = {
        'kycStatus': status,
        'kyc_status': status, // Also set snake_case for compatibility
        'updatedAt': serverTimestamp()
      };

      if (kycData) {
        // Helper to extract URL from document (handles both string URLs and objects with downloadURL)
        const extractUrl = (doc: any): string => {
          if (!doc) return '';
          if (typeof doc === 'string' && doc.trim().length > 0) return doc.trim();
          if (typeof doc === 'object' && doc !== null) {
            if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
              return doc.downloadURL.trim();
            }
            if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
              return doc.url.trim();
            }
            if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
              return doc.path.trim();
            }
          }
          return '';
        };
        
        // Normalize documents to ensure they're strings, not objects
        const normalizeKycDocuments = (data: any): any => {
          if (!data || typeof data !== 'object') return data;
          
          const normalized: any = { ...data };
          
          // Normalize documents at top level
          if (normalized.documents && typeof normalized.documents === 'object') {
            normalized.documents = {
              idFront: extractUrl(normalized.documents.idFront) || null,
              idBack: extractUrl(normalized.documents.idBack) || null,
              selfie: extractUrl(normalized.documents.selfie) || null,
              proofOfAddress: extractUrl(normalized.documents.proofOfAddress) || null
            };
          }
          
          // Normalize documents in details
          if (normalized.details && typeof normalized.details === 'object') {
            if (normalized.details.documents && typeof normalized.details.documents === 'object') {
              normalized.details.documents = {
                idFront: extractUrl(normalized.details.documents.idFront) || null,
                idBack: extractUrl(normalized.details.documents.idBack) || null,
                selfie: extractUrl(normalized.details.documents.selfie) || null,
                proofOfAddress: extractUrl(normalized.details.documents.proofOfAddress) || null
              };
            }
            // Also normalize direct URL fields in details
            if (normalized.details.idFrontUrl) normalized.details.idFrontUrl = extractUrl(normalized.details.idFrontUrl) || null;
            if (normalized.details.idBackUrl) normalized.details.idBackUrl = extractUrl(normalized.details.idBackUrl) || null;
            if (normalized.details.selfieUrl) normalized.details.selfieUrl = extractUrl(normalized.details.selfieUrl) || null;
            if (normalized.details.addressProofUrl) normalized.details.addressProofUrl = extractUrl(normalized.details.addressProofUrl) || null;
          }
          
          // Normalize top-level URL fields
          if (normalized.idFrontUrl) normalized.idFrontUrl = extractUrl(normalized.idFrontUrl) || null;
          if (normalized.idBackUrl) normalized.idBackUrl = extractUrl(normalized.idBackUrl) || null;
          if (normalized.selfieUrl) normalized.selfieUrl = extractUrl(normalized.selfieUrl) || null;
          if (normalized.addressProofUrl) normalized.addressProofUrl = extractUrl(normalized.addressProofUrl) || null;
          
          return normalized;
        };
        
        const normalizedKycData = normalizeKycDocuments(kycData);
        updateData['kyc'] = removeUndefined(normalizedKycData);
        // Ensure kyc.status is also set
        if (!updateData['kyc'].status) {
          updateData['kyc'].status = status;
        }
      } else {
        // If no kycData provided, still create/update kyc object with status
        updateData['kyc'] = {
          status: status,
          updatedAt: Date.now()
        };
      }

      await updateDoc(doc(db!, 'users', this.currentUser.uid), updateData);
      console.log('✅ [KYC] Updated user document with KYC status:', {
        kycStatus: status,
        kyc_status: status,
        kyc_object_status: updateData['kyc']?.status,
        userId: this.currentUser.uid
      });

      // IMPORTANT: Also create/update entry in kyc_documents collection for admin visibility
      // CRITICAL: Always sync to kyc_documents, not just when status is 'pending'
      // This ensures admin can see all KYC submissions regardless of status
      if (db) {
        try {
          const { setDoc: setDocFn, getDoc: getDocFn, doc: docFn } = await import('firebase/firestore');
          const userData = this.userProfile;
          
          // Try to get more user info from the user document
          let fullUserData: any = userData || {};
          try {
            const userDoc = await getDocFn(docFn(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
              fullUserData = { ...userData, ...userDoc.data() };
            }
          } catch (e) {
            console.log('Could not fetch full user data, using profile data');
          }
          
          // Helper to extract URL from document (handles both string URLs and objects with downloadURL)
          const extractUrl = (doc: any): string => {
            if (!doc) {
              console.log('📄 [AUTH-EXTRACT] Document is null/undefined');
              return '';
            }
            if (typeof doc === 'string' && doc.trim().length > 0) {
              console.log('📄 [AUTH-EXTRACT] Document is string URL:', doc.substring(0, 50));
              return doc.trim();
            }
            if (typeof doc === 'object' && doc !== null) {
              if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                console.log('📄 [AUTH-EXTRACT] Found downloadURL in object:', doc.downloadURL.substring(0, 50));
                return doc.downloadURL.trim();
              }
              if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                console.log('📄 [AUTH-EXTRACT] Found url in object:', doc.url.substring(0, 50));
                return doc.url.trim();
              }
              console.log('📄 [AUTH-EXTRACT] Object has no valid URL field. Keys:', Object.keys(doc), 'Value:', doc);
            }
            return '';
          };
          
          // Get document URLs from kycData - check multiple possible locations
          // CRITICAL: Check raw verification data structure FIRST (where objects with downloadURL are stored)
          // Then check extracted string URLs (from handleSubmit)
          const idDocuments = kycData?.details?.id_documents || {};
          const proofOfAddress = kycData?.details?.proof_of_address || {};
          const selfieLiveness = kycData?.details?.selfie_liveness || {};
          
          // Enhanced extraction - try all possible paths including nested structures
          const selfieUrl = extractUrl(selfieLiveness.selfie) ||
                           extractUrl(selfieLiveness.selfieImage) ||
                           extractUrl(kycData?.details?.selfieUrl) || 
                           extractUrl(kycData?.details?.documents?.selfie) || 
                           extractUrl(kycData?.selfieUrl) || 
                           extractUrl(kycData?.documents?.selfie) ||
                           extractUrl(kycData?.kyc?.details?.selfie_liveness?.selfie) ||
                           extractUrl(kycData?.kyc?.details?.selfieUrl) ||
                           '';
          const idFrontUrl = extractUrl(idDocuments.idFront) ||
                            extractUrl(idDocuments.front) ||
                            extractUrl(kycData?.details?.idFrontUrl) || 
                            extractUrl(kycData?.details?.documents?.idFront) || 
                            extractUrl(kycData?.idFrontUrl) || 
                            extractUrl(kycData?.documents?.idFront) ||
                            extractUrl(kycData?.kyc?.details?.id_documents?.idFront) ||
                            extractUrl(kycData?.kyc?.details?.idFrontUrl) ||
                            '';
          const idBackUrl = extractUrl(idDocuments.idBack) ||
                           extractUrl(idDocuments.back) ||
                           extractUrl(kycData?.details?.idBackUrl) || 
                           extractUrl(kycData?.details?.documents?.idBack) || 
                           extractUrl(kycData?.idBackUrl) || 
                           extractUrl(kycData?.documents?.idBack) ||
                           extractUrl(kycData?.kyc?.details?.id_documents?.idBack) ||
                           extractUrl(kycData?.kyc?.details?.idBackUrl) ||
                           '';
          const addressProofUrl = extractUrl(proofOfAddress.proofOfAddress) ||
                                 extractUrl(proofOfAddress.proof_of_address) ||
                                 extractUrl(proofOfAddress.address) ||
                                 extractUrl(kycData?.details?.addressProofUrl) || 
                                 extractUrl(kycData?.details?.documents?.proofOfAddress) || 
                                 extractUrl(kycData?.addressProofUrl) || 
                                 extractUrl(kycData?.documents?.proofOfAddress) ||
                                 extractUrl(kycData?.kyc?.details?.proof_of_address?.proofOfAddress) ||
                                 extractUrl(kycData?.kyc?.details?.addressProofUrl) ||
                                 '';
          
          // Enhanced logging to debug document extraction
          console.log('📄 [KYC] Document URLs extracted for kyc_documents:', {
            idFront: idFrontUrl ? '✓' : '✗',
            idBack: idBackUrl ? '✓' : '✗',
            proofOfAddress: addressProofUrl ? '✓' : '✗',
            selfie: selfieUrl ? '✓' : '✗',
            idFrontUrl: idFrontUrl || 'EMPTY',
            idBackUrl: idBackUrl || 'EMPTY',
            addressProofUrl: addressProofUrl || 'EMPTY',
            selfieUrl: selfieUrl || 'EMPTY',
            kycDataKeys: kycData ? Object.keys(kycData) : [],
            kycDataDetails: kycData?.details ? Object.keys(kycData.details) : [],
            kycDataDocuments: kycData?.details?.documents ? Object.keys(kycData.details.documents) : [],
            idDocumentsKeys: Object.keys(idDocuments),
            proofOfAddressKeys: Object.keys(proofOfAddress),
            selfieLivenessKeys: Object.keys(selfieLiveness),
            idDocumentsIdFront: idDocuments.idFront ? (typeof idDocuments.idFront === 'string' ? 'string' : 'object') : 'missing',
            idDocumentsIdBack: idDocuments.idBack ? (typeof idDocuments.idBack === 'string' ? 'string' : 'object') : 'missing',
            proofOfAddressDoc: proofOfAddress.proofOfAddress ? (typeof proofOfAddress.proofOfAddress === 'string' ? 'string' : 'object') : 'missing',
            selfieLivenessSelfie: selfieLiveness.selfie ? (typeof selfieLiveness.selfie === 'string' ? 'string' : 'object') : 'missing'
          });
          
          // Extract personal info from kycData or details
          const personalInfo: any = kycData?.details?.personalInfo || {};
          
          // CRITICAL: Ensure all document URLs are strings, not objects
          const ensureStringUrl = (url: any): string | null => {
            if (!url) return null;
            if (typeof url === 'string' && url.trim().length > 0) return url.trim();
            if (typeof url === 'object' && url !== null) {
              if (url.downloadURL && typeof url.downloadURL === 'string' && url.downloadURL.trim().length > 0) {
                return url.downloadURL.trim();
              }
              if (url.url && typeof url.url === 'string' && url.url.trim().length > 0) {
                return url.url.trim();
              }
            }
            return null;
          };
          
          const finalDocuments = {
            selfie: ensureStringUrl(selfieUrl),
            idFront: ensureStringUrl(idFrontUrl),
            idBack: ensureStringUrl(idBackUrl),
            proofOfAddress: ensureStringUrl(addressProofUrl)
          };
          
          console.log('📄 [KYC-SYNC] Final documents to save:', {
            selfie: finalDocuments.selfie ? '✓' : '✗',
            idFront: finalDocuments.idFront ? '✓' : '✗',
            idBack: finalDocuments.idBack ? '✓' : '✗',
            proofOfAddress: finalDocuments.proofOfAddress ? '✓' : '✗',
            selfieUrl: finalDocuments.selfie || 'EMPTY',
            idFrontUrl: finalDocuments.idFront || 'EMPTY',
            idBackUrl: finalDocuments.idBack || 'EMPTY',
            addressProofUrl: finalDocuments.proofOfAddress || 'EMPTY'
          });
          
          // Get founder profile image/logo for admin visibility
          const founderLogo = ensureStringUrl((fullUserData as any).profile_image_url) ||
                            ensureStringUrl((fullUserData as any).profilePhotoUrl) ||
                            ensureStringUrl((fullUserData as any).photoURL) ||
                            ensureStringUrl((fullUserData as any).logo) ||
                            null;
          
          await setDocFn(docFn(db, 'kyc_documents', this.currentUser.uid), {
            userId: this.currentUser.uid,
            userEmail: fullUserData.email || this.currentUser.email || 'N/A',
            userName: fullUserData.displayName || 
                     (fullUserData as any).name || 
                     `${(fullUserData as any).firstName || ''} ${(fullUserData as any).lastName || ''}`.trim() || 
                     this.currentUser.displayName || 'Unknown',
            // CRITICAL: Include founder logo/profile image for admin
            founderLogo: founderLogo,
            profileImageUrl: founderLogo, // Also include as profileImageUrl for compatibility
            status: status,
            submittedAt: serverTimestamp(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,
            personalInfo: {
              firstName: personalInfo.firstName || (fullUserData as any).firstName || '',
              lastName: personalInfo.lastName || (fullUserData as any).lastName || '',
              dateOfBirth: personalInfo.dateOfBirth || personalInfo.dob || kycData?.dob || '',
              nationality: personalInfo.nationality || kycData?.nationality || '',
              address: personalInfo.address || kycData?.address || '',
              phone: personalInfo.phone || (fullUserData as any).phone || ''
            },
            documents: finalDocuments, // Use final normalized documents
            verificationLevel: 'standard',
            riskScore: kycData?.riskScore || null,
            // CRITICAL: Include RaftAI analysis results for admin review
            raftaiAnalysis: kycData?.details ? {
              riskScore: kycData.riskScore || null,
              confidence: kycData.confidence || null,
              reasons: kycData.reasons || [],
              checks: kycData.details.checks || null,
              decision: kycData.details.decision || null
            } : null,
            notes: kycData?.reasons ? (Array.isArray(kycData.reasons) ? kycData.reasons.join(', ') : String(kycData.reasons)) : '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          const savedDocs = {
            selfie: selfieUrl && selfieUrl.trim() !== '' ? selfieUrl.trim() : null,
            idFront: idFrontUrl && idFrontUrl.trim() !== '' ? idFrontUrl.trim() : null,
            idBack: idBackUrl && idBackUrl.trim() !== '' ? idBackUrl.trim() : null,
            proofOfAddress: addressProofUrl && addressProofUrl.trim() !== '' ? addressProofUrl.trim() : null
          };
          
          console.log('✅ Created/updated KYC document in kyc_documents collection for admin visibility', {
            userId: this.currentUser.uid,
            email: fullUserData.email || this.currentUser.email,
            status: status,
            documents: {
              idFront: idFrontUrl ? '✓' : '✗',
              idBack: idBackUrl ? '✓' : '✗',
              proofOfAddress: addressProofUrl ? '✓' : '✗',
              selfie: selfieUrl ? '✓' : '✗'
            },
            savedDocuments: savedDocs,
            extractedUrls: {
              idFront: idFrontUrl || 'EMPTY',
              idBack: idBackUrl || 'EMPTY',
              proofOfAddress: addressProofUrl || 'EMPTY',
              selfie: selfieUrl || 'EMPTY'
            }
          });
        } catch (kycDocError: any) {
          // Check if error is from ad blocker (harmless)
          const errorMessage = kycDocError?.message || kycDocError?.toString() || '';
          const isAdBlockerError = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                                  errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                                  kycDocError?.code === 'ERR_BLOCKED_BY_CLIENT';
          
          if (isAdBlockerError) {
            // Ad blocker error - log but don't fail, the write likely succeeded
            console.log('⚠️ Ad blocker detected during kyc_documents sync (likely harmless):', errorMessage);
            // Retry the write after a short delay
            setTimeout(async () => {
              try {
                const { setDoc: setDocFn, doc: docFn } = await import('firebase/firestore');
                await setDocFn(docFn(db, 'kyc_documents', this.currentUser.uid), {
                  userId: this.currentUser.uid,
                  userEmail: fullUserData.email || this.currentUser.email || 'N/A',
                  userName: fullUserData.displayName || 
                           (fullUserData as any).name || 
                           `${(fullUserData as any).firstName || ''} ${(fullUserData as any).lastName || ''}`.trim() || 
                           this.currentUser.displayName || 'Unknown',
                  status: status,
                  submittedAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                }, { merge: true });
                console.log('✅ Retry: KYC document synced successfully after ad blocker error');
              } catch (retryError) {
                console.error('⚠️ Retry failed for kyc_documents sync:', retryError);
              }
            }, 1000);
          } else {
            // Real error - log it
            console.error('⚠️ Failed to create KYC document in kyc_documents collection:', kycDocError);
            // Don't throw - user document was updated successfully, but log the error for debugging
          }
        }
      }

      this.userProfile.kycStatus = status;
      if (kycData) {
        this.userProfile.kyc = kycData;
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  public async updateKYBStatus(status: SimpleUserProfile['kybStatus'], kybData?: any): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      throw new Error('No authenticated user');
    }

    try {
      const updateData: any = {
        kybStatus: status,
        updatedAt: serverTimestamp()
      };

      if (kybData) {
        updateData.kyb = kybData;
      }

      await updateDoc(doc(db!, 'users', this.currentUser.uid), updateData);

      this.userProfile.kybStatus = status;
      if (kybData) {
        this.userProfile.kyb = kybData;
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Error updating KYB status:', error);
      throw error;
    }
  }

  public getOnboardingProgress(): { step: string; percentage: number; canProceed: boolean } {
    if (!this.userProfile) {
      return { step: 'role', percentage: 0, canProceed: false };
    }

    const steps = ['role', 'profile', 'kyc', 'kyb_decision', 'kyb', 'pitch', 'complete'];
    const currentIndex = steps.indexOf(this.userProfile.onboardingStep);
    const percentage = Math.round((currentIndex / (steps.length - 1)) * 100);

    let canProceed = false;
    switch (this.userProfile.onboardingStep) {
      case 'role':
        canProceed = !!this.userProfile.role;
        break;
      case 'profile':
        canProceed = this.userProfile.profileCompleted;
        break;
      case 'kyc':
        canProceed = this.userProfile.kycStatus === 'approved';
        break;
      case 'kyb_decision':
        canProceed = this.userProfile.kybSkipped || this.userProfile.kybStatus === 'approved';
        break;
      case 'kyb':
        canProceed = this.userProfile.kybStatus === 'approved';
        break;
      case 'pitch':
        canProceed = true; // Pitch is always accessible once KYC is approved
        break;
      case 'complete':
        canProceed = true;
        break;
    }

    return {
      step: this.userProfile.onboardingStep,
      percentage,
      canProceed
    };
  }
}

// Export singleton instance
export const simpleAuthService = typeof window !== 'undefined' ? SimpleAuthService.getInstance() : null;

// Hook for auth state
export function useSimpleAuth() {
  const [state, setState] = useState<{
    user: User | null;
    profile: SimpleUserProfile | null;
    loading: boolean;
    isAuthed: boolean;
  }>({
    user: null,
    profile: null,
    loading: true,
    isAuthed: false
  });

  useEffect(() => {
    if (!simpleAuthService) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    
    // Check current state immediately (before listener fires)
    const currentUser = simpleAuthService.getCurrentUser();
    const currentProfile = simpleAuthService.getUserProfile();
    
    // Also check Firebase auth directly as fallback
    let firebaseUser: User | null = null;
    if (typeof window !== 'undefined' && auth && auth.currentUser) {
      firebaseUser = auth.currentUser;
    }
    
    // Use Firebase user if service hasn't loaded it yet
    const userToUse = currentUser || firebaseUser;
    
    // Set initial state immediately if user/profile exists
    setState({
      user: userToUse,
      profile: currentProfile,
      loading: false, // Always set loading to false after checking
      isAuthed: !!userToUse
    });
    
    // Set up listener for future changes
    const unsubscribe = simpleAuthService.addAuthListener((user, profile) => {
      // Use Firebase user as fallback if service user is null
      const finalUser = user || (auth && auth.currentUser) || null;
      setState({
        user: finalUser,
        profile,
        loading: false,
        isAuthed: !!finalUser
      });
    });

    // Also set up a retry check in case auth loads after component mounts
    const retryTimeout = setTimeout(() => {
      if (auth && auth.currentUser && !userToUse) {
        const retryUser = auth.currentUser;
        setState({
          user: retryUser,
          profile: currentProfile,
          loading: false,
          isAuthed: true
        });
        // The service will automatically load the profile when it detects the user
      }
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(retryTimeout);
    };
  }, []);

  return state;
}

// Auth actions hook
export function useSimpleAuthActions() {
  const signInWithGoogle = async () => {
    if (!simpleAuthService) {
      return { success: false, error: 'Auth service not available' };
    }
    return await simpleAuthService.signInWithGoogle();
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!simpleAuthService) {
      return { success: false, error: 'Auth service not available' };
    }
    return await simpleAuthService.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (!simpleAuthService) {
      return { success: false, error: 'Auth service not available' };
    }
    return await simpleAuthService.signUpWithEmail(email, password, displayName);
  };

  const signOut = async () => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.signOut();
  };

  const updateRole = async (role: SimpleUserProfile['role']) => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.updateUserRole(role);
  };

  const updateProfile = async (profileData: Partial<SimpleUserProfile>) => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.updateProfile(profileData);
  };

  const updateOnboardingStep = async (step: SimpleUserProfile['onboardingStep']) => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.updateOnboardingStep(step);
  };

  const updateKYCStatus = async (status: SimpleUserProfile['kycStatus'], kycData?: any) => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.updateKYCStatus(status, kycData);
  };

  const updateKYBStatus = async (status: SimpleUserProfile['kybStatus'], kybData?: any) => {
    if (!simpleAuthService) {
      throw new Error('Auth service not available');
    }
    return await simpleAuthService.updateKYBStatus(status, kybData);
  };

  const getOnboardingProgress = () => {
    if (!simpleAuthService) {
      return {
        step: 'role' as SimpleUserProfile['onboardingStep'],
        percentage: 0,
        canProceed: false
      };
    }
    return simpleAuthService.getOnboardingProgress();
  };

  return {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateRole,
    updateProfile,
    updateOnboardingStep,
    updateKYCStatus,
    updateKYBStatus,
    getOnboardingProgress
  };
}

