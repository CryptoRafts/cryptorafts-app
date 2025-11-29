"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, setDoc, getDoc, storage } from '@/lib/firebase.client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  CurrencyDollarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

export default function VCOnboardingPage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'vc_firm',
    website: '',
    aum: '',
    investment_focus: '',
    typical_check_size: '',
    preferred_stages: [] as string[],
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    logo_url: ''
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || claims?.role !== 'vc') {
      router.push('/login');
      return;
    }

    checkExistingProfile();
  }, [user, claims, authLoading, router]);

  const checkExistingProfile = async () => {
    if (!user || !db) return;

    try {
      const userDoc = await getDoc(doc(db!, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // If profile completed, redirect to KYB or dashboard
        if (data.profileCompleted) {
          const kybStatus = data.kybStatus || data.kyb?.status || 'pending';
          if (kybStatus === 'approved') {
            router.push('/vc/dashboard');
          } else {
            router.push('/vc/kyb');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user || !storage) return null;

    try {
      setUploadingLogo(true);
      const storageRef = ref(storage, `vc-logos/${user.uid}/${Date.now()}_${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);
      setUploadingLogo(false);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploadingLogo(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Validate required fields
      if (!formData.organization_name || !formData.contact_name || !formData.contact_email) {
        throw new Error('Please fill in all required fields');
      }

      // Upload logo if provided
      let logoUrl = formData.logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Save organization profile
      console.log('💾 Saving VC profile with logo:', logoUrl);
      if (!db) return;
      await setDoc(doc(db!, 'users', user.uid), {
        ...formData,
        logo_url: logoUrl,
        logoUrl: logoUrl, // Also save as logoUrl for consistency
        role: 'vc',
        profileCompleted: true,
        onboardingStep: 'kyb',
        kybStatus: 'not_submitted', // Changed from 'pending' to 'not_submitted'
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log('✅ VC profile saved successfully!');
      console.log('🔐 Redirecting to KYB page...');

      // Redirect to KYB
      window.location.href = '/vc/kyb';

    } catch (error: any) {
      console.error('Error submitting organization profile:', error);
      setError(error.message || 'Failed to save profile');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-blue-background">
      <div className="container-perfect py-12">
        {/* Registration Flow Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-blue-400 font-semibold">Profile Setup</span>
            </div>
            <div className="w-16 h-0.5 bg-white/20"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white/60 font-bold text-sm">2</span>
              </div>
              <span className="text-white/60 font-semibold">KYB Verification</span>
            </div>
            <div className="w-16 h-0.5 bg-white/20"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white/60 font-bold text-sm">3</span>
              </div>
              <span className="text-white/60 font-semibold">Dashboard Access</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            VC Organization Setup
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Tell us about your venture capital organization
          </p>
        </div>

        {/* Organization Form */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="neo-glass-card rounded-2xl p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Organization Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <BuildingOfficeIcon className="w-6 h-6 mr-2 text-blue-400" />
                Organization Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Organization Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Ventures"
                    required
                  />
                </div>

                {/* Company Logo Upload */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Logo Preview */}
                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Company Logo Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="w-10 h-10 text-white/40" />
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                      >
                        <PhotoIcon className="w-5 h-5" />
                        <span className="font-medium">Upload Logo</span>
                      </label>
                      <p className="text-white/50 text-xs mt-2">
                        Recommended: Square image, PNG or JPG, max 5MB
                      </p>
                      {uploadingLogo && (
                        <p className="text-blue-400 text-xs mt-2 flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Uploading logo...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Organization Type
                  </label>
                  <select
                    value={formData.organization_type}
                    onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vc_firm">VC Firm</option>
                    <option value="angel_investor">Angel Investor</option>
                    <option value="crypto_fund">Crypto Fund</option>
                    <option value="family_office">Family Office</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      AUM (Assets Under Management)
                    </label>
                    <input
                      type="text"
                      value={formData.aum}
                      onChange={(e) => setFormData({ ...formData, aum: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="$50M"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Investment Focus
                  </label>
                  <textarea
                    value={formData.investment_focus}
                    onChange={(e) => setFormData({ ...formData, investment_focus: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., DeFi, NFTs, Layer 2 solutions..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Typical Check Size
                  </label>
                  <input
                    type="text"
                    value={formData.typical_check_size}
                    onChange={(e) => setFormData({ ...formData, typical_check_size: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$100K - $1M"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-green-400" />
                Primary Contact
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Contact Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Title/Position
                    </label>
                    <input
                      type="text"
                      value={formData.contact_title}
                      onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Partner"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <AnimatedButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                loading={isLoading}
                icon={<BuildingOfficeIcon className="w-5 h-5" />}
              >
                {isLoading ? 'Saving...' : 'Continue to KYB'}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
