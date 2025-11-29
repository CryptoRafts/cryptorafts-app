/**
 * Total Isolation Hook
 * Provides isolation utilities for React components
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { 
  totalIsolation, 
  validateUIDOwnership, 
  validateDocumentPath, 
  createIsolatedCollection,
  createIsolatedDocument,
  validateDataOwnership,
  filterByOwnership,
  createIsolatedCacheKey,
  validateStoragePath
} from '@/lib/total-isolation';

export function useTotalIsolation() {
  const { user } = useAuth();

  // Initialize isolation with current user
  useEffect(() => {
    totalIsolation.setCurrentUser(user);
  }, [user]);

  // Validate UID ownership
  const validateOwnership = useCallback((uid: string, context?: string) => {
    return validateUIDOwnership(uid, context);
  }, []);

  // Validate document path
  const validatePath = useCallback((path: string) => {
    return validateDocumentPath(path);
  }, []);

  // Create isolated collection
  const createCollection = useCallback((collectionName: string) => {
    return createIsolatedCollection(collectionName);
  }, []);

  // Create isolated document
  const createDocument = useCallback((collectionName: string, docId?: string) => {
    return createIsolatedDocument(collectionName, docId);
  }, []);

  // Validate data ownership
  const validateData = useCallback((data: any, ownerField?: string) => {
    return validateDataOwnership(data, ownerField);
  }, []);

  // Filter data by ownership
  const filterData = useCallback(<T extends Record<string, any>>(
    data: T[], 
    ownerField?: string
  ) => {
    return filterByOwnership(data, ownerField);
  }, []);

  // Create isolated cache key
  const createCacheKey = useCallback((key: string) => {
    return createIsolatedCacheKey(key);
  }, []);

  // Validate storage path
  const validateStorage = useCallback((path: string) => {
    return validateStoragePath(path);
  }, []);

  // Test isolation
  const testIsolation = useCallback(() => {
    return totalIsolation.testIsolation();
  }, []);

  // Get isolation log
  const getIsolationLog = useCallback(() => {
    return totalIsolation.getIsolationLog();
  }, []);

  // Clear isolation log
  const clearIsolationLog = useCallback(() => {
    totalIsolation.clearIsolationLog();
  }, []);

  return {
    user,
    validateOwnership,
    validatePath,
    createCollection,
    createDocument,
    validateData,
    filterData,
    createCacheKey,
    validateStorage,
    testIsolation,
    getIsolationLog,
    clearIsolationLog
  };
}
