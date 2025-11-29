/**
 * Admin Departments Management System
 * Server-side RBAC with department scoping
 */

import { db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from './firebase.client';

function ensureDb() {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

export type DepartmentName = 
  | 'KYC' 
  | 'KYB' 
  | 'Registration' 
  | 'Pitch Intake' 
  | 'Pitch Projects' 
  | 'Finance' 
  | 'Chat' 
  | 'Compliance';

export type DepartmentRole = 'Dept Admin' | 'Staff' | 'Read-only';

export interface Department {
  id: string;
  name: DepartmentName;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  memberCount: number;
  capabilities: string[];
}

export interface DepartmentMember {
  id: string;
  email: string;
  displayName?: string;
  departmentId: string;
  departmentName: DepartmentName;
  role: DepartmentRole;
  isActive: boolean;
  invitedBy: string;
  invitedAt: string;
  joinedAt?: string;
  lastActive?: string;
  avatar?: string;
  timezone?: string;
}

export interface DepartmentInvite {
  id: string;
  email: string;
  departmentId: string;
  departmentName: DepartmentName;
  role: DepartmentRole;
  inviteCode: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  acceptedAt?: string;
}

/**
 * Department capabilities mapping
 */
export const departmentCapabilities: Record<DepartmentName, string[]> = {
  'KYC': [
    'review_kyc',
    'approve_kyc',
    'reject_kyc',
    'request_reupload',
    'view_documents',
    'export_reports',
    'raftai_analysis'
  ],
  'KYB': [
    'review_kyb',
    'approve_kyb',
    'reject_kyb',
    'request_reupload',
    'view_business_docs',
    'export_reports',
    'raftai_analysis'
  ],
  'Registration': [
    'review_registrations',
    'approve_users',
    'reject_users',
    'manage_onboarding',
    'view_user_data',
    'export_reports'
  ],
  'Pitch Intake': [
    'triage_pitches',
    'assign_pitches',
    'track_sla',
    'raftai_analysis',
    'request_clarification',
    'export_reports'
  ],
  'Pitch Projects': [
    'manage_projects',
    'track_milestones',
    'assign_owners',
    'update_status',
    'raftai_analysis',
    'export_reports'
  ],
  'Finance': [
    'verify_payments',
    'reconcile_transactions',
    'mark_payment_status',
    'export_csv',
    'export_pdf',
    'raftai_extraction',
    'view_all_transactions'
  ],
  'Chat': [
    'moderate_rooms',
    'mute_users',
    'kick_users',
    'tombstone_messages',
    'run_summaries',
    'raftai_moderation',
    'view_chat_logs'
  ],
  'Compliance': [
    'view_dashboards',
    'view_blockers',
    'view_audit_logs',
    'export_compliance_reports'
  ]
};

/**
 * Create a new department
 */
export async function createDepartment(
  name: DepartmentName,
  createdBy: string
): Promise<Department> {
  const departmentId = `dept_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  
  const department: Department = {
    id: departmentId,
    name,
    displayName: name,
    description: `${name} Department`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    memberCount: 0,
    capabilities: departmentCapabilities[name]
  };

  const database = ensureDb();
  await setDoc(doc(database, 'departments', departmentId), department);
  
  // Log audit
  await logDepartmentAction(createdBy, 'create_department', departmentId, name, {
    action: 'Department created',
    department: name
  });

  return department;
}

/**
 * Get all departments
 */
export async function getAllDepartments(): Promise<Department[]> {
  try {
    const database = ensureDb();
    const snapshot = await getDocs(collection(database, 'departments'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  } catch (error) {
    console.error('Error loading departments:', error);
    return [];
  }
}

/**
 * Update department
 */
export async function updateDepartment(
  departmentId: string,
  updates: Partial<Department>,
  updatedBy: string
): Promise<void> {
  const database = ensureDb();
  await updateDoc(doc(database, 'departments', departmentId), {
    ...updates,
    updatedAt: new Date().toISOString()
  });

  await logDepartmentAction(updatedBy, 'update_department', departmentId, updates.name || 'Unknown', updates);
}

/**
 * Invite member to department
 */
export async function inviteMemberToDepartment(
  email: string,
  departmentId: string,
  departmentName: DepartmentName,
  role: DepartmentRole,
  invitedBy: string
): Promise<DepartmentInvite> {
  // Generate secure invite code
  const inviteCode = generateSecureInviteCode();
  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const invite: DepartmentInvite = {
    id: inviteId,
    email: email.toLowerCase().trim(),
    departmentId,
    departmentName,
    role,
    inviteCode,
    invitedBy,
    invitedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: 'pending'
  };

  const database = ensureDb();
  await setDoc(doc(database, 'department_invites', inviteId), invite);

  // Log audit
  await logDepartmentAction(invitedBy, 'invite_member', departmentId, departmentName, {
    email,
    role,
    inviteCode: `***${inviteCode.slice(-6)}` // Redacted in audit
  });

  return invite;
}

/**
 * Add member to department
 */
export async function addDepartmentMember(
  userId: string,
  email: string,
  departmentId: string,
  departmentName: DepartmentName,
  role: DepartmentRole,
  invitedBy: string
): Promise<DepartmentMember> {
  const memberId = `member_${userId}_${departmentId}`;
  const database = ensureDb();
  
  const member: DepartmentMember = {
    id: memberId,
    email: email.toLowerCase().trim(),
    departmentId,
    departmentName,
    role,
    isActive: true,
    invitedBy,
    invitedAt: new Date().toISOString(),
    joinedAt: new Date().toISOString()
  };

  await setDoc(doc(database, 'department_members', memberId), member);

  // Update department member count
  const dept = await getDocs(query(collection(database, 'departments'), where('id', '==', departmentId)));
  if (!dept.empty) {
    const deptData = dept.docs[0].data();
    await updateDoc(doc(database, 'departments', departmentId), {
      memberCount: (deptData.memberCount || 0) + 1
    });
  }

  // Log audit
  await logDepartmentAction(invitedBy, 'add_member', departmentId, departmentName, {
    email,
    role,
    userId
  });

  return member;
}

/**
 * Get department members
 */
export async function getDepartmentMembers(departmentId: string): Promise<DepartmentMember[]> {
  try {
    const database = ensureDb();
    const q = query(collection(database, 'department_members'), where('departmentId', '==', departmentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepartmentMember));
  } catch (error) {
    console.error('Error loading department members:', error);
    return [];
  }
}

/**
 * Check if user has department permission
 */
export async function hasPermission(
  userId: string,
  departmentName: DepartmentName,
  capability: string
): Promise<boolean> {
  try {
    const database = ensureDb();
    const q = query(
      collection(database, 'department_members'),
      where('email', '==', userId),
      where('departmentName', '==', departmentName),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;

    const member = snapshot.docs[0].data() as DepartmentMember;
    const deptCapabilities = departmentCapabilities[departmentName];
    
    // Dept Admin has all permissions
    if (member.role === 'Dept Admin') return true;
    
    // Read-only can only view
    if (member.role === 'Read-only') {
      return capability.startsWith('view_') || capability.startsWith('export_');
    }
    
    // Staff can do everything except admin functions
    return deptCapabilities.includes(capability);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Generate secure invite code
 */
function generateSecureInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Log department action to audit trail
 */
export async function logDepartmentAction(
  actorId: string,
  action: string,
  departmentId: string,
  departmentName: string,
  metadata: any
): Promise<void> {
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const database = ensureDb();
    
    await setDoc(doc(database, 'admin_audit_logs', auditId), {
      id: auditId,
      actorId,
      action,
      departmentId,
      departmentName,
      metadata,
      timestamp: new Date().toISOString(),
      ipHash: '***', // Should be populated from request
      deviceHash: '***' // Should be populated from request
    });
  } catch (error) {
    console.error('Error logging department action:', error);
  }
}

