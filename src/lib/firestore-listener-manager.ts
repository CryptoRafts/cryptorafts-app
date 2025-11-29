// Firestore Listener Manager
// Prevents duplicate listeners and ensures proper cleanup

import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Query, DocumentReference } from 'firebase/firestore';

interface ListenerInfo {
  unsubscribe: Unsubscribe;
  path: string;
  timestamp: number;
}

class FirestoreListenerManager {
  private listeners: Map<string, ListenerInfo> = new Map();
  private isDebugMode = process.env.NODE_ENV === 'development';

  /**
   * Attach a listener with automatic duplicate prevention
   */
  attachListener(
    key: string,
    query: Query | DocumentReference,
    callback: (snapshot: any) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const path = this.getPath(query);
    
    // Remove existing listener if it exists
    this.detachListener(key);
    
    this.log('Attaching listener', { key, path });
    
    // Handle both DocumentReference and Query types
    let unsubscribe: Unsubscribe;
    if ('type' in query && query.type === 'document') {
      // It's a DocumentReference
      unsubscribe = onSnapshot(
        query as DocumentReference,
        (snapshot) => {
          this.log('Listener fired', { key, path, hasData: snapshot.exists() });
          callback(snapshot);
        },
        (error) => {
          this.log('Listener error', { key, path, error: error.message });
          if (onError) {
            onError(error);
          }
        }
      );
    } else {
      // It's a Query
      unsubscribe = onSnapshot(
        query as Query,
        (snapshot) => {
          this.log('Listener fired', { key, path, hasData: !snapshot.empty });
          callback(snapshot);
        },
        (error) => {
          this.log('Listener error', { key, path, error: error.message });
          if (onError) {
            onError(error);
          }
        }
      );
    }

    // Store listener info
    this.listeners.set(key, {
      unsubscribe,
      path,
      timestamp: Date.now()
    });

    return unsubscribe;
  }

  /**
   * Detach a specific listener
   */
  detachListener(key: string): void {
    const listener = this.listeners.get(key);
    if (listener) {
      this.log('Detaching listener', { key, path: listener.path });
      listener.unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Detach all listeners
   */
  detachAllListeners(): void {
    this.log('Detaching all listeners', { count: this.listeners.size });
    
    for (const [key, listener] of this.listeners) {
      this.log('Detaching listener', { key, path: listener.path });
      listener.unsubscribe();
    }
    
    this.listeners.clear();
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get all active listeners (for debugging)
   */
  getActiveListeners(): Array<{ key: string; path: string; timestamp: number }> {
    return Array.from(this.listeners.entries()).map(([key, info]) => ({
      key,
      path: info.path,
      timestamp: info.timestamp
    }));
  }

  /**
   * Extract path from query or document reference
   */
  private getPath(query: Query | DocumentReference): string {
    if ('path' in query) {
      return query.path;
    }
    // For queries, we can't get the exact path, so use a generic identifier
    return `query_${query.type}`;
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.isDebugMode) {
      console.log(`[FirestoreListenerManager] ${message}`, data);
    }
  }
}

// Singleton instance
export const listenerManager = new FirestoreListenerManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    listenerManager.detachAllListeners();
  });
}

export default listenerManager;
