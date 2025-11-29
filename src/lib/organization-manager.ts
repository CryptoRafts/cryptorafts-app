"use client";

import { db } from './firebase.client';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  country: string;
  address: string;
  website?: string;
  logo?: string;
  members: Array<{
    uid: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: any;
  }>;
  kyb?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    documents?: {
      registrationDoc?: string;
      articlesOfIncorporation?: string;
      proofOfAddress?: string;
      financials?: string;
    };
    raftai?: {
      status: 'pending' | 'approved' | 'rejected';
      riskScore: number;
      reasons: string[];
      confidence: number;
      analysis: {
        documentQuality: number;
        businessLegitimacy: number;
        complianceScore: number;
        sanctionsCheck: boolean;
        pepCheck: boolean;
      };
    };
    submittedAt?: any;
    analyzedAt?: any;
    updatedAt?: any;
  };
  createdAt: any;
  updatedAt: any;
}

export interface KYBDocument {
  registrationDoc: File;
  articlesOfIncorporation: File;
  proofOfAddress: File;
  financials?: File;
}

export interface KYBVendorResponse {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  reasons: string[];
  vendorRef: string;
  cooldownUntil?: number;
}

export class OrganizationManager {
  private static instance: OrganizationManager;
  
  public static getInstance(): OrganizationManager {
    if (!OrganizationManager.instance) {
      OrganizationManager.instance = new OrganizationManager();
    }
    return OrganizationManager.instance;
  }

