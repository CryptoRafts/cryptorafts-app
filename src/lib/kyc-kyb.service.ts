import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { customClaimsService } from './custom-claims.service';
import { adminDb } from './firebase.admin';

export interface KYCResult {
  success: boolean;
  status: 'pending' | 'verified' | 'rejected';
  score?: number;
  confidence?: number;
  livenessScore?: number;
  faceMatchScore?: number;
  documentVerification?: {
    type: string;
    valid: boolean;
    confidence: number;
  };
  riskFactors?: string[];
  error?: string;
}

export interface KYBResult {
  success: boolean;
  status: 'pending' | 'verified' | 'rejected';
  companyVerified?: boolean;
  registrationValid?: boolean;
  complianceCheck?: boolean;
  riskScore?: number;
  error?: string;
}

class KYCKYBService {
  private readonly webhookSecret: string;
  private readonly apiKey: string;

  constructor() {
    this.webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'default-secret';
    this.apiKey = process.env.KYC_VENDOR_API_KEY || 'default-key';
  }

  // Verify webhook signature
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Start KYC process
  public async startKYC(uid: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
  }): Promise<{ sessionId: string; redirectUrl: string }> {
    try {
      // In a real implementation, this would call the KYC vendor API
      const sessionId = `kyc_${uid}_${Date.now()}`;
      
      // Store KYC session in Firestore
      await adminDb.collection('kyc_sessions').doc(sessionId).set({
        uid,
        userData,
        status: 'started',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Return redirect URL for KYC flow
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/kyc/verify?session=${sessionId}`;
      
      return { sessionId, redirectUrl };
    } catch (error) {
      console.error('Error starting KYC:', error);
      throw error;
    }
  }

  // Start KYB process
  public async startKYB(uid: string, companyData: {
    companyName: string;
    registrationNumber: string;
    country: string;
    industry: string;
    website?: string;
  }): Promise<{ sessionId: string; redirectUrl: string }> {
    try {
      const sessionId = `kyb_${uid}_${Date.now()}`;
      
      // Store KYB session in Firestore
      await adminDb.collection('kyb_sessions').doc(sessionId).set({
        uid,
        companyData,
        status: 'started',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/kyb/verify?session=${sessionId}`;
      
      return { sessionId, redirectUrl };
    } catch (error) {
      console.error('Error starting KYB:', error);
      throw error;
    }
  }

  // Process KYC webhook
  public async processKYCWebhook(payload: any): Promise<void> {
    try {
      const { sessionId, result, score, confidence, livenessScore, faceMatchScore } = payload;
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // Update KYC session
      await adminDb.collection('kyc_sessions').doc(sessionId).update({
        result,
        score,
        confidence,
        livenessScore,
        faceMatchScore,
        status: 'completed',
        updatedAt: new Date()
      });

      // Get session data to find user
      const sessionDoc = await adminDb.collection('kyc_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('KYC session not found');
      }

      const sessionData = sessionDoc.data();
      const uid = sessionData?.uid;
      
      if (!uid) {
        throw new Error('User ID not found in session');
      }

      // Determine verification status
      const isVerified = result === 'success' && 
                        (score || 0) >= 80 && 
                        (confidence || 0) >= 85 &&
                        (livenessScore || 0) >= 90 &&
                        (faceMatchScore || 0) >= 85;

      // Update user's KYC status
      await customClaimsService.setKycVerified(uid, isVerified);
      
      // Update user profile in Firestore
      await adminDb.collection('users').doc(uid).update({
        kycStatus: isVerified ? 'verified' : 'rejected',
        kycScore: score,
        kycConfidence: confidence,
        kycLivenessScore: livenessScore,
        kycFaceMatchScore: faceMatchScore,
        kycCompletedAt: new Date(),
        updatedAt: new Date()
      });

      // Send notification
      await this.sendKYCNotification(uid, isVerified);

      console.log(`KYC completed for user ${uid}: ${isVerified ? 'verified' : 'rejected'}`);
    } catch (error) {
      console.error('Error processing KYC webhook:', error);
      throw error;
    }
  }

  // Process KYB webhook
  public async processKYBWebhook(payload: any): Promise<void> {
    try {
      const { sessionId, result, companyVerified, registrationValid, complianceCheck, riskScore } = payload;
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // Update KYB session
      await adminDb.collection('kyb_sessions').doc(sessionId).update({
        result,
        companyVerified,
        registrationValid,
        complianceCheck,
        riskScore,
        status: 'completed',
        updatedAt: new Date()
      });

      // Get session data to find user
      const sessionDoc = await adminDb.collection('kyb_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('KYB session not found');
      }

      const sessionData = sessionDoc.data();
      const uid = sessionData?.uid;
      
      if (!uid) {
        throw new Error('User ID not found in session');
      }

      // Determine verification status
      const isVerified = result === 'success' && 
                        companyVerified && 
                        registrationValid && 
                        complianceCheck &&
                        (riskScore || 100) <= 30;

      // Update user's KYB status
      await customClaimsService.setKybVerified(uid, isVerified);
      
      // Update user profile in Firestore
      await adminDb.collection('users').doc(uid).update({
        kybStatus: isVerified ? 'verified' : 'rejected',
        kybScore: riskScore,
        kybCompanyVerified: companyVerified,
        kybRegistrationValid: registrationValid,
        kybComplianceCheck: complianceCheck,
        kybCompletedAt: new Date(),
        updatedAt: new Date()
      });

      // Send notification
      await this.sendKYBNotification(uid, isVerified);

      console.log(`KYB completed for user ${uid}: ${isVerified ? 'verified' : 'rejected'}`);
    } catch (error) {
      console.error('Error processing KYB webhook:', error);
      throw error;
    }
  }

  // Send KYC notification
  private async sendKYCNotification(uid: string, verified: boolean): Promise<void> {
    try {
      const notification = {
        userId: uid,
        type: verified ? 'success' : 'error',
        title: verified ? 'KYC Verification Successful' : 'KYC Verification Failed',
        message: verified 
          ? 'Your identity has been successfully verified. You can now access all platform features.'
          : 'Your identity verification failed. Please contact support for assistance.',
        read: false,
        createdAt: new Date()
      };

      await adminDb.collection('notifications').add(notification);
    } catch (error) {
      console.error('Error sending KYC notification:', error);
    }
  }

  // Send KYB notification
  private async sendKYBNotification(uid: string, verified: boolean): Promise<void> {
    try {
      const notification = {
        userId: uid,
        type: verified ? 'success' : 'error',
        title: verified ? 'KYB Verification Successful' : 'KYB Verification Failed',
        message: verified 
          ? 'Your business has been successfully verified. You can now access business features.'
          : 'Your business verification failed. Please contact support for assistance.',
        read: false,
        createdAt: new Date()
      };

      await adminDb.collection('notifications').add(notification);
    } catch (error) {
      console.error('Error sending KYB notification:', error);
    }
  }

  // Get KYC status
  public async getKYCStatus(uid: string): Promise<any> {
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        status: userData?.kycStatus || 'pending',
        score: userData?.kycScore,
        confidence: userData?.kycConfidence,
        livenessScore: userData?.kycLivenessScore,
        faceMatchScore: userData?.kycFaceMatchScore,
        completedAt: userData?.kycCompletedAt
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  }

  // Get KYB status
  public async getKYBStatus(uid: string): Promise<any> {
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        status: userData?.kybStatus || 'pending',
        score: userData?.kybScore,
        companyVerified: userData?.kybCompanyVerified,
        registrationValid: userData?.kybRegistrationValid,
        complianceCheck: userData?.kybComplianceCheck,
        completedAt: userData?.kybCompletedAt
      };
    } catch (error) {
      console.error('Error getting KYB status:', error);
      return null;
    }
  }
}

export const kycKybService = new KYCKYBService();
