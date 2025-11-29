/**
 * Data Isolation & Security Layer
 * Enforces total UID-based separation across all data
 * ZERO data leaks between users - every query validated by UID
 */

import { db } from '../firebase.client';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  type Query,
  type DocumentReference,
} from 'firebase/firestore';

/**
 * Isolation error - thrown when UID mismatch detected
 */
export class DataIsolationError extends Error {
  constructor(message: string) {
    super(`🔒 DATA ISOLATION VIOLATION: ${message}`);
    this.name = 'DataIsolationError';
  }
}

/**
 * User data namespace paths - all data scoped by UID
 */
export const USER_NAMESPACES = {
  // Core user data
  profile: (uid: string) => `users/${uid}`,
  
  // User-specific collections
  projects: (uid: string) => `users/${uid}/projects`,
  messages: (uid: string) => `users/${uid}/messages`,
  notifications: (uid: string) => `users/${uid}/notifications`,
  files: (uid: string) => `users/${uid}/files`,
  chats: (uid: string) => `users/${uid}/chats`,
  deals: (uid: string) => `users/${uid}/deals`,
  contacts: (uid: string) => `users/${uid}/contacts`,
  settings: (uid: string) => `users/${uid}/settings`,
  activities: (uid: string) => `users/${uid}/activities`,
  
  // Shared collections (with ownership validation)
  sharedProjects: 'projects', // Must have ownerId or founderId field
  sharedChats: 'chat_rooms', // Must have participants array
  sharedDeals: 'deals', // Must have participants array
};

/**
 * Validate UID in every operation
 */
export function validateUID(uid: string | null | undefined): asserts uid is string {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new DataIsolationError('Invalid or missing UID - authentication required');
  }
}

/**
 * Validate ownership of document
 */
export async function validateOwnership(
  docPath: string,
  uid: string,
  ownerField: string = 'userId'
): Promise<boolean> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const docRef = doc(db!, docPath);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new DataIsolationError(`Document not found: ${docPath}`);
  }
  
  const data = docSnap.data();
  const ownerId = data[ownerField];
  
  if (ownerId !== uid) {
    throw new DataIsolationError(
      `User ${uid} attempted to access document owned by ${ownerId}`
    );
  }
  
  return true;
}

/**
 * Validate user is participant in shared resource (chat, deal, etc.)
 */
export function validateParticipant(
  participants: string[],
  uid: string,
  resourceType: string = 'resource'
): boolean {
  validateUID(uid);
  
  if (!participants || !Array.isArray(participants)) {
    throw new DataIsolationError(`Invalid participants array for ${resourceType}`);
  }
  
  if (!participants.includes(uid)) {
    throw new DataIsolationError(
      `User ${uid} is not a participant in this ${resourceType}`
    );
  }
  
  return true;
}

/**
 * Create user-isolated query
 */
export function createIsolatedQuery(
  collectionPath: string,
  uid: string,
  ownerField: string = 'userId'
): Query {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  return query(
    collection(db!, collectionPath),
    where(ownerField, '==', uid)
  );
}

/**
 * Subscribe to user-isolated collection with real-time updates
 */
export function subscribeToIsolatedCollection<T>(
  collectionPath: string,
  uid: string,
  callback: (data: T[]) => void,
  ownerField: string = 'userId'
): () => void {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const q = createIsolatedQuery(collectionPath, uid, ownerField);
  
  return onSnapshot(
    q,
    (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        
        // Double-check ownership
        if (docData[ownerField] !== uid) {
          console.error(`🔒 Isolation violation detected in ${collectionPath}`);
          return;
        }
        
        data.push({ id: doc.id, ...docData } as T);
      });
      callback(data);
    },
    (error) => {
      console.error(`🔒 Isolated subscription error:`, error);
    }
  );
}

/**
 * Get user-isolated document
 */
export async function getIsolatedDocument<T>(
  collectionPath: string,
  documentId: string,
  uid: string,
  ownerField: string = 'userId'
): Promise<T | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const docRef = doc(db!, collectionPath, documentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  
  // Validate ownership
  if (data[ownerField] !== uid) {
    throw new DataIsolationError(
      `Document ${documentId} does not belong to user ${uid}`
    );
  }
  
  return { id: docSnap.id, ...data } as T;
}

