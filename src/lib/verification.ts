import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.client';
import { logger } from './logger';
import { Role, needsKyc, needsKyb } from './role';

export interface KYCVerification {
  id: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt?: Timestamp;
  
  // Personal information
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    phoneNumber: string;
  };
  
  // Documents
  documents: {
    identityDocument: {
      type: 'passport' | 'drivers_license' | 'national_id';
      frontImage: string;
      backImage?: string;
      number: string;
      expiryDate?: string;
    };
    proofOfAddress: {
      type: 'utility_bill' | 'bank_statement' | 'government_letter';
      document: string;
      issueDate: string;
    };
    selfie?: string;
  };
  
  // Verification results
  verificationResults?: {
    identityVerified: boolean;
    addressVerified: boolean;
    livenessCheck: boolean;
    documentAuthenticity: boolean;
    riskScore: number;
    verifiedAt: Timestamp;
  };
}

export interface KYBVerification {
  id: string;
  orgId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt?: Timestamp;
  
  // Organization information
  organizationInfo: {
    legalName: string;
    tradingName?: string;
    registrationNumber: string;
    incorporationDate: string;
    jurisdiction: string;
    businessType: string;
    industry: string;
    website?: string;
    description: string;
  };
  
  // Address information
  address: {
    registeredAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    businessAddress?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  
  // Key personnel
  keyPersonnel: {
    name: string;
    position: string;
    email: string;
    phone: string;
    ownershipPercentage?: number;
  }[];
  
  // Documents
  documents: {
    certificateOfIncorporation: string;
    memorandumOfAssociation?: string;
    articlesOfAssociation?: string;
    boardResolution?: string;
    bankStatement: string;
    financialStatements?: string;
    businessLicense?: string;
    taxRegistration?: string;
  };
  
  // Verification results
  verificationResults?: {
    organizationVerified: boolean;
    documentsVerified: boolean;
    keyPersonnelVerified: boolean;
    riskScore: number;
    verifiedAt: Timestamp;
  };
}

export interface VerificationProgress {
  userId: string;
  role: Role;
  kycStatus?: KYCVerification['status'];
  kybStatus?: KYBVerification['status'];
  profileCompleted: boolean;
  onboardingStep: string;
  completedSteps: string[];
  nextStep?: string;
}

export class VerificationService {
  // Start KYC verification
  static async startKYCVerification(
    userId: string,
    personalInfo: KYCVerification['personalInfo']
  ): Promise<string> {
    try {
      const kycData: Omit<KYCVerification, 'id'> = {
        userId,
        status: 'pending',
        submittedAt: serverTimestamp() as Timestamp,
        personalInfo,
        documents: {
          identityDocument: {
            type: 'passport',
            frontImage: '',
            number: '',
          },
          proofOfAddress: {
            type: 'utility_bill',
            document: '',
            issueDate: '',
          }
        }
      };

      const docRef = await addDoc(collection(db!, 'kyc_verifications'), kycData);
      
      logger.info('KYC verification started', {
        kycId: docRef.id,
        userId
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to start KYC verification', { error: error.message, userId });
      throw error;
    }
  }

  // Update KYC documents
  static async updateKYCDocuments(
    kycId: string,
    documents: Partial<KYCVerification['documents']>
  ): Promise<void> {
    try {
      const kycRef = doc(db!, 'kyc_verifications', kycId);
      await updateDoc(kycRef, {
        documents: {
          ...documents
        }
      });

      logger.info('KYC documents updated', { kycId });
    } catch (error) {
      logger.error('Failed to update KYC documents', { error: error.message, kycId });
      throw error;
    }
  }

  // Submit KYC for review
  static async submitKYCForReview(kycId: string): Promise<void> {
    try {
      const kycRef = doc(db!, 'kyc_verifications', kycId);
      await updateDoc(kycRef, {
        status: 'under_review'
      });

      logger.info('KYC submitted for review', { kycId });
    } catch (error) {
      logger.error('Failed to submit KYC for review', { error: error.message, kycId });
      throw error;
    }
  }

  // Review KYC (admin only)
  static async reviewKYC(
    kycId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    verificationResults?: KYCVerification['verificationResults']
  ): Promise<void> {
    try {
      const kycRef = doc(db!, 'kyc_verifications', kycId);
      await updateDoc(kycRef, {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        reviewNotes,
        verificationResults
      });

      logger.info('KYC reviewed', { kycId, reviewerId, status });
    } catch (error) {
      logger.error('Failed to review KYC', { error: error.message, kycId });
      throw error;
    }
  }

  // Start KYB verification
  static async startKYBVerification(
    orgId: string,
    organizationInfo: KYBVerification['organizationInfo'],
    address: KYBVerification['address'],
    keyPersonnel: KYBVerification['keyPersonnel']
  ): Promise<string> {
    try {
      const kybData: Omit<KYBVerification, 'id'> = {
        orgId,
        status: 'pending',
        submittedAt: serverTimestamp() as Timestamp,
        organizationInfo,
        address,
        keyPersonnel,
        documents: {
          certificateOfIncorporation: '',
          bankStatement: ''
        }
      };

      const docRef = await addDoc(collection(db!, 'kyb_verifications'), kybData);
      
      logger.info('KYB verification started', {
        kybId: docRef.id,
        orgId
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to start KYB verification', { error: error.message, orgId });
      throw error;
    }
  }

  // Update KYB documents
  static async updateKYBDocuments(
    kybId: string,
    documents: Partial<KYBVerification['documents']>
  ): Promise<void> {
    try {
      const kybRef = doc(db!, 'kyb_verifications', kybId);
      await updateDoc(kybRef, {
        documents: {
          ...documents
        }
      });

      logger.info('KYB documents updated', { kybId });
    } catch (error) {
      logger.error('Failed to update KYB documents', { error: error.message, kybId });
      throw error;
    }
  }

  // Submit KYB for review
  static async submitKYBForReview(kybId: string): Promise<void> {
    try {
      const kybRef = doc(db!, 'kyb_verifications', kybId);
      await updateDoc(kybRef, {
        status: 'under_review'
      });

      logger.info('KYB submitted for review', { kybId });
    } catch (error) {
      logger.error('Failed to submit KYB for review', { error: error.message, kybId });
      throw error;
    }
  }

  // Review KYB (admin only)
  static async reviewKYB(
    kybId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    verificationResults?: KYBVerification['verificationResults']
  ): Promise<void> {
    try {
      const kybRef = doc(db!, 'kyb_verifications', kybId);
      await updateDoc(kybRef, {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        reviewNotes,
        verificationResults
      });

      logger.info('KYB reviewed', { kybId, reviewerId, status });
    } catch (error) {
      logger.error('Failed to review KYB', { error: error.message, kybId });
      throw error;
    }
  }

  // Get user's KYC verification
  static async getUserKYC(userId: string): Promise<KYCVerification | null> {
    try {
      const q = query(
        collection(db!, 'kyc_verifications'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as KYCVerification;
    } catch (error) {
      logger.error('Failed to get user KYC', { error: error.message, userId });
      throw error;
    }
  }

  // Get organization's KYB verification
  static async getOrgKYB(orgId: string): Promise<KYBVerification | null> {
    try {
      const q = query(
        collection(db!, 'kyb_verifications'),
        where('orgId', '==', orgId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as KYBVerification;
    } catch (error) {
      logger.error('Failed to get org KYB', { error: error.message, orgId });
      throw error;
    }
  }

  // Get verification progress for user
  static async getVerificationProgress(userId: string, role: Role): Promise<VerificationProgress> {
    try {
      const progress: VerificationProgress = {
        userId,
        role,
        profileCompleted: false,
        onboardingStep: 'profile',
        completedSteps: []
      };

      // Get user profile
      const userRef = doc(db!, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        progress.profileCompleted = userData.profileCompleted || false;
        progress.onboardingStep = userData.onboardingStep || 'profile';
        progress.completedSteps = userData.completedSteps || [];
      }

      // Check KYC status if needed
      if (needsKyc(role)) {
        const kyc = await this.getUserKYC(userId);
        if (kyc) {
          progress.kycStatus = kyc.status;
          if (kyc.status === 'approved') {
            progress.completedSteps.push('kyc');
          }
        }
      }

      // Check KYB status if needed
      if (needsKyb(role)) {
        // For KYB, we need to get the user's organization
        const userRef = doc(db!, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const orgId = userData.organizationId;
          
          if (orgId) {
            const kyb = await this.getOrgKYB(orgId);
            if (kyb) {
              progress.kybStatus = kyb.status;
              if (kyb.status === 'approved') {
                progress.completedSteps.push('kyb');
              }
            }
          }
        }
      }

      // Determine next step
      if (!progress.profileCompleted) {
        progress.nextStep = 'profile';
      } else if (needsKyc(role) && progress.kycStatus !== 'approved') {
        progress.nextStep = 'kyc';
      } else if (needsKyb(role) && progress.kybStatus !== 'approved') {
        progress.nextStep = 'kyb';
      } else {
        progress.nextStep = 'dashboard';
      }

      return progress;
    } catch (error) {
      logger.error('Failed to get verification progress', { error: error.message, userId });
      throw error;
    }
  }

  // Check if user is fully verified
  static async isUserVerified(userId: string, role: Role): Promise<boolean> {
    try {
      const progress = await this.getVerificationProgress(userId, role);
      
      if (!progress.profileCompleted) return false;
      
      if (needsKyc(role) && progress.kycStatus !== 'approved') return false;
      if (needsKyb(role) && progress.kybStatus !== 'approved') return false;
      
      return true;
    } catch (error) {
      logger.error('Failed to check user verification status', { error: error.message, userId });
      return false;
    }
  }

  // Get all pending verifications (admin only)
  static async getPendingVerifications(): Promise<{
    kyc: KYCVerification[];
    kyb: KYBVerification[];
  }> {
    try {
      // Get pending KYC
      const kycQuery = query(
        collection(db!, 'kyc_verifications'),
        where('status', '==', 'under_review')
      );
      const kycSnapshot = await getDocs(kycQuery);
      const kyc = kycSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as KYCVerification));

      // Get pending KYB
      const kybQuery = query(
        collection(db!, 'kyb_verifications'),
        where('status', '==', 'under_review')
      );
      const kybSnapshot = await getDocs(kybQuery);
      const kyb = kybSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as KYBVerification));

      return { kyc, kyb };
    } catch (error) {
      logger.error('Failed to get pending verifications', { error: error.message });
      throw error;
    }
  }
}
