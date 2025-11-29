/**
 * Total Isolation System
 * Enforces complete separation between all user IDs
 * Zero tolerance for data mixing or leaks
 */

import { User } from 'firebase/auth';
import { db, collection, query, where, doc, getDoc, onSnapshot, QueryConstraint } from './firebase.client';

export class IsolationViolationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'IsolationViolationError';
  }
}

/**
 * Core isolation validator
 */
export class TotalIsolation {
  private static instance: TotalIsolation;
  private currentUser: User | null = null;
  private isolationLog: any[] = [];

  static getInstance(): TotalIsolation {
    if (!TotalIsolation.instance) {
      TotalIsolation.instance = new TotalIsolation();
    }
    return TotalIsolation.instance;
  }

  /**
   * Set current user for isolation checks
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.logIsolationEvent('USER_SET', { userId: user?.uid || 'null' });
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Validate user is authenticated
   */
  validateAuthentication(): void {
    if (!this.currentUser) {
      throw new IsolationViolationError('User not authenticated');
    }
  }

  /**
   * Validate UID ownership
   */
  validateUIDOwnership(uid: string, context: string = 'data'): void {
    this.validateAuthentication();
    
    if (uid !== this.currentUser!.uid) {
      this.logIsolationEvent('UID_VIOLATION', {
        expectedUID: this.currentUser!.uid,
        providedUID: uid,
        context
      });
      
      throw new IsolationViolationError(
        `UID ownership violation in ${context}: Expected ${this.currentUser!.uid}, got ${uid}`
      );
    }
  }

  /**
   * Validate document path contains user UID
   */
  validateDocumentPath(path: string): void {
    this.validateAuthentication();
    
    if (!path.includes(this.currentUser!.uid)) {
      this.logIsolationEvent('PATH_VIOLATION', {
        userId: this.currentUser!.uid,
        invalidPath: path
      });
      
      throw new IsolationViolationError(
        `Document path must contain user UID: ${this.currentUser!.uid}. Path: ${path}`
      );
    }
  }

  /**
   * Validate query includes UID filter
   */
  validateQueryConstraints(constraints: QueryConstraint[], context: string = 'query'): void {
    this.validateAuthentication();
    
    const hasUIDFilter = constraints.some(constraint => {
      if (constraint.type === 'where') {
        const fieldPath = (constraint as any).fieldPath;
        const value = (constraint as any).value;
        return (fieldPath === 'userId' || fieldPath === 'ownerId' || fieldPath === 'createdBy') && 
               value === this.currentUser!.uid;
      }
      return false;
    });

    if (!hasUIDFilter) {
      this.logIsolationEvent('QUERY_VIOLATION', {
        userId: this.currentUser!.uid,
        context,
        constraints: constraints.map(c => ({ type: c.type }))
      });
      
      throw new IsolationViolationError(
        `Query in ${context} must include UID filter for user: ${this.currentUser!.uid}`
      );
    }
  }

  /**
   * Create isolated query constraints
   */
  createIsolatedConstraints(additionalConstraints: QueryConstraint[] = []): QueryConstraint[] {
    this.validateAuthentication();
    
    const uidConstraints = [
      where('userId', '==', this.currentUser!.uid)
    ];
    
    return [...uidConstraints, ...additionalConstraints];
  }

  /**
   * Create isolated collection reference
   */
  createIsolatedCollection(collectionName: string): any {
    this.validateAuthentication();
    
    const path = `users/${this.currentUser!.uid}/${collectionName}`;
    this.validateDocumentPath(path);
    
    return collection(db!, path);
  }

  /**
   * Create isolated document reference
   */
  createIsolatedDocument(collectionName: string, docId?: string): any {
    this.validateAuthentication();
    
    const path = docId 
      ? `users/${this.currentUser!.uid}/${collectionName}/${docId}`
      : `users/${this.currentUser!.uid}/${collectionName}`;
    
    this.validateDocumentPath(path);
    
    return doc(db!, path);
  }

  /**
   * Validate data ownership before write
   */
  validateDataOwnership(data: any, ownerField: string = 'userId'): void {
    this.validateAuthentication();
    
    if (data[ownerField] !== this.currentUser!.uid) {
      this.logIsolationEvent('DATA_OWNERSHIP_VIOLATION', {
        userId: this.currentUser!.uid,
        dataOwnerField: data[ownerField],
        ownerField
      });
      
      throw new IsolationViolationError(
        `Data ownership violation: ${ownerField} must be ${this.currentUser!.uid}`
      );
    }
  }

