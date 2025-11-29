// Audit System for Admin UI Control
// Provides comprehensive logging and versioning for all UI changes

import { db, collection, addDoc, updateDoc, doc, getDocs, query, orderBy, limit, Timestamp } from '@/lib/firebase.client';

export interface UIChange {
  id: string;
  timestamp: Date;
  user: string;
  userEmail: string;
  field: string;
  oldValue: any;
  newValue: any;
  version: string;
  type: 'create' | 'update' | 'delete' | 'publish' | 'rollback';
  category: string;
  description?: string;
  metadata?: {
    breakpoint?: string;
    component?: string;
    validationPassed?: boolean;
    warnings?: string[];
  };
}

export interface UIVersion {
  id: string;
  version: string;
  timestamp: Date;
  createdBy: string;
  createdByEmail: string;
  description: string;
  tokens: Record<string, any>;
  overrides: any[];
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
  rollbackCount: number;
  metadata?: {
    changeCount: number;
    categoriesChanged: string[];
    validationResults: any;
  };
}

export interface UIPreset {
  id: string;
  name: string;
  description: string;
  tokens: Record<string, any>;
  overrides: any[];
  createdAt: Date;
  createdBy: string;
  createdByEmail: string;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  metadata?: {
    previewUrl?: string;
    category: string;
    compatibility: string[];
  };
}

export class UIAuditSystem {
  private static instance: UIAuditSystem;
  
  public static getInstance(): UIAuditSystem {
    if (!UIAuditSystem.instance) {
      UIAuditSystem.instance = new UIAuditSystem();
    }
    return UIAuditSystem.instance;
  }
  
  // Log a UI change
  async logChange(change: Omit<UIChange, 'id' | 'timestamp'>): Promise<string> {
    try {
      const changeData: Omit<UIChange, 'id'> = {
        ...change,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(db!, 'uiAuditLog'), {
        ...changeData,
        timestamp: Timestamp.fromDate(changeData.timestamp)
      });
      
      console.log('📝 UI change logged:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error logging UI change:', error);
      throw error;
    }
  }
  
  // Get audit log with pagination
  async getAuditLog(limitCount: number = 50, startAfter?: string): Promise<UIChange[]> {
    try {
      let q = query(
        collection(db!, 'uiAuditLog'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const changes: UIChange[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        changes.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as UIChange);
      });
      
      return changes;
    } catch (error) {
      console.error('❌ Error fetching audit log:', error);
      throw error;
    }
  }
  
  // Create a new version
  async createVersion(versionData: Omit<UIVersion, 'id' | 'timestamp' | 'rollbackCount'>): Promise<string> {
    try {
      const version: Omit<UIVersion, 'id'> = {
        ...versionData,
        timestamp: new Date(),
        rollbackCount: 0
      };
      
      const docRef = await addDoc(collection(db!, 'uiVersions'), {
        ...version,
        timestamp: Timestamp.fromDate(version.timestamp)
      });
      
      console.log('📦 UI version created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating version:', error);
      throw error;
    }
  }
  
