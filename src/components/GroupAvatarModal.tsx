"use client";

import { useState } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface Props {
  roomId: string;
  currentAvatar?: string | null;
  userId: string;
  onClose: () => void;
}

export default function GroupAvatarModal({ roomId, currentAvatar, userId, onClose }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large! Max size is 5MB');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      await enhancedChatService.updateGroupAvatar(roomId, selectedFile, userId);
      alert('✅ Group photo updated!');
      onClose();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <PhotoIcon className="w-6 h-6" />
            Change Group Photo
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Group avatar preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white/20">
                <PhotoIcon className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* File Input */}
          <label className="block">
            <div className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center cursor-pointer transition-colors">
              Choose Photo
            </div>
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

