/**
 * Admin Authentication Utilities
 * Real-time admin role verification and management
 * NO MOCKUPS - All data from Firebase
 */

import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

/**
 * Admin allowlist - Only these emails can be admins
 * Update this list to add more admin users
 */
export const ADMIN_ALLOWLIST = [
  'anasshamsiggc@gmail.com',
  'ceo@cryptorafts.com',
  'anasshamsi@cryptorafts.com',
  'admin@cryptorafts.com',
  'support@cryptorafts.com'
];

/**
 * Check if an email is in the admin allowlist
 */
export function isEmailInAdminAllowlist(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email.toLowerCase().trim());
}

/**
 * Check if a user has admin role in Firestore
 * Real-time check - no caching
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db!, 'users', userId));
    
    if (!userDoc.exists()) {
      console.warn('⚠️ User document not found:', userId);
      return false;
    }
    
    const userData = userDoc.data();
    const isAdmin = userData.role === 'admin' && userData.isAdmin === true;
    
    console.log('🔐 Admin check for', userId, ':', isAdmin ? 'ADMIN' : 'NOT ADMIN');
    
    return isAdmin;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
}

/**
 * Set admin role for a user in Firestore
 * Real-time write - immediate effect
 */
export async function setUserAsAdmin(userId: string, email: string): Promise<void> {
  try {
    console.log('🔐 Setting admin role for:', email);
    
    await setDoc(doc(db!, 'users', userId), {
      role: 'admin',
      email: email.toLowerCase(),
      isAdmin: true,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Admin role set successfully for:', email);
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    throw error;
  }
}

/**
 * Remove admin role from a user
 * Real-time write - immediate effect
 */
export async function removeAdminRole(userId: string): Promise<void> {
  try {
    console.log('🔐 Removing admin role for:', userId);
    
    await setDoc(doc(db!, 'users', userId), {
      role: null,
      isAdmin: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Admin role removed successfully');
  } catch (error) {
    console.error('❌ Error removing admin role:', error);
    throw error;
  }
}

/**
 * Verify admin access (for use in components)
 * Returns error message if not admin, null if authorized
 */
export async function verifyAdminAccess(
  user: User | null,
  claims: any
): Promise<string | null> {
  // Check 1: User must be logged in
  if (!user) {
    return 'Not authenticated. Please login.';
  }
  
  // Check 2: Email must be in allowlist
  if (!user.email || !isEmailInAdminAllowlist(user.email)) {
    return 'Access denied. Your email is not authorized for admin access.';
  }
  
  // Check 3: Role must be admin (from claims or Firestore)
  const hasAdminRole = claims?.role === 'admin';
  
  if (!hasAdminRole) {
    // Double-check Firestore
    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
      return 'Access denied. Admin role not found.';
    }
  }
  
  // All checks passed
  console.log('✅ Admin access verified for:', user.email);
  return null;
}

/**
 * Get admin user data from Firestore
 * Real-time fetch - no caching
 */
export async function getAdminUserData(userId: string): Promise<any> {
  try {
    const userDoc = await getDoc(doc(db!, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    // Only return data if user is admin
    if (userData.role !== 'admin' || userData.isAdmin !== true) {
      console.warn('⚠️ Attempted to get admin data for non-admin user:', userId);
      return null;
    }
    
    return {
      id: userId,
      ...userData
    };
  } catch (error) {
    console.error('❌ Error getting admin user data:', error);
    return null;
  }
}

/**
 * Check if current path is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Check if user should be redirected from admin route
 * Returns redirect path or null if access is ok
 */
export function getAdminRedirect(
  pathname: string,
  user: User | null,
  claims: any
): string | null {
  // Not an admin route - no redirect needed
  if (!isAdminRoute(pathname)) {
    return null;
  }
  
  // Admin login page - anyone can access
  if (pathname === '/admin/login') {
    // If already logged in as admin, redirect to dashboard
    if (user && claims?.role === 'admin') {
      return '/admin/dashboard';
    }
    return null;
  }
  
  // Other admin routes - must be authenticated admin
  if (!user) {
    return '/admin/login';
  }
  
  // Check role
  if (claims?.role !== 'admin') {
    return '/admin/login';
  }
  
  // All checks passed - no redirect
  return null;
}

/**
 * Admin session management
 */
export const AdminSession = {
  /**
   * Save admin session data
   */
  save(userId: string, email: string, role: string): void {
    try {
      localStorage.setItem('adminUserId', userId);
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminSessionStart', new Date().toISOString());
      console.log('✅ Admin session saved');
    } catch (error) {
      console.error('❌ Error saving admin session:', error);
    }
  },
  
  /**
   * Clear admin session data
   */
  clear(): void {
    try {
      localStorage.removeItem('adminUserId');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminSessionStart');
      localStorage.removeItem('userClaims');
      console.log('✅ Admin session cleared');
    } catch (error) {
      console.error('❌ Error clearing admin session:', error);
    }
  },
  
  /**
   * Check if admin session exists
   */
  exists(): boolean {
    try {
      const isAdmin = localStorage.getItem('isAdmin');
      const role = localStorage.getItem('userRole');
      return isAdmin === 'true' && role === 'admin';
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get admin session data
   */
  get(): { userId: string; email: string } | null {
    try {
      const userId = localStorage.getItem('adminUserId');
      const email = localStorage.getItem('adminEmail');
      const isAdmin = localStorage.getItem('isAdmin');
      
      if (userId && email && isAdmin === 'true') {
        return { userId, email };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
};

/**
 * Console logging utilities for admin actions
 */
export const AdminLogger = {
  log(action: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`🔐 [ADMIN] ${timestamp} - ${action}`, details || '');
  },
  
  error(action: string, error: any): void {
    const timestamp = new Date().toISOString();
    console.error(`❌ [ADMIN ERROR] ${timestamp} - ${action}`, error);
  },
  
  success(action: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`✅ [ADMIN SUCCESS] ${timestamp} - ${action}`, details || '');
  },
  
  warn(action: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️ [ADMIN WARNING] ${timestamp} - ${action}`, details || '');
  }
};

