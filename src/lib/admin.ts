import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.client';
import { logger } from './logger';
import { Role } from './role';

export interface AdminStats {
  totalUsers: number;
  usersByRole: Record<Role, number>;
  totalProjects: number;
  totalPitches: number;
  pendingVerifications: {
    kyc: number;
    kyb: number;
  };
}

export interface UserManagement {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  profileCompleted: boolean;
  kycStatus?: string;
  kybStatus?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  isActive: boolean;
  flags?: {
    isBanned: boolean;
    isSuspended: boolean;
    isVerified: boolean;
    notes?: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: Role;
  targetId?: string;
  targetType?: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export class AdminService {
  // Get admin dashboard statistics
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Get total users
      const usersQuery = query(collection(db!, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Get users by role
      const usersByRole: Record<Role, number> = {
        founder: 0,
        vc: 0,
        exchange: 0,
        ido: 0,
        influencer: 0,
        agency: 0,
        admin: 0
      };

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const role = userData.role as Role;
        if (role && usersByRole.hasOwnProperty(role)) {
          usersByRole[role]++;
        }
      });

      // Get total projects
      const projectsQuery = query(collection(db!, 'projects'));
      const projectsSnapshot = await getDocs(projectsQuery);
      const totalProjects = projectsSnapshot.size;

      // Get total pitches
      const pitchesQuery = query(collection(db!, 'pitches'));
      const pitchesSnapshot = await getDocs(pitchesQuery);
      const totalPitches = pitchesSnapshot.size;

      // Get pending verifications
      const pendingKycQuery = query(
        collection(db!, 'kyc_verifications'),
        where('status', '==', 'under_review')
      );
      const pendingKycSnapshot = await getDocs(pendingKycQuery);

      const pendingKybQuery = query(
        collection(db!, 'kyb_verifications'),
        where('status', '==', 'under_review')
      );
      const pendingKybSnapshot = await getDocs(pendingKybQuery);

      return {
        totalUsers,
        usersByRole,
        totalProjects,
        totalPitches,
        pendingVerifications: {
          kyc: pendingKycSnapshot.size,
          kyb: pendingKybSnapshot.size
        }
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to get admin stats', { error: err instanceof Error ? err.message : String(err) });
      throw error;
    }
  }

  // Get all users for management
  static async getAllUsers(): Promise<UserManagement[]> {
    try {
      const q = query(
        collection(db!, 'users'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserManagement));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to get all users', { error: err instanceof Error ? err.message : String(err) });
      throw error;
    }
  }

  // Update user flags
  static async updateUserFlags(
    userId: string,
    flags: Partial<UserManagement['flags']>,
    adminId: string
  ): Promise<void> {
    try {
      const userRef = doc(db!, 'users', userId);
      await updateDoc(userRef, {
        flags: {
          ...flags
        },
        updatedAt: serverTimestamp()
      });

      // Log admin action
      await this.logAdminAction(
        adminId,
        'update_user_flags',
        userId,
        'user',
        `Updated user flags: ${JSON.stringify(flags)}`,
        { userId, flags }
      );

      logger.info('User flags updated', { userId, adminId, flags });
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update user flags', { error: err instanceof Error ? err.message : String(err), userId });
      throw error;
    }
  }

  // Log admin action
  static async logAdminAction(
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        action,
        performedBy: adminId,
        performedByRole: 'admin',
        targetId,
        targetType,
        description,
        timestamp: serverTimestamp() as Timestamp,
        metadata
      };

      await addDoc(collection(db!, 'audit_logs'), auditLog);
      
      logger.info('Admin action logged', { adminId, action, targetId });
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to log admin action', { error: err instanceof Error ? err.message : String(err), adminId });
      throw error;
    }
  }

  // Get audit logs
  static async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db!, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to get audit logs', { error: err instanceof Error ? err.message : String(err) });
      throw error;
    }
  }
}
