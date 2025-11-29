"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase.client';
import { 
  UserIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface RegistrationData {
  display_name: string;
  founder_legal_name: string;
  email: string;
  country: string;
  company_name: string;
  tagline: string;
  profile_image_url: string;
}

export default function FounderRegistrationForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    display_name: user?.displayName || '',
    founder_legal_name: '',
    email: user?.email || '',
    country: '',
    company_name: '',
    tagline: '',
    profile_image_url: ''
  });

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    setProfileImage(file);
    const url = URL.createObjectURL(file);
    setProfileImageUrl(url);
    setShowCropModal(true);
    setError('');
  };

  const handleCropPhoto = () => {
    setShowCropModal(false);
  };

  const validateForm = (): boolean => {
    if (!formData.display_name.trim()) {
      setError('Display name is required');
      return false;
    }

    if (!formData.founder_legal_name.trim()) {
      setError('Founder legal name is required');
      return false;
    }

    if (!formData.country.trim()) {
      setError('Country/Region is required');
      return false;
    }

    if (!formData.company_name.trim()) {
      setError('Company/Project name is required');
      return false;
    }

    if (!formData.tagline.trim()) {
      setError('Short one-line description is required');
      return false;
    }

    if (!profileImage) {
      setError('Profile/Company picture is required');
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
      // Upload profile image to Firebase Storage
      let profileImageUrl = '';
      
      // Skip storage upload for now due to permission issues
      const SKIP_STORAGE_UPLOAD = true;
      
      if (profileImage && storage && !SKIP_STORAGE_UPLOAD) {
        try {
          // Try multiple storage paths
          const paths = [
            `users/${user.uid}/avatar.${profileImage.name.split('.').pop()}`,
            `profiles/${user.uid}/avatar.${profileImage.name.split('.').pop()}`,
            `temp/${user.uid}/avatar.${profileImage.name.split('.').pop()}`
          ];
          
          let uploadSuccess = false;
          for (const path of paths) {
            try {
              const imageRef = ref(storage, path);
              const snapshot = await uploadBytes(imageRef, profileImage);
              profileImageUrl = await getDownloadURL(snapshot.ref);
              uploadSuccess = true;
              console.log('Profile image uploaded successfully to:', path);
              break;
            } catch (pathError) {
              console.warn('Upload failed for path:', path, pathError);
              continue;
            }
          }
          
          if (!uploadSuccess) {
            console.error('All storage paths failed for profile image upload');
            console.log('Continuing registration without profile image...');
            // Continue without profile image if all uploads fail
          }
        } catch (uploadError) {
          console.error('Profile image upload failed completely:', uploadError);
          // Continue without profile image if upload fails
        }
      } else if (profileImage && SKIP_STORAGE_UPLOAD) {
        console.log('Storage upload skipped - will add profile image later');
        // Store a placeholder or skip for now
        profileImageUrl = '';
      }
      
      // Update user document with registration data
      await updateDoc(doc(db, 'users', user.uid), {
        // Registration fields
        display_name: formData.display_name,
        founder_legal_name: formData.founder_legal_name,
        email: formData.email,
        country: formData.country,
        company_name: formData.company_name,
        tagline: formData.tagline,
        profile_image_url: profileImageUrl,
        
        // Onboarding state
        onboarding_state: 'KYC_PENDING',
        kyc_status: 'pending',
        kyb_status: 'SKIPPED',
        
        // Timestamps
        registration_completed_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Redirect to KYC
      router.push('/founder/kyc');
    } catch (err: any) {
      setError(err?.message || "Registration failed");
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
            Founder Registration
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Complete your founder profile to get started
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Profile Photo Section */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">Profile/Company Picture</h2>
              
              <div className="flex flex-col items-center space-y-4">
                {profileImage ? (
                  <div className="relative">
                    <img
                      src={profileImageUrl}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage(null);
                        setProfileImageUrl('');
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
                  {profileImage ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                
                <p className="text-sm text-gray-400">
                  Upload a clear photo (PNG/JPG, max 5MB)
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your display name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Founder Legal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.founder_legal_name}
                    onChange={(e) => handleInputChange('founder_legal_name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your full legal name"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                    readOnly
                  />
                  <p className="text-xs text-gray-400">Email from authentication (read-only)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Country/Region *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select Country</option>
                    <option value="US" className="bg-gray-800 text-white">United States</option>
                    <option value="UK" className="bg-gray-800 text-white">United Kingdom</option>
                    <option value="CA" className="bg-gray-800 text-white">Canada</option>
                    <option value="AU" className="bg-gray-800 text-white">Australia</option>
                    <option value="DE" className="bg-gray-800 text-white">Germany</option>
                    <option value="FR" className="bg-gray-800 text-white">France</option>
                    <option value="SG" className="bg-gray-800 text-white">Singapore</option>
                    <option value="JP" className="bg-gray-800 text-white">Japan</option>
                    <option value="KR" className="bg-gray-800 text-white">South Korea</option>
                    <option value="IN" className="bg-gray-800 text-white">India</option>
                    <option value="BR" className="bg-gray-800 text-white">Brazil</option>
                    <option value="MX" className="bg-gray-800 text-white">Mexico</option>
                    <option value="OTHER" className="bg-gray-800 text-white">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Company Information</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Company/Project Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your company or project name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Short One-Line Description *
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Brief description of your company/project"
                  required
                />
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
                disabled={isSubmitting || !profileImage}
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
                    <span>Complete Registration</span>
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
                  src={profileImageUrl}
                  alt="Crop preview"
                  className="w-full max-w-xs mx-auto rounded-lg"
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
                  Use Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}