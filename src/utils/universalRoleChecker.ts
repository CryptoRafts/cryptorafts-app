"use client";

/**
 * Universal Role Checker
 * Ensures all role-specific pages work correctly
 */

export function checkRoleAccess(requiredRole: string, currentPath: string): boolean {
  console.log(`🔍 Checking role access for ${requiredRole} on ${currentPath}`);
  
  const userRole = localStorage.getItem('userRole');
  const roleSelected = localStorage.getItem('userRoleSelected');
  
  console.log(`🔍 User role: ${userRole}, Role selected: ${roleSelected}`);
  
  // If user has no role or "user" role, redirect to role selection
  if (!userRole || userRole === 'user') {
    console.log("🎯 No role or 'user' role, redirecting to role selection");
    window.location.href = '/role';
    return false;
  }
  
  // If user has wrong role, redirect to their dashboard
  if (userRole !== requiredRole) {
    console.log(`🎯 Wrong role (${userRole} vs ${requiredRole}), redirecting to dashboard`);
    window.location.href = `/${userRole}/dashboard`;
    return false;
  }
  
  // If user has correct role but no roleSelected flag, set it
  if (userRole === requiredRole && roleSelected !== 'true') {
    console.log("🎯 Setting role selected flag");
    localStorage.setItem('userRoleSelected', 'true');
  }
  
  console.log("✅ Role access granted");
  return true;
}

export function ensureCorrectRole(requiredRole: string): boolean {
  const currentPath = window.location.pathname;
  return checkRoleAccess(requiredRole, currentPath);
}

export function redirectToRoleDashboard(role: string): void {
  console.log(`🎯 Redirecting to ${role} dashboard`);
  window.location.href = `/${role}/dashboard`;
}

export function redirectToRoleSelection(): void {
  console.log("🎯 Redirecting to role selection");
  window.location.href = '/role';
}

// Auto-check role access on page load
export function autoCheckRoleAccess(requiredRole: string): void {
  if (typeof window !== 'undefined') {
    // Check after a short delay to ensure all systems are loaded
    setTimeout(() => {
      if (!checkRoleAccess(requiredRole, window.location.pathname)) {
        console.log("🎯 Role access denied, redirecting...");
      }
    }, 1000);
  }
}

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).checkRoleAccess = checkRoleAccess;
  (window as any).ensureCorrectRole = ensureCorrectRole;
  (window as any).redirectToRoleDashboard = redirectToRoleDashboard;
  (window as any).redirectToRoleSelection = redirectToRoleSelection;
  (window as any).autoCheckRoleAccess = autoCheckRoleAccess;
}