  /**
   * Validate organization access
   */
  validateOrgAccess(orgId: string, userOrgId?: string): void {
    this.validateAuthentication();
    
    const effectiveOrgId = userOrgId || (this.currentUser as any).orgId || this.currentUser!.uid;
    
    if (orgId !== effectiveOrgId && orgId !== this.currentUser!.uid) {
      this.logIsolationEvent('ORG_ACCESS_VIOLATION', {
        userId: this.currentUser!.uid,
        userOrgId: effectiveOrgId,
        requestedOrgId: orgId
      });
      
      throw new IsolationViolationError(
        `Organization access violation: User org ${effectiveOrgId} cannot access org ${orgId}`
      );
    }
  }

  /**
   * Validate chat membership
   */
  validateChatMembership(members: string[], chatId: string): void {
    this.validateAuthentication();
    
    if (!members.includes(this.currentUser!.uid)) {
      this.logIsolationEvent('CHAT_MEMBERSHIP_VIOLATION', {
        userId: this.currentUser!.uid,
        chatId,
        members
      });
      
      throw new IsolationViolationError(
        `Chat membership violation: User ${this.currentUser!.uid} not in chat ${chatId}`
      );
    }
  }

  /**
   * Validate role-based access
   */
  validateRoleAccess(allowedRoles: string[], userRole?: string): void {
    this.validateAuthentication();
    
    const effectiveRole = userRole || (this.currentUser as any).role;
    
    if (!allowedRoles.includes(effectiveRole)) {
      this.logIsolationEvent('ROLE_ACCESS_VIOLATION', {
        userId: this.currentUser!.uid,
        userRole: effectiveRole,
        allowedRoles
      });
      
      throw new IsolationViolationError(
        `Role access violation: Role ${effectiveRole} not in allowed roles: ${allowedRoles.join(', ')}`
      );
    }
  }

  /**
   * Validate admin access
   */
  validateAdminAccess(): void {
    this.validateAuthentication();
    
    const isAdmin = (this.currentUser as any).isAdmin || 
                   (this.currentUser as any).isSuperAdmin ||
                   (this.currentUser as any).admin === true;
    
    if (!isAdmin) {
      this.logIsolationEvent('ADMIN_ACCESS_VIOLATION', {
        userId: this.currentUser!.uid
      });
      
      throw new IsolationViolationError(
        `Admin access violation: User ${this.currentUser!.uid} is not admin`
      );
    }
  }

  /**
   * Create isolated storage path
   */
  createIsolatedStoragePath(fileName: string, subPath: string = ''): string {
    this.validateAuthentication();
    
    const path = `users/${this.currentUser!.uid}/${subPath}/${fileName}`.replace(/\/+/g, '/');
    this.validateDocumentPath(path);
    
    return path;
  }

  /**
   * Validate storage path
   */
  validateStoragePath(path: string): void {
    this.validateAuthentication();
    
    if (!path.includes(this.currentUser!.uid)) {
      this.logIsolationEvent('STORAGE_PATH_VIOLATION', {
        userId: this.currentUser!.uid,
        invalidPath: path
      });
      
      throw new IsolationViolationError(
        `Storage path must contain user UID: ${this.currentUser!.uid}. Path: ${path}`
      );
    }
  }

  /**
   * Filter data by ownership
   */
  filterByOwnership<T extends Record<string, any>>(
    data: T[], 
    ownerField: string = 'userId'
  ): T[] {
    this.validateAuthentication();
    
    const filtered = data.filter(item => {
      const ownerId = item[ownerField] || item.ownerId || item.createdBy;
      return ownerId === this.currentUser!.uid;
    });
    
    if (filtered.length !== data.length) {
      this.logIsolationEvent('DATA_FILTERED', {
        userId: this.currentUser!.uid,
        originalCount: data.length,
        filteredCount: filtered.length,
        ownerField
      });
    }
    
    return filtered;
  }

  /**
   * Create isolated cache key
   */
  createIsolatedCacheKey(key: string): string {
    this.validateAuthentication();
    return `${this.currentUser!.uid}:${key}`;
  }

  /**
   * Validate cache key
   */
  validateCacheKey(key: string): void {
    this.validateAuthentication();
    
    if (!key.startsWith(`${this.currentUser!.uid}:`)) {
      this.logIsolationEvent('CACHE_KEY_VIOLATION', {
        userId: this.currentUser!.uid,
        invalidKey: key
      });
      
      throw new IsolationViolationError(
        `Cache key must start with user UID: ${this.currentUser!.uid}:`
      );
    }
  }

