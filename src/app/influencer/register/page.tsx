"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, ensureStorage, waitForFirebase } from '@/lib/firebase-utils';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

export default function InfluencerRegister() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    niche: '',
    followerCount: '',
    country: '',
    city: '',
    address: '',
    socialMedia: {
      twitter: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      linkedin: '',
      discord: '',
      telegram: ''
    }
  });

  useEffect(() => {
    if (isLoading || !user) return;

    const checkStatus = async () => {
      try {
        const isReady = await waitForFirebase(10000);
        if (!isReady) {
          setLoading(false);
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }
        
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profileCompleted) {
            router.push('/influencer/kyc');
            return;
          }
          // Pre-fill form with existing data
          if (userData) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              username: userData.username || '',
              email: userData.email || user.email || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              niche: userData.niche || '',
              followerCount: userData.followerCount?.toString() || '',
              country: userData.country || '',
              city: userData.city || '',
              address: userData.address || '',
              socialMedia: {
                twitter: userData.socialMedia?.twitter || userData.twitter || '',
                instagram: userData.socialMedia?.instagram || '',
                youtube: userData.socialMedia?.youtube || '',
                tiktok: userData.socialMedia?.tiktok || '',
                linkedin: userData.socialMedia?.linkedin || userData.linkedin || '',
                discord: userData.socialMedia?.discord || '',
                telegram: userData.socialMedia?.telegram || userData.telegram || ''
              }
            }));
            if (userData.photoURL || userData.profilePhotoURL) {
              setProfilePhotoURL(userData.photoURL || userData.profilePhotoURL);
            }
          }
        } else {
          // Pre-fill email from auth
          setFormData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, isLoading, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setUploadingPhoto(false);
        return;
      }

      const storage = ensureStorage();
      if (!storage) {
        setError('Storage service not available');
        setUploadingPhoto(false);
        return;
      }
      
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const photoRef = ref(storage, `influencer-profiles/${user.uid}/profile-${Date.now()}-${safeName}`);
      
      const snapshot = await uploadBytes(photoRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setProfilePhoto(file);
      setProfilePhotoURL(downloadURL);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.bio.trim()) {
      setError('Bio is required');
      return;
    }
    if (formData.bio.length > 280) {
      setError('Bio must be 280 characters or less');
      return;
    }
    if (!formData.country.trim() || !formData.city.trim()) {
      setError('Country and city are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setSubmitting(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database connection not available. Please refresh and try again.');
        setSubmitting(false);
        return;
      }
      
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      await setDoc(doc(dbInstance, 'users', user.uid), {
        role: 'influencer',
        profileCompleted: true,
        // Name fields
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim() || formData.email.split('@')[0],
        name: displayName,
        displayName: displayName,
        fullName: displayName,
        // Contact
        email: formData.email.trim() || user.email,
        phone: formData.phone.trim() || '',
        // Profile photo
        photoURL: profilePhotoURL || '',
        profilePhotoURL: profilePhotoURL || '',
        // Bio and info
        bio: formData.bio.trim(),
        niche: formData.niche.trim() || '',
        followerCount: formData.followerCount ? parseInt(formData.followerCount) : 0,
        // Location
        country: formData.country.trim(),
        city: formData.city.trim(),
        address: formData.address.trim() || '',
        // Social media
        socialMedia: formData.socialMedia,
        twitter: formData.socialMedia.twitter || '',
        instagram: formData.socialMedia.instagram || '',
        youtube: formData.socialMedia.youtube || '',
        tiktok: formData.socialMedia.tiktok || '',
        linkedin: formData.socialMedia.linkedin || '',
        discord: formData.socialMedia.discord || '',
        telegram: formData.socialMedia.telegram || '',
        // Status
        onboardingStep: 'kyc',
        kycStatus: 'not_submitted',
        kyc_status: 'not_submitted',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      console.log('✅ Influencer profile saved successfully');
      router.push('/influencer/kyc');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div 
      className="min-h-screen bg-black pt-24 pb-12 px-4"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Influencer Registration</h1>
            <p className="text-white/60 text-base sm:text-lg">Complete your influencer profile</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Photo *</h2>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-400/30 bg-white/5">
                  {profilePhotoURL ? (
                    <Image src={profilePhotoURL} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadingPhoto}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium cursor-pointer transition-all ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingPhoto ? 'Uploading...' : profilePhotoURL ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <p className="text-white/60 text-sm mt-2">Square format recommended (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="cryptojohn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white/80">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white/80">Bio * ({formData.bio.length}/280)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={280}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Niche/Focus Area</label>
                  <input
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="e.g., Crypto, DeFi, NFT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Follower Count</label>
                  <input
                    type="number"
                    value={formData.followerCount}
                    onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Location Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="United States"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="New York"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white/80">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                  placeholder="Street address"
                />
              </div>

            </div>

            {/* Social Media Links */}
            <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Social Media Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">𝕏 Twitter/X</label>
                  <input
                    type="text"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, twitter: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">📷 Instagram</label>
                  <input
                    type="text"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, instagram: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">▶️ YouTube</label>
                  <input
                    type="text"
                    value={formData.socialMedia.youtube}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, youtube: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="Channel URL or @username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">🎵 TikTok</label>
                  <input
                    type="text"
                    value={formData.socialMedia.tiktok}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, tiktok: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">💼 LinkedIn</label>
                  <input
                    type="text"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, linkedin: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="Profile URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">💬 Discord</label>
                  <input
                    type="text"
                    value={formData.socialMedia.discord}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, discord: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="username#0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">✈️ Telegram</label>
                  <input
                    type="text"
                    value={formData.socialMedia.telegram}
                    onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, telegram: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting || uploadingPhoto}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
              >
                {submitting ? 'Creating Profile...' : 'Complete Registration →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
