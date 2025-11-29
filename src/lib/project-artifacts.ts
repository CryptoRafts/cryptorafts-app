"use client";

import { db } from './firebase.client';
import { doc, updateDoc, serverTimestamp, collection, addDoc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface ProjectArtifact {
  id: string;
  projectId: string;
  name: string;
  type: 'pitch_deck' | 'whitepaper' | 'token_model' | 'audit' | 'legal' | 'other';
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  version: number;
  isLatest: boolean;
  ndaRequired: boolean;
  ndaAcceptedBy: string[]; // Array of user IDs who accepted NDA
  uploadedBy: string;
  uploadedAt: any;
  lastViewedBy?: {
    uid: string;
    viewedAt: any;
  }[];
  downloadCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  changeLog: string;
  uploadedBy: string;
  uploadedAt: any;
}

export interface NDAAcceptance {
  id: string;
  artifactId: string;
  userId: string;
  acceptedAt: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ProjectArtifactManager {
  private static instance: ProjectArtifactManager;
  
  public static getInstance(): ProjectArtifactManager {
    if (!ProjectArtifactManager.instance) {
      ProjectArtifactManager.instance = new ProjectArtifactManager();
    }
    return ProjectArtifactManager.instance;
  }

  /**
   * Upload artifact to project
   */
  async uploadArtifact(
    projectId: string,
    artifactData: {
      name: string;
      type: ProjectArtifact['type'];
      description?: string;
      file: File;
      ndaRequired?: boolean;
    },
    uploadedBy: string
  ): Promise<string> {
    try {
      // Generate checksum for file integrity
      const checksum = await this.generateChecksum(artifactData.file);
      
      // Upload file to storage (simulate)
      const fileUrl = await this.uploadToStorage(artifactData.file, projectId);
      
      // Get next version number
      const version = await this.getNextVersionNumber(projectId, artifactData.name);
      
      // Create artifact document
      const artifactRef = doc(collection(db!, 'projectArtifacts'));
      const artifact: ProjectArtifact = {
        id: artifactRef.id,
        projectId,
        name: artifactData.name,
        type: artifactData.type,
        description: artifactData.description,
        fileUrl,
        fileName: artifactData.file.name,
        fileSize: artifactData.file.size,
        mimeType: artifactData.file.type,
        checksum,
        version,
        isLatest: true,
        ndaRequired: artifactData.ndaRequired || false,
        ndaAcceptedBy: [],
        uploadedBy,
        uploadedAt: serverTimestamp(),
        lastViewedBy: [],
        downloadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db!, 'projectArtifacts'), artifact);
      
      // Create version record
      await this.createVersionRecord(artifactRef.id, {
        version,
        fileUrl,
        fileName: artifactData.file.name,
        fileSize: artifactData.file.size,
        checksum,
        changeLog: 'Initial upload',
        uploadedBy,
        uploadedAt: serverTimestamp()
      });

      // Mark previous versions as not latest
      await this.markPreviousVersionsAsNotLatest(projectId, artifactData.name, version);

      return artifactRef.id;

    } catch (error) {
      console.error('Error uploading artifact:', error);
      throw error;
    }
  }

  /**
   * Get artifacts for project
   */
  async getProjectArtifacts(projectId: string): Promise<ProjectArtifact[]> {
    try {
      const artifactsQuery = query(
        collection(db!, 'projectArtifacts'),
        where('projectId', '==', projectId),
        where('isLatest', '==', true),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(artifactsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectArtifact));

    } catch (error) {
      console.error('Error getting project artifacts:', error);
      throw error;
    }
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(artifactId: string): Promise<ProjectArtifact | null> {
    try {
      const artifactDoc = await getDoc(doc(db!, 'projectArtifacts', artifactId));
      if (!artifactDoc.exists()) {
        return null;
      }

      return { id: artifactDoc.id, ...artifactDoc.data() } as ProjectArtifact;

    } catch (error) {
      console.error('Error getting artifact:', error);
      throw error;
    }
  }

  /**
   * Check if user can access artifact
   */
  async canAccessArtifact(artifactId: string, userId: string): Promise<boolean> {
    try {
      const artifact = await this.getArtifact(artifactId);
      if (!artifact) return false;

      // If NDA is required, check if user has accepted it
      if (artifact.ndaRequired && !artifact.ndaAcceptedBy.includes(userId)) {
        return false;
      }

      // Check if user has access to the project
      // This would typically check room membership or project permissions
      return true; // Simplified for now

    } catch (error) {
      console.error('Error checking artifact access:', error);
      return false;
    }
  }

  /**
   * Accept NDA for artifact
   */
  async acceptNDA(artifactId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const artifact = await this.getArtifact(artifactId);
      if (!artifact) {
        throw new Error('Artifact not found');
      }

      if (!artifact.ndaRequired) {
        throw new Error('NDA not required for this artifact');
      }

      if (artifact.ndaAcceptedBy.includes(userId)) {
        throw new Error('NDA already accepted');
      }

      // Update artifact with NDA acceptance
      await updateDoc(doc(db!, 'projectArtifacts', artifactId), {
        ndaAcceptedBy: [...artifact.ndaAcceptedBy, userId],
        updatedAt: serverTimestamp()
      });

      // Create NDA acceptance record
      const ndaRef = doc(collection(db!, 'ndaAcceptances'));
      const ndaAcceptance: NDAAcceptance = {
        id: ndaRef.id,
        artifactId,
        userId,
        acceptedAt: serverTimestamp(),
        ipAddress,
        userAgent
      };

      await addDoc(collection(db!, 'ndaAcceptances'), ndaAcceptance);

    } catch (error) {
      console.error('Error accepting NDA:', error);
      throw error;
    }
  }

  /**
   * Record artifact view
   */
  async recordArtifactView(artifactId: string, userId: string): Promise<void> {
    try {
      const artifact = await this.getArtifact(artifactId);
      if (!artifact) return;

      // Update last viewed by
      const lastViewedBy = artifact.lastViewedBy || [];
      const existingView = lastViewedBy.find(view => view.uid === userId);
      
      if (existingView) {
        existingView.viewedAt = serverTimestamp();
      } else {
        lastViewedBy.push({
          uid: userId,
          viewedAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db!, 'projectArtifacts', artifactId), {
        lastViewedBy,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error recording artifact view:', error);
      throw error;
    }
  }

  /**
   * Record artifact download
   */
  async recordArtifactDownload(artifactId: string, userId: string): Promise<void> {
    try {
      const artifact = await this.getArtifact(artifactId);
      if (!artifact) return;

      await updateDoc(doc(db!, 'projectArtifacts', artifactId), {
        downloadCount: artifact.downloadCount + 1,
        updatedAt: serverTimestamp()
      });

      // Record the download event
      await this.recordArtifactView(artifactId, userId);

    } catch (error) {
      console.error('Error recording artifact download:', error);
      throw error;
    }
  }

  /**
   * Get artifact versions
   */
  async getArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
    try {
      const versionsQuery = query(
        collection(db!, 'artifactVersions'),
        where('artifactId', '==', artifactId),
        orderBy('version', 'desc')
      );

      const snapshot = await getDocs(versionsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtifactVersion));

    } catch (error) {
      console.error('Error getting artifact versions:', error);
      throw error;
    }
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(artifactId: string, deletedBy: string): Promise<void> {
    try {
      // Mark as deleted instead of actually deleting
      await updateDoc(doc(db!, 'projectArtifacts', artifactId), {
        deleted: true,
        deletedBy,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error deleting artifact:', error);
      throw error;
    }
  }

  /**
   * Generate file checksum
   */
  private async generateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Upload file to storage (simulate)
   */
  private async uploadToStorage(file: File, projectId: string): Promise<string> {
    // In production, upload to Firebase Storage or similar
    // For now, return a simulated URL
    return `storage/projects/${projectId}/artifacts/${Date.now()}_${file.name}`;
  }

  /**
   * Get next version number for artifact
   */
  private async getNextVersionNumber(projectId: string, artifactName: string): Promise<number> {
    try {
      const versionsQuery = query(
        collection(db!, 'projectArtifacts'),
        where('projectId', '==', projectId),
        where('name', '==', artifactName),
        orderBy('version', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(versionsQuery);
      if (snapshot.empty) {
        return 1;
      }

      const latestVersion = snapshot.docs[0].data() as ProjectArtifact;
      return latestVersion.version + 1;

    } catch (error) {
      console.error('Error getting next version number:', error);
      return 1;
    }
  }

  /**
   * Create version record
   */
  private async createVersionRecord(artifactId: string, versionData: Partial<ArtifactVersion>): Promise<void> {
    try {
      const versionRef = doc(collection(db!, 'artifactVersions'));
      const version: ArtifactVersion = {
        id: versionRef.id,
        artifactId,
        version: versionData.version || 1,
        fileUrl: versionData.fileUrl || '',
        fileName: versionData.fileName || '',
        fileSize: versionData.fileSize || 0,
        checksum: versionData.checksum || '',
        changeLog: versionData.changeLog || '',
        uploadedBy: versionData.uploadedBy || '',
        uploadedAt: versionData.uploadedAt || serverTimestamp()
      };

      await addDoc(collection(db!, 'artifactVersions'), version);

    } catch (error) {
      console.error('Error creating version record:', error);
      throw error;
    }
  }

  /**
   * Mark previous versions as not latest
   */
  private async markPreviousVersionsAsNotLatest(projectId: string, artifactName: string, currentVersion: number): Promise<void> {
    try {
      const previousVersionsQuery = query(
        collection(db!, 'projectArtifacts'),
        where('projectId', '==', projectId),
        where('name', '==', artifactName),
        where('version', '<', currentVersion)
      );

      const snapshot = await getDocs(previousVersionsQuery);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isLatest: false,
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);

    } catch (error) {
      console.error('Error marking previous versions as not latest:', error);
      throw error;
    }
  }
}

export const projectArtifactManager = ProjectArtifactManager.getInstance();
