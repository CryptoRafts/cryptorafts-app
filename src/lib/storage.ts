import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './firebase.client';
import { logger } from './logger';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  customMetadata?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: FileMetadata;
}

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  // Validate file before upload
  static validateFile(file: File, allowedTypes?: string[]): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type if specified
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    return { valid: true };
  }

  // Generate storage path based on type and context
  static generatePath(
    type: 'profile' | 'kyc' | 'kyb' | 'project' | 'chat' | 'temp',
    userId: string,
    filename: string,
    context?: { projectId?: string; roomId?: string; orgId?: string }
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (type) {
      case 'profile':
        return `profile-photos/${userId}/${timestamp}_${sanitizedFilename}`;
      case 'kyc':
        return `kyc-documents/${userId}/${timestamp}_${sanitizedFilename}`;
      case 'kyb':
        if (!context?.orgId) throw new Error('Organization ID required for KYB uploads');
        return `kyb-documents/${context.orgId}/${timestamp}_${sanitizedFilename}`;
      case 'project':
        if (!context?.projectId) throw new Error('Project ID required for project uploads');
        return `projects/${context.projectId}/${timestamp}_${sanitizedFilename}`;
      case 'chat':
        if (!context?.roomId) throw new Error('Room ID required for chat uploads');
        return `chat-attachments/${context.roomId}/${timestamp}_${sanitizedFilename}`;
      case 'temp':
        return `temp/${userId}/${timestamp}_${sanitizedFilename}`;
      default:
        throw new Error('Invalid upload type');
    }
  }

  // Upload file with progress tracking
  static async uploadFile(
    file: File,
    path: string,
    metadata?: FileMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, path);
      
      // Set metadata
      const uploadMetadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          ...metadata?.customMetadata
        }
      };

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            logger.error('Upload failed', { error: error.message, path });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const result: UploadResult = {
                url: downloadURL,
                path,
                metadata: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                  customMetadata: uploadMetadata.customMetadata
                }
              };

              logger.info('File uploaded successfully', { path, size: file.size });
              resolve(result);
            } catch (error) {
              logger.error('Failed to get download URL', { error: error.message, path });
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      logger.error('Upload error', { error: error.message, path });
      throw error;
    }
  }

  // Upload profile photo
  static async uploadProfilePhoto(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const validation = this.validateFile(file, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = this.generatePath('profile', userId, file.name);
    return this.uploadFile(file, path, undefined, onProgress);
  }

  // Upload KYC document
  static async uploadKYCDocument(
    file: File,
    userId: string,
    documentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const validation = this.validateFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = this.generatePath('kyc', userId, file.name);
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      customMetadata: { documentType }
    };

    return this.uploadFile(file, path, metadata, onProgress);
  }

  // Upload KYB document
  static async uploadKYBDocument(
    file: File,
    orgId: string,
    documentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const validation = this.validateFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = this.generatePath('kyb', orgId, file.name, { orgId });
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      customMetadata: { documentType }
    };

    return this.uploadFile(file, path, metadata, onProgress);
  }

  // Upload project file
  static async uploadProjectFile(
    file: File,
    projectId: string,
    userId: string,
    fileType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];
    const validation = this.validateFile(file, allowedTypes);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = this.generatePath('project', userId, file.name, { projectId });
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      customMetadata: { fileType, projectId }
    };

    return this.uploadFile(file, path, metadata, onProgress);
  }

  // Upload chat attachment
  static async uploadChatAttachment(
    file: File,
    roomId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];
    const validation = this.validateFile(file, allowedTypes);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = this.generatePath('chat', userId, file.name, { roomId });
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      customMetadata: { roomId }
    };

    return this.uploadFile(file, path, metadata, onProgress);
  }

  // Get signed URL for file access
  static async getSignedURL(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, path);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      logger.error('Failed to get signed URL', { error: error.message, path });
      throw error;
    }
  }

  // Delete file
  static async deleteFile(path: string): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      logger.info('File deleted', { path });
    } catch (error) {
      logger.error('Failed to delete file', { error: error.message, path });
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(path: string): Promise<FileMetadata> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);
      
      return {
        name: metadata.name,
        size: metadata.size,
        type: metadata.contentType || 'unknown',
        lastModified: metadata.timeCreated ? metadata.timeCreated.getTime() : Date.now(),
        customMetadata: metadata.customMetadata
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { error: error.message, path });
      throw error;
    }
  }

  // Update file metadata
  static async updateFileMetadata(path: string, customMetadata: Record<string, string>): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, path);
      await updateMetadata(storageRef, { customMetadata });
      
      logger.info('File metadata updated', { path });
    } catch (error) {
      logger.error('Failed to update file metadata', { error: error.message, path });
      throw error;
    }
  }

  // Clean up temporary files (call this periodically)
  static async cleanupTempFiles(userId: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // This would typically be implemented with a Cloud Function
      // For now, we'll just log the cleanup request
      logger.info('Temp file cleanup requested', { userId, maxAge });
    } catch (error) {
      logger.error('Failed to cleanup temp files', { error: error.message, userId });
      throw error;
    }
  }
}