  /**
   * Create a new organization
   */
  async createOrganization(uid: string, orgData: Partial<Organization>): Promise<string> {
    try {
      const orgRef = doc(collection(db!, 'organizations'));
      const organization: Organization = {
        id: orgRef.id,
        name: orgData.name || '',
        type: orgData.type || '',
        registrationNumber: orgData.registrationNumber || '',
        country: orgData.country || '',
        address: orgData.address || '',
        website: orgData.website,
        logo: orgData.logo,
        members: [{
          uid,
          role: 'owner',
          joinedAt: serverTimestamp()
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(orgRef, organization);
      return orgRef.id;

    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const orgDoc = await getDoc(doc(db!, 'organizations', orgId));
      if (!orgDoc.exists()) {
        return null;
      }

      return { id: orgDoc.id, ...orgDoc.data() } as Organization;

    } catch (error) {
      console.error('Error getting organization:', error);
      throw error;
    }
  }

  /**
   * Get organizations for a user
   */
  async getUserOrganizations(uid: string): Promise<Organization[]> {
    try {
      const orgsQuery = query(
        collection(db!, 'organizations'),
        where('members', 'array-contains', { uid, role: 'owner' })
      );

      const snapshot = await getDocs(orgsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));

    } catch (error) {
      console.error('Error getting user organizations:', error);
      throw error;
    }
  }

  /**
   * Start KYB process for organization
   */
  async startKYB(orgId: string, documents: KYBDocument): Promise<string> {
    try {
      const vendorRef = `kyb_${orgId}_${Date.now()}`;
      
      // Upload documents to vendor (simulate)
      const documentRefs = {
        registrationDoc: `documents/${vendorRef}/registration_${Date.now()}`,
        articlesOfIncorporation: `documents/${vendorRef}/articles_${Date.now()}`,
        proofOfAddress: `documents/${vendorRef}/address_${Date.now()}`,
        financials: documents.financials ? `documents/${vendorRef}/financials_${Date.now()}` : undefined
      };

      // Update organization with KYB status
      await updateDoc(doc(db!, 'organizations', orgId), {
        'kyb.status': 'pending',
        'kyb.vendorRef': vendorRef,
        'kyb.documents': documentRefs,
        'kyb.submittedAt': serverTimestamp(),
        'kyb.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return vendorRef;

    } catch (error) {
      console.error('Error starting KYB:', error);
      throw error;
    }
  }

  /**
   * Process KYB vendor webhook
   */
  async processKYBWebhook(vendorRef: string, response: KYBVendorResponse): Promise<void> {
    try {
      // Find organization by vendor reference
      const orgsQuery = query(
        collection(db!, 'organizations'),
        where('kyb.vendorRef', '==', vendorRef)
      );
      
      const snapshot = await getDocs(orgsQuery);
      if (snapshot.empty) {
        throw new Error('Organization not found for vendor reference');
      }

      const orgDoc = snapshot.docs[0];
      const orgId = orgDoc.id;

      // Update organization with vendor response
      await updateDoc(doc(db!, 'organizations', orgId), {
        'kyb.status': response.status,
        'kyb.riskScore': response.riskScore,
        'kyb.reasons': response.reasons,
        'kyb.vendorResponse': response,
        'kyb.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Trigger RaftAI analysis
      await this.triggerRaftAIAnalysis(orgId, response);

    } catch (error) {
      console.error('Error processing KYB webhook:', error);
      throw error;
    }
  }

  /**
   * Trigger RaftAI analysis for KYB
   */
  async triggerRaftAIAnalysis(orgId: string, vendorResponse: KYBVendorResponse): Promise<void> {
    try {
      // Simulate RaftAI analysis
      const analysis = {
        status: vendorResponse.status === 'approved' ? 'approved' : 'rejected',
        riskScore: vendorResponse.riskScore,
        reasons: vendorResponse.reasons,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        analysis: {
          documentQuality: Math.random() * 0.4 + 0.6, // 60-100%
          businessLegitimacy: Math.random() * 0.3 + 0.7, // 70-100%
          complianceScore: Math.random() * 0.2 + 0.8, // 80-100%
          sanctionsCheck: true,
          pepCheck: true
        }
      };

      // Update organization with RaftAI analysis
      await updateDoc(doc(db!, 'organizations', orgId), {
        'kyb.raftai': analysis,
        'kyb.finalStatus': analysis.status,
        'kyb.analyzedAt': serverTimestamp(),
        'kyb.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user's KYB status if they're the owner
      const org = await this.getOrganization(orgId);
      if (org) {
        const owner = org.members.find(m => m.role === 'owner');
        if (owner) {
          const { authClaimsManager } = await import('./auth-claims');
          await authClaimsManager.updateKYBStatus(owner.uid, analysis.status);
        }
      }

    } catch (error) {
      console.error('Error in RaftAI KYB analysis:', error);
      throw error;
    }
  }

  /**
   * Simulate KYB vendor processing
   */
  async simulateKYBProcessing(vendorRef: string): Promise<KYBVendorResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Simulate vendor response
    const responses: KYBVendorResponse[] = [
      {
        status: 'approved',
        riskScore: Math.floor(Math.random() * 25) + 15, // 15-40 (low risk)
        reasons: [],
        vendorRef
      },
      {
        status: 'rejected',
        riskScore: Math.floor(Math.random() * 35) + 65, // 65-100 (high risk)
        reasons: [
          'Registration document invalid',
          'Business address verification failed',
          'Compliance check failed'
        ],
        vendorRef,
        cooldownUntil: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
      }
    ];

    // 75% approval rate for simulation
    return Math.random() < 0.75 ? responses[0] : responses[1];
  }

  /**
   * Add member to organization
   */
  async addMember(orgId: string, uid: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    try {
      const org = await this.getOrganization(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Check if user is already a member
      const existingMember = org.members.find(m => m.uid === uid);
      if (existingMember) {
        throw new Error('User is already a member of this organization');
      }

      // Add new member
      const updatedMembers = [
        ...org.members,
        {
          uid,
          role,
          joinedAt: serverTimestamp()
        }
      ];

      await updateDoc(doc(db!, 'organizations', orgId), {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding member to organization:', error);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(orgId: string, uid: string): Promise<void> {
    try {
      const org = await this.getOrganization(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Filter out the member
      const updatedMembers = org.members.filter(m => m.uid !== uid);

      await updateDoc(doc(db!, 'organizations', orgId), {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error removing member from organization:', error);
      throw error;
    }
  }

  /**
   * Update organization details
   */
  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    try {
      await updateDoc(doc(db!, 'organizations', orgId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }
}

export const organizationManager = OrganizationManager.getInstance();