  // Get all versions
  async getVersions(): Promise<UIVersion[]> {
    try {
      const q = query(
        collection(db!, 'uiVersions'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const versions: UIVersion[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        versions.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          publishedAt: data.publishedAt?.toDate()
        } as UIVersion);
      });
      
      return versions;
    } catch (error) {
      console.error('❌ Error fetching versions:', error);
      throw error;
    }
  }
  
  // Publish version to production
  async publishVersion(versionId: string, publishedBy: string): Promise<void> {
    try {
      const versionRef = doc(db!, 'uiVersions', versionId);
      await updateDoc(versionRef, {
        isPublished: true,
        publishedAt: Timestamp.now(),
        publishedBy
      });
      
      // Log the publish action
      await this.logChange({
        user: publishedBy,
        userEmail: publishedBy,
        field: 'version.published',
        oldValue: false,
        newValue: true,
        version: versionId,
        type: 'publish',
        category: 'version',
        description: `Published version ${versionId} to production`
      });
      
      console.log('🚀 Version published:', versionId);
    } catch (error) {
      console.error('❌ Error publishing version:', error);
      throw error;
    }
  }
  
  // Rollback to a previous version
  async rollbackToVersion(versionId: string, rolledBackBy: string): Promise<void> {
    try {
      // Get the version to rollback to
      const versions = await this.getVersions();
      const targetVersion = versions.find(v => v.id === versionId);
      
      if (!targetVersion) {
        throw new Error('Version not found');
      }
      
      // Increment rollback count
      const versionRef = doc(db!, 'uiVersions', versionId);
      await updateDoc(versionRef, {
        rollbackCount: targetVersion.rollbackCount + 1
      });
      
      // Log the rollback action
      await this.logChange({
        user: rolledBackBy,
        userEmail: rolledBackBy,
        field: 'version.rollback',
        oldValue: 'current',
        newValue: versionId,
        version: versionId,
        type: 'rollback',
        category: 'version',
        description: `Rolled back to version ${versionId}`
      });
      
      console.log('↩️ Rolled back to version:', versionId);
    } catch (error) {
      console.error('❌ Error rolling back version:', error);
      throw error;
    }
  }
  
  // Save preset
  async savePreset(preset: Omit<UIPreset, 'id' | 'createdAt' | 'usageCount'>): Promise<string> {
    try {
      const presetData: Omit<UIPreset, 'id'> = {
        ...preset,
        createdAt: new Date(),
        usageCount: 0
      };
      
      const docRef = await addDoc(collection(db!, 'uiPresets'), {
        ...presetData,
        createdAt: Timestamp.fromDate(presetData.createdAt)
      });
      
      // Log the preset creation
      await this.logChange({
        user: preset.createdBy,
        userEmail: preset.createdByEmail,
        field: 'preset.created',
        oldValue: null,
        newValue: preset.name,
        version: '1.0.0',
        type: 'create',
        category: 'preset',
        description: `Created preset: ${preset.name}`
      });
      
      console.log('💾 Preset saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving preset:', error);
      throw error;
    }
  }
  
  // Get all presets
  async getPresets(): Promise<UIPreset[]> {
    try {
      const q = query(
        collection(db!, 'uiPresets'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const presets: UIPreset[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        presets.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as UIPreset);
      });
      
      return presets;
    } catch (error) {
      console.error('❌ Error fetching presets:', error);
      throw error;
    }
  }
  
  // Load preset
  async loadPreset(presetId: string, loadedBy: string): Promise<UIPreset | null> {
    try {
      const presets = await this.getPresets();
      const preset = presets.find(p => p.id === presetId);
      
      if (!preset) {
        return null;
      }
      
      // Increment usage count
      const presetRef = doc(db!, 'uiPresets', presetId);
      await updateDoc(presetRef, {
        usageCount: preset.usageCount + 1
      });
      
      // Log the preset load
      await this.logChange({
        user: loadedBy,
        userEmail: loadedBy,
        field: 'preset.loaded',
        oldValue: null,
        newValue: preset.name,
        version: '1.0.0',
        type: 'update',
        category: 'preset',
        description: `Loaded preset: ${preset.name}`
      });
      
      console.log('📁 Preset loaded:', preset.name);
      return preset;
    } catch (error) {
      console.error('❌ Error loading preset:', error);
      throw error;
    }
  }
  
  // Get change statistics
  async getChangeStatistics(days: number = 30): Promise<{
    totalChanges: number;
    changesByCategory: Record<string, number>;
    changesByUser: Record<string, number>;
    changesByDay: Record<string, number>;
  }> {
    try {
      const changes = await this.getAuditLog(1000); // Get more for statistics
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentChanges = changes.filter(change => change.timestamp >= cutoffDate);
      
      const statistics = {
        totalChanges: recentChanges.length,
        changesByCategory: {} as Record<string, number>,
        changesByUser: {} as Record<string, number>,
        changesByDay: {} as Record<string, number>
      };
      
      recentChanges.forEach(change => {
        // By category
        statistics.changesByCategory[change.category] = 
          (statistics.changesByCategory[change.category] || 0) + 1;
        
        // By user
        statistics.changesByUser[change.user] = 
          (statistics.changesByUser[change.user] || 0) + 1;
        
        // By day
        const day = change.timestamp.toISOString().split('T')[0];
        statistics.changesByDay[day] = (statistics.changesByDay[day] || 0) + 1;
      });
      
      return statistics;
    } catch (error) {
      console.error('❌ Error getting change statistics:', error);
      throw error;
    }
  }
  
  // Validate changes before publishing
  async validateChanges(tokens: Record<string, any>, overrides: any[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for required tokens
    const requiredTokens = ['color.primary', 'color.secondary', 'typography.font.family.heading'];
    requiredTokens.forEach(token => {
      if (!tokens[token]) {
        errors.push(`Missing required token: ${token}`);
      }
    });
    
    // Check color contrast ratios
    const primaryColor = tokens['color.primary'];
    const backgroundColor = tokens['color.neutral.50'];
    
    if (primaryColor && backgroundColor) {
      const contrast = this.calculateContrast(primaryColor, backgroundColor);
      if (contrast < 4.5) {
        warnings.push(`Low contrast ratio: ${contrast.toFixed(2)} (should be at least 4.5)`);
      }
    }
    
    // Check logo dimensions
    const logoWidth = tokens['brand.logo.width'];
    const logoHeight = tokens['brand.logo.height'];
    
    if (logoWidth && logoHeight) {
      const width = parseInt(logoWidth);
      const height = parseInt(logoHeight);
      
      if (width > 500 || height > 200) {
        warnings.push('Logo dimensions are quite large, consider optimizing for web');
      }
    }
    
    // Check breakpoint values
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    breakpoints.forEach(bp => {
      const value = tokens[`breakpoint.${bp}`];
      if (value && !/^\d+px$/.test(value)) {
        errors.push(`Invalid breakpoint format for ${bp}: ${value}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // Calculate color contrast ratio
  private calculateContrast(color1: string, color2: string): number {
    // Simple contrast calculation - in a real implementation, use a proper library
    // This is a simplified version
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  // Export audit data
  async exportAuditData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const changes = await this.getAuditLog(10000); // Get all changes
      const versions = await this.getVersions();
      const presets = await this.getPresets();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        changes,
        versions,
        presets,
        statistics: await this.getChangeStatistics(365)
      };
      
      if (format === 'csv') {
        return this.convertToCSV(changes);
      }
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Error exporting audit data:', error);
      throw error;
    }
  }
  
  // Convert changes to CSV
  private convertToCSV(changes: UIChange[]): string {
    const headers = ['Timestamp', 'User', 'Field', 'Old Value', 'New Value', 'Type', 'Category', 'Version'];
    const rows = changes.map(change => [
      change.timestamp.toISOString(),
      change.user,
      change.field,
      JSON.stringify(change.oldValue),
      JSON.stringify(change.newValue),
      change.type,
      change.category,
      change.version
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}

// Singleton instance
export const uiAuditSystem = UIAuditSystem.getInstance();