  /**
   * Log isolation events
   */
  private logIsolationEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: this.currentUser?.uid || 'anonymous',
      details
    };
    
    this.isolationLog.push(logEntry);
    console.log('🔒 ISOLATION EVENT:', logEntry);
    
    // Keep only last 100 entries
    if (this.isolationLog.length > 100) {
      this.isolationLog = this.isolationLog.slice(-100);
    }
  }

  /**
   * Get isolation log
   */
  getIsolationLog(): any[] {
    return [...this.isolationLog];
  }

  /**
   * Clear isolation log
   */
  clearIsolationLog(): void {
    this.isolationLog = [];
  }

  /**
   * Test isolation system
   */
  testIsolation(): boolean {
    try {
      if (!this.currentUser) {
        console.error('❌ Isolation test failed: No current user');
        return false;
      }

      // Test 1: UID validation
      this.validateUIDOwnership(this.currentUser.uid, 'test');
      
      try {
        this.validateUIDOwnership('different-uid', 'test');
        console.error('❌ Isolation test failed: UID validation should have thrown');
        return false;
      } catch (error) {
        // Expected to fail
      }

      // Test 2: Document path validation
      const validPath = `users/${this.currentUser.uid}/test`;
      this.validateDocumentPath(validPath);
      
      try {
        this.validateDocumentPath('users/different-uid/test');
        console.error('❌ Isolation test failed: Document path validation should have thrown');
        return false;
      } catch (error) {
        // Expected to fail
      }

      // Test 3: Data filtering
      const testData = [
        { userId: this.currentUser.uid, data: 'valid' },
        { userId: 'different-uid', data: 'invalid' }
      ];
      const filtered = this.filterByOwnership(testData);
      
      if (filtered.length !== 1 || filtered[0].userId !== this.currentUser.uid) {
        console.error('❌ Isolation test failed: Data filtering incorrect');
        return false;
      }

      // Test 4: Cache key validation
      const validKey = this.createIsolatedCacheKey('test');
      this.validateCacheKey(validKey);
      
      try {
        this.validateCacheKey('different-uid:test');
        console.error('❌ Isolation test failed: Cache key validation should have thrown');
        return false;
      } catch (error) {
        // Expected to fail
      }

      console.log('✅ All isolation tests passed for user:', this.currentUser.uid);
      return true;
    } catch (error) {
      console.error('❌ Isolation test failed with error:', error);
      return false;
    }
  }
}

// Singleton instance
export const totalIsolation = TotalIsolation.getInstance();

// Export convenience functions
export const setCurrentUser = (user: User | null) => totalIsolation.setCurrentUser(user);
export const validateUIDOwnership = (uid: string, context?: string) => totalIsolation.validateUIDOwnership(uid, context);
export const validateDocumentPath = (path: string) => totalIsolation.validateDocumentPath(path);
export const validateQueryConstraints = (constraints: QueryConstraint[], context?: string) => totalIsolation.validateQueryConstraints(constraints, context);
export const createIsolatedConstraints = (additionalConstraints?: QueryConstraint[]) => totalIsolation.createIsolatedConstraints(additionalConstraints);
export const createIsolatedCollection = (collectionName: string) => totalIsolation.createIsolatedCollection(collectionName);
export const createIsolatedDocument = (collectionName: string, docId?: string) => totalIsolation.createIsolatedDocument(collectionName, docId);
export const validateDataOwnership = (data: any, ownerField?: string) => totalIsolation.validateDataOwnership(data, ownerField);
export const validateOrgAccess = (orgId: string, userOrgId?: string) => totalIsolation.validateOrgAccess(orgId, userOrgId);
export const validateChatMembership = (members: string[], chatId: string) => totalIsolation.validateChatMembership(members, chatId);
export const validateRoleAccess = (allowedRoles: string[], userRole?: string) => totalIsolation.validateRoleAccess(allowedRoles, userRole);
export const validateAdminAccess = () => totalIsolation.validateAdminAccess();
export const createIsolatedStoragePath = (fileName: string, subPath?: string) => totalIsolation.createIsolatedStoragePath(fileName, subPath);
export const validateStoragePath = (path: string) => totalIsolation.validateStoragePath(path);
export const filterByOwnership = <T extends Record<string, any>>(data: T[], ownerField?: string) => totalIsolation.filterByOwnership(data, ownerField);
export const createIsolatedCacheKey = (key: string) => totalIsolation.createIsolatedCacheKey(key);
export const validateCacheKey = (key: string) => totalIsolation.validateCacheKey(key);
export const testIsolation = () => totalIsolation.testIsolation();
