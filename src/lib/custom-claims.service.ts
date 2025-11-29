
import { adminAuth } from './firebase.admin';
import type { UserRecord } from 'firebase-admin/auth';

export interface CustomClaims {
  role?: 'founder' | 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency' | 'admin';
  onboardingStep?: 'role' | 'profile' | 'kyc' | 'kyb' | 'complete';
  kyc_verified?: boolean;
  kyb_verified?: boolean;
  department?: string;
  permissions?: string[];
  admin?: {
    super?: boolean;
    departments?: string[];
    partners?: boolean;
    config?: boolean;
  };
}

class CustomClaimsService {
  public async updateUserClaims(uid: string, claims: Partial<CustomClaims>): Promise<void> {
    try {
      await adminAuth.setCustomUserClaims(uid, claims);
      console.log(`Updated custom claims for user ${uid}:`, claims);
    } catch (error) {
      console.error(`Error updating custom claims for user ${uid}:`, error);
      throw error;
    }
  }

  public async getUserClaims(uid: string): Promise<CustomClaims | null> {
    try {
      const user = await adminAuth.getUser(uid);
      return user.customClaims as CustomClaims || {};
    } catch (error) {
      console.error(`Error getting custom claims for user ${uid}:`, error);
      return null;
    }
  }

  public async verifyUserClaims(uid: string, requiredClaims: Partial<CustomClaims>): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      if (!claims) return false;

      // Check each required claim
      for (const [key, value] of Object.entries(requiredClaims)) {
        if (claims[key as keyof CustomClaims] !== value) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error verifying claims for user ${uid}:`, error);
      return false;
    }
  }

  public async setAdminClaims(uid: string, adminClaims: CustomClaims['admin']): Promise<void> {
    try {
      await this.updateUserClaims(uid, { admin: adminClaims });
    } catch (error) {
      console.error(`Error setting admin claims for user ${uid}:`, error);
      throw error;
    }
  }

  public async revokeAdminAccess(uid: string): Promise<void> {
    try {
      await this.updateUserClaims(uid, { 
        role: undefined,
        admin: undefined,
        permissions: []
      });
    } catch (error) {
      console.error(`Error revoking admin access for user ${uid}:`, error);
      throw error;
    }
  }

  public async grantRole(uid: string, role: CustomClaims['role']): Promise<void> {
    try {
      await this.updateUserClaims(uid, { role });
    } catch (error) {
      console.error(`Error granting role ${role} to user ${uid}:`, error);
      throw error;
    }
  }

  public async revokeRole(uid: string): Promise<void> {
    try {
      await this.updateUserClaims(uid, { 
        role: undefined,
        onboardingStep: 'role',
        kyc_verified: false,
        kyb_verified: false
      });
    } catch (error) {
      console.error(`Error revoking role for user ${uid}:`, error);
      throw error;
    }
  }

  public async setKycVerified(uid: string, verified: boolean): Promise<void> {
    try {
      await this.updateUserClaims(uid, { kyc_verified: verified });
    } catch (error) {
      console.error(`Error setting KYC verification for user ${uid}:`, error);
      throw error;
    }
  }

  public async setKybVerified(uid: string, verified: boolean): Promise<void> {
    try {
      await this.updateUserClaims(uid, { kyb_verified: verified });
    } catch (error) {
      console.error(`Error setting KYB verification for user ${uid}:`, error);
      throw error;
    }
  }

  public async setOnboardingStep(uid: string, step: CustomClaims['onboardingStep']): Promise<void> {
    try {
      await this.updateUserClaims(uid, { onboardingStep: step });
    } catch (error) {
      console.error(`Error setting onboarding step for user ${uid}:`, error);
      throw error;
    }
  }

  public async setDepartment(uid: string, department: string): Promise<void> {
    try {
      await this.updateUserClaims(uid, { department });
    } catch (error) {
      console.error(`Error setting department for user ${uid}:`, error);
      throw error;
    }
  }

  public async setPermissions(uid: string, permissions: string[]): Promise<void> {
    try {
      await this.updateUserClaims(uid, { permissions });
    } catch (error) {
      console.error(`Error setting permissions for user ${uid}:`, error);
      throw error;
    }
  }

  // Bulk operations for admin management
  public async bulkUpdateClaims(updates: Array<{ uid: string; claims: Partial<CustomClaims> }>): Promise<void> {
    try {
      const promises = updates.map(({ uid, claims }) => 
        this.updateUserClaims(uid, claims)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error in bulk claims update:', error);
      throw error;
    }
  }

  public async getUsersByRole(role: CustomClaims['role']): Promise<string[]> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to maintain a separate index
      // or use Firestore queries with proper indexing
      const listUsers = await adminAuth.listUsers();
      const users = (listUsers.users ?? []) as UserRecord[];
      const usersWithRole = users.filter((user) => 
        (user.customClaims as CustomClaims)?.role === role
      );
      return usersWithRole.map((user) => user.uid);
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      return [];
    }
  }

  public async getAdminUsers(): Promise<string[]> {
    try {
      const listUsers = await adminAuth.listUsers();
      const users = (listUsers.users ?? []) as UserRecord[];
      const adminUsers = users.filter((user) => {
        const claims = user.customClaims as CustomClaims;
        return claims?.admin?.super || claims?.role === 'admin';
      });
      return adminUsers.map((user) => user.uid);
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }
}

export const customClaimsService = new CustomClaimsService();