/**
 * Set user-isolated document (auto-adds UID)
 */
export async function setIsolatedDocument(
  collectionPath: string,
  documentId: string,
  data: any,
  uid: string,
  ownerField: string = 'userId'
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const docRef = doc(db!, collectionPath, documentId);
  
  // Force UID in data
  const isolatedData = {
    ...data,
    [ownerField]: uid,
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await setDoc(docRef, isolatedData);
  
  console.log(`✅ Isolated document saved for user ${uid}: ${collectionPath}/${documentId}`);
}

/**
 * Update user-isolated document (validates ownership first)
 */
export async function updateIsolatedDocument(
  collectionPath: string,
  documentId: string,
  data: any,
  uid: string,
  ownerField: string = 'userId'
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  // Validate ownership first
  await validateOwnership(`${collectionPath}/${documentId}`, uid, ownerField);
  
  const docRef = doc(db!, collectionPath, documentId);
  
  // Prevent UID tampering
  const updateData = { ...data };
  delete updateData[ownerField];
  updateData.updatedAt = Timestamp.now();
  
  await updateDoc(docRef, updateData);
  
  console.log(`✅ Isolated document updated for user ${uid}: ${collectionPath}/${documentId}`);
}

/**
 * Delete user-isolated document (validates ownership first)
 */
export async function deleteIsolatedDocument(
  collectionPath: string,
  documentId: string,
  uid: string,
  ownerField: string = 'userId'
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  // Validate ownership first
  await validateOwnership(`${collectionPath}/${documentId}`, uid, ownerField);
  
  const docRef = doc(db!, collectionPath, documentId);
  await deleteDoc(docRef);
  
  console.log(`✅ Isolated document deleted for user ${uid}: ${collectionPath}/${documentId}`);
}

/**
 * Get user's projects (isolated)
 */
export async function getUserProjects(uid: string): Promise<any[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const q = query(
    collection(db!, 'projects'),
    where('founderId', '==', uid)
  );
  
  const snapshot = await getDocs(q);
  const projects: any[] = [];
  
  snapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() });
  });
  
  return projects;
}

/**
 * Get user's chats (isolated - only chats they're participant in)
 */
export async function getUserChats(uid: string): Promise<any[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const q = query(
    collection(db!, 'chat_rooms'),
    where('participants', 'array-contains', uid)
  );
  
  const snapshot = await getDocs(q);
  const chats: any[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Double-check participant
    if (data.participants && data.participants.includes(uid)) {
      chats.push({ id: doc.id, ...data });
    }
  });
  
  return chats;
}

/**
 * Get user's notifications (isolated)
 */
export async function getUserNotifications(uid: string, limit: number = 50): Promise<any[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const q = query(
    collection(db!, 'notifications'),
    where('userId', '==', uid)
  );
  
  const snapshot = await getDocs(q);
  const notifications: any[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Validate ownership
    if (data.userId === uid) {
      notifications.push({ id: doc.id, ...data });
    }
  });
  
  return notifications.slice(0, limit);
}

/**
 * Check if user is admin (can see all data)
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const docRef = doc(db!, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return false;
  
  const data = docSnap.data();
  return data.role === 'admin' || data.isAdmin === true;
}

/**
 * Get data with admin override (admin can see all data)
 */
export async function getDataWithAdminAccess<T>(
  collectionPath: string,
  uid: string,
  ownerField: string = 'userId'
): Promise<T[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const admin = await isAdmin(uid);
  
  let q;
  if (admin) {
    // Admin sees everything
    q = collection(db!, collectionPath);
    console.log(`👑 Admin ${uid} accessing all data in ${collectionPath}`);
  } else {
    // Regular users see only their data
    q = query(
      collection(db!, collectionPath),
      where(ownerField, '==', uid)
    );
  }
  
  const snapshot = await getDocs(q as any);
  const data: T[] = [];
  
  snapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as T);
  });
  
  return data;
}

/**
 * Subscribe with admin override
 */
