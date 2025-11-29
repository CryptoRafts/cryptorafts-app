"use client";

import { db, auth } from './firebase.client';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';

export interface KYCDocument {
  idFront: File;
  idBack: File;
  proofOfAddress: File;
  selfie: File;
}

export interface KYCVendorResponse {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  reasons: string[];
  vendorRef: string;
  cooldownUntil?: number;
}

export interface RaftAIAnalysis {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  reasons: string[];
  confidence: number;
  analysis: {
    documentQuality: number;
    faceMatch: number;
    livenessScore: number;
    sanctionsCheck: boolean;
    pepCheck: boolean;
  };
}

export class KYCVendorManager {
  private static instance: KYCVendorManager;
  
  public static getInstance(): KYCVendorManager {
    if (!KYCVendorManager.instance) {
      KYCVendorManager.instance = new KYCVendorManager();
    }
    return KYCVendorManager.instance;
  }

  /**
   * Start KYC session with vendor
   */
  async startKYCSession(uid: string): Promise<string> {
    try {
      // Generate vendor session token
      const vendorRef = `kyc_${uid}_${Date.now()}`;
      
      // Update user document with pending KYC status
      await updateDoc(doc(db!, 'users', uid), {
        'kyc.status': 'pending',
        'kyc.vendorRef': vendorRef,
        'kyc.startedAt': serverTimestamp(),
        'kyc.updatedAt': serverTimestamp()
      });

      return vendorRef;
    } catch (error) {
      console.error('Error starting KYC session:', error);
      throw error;
    }
  }

  /**
   * Upload documents to vendor
   */
  async uploadDocuments(vendorRef: string, documents: KYCDocument): Promise<void> {
    try {
      // In production, upload to vendor API
      // For now, simulate upload process
      console.log('Uploading documents to vendor:', vendorRef);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store document references (in production, these would be vendor URLs)
      const documentRefs = {
        idFront: `documents/${vendorRef}/id_front_${Date.now()}`,
        idBack: `documents/${vendorRef}/id_back_${Date.now()}`,
        proofOfAddress: `documents/${vendorRef}/proof_of_address_${Date.now()}`,
        selfie: `documents/${vendorRef}/selfie_${Date.now()}`
      };

      // Update user document with document references
      await updateDoc(doc(db!, 'users', auth.currentUser?.uid || ''), {
        'kyc.documents': documentRefs,
        'kyc.uploadedAt': serverTimestamp()
      });

    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  /**
   * Process vendor webhook response
   */
  async processVendorWebhook(vendorRef: string, response: KYCVendorResponse): Promise<void> {
    try {
      // Find user by vendor reference
      const userQuery = query(
        collection(db!, 'users'),
        where('kyc.vendorRef', '==', vendorRef)
      );
      
      const snapshot = await getDocs(userQuery);
      if (snapshot.empty) {
        throw new Error('User not found for vendor reference');
      }

      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;

      // Update user document with vendor response
      await updateDoc(doc(db!, 'users', uid), {
        'kyc.status': response.status,
        'kyc.riskScore': response.riskScore,
        'kyc.reasons': response.reasons,
        'kyc.vendorResponse': response,
        'kyc.updatedAt': serverTimestamp()
      });

      // Trigger RaftAI analysis
      await this.triggerRaftAIAnalysis(uid, response);

    } catch (error) {
      console.error('Error processing vendor webhook:', error);
      throw error;
    }
  }

  /**
   * Trigger RaftAI analysis
   */
  async triggerRaftAIAnalysis(uid: string, vendorResponse: KYCVendorResponse): Promise<RaftAIAnalysis> {
    try {
      // Simulate RaftAI analysis
      const analysis: RaftAIAnalysis = {
        status: vendorResponse.status === 'approved' ? 'approved' : 'rejected',
        riskScore: vendorResponse.riskScore,
        reasons: vendorResponse.reasons,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        analysis: {
          documentQuality: Math.random() * 0.4 + 0.6, // 60-100%
          faceMatch: Math.random() * 0.3 + 0.7, // 70-100%
          livenessScore: Math.random() * 0.2 + 0.8, // 80-100%
          sanctionsCheck: true,
          pepCheck: true
        }
      };

      // Update user document with RaftAI analysis
      await updateDoc(doc(db!, 'users', uid), {
        'kyc.raftai': analysis,
        'kyc.finalStatus': analysis.status,
        'kyc.analyzedAt': serverTimestamp(),
        'kyc.updatedAt': serverTimestamp()
      });

      // Update custom claims
      const { authClaimsManager } = await import('./auth-claims');
      await authClaimsManager.updateKYCStatus(uid, analysis.status);

      return analysis;

    } catch (error) {
      console.error('Error in RaftAI analysis:', error);
      throw error;
    }
  }

  /**
   * Get KYC status for user
   */
  async getKYCStatus(uid: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db!, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      return userData.kyc || null;

    } catch (error) {
      console.error('Error getting KYC status:', error);
      throw error;
    }
  }

  /**
   * Check if user can retry KYC
   */
  async canRetryKYC(uid: string): Promise<boolean> {
    try {
      const kycData = await this.getKYCStatus(uid);
      
      if (!kycData || kycData.status !== 'rejected') {
        return false;
      }

      if (kycData.cooldownUntil) {
        return Date.now() > kycData.cooldownUntil;
      }

      return true;

    } catch (error) {
      console.error('Error checking KYC retry eligibility:', error);
      return false;
    }
  }

  /**
   * Simulate vendor processing (for development)
   */
  async simulateVendorProcessing(vendorRef: string): Promise<KYCVendorResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Simulate vendor response
    const responses: KYCVendorResponse[] = [
      {
        status: 'approved',
        riskScore: Math.floor(Math.random() * 20) + 10, // 10-30 (low risk)
        reasons: [],
        vendorRef
      },
      {
        status: 'rejected',
        riskScore: Math.floor(Math.random() * 40) + 60, // 60-100 (high risk)
        reasons: [
          'Document quality insufficient',
          'Face match failed',
          'Liveness detection failed'
        ],
        vendorRef,
        cooldownUntil: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    ];

    // 80% approval rate for simulation
    return Math.random() < 0.8 ? responses[0] : responses[1];
  }
}

export const kycVendorManager = KYCVendorManager.getInstance();
