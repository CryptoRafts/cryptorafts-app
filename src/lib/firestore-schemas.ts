// Firestore data schemas for Founder onboarding

export interface UserDocument {
  // Authentication & Role
  uid: string;
  role: 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';
  email: string;
  
  // Registration Fields (required)
  display_name: string;
  founder_legal_name: string;
  country: string;
  company_name: string;
  tagline: string;
  profile_image_url: string;
  
  // Onboarding State
  onboarding_state: 'REGISTRATION_REQUIRED' | 'KYC_PENDING' | 'KYC_APPROVED' | 'KYC_REJECTED' | 'DONE';
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyb_status: 'SKIPPED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  
  // Timestamps
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  registration_completed_at?: FirebaseFirestore.Timestamp;
  kyc_completed_at?: FirebaseFirestore.Timestamp;
  kyb_completed_at?: FirebaseFirestore.Timestamp;
  
  // Custom Claims (for JWT)
  customClaims?: {
    role: string;
    kyc: string;
    kyb?: string;
  };
  claims_updated_at?: FirebaseFirestore.Timestamp;
}

export interface KYCVerificationDocument {
  // Personal Information (required)
  kyc_legal_name: string;
  kyc_dob: string; // ISO date string
  kyc_country: string;
  
  // Government ID Information (required)
  kyc_id_type: 'passport' | 'national_id' | 'driving_license';
  kyc_id_number: string; // Sanitized version
  kyc_id_number_hash: string; // SHA-256 hash
  kyc_id_number_last4: string; // Last 4 digits
  kyc_id_number_masked: string; // Masked for display
  
  // Photo Verification (required)
  kyc_selfie_url: string;
  kyc_id_image_url?: string; // Optional
  
  // Verification Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision?: 'APPROVED' | 'REJECTED';
  risk_score?: number; // 0-100
  reasons?: string[];
  confidence?: number; // 0-1
  
  // Timestamps
  submitted_at: FirebaseFirestore.Timestamp;
  verified_at?: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  
  // RaftAI Metadata
  verification_id?: string;
  sla_seconds?: number;
}

export interface KYBVerificationDocument {
  // Entity Details (optional for Founder)
  kyb_reg_number?: string;
  kyb_jurisdiction?: string;
  
  // Documents (optional)
  kyb_docs?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    downloadURL: string;
    uploadedAt: string;
  }>;
  
  // Verification Status
  status: 'SKIPPED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  decision?: 'APPROVED' | 'REJECTED';
  risk_score?: number; // 0-100
  reasons?: string[];
  
  // Timestamps
  submitted_at?: FirebaseFirestore.Timestamp;
  verified_at?: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  
  // RaftAI Metadata
  verification_id?: string;
  sla_seconds?: number;
}

export interface OrganizationDocument {
  // Organization Details
  company_name: string;
  tagline: string;
  country: string;
  
  // KYB Fields (optional)
  kyb_reg_number?: string;
  kyb_jurisdiction?: string;
  kyb_docs?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    downloadURL: string;
    uploadedAt: string;
  }>;
  
  // Timestamps
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

// Storage paths for file uploads
export const STORAGE_PATHS = {
  PROFILES: (uid: string) => `uploads/profiles/${uid}/avatar`,
  KYC_SELFIE: (uid: string) => `uploads/kyc/${uid}/selfie`,
  KYC_ID_IMAGE: (uid: string) => `uploads/kyc/${uid}/id_image`,
  KYB_DOCS: (uid: string, fileName: string) => `uploads/kyb/${uid}/${fileName}`,
} as const;

// Firestore collection paths
export const FIRESTORE_PATHS = {
  USERS: 'users',
  USER_KYC: (uid: string) => `users/${uid}/kyc`,
  USER_KYB: (uid: string) => `users/${uid}/kyb`,
  ORGANIZATIONS: 'organizations',
} as const;

// Validation helpers
export function validateUserDocument(data: Partial<UserDocument>): string[] {
  const errors: string[] = [];
  
  if (!data.display_name?.trim()) errors.push('Display name is required');
  if (!data.founder_legal_name?.trim()) errors.push('Founder legal name is required');
  if (!data.country?.trim()) errors.push('Country is required');
  if (!data.company_name?.trim()) errors.push('Company name is required');
  if (!data.tagline?.trim()) errors.push('Tagline is required');
  if (!data.profile_image_url?.trim()) errors.push('Profile image is required');
  
  return errors;
}

export function validateKYCDocument(data: Partial<KYCVerificationDocument>): string[] {
  const errors: string[] = [];
  
  if (!data.kyc_legal_name?.trim()) errors.push('Legal name is required');
  if (!data.kyc_dob?.trim()) errors.push('Date of birth is required');
  if (!data.kyc_country?.trim()) errors.push('Country is required');
  if (!data.kyc_id_type?.trim()) errors.push('ID type is required');
  if (!data.kyc_id_number?.trim()) errors.push('ID number is required');
  if (!data.kyc_selfie_url?.trim()) errors.push('Selfie is required');
  
  return errors;
}