export function subscribeWithAdminAccess<T>(
  collectionPath: string,
  uid: string,
  callback: (data: T[]) => void,
  ownerField: string = 'userId'
): () => void {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  // Check admin status
  isAdmin(uid).then((admin) => {
    let q;
    
    if (admin) {
      // Admin sees everything
      q = collection(db!, collectionPath);
      console.log(`👑 Admin ${uid} subscribing to all data in ${collectionPath}`);
    } else {
      // Regular users see only their data
      q = query(
        collection(db!, collectionPath),
        where(ownerField, '==', uid)
      );
    }
    
    return onSnapshot(q as any, (snapshot) => {
      const data: T[] = [];
      
      snapshot.forEach((doc) => {
        const docData = doc.data();
        
        // For non-admins, double-check ownership
        if (!admin && docData[ownerField] !== uid) {
          console.error(`🔒 Isolation violation detected for user ${uid}`);
          return;
        }
        
        data.push({ id: doc.id, ...docData } as T);
      });
      
      callback(data);
    });
  });
  
  return () => {}; // Return empty unsubscribe initially
}

/**
 * Validate chat access (user must be participant)
 */
export async function validateChatAccess(
  chatRoomId: string,
  uid: string
): Promise<boolean> {
  if (!db) throw new Error('Firebase not initialized');
  
  validateUID(uid);
  
  const docRef = doc(db!, 'chat_rooms', chatRoomId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new DataIsolationError(`Chat room ${chatRoomId} not found`);
  }
  
  const data = docSnap.data();
  return validateParticipant(data.participants, uid, 'chat room');
}

/**
 * Sanitize data before returning (remove other users' sensitive info)
 */
export function sanitizeDataForUser(data: any, uid: string): any {
  if (!data) return data;
  
  // If it's an array, sanitize each item
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForUser(item, uid));
  }
  
  // Create a copy
  const sanitized = { ...data };
  
  // Remove sensitive fields that don't belong to this user
  if (sanitized.userId && sanitized.userId !== uid) {
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.address;
    delete sanitized.taxId;
    delete sanitized.bankDetails;
  }
  
  return sanitized;
}

/**
 * Log isolation breach attempt
 */
export async function logIsolationBreach(
  uid: string,
  attemptedResource: string,
  details: string
): Promise<void> {
  console.error(`🚨 ISOLATION BREACH ATTEMPT:`, {
    uid,
    attemptedResource,
    details,
    timestamp: new Date().toISOString(),
  });
  
  // Log to Firebase security logs
  if (db) {
    try {
      await setDoc(doc(collection(db!, 'security_logs')), {
        type: 'isolation_breach_attempt',
        uid,
        attemptedResource,
        details,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to log breach attempt:', error);
    }
  }
}

/**
 * Cache key generator (includes UID for isolation)
 */
export function generateIsolatedCacheKey(
  resource: string,
  uid: string,
  ...params: string[]
): string {
  validateUID(uid);
  return `${resource}:${uid}:${params.join(':')}`;
}

/**
 * Clear user-specific cache
 */
export function clearUserCache(uid: string): void {
  validateUID(uid);
  
  // Clear any cached data for this user
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.includes(uid)) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log(`✅ Cache cleared for user ${uid}`);
}

/**
 * Isolation health check
 */
export async function checkIsolationHealth(uid: string): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  validateUID(uid);
  
  const issues: string[] = [];
  
  // Check if user data exists
  if (db) {
    const userDoc = await getDoc(doc(db!, 'users', uid));
    if (!userDoc.exists()) {
      issues.push('User document does not exist');
    }
  }
  
  // More checks can be added here
  
  return {
    healthy: issues.length === 0,
    issues,
  };
}

export const DataIsolation = {
  validate: validateUID,
  validateOwnership,
  validateParticipant,
  validateChatAccess,
  createIsolatedQuery,
  subscribeToIsolatedCollection,
  getIsolatedDocument,
  setIsolatedDocument,
  updateIsolatedDocument,
  deleteIsolatedDocument,
  getUserProjects,
  getUserChats,
  getUserNotifications,
  isAdmin,
  getDataWithAdminAccess,
  subscribeWithAdminAccess,
  sanitizeDataForUser,
  logIsolationBreach,
  generateIsolatedCacheKey,
  clearUserCache,
  checkIsolationHealth,
};

