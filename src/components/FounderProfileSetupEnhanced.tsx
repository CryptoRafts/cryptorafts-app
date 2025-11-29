"use client";

import React, { useState, useRef } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { authClaimsManager } from '@/lib/auth-claims';
import { 
  UserIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ProfileData {
  displayName: string;
  bio: string;
  website: string;
  socials: {
    twitter: string;
    linkedin: string;
    telegram: string;
    github: string;
  };
  profilePhoto: File | null;
  profilePhotoUrl: string;
}

export default function FounderProfileSetupEnhanced() {
  const { user, completeProfile } = useFounderAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    bio: '',
    website: '',
    socials: {
      twitter: '',
      linkedin: '',
      telegram: '',
      github: ''
    },
    profilePhoto: null,
    profilePhotoUrl: ''
  });

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSocialChange = (platform: keyof ProfileData['socials'], value: string) => {
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value }
    }));
    setError('');
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Profile photo must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setProfilePhoto(file);
    const url = URL.createObjectURL(file);
    setProfilePhotoUrl(url);
    setShowCropModal(true);
    setError('');
  };

  const handleCropPhoto = () => {
    if (!canvasRef.current || !profilePhoto) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], profilePhoto.name, {
          type: 'image/png',
          lastModified: Date.now()
        });
        
        setFormData(prev => ({ ...prev, profilePhoto: croppedFile }));
        setShowCropModal(false);
      }
    }, 'image/png', 0.9);
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }

    if (!formData.bio.trim()) {
      setError('Bio is required');
      return false;
    }

    if (formData.bio.length > 280) {
      setError('Bio must be 280 characters or less');
      return false;
    }

    if (!formData.profilePhoto) {
      setError('Profile photo is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Upload profile photo to Firebase Storage
      let photoUrl = '';
      if (formData.profilePhoto) {
        // In production, upload to Firebase Storage
        // For now, we'll store the file reference
        photoUrl = `profile-photos/${user.uid}/${formData.profilePhoto.name}`;
      }

      // Complete profile with all data
      await completeProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        website: formData.website,
        socials: formData.socials,
        profilePhotoUrl: photoUrl,
        profilePhotoFile: formData.profilePhoto ? {
          name: formData.profilePhoto.name,
          size: formData.profilePhoto.size,
          type: formData.profilePhoto.type
        } : null
      });

      // Update custom claims
      await authClaimsManager.markProfileCompleted(user.uid);

      // Redirect to KYC
      router.push('/founder/kyc');
    } catch (err: any) {
      setError(err?.message || "Profile setup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <UserIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Set up your founder profile to get started with the platform
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Profile Photo Section */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">Profile Photo</h2>
              
              <div className="flex flex-col items-center space-y-4">
                {formData.profilePhoto ? (
                  <div className="relative">
                    <img
                      src={profilePhotoUrl}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhoto(null);
                        setProfilePhotoUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700/50 border-2 border-dashed border-gray-500 flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  {formData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                
                <p className="text-sm text-gray-400">
                  Upload a clear photo of yourself (PNG, JPG, max 5MB)
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              
              <div className="form-group">
                <label className="form-label">Display Name *</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="form-input"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Bio * <span className="text-muted">({formData.bio.length}/280 characters)</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  maxLength={280}
                  className="form-input"
                  placeholder="Tell us about yourself, your background, and what you're building..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Social Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">X (Twitter)</label>
                  <input
                    type="text"
                    value={formData.socials.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    className="form-input"
                    placeholder="@yourusername"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.socials.linkedin}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    className="form-input"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telegram</label>
                  <input
                    type="text"
                    value={formData.socials.telegram}
                    onChange={(e) => handleSocialChange('telegram', e.target.value)}
                    className="form-input"
                    placeholder="@yourusername"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">GitHub</label>
                  <input
                    type="url"
                    value={formData.socials.github}
                    onChange={(e) => handleSocialChange('github', e.target.value)}
                    className="form-input"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !formData.profilePhoto}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Profile...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Complete Profile</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Crop Your Photo</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={profilePhotoUrl}
                  alt="Crop preview"
                  className="w-full max-w-xs mx-auto rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropPhoto}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Crop & Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
