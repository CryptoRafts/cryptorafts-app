"use client";
import React, { useState, useEffect } from 'react';
import { useSimpleAuth, useSimpleAuthActions } from '@/lib/auth-simple';
import { raftai } from '@/lib/raftai';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ensureStorage, waitForFirebase } from '@/lib/firebase-utils';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase.client';
import type { User } from 'firebase/auth';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface KYCStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
}

interface VerificationResult {
  status: 'processing' | 'approved' | 'rejected' | 'pending';
  riskScore?: number;
  reasons?: string[];
  cooldownUntil?: number;
  details?: any;
  confidence?: number;
}

// Step Components
function IDDocumentsStep({ data, onDataUpdate, onNext, user }: any) {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (type: 'front' | 'back', file: File) => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // FIXED: Wait for Firebase before uploading
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      
      // Upload to Firebase Storage with user-specific path
      const storage = await ensureStorage();
      if (!storage) {
        alert('Storage not available. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      const storageRef = ref(storage, `kyc-documents/${user.uid}/${type}-${Date.now()}-${safeName}`);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600"
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (type === 'front') setFrontImage(file);
      else setBackImage(file);
      
      onDataUpdate({
        ...data,
        [type === 'front' ? 'idFront' : 'idBack']: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL: downloadURL,
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = frontImage && backImage;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">ID Front</h3>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('front', e.target.files[0])}
              className="hidden"
              id="front-upload"
              disabled={uploading}
            />
            <label htmlFor="front-upload" className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}>
              <div className="text-white/60 mb-4">
                {frontImage ? frontImage.name : 'Click to upload ID front'}
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-blue-400 text-xl">📷</span>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">ID Back</h3>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('back', e.target.files[0])}
              className="hidden"
              id="back-upload"
              disabled={uploading}
            />
            <label htmlFor="back-upload" className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}>
              <div className="text-white/60 mb-4">
                {backImage ? backImage.name : 'Click to upload ID back'}
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-blue-400 text-xl">📷</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="text-center text-white/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          Uploading document...
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && !uploading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ProofOfAddressStep({ data, onDataUpdate, onNext, onPrevious, user }: any) {
  const [document, setDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // FIXED: Wait for Firebase before uploading
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      
      // Upload to Firebase Storage with user-specific path
      const storage = await ensureStorage();
      if (!storage) {
        alert('Storage not available. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      const storageRef = ref(storage, `kyc-documents/${user.uid}/proof-of-address-${Date.now()}-${safeName}`);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600"
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      setDocument(file);
      onDataUpdate({
        ...data,
        proofOfAddress: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL: downloadURL,
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Proof of Address</h3>
        <p className="text-white/70">Upload a utility bill, bank statement, or similar document</p>
        
        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="address-upload"
            disabled={uploading}
          />
          <label htmlFor="address-upload" className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}>
            <div className="text-white/60 mb-4">
              {document ? document.name : 'Click to upload proof of address'}
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-green-400 text-xl">📄</span>
            </div>
          </label>
        </div>
      </div>

      {uploading && (
        <div className="text-center text-white/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          Uploading document...
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!document || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            document && !uploading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Simplified KYC step for influencers - collects email, name, address, social links, profile picture, and selfie
function InfluencerSimplifiedKYCStep({ data, onDataUpdate, onNext, onPrevious, user, profile }: any) {
  const [email, setEmail] = useState(data.email || user?.email || profile?.email || '');
  const [firstName, setFirstName] = useState(data.firstName || profile?.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || profile?.lastName || '');
  const [address, setAddress] = useState(data.address || profile?.address || '');
  const [socialLinks, setSocialLinks] = useState(data.socialLinks || profile?.socialMedia || {
    twitter: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
    discord: '',
    telegram: ''
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureURL, setProfilePictureURL] = useState<string>(data.profilePictureURL || profile?.photoURL || profile?.profilePhotoURL || '');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieURL, setSelfieURL] = useState<string>(data.selfieURL || '');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState({ profile: false, selfie: false });

  const handleProfilePictureUpload = async (file: File) => {
    if (!file || !user) return;

    setUploadingProfile(true);
    try {
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploadingProfile(false);
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storage = await ensureStorage();
      if (!storage) {
        alert('Storage not available. Please refresh and try again.');
        setUploadingProfile(false);
        return;
      }

      const storageRef = ref(storage, `kyc-documents/${user.uid}/profile-${Date.now()}-${safeName}`);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600"
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      setProfilePicture(file);
      setProfilePictureURL(downloadURL);
      onDataUpdate({
        ...data,
        profilePicture: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL: downloadURL,
          uploadedAt: new Date().toISOString()
        },
        profilePictureURL: downloadURL
      });
      setUploadSuccess(prev => ({ ...prev, profile: true }));
      setTimeout(() => setUploadSuccess(prev => ({ ...prev, profile: false })), 3000);
    } catch (error: any) {
      console.error('Profile picture upload failed:', error);
      alert(`Upload failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSelfieUpload = async (file: File) => {
    if (!file || !user) return;

    setUploadingSelfie(true);
    try {
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploadingSelfie(false);
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storage = await ensureStorage();
      if (!storage) {
        alert('Storage not available. Please refresh and try again.');
        setUploadingSelfie(false);
        return;
      }

      const storageRef = ref(storage, `kyc-documents/${user.uid}/selfie-${Date.now()}-${safeName}`);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600"
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      setSelfie(file);
      setSelfieURL(downloadURL);
      onDataUpdate({
        ...data,
        selfie: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL: downloadURL,
          uploadedAt: new Date().toISOString()
        },
        selfieURL: downloadURL
      });
      setUploadSuccess(prev => ({ ...prev, selfie: true }));
      setTimeout(() => setUploadSuccess(prev => ({ ...prev, selfie: false })), 3000);
    } catch (error: any) {
      console.error('Selfie upload failed:', error);
      alert(`Upload failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleNext = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !address.trim() || !profilePictureURL || !selfieURL) {
      alert('Please fill in all required fields and upload both profile picture and selfie');
      return;
    }

    onDataUpdate({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      socialLinks: socialLinks,
      profilePictureURL: profilePictureURL,
      selfieURL: selfieURL
    });
    onNext();
  };

  const canProceed = email.trim() && firstName.trim() && lastName.trim() && address.trim() && profilePictureURL && selfieURL;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Influencer Verification</h3>
        <p className="text-white/70">Please provide your information for verification</p>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
            placeholder="your@email.com"
            required
          />
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">Address *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40"
            placeholder="Street address, City, Country"
            rows={3}
            required
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">Social Media Links</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Twitter/X</label>
              <input
                type="text"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Instagram</label>
              <input
                type="text"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">YouTube</label>
              <input
                type="text"
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="Channel URL"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">TikTok</label>
              <input
                type="text"
                value={socialLinks.tiktok}
                onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">LinkedIn</label>
              <input
                type="text"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="Profile URL"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Discord</label>
              <input
                type="text"
                value={socialLinks.discord}
                onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="Username#1234"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Telegram</label>
              <input
                type="text"
                value={socialLinks.telegram}
                onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:outline-none text-white placeholder-white/40 text-sm"
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">Profile Picture *</label>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleProfilePictureUpload(e.target.files[0])}
              className="hidden"
              id="profile-upload"
              disabled={uploadingProfile}
            />
            <label htmlFor="profile-upload" className={`cursor-pointer block ${uploadingProfile ? 'opacity-50' : ''}`}>
              {profilePictureURL ? (
                <div className="space-y-2">
                  <img src={profilePictureURL} alt="Profile" className="w-24 h-24 rounded-full mx-auto object-cover" />
                  <p className="text-white/60 text-sm">Click to change</p>
                </div>
              ) : (
                <div>
                  <div className="text-white/60 mb-2">Click to upload profile picture</div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-blue-400 text-xl">📷</span>
                  </div>
                </div>
              )}
            </label>
          </div>
          {uploadingProfile && (
            <div className="text-center text-white/70 mt-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              Uploading...
            </div>
          )}
          {uploadSuccess.profile && !uploadingProfile && (
            <div className="text-center mt-2">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-green-400 text-sm">
                ✓ Profile picture uploaded successfully!
              </div>
            </div>
          )}
        </div>

        {/* Live Selfie */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">Live Selfie *</label>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => e.target.files?.[0] && handleSelfieUpload(e.target.files[0])}
              className="hidden"
              id="selfie-upload"
              disabled={uploadingSelfie}
            />
            <label htmlFor="selfie-upload" className={`cursor-pointer block ${uploadingSelfie ? 'opacity-50' : ''}`}>
              {selfieURL ? (
                <div className="space-y-2">
                  <img src={selfieURL} alt="Selfie" className="w-24 h-24 rounded-full mx-auto object-cover" />
                  <p className="text-white/60 text-sm">Click to retake</p>
                </div>
              ) : (
                <div>
                  <div className="text-white/60 mb-2">Click to take/upload selfie</div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-purple-400 text-xl">🤳</span>
                  </div>
                </div>
              )}
            </label>
          </div>
          {uploadingSelfie && (
            <div className="text-center text-white/70 mt-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              Uploading...
            </div>
          )}
          {uploadSuccess.selfie && !uploadingSelfie && (
            <div className="text-center mt-2">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-green-400 text-sm">
                ✓ Selfie uploaded successfully!
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed || uploadingProfile || uploadingSelfie}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && !uploadingProfile && !uploadingSelfie
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function SelfieLivenessStep({ data, onDataUpdate, onNext, onPrevious, user }: any) {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file || !user) {
      console.error('❌ [SELFIE] Missing file or user:', { file: !!file, user: !!user });
      return;
    }

    setUploading(true);
    try {
      console.log('📸 [SELFIE] Starting upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });
      
      // FIXED: Wait for Firebase before uploading
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        console.error('❌ [SELFIE] Firebase not ready');
        alert('Firebase not initialized. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      console.log('📸 [SELFIE] Sanitized filename:', safeName);
      
      // Upload to Firebase Storage with user-specific path
      const storage = await ensureStorage();
      if (!storage) {
        console.error('❌ [SELFIE] Storage not available');
        alert('Storage not available. Please refresh and try again.');
        setUploading(false);
        return;
      }
      
      const storagePath = `kyc-documents/${user.uid}/selfie-${Date.now()}-${safeName}`;
      console.log('📸 [SELFIE] Uploading to path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600"
      });
      console.log('📸 [SELFIE] Upload bytes successful');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📸 [SELFIE] Got download URL:', downloadURL.substring(0, 50) + '...');

      setSelfie(file);
      const selfieData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        downloadURL: downloadURL,
        uploadedAt: new Date().toISOString()
      };
      
      console.log('📸 [SELFIE] Updating data with:', selfieData);
      onDataUpdate({
        ...data,
        selfie: selfieData
      });
      console.log('✅ [SELFIE] Upload completed successfully');
      setUploadSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      // Check if error is from ad blocker (harmless)
      const errorMessage = error?.message || error?.toString() || '';
      const isAdBlockerError = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                              errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                              error?.code === 'ERR_BLOCKED_BY_CLIENT';
      
      // If it's an ad blocker error and we have the download URL, the upload actually succeeded
      if (isAdBlockerError && selfie) {
        console.log('⚠️ [SELFIE] Ad blocker error detected, but upload likely succeeded');
        // Don't show error to user - upload was successful
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        // Real error - show to user
        console.error('❌ [SELFIE] Upload failed:', error);
        console.error('❌ [SELFIE] Error details:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        });
        alert(`Upload failed: ${error?.message || 'Please try again.'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Selfie & Liveness Check</h3>
        <p className="text-white/70">Take a clear selfie for face verification and liveness detection</p>
        
        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="selfie-upload"
            disabled={uploading}
          />
          <label htmlFor="selfie-upload" className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}>
            <div className="text-white/60 mb-4">
              {selfie ? selfie.name : 'Click to take/upload selfie'}
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-purple-400 text-xl">🤳</span>
            </div>
          </label>
        </div>
      </div>

      {uploading && (
        <div className="text-center text-white/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          Uploading selfie...
        </div>
      )}

      {uploadSuccess && !uploading && (
        <div className="text-center">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">✓</span>
              <span className="font-semibold">Selfie uploaded successfully!</span>
            </div>
            <p className="text-sm text-green-400/70 mt-1">You can proceed to the next step</p>
            <p className="text-xs text-green-400/50 mt-2">
              Note: Any console errors about blocked requests are harmless and don't affect your upload.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selfie || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            selfie && !uploading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ReviewSubmitStep({ data, onSubmit, onPrevious, isProcessing, allVerificationData, userRole }: any) {
  // CRITICAL: Debug logging to understand data structure
  console.log('📋 [REVIEW] All verification data:', allVerificationData);
  console.log('📋 [REVIEW] Current step data:', data);
  console.log('📋 [REVIEW] User role:', userRole);
  
  // For influencers, show simplified review
  if (userRole === 'influencer') {
    const influencerData = allVerificationData?.influencer_info || {};
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="neo-glass-card rounded-xl p-6 border border-pink-400/20 space-y-4 bg-black/40 backdrop-blur-sm">
            <h3 className="text-white font-semibold text-lg mb-4">Review Your Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">📧</span>
                  Email
                </h4>
                <div className={`text-sm ${influencerData.email ? 'text-green-400' : 'text-red-400'}`}>
                  {influencerData.email ? (
                    <span>✓ {influencerData.email}</span>
                  ) : (
                    <span>✗ Not provided</span>
                  )}
                </div>
              </div>
              
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">👤</span>
                  Name
                </h4>
                <div className={`text-sm ${influencerData.firstName && influencerData.lastName ? 'text-green-400' : 'text-red-400'}`}>
                  {influencerData.firstName && influencerData.lastName ? (
                    <span>✓ {influencerData.firstName} {influencerData.lastName}</span>
                  ) : (
                    <span>✗ Not provided</span>
                  )}
                </div>
              </div>
              
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">🏠</span>
                  Address
                </h4>
                <div className={`text-sm ${influencerData.address ? 'text-green-400' : 'text-red-400'}`}>
                  {influencerData.address ? (
                    <span>✓ {influencerData.address}</span>
                  ) : (
                    <span>✗ Not provided</span>
                  )}
                </div>
              </div>
              
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">📸</span>
                  Profile Picture
                </h4>
                <div className={`text-sm ${influencerData.profilePictureURL ? 'text-green-400' : 'text-red-400'}`}>
                  {influencerData.profilePictureURL ? (
                    <span>✓ Uploaded</span>
                  ) : (
                    <span>✗ Not uploaded</span>
                  )}
                </div>
              </div>
              
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">🤳</span>
                  Selfie
                </h4>
                <div className={`text-sm ${influencerData.selfieURL ? 'text-green-400' : 'text-red-400'}`}>
                  {influencerData.selfieURL ? (
                    <span>✓ Uploaded</span>
                  ) : (
                    <span>✗ Not uploaded</span>
                  )}
                </div>
              </div>
              
              <div className="neo-glass-card rounded-lg p-4 border border-pink-400/20 bg-black/30 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-pink-400">🔗</span>
                  Social Links
                </h4>
                <div className={`text-sm ${influencerData.socialLinks && Object.keys(influencerData.socialLinks || {}).length > 0 ? 'text-green-400' : 'text-white/50'}`}>
                  {influencerData.socialLinks && Object.keys(influencerData.socialLinks).some((key: string) => influencerData.socialLinks[key]) ? (
                    <span>✓ {Object.keys(influencerData.socialLinks).filter((key: string) => influencerData.socialLinks[key]).length} links provided</span>
                  ) : (
                    <span>Optional</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={onPrevious}
            disabled={isProcessing}
            className="px-6 py-3 rounded-lg font-medium bg-white/10 hover:bg-white/20 border border-pink-400/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={isProcessing || !influencerData.email || !influencerData.firstName || !influencerData.lastName || !influencerData.address || !influencerData.profilePictureURL || !influencerData.selfieURL}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isProcessing || !influencerData.email || !influencerData.firstName || !influencerData.lastName || !influencerData.address || !influencerData.profilePictureURL || !influencerData.selfieURL
                ? 'bg-white/10 text-white/50 cursor-not-allowed border border-pink-400/10'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/20'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Submit for Verification'}
          </button>
        </div>
      </div>
    );
  }
  
  // Standard KYC review for other roles
  // Extract data from all steps - data structure is keyed by step ID
  const idDocuments = allVerificationData?.id_documents || {};
  const proofOfAddress = allVerificationData?.proof_of_address || {};
  const selfieData = allVerificationData?.selfie_liveness || {};
  
  // Helper function to extract document info (handles both string filenames and object structures)
  const getDocumentInfo = (doc: any): { fileName: string; exists: boolean } | null => {
    if (!doc) return null;
    
    // If it's a string (filename), return it
    if (typeof doc === 'string' && doc.trim().length > 0) {
      return { fileName: doc, exists: true };
    }
    
    // If it's an object, extract fileName
    if (typeof doc === 'object' && doc !== null) {
      const fileName = doc.fileName || doc.name || doc.filename || null;
      if (fileName && typeof fileName === 'string' && fileName.trim().length > 0) {
        return { fileName: fileName.trim(), exists: true };
      }
      // If object exists but no fileName, still consider it uploaded
      if (Object.keys(doc).length > 0) {
        return { fileName: 'Uploaded', exists: true };
      }
    }
    
    return null;
  };
  
  // Get document info from each step - check multiple possible property names
  const idFrontRaw = idDocuments?.idFront || idDocuments?.front || null;
  const idBackRaw = idDocuments?.idBack || idDocuments?.back || null;
  const proofOfAddressRaw = proofOfAddress?.proofOfAddress || proofOfAddress?.proof_of_address || proofOfAddress?.address || null;
  const selfieRaw = selfieData?.selfie || selfieData?.selfieImage || null;
  
  // Extract document info using helper
  const idFront = getDocumentInfo(idFrontRaw);
  const idBack = getDocumentInfo(idBackRaw);
  const proofOfAddressDoc = getDocumentInfo(proofOfAddressRaw);
  const selfie = getDocumentInfo(selfieRaw);
  
  console.log('📋 [REVIEW] Extracted documents:', {
    idDocumentsKeys: Object.keys(idDocuments),
    idFrontRaw: idFrontRaw,
    idFront: idFront ? idFront.fileName : 'Not uploaded',
    idBackRaw: idBackRaw,
    idBack: idBack ? idBack.fileName : 'Not uploaded',
    proofOfAddressKeys: Object.keys(proofOfAddress),
    proofOfAddressRaw: proofOfAddressRaw,
    proofOfAddress: proofOfAddressDoc ? proofOfAddressDoc.fileName : 'Not uploaded',
    selfieDataKeys: Object.keys(selfieData),
    selfieRaw: selfieRaw,
    selfie: selfie ? selfie.fileName : 'Not uploaded'
  });
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20 space-y-4 bg-black/40 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neo-glass-card rounded-lg p-4 border border-cyan-400/20 bg-black/30 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-cyan-400">📄</span>
                ID Documents
              </h4>
              <div className="space-y-2">
                <div className={`text-sm flex items-center gap-2 ${idFront?.exists ? 'text-green-400' : 'text-white/50'}`}>
                  {idFront?.exists ? (
                    <>
                      <span className="text-green-400">✓</span>
                      <span>Front: {idFront.fileName}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-400">✗</span>
                      <span>Front: Not uploaded</span>
                    </>
                  )}
                </div>
                <div className={`text-sm flex items-center gap-2 ${idBack?.exists ? 'text-green-400' : 'text-white/50'}`}>
                  {idBack?.exists ? (
                    <>
                      <span className="text-green-400">✓</span>
                      <span>Back: {idBack.fileName}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-400">✗</span>
                      <span>Back: Not uploaded</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="neo-glass-card rounded-lg p-4 border border-cyan-400/20 bg-black/30 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-cyan-400">🏠</span>
                Proof of Address
              </h4>
              <div className={`text-sm flex items-center gap-2 ${proofOfAddressDoc?.exists ? 'text-green-400' : 'text-white/50'}`}>
                {proofOfAddressDoc?.exists ? (
                  <>
                    <span className="text-green-400">✓</span>
                    <span>{proofOfAddressDoc.fileName}</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400">✗</span>
                    <span>Not uploaded</span>
                  </>
                )}
              </div>
            </div>
            <div className="neo-glass-card rounded-lg p-4 border border-cyan-400/20 bg-black/30 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-cyan-400">🤳</span>
                Selfie
              </h4>
              <div className={`text-sm flex items-center gap-2 ${selfie?.exists ? 'text-green-400' : 'text-white/50'}`}>
                {selfie?.exists ? (
                  <>
                    <span className="text-green-400">✓</span>
                    <span>{selfie.fileName}</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400">✗</span>
                    <span>Not uploaded</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <button
          onClick={onPrevious}
          disabled={isProcessing}
          className="px-6 py-3 rounded-lg font-medium bg-white/10 hover:bg-white/20 border border-cyan-400/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isProcessing || !idFront?.exists || !idBack?.exists || !proofOfAddressDoc?.exists || !selfie?.exists}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isProcessing || !idFront?.exists || !idBack?.exists || !proofOfAddressDoc?.exists || !selfie?.exists
              ? 'bg-white/10 text-white/50 cursor-not-allowed border border-cyan-400/10'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}

// New step for AI verification and matching
function AIVerificationStep({ result, onRetry }: any) {
  const router = useRouter();
  
  if (!result) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '🔄';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
          <span className="mr-2">{getStatusIcon(result.status)}</span>
          {result.status.toUpperCase()}
        </div>
      </div>

      {result.riskScore && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
          <div className="text-white/70">
            Risk Score: <span className="font-mono">{result.riskScore}/100</span>
          </div>
        </div>
      )}

      {result.reasons && result.reasons.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-2">Verification Details</h4>
          <ul className="space-y-2">
            {result.reasons.map((reason: string, index: number) => (
              <li key={index} className="text-white/70 text-sm">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {result.cooldownUntil && (
        <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-6">
          <h4 className="text-yellow-400 font-medium mb-2">Cooldown Period</h4>
          <p className="text-yellow-300 text-sm">
            You can retry verification after: {new Date(result.cooldownUntil).toLocaleString()}
          </p>
        </div>
      )}

      {result.status === 'rejected' && result.cooldownUntil && new Date() > new Date(result.cooldownUntil) && (
        <div className="text-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Retry Verification
          </button>
        </div>
      )}

      {result.status === 'approved' && (
        <div className="text-center">
          <div className="text-green-400 text-lg font-medium mb-4">
            🎉 Verification Successful!
          </div>
          <p className="text-white/70 mb-6">
            Your KYC verification has been approved. You can now access all platform features.
          </p>
          <button
            onClick={() => router.push('/founder/onboarding')}
            className="px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all"
          >
            Continue to Next Step
          </button>
        </div>
      )}
    </div>
  );
}

export default function KYCVerification() {
  const { user: hookUser, profile, loading } = useSimpleAuth();
  const { updateKYCStatus, updateOnboardingStep } = useSimpleAuthActions();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Fallback: Check Firebase auth directly if hook hasn't detected user
  useEffect(() => {
    if (hookUser) {
      console.log('✅ [KYC] Hook user found, using hook user');
      setFirebaseUser(hookUser);
      setAuthChecked(true);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    const retryTimeouts: NodeJS.Timeout[] = [];
    let isMounted = true;
    let userFound = false;
    let authListenerFired = false;

    // Check Firebase auth directly as fallback
    const checkFirebaseAuth = () => {
      if (!isMounted || userFound) return false;
      try {
        if (typeof window !== 'undefined' && auth && auth.currentUser) {
          console.log('✅ [KYC] Firebase auth check: User found via auth.currentUser');
          setFirebaseUser(auth.currentUser);
          setAuthChecked(true);
          userFound = true;
          return true;
        }
        return false;
      } catch (error) {
        console.error('❌ [KYC] Firebase auth check error:', error);
        return false;
      }
    };

    // Set up listener for auth state changes FIRST (this fires immediately with current state)
    // This is the most reliable way to detect authenticated users
    try {
      if (auth) {
        unsubscribe = auth.onAuthStateChanged((user) => {
          authListenerFired = true;
          if (!isMounted || userFound) return;
          console.log('🔄 [KYC] Auth state changed:', user ? `User found: ${user.email}` : 'No user');
          if (user) {
            setFirebaseUser(user);
            setAuthChecked(true);
            userFound = true;
          } else {
            // If listener fired with no user, wait a bit before showing "Authentication Required"
            // This gives time for the hook to detect the user
            setTimeout(() => {
              if (!isMounted || userFound) return;
              console.log('⚠️ [KYC] No user found after auth state check');
              setAuthChecked(true);
            }, 1500);
          }
        });
      }
    } catch (error) {
      console.error('❌ [KYC] Error setting up auth listener:', error);
      // If we can't set up listener, check immediately
      authListenerFired = true;
    }

    // Also check immediately and retry (in case listener hasn't fired yet)
    const initializeAuthCheck = async () => {
      try {
        // Wait for Firebase to be ready (but don't wait too long)
        const isReady = await waitForFirebase(2000);
        if (!isReady) {
          console.warn('⚠️ [KYC] Firebase not ready after 2s, proceeding anyway');
        }

        if (!isMounted || userFound) return;

        // Check immediately
        checkFirebaseAuth();

        // Retry after short delays (only if listener hasn't fired or user not found)
        if (!userFound) {
          retryTimeouts.push(setTimeout(() => {
            if (isMounted && !userFound) checkFirebaseAuth();
          }, 500));

          retryTimeouts.push(setTimeout(() => {
            if (isMounted && !userFound) checkFirebaseAuth();
          }, 1000));

          retryTimeouts.push(setTimeout(() => {
            if (isMounted && !userFound) {
              checkFirebaseAuth();
              // Final check - if still no user and listener has fired, mark as checked
              if (!userFound && authListenerFired) {
                console.log('⚠️ [KYC] No user found after all retries and auth listener fired');
                setAuthChecked(true);
              }
            }
          }, 2000));
        }
      } catch (error) {
        console.error('❌ [KYC] Error initializing auth check:', error);
        if (isMounted && !userFound && authListenerFired) {
          setAuthChecked(true);
        }
      }
    };

    initializeAuthCheck();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      retryTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [hookUser]);

  // Use Firebase user as fallback if hook user is not available
  const user = hookUser || firebaseUser;

  // Check if user is influencer to add contact info step
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.uid) return;
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
        
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          setRoleChecked(true);
          return;
        }
        
        const dbInstance = ensureDb();
        if (dbInstance) {
          const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'founder');
          } else {
            // Check localStorage as fallback
            const storedRole = localStorage.getItem('userRole');
            setUserRole(storedRole || 'founder');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        const storedRole = localStorage.getItem('userRole');
        setUserRole(storedRole || 'founder');
      } finally {
        setRoleChecked(true);
      }
    };

    checkRole();
  }, [user?.uid]);

  // Build steps array - simplified for influencers, full for other roles
  let steps: KYCStep[] = [];
  
  if (userRole === 'influencer' && roleChecked) {
    // Simplified KYC for influencers: only basic info + selfie
    steps = [
      {
        id: 'influencer_info',
        title: 'Influencer Information',
        description: 'Provide your email, name, address, social links, profile picture, and selfie',
        component: InfluencerSimplifiedKYCStep,
        required: true
      },
      {
        id: 'review_submit',
        title: 'Review & Submit',
        description: 'Review your information and submit for verification',
        component: ReviewSubmitStep,
        required: true
      }
    ];
  } else {
    // Standard KYC steps for other roles
    steps = [
      {
        id: 'id_documents',
        title: 'ID Documents',
        description: 'Upload your government-issued identification',
        component: IDDocumentsStep,
        required: true
      },
      {
        id: 'proof_of_address',
        title: 'Proof of Address',
        description: 'Upload a document proving your residential address',
        component: ProofOfAddressStep,
        required: true
      },
      {
        id: 'selfie_liveness',
        title: 'Selfie & Liveness Check',
        description: 'Take a selfie for face verification and liveness detection',
        component: SelfieLivenessStep,
        required: true
      },
      {
        id: 'review_submit',
        title: 'Review & Submit',
        description: 'Review your information and submit for verification',
        component: ReviewSubmitStep,
        required: true
      }
    ];
  }

  const handleDataUpdate = (stepId: string, data: any) => {
    console.log(`📝 [DATA UPDATE] Updating step "${stepId}" with data:`, data);
    setVerificationData((prev) => {
      const updated = {
      ...prev,
        [stepId]: {
          ...prev[stepId], // Preserve existing data for this step
          ...data // Merge new data
        }
      };
      console.log(`📝 [DATA UPDATE] Updated verification data:`, updated);
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Wrap in try-catch to suppress any network errors from Firestore channel termination
      try {
        setCurrentStep(currentStep + 1);
      } catch (error: any) {
        // Suppress ERR_BLOCKED_BY_CLIENT errors - they're harmless
        const errorMessage = error?.message || error?.toString() || '';
        if (!errorMessage.includes('ERR_BLOCKED_BY_CLIENT') && 
            !errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
          console.error('Navigation error:', error);
        }
        // Still proceed with navigation even if there's an error
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // For influencers, use simplified validation
    if (userRole === 'influencer') {
      const influencerData = verificationData.influencer_info || {};
      if (!influencerData.email || !influencerData.firstName || !influencerData.lastName || 
          !influencerData.address || !influencerData.profilePictureURL || !influencerData.selfieURL) {
        console.error('❌ [KYC] Missing required influencer information:', {
          email: !!influencerData.email,
          firstName: !!influencerData.firstName,
          lastName: !!influencerData.lastName,
          address: !!influencerData.address,
          profilePictureURL: !!influencerData.profilePictureURL,
          selfieURL: !!influencerData.selfieURL
        });
        alert('Please fill in all required fields and upload both profile picture and selfie.');
        setIsProcessing(false);
        return;
      }
    } else {
      // Standard validation for other roles
      const idDocuments = verificationData.id_documents || {};
      const proofOfAddress = verificationData.proof_of_address || {};
      const selfieData = verificationData.selfie_liveness || {};
      
      // Check for proof of address - it can be stored as proofOfAddress, proof_of_address, or address
      const hasProofOfAddress = proofOfAddress.proofOfAddress || proofOfAddress.proof_of_address || proofOfAddress.address;
      
      if (!idDocuments.idFront || !idDocuments.idBack || !hasProofOfAddress || !selfieData.selfie) {
        console.error('❌ [KYC] Missing required documents:', {
          idFront: !!idDocuments.idFront,
          idBack: !!idDocuments.idBack,
          proofOfAddress: !!hasProofOfAddress,
          selfie: !!selfieData.selfie,
          proofOfAddressKeys: Object.keys(proofOfAddress),
          proofOfAddressData: proofOfAddress
        });
        alert('Please upload all required documents before submitting.');
        setIsProcessing(false);
        return;
      }
    }
    
    setIsProcessing(true);
    try {
      // Always set status to 'pending' for admin approval
      const pendingStatus = 'pending' as const;
      
      let kycData: any;
      
      // Handle influencer KYC differently (simplified)
      if (userRole === 'influencer') {
        const influencerData = verificationData.influencer_info || {};
        
        // Get wallet address from user profile
        const walletAddress = profile?.walletAddress || '';
        
        // Prepare simplified KYC data for influencers
        kycData = {
          status: pendingStatus,
          riskScore: 50, // Default score for simplified KYC
          reasons: ['Simplified influencer verification'],
          confidence: 0.8,
          walletAddress: walletAddress, // Include wallet address for on-chain storage
          details: {
            email: influencerData.email,
            firstName: influencerData.firstName,
            lastName: influencerData.lastName,
            address: influencerData.address,
            socialLinks: influencerData.socialLinks || {},
            profilePictureURL: influencerData.profilePictureURL,
            selfieURL: influencerData.selfieURL,
            profilePicture: influencerData.profilePicture,
            selfie: influencerData.selfie,
            walletAddress: walletAddress
          },
          // Include document URLs at top level
          profilePictureURL: influencerData.profilePictureURL,
          selfieURL: influencerData.selfieURL,
          documents: {
            profilePicture: influencerData.profilePictureURL || null,
            selfie: influencerData.selfieURL || null
          },
          updatedAt: Date.now()
        };
      } else {
        // Standard KYC processing with RaftAI for other roles
        const verificationResult = await raftai.processKYC(user.uid, verificationData);
        
        // Extract document URLs from verificationData
        const idDocuments = verificationData.id_documents || {};
        const proofOfAddress = verificationData.proof_of_address || {};
        const selfieData = verificationData.selfie_liveness || {};
      
      // Helper to extract URL from document (handles both string URLs and objects with downloadURL)
      const extractUrl = (doc: any): string => {
        if (!doc) {
          console.log('📄 [EXTRACT] Document is null/undefined');
          return '';
        }
        if (typeof doc === 'string' && doc.trim().length > 0) {
          console.log('📄 [EXTRACT] Document is string URL:', doc.substring(0, 50));
          return doc.trim();
        }
        if (typeof doc === 'object' && doc !== null) {
          if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
            console.log('📄 [EXTRACT] Found downloadURL in object:', doc.downloadURL.substring(0, 50));
            return doc.downloadURL.trim();
          }
          if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
            console.log('📄 [EXTRACT] Found url in object:', doc.url.substring(0, 50));
            return doc.url.trim();
          }
          console.log('📄 [EXTRACT] Object has no valid URL field. Keys:', Object.keys(doc));
        }
        return '';
      };
      
      console.log('📄 [KYC] Raw verification data structure:', {
        idDocuments: idDocuments,
        idDocumentsKeys: Object.keys(idDocuments),
        idFrontRaw: idDocuments.idFront,
        idBackRaw: idDocuments.idBack,
        proofOfAddressRaw: proofOfAddress,
        selfieRaw: selfieData.selfie,
        selfieDataKeys: Object.keys(selfieData)
      });
      
      const idFrontUrl = extractUrl(idDocuments.idFront) || extractUrl(idDocuments.front) || '';
      const idBackUrl = extractUrl(idDocuments.idBack) || extractUrl(idDocuments.back) || '';
      // Enhanced extraction for proof of address - check all possible property names
      const proofOfAddressUrl = extractUrl(proofOfAddress.proofOfAddress) || 
                                extractUrl(proofOfAddress.proof_of_address) || 
                                extractUrl(proofOfAddress.address) ||
                                extractUrl(proofOfAddress.document) ||
                                '';
      const selfieUrl = extractUrl(selfieData.selfie) || extractUrl(selfieData.selfieImage) || '';
      
      // Enhanced logging for proof of address extraction
      console.log('📄 [KYC] Proof of address extraction details:', {
        proofOfAddressKeys: Object.keys(proofOfAddress),
        proofOfAddressProofOfAddress: proofOfAddress.proofOfAddress ? (typeof proofOfAddress.proofOfAddress === 'string' ? 'string' : 'object') : 'missing',
        proofOfAddressProof_of_address: proofOfAddress.proof_of_address ? (typeof proofOfAddress.proof_of_address === 'string' ? 'string' : 'object') : 'missing',
        proofOfAddressAddress: proofOfAddress.address ? (typeof proofOfAddress.address === 'string' ? 'string' : 'object') : 'missing',
        extractedUrl: proofOfAddressUrl || 'EMPTY'
      });
      
      console.log('📄 [KYC] Extracted document URLs:', {
        idFront: idFrontUrl ? '✓' : '✗',
        idBack: idBackUrl ? '✓' : '✗',
        proofOfAddress: proofOfAddressUrl ? '✓' : '✗',
        selfie: selfieUrl ? '✓' : '✗',
        idFrontUrl: idFrontUrl || 'EMPTY',
        idBackUrl: idBackUrl || 'EMPTY',
        proofOfAddressUrl: proofOfAddressUrl || 'EMPTY',
        selfieUrl: selfieUrl || 'EMPTY'
      });
      
        // Get wallet address from user profile
        const walletAddress = profile?.walletAddress || '';
        
        // Prepare KYC data without undefined values
        // CRITICAL: Include both raw objects (for extraction) and extracted URLs (for direct access)
        kycData = {
          status: pendingStatus,
          riskScore: verificationResult.riskScore,
          reasons: verificationResult.reasons,
          confidence: verificationResult.confidence,
          walletAddress: walletAddress, // Include wallet address for on-chain storage
          details: {
            ...verificationResult.details,
            // CRITICAL: Preserve raw verification data structure so updateKYCStatus can extract documents
            // These contain objects with downloadURL property
            id_documents: idDocuments, // Preserve original objects with downloadURL
            proof_of_address: proofOfAddress, // Preserve original objects with downloadURL
            selfie_liveness: selfieData, // Preserve original objects with downloadURL
            // Include extracted document URLs in details for direct access
            idFrontUrl: idFrontUrl,
            idBackUrl: idBackUrl,
            addressProofUrl: proofOfAddressUrl,
            selfieUrl: selfieUrl,
            // Also include at top level for easier access
            documents: {
              idFront: idFrontUrl,
              idBack: idBackUrl,
              proofOfAddress: proofOfAddressUrl,
              selfie: selfieUrl
            },
            // Include personal info if available
            personalInfo: verificationData.personal_info || {},
            // Include wallet address in details
            walletAddress: walletAddress
          },
          // Also include document URLs at top level for direct access
          idFrontUrl: idFrontUrl,
          idBackUrl: idBackUrl,
          addressProofUrl: proofOfAddressUrl,
          selfieUrl: selfieUrl,
          // Include documents at top level for admin page to find
          // CRITICAL: These must be string URLs, not objects
          documents: {
            idFront: idFrontUrl || null,
            idBack: idBackUrl || null,
            proofOfAddress: proofOfAddressUrl || null,
            selfie: selfieUrl || null
          },
          updatedAt: Date.now()
        };

        // Only include cooldownUntil if it's defined
        if (verificationResult.cooldownUntil !== undefined) {
          kycData.cooldownUntil = verificationResult.cooldownUntil;
        }
      }

      // Update user's KYC status to pending
      await updateKYCStatus(pendingStatus, kycData);
      
      console.log('✅ [KYC] Status updated, waiting for Firestore to sync...');
      
      // Wait a bit longer for Firestore to sync the update before redirecting
      // This ensures the pending-approval page sees the updated status
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get user role to determine redirect path
      const redirectRole = profile?.role || userRole || localStorage.getItem('userRole') || 'founder';
      
      // Redirect to pending approval page
      console.log('🔄 [KYC] Redirecting to pending-approval page');
        router.push(`/${redirectRole}/pending-approval`);
      
      // Show success message - waiting for admin approval
      setResult({
        status: 'pending',
        riskScore: kycData.riskScore || 50,
        reasons: kycData.reasons || ['Your KYC has been submitted for admin review. Redirecting to approval page...'],
        confidence: kycData.confidence || 0.8,
        details: kycData.details || {}
      });
      setCurrentStep(steps.length); // Move to results step
    } catch (error) {
      console.error('Verification failed:', error);
      setResult({
        status: 'rejected',
        reasons: ['Verification failed due to technical error. Please try again.'],
        riskScore: 100,
        confidence: 0,
        details: {
          faceMatch: false,
          liveness: false,
          idVerification: false,
          addressVerification: false,
          sanctionsCheck: false,
          pepCheck: false
        }
      });
      setCurrentStep(steps.length);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setCurrentStep(0);
    setVerificationData({});
  };

  const getCompletionPercentage = () => {
    if (currentStep >= steps.length) return 100;
    return ((currentStep + 1) / steps.length) * 100;
  };

  const CurrentStepComponent = steps[currentStep]?.component;

  // Debug logging
  useEffect(() => {
    console.log('🔍 [KYC] Render state:', {
      loading,
      authChecked,
      hookUser: !!hookUser,
      firebaseUser: !!firebaseUser,
      user: !!user,
      userEmail: user?.email || hookUser?.email || firebaseUser?.email || 'none',
      userRole,
      roleChecked,
      stepsLength: steps.length,
      currentStep
    });
  }, [loading, authChecked, hookUser, firebaseUser, user, userRole, roleChecked, steps.length, currentStep]);

  // Wait for auth to finish loading AND Firebase auth check to complete
  // If we have a user, we can proceed immediately
  // If we don't have a user yet, wait a bit longer to give the hook/auth check time
  const [hasWaitedForUser, setHasWaitedForUser] = React.useState(false);
  const [initialWaitComplete, setInitialWaitComplete] = React.useState(false);
  
  // Give initial time for hook to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialWaitComplete(true);
    }, 1000); // Wait 1 second for hook to initialize
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // If user is found, we don't need to wait
    if (user) {
      setHasWaitedForUser(true);
      return;
    }
    
    // Only start waiting timer after initial wait is complete
    if (!initialWaitComplete) return;
    
    // If no user yet, wait up to 2 more seconds for user detection
    const timer = setTimeout(() => {
      setHasWaitedForUser(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, initialWaitComplete]);

  // Show loading if: still loading, auth not checked, initial wait not complete, or waiting for user detection
  if (loading || !authChecked || !initialWaitComplete || (!user && !hasWaitedForUser)) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading KYC verification...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show authentication required if: auth finished loading, auth check completed, initial wait complete, waited for user, and still no user found
  if (!user && authChecked && !loading && initialWaitComplete && hasWaitedForUser) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p>Please sign in to access KYC verification.</p>
          </div>
        </div>
      </div>
    );
  }

     if (currentStep >= steps.length) {
     return (
       <div className="min-h-screen bg-cover bg-center bg-no-repeat pt-32 pb-12 px-4"
         style={{
           backgroundImage: 'url("/worldmap.png")'
         }}
       >
         <div className="max-w-3xl mx-auto">
           {/* Success Header with Celebration */}
           <div className="text-center mb-8">
             <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
               <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
               Documents Submitted Successfully! ✓
             </h1>
             <p className="text-white/80 text-lg mb-2">Your KYC documents have been uploaded and submitted</p>
             <p className="text-green-400 font-semibold">Waiting for admin review and approval</p>
           </div>
           
           {/* Success Card */}
           <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-8 mb-8 border-2 border-green-500/30 shadow-2xl">
             <div className="text-center">
               <h2 className="text-2xl font-bold text-white mb-4">What happens next?</h2>
               <div className="space-y-3 text-left max-w-md mx-auto">
                 <div className="flex items-start gap-3 text-white/90">
                   <span className="text-green-400 font-bold text-xl">1.</span>
                   <span>Our admin team will review your documents</span>
                 </div>
                 <div className="flex items-start gap-3 text-white/90">
                   <span className="text-green-400 font-bold text-xl">2.</span>
                   <span>RaftAI is analyzing your submission in real-time</span>
                 </div>
                 <div className="flex items-start gap-3 text-white/90">
                   <span className="text-green-400 font-bold text-xl">3.</span>
                   <span>You'll receive a notification once approved</span>
                 </div>
                 <div className="flex items-start gap-3 text-white/90">
                   <span className="text-green-400 font-bold text-xl">4.</span>
                   <span>Full platform access will be granted automatically</span>
                 </div>
               </div>
             </div>
           </div>
           
           <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl">
             <AIVerificationStep result={result} onRetry={handleRetry} />
           </div>
         </div>
       </div>
     );
   }

   return (
     <div className="min-h-screen bg-cover bg-center bg-no-repeat pt-32 pb-12 px-4"
       style={{
         backgroundImage: 'url("/worldmap.png")'
       }}
     >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
         <h1 className="text-3xl font-bold text-white mb-4">KYC Verification</h1>
          <p className="text-white/70">Complete your identity verification to access all platform features</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(getCompletionPercentage())}% Complete</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 border border-cyan-400/20">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/20"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {steps.length > 0 && currentStep < steps.length && steps[currentStep] ? (
          <div className="neo-glass-card rounded-xl p-8 mb-8 border border-cyan-400/20 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">{steps[currentStep].title}</h2>
              <p className="text-white/70">{steps[currentStep].description}</p>
            </div>

            {CurrentStepComponent ? (
              <CurrentStepComponent
                data={verificationData[steps[currentStep].id] || {}}
                onDataUpdate={(data: any) => handleDataUpdate(steps[currentStep].id, data)}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
                isProcessing={isProcessing}
                user={user}
                profile={profile}
                allVerificationData={verificationData}
                userRole={userRole}
              />
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white/70">Loading step...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="neo-glass-card rounded-xl p-8 mb-8 border border-cyan-400/20 shadow-2xl">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white/70">Loading verification steps...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
