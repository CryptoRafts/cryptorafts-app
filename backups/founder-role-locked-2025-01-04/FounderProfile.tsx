"use client";
import React, { useState, useRef } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { db, doc, setDoc, getStorage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase.client';
import { getAdminAuth } from '@/server/firebaseAdmin';

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
  profilePhoto?: string;
}

interface ProfileStepProps {
  data: ProfileData;
  onDataUpdate: (data: ProfileData) => void;
  onNext: () => void;
  isProcessing: boolean;
}

function ProfileFormStep({ data, onDataUpdate, onNext, isProcessing }: ProfileStepProps) {
  const [localData, setLocalData] = useState<ProfileData>(data);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...localData };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'socials') {
        newData.socials = { ...newData.socials, [child]: value };
      }
    } else {
      (newData as any)[field] = value;
    }
    
    setLocalData(newData);
    onDataUpdate(newData);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file || file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Please select an image file under 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Firebase Storage
      const storage = getStorage();
      const fileName = `profile-photos/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newData = { ...localData, profilePhoto: downloadURL };
      setLocalData(newData);
      onDataUpdate(newData);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const canProceed = localData.displayName && localData.bio && localData.bio.length <= 280;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Display Name *</label>
            <input
              type="text"
              value={localData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Enter your display name"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Bio *</label>
            <textarea
              value={localData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              maxLength={280}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Tell us about yourself (max 280 characters)"
            />
            <div className="text-right text-sm text-white/50 mt-1">
              {localData.bio.length}/280
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Website</label>
            <input
              type="url"
              value={localData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Profile Photo</label>
            <div className="space-y-4">
              {localData.profilePhoto && (
                <div className="relative">
                  <img
                    src={localData.profilePhoto}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-lg object-cover border border-white/20"
                  />
                  <button
                    onClick={() => {
                      const newData = { ...localData, profilePhoto: undefined };
                      setLocalData(newData);
                      onDataUpdate(newData);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handlePhotoUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <label
                  htmlFor="photo-upload"
                  className={`cursor-pointer block ${uploadingPhoto ? 'opacity-50' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-white/60 mb-4">
                    {uploadingPhoto ? 'Uploading...' : 'Click to upload profile photo'}
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-blue-400 text-xl">📷</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Social Links</label>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={localData.socials.twitter}
                  onChange={(e) => handleInputChange('socials.twitter', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Twitter handle (@username)"
                />
              </div>
              <div>
                <input
                  type="url"
                  value={localData.socials.linkedin}
                  onChange={(e) => handleInputChange('socials.linkedin', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="LinkedIn profile URL"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={localData.socials.telegram}
                  onChange={(e) => handleInputChange('socials.telegram', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Telegram handle (@username)"
                />
              </div>
              <div>
                <input
                  type="url"
                  value={localData.socials.github}
                  onChange={(e) => handleInputChange('socials.github', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="GitHub profile URL"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed || uploadingPhoto || isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && !uploadingPhoto && !isProcessing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

interface ProfileReviewProps {
  data: ProfileData;
  onSave: () => void;
  onEdit: () => void;
  isProcessing: boolean;
}

function ProfileReviewStep({ data, onSave, onEdit, isProcessing }: ProfileReviewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Review Your Profile</h3>
        <p className="text-white/70">Please review your information before completing your profile</p>
        
        <div className="bg-white/5 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-4">
            {data.profilePhoto && (
              <img
                src={data.profilePhoto}
                alt="Profile"
                className="w-16 h-16 rounded-lg object-cover border border-white/20"
              />
            )}
            <div>
              <h4 className="text-white font-medium text-lg">{data.displayName}</h4>
              <p className="text-white/70 text-sm">{data.bio}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {data.website && (
              <div>
                <span className="text-white/50">Website:</span>
                <span className="text-white ml-2">{data.website}</span>
              </div>
            )}
            {data.socials.twitter && (
              <div>
                <span className="text-white/50">Twitter:</span>
                <span className="text-white ml-2">{data.socials.twitter}</span>
              </div>
            )}
            {data.socials.linkedin && (
              <div>
                <span className="text-white/50">LinkedIn:</span>
                <span className="text-white ml-2">{data.socials.linkedin}</span>
              </div>
            )}
            {data.socials.telegram && (
              <div>
                <span className="text-white/50">Telegram:</span>
                <span className="text-white ml-2">{data.socials.telegram}</span>
              </div>
            )}
            {data.socials.github && (
              <div>
                <span className="text-white/50">GitHub:</span>
                <span className="text-white ml-2">{data.socials.github}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onEdit}
          disabled={isProcessing}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all disabled:opacity-50"
        >
          Edit Profile
        </button>
        <button
          onClick={onSave}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isProcessing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isProcessing ? 'Saving...' : 'Complete Profile'}
        </button>
      </div>
    </div>
  );
}

export default function FounderProfile() {
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    website: '',
    socials: {
      twitter: '',
      linkedin: '',
      telegram: '',
      github: ''
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataUpdate = (data: ProfileData) => {
    setProfileData(data);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // Update user document with profile completion
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        profileCompleted: true,
        onboarding: {
          step: 'kyc',
          completed: {
            profile: Date.now()
          }
        },
        updatedAt: Date.now()
      }, { merge: true });

      // Update custom claims
      const response = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileCompleted: true,
          onboardingStep: 'kyc'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update claims');
      }

      // Redirect to KYC
      window.location.href = '/founder/kyc';
    } catch (error) {
      console.error('Profile save failed:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access profile setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Complete Your Profile</h1>
          <p className="text-white/70">Set up your founder profile to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Step {currentStep + 1} of 2</span>
            <span>{Math.round(((currentStep + 1) / 2) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white/5 rounded-xl p-8">
          {currentStep === 0 ? (
            <ProfileFormStep
              data={profileData}
              onDataUpdate={handleDataUpdate}
              onNext={() => setCurrentStep(1)}
              isProcessing={isProcessing}
            />
          ) : (
            <ProfileReviewStep
              data={profileData}
              onSave={handleSave}
              onEdit={() => setCurrentStep(0)}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
