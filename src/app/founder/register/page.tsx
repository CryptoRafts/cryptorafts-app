"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, ensureStorage, waitForFirebase } from '@/lib/firebase-utils';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import BinanceWalletConnect from '@/components/BinanceWalletConnect';

export default function FounderRegisterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoURL, setPhotoURL] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    bio: '',
    linkedin: '',
    twitter: '',
    website: ''
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const storage = ensureStorage();
      if (!storage) {
        setError('Storage service not available');
        setUploadingPhoto(false);
        return;
      }
      
      const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${file.name}`);
      
      const snapshot = await uploadBytes(photoRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    const checkExisting = async () => {
      // Wait for auth to finish loading
      if (isLoading) {
        return;
      }

      // Layout guard handles authentication - if we reach here, user should be authenticated
      // But add a safety check just in case
      if (!user) {
        console.log('🛡️ No user in register page (should be handled by layout guard), redirecting to login');
        router.push('/login');
        return;
      }

      try {
        // FIXED: Wait for Firebase before checking status
        const isReady = await waitForFirebase(10000);
        if (!isReady) {
          setError('Firebase not initialized. Please refresh and try again.');
          setLoading(false);
          return;
        }
        
        // Ensure DB is ready
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setError('Database connection not available');
          setLoading(false);
          return;
        }
        
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // If profile already completed, redirect to next step
          if (data.profileCompleted) {
            // Check KYC status - support both naming conventions
            const kycStatus = data.kycStatus || data.kyc_status || data.kyc?.status || 'not_submitted';
            const kycStatusLower = String(kycStatus).toLowerCase();
            
            console.log('🔍 Registration status check:', {
              profileCompleted: data.profileCompleted,
              kycStatus: kycStatus,
              kycStatusLower: kycStatusLower
            });
            
            if (!kycStatus || kycStatusLower === 'not_submitted') {
              console.log('✅ KYC not submitted, redirecting to KYC page');
              router.push('/founder/kyc');
            } else if (kycStatusLower === 'pending' || kycStatusLower === 'submitted') {
              console.log('⏳ KYC pending, redirecting to pending approval');
              router.push('/founder/pending-approval');
            } else if (kycStatusLower === 'approved' || kycStatusLower === 'verified') {
              console.log('✅ KYC approved, redirecting to dashboard');
              router.push('/founder/dashboard');
            } else {
              console.log('⚠️ Unknown KYC status, redirecting to KYC page');
              router.push('/founder/kyc');
            }
            return;
          }

          // Pre-fill form if partial data exists
          if (data.name || data.firstName || data.lastName) {
            setFormData({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              fullName: data.name || data.displayName || '',
              email: user.email || '',
              phone: data.phone || '',
              company: data.company || '',
              jobTitle: data.jobTitle || '',
              bio: data.bio || '',
              linkedin: data.linkedin || '',
              twitter: data.twitter || '',
              website: data.website || ''
            });
            setPhotoURL(data.photoURL || user.photoURL || '');
          } else {
            setFormData({
              ...formData,
              email: user.email || ''
            });
            setPhotoURL(user.photoURL || '');
          }
        } else {
          setFormData({
            ...formData,
            email: user.email || ''
          });
          setPhotoURL(user.photoURL || '');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExisting();
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!user) {
      setError('User not authenticated');
      setSubmitting(false);
      return;
    }

    try {
      // FIXED: Wait for Firebase before submitting
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setSubmitting(false);
        return;
      }
      
      // Build full name from first and last
      const fullName = formData.fullName || `${formData.firstName} ${formData.lastName}`.trim();

      // Ensure DB is ready
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database connection not available. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      // Update user document in Firestore
      await setDoc(doc(dbInstance, 'users', user.uid), {
        role: 'founder',
        // Name fields
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: fullName,
        displayName: fullName,
        fullName: fullName,
        // Contact
        email: formData.email || user.email,
        phone: formData.phone,
        // Profile photo
        photoURL: photoURL,
        // Company info
        company: formData.company,
        jobTitle: formData.jobTitle,
        // Bio and social
        bio: formData.bio,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        website: formData.website,
        // Wallet address (if connected)
        walletAddress: walletAddress || '',
        // Status
        profileCompleted: true,
        onboardingStep: walletAddress ? 'kyc' : 'wallet',
        onboarding_state: walletAddress ? 'KYC_PENDING' : 'WALLET_PENDING',
        // KYC/KYB status - set to not_submitted so user can complete KYC
        kycStatus: 'not_submitted',
        kyc_status: 'not_submitted', // Support both naming conventions
        kybStatus: 'SKIPPED',
        kyb_status: 'SKIPPED', // Support both naming conventions
        lastUpdated: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log('✅ Profile saved successfully');

      // Send registration confirmation email
      try {
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || user.email,
          company: formData.company,
          jobTitle: formData.jobTitle,
        };

        // Call API to send registration confirmation email
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'registration',
            userData: userData,
          }),
        });

        if (response.ok) {
          console.log('✅ Registration confirmation email sent');
        } else {
          console.warn('⚠️ Failed to send registration confirmation email');
        }
      } catch (error) {
        console.error('❌ Error sending registration confirmation email:', error);
        // Don't block the flow if email fails
      }

      // If wallet not connected, show wallet connect step
      if (!walletAddress) {
        setShowWalletConnect(true);
        return;
      }

      // Redirect to KYC
      router.push('/founder/kyc');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setError('Permission denied. Please ensure you are logged in correctly.');
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Failed to save profile: ${errorMessage}. Please try again.`);
      }
      setSubmitting(false);
    }
  };

  // Show loading while auth is loading or while checking existing profile
  if (isLoading || loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat pb-12 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-cyan-600/40 to-blue-600/40 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/40 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Founder Registration</h1>
            <p className="text-white/70">Complete your profile to get started</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-white/70 text-sm mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                />
              </div>

              <div className="mt-4">
                <label className="block text-white/70 text-sm mb-2">
                  <PhoneIcon className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                />
              </div>

              <div className="mt-4">
                <label className="block text-white/70 text-sm mb-2">
                  <PhotoIcon className="w-4 h-4 inline mr-1" />
                  Profile Photo (Optional)
                </label>
                {photoURL ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500/50">
                      <Image
                        src={photoURL}
                        alt="Profile"
                        fill
                        className="object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          console.error('Image load error:', e);
                          // Fallback to a placeholder if image fails to load
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Photo uploaded</p>
                      <label className="text-cyan-400 hover:text-cyan-300 text-sm cursor-pointer">
                        Change photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhoto}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-cyan-400/50 transition-colors bg-white/5">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 text-white/60 mb-2" />
                      <p className="text-sm text-white/70">Click to upload photo</p>
                      <p className="text-xs text-white/50 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
                {uploadingPhoto && (
                  <div className="mt-2 text-center">
                    <p className="text-white/70 text-sm">Uploading photo...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <BriefcaseIcon className="w-5 h-5 mr-2" />
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-white/70 text-sm mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-4">Social Links (Optional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Twitter</label>
                  <input
                    type="url"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                    placeholder="https://twitter.com/yourname"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400 focus:bg-white/15"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Wallet Connection Section */}
            {showWalletConnect && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
                <h3 className="text-white font-semibold mb-4">Connect Your Wallet</h3>
                <BinanceWalletConnect
                  onWalletConnected={async (address) => {
                    setWalletAddress(address);
                    // Save wallet address to user profile
                    try {
                      const dbInstance = ensureDb();
                      if (dbInstance && user) {
                        await setDoc(
                          doc(dbInstance, 'users', user.uid),
                          {
                            walletAddress: address,
                            onboardingStep: 'kyc',
                            onboarding_state: 'KYC_PENDING',
                            updatedAt: new Date()
                          },
                          { merge: true }
                        );
                      }
                      // Redirect to KYC after wallet connection
                      setTimeout(() => {
                        router.push('/founder/kyc');
                      }, 1000);
                    } catch (err) {
                      console.error('Error saving wallet address:', err);
                    }
                  }}
                  onError={(error) => setError(error)}
                  required={true}
                />
              </div>
            )}

            {/* Submit Button */}
            {!showWalletConnect && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? 'Saving...' : walletAddress ? 'Continue to KYC Verification' : 'Save Profile & Connect Wallet'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
