"use client";

import { useState, useRef } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Props {
  onUpload: (file: File, type: 'image' | 'video' | 'document') => void;
  onClose: () => void;
  roomId?: string;
  senderId?: string;
  senderName?: string;
}

export default function FileUploadModal({ onUpload, onClose, roomId, senderId, senderName }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Maximum 50MB allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Determine file type
      let fileType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);
      
      // Add required fields if available
      if (roomId) formData.append('roomId', roomId);
      if (senderId) formData.append('senderId', senderId);
      if (senderName) formData.append('senderName', senderName);

      const response = await fetch('/api/chat/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Simulate completion
      setTimeout(() => {
        onUpload(file, fileType);
        setUploading(false);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9998] p-4">
      <div className="neo-glass-card rounded-2xl p-6 max-w-md w-full relative z-[9999]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">📎 Upload File</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="close" size={20} className="text-white" />
          </button>
        </div>

        {uploading ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
              <NeonCyanIcon type="upload" size={32} className="text-white animate-bounce" />
            </div>
            <p className="text-white mb-4">Uploading file...</p>
            <div className="w-full bg-black/40 rounded-full h-2 mb-2 border border-cyan-400/20">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-white/60">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-500/10' 
                : 'border-cyan-400/30 hover:border-cyan-400/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-cyan-400/20">
                <NeonCyanIcon type="document" size={32} className="text-cyan-400" />
              </div>
              
              <div>
                <p className="text-white font-medium mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-white/60">
                  Supports images, videos, and documents (max 50MB)
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/20"
              >
                Choose File
              </button>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInput}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              />
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            className="p-3 bg-white/10 hover:bg-cyan-500/20 rounded-lg transition-colors text-center border border-transparent hover:border-cyan-400/30"
            disabled={uploading}
          >
            <NeonCyanIcon type="photo" size={24} className="text-white mx-auto mb-2" />
            <p className="text-xs text-white">Photos</p>
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current.click();
              }
            }}
            className="p-3 bg-white/10 hover:bg-cyan-500/20 rounded-lg transition-colors text-center border border-transparent hover:border-cyan-400/30"
            disabled={uploading}
          >
            <NeonCyanIcon type="video" size={24} className="text-white mx-auto mb-2" />
            <p className="text-xs text-white">Videos</p>
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
                fileInputRef.current.click();
              }
            }}
            className="p-3 bg-white/10 hover:bg-cyan-500/20 rounded-lg transition-colors text-center border border-transparent hover:border-cyan-400/30"
            disabled={uploading}
          >
            <NeonCyanIcon type="document" size={24} className="text-white mx-auto mb-2" />
            <p className="text-xs text-white">Documents</p>
          </button>
        </div>
      </div>
    </div>
  );
}

