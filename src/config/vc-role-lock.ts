/**
 * VC ROLE CONFIGURATION - LOCKED & HARD CODED
 * 
 * ⚠️ DO NOT MODIFY THIS FILE
 * ⚠️ VC role functionality is locked and secured
 * ⚠️ Any changes will break the VC role system
 * 
 * This configuration ensures:
 * 1. Only VC role users can access VC features
 * 2. VC data is completely isolated
 * 3. No cross-role data contamination
 * 4. Strict permission enforcement
 */

// 🔒 LOCKED VC ROLE IDENTIFIER
export const VC_ROLE_ID = 'vc' as const;

// 🔒 LOCKED VC PERMISSIONS
export const VC_PERMISSIONS = Object.freeze({
  VIEW_DASHBOARD: true,
  VIEW_PIPELINE: true,
  VIEW_PORTFOLIO: true,
  ACCEPT_PITCHES: true,
  DECLINE_PITCHES: true,
  CREATE_DEAL_ROOMS: true,
  VIEW_ANALYTICS: true,
  MANAGE_TEAM: true,
  VIEW_SETTINGS: true,
  EXPORT_DATA: true,
} as const);

// 🔒 LOCKED VC ROUTES - These routes are protected
export const VC_PROTECTED_ROUTES = Object.freeze([
  '/vc/dashboard',
  '/vc/pipeline',
  '/vc/portfolio',
  '/vc/analytics',
  '/vc/settings',
  '/vc/settings/team',
  '/vc/kyb',
] as const);

// 🔒 LOCKED VC ROLE VERIFICATION
export function isVCRole(role: string | undefined | null): role is 'vc' {
  return role === VC_ROLE_ID;
}

// 🔒 LOCKED VC ACCESS GUARD
export function requireVCRole(userRole: string | undefined | null): void {
  if (!isVCRole(userRole)) {
    throw new Error('ACCESS_DENIED: VC role required');
  }
}

// 🔒 LOCKED VC PERMISSION CHECK
export function hasVCPermission(
  userRole: string | undefined | null,
  permission: keyof typeof VC_PERMISSIONS
): boolean {
  if (!isVCRole(userRole)) {
    return false;
  }
  return VC_PERMISSIONS[permission] === true;
}

// 🔒 LOCKED VC ROUTE VALIDATION
export function isVCProtectedRoute(path: string): boolean {
  return VC_PROTECTED_ROUTES.some(route => path.startsWith(route));
}

// 🔒 LOCKED VC DATA FILTER
export function createVCDataFilter(userId: string) {
  return Object.freeze({
    vcId: userId,
    role: VC_ROLE_ID,
  });
}

// 🔒 LOCKED VC QUERY CONSTRAINTS
export const VC_FIRESTORE_CONSTRAINTS = Object.freeze({
  ROLE_FIELD: 'vcId',
  TARGET_ROLE: 'vc',
  COLLECTION_PREFIX: 'vc_',
} as const);

// 🔒 LOCKED VC CONFIGURATION
export const VC_CONFIG = Object.freeze({
  ROLE_ID: VC_ROLE_ID,
  ROLE_NAME: 'Venture Capital',
  ROLE_DESCRIPTION: 'Investment firm providing funding to startups',
  PERMISSIONS: VC_PERMISSIONS,
  PROTECTED_ROUTES: VC_PROTECTED_ROUTES,
  REQUIRES_KYB: true,
  MAX_PORTFOLIO_SIZE: 1000,
  MAX_TEAM_MEMBERS: 50,
  DATA_ISOLATION: true,
  STRICT_ACCESS: true,
} as const);

// 🔒 Type guards to ensure type safety
export type VCRoleType = typeof VC_ROLE_ID;
export type VCPermission = keyof typeof VC_PERMISSIONS;
export type VCProtectedRoute = typeof VC_PROTECTED_ROUTES[number];

// 🔒 Prevent any modifications to this module
Object.freeze(exports);

export default VC_CONFIG;

