
import { adminAuth, adminDb } from './firebase.admin';
import { customClaimsService } from './custom-claims.service';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
  isSuperAdmin: boolean;
  departments: string[];
  permissions: string[];
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partner {
  id: string;
  name: string;
  type: 'kyc' | 'kyb' | 'payment' | 'communication' | 'other';
  status: 'active' | 'inactive' | 'pending';
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

class AdminService {
  private readonly adminEmail: string;
  private readonly adminDomains: string[];

  constructor() {
    this.adminEmail = process.env.ADMIN_GOOGLE_EMAIL || 'anasshamsiggc@gmail.com';
    this.adminDomains = (process.env.ADMIN_GOOGLE_DOMAINS || 'cryptorafts.com,admin.cryptorafts.com').split(',');
  }

  // Check if user is authorized admin
  public async isAuthorizedAdmin(email: string): Promise<boolean> {
    try {
      // Check exact email match
      if (email === this.adminEmail) {
        return true;
      }

      // Check domain match
      const emailDomain = email.split('@')[1];
      return this.adminDomains.includes(emailDomain);
    } catch (error) {
      console.error('Error checking admin authorization:', error);
      return false;
    }
  }

  // Initialize super admin
  public async initializeSuperAdmin(): Promise<void> {
    try {
      const user = await adminAuth.getUserByEmail(this.adminEmail);
      
      // Set super admin claims
      await customClaimsService.setAdminClaims(user.uid, {
        super: true,
        departments: ['all'],
        partners: true,
        config: true
      });

      // Update user profile
      await adminDb.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'admin',
        isSuperAdmin: true,
        departments: ['all'],
        permissions: ['all'],
        onboardingStep: 'complete',
        kycStatus: 'verified',
        kybStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      }, { merge: true });

      console.log(`Super admin initialized for ${this.adminEmail}`);
    } catch (error) {
      console.error('Error initializing super admin:', error);
      throw error;
    }
  }

  // Grant admin access
  public async grantAdminAccess(uid: string, adminData: {
    departments?: string[];
    permissions?: string[];
    isSuperAdmin?: boolean;
  }): Promise<void> {
    try {
      // Update custom claims
      await customClaimsService.setAdminClaims(uid, {
        super: adminData.isSuperAdmin || false,
        departments: adminData.departments || [],
        partners: adminData.permissions?.includes('manage_partners') || false,
        config: adminData.permissions?.includes('manage_config') || false
      });

      // Update user profile
      await adminDb.collection('users').doc(uid).update({
        role: 'admin',
        isSuperAdmin: adminData.isSuperAdmin || false,
        departments: adminData.departments || [],
        permissions: adminData.permissions || [],
        updatedAt: new Date()
      });

      console.log(`Admin access granted to user ${uid}`);
    } catch (error) {
      console.error('Error granting admin access:', error);
      throw error;
    }
  }

  // Revoke admin access
  public async revokeAdminAccess(uid: string): Promise<void> {
    try {
      // Remove admin claims
      await customClaimsService.revokeAdminAccess(uid);

      // Update user profile
      await adminDb.collection('users').doc(uid).update({
        role: null,
        isSuperAdmin: false,
        departments: [],
        permissions: [],
        updatedAt: new Date()
      });

      console.log(`Admin access revoked for user ${uid}`);
    } catch (error) {
      console.error('Error revoking admin access:', error);
      throw error;
    }
  }

  // Get all admin users
  public async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const snapshot = await adminDb.collection('users')
        .where('role', '==', 'admin')
        .get();

      return snapshot.docs.map((doc: any) => ({
        uid: doc.id,
        ...doc.data()
      })) as AdminUser[];
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  // Create department
  public async createDepartment(departmentData: Omit<Department, 'id'>): Promise<string> {
    try {
      const docRef = await adminDb.collection('departments').add({
        ...departmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // Update department
  public async updateDepartment(departmentId: string, updates: Partial<Department>): Promise<void> {
    try {
      await adminDb.collection('departments').doc(departmentId).update({
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // Get all departments
  public async getDepartments(): Promise<Department[]> {
    try {
      const snapshot = await adminDb.collection('departments').get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
    } catch (error) {
      console.error('Error getting departments:', error);
      return [];
    }
  }

  // Create partner
  public async createPartner(partnerData: Omit<Partner, 'id'>): Promise<string> {
    try {
      const docRef = await adminDb.collection('partners').add({
        ...partnerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  // Update partner
  public async updatePartner(partnerId: string, updates: Partial<Partner>): Promise<void> {
    try {
      await adminDb.collection('partners').doc(partnerId).update({
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  // Get all partners
  public async getPartners(): Promise<Partner[]> {
    try {
      const snapshot = await adminDb.collection('partners').get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
    } catch (error) {
      console.error('Error getting partners:', error);
      return [];
    }
  }

  // Get system metrics
  public async getSystemMetrics(): Promise<any> {
    try {
      const [
        usersSnapshot,
        projectsSnapshot,
        notificationsSnapshot,
        kycSnapshot,
        kybSnapshot
      ] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('projects').get(),
        adminDb.collection('notifications').get(),
        adminDb.collection('kyc_sessions').get(),
        adminDb.collection('kyb_sessions').get()
      ]);

      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter((doc: any) => doc.data().isActive).length;
      const verifiedUsers = usersSnapshot.docs.filter((doc: any) => doc.data().kycStatus === 'verified').length;
      const totalProjects = projectsSnapshot.size;
      const activeProjects = projectsSnapshot.docs.filter((doc: any) => doc.data().status !== 'draft').length;
      const totalNotifications = notificationsSnapshot.size;
      const unreadNotifications = notificationsSnapshot.docs.filter((doc: any) => !doc.data().read).length;
      const totalKycSessions = kycSnapshot.size;
      const totalKybSessions = kybSnapshot.size;

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers
        },
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications
        },
        kyc: {
          total: totalKycSessions
        },
        kyb: {
          total: totalKybSessions
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {};
    }
  }

  // Audit log
  public async logAudit(action: string, resource: string, details: any, userId?: string): Promise<void> {
    try {
      await adminDb.collection('audit_logs').add({
        action,
        resource,
        details,
        userId: userId || 'system',
        timestamp: new Date(),
        ipAddress: 'server',
        userAgent: 'admin-service'
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  // Rate limiting
  public async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    try {
      const now = Date.now();
      const windowStart = now - window;
      
      const snapshot = await adminDb.collection('rate_limits')
        .doc(identifier)
        .collection('requests')
        .where('timestamp', '>=', new Date(windowStart))
        .get();

      return snapshot.size < limit;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  // Record rate limit request
  public async recordRateLimitRequest(identifier: string): Promise<void> {
    try {
      await adminDb.collection('rate_limits')
        .doc(identifier)
        .collection('requests')
        .add({
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error recording rate limit request:', error);
    }
  }
}

export const adminService = new AdminService();
