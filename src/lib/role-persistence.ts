// Role persistence utilities for maintaining user role across sessions

const ROLE_STORAGE_KEY = 'userRole';
const CLAIMS_STORAGE_KEY = 'userClaims';

export interface UserClaims {
  role: string;
  orgId?: string;
  onboardingComplete?: boolean;
  profileCompleted?: boolean;
  kycComplete?: boolean;
  kybComplete?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  kybStatus?: 'pending' | 'approved' | 'rejected';
  pitchSubmitted?: boolean;
  onboardingStep?: string;
  [key: string]: any;
}

/**
 * Save user role and claims to localStorage for persistence
 */
export const saveUserRole = (role: string, claims: UserClaims) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
      console.log('Role saved to localStorage:', role);
    } catch (error) {
      console.error('Error saving role to localStorage:', error);
    }
  }
};

/**
 * Get user role and claims from localStorage
 */
export const getUserRole = (): { role: string; claims: UserClaims } | null => {
  if (typeof window !== 'undefined') {
    try {
      const role = localStorage.getItem(ROLE_STORAGE_KEY);
      const claimsStr = localStorage.getItem(CLAIMS_STORAGE_KEY);
      
      if (role && claimsStr) {
        const claims = JSON.parse(claimsStr) as UserClaims;
        return { role, claims };
      }
    } catch (error) {
      console.error('Error getting role from localStorage:', error);
    }
  }
  return null;
};

/**
 * Update user claims while preserving the role
 */
export const updateUserClaims = (updates: Partial<UserClaims>) => {
  if (typeof window !== 'undefined') {
    try {
      const role = localStorage.getItem(ROLE_STORAGE_KEY);
      const claimsStr = localStorage.getItem(CLAIMS_STORAGE_KEY);
      
      if (role && claimsStr) {
        const existingClaims = JSON.parse(claimsStr) as UserClaims;
        const updatedClaims = { ...existingClaims, ...updates };
        localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(updatedClaims));
        console.log('User claims updated:', updates);
      }
    } catch (error) {
      console.error('Error updating user claims:', error);
    }
  }
};

/**
 * Clear all role-related data from localStorage
 */
export const clearUserRole = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(CLAIMS_STORAGE_KEY);
      localStorage.removeItem('demoUser');
      localStorage.removeItem('demoClaims');
      console.log('User role data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing role data:', error);
    }
  }
};

/**
 * Set role for a new user (typically after role selection)
 */
export const setUserRole = (role: string, additionalData: Partial<UserClaims> = {}) => {
  const defaultClaims: UserClaims = {
    role,
    onboardingComplete: false,
    profileCompleted: false,
    kycComplete: false,
    kybComplete: false,
    kycStatus: 'pending',
    kybStatus: 'pending',
    pitchSubmitted: false,
    onboardingStep: 'role_selection',
    ...additionalData
  };

  saveUserRole(role, defaultClaims);
  return defaultClaims;
};

/**
 * Mark onboarding step as complete
 */
export const completeOnboardingStep = (step: string, additionalData: Partial<UserClaims> = {}) => {
  updateUserClaims({
    onboardingStep: step,
    ...additionalData
  });
};

/**
 * Check if user has completed onboarding
 */
export const isOnboardingComplete = (): boolean => {
  const roleData = getUserRole();
  return roleData?.claims?.onboardingComplete === true;
};

/**
 * Get current onboarding step
 */
export const getCurrentOnboardingStep = (): string | null => {
  const roleData = getUserRole();
  return roleData?.claims?.onboardingStep || null;
};
