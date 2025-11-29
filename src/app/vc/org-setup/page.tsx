"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { db, doc, setDoc, getDoc, storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase.client';
import { 
  BuildingOffice2Icon,
  PhotoIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function VCOrgSetupPage() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    orgName: '',
    orgType: 'venture_capital',
    website: '',
    description: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated or not VC
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && claims?.role !== 'vc') {
      router.push('/role');
    }
  }, [user, claims, isLoading, router]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSubmitting(true);
    setError('');

    try {
      let logoUrl = '';

      // Upload logo if provided
      if (logoFile && storage) {
        const logoRef = ref(storage, `org-logos/${user.uid}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Create organization data
      const orgData = {
        ...formData,
        logoUrl,
        ownerId: user.uid,
        ownerEmail: user.email,
        members: [user.uid],
        createdAt: new Date().toISOString(),
        status: 'pending_kyb',
      };

      // Save to Firestore
      const orgRef = doc(db!, 'orgs', `vc_${user.uid}`);
      await setDoc(orgRef, orgData);

      // Update user profile
      const userRef = doc(db!, 'users', user.uid);
      await setDoc(userRef, {
        orgId: `vc_${user.uid}`,
        orgName: formData.orgName,
        orgSetupComplete: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Redirect to KYB
      router.push('/vc/kyb');
    } catch (err: any) {
      console.error('Error setting up organization:', err);
      setError(err.message || 'Failed to setup organization');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user || claims?.role !== 'vc') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <BuildingOffice2Icon className="mx-auto h-16 w-16 text-cyan-400 mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Setup Your Organization</h1>
          <p className="text-gray-300 text-lg">
            Tell us about your VC firm to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
                1
              </div>
              <span className="ml-2 text-cyan-400 font-medium">Organization</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                2
              </div>
              <span className="ml-2 text-gray-400">KYB</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                3
              </div>
              <span className="ml-2 text-gray-400">Approval</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                4
              </div>
              <span className="ml-2 text-gray-400">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Logo */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Organization Logo
              </label>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-lg object-cover border-2 border-cyan-500"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-600">
                      <PhotoIcon className="h-12 w-12 text-gray-500" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                    <PhotoIcon className="h-5 w-5 mr-2" />
                    Upload Logo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Recommended: Square image, at least 400x400px
              </p>
            </div>

            {/* Organization Name */}
            <div>
              <label htmlFor="orgName" className="block text-white text-sm font-medium mb-2">
                Organization Name *
              </label>
              <input
                id="orgName"
                type="text"
                required
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="e.g., Sequoia Capital, Andreessen Horowitz"
              />
            </div>

            {/* Organization Type */}
            <div>
              <label htmlFor="orgType" className="block text-white text-sm font-medium mb-2">
                Organization Type *
              </label>
              <select
                id="orgType"
                required
                value={formData.orgType}
                onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="venture_capital">Venture Capital</option>
                <option value="private_equity">Private Equity</option>
                <option value="family_office">Family Office</option>
                <option value="hedge_fund">Hedge Fund</option>
                <option value="investment_fund">Investment Fund</option>
                <option value="corporate_venture">Corporate Venture Capital</option>
              </select>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-white text-sm font-medium mb-2">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="https://your-vc-firm.com"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-white text-sm font-medium mb-2">
                About Your Organization
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Brief description of your investment focus and philosophy..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.orgName}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to KYB</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Next Steps Info */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
            What happens next?
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">1.</span>
              <span>Complete KYB (Know Your Business) verification</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">2.</span>
              <span>RaftAI will analyze your submission</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">3.</span>
              <span>Admin will review and approve your account</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">4.</span>
              <span>Access full VC Dashboard and start investing!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

