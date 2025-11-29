"use client";
import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, doc, setDoc } from "@/lib/firebase.client";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface ProfilePictureUploaderProps {
  uid: string;
  currentImageUrl?: string;
  onUploadComplete?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ProfilePictureUploader({ 
  uid, 
  currentImageUrl, 
  onUploadComplete,
  size = 'md',
  showLabel = true 
}: ProfilePictureUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    setSuccess(false);

    try {
      const storage = getStorage();
      const fileName = `profile-${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `avatars/${uid}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user document with new photo URL
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      await setDoc(doc(firestore, 'users', uid), { 
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSuccess(true);
      onUploadComplete?.(downloadURL);
      
      // Reset success state after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {showLabel && (
        <label className="text-sm font-medium text-white">Profile Picture</label>
      )}
      
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-200`}>
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <NeonCyanIcon type="user" size={size === 'sm' ? 24 : size === 'md' ? 32 : 40} className="text-white/60" />
            </div>
          )}
        </div>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <NeonCyanIcon type="arrow-up" size={size === 'sm' ? 24 : size === 'md' ? 32 : 40} className="text-white" />
        </div>
        
        {/* Success indicator */}
        {success && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="check" size={16} className="text-white" />
          </div>
        )}
        
        {/* Uploading indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* File input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id={`profile-upload-${uid}`}
      />
      
      <label
        htmlFor={`profile-upload-${uid}`}
        className={`px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer text-sm font-medium ${
          uploading 
            ? 'text-white/60 cursor-not-allowed' 
            : 'text-white hover:text-white/90'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </label>
      
      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs text-center max-w-48">{error}</p>
      )}
      
      {/* Success message */}
      {success && (
        <p className="text-green-400 text-xs text-center">Upload successful!</p>
      )}
    </div>
  );
}
