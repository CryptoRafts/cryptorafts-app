/**
 * Presets System for Admin Control Studio
 * Save and apply named layout presets
 */

import { db, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from '@/lib/firebase.client';
import { UIState } from './realtime-sync';
import { auditLogger } from './audit';

export interface Preset {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  state: Partial<UIState>;
  category?: 'dark' | 'light' | 'neo-glass' | 'minimal' | 'custom';
  tags?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  usageCount?: number;
}

class PresetsManager {
  private presetsCollection = 'controlStudioPresets';
  
  /**
   * Save current state as preset
   */
  async savePreset(
    name: string,
    state: Partial<UIState>,
    userId: string,
    userEmail: string,
    options?: {
      description?: string;
      category?: Preset['category'];
      tags?: string[];
      thumbnail?: string;
    }
  ): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const presetId = `preset-${Date.now()}`;
      
      const preset: Preset = {
        id: presetId,
        name,
        description: options?.description,
        thumbnail: options?.thumbnail,
        state,
        category: options?.category || 'custom',
        tags: options?.tags || [],
        createdAt: new Date().toISOString(),
        createdBy: userId,
        usageCount: 0
      };
      
      await setDoc(doc(db!, this.presetsCollection, presetId), preset);
      
      // Log to audit
      await auditLogger.log(userId, userEmail, 'preset.create', 'preset', {
        resourceId: presetId,
        metadata: { name, category: preset.category }
      });
      
      console.log(`✅ Preset saved: ${name}`);
      return presetId;
    } catch (error) {
      console.error('❌ Failed to save preset:', error);
      throw error;
    }
  }
  
  /**
   * Get all presets
   */
  async getPresets(): Promise<Preset[]> {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db!, this.presetsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Preset);
    } catch (error) {
      console.error('❌ Failed to get presets:', error);
      return [];
    }
  }
  
  /**
   * Get preset by ID
   */
  async getPreset(presetId: string): Promise<Preset | null> {
    if (!db) return null;
    
    try {
      const snapshot = await getDoc(doc(db!, this.presetsCollection, presetId));
      if (snapshot.exists()) {
        return snapshot.data() as Preset;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get preset:', error);
      return null;
    }
  }
  
  /**
   * Apply preset to draft
   */
  async applyPreset(
    presetId: string,
    userId: string,
    userEmail: string,
    mergeCurrent = false
  ): Promise<Partial<UIState>> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const preset = await this.getPreset(presetId);
      if (!preset) throw new Error('Preset not found');
      
      // Increment usage count
      await setDoc(doc(db!, this.presetsCollection, presetId), {
        usageCount: (preset.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString()
      }, { merge: true });
      
      // Log to audit
      await auditLogger.log(userId, userEmail, 'preset.apply', 'preset', {
        resourceId: presetId,
        metadata: { name: preset.name }
      });
      
      console.log(`✅ Preset applied: ${preset.name}`);
      return preset.state;
    } catch (error) {
      console.error('❌ Failed to apply preset:', error);
      throw error;
    }
  }
  
  /**
   * Clone preset (create duplicate)
   */
  async clonePreset(
    presetId: string,
    newName: string,
    userId: string,
    userEmail: string
  ): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const original = await this.getPreset(presetId);
      if (!original) throw new Error('Preset not found');
      
      return await this.savePreset(
        newName,
        original.state,
        userId,
        userEmail,
        {
          description: `Cloned from ${original.name}`,
          category: original.category,
          tags: [...(original.tags || []), 'cloned']
        }
      );
    } catch (error) {
      console.error('❌ Failed to clone preset:', error);
      throw error;
    }
  }
  
  /**
   * Delete preset
   */
  async deletePreset(presetId: string, userId: string, userEmail: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      await deleteDoc(doc(db!, this.presetsCollection, presetId));
      
      // Log to audit
      await auditLogger.log(userId, userEmail, 'preset.delete', 'preset', {
        resourceId: presetId
      });
      
      console.log(`✅ Preset deleted: ${presetId}`);
    } catch (error) {
      console.error('❌ Failed to delete preset:', error);
      throw error;
    }
  }
  
  /**
   * Get presets by category
   */
  async getPresetsByCategory(category: Preset['category']): Promise<Preset[]> {
    const allPresets = await this.getPresets();
    return allPresets.filter(p => p.category === category);
  }
  
  /**
   * Search presets
   */
  async searchPresets(searchTerm: string): Promise<Preset[]> {
    const allPresets = await this.getPresets();
    const term = searchTerm.toLowerCase();
    
    return allPresets.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }
}

// Singleton instance
export const presetsManager = new PresetsManager();

// Built-in presets
export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'dark-neo-glass-v3',
    name: 'Dark Neo-Glass v3',
    description: 'Modern dark theme with glassmorphism effects',
    category: 'dark',
    tags: ['dark', 'glass', 'modern'],
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    usageCount: 0,
    state: {
      theme: {
        colors: {
          primary: '#8B5CF6',
          secondary: '#EC4899',
          background: '#0F172A',
          surface: 'rgba(15, 23, 42, 0.8)',
          text: '#F1F5F9',
          accent: '#06B6D4'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
          mono: 'Fira Code'
        },
        spacing: {
          base: 16,
          section: 64,
          card: 24
        },
        borderRadius: {
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32
        }
      }
    }
  },
  {
    id: 'light-minimal',
    name: 'Light Minimal',
    description: 'Clean and minimal light theme',
    category: 'light',
    tags: ['light', 'minimal', 'clean'],
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    usageCount: 0,
    state: {
      theme: {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          accent: '#F59E0B'
        },
        fonts: {
          heading: 'Poppins',
          body: 'Inter',
          mono: 'Roboto Mono'
        },
        spacing: {
          base: 12,
          section: 48,
          card: 16
        },
        borderRadius: {
          sm: 4,
          md: 8,
          lg: 12,
          xl: 16
        }
      }
    }
  }
];

