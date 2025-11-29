"use client";

import { useState, useRef } from "react";
import { chatService } from "@/lib/chat/chatService";
import { XMarkIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon } from "@heroicons/react/24/outline";

interface FileUploadModalProps {
  roomId: string;
  userId: string;
  onClose: () => void;
}

export default function FileUploadModal({ roomId, userId, onClose }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await chatService.uploadFile({
        roomId,
        userId,
        userName: 'User',
        file
      });

      alert('File uploaded! RaftAI will review it shortly.');
      onClose();
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <DocumentIcon className="w-12 h-12" />;
    
    if (file.type.startsWith('image/')) return <PhotoIcon className="w-12 h-12 text-blue-400" />;
    if (file.type.startsWith('video/')) return <VideoCameraIcon className="w-12 h-12 text-purple-400" />;
    if (file.type.startsWith('audio/')) return <MicrophoneIcon className="w-12 h-12 text-green-400" />;
    return <DocumentIcon className="w-12 h-12 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Upload File</h3>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all"
            >
              <DocumentIcon className="w-16 h-16 text-white/40 mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Choose a file</p>
              <p className="text-white/60 text-sm mb-3">
                PDF, Images, Videos (max 100MB)
              </p>
              <p className="text-white/40 text-xs">
                Files will be reviewed by RaftAI before appearing
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-white/5 rounded-lg p-4 flex flex-col items-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-w-full max-h-48 rounded" />
                ) : (
                  getFileIcon()
                )}
                <p className="text-white font-medium mt-3 text-center">{file.name}</p>
                <p className="text-white/60 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-xs">
                  🤖 RaftAI will review this file for safety and relevance before it appears in the chat.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg,.mp4,.mp3,.wav,.ogg"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}

