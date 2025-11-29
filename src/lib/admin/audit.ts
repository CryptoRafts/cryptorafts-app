/**
 * Immutable Audit Logging System
 * Tracks all admin actions with who/what/when
 */

import { db, collection, addDoc, query, orderBy, limit as limitQuery, where, getDocs, serverTimestamp } from '@/lib/firebase.client';

export interface AuditLog {
  id?: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'ui.element.create'
  | 'ui.element.update'
  | 'ui.element.delete'
  | 'ui.element.move'
  | 'ui.element.resize'
  | 'ui.theme.update'
  | 'ui.page.create'
  | 'ui.page.update'
  | 'ui.page.delete'
  | 'ui.publish'
  | 'ui.rollback'
  | 'ui.preview'
  | 'spotlight.create'
  | 'spotlight.update'
  | 'spotlight.delete'
  | 'spotlight.publish'
  | 'spotlight.unpublish'
  | 'team.member.add'
  | 'team.member.remove'
  | 'team.member.update'
  | 'preset.create'
  | 'preset.apply'
  | 'preset.delete';

class AuditLogger {
  private auditCollection = 'adminAuditLogs';
  
  /**
   * Log an action (immutable)
   */
  async log(
    userId: string,
    userEmail: string,
    action: AuditAction,
    resource: string,
    details?: {
      resourceId?: string;
      changes?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (!db) {
      console.warn('⚠️ Firestore not initialized, skipping audit log');
      return;
    }
    
    try {
      const logEntry: AuditLog = {
        timestamp: new Date().toISOString(),
        userId,
        userEmail,
        action,
        resource,
        resourceId: details?.resourceId,
        changes: details?.changes,
        metadata: details?.metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      };
      
      await addDoc(collection(db!, this.auditCollection), logEntry);
      
      console.log(`📝 Audit: ${action} on ${resource} by ${userEmail}`);
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
      // Don't throw - audit failure shouldn't block operations
    }
  }
  
  /**
   * Get audit logs (admin only)
   */
  async getLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    if (!db) return [];
    
    try {
      let q = query(
        collection(db!, this.auditCollection),
        orderBy('timestamp', 'desc')
      );
      
      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      
      if (filters?.action) {
        q = query(q, where('action', '==', filters.action));
      }
      
      if (filters?.resource) {
        q = query(q, where('resource', '==', filters.resource));
      }
      
      if (filters?.limit) {
        q = query(q, limitQuery(filters.limit));
      } else {
        q = query(q, limitQuery(100));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('❌ Failed to get audit logs:', error);
      return [];
    }
  }
  
  /**
   * Get recent activity for a resource
   */
  async getResourceActivity(resourceId: string, limitCount = 20): Promise<AuditLog[]> {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db!, this.auditCollection),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limitQuery(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('❌ Failed to get resource activity:', error);
      return [];
    }
  }
  
  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limitCount = 50): Promise<AuditLog[]> {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db!, this.auditCollection),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limitQuery(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('❌ Failed to get user activity:', error);
      return [];
    }
  }
  
  /**
   * Get activity summary
   */
  async getActivitySummary(days = 7): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
    byResource: Record<string, number>;
  }> {
    if (!db) return { totalActions: 0, byAction: {}, byUser: {}, byResource: {} };
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(db!, this.auditCollection),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => doc.data() as AuditLog);
      
      const summary = {
        totalActions: logs.length,
        byAction: {} as Record<string, number>,
        byUser: {} as Record<string, number>,
        byResource: {} as Record<string, number>
      };
      
      logs.forEach(log => {
        summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
        summary.byUser[log.userEmail] = (summary.byUser[log.userEmail] || 0) + 1;
        summary.byResource[log.resource] = (summary.byResource[log.resource] || 0) + 1;
      });
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to get activity summary:', error);
      return { totalActions: 0, byAction: {}, byUser: {}, byResource: {} };
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Helper functions for common actions
export const logUIChange = (userId: string, userEmail: string, action: AuditAction, changes: Record<string, any>) =>
  auditLogger.log(userId, userEmail, action, 'ui-control-studio', { changes });

export const logSpotlightChange = (userId: string, userEmail: string, action: AuditAction, spotlightId: string, changes?: Record<string, any>) =>
  auditLogger.log(userId, userEmail, action, 'spotlight', { resourceId: spotlightId, changes });

export const logTeamChange = (userId: string, userEmail: string, action: AuditAction, memberId: string, changes?: Record<string, any>) =>
  auditLogger.log(userId, userEmail, action, 'team', { resourceId: memberId, changes });

export const logPresetChange = (userId: string, userEmail: string, action: AuditAction, presetId: string) =>
  auditLogger.log(userId, userEmail, action, 'preset', { resourceId: presetId });

