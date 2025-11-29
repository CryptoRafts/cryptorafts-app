/**
 * Real-time Sync System for Admin Control Studio
 * Handles Firestore real-time updates with optimistic UI
 */

import { db, doc, setDoc, getDoc, onSnapshot, collection, query, orderBy, limit as limitQuery, serverTimestamp } from '@/lib/firebase.client';

export interface UIState {
  elements: Record<string, ElementState>;
  theme: ThemeState;
  pages: Record<string, PageState>;
  version: string;
  lastModified: string;
  lastModifiedBy: string;
  status: 'draft' | 'preview' | 'published';
}

export interface ElementState {
  id: string;
  type: 'logo' | 'text' | 'button' | 'card' | 'section' | 'image';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, any>;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  page?: string;
}

export interface ThemeState {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
}

export interface PageState {
  id: string;
  name: string;
  route: string;
  elements: string[];
  meta: Record<string, any>;
}

class RealtimeSyncManager {
  private draftRef = 'controlStudio';
  private draftDocId = 'currentDraft';
  private publishedDocId = 'currentPublished';
  private versionsCollection = 'controlStudioVersions';
  private listeners: Array<() => void> = [];
  private localChanges: Map<string, any> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  
  /**
   * Subscribe to draft changes (real-time)
   */
  subscribeToDraft(callback: (state: UIState) => void): () => void {
    if (!db) return () => {};
    
    const unsubscribe = onSnapshot(doc(db!, this.draftRef, this.draftDocId), (snapshot) => {
      if (snapshot.exists()) {
        const state = snapshot.data() as UIState;
        callback(state);
        console.log('🔄 Draft updated from Firestore');
      }
    });
    
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }
  
  /**
   * Update draft with debouncing (optimistic UI)
   */
  async updateDraft(changes: Partial<UIState>, userId: string, immediate = false): Promise<void> {
    if (!db) return;
    
    // Store locally for optimistic UI
    Object.entries(changes).forEach(([key, value]) => {
      this.localChanges.set(key, value);
    });
    
    // Debounce writes
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    
    const performWrite = async () => {
      try {
        const allChanges = Object.fromEntries(this.localChanges);
        
        await setDoc(doc(db!, this.draftRef, this.draftDocId), {
          ...allChanges,
          lastModified: new Date().toISOString(),
          lastModifiedBy: userId,
          version: `draft-${Date.now()}`
        }, { merge: true });
        
        this.localChanges.clear();
        console.log('✅ Draft synced to Firestore');
      } catch (error) {
        console.error('❌ Failed to sync draft:', error);
        // Keep local changes for retry
      }
    };
    
    if (immediate) {
      await performWrite();
    } else {
      this.syncTimer = setTimeout(performWrite, 500); // 500ms debounce
    }
  }
  
  /**
   * Get current draft state
   */
  async getDraft(): Promise<UIState | null> {
    if (!db) return null;
    
    try {
      const snapshot = await getDoc(doc(db!, this.draftRef, this.draftDocId));
      if (snapshot.exists()) {
        return snapshot.data() as UIState;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get draft:', error);
      return null;
    }
  }
  
  /**
   * Publish draft to production
   */
  async publish(userId: string): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      // Get current draft
      const draft = await this.getDraft();
      if (!draft) throw new Error('No draft to publish');
      
      const version = `v${Date.now()}`;
      
      // Save to versions (for rollback)
      await setDoc(doc(db!, this.versionsCollection, version), {
        ...draft,
        publishedAt: new Date().toISOString(),
        publishedBy: userId,
        version
      });
      
      // Publish to production
      await setDoc(doc(db!, this.draftRef, this.publishedDocId), {
        ...draft,
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedBy: userId,
        version
      });
      
      // Update draft status
      await setDoc(doc(db!, this.draftRef, this.draftDocId), {
        status: 'published',
        lastPublishedVersion: version
      }, { merge: true });
      
      console.log(`✅ Published version: ${version}`);
      return version;
    } catch (error) {
      console.error('❌ Failed to publish:', error);
      throw error;
    }
  }
  
  /**
   * Load published state
   */
  async getPublished(): Promise<UIState | null> {
    if (!db) return null;
    
    try {
      const snapshot = await getDoc(doc(db!, this.draftRef, this.publishedDocId));
      if (snapshot.exists()) {
        return snapshot.data() as UIState;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get published state:', error);
      return null;
    }
  }
  
  /**
   * Get version history
   */
  async getVersions(limitCount = 20): Promise<Array<UIState & { version: string }>> {
    if (!db) return [];
    
    try {
      const versionsQuery = query(
        collection(db!, this.versionsCollection),
        orderBy('publishedAt', 'desc'),
        limitQuery(limitCount)
      );
      
      const snapshot = await getDocs(versionsQuery);
      return snapshot.docs.map(doc => ({ ...doc.data(), version: doc.id } as any));
    } catch (error) {
      console.error('❌ Failed to get versions:', error);
      return [];
    }
  }
  
  /**
   * Rollback to a specific version
   */
  async rollback(version: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      // Get the version
      const snapshot = await getDoc(doc(db!, this.versionsCollection, version));
      if (!snapshot.exists()) throw new Error('Version not found');
      
      const versionState = snapshot.data() as UIState;
      
      // Set as current draft
      await setDoc(doc(db!, this.draftRef, this.draftDocId), {
        ...versionState,
        status: 'draft',
        lastModified: new Date().toISOString(),
        lastModifiedBy: userId,
        rolledBackFrom: version
      });
      
      console.log(`✅ Rolled back to version: ${version}`);
    } catch (error) {
      console.error('❌ Failed to rollback:', error);
      throw error;
    }
  }
  
  /**
   * Create a preview (temporary published state)
   */
  async createPreview(userId: string): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const draft = await this.getDraft();
      if (!draft) throw new Error('No draft to preview');
      
      const previewId = `preview-${Date.now()}`;
      
      await setDoc(doc(db!, 'controlStudioPreviews', previewId), {
        ...draft,
        status: 'preview',
        previewId,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
      });
      
      console.log(`✅ Preview created: ${previewId}`);
      return previewId;
    } catch (error) {
      console.error('❌ Failed to create preview:', error);
      throw error;
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSyncManager();

// Helper to get missing import
import { getDocs } from '@/lib/firebase.client';

