import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  Unsubscribe,
  Query,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase.client';

// Global listener management to prevent conflicts
const activeListeners = new Map<string, Unsubscribe>();
const queryCache = new Map<string, any>();

/**
 * Safely execute Firestore queries with proper error handling and cleanup
 */
export class FirestoreManager {
  private static instance: FirestoreManager;
  private listeners = new Map<string, Unsubscribe>();
  private queryQueue = new Map<string, Promise<any>>();

  static getInstance(): FirestoreManager {
    if (!FirestoreManager.instance) {
      FirestoreManager.instance = new FirestoreManager();
    }
    return FirestoreManager.instance;
  }

  /**
   * Safely execute a query with deduplication
   */
  async safeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    cacheTime = 5000
  ): Promise<T> {
    // Check if query is already in progress
    if (this.queryQueue.has(queryKey)) {
      return this.queryQueue.get(queryKey)!;
    }

    // Check cache first
    const cached = queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    // Execute query
    const queryPromise = queryFn()
      .then(result => {
        // Cache result
        queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now()
        });
        
        // Clean up queue
        this.queryQueue.delete(queryKey);
        return result;
      })
      .catch(error => {
        console.error(`Query ${queryKey} failed:`, error);
        this.queryQueue.delete(queryKey);
        throw error;
      });

    this.queryQueue.set(queryKey, queryPromise);
    return queryPromise;
  }

  /**
   * Safely set up a listener with proper cleanup
   */
  safeListener<T>(
    listenerKey: string,
    query: Query,
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    // Set up new listener
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        try {
          onNext(snapshot);
        } catch (error) {
          console.error(`Listener ${listenerKey} error:`, error);
          if (onError) {
            onError(error as Error);
          }
        }
      },
      (error) => {
        console.error(`Listener ${listenerKey} failed:`, error);
        if (onError) {
          onError(error);
        }
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up a specific listener
   */
  cleanupListener(listenerKey: string): void {
    const unsubscribe = this.listeners.get(listenerKey);
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(`Error cleaning up listener ${listenerKey}:`, error);
      }
      this.listeners.delete(listenerKey);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanupAll(): void {
    this.listeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(`Error cleaning up listener ${key}:`, error);
      }
    });
    this.listeners.clear();
    this.queryQueue.clear();
  }

  /**
   * Get safe query for pitches
   */
  async getPitchesCount(userId: string): Promise<number> {
    return this.safeQuery(
      `pitches_${userId}`,
      async () => {
        const q = query(
          collection(db!, 'pitches'),
          where('founderId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
      }
    );
  }

  /**
   * Get safe query for chat rooms
   */
  async getChatRoomsCount(userId: string): Promise<number> {
    return this.safeQuery(
      `chatRooms_${userId}`,
      async () => {
        const q = query(
          collection(db!, 'chatRooms'),
          where('participants', 'array-contains', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
      }
    );
  }

  /**
   * Get safe query for notifications
   */
  async getNotificationsCount(userId: string): Promise<number> {
    return this.safeQuery(
      `notifications_${userId}`,
      async () => {
        const q = query(
          collection(db!, 'notifications'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
      }
    );
  }

  /**
   * Get safe query for projects
   */
  async getProjectsCount(userId: string): Promise<number> {
    return this.safeQuery(
      `projects_${userId}`,
      async () => {
        const q = query(
          collection(db!, 'projects'),
          where('founderId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
      }
    );
  }
}

// Export singleton instance
export const firestoreManager = FirestoreManager.getInstance();

/**
 * Safe wrapper for onSnapshot
 */
export function onSnapshotSafe(
  query: Query,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return firestoreManager.safeListener(
    `query_${Date.now()}_${Math.random()}`,
    query,
    onNext,
    onError
  );
}

/**
 * Cleanup function for components
 */
export function cleanupFirestoreListeners(): void {
  firestoreManager.cleanupAll();
}

/**
 * Debounced query execution
 */
export function debounceQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  delay = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await firestoreManager.safeQuery(queryKey, queryFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}
