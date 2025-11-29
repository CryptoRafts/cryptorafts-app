import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase.client';

export interface AuditEntry {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'project' | 'kyc' | 'kyb' | 'partner' | 'config' | 'system';
  targetId: string;
  targetName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
  immutable: true;
}

/**
 * Log an admin action to the immutable audit trail
 */
export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: AuditEntry['targetType'],
  targetId: string,
  options?: {
    targetName?: string;
    changes?: AuditEntry['changes'];
    metadata?: Record<string, any>;
    requestId?: string;
  }
): Promise<string> {
  try {
    const database = db;
    if (!database) {
      throw new Error('Firestore not initialized');
    }
    // Build audit entry without undefined fields (Firestore doesn't accept undefined)
    const auditEntry: any = {
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      requestId: options?.requestId || generateRequestId(),
      ipAddress: await getClientIP(),
      userAgent: getClientUserAgent(),
      timestamp: serverTimestamp(),
      immutable: true
    };

    // Only add optional fields if they exist
    if (options?.targetName) auditEntry.targetName = options.targetName;
    if (options?.changes) auditEntry.changes = options.changes;
    if (options?.metadata) auditEntry.metadata = options.metadata;

    const docRef = await addDoc(collection(database, 'adminAuditLog'), auditEntry);
    console.log(`✅ Audit logged: ${action} on ${targetType}:${targetId} by ${adminEmail}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to log audit entry:', error);
    // Don't throw - audit logging should never break the app
    return '';
  }
}

/**
 * Log KYC approval/rejection
 */
export async function logKYCDecision(
  adminId: string,
  adminEmail: string,
  userId: string,
  userName: string,
  decision: 'approved' | 'rejected' | 'reset',
  reason?: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `kyc_${decision}`,
    'kyc',
    userId,
    {
      targetName: userName,
      metadata: { decision, reason }
    }
  );
}

/**
 * Log KYB approval/rejection
 */
export async function logKYBDecision(
  adminId: string,
  adminEmail: string,
  userId: string,
  orgName: string,
  decision: 'approved' | 'rejected' | 'reset',
  reason?: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `kyb_${decision}`,
    'kyb',
    userId,
    {
      targetName: orgName,
      metadata: { decision, reason }
    }
  );
}

/**
 * Log project approval/rejection
 */
export async function logProjectDecision(
  adminId: string,
  adminEmail: string,
  projectId: string,
  projectName: string,
  decision: 'approved' | 'rejected',
  founderName?: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `project_${decision}`,
    'project',
    projectId,
    {
      targetName: projectName,
      metadata: { decision, founderName }
    }
  );
}

/**
 * Log user deletion
 */
export async function logUserDeletion(
  adminId: string,
  adminEmail: string,
  userId: string,
  userName: string,
  userRole: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    'user_deleted',
    'user',
    userId,
    {
      targetName: userName,
      metadata: { userRole }
    }
  );
}

/**
 * Log user status change
 */
export async function logUserStatusChange(
  adminId: string,
  adminEmail: string,
  userId: string,
  userName: string,
  newStatus: boolean
) {
  return logAdminAction(
    adminId,
    adminEmail,
    newStatus ? 'user_activated' : 'user_deactivated',
    'user',
    userId,
    {
      targetName: userName,
      changes: [{
        field: 'isActive',
        oldValue: !newStatus,
        newValue: newStatus
      }]
    }
  );
}

/**
 * Log department scope grant/revoke
 */
export async function logDepartmentScopeChange(
  adminId: string,
  adminEmail: string,
  userId: string,
  userName: string,
  action: 'granted' | 'revoked',
  scopes: string[]
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `department_scope_${action}`,
    'user',
    userId,
    {
      targetName: userName,
      metadata: { scopes }
    }
  );
}

/**
 * Log dual-control operation
 */
export async function logDualControlOperation(
  adminId: string,
  adminEmail: string,
  secondAdminId: string,
  secondAdminEmail: string,
  operation: string,
  targetType: AuditEntry['targetType'],
  targetId: string,
  targetName?: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `dual_control_${operation}`,
    targetType,
    targetId,
    {
      targetName,
      metadata: {
        requiresDualControl: true,
        primaryAdmin: adminEmail,
        secondaryAdmin: secondAdminEmail,
        secondaryAdminId: secondAdminId
      }
    }
  );
}

/**
 * Log config seal/unseal
 */
export async function logConfigSeal(
  adminId: string,
  adminEmail: string,
  action: 'seal' | 'unseal',
  configKey: string
) {
  return logAdminAction(
    adminId,
    adminEmail,
    `config_${action}`,
    'config',
    configKey,
    {
      targetName: configKey,
      metadata: { action }
    }
  );
}

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getClientIP(): Promise<string> {
  try {
    // In a real app, you'd get this from the request headers via API route
    return 'client-ip-not-available';
  } catch {
    return 'unknown';
  }
}

function getClientUserAgent(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent;
  }
  return 'unknown';
}

