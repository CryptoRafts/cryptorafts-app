// Firebase File Upload Service
// Handles file uploads to Firebase Storage with proper error handling

import { storage } from '@/lib/firebase.client';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

export class FirebaseFileUploadService {
  // Upload file to Firebase Storage
  static async uploadFile(
    file: File,
    roomId: string,
    senderId: string,
    senderName: string
  ): Promise<UploadResult> {
    try {
      console.log(`📤 [UPLOAD] Starting upload: ${file.name} (${file.size} bytes)`);

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File too large. Maximum size is 50MB.'
        };
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'File type not supported.'
        };
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'bin';
      const fileName = `${roomId}/files/${senderId}_${timestamp}.${fileExtension}`;

      // Create storage reference
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const storageRef = ref(storage, fileName);

      // Upload file
      console.log(`📤 [UPLOAD] Uploading to: ${fileName}`);
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          roomId: roomId,
          senderId: senderId,
          senderName: senderName,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
          fileType: file.type
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log(`✅ [UPLOAD] File uploaded successfully: ${downloadURL}`);

      return {
        success: true,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

    } catch (error) {
      console.error('❌ [UPLOAD] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Delete file from Firebase Storage
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log(`🗑️ [UPLOAD] File deleted: ${fileUrl}`);
      return true;
    } catch (error) {
      console.error('❌ [UPLOAD] Delete error:', error);
      return false;
    }
  }

  // Get file info from URL
  static getFileInfoFromUrl(fileUrl: string): {
    fileName: string;
    fileType: string;
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
  } {
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'unknown';
    
    // Try to determine file type from URL or filename
    let fileType = 'application/octet-stream';
    
    if (fileName.includes('.')) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      const typeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };
      
      if (extension && typeMap[extension]) {
        fileType = typeMap[extension];
      }
    }

    return {
      fileName,
      fileType,
      isImage: fileType.startsWith('image/'),
      isVideo: fileType.startsWith('video/'),
      isAudio: fileType.startsWith('audio/'),
      isDocument: fileType.includes('application/') || fileType.includes('text/')
    };
  }
}

export default FirebaseFileUploadService;
