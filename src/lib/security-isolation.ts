/**
 * Security Isolation Library
 * Enforces strict per-user (UID-based) data isolation
 * Zero tolerance for cross-tenant access
 */

import { User } from 'firebase/auth';

export class SecurityViolationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'SecurityViolationError';
  }
}

/**
 * Validates that data belongs to the current user
 */
export function validateOwnership(
  user: User | null,
  data: any,
  ownerField: string = 'ownerId'
): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  const ownerId = data[ownerField] || data.userId || data.createdBy;
  
  if (!ownerId) {
    throw new SecurityViolationError(
      `Missing owner field in data`,
      { expectedField: ownerField, data }
    );
  }

  if (ownerId !== user.uid) {
    console.error('🚨 SECURITY VIOLATION: Cross-tenant access attempt', {
      userId: user.uid,
      attemptedAccess: ownerId,
      data
    });
    
    throw new SecurityViolationError(
      'Unauthorized access: Data belongs to another user',
      { userId: user.uid, ownerId }
    );
  }
}

/**
 * Validates organization membership
 */
export function validateOrgAccess(
  user: User | null,
  data: any,
  orgIdField: string = 'orgId'
): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  const orgId = data[orgIdField];
  
  if (!orgId) {
    throw new SecurityViolationError(
      `Missing organization field in data`,
      { expectedField: orgIdField, data }
    );
  }

  // Check if user is the org owner or member
  const userOrgId = (user as any).orgId || user.uid;
  
  if (orgId !== userOrgId && orgId !== user.uid) {
    console.error('🚨 SECURITY VIOLATION: Cross-org access attempt', {
      userId: user.uid,
      userOrgId,
      attemptedOrgId: orgId,
      data
    });
    
    throw new SecurityViolationError(
      'Unauthorized access: Data belongs to another organization',
      { userId: user.uid, userOrgId, orgId }
    );
  }
}

/**
 * Validates room/chat membership
 */
export function validateMembership(
  user: User | null,
  members: string[],
  context: string = 'room'
): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  if (!members || !Array.isArray(members)) {
    throw new SecurityViolationError(
      `Invalid members list for ${context}`,
      { members }
    );
  }

  if (!members.includes(user.uid)) {
    console.error('🚨 SECURITY VIOLATION: Non-member access attempt', {
      userId: user.uid,
      members,
      context
    });
    
    throw new SecurityViolationError(
      `Unauthorized access: User is not a member of this ${context}`,
      { userId: user.uid, context }
    );
  }
}

/**
 * Sanitizes query to include UID filter
 */
export function addUIDFilter(
  user: User | null,
  baseQuery: any,
  ownerField: string = 'ownerId'
): any {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  // Clone query and add UID filter
  return {
    ...baseQuery,
    [ownerField]: user.uid
  };
}

/**
 * Validates that no mock data is being used in production
 */
export function validateNoMockData(data: any): void {
  if (data && data.isMock === true) {
    throw new SecurityViolationError(
      'Mock data is not allowed in production',
      { data }
    );
  }
}

/**
 * Scopes local storage key by UID
 */
export function getScopedStorageKey(user: User | null, key: string): string {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }
  
  return `${user.uid}:${key}`;
}

/**
 * Gets scoped local storage value
 */
export function getScopedStorage(user: User | null, key: string): string | null {
  if (!user) return null;
  
  try {
    return localStorage.getItem(getScopedStorageKey(user, key));
  } catch (error) {
    console.error('Error reading scoped storage:', error);
    return null;
  }
}

/**
 * Sets scoped local storage value
 */
export function setScopedStorage(user: User | null, key: string, value: string): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }
  
  try {
    localStorage.setItem(getScopedStorageKey(user, key), value);
  } catch (error) {
    console.error('Error writing scoped storage:', error);
    throw error;
  }
}

/**
 * Clears all scoped storage for user
 */
export function clearScopedStorage(user: User | null): void {
  if (!user) return;
  
  try {
    const prefix = `${user.uid}:`;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing scoped storage:', error);
  }
}

/**
 * Validates Firestore document path contains user UID
 */
export function validateDocumentPath(user: User | null, path: string): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  if (!path.includes(user.uid)) {
    console.error('🚨 SECURITY VIOLATION: Document path missing user UID', {
      userId: user.uid,
      path
    });
    
    throw new SecurityViolationError(
      'Invalid document path: Must include user UID',
      { userId: user.uid, path }
    );
  }
}

/**
 * Validates API request includes correct UID
 */
