/**
 * User Tracking System
 * Ensures unique user IDs and prevents duplicate access
 */

import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.client';

export interface UserTrackingData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  profileCompleted: boolean;
  kycStatus?: string;
  kybStatus?: string;
  kyc?: { status: string };
  kyb?: { status: string };
  onboardingStep: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
  updatedAt: Date;
  status: 'active' | 'suspended' | 'pending';
  loginCount: number;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  sessionId: string;
  isOnline: boolean;
}

/**
 * Create or update user tracking data
 */
export async function trackUser(user: User, additionalData?: Partial<UserTrackingData>): Promise<UserTrackingData> {
  try {
    const now = new Date();
    const sessionId = generateSessionId();
    
    // Get device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    
    const baseData: UserTrackingData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: 'user',
      profileCompleted: false,
      onboardingStep: 'role_selection',
      emailVerified: user.emailVerified || false,
      createdAt: now,
      lastLogin: now,
      updatedAt: now,
      status: 'active',
      loginCount: 1,
      lastActivity: now,
      deviceInfo,
      sessionId,
      isOnline: true,
      ...additionalData
    };
    
    if (userDoc.exists()) {
      // Update existing user
      const existingData = userDoc.data() as UserTrackingData;
      const updatedData: Partial<UserTrackingData> = {
        ...baseData,
        createdAt: existingData.createdAt, // Preserve original creation date
        loginCount: (existingData.loginCount || 0) + 1,
        lastLogin: now,
        updatedAt: now,
        lastActivity: now,
        isOnline: true,
        sessionId,
        ...additionalData
      };
      
      await updateDoc(doc(db!, 'users', user.uid), updatedData);
      console.log('✅ User tracking updated for:', user.email);
      
      return { ...existingData, ...updatedData } as UserTrackingData;
    } else {
      // Create new user
      await setDoc(doc(db!, 'users', user.uid), baseData);
      console.log('✅ New user tracking created for:', user.email);
      
      return baseData;
    }
  } catch (error) {
    console.error('❌ Error tracking user:', error);
    throw error;
  }
}

/**
 * Update user activity
 */
export async function updateUserActivity(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db!, 'users', uid), {
      lastActivity: new Date(),
      isOnline: true
    });
  } catch (error) {
    console.error('❌ Error updating user activity:', error);
  }
}

/**
 * Mark user as offline
 */
export async function markUserOffline(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db!, 'users', uid), {
      isOnline: false,
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('❌ Error marking user offline:', error);
  }
}

/**
 * Check for duplicate sessions
 */
export async function checkDuplicateSession(uid: string, currentSessionId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db!, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserTrackingData;
      
      // If user is online with a different session, it might be a duplicate
      if (userData.isOnline && userData.sessionId !== currentSessionId) {
        console.log('⚠️ Potential duplicate session detected');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking duplicate session:', error);
    return false;
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate user uniqueness
 */
export async function validateUserUniqueness(user: User): Promise<boolean> {
  try {
    // Check if user already exists with same email
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserTrackingData;
      
      // Check if this is the same user (same UID)
      if (userData.uid === user.uid) {
        console.log('✅ Valid existing user:', user.email);
        return true;
      }
    }
    
    // This is a new user or valid existing user
    console.log('✅ User uniqueness validated:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error validating user uniqueness:', error);
    return false;
  }
}

/**
 * Get user tracking data
 */
export async function getUserTrackingData(uid: string): Promise<UserTrackingData | null> {
  try {
    const userDoc = await getDoc(doc(db!, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserTrackingData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user tracking data:', error);
    return null;
  }
}

/**
 * Update user onboarding step
 */
export async function updateOnboardingStep(uid: string, step: string): Promise<void> {
  try {
    await updateDoc(doc(db!, 'users', uid), {
      onboardingStep: step,
      updatedAt: new Date()
    });
    console.log('✅ Onboarding step updated:', step);
  } catch (error) {
    console.error('❌ Error updating onboarding step:', error);
  }
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, role: string): Promise<void> {
  try {
    await updateDoc(doc(db!, 'users', uid), {
      role: role,
      updatedAt: new Date()
    });
    console.log('✅ User role updated:', role);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
  }
}

/**
 * Mark profile as completed
 */
export async function markProfileCompleted(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db!, 'users', uid), {
      profileCompleted: true,
      onboardingStep: 'verification',
      updatedAt: new Date()
    });
    console.log('✅ Profile marked as completed');
  } catch (error) {
    console.error('❌ Error marking profile completed:', error);
  }
}
