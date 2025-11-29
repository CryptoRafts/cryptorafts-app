/**
 * Comprehensive Audit Logging System
 * Tracks all admin and department actions with full context
 * GDPR compliant, immutable, real-time
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { DepartmentType, PermissionAction } from './permissions';

export interface AuditLog {
  // Who performed the action
  actorId: string;
  actorEmail: string;
  actorRole: string;
  actorDepartment?: DepartmentType;

  // What action was performed
  action: PermissionAction | string;
  category: 'AUTHENTICATION' | 'DOSSIER' | 'DOCUMENT' | 'TEAM' | 'AI' | 'FINANCE' | 'EXPORT' | 'SYSTEM';
  
  // What was affected
  targetType: 'user' | 'dossier' | 'document' | 'department' | 'member' | 'payment';
  targetId?: string;
  targetEmail?: string;
  
  // Context
  departmentId?: DepartmentType;
  dossierId?: string;
  dossierType?: 'KYC' | 'KYB' | 'Registration' | 'Pitch';
  
  // Changes (for edit actions)
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Additional data
  metadata: {
    ip?: string;
    userAgent?: string;
    deviceHash?: string;
    [key: string]: any;
  };
  
  // Result
  success: boolean;
  errorMessage?: string;
  
  // Timestamp
  timestamp: any; // serverTimestamp()
}

/**
 * Create audit log entry
 * Safe logging - never fails the main operation
 */
export async function createAuditLog(params: Omit<AuditLog, 'timestamp'>): Promise<void> {
  try {
    // Validate required fields
    if (!params.actorId || !params.actorEmail) {
      console.warn('⚠️ Audit log missing required fields - skipping');
      return;
    }

    // Build audit data - only include defined fields
    const auditData: any = {
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      category: params.category,
      targetType: params.targetType,
      metadata: params.metadata || {},
      success: params.success,
      timestamp: serverTimestamp()
    };

    // Add optional fields only if defined
    if (params.actorDepartment) auditData.actorDepartment = params.actorDepartment;
    if (params.targetId) auditData.targetId = params.targetId;
    if (params.targetEmail) auditData.targetEmail = params.targetEmail;
    if (params.departmentId) auditData.departmentId = params.departmentId;
    if (params.dossierId) auditData.dossierId = params.dossierId;
    if (params.dossierType) auditData.dossierType = params.dossierType;
    if (params.changes) auditData.changes = params.changes;
    if (params.errorMessage) auditData.errorMessage = params.errorMessage;

    // Add to Firestore
    await addDoc(collection(db!, 'audit_logs'), auditData);
    
    console.log('✅ Audit log created:', params.action);
  } catch (error) {
    // Never throw - audit logging failure shouldn't break operations
    console.error('❌ Error creating audit log (non-blocking):', error);
  }
}

/**
 * Log authentication action
 */
export async function logAuthentication(params: {
  userId: string;
  email: string;
  role: string;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED';
  metadata?: any;
}): Promise<void> {
  await createAuditLog({
    actorId: params.userId,
    actorEmail: params.email,
    actorRole: params.role,
    action: params.action,
    category: 'AUTHENTICATION',
    targetType: 'user',
    targetId: params.userId,
    metadata: params.metadata || {},
    success: params.action !== 'LOGIN_FAILED'
  });
}

/**
 * Log dossier view
 */
export async function logDossierView(params: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  dossierId: string;
  dossierType: 'KYC' | 'KYB' | 'Registration' | 'Pitch';
  departmentId?: DepartmentType;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: 'VIEW_DOSSIER',
    category: 'DOSSIER',
    targetType: 'dossier',
    targetId: params.dossierId,
    dossierId: params.dossierId,
    dossierType: params.dossierType,
    departmentId: params.departmentId,
    metadata: {
      viewedAt: new Date().toISOString()
    },
    success: true
  });
}

/**
 * Log dossier decision (approve/reject)
 */
export async function logDossierDecision(params: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  dossierId: string;
  dossierType: 'KYC' | 'KYB' | 'Registration' | 'Pitch';
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
  departmentId: DepartmentType;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.decision,
    category: 'DOSSIER',
    targetType: 'dossier',
    targetId: params.dossierId,
    dossierId: params.dossierId,
    dossierType: params.dossierType,
    departmentId: params.departmentId,
    metadata: {
      decision: params.decision,
      reason: params.reason,
      decidedAt: new Date().toISOString()
    },
    success: true
  });
}

/**
 * Log document access
 */
export async function logDocumentAccess(params: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  documentId: string;
  documentType: string;
  action: 'VIEW' | 'DOWNLOAD';
  dossierId: string;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: `DOCUMENT_${params.action}`,
    category: 'DOCUMENT',
    targetType: 'document',
    targetId: params.documentId,
    dossierId: params.dossierId,
    metadata: {
      documentType: params.documentType,
      accessedAt: new Date().toISOString()
    },
    success: true
  });
}

/**
 * Log AI Overview usage
 */
export async function logAIOverview(params: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  dossierId: string;
  dossierType: 'KYC' | 'KYB' | 'Registration' | 'Pitch';
  departmentId: DepartmentType;
  aiProvider: string;
  processingTime: number;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: 'RUN_AI_OVERVIEW',
    category: 'AI',
    targetType: 'dossier',
    targetId: params.dossierId,
    dossierId: params.dossierId,
    dossierType: params.dossierType,
    departmentId: params.departmentId,
    metadata: {
      aiProvider: params.aiProvider,
      processingTime: params.processingTime,
      executedAt: new Date().toISOString()
    },
    success: true
  });
}

/**
 * Log team management action
 */
export async function logTeamAction(params: {
  actorId: string;
  actorEmail: string;
  action: 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'UPDATE_ROLE' | 'SUSPEND_MEMBER';
  targetEmail: string;
  departmentId: DepartmentType;
  metadata: any;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: 'super_admin',
    action: params.action,
    category: 'TEAM',
    targetType: 'member',
    targetEmail: params.targetEmail,
    departmentId: params.departmentId,
    metadata: params.metadata,
    success: true
  });
}

/**
 * Log export action
 */
export async function logExport(params: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  exportType: string;
  departmentId?: DepartmentType;
  recordCount: number;
}): Promise<void> {
  await createAuditLog({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: 'EXPORT_DATA',
    category: 'EXPORT',
    targetType: 'user',
    departmentId: params.departmentId,
    metadata: {
      exportType: params.exportType,
      recordCount: params.recordCount,
      exportedAt: new Date().toISOString()
    },
    success: true
  });
}

/**
 * Get user's IP address and device info (for audit)
 */
export function getAuditMetadata(): { ip?: string; userAgent?: string; deviceHash?: string } {
  if (typeof window === 'undefined') {
    return {};
  }

  const userAgent = navigator.userAgent;
  
  // Create a simple device hash (not for security, just for tracking)
  const deviceString = `${navigator.platform}-${navigator.language}-${screen.width}x${screen.height}`;
  const deviceHash = btoa(deviceString).substring(0, 16);

  return {
    userAgent,
    deviceHash
  };
}

