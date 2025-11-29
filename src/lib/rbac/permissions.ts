/**
 * RBAC (Role-Based Access Control) System
 * Server-side permission enforcement for admin and department access
 * NO ROLE MIXING - Each role completely isolated
 */

export type SystemRole = 
  | 'super_admin'      // Full access to everything
  | 'department_admin' // Full access to assigned department
  | 'department_staff' // Limited access to assigned department
  | 'department_read'  // Read-only access to assigned department
  | 'founder'          // Founder role (isolated)
  | 'vc'              // VC role (isolated)
  | 'investor';       // Investor role (isolated)

export type DepartmentType = 
  | 'KYC'
  | 'KYB'
  | 'Registration'
  | 'Pitch Intake'
  | 'Pitch Projects'
  | 'Finance'
  | 'Chat'
  | 'Compliance';

export type PermissionAction =
  | 'view_dossier'
  | 'edit_dossier'
  | 'approve_dossier'
  | 'reject_dossier'
  | 'view_documents'
  | 'download_documents'
  | 'add_comments'
  | 'edit_comments'
  | 'view_audit'
  | 'export_data'
  | 'manage_team'
  | 'add_members'
  | 'remove_members'
  | 'run_ai_overview'
  | 'view_finance'
  | 'reconcile_payments'
  | 'view_all_departments'
  | 'manage_departments';

export interface UserPermissions {
  role: SystemRole;
  department?: DepartmentType;
  permissions: PermissionAction[];
  canAccessDepartments: DepartmentType[];
}

/**
 * Super Admin Permissions (anasshamsiggc@gmail.com)
 * Full access to everything
 */
const SUPER_ADMIN_PERMISSIONS: PermissionAction[] = [
  'view_dossier',
  'edit_dossier',
  'approve_dossier',
  'reject_dossier',
  'view_documents',
  'download_documents',
  'add_comments',
  'edit_comments',
  'view_audit',
  'export_data',
  'manage_team',
  'add_members',
  'remove_members',
  'run_ai_overview',
  'view_finance',
  'reconcile_payments',
  'view_all_departments',
  'manage_departments'
];

/**
 * Department Admin Permissions
 * Full access to their department only
 */
const DEPARTMENT_ADMIN_PERMISSIONS: PermissionAction[] = [
  'view_dossier',
  'edit_dossier',
  'approve_dossier',
  'reject_dossier',
  'view_documents',
  'download_documents',
  'add_comments',
  'edit_comments',
  'view_audit',
  'export_data',
  'manage_team',
  'add_members',
  'remove_members',
  'run_ai_overview',
  'view_finance'
];

/**
 * Department Staff Permissions
 * Can review and comment, cannot approve/reject
 */
const DEPARTMENT_STAFF_PERMISSIONS: PermissionAction[] = [
  'view_dossier',
  'view_documents',
  'add_comments',
  'run_ai_overview'
];

/**
 * Department Read-Only Permissions
 * Can only view, no actions
 */
const DEPARTMENT_READ_PERMISSIONS: PermissionAction[] = [
  'view_dossier',
  'view_documents'
];

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: SystemRole): PermissionAction[] {
  switch (role) {
    case 'super_admin':
      return SUPER_ADMIN_PERMISSIONS;
    case 'department_admin':
      return DEPARTMENT_ADMIN_PERMISSIONS;
    case 'department_staff':
      return DEPARTMENT_STAFF_PERMISSIONS;
    case 'department_read':
      return DEPARTMENT_READ_PERMISSIONS;
    default:
      return []; // No permissions for other roles
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  userPermissions: UserPermissions,
  action: PermissionAction,
  targetDepartment?: DepartmentType
): boolean {
  // Super admin has all permissions
  if (userPermissions.role === 'super_admin') {
    return true;
  }

  // Check if user has the permission
  if (!userPermissions.permissions.includes(action)) {
    return false;
  }

  // If department-specific action, verify department access
  if (targetDepartment && userPermissions.department) {
    return userPermissions.department === targetDepartment;
  }

  return true;
}

/**
 * Check if user can access specific department
 */
export function canAccessDepartment(
  userPermissions: UserPermissions,
  department: DepartmentType
): boolean {
  // Super admin can access all departments
  if (userPermissions.role === 'super_admin') {
    return true;
  }

  // Department members can only access their assigned department
  return userPermissions.department === department;
}

/**
 * Get user permissions from Firestore data
 */
export function getUserPermissions(userData: any): UserPermissions {
  const role = userData.role as SystemRole;
  const department = userData.department as DepartmentType | undefined;

  // Super admin
  if (role === 'super_admin' || userData.isAdmin === true) {
    return {
      role: 'super_admin',
      permissions: SUPER_ADMIN_PERMISSIONS,
      canAccessDepartments: ['KYC', 'KYB', 'Registration', 'Pitch Intake', 'Pitch Projects', 'Finance', 'Chat', 'Compliance']
    };
  }

  // Department roles
  if (role === 'department_admin' || role === 'department_staff' || role === 'department_read') {
    return {
      role,
      department,
      permissions: getPermissionsForRole(role),
      canAccessDepartments: department ? [department] : []
    };
  }

  // No permissions for other roles
  return {
    role: role || 'founder',
    permissions: [],
    canAccessDepartments: []
  };
}

/**
 * Validate department access (throws if unauthorized)
 */
export function validateDepartmentAccess(
  userPermissions: UserPermissions,
  department: DepartmentType,
  action: PermissionAction
): void {
  if (!canAccessDepartment(userPermissions, department)) {
    throw new Error(`Unauthorized: No access to ${department} department`);
  }

  if (!hasPermission(userPermissions, action, department)) {
    throw new Error(`Unauthorized: No permission for ${action} in ${department}`);
  }
}

/**
 * Super Admin Email List
 * Only these emails get super_admin role
 */
export const SUPER_ADMIN_EMAILS = [
  'anasshamsiggc@gmail.com',
  'ceo@cryptorafts.com',
  'anasshamsi@cryptorafts.com',
  'admin@cryptorafts.com',
  'support@cryptorafts.com'
];

/**
 * Check if email is super admin
 */
export function isSuperAdmin(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

