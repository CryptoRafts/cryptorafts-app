import { auth, db } from './firebase.client';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export interface VCUser {
  uid: string;
  role: 'vc';
  profileCompleted: boolean;
  orgId?: string;
  onboarding: {
    step: 'profile' | 'verification' | 'done';
    completedAt?: any;
  };
  kyc?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt?: any;
  };
  createdAt: any;
  updatedAt: any;
}

export interface VCOrganization {
  id: string;
  type: 'vc';
  name: string;
  website?: string;
  logoUrl?: string;
  country: string;
  thesis: {
    stages: string[];
    sectors: string[];
    chains: string[];
  };
  aum?: number;
  contactEmail: string;
  members: Array<{
    uid: string;
    role: 'owner' | 'admin' | 'viewer';
    joinedAt: any;
  }>;
  kyb?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt?: any;
  };
  createdAt: any;
  updatedAt: any;
}

export class VCAuthManager {
  private static instance: VCAuthManager;

  static getInstance(): VCAuthManager {
    if (!VCAuthManager.instance) {
      VCAuthManager.instance = new VCAuthManager();
    }
    return VCAuthManager.instance;
  }

  /**
   * Initialize VC user after role selection
   */
  async initializeVCUser(uid: string): Promise<void> {
    const userRef = doc(db!, 'users', uid);
    
    await setDoc(userRef, {
      role: 'vc',
      profileCompleted: false,
      onboarding: {
        step: 'profile'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update custom claims
    await this.updateCustomClaims(uid, {
      role: 'vc',
      profileCompleted: false
    });
  }

  /**
   * Complete organization profile setup
   */
  async completeOrgProfile(
    uid: string, 
    orgData: Omit<VCOrganization, 'id' | 'type' | 'members' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const orgId = `vc_${uid}_${Date.now()}`;
    
    try {
      // Create organization
      const orgRef = doc(db!, 'organizations', orgId);
      await setDoc(orgRef, {
        id: orgId,
        type: 'vc',
        ...orgData,
        members: [{
          uid,
          role: 'owner',
          joinedAt: new Date()
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user with orgId and mark profile completed
      const userRef = doc(db!, 'users', uid);
      await updateDoc(userRef, {
        orgId,
        profileCompleted: true,
        onboarding: {
          step: 'verification'
        },
        updatedAt: serverTimestamp()
      });

      // Update custom claims
      await this.updateCustomClaims(uid, {
        role: 'vc',
        profileCompleted: true,
        orgId
      });

      console.log('Organization profile completed successfully:', orgId);
      return orgId;
    } catch (error) {
      console.error('Failed to complete organization profile:', error);
      // Check if it's a permission error
      if (error.message && error.message.includes('permissions')) {
        throw new Error('Permission denied. Please contact support or try again later.');
      }
      throw new Error('Failed to create organization profile. Please try again.');
    }
  }

  /**
   * Update KYC status for VC representative
   */
  async updateKYCStatus(
    uid: string,
    status: 'pending' | 'approved' | 'rejected',
    riskScore?: number,
    reasons?: string[],
    vendorRef?: string
  ): Promise<void> {
    const userRef = doc(db!, 'users', uid);
    await updateDoc(userRef, {
      kyc: {
        status,
        riskScore,
        reasons,
        vendorRef,
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Update custom claims
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() as VCUser;
    
    await this.updateCustomClaims(uid, {
      role: 'vc',
      profileCompleted: userData.profileCompleted,
      orgId: userData.orgId,
      kycStatus: status
    });

    // Check if both KYC and KYB are approved to unlock portal
    if (status === 'approved' && userData.orgId) {
      const orgDoc = await getDoc(doc(db!, 'organizations', userData.orgId));
      const orgData = orgDoc.data() as VCOrganization;
      
      if (orgData.kyb?.status === 'approved') {
        await this.completeOnboarding(uid);
      }
    }
  }

  /**
   * Update KYB status for VC organization
   */
  async updateKYBStatus(
    orgId: string,
    status: 'pending' | 'approved' | 'rejected',
    riskScore?: number,
    reasons?: string[],
    vendorRef?: string
  ): Promise<void> {
    const orgRef = doc(db!, 'organizations', orgId);
    
    // Build kyb object with only defined values
    const kybData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (riskScore !== undefined) kybData.riskScore = riskScore;
    if (reasons !== undefined) kybData.reasons = reasons;
    if (vendorRef !== undefined) kybData.vendorRef = vendorRef;
    
    await updateDoc(orgRef, {
      kyb: kybData,
      updatedAt: serverTimestamp()
    });

    // Get organization owner to update their claims
    const orgDoc = await getDoc(orgRef);
    const orgData = orgDoc.data() as VCOrganization;
    const owner = orgData.members.find(m => m.role === 'owner');
    
    if (owner) {
      const userDoc = await getDoc(doc(db!, 'users', owner.uid));
      const userData = userDoc.data() as VCUser;
      
      await this.updateCustomClaims(owner.uid, {
        role: 'vc',
        profileCompleted: userData.profileCompleted,
        orgId: userData.orgId,
        kycStatus: userData.kyc?.status,
        kybStatus: status
      });

      // Check if both KYC and KYB are approved to unlock portal
      if (status === 'approved' && userData.kyc?.status === 'approved') {
        await this.completeOnboarding(owner.uid);
      }
    }
  }

  /**
   * Complete onboarding and unlock VC portal
   */
  private async completeOnboarding(uid: string): Promise<void> {
    const userRef = doc(db!, 'users', uid);
    await updateDoc(userRef, {
      onboarding: {
        step: 'done',
        completedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Update custom claims
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() as VCUser;
    
    await this.updateCustomClaims(uid, {
      role: 'vc',
      profileCompleted: userData.profileCompleted,
      orgId: userData.orgId,
      kycStatus: userData.kyc?.status,
      kybStatus: userData.orgId ? (await getDoc(doc(db!, 'organizations', userData.orgId))).data()?.kyb?.status : undefined,
      onboardingComplete: true
    });
  }

  /**
   * Get VC user data
   */
  async getVCUser(uid: string): Promise<VCUser | null> {
    const userDoc = await getDoc(doc(db!, 'users', uid));
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    if (data.role !== 'vc') return null;
    
    return { uid, ...data } as VCUser;
  }

  /**
   * Get user's organization ID
   */
  async getUserOrgId(uid: string): Promise<string | null> {
    const user = await this.getVCUser(uid);
    return user?.orgId || null;
  }

  /**
   * Get KYB status for user's organization
   */
  async getKYBStatus(uid: string): Promise<{ status: string; submittedAt?: any; riskScore?: number; reasons?: string[] } | null> {
    try {
      const user = await this.getVCUser(uid);
      if (!user?.orgId) return null;

      const orgDoc = await getDoc(doc(db!, 'organizations', user.orgId));
      if (!orgDoc.exists()) return null;

      const orgData = orgDoc.data();
      return orgData?.kyb || { status: 'pending' };
    } catch (error) {
      console.error('Error getting KYB status:', error);
      return { status: 'pending' };
    }
  }

  /**
   * Get VC organization data
   */
  async getVCOrganization(orgId: string): Promise<VCOrganization | null> {
    const orgDoc = await getDoc(doc(db!, 'organizations', orgId));
    if (!orgDoc.exists()) return null;
    
    const data = orgDoc.data();
    if (data.type !== 'vc') return null;
    
    return { id: orgId, ...data } as VCOrganization;
  }

  /**
   * Check if VC portal is unlocked
   * KYB is required, KYC is optional
   */
  async isVCPortalUnlocked(uid: string): Promise<boolean> {
    const user = await this.getVCUser(uid);
    if (!user || !user.orgId) return false;

    const org = await this.getVCOrganization(user.orgId);
    if (!org) return false;

    // Only require KYB approval, KYC is optional
    return org.kyb?.status === 'approved' && 
           user.onboarding.step === 'done';
  }

  /**
   * Get VC organization members
   */
  async getVCMembers(orgId: string): Promise<VCUser[]> {
    const org = await this.getVCOrganization(orgId);
    if (!org) return [];

    const memberUids = org.members.map(m => m.uid);
    const members: VCUser[] = [];

    for (const uid of memberUids) {
      const user = await this.getVCUser(uid);
      if (user) members.push(user);
    }

    return members;
  }

  /**
   * Add member to VC organization
   */
  async addVCMember(
    orgId: string, 
    uid: string, 
    role: 'admin' | 'viewer',
    addedBy: string
  ): Promise<void> {
    const orgRef = doc(db!, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    const orgData = orgDoc.data() as VCOrganization;

    // Check if user is already a member
    if (orgData.members.some(m => m.uid === uid)) {
      throw new Error('User is already a member of this organization');
    }

    // Add member
    await updateDoc(orgRef, {
      members: [...orgData.members, {
        uid,
        role,
        joinedAt: serverTimestamp()
      }],
      updatedAt: serverTimestamp()
    });

    // Update user's orgId
    const userRef = doc(db!, 'users', uid);
    await updateDoc(userRef, {
      orgId,
      role: 'vc',
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('vc_member_added', {
      orgId,
      addedUid: uid,
      role,
      addedBy
    });
  }

  /**
   * Remove member from VC organization
   */
  async removeVCMember(orgId: string, uid: string, removedBy: string): Promise<void> {
    const orgRef = doc(db!, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    const orgData = orgDoc.data() as VCOrganization;

    // Remove member
    const updatedMembers = orgData.members.filter(m => m.uid !== uid);
    await updateDoc(orgRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp()
    });

    // Clear user's orgId
    const userRef = doc(db!, 'users', uid);
    await updateDoc(userRef, {
      orgId: null,
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('vc_member_removed', {
      orgId,
      removedUid: uid,
      removedBy
    });
  }

  /**
   * Update custom claims
   */
  private async updateCustomClaims(uid: string, claims: any): Promise<void> {
    try {
      const response = await fetch('/api/auth/update-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, claims })
      });

      if (!response.ok) {
        throw new Error('Failed to update custom claims');
      }

      // Force token refresh to get updated claims
      if (typeof window !== 'undefined' && auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
      console.error('Error updating custom claims:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, data: any): Promise<void> {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}

export const vcAuthManager = VCAuthManager.getInstance();
