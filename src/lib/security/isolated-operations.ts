/**
 * Isolated Operations Layer
 * Wrapper for all data operations with automatic UID validation
 */

import { DataIsolation, validateUID } from './data-isolation';
import { db } from '../firebase.client';
import { 
  collection, 
  query, 
  where,
  getDocs,
  addDoc,
  Timestamp 
} from 'firebase/firestore';

/**
 * Isolated Projects Operations
 */
export const IsolatedProjects = {
  /**
   * Get user's own projects (founder)
   */
  async getMyProjects(uid: string) {
    validateUID(uid);
    return DataIsolation.getUserProjects(uid);
  },

  /**
   * Create project (auto-assigns owner)
   */
  async createProject(uid: string, projectData: any) {
    validateUID(uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const project = {
      ...projectData,
      founderId: uid,
      userId: uid,
      ownerId: uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
    };

    const docRef = await addDoc(collection(db!, 'projects'), project);
    
    console.log(`✅ Project created for user ${uid}: ${docRef.id}`);
    return docRef.id;
  },

  /**
   * Update project (validates ownership)
   */
  async updateProject(projectId: string, uid: string, updates: any) {
    validateUID(uid);
    
    await DataIsolation.updateIsolatedDocument(
      'projects',
      projectId,
      updates,
      uid,
      'founderId'
    );
  },

  /**
   * Delete project (validates ownership)
   */
  async deleteProject(projectId: string, uid: string) {
    validateUID(uid);
    
    await DataIsolation.deleteIsolatedDocument(
      'projects',
      projectId,
      uid,
      'founderId'
    );
  },
};

/**
 * Isolated Chat Operations
 */
export const IsolatedChats = {
  /**
   * Get user's chats (only chats they're participant in)
   */
  async getMyChats(uid: string) {
    validateUID(uid);
    return DataIsolation.getUserChats(uid);
  },

  /**
   * Validate chat access before loading
   */
  async validateAccess(chatRoomId: string, uid: string) {
    validateUID(uid);
    return DataIsolation.validateChatAccess(chatRoomId, uid);
  },

  /**
   * Send message (validates participant status)
   */
  async sendMessage(chatRoomId: string, uid: string, message: string) {
    validateUID(uid);
    
    // Validate user is participant
    await DataIsolation.validateChatAccess(chatRoomId, uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const messageDoc = {
      chatRoomId,
      userId: uid,
      senderId: uid,
      message,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db!, `chat_rooms/${chatRoomId}/messages`), messageDoc);
    
    console.log(`✅ Message sent in chat ${chatRoomId} by user ${uid}`);
  },

  /**
   * Get chat messages (validates participant)
   */
  async getMessages(chatRoomId: string, uid: string) {
    validateUID(uid);
    
    // Validate user is participant
    await DataIsolation.validateChatAccess(chatRoomId, uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db!, `chat_rooms/${chatRoomId}/messages`)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

/**
 * Isolated Notifications Operations
 */
export const IsolatedNotifications = {
  /**
   * Get user's notifications
   */
  async getMyNotifications(uid: string, limit: number = 50) {
    validateUID(uid);
    return DataIsolation.getUserNotifications(uid, limit);
  },

  /**
   * Create notification for user
   */
  async createNotification(uid: string, notification: any) {
    validateUID(uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const notificationDoc = {
      ...notification,
      userId: uid,
      read: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db!, 'notifications'), notificationDoc);
    
    console.log(`✅ Notification created for user ${uid}: ${docRef.id}`);
    return docRef.id;
  },

  /**
   * Mark notification as read (validates ownership)
   */
  async markAsRead(notificationId: string, uid: string) {
    validateUID(uid);
    
    await DataIsolation.updateIsolatedDocument(
      'notifications',
      notificationId,
      { read: true, readAt: Timestamp.now() },
      uid,
      'userId'
    );
  },

  /**
   * Delete notification (validates ownership)
   */
  async deleteNotification(notificationId: string, uid: string) {
    validateUID(uid);
    
    await DataIsolation.deleteIsolatedDocument(
      'notifications',
      notificationId,
      uid,
      'userId'
    );
  },
};

/**
 * Isolated Files Operations
 */
export const IsolatedFiles = {
  /**
   * Get user's files
   */
  async getMyFiles(uid: string) {
    validateUID(uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db!, 'files'),
      where('userId', '==', uid)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Create file record (auto-assigns owner)
   */
  async createFileRecord(uid: string, fileData: any) {
    validateUID(uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const file = {
      ...fileData,
      userId: uid,
      ownerId: uid,
      uploadedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db!, 'files'), file);
    
    console.log(`✅ File record created for user ${uid}: ${docRef.id}`);
    return docRef.id;
  },

  /**
   * Delete file (validates ownership)
   */
  async deleteFile(fileId: string, uid: string) {
    validateUID(uid);
    
    await DataIsolation.deleteIsolatedDocument(
      'files',
      fileId,
      uid,
      'userId'
    );
  },
};

/**
 * Isolated Deals Operations
 */
export const IsolatedDeals = {
  /**
   * Get user's deals (where they're a participant)
   */
  async getMyDeals(uid: string) {
    validateUID(uid);
    
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db!, 'deals'),
      where('participants', 'array-contains', uid)
    );

    const snapshot = await getDocs(q);
    const deals: any[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Double-check participant
      if (data.participants && data.participants.includes(uid)) {
        deals.push({ id: doc.id, ...data });
      }
    });

    return deals;
  },

  /**
   * Create deal (user must be participant)
   */
  async createDeal(uid: string, dealData: any, participants: string[]) {
    validateUID(uid);
    
    // Validate user is in participants list
    if (!participants.includes(uid)) {
      throw new Error('Creator must be a participant in the deal');
    }

    if (!db) throw new Error('Firebase not initialized');

    const deal = {
      ...dealData,
      participants,
      createdBy: uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
    };

    const docRef = await addDoc(collection(db!, 'deals'), deal);
    
    console.log(`✅ Deal created by user ${uid}: ${docRef.id}`);
    return docRef.id;
  },
};

/**
 * All isolated operations in one export
 */
export const Isolated = {
  Projects: IsolatedProjects,
  Chats: IsolatedChats,
  Notifications: IsolatedNotifications,
  Files: IsolatedFiles,
  Deals: IsolatedDeals,
};