export function validateAPIRequest(
  user: User | null,
  requestData: any
): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  if (!requestData.userId || requestData.userId !== user.uid) {
    console.error('🚨 SECURITY VIOLATION: API request with mismatched UID', {
      userId: user.uid,
      requestUserId: requestData.userId
    });
    
    throw new SecurityViolationError(
      'Invalid API request: User ID mismatch',
      { userId: user.uid, requestUserId: requestData.userId }
    );
  }
}

/**
 * Logs security event for audit
 */
export function logSecurityEvent(
  user: User | null,
  event: string,
  details?: any
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: user?.uid || 'anonymous',
    event,
    details,
    userAgent: navigator.userAgent
  };
  
  console.log('🔒 SECURITY EVENT:', logEntry);
  
  // In production, send to audit log service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to audit log API
  }
}

/**
 * Validates file upload belongs to user
 */
export function validateFileUpload(
  user: User | null,
  filePath: string
): void {
  if (!user) {
    throw new SecurityViolationError('User not authenticated');
  }

  // File path must include user UID
  if (!filePath.includes(user.uid)) {
    console.error('🚨 SECURITY VIOLATION: File upload with invalid path', {
      userId: user.uid,
      filePath
    });
    
    throw new SecurityViolationError(
      'Invalid file path: Must include user UID',
      { userId: user.uid, filePath }
    );
  }
}

/**
 * Creates audit trail entry
 */
export async function createAuditTrail(
  user: User | null,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
): Promise<void> {
  if (!user) return;
  
  const auditEntry = {
    userId: user.uid,
    action,
    resourceType,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
    ip: 'client-side', // Server should add real IP
    userAgent: navigator.userAgent
  };
  
  logSecurityEvent(user, 'AUDIT_TRAIL', auditEntry);
  
  // In production, save to Firestore audit_logs collection
  if (process.env.NODE_ENV === 'production') {
    try {
      const { db, collection, addDoc } = await import('@/lib/firebase.client');
      await addDoc(collection(db!, 'audit_logs'), auditEntry);
    } catch (error) {
      console.error('Error creating audit trail:', error);
    }
  }
}

/**
 * Validates and filters query results to ensure no cross-tenant data
 */
export function filterByOwnership<T extends Record<string, any>>(
  user: User | null,
  data: T[],
  ownerField: string = 'ownerId'
): T[] {
  if (!user) return [];
  
  const filtered = data.filter(item => {
    const ownerId = item[ownerField] || item.userId || item.createdBy;
    return ownerId === user.uid;
  });
  
  // Log if we filtered out data (potential security issue)
  if (filtered.length !== data.length) {
    console.warn('⚠️ SECURITY WARNING: Filtered out cross-tenant data', {
      userId: user.uid,
      originalCount: data.length,
      filteredCount: filtered.length,
      ownerField
    });
    
    logSecurityEvent(user, 'CROSS_TENANT_DATA_FILTERED', {
      originalCount: data.length,
      filteredCount: filtered.length
    });
  }
  
  return filtered;
}

/**
 * Test helper to verify isolation
 */
export async function testUserIsolation(user: User | null): Promise<boolean> {
  if (!user) {
    console.error('❌ Isolation test failed: No user');
    return false;
  }
  
  try {
    // Test 1: Validate ownership check works
    validateOwnership(user, { ownerId: user.uid }, 'ownerId');
    
    // Test 2: Validate ownership check fails for different UID
    try {
      validateOwnership(user, { ownerId: 'different-uid' }, 'ownerId');
      console.error('❌ Isolation test failed: Ownership check did not throw');
      return false;
    } catch (error) {
      // Expected to fail
    }
    
    // Test 3: Validate scoped storage
    const testKey = 'test-key';
    const testValue = 'test-value';
    setScopedStorage(user, testKey, testValue);
    const retrieved = getScopedStorage(user, testKey);
    
    if (retrieved !== testValue) {
      console.error('❌ Isolation test failed: Scoped storage not working');
      return false;
    }
    
    // Test 4: Validate path validation
    try {
      validateDocumentPath(user, 'users/different-uid/data');
      console.error('❌ Isolation test failed: Path validation did not throw');
      return false;
    } catch (error) {
      // Expected to fail
    }
    
    validateDocumentPath(user, `users/${user.uid}/data`);
    
    console.log('✅ All isolation tests passed for user:', user.uid);
    return true;
  } catch (error) {
    console.error('❌ Isolation test failed with error:', error);
    return false;
  }
}

