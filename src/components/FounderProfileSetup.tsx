"use client";

import React, { useState, useRef } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase.client';
import { 
  UserIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import OnboardingHeader from './OnboardingHeader';

interface RegistrationData {
  display_name: string;
  founder_legal_name: string;
  email: string;
  country: string;
  company_name: string;
  tagline: string;
  profile_image_url: string;
}

export default function FounderProfileSetup() {
  const { user, profile, loadProfile } = useFounderAuth();
  const router = useRouter();
  
  const legacyProfile = (profile as Record<string, any> | null) || null;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    display_name: profile?.displayName || legacyProfile?.display_name || user?.displayName || '',
    founder_legal_name: legacyProfile?.founder_legal_name || '',
    email: user?.email || '',
    country: legacyProfile?.country || '',
    company_name: legacyProfile?.company_name || '',
    tagline: legacyProfile?.tagline || '',
    profile_image_url: profile?.profilePhotoUrl || legacyProfile?.profile_image_url || ''
  });

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Profile photo must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setProfileImageUrl(url);
      setError('');
    }
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

    // Profile image is optional - user can upload later
    // if (!profileImage) {
    //   setError('Profile/Company picture is required');
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started:', { formData, user: !!user });
    
    if (!validateForm() || !user) {
      console.log('Form validation failed or no user');
      return;
    }
    
    console.log('Form validation passed, proceeding with submission...');

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Upload profile photo if provided
      let finalProfileImageUrl = formData.profile_image_url;
      
      // Skip storage upload for now due to permission issues
      const SKIP_STORAGE_UPLOAD = true;
      
      if (!db) {
        throw new Error('Database not initialized');
      }
      
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
              finalProfileImageUrl = await getDownloadURL(snapshot.ref);
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
        finalProfileImageUrl = '';
      }

      // Update user document with registration data
      console.log('Updating user document with registration data...');
      await updateDoc(doc(db!, 'users', user.uid), {
        // Registration fields
        display_name: formData.display_name,
        founder_legal_name: formData.founder_legal_name,
        email: formData.email,
        country: formData.country,
        company_name: formData.company_name,
        tagline: formData.tagline,
        profile_image_url: finalProfileImageUrl,
        
        // Onboarding state - Don't set kyc_status to pending, let user complete KYC first
        onboarding_state: 'KYC_PENDING',
        kyc_status: 'not_submitted',
        kyb_status: 'SKIPPED',
        
        // Timestamps
        registration_completed_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      console.log('User document updated successfully!');

      setSuccess('Profile completed successfully! Redirecting to KYC...');
      
      // Refresh profile data
      await loadProfile();
      
      // Force redirect to KYC after successful registration
      setTimeout(() => {
        console.log('Redirecting to KYC after successful registration...');
        router.push('/founder/kyc');
      }, 2000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <OnboardingHeader />
      <div className="pt-20">
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

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-medium">Role Selected</span>
            </div>
            <div className="w-16 h-1 bg-green-500"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <span className="text-white font-medium">Profile Setup</span>
            </div>
            <div className="w-16 h-1 bg-gray-600"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-bold">3</span>
              </div>
              <span className="text-gray-400">KYC Verification</span>
            </div>
          </div>
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
                onChange={handlePhotoUpload}
                className="hidden"
              />
                
                <p className="text-sm text-gray-400">
                  Upload a clear photo (PNG/JPG, max 5MB) - Optional
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

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
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
      </div>
    </div>
  );
}
