// src/lib/admin-rbac.ts
// Server-Side RBAC Enforcement for Admin Department System

import { db } from './firebase.client';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Super Admin email (full platform access)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'anasshamsiggc@gmail.com';

export type DepartmentId = 'KYC' | 'KYB' | 'Registration' | 'Pitch Intake' | 'Pitch Projects' | 'Finance' | 'Chat' | 'Compliance';
export type DepartmentRole = 'Dept Admin' | 'Staff' | 'Read-only';

export interface DepartmentPermissions {
  canApprove: boolean;
  canReject: boolean;
  canExport: boolean;
  canModerate: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canViewAudit: boolean;
}

export interface DepartmentMember {
  id: string;
  email: string;
  departmentId: DepartmentId;
  role: DepartmentRole;
  status: 'active' | 'suspended' | 'removed';
  permissions: DepartmentPermissions;
  addedBy: string;
  addedAt: Date;
  updatedAt: Date;
}

// Role-based permissions
const ROLE_PERMISSIONS: Record<DepartmentRole, DepartmentPermissions> = {
  'Dept Admin': {
    canApprove: true,
    canReject: true,
    canExport: true,
    canModerate: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canViewAudit: true,
  },
  'Staff': {
    canApprove: true,
    canReject: true,
    canExport: true,
    canModerate: true,
    canAddMembers: false,
    canRemoveMembers: false,
    canViewAudit: false,
  },
  'Read-only': {
    canApprove: false,
    canReject: false,
    canExport: true,
    canModerate: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canViewAudit: false,
  },
};

// Check if email is Super Admin
export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

// Get department member by email
export async function getDepartmentMember(email: string): Promise<DepartmentMember | null> {
  try {
    const membersRef = collection(db!, 'department_members');
    const q = query(
      membersRef,
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      email: data.email,
      departmentId: data.departmentId,
      role: data.role,
      status: data.status,
      permissions: data.permissions || ROLE_PERMISSIONS[data.role as DepartmentRole],
      addedBy: data.addedBy,
      addedAt: data.addedAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting department member:', error);
    return null;
  }
}

// Check if user has access to department
export async function hasDeppartmentAccess(
  email: string,
  departmentId: DepartmentId
): Promise<boolean> {
  // Super Admin has access to all departments
  if (isSuperAdmin(email)) {
    return true;
  }
  
  const member = await getDepartmentMember(email);
  
  if (!member) {
    return false;
  }
  
  return member.departmentId === departmentId && member.status === 'active';
}

// Check if user has specific permission
export async function hasPermission(
  email: string,
  departmentId: DepartmentId,
  permission: keyof DepartmentPermissions
): Promise<boolean> {
  // Super Admin has all permissions
  if (isSuperAdmin(email)) {
    return true;
  }
  
  const member = await getDepartmentMember(email);
  
  if (!member) {
    return false;
  }
  
  // Check department match
  if (member.departmentId !== departmentId) {
    return false;
  }
  
  // Check specific permission
  return member.permissions[permission] === true;
}

// Get user's accessible departments
export async function getUserDepartments(email: string): Promise<DepartmentId[]> {
  // Super Admin has access to all departments
  if (isSuperAdmin(email)) {
    return ['KYC', 'KYB', 'Registration', 'Pitch Intake', 'Pitch Projects', 'Finance', 'Chat', 'Compliance'];
  }
  
  try {
    const membersRef = collection(db!, 'department_members');
    const q = query(
      membersRef,
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data().departmentId as DepartmentId);
  } catch (error) {
    console.error('Error getting user departments:', error);
    return [];
  }
}

// Get user role in department
export async function getUserRole(email: string, departmentId: DepartmentId): Promise<DepartmentRole | null> {
  // Super Admin is always Dept Admin
  if (isSuperAdmin(email)) {
    return 'Dept Admin';
  }
  
  const member = await getDepartmentMember(email);
  
  if (!member || member.departmentId !== departmentId) {
    return null;
  }
  
  return member.role;
}

// Validate action with RBAC
export async function validateAction(
  email: string,
  departmentId: DepartmentId,
  action: keyof DepartmentPermissions
): Promise<{ allowed: boolean; reason?: string }> {
  // Super Admin always allowed
  if (isSuperAdmin(email)) {
    return { allowed: true };
  }
  
  // Check department access
  const hasAccess = await hasDeppartmentAccess(email, departmentId);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: `Access denied. You are not a member of ${departmentId} department.`,
    };
  }
  
  // Check specific permission
  const hasPerms = await hasPermission(email, departmentId, action);
  if (!hasPerms) {
    return {
      allowed: false,
      reason: `Permission denied. Your role does not permit this action.`,
    };
  }
  
  return { allowed: true };
}

// Get permission matrix for role
export function getPermissionsForRole(role: DepartmentRole): DepartmentPermissions {
  return ROLE_PERMISSIONS[role];
}

// Export for server-side use
export const rbac = {
  isSuperAdmin,
  getDepartmentMember,
  hasDeppartmentAccess,
  hasPermission,
  getUserDepartments,
  getUserRole,
  validateAction,
  getPermissionsForRole,
  SUPER_ADMIN_EMAIL,
};

