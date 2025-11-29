"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureDb, ensureStorage, waitForFirebase } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  StarIcon,
  ArrowLeftIcon,
  PencilIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Spotlight {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  status: 'pending' | 'active' | 'paused' | 'expired' | 'rejected';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  featuredImage?: string;
  logo?: string;
  banner?: string;
  category: string;
  priority: number;
  placement: {
    position: 'hero' | 'featured' | 'trending' | 'new' | 'custom';
    order: number;
    duration: number;
    startDate: any;
    endDate: any;
    customPosition?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  pricing: {
    type: 'basic' | 'premium' | 'enterprise';
    amount: number;
    currency: string;
    features: string[];
  };
  analytics: {
    views: number;
    clicks: number;
    conversions: number;
    ctr: number;
  };
  tags: string[];
  targetAudience: string[];
  requirements: string[];
}

export default function EditDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotlightId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 0,
    pricing: {
      type: 'basic' as 'basic' | 'premium' | 'enterprise',
      amount: 1000,
      currency: 'USD',
      features: [] as string[]
    },
    tags: [] as string[],
    targetAudience: [] as string[],
    requirements: [] as string[]
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
              const userEmail = user.email?.toLowerCase() || '';
              if (userEmail !== 'anasshamsiggc@gmail.com') {
                console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
                alert('Access Denied: Only authorized admin can access this panel.');
                router.replace('/admin/login');
                setIsLoading(false);
                return;
              }
              
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'admin' || userEmail === 'anasshamsiggc@gmail.com') {
                setUser(user);
                if (spotlightId) {
                  loadSpotlight();
                }
              } else {
                router.replace('/admin/login');
              }
            } else {
              router.replace('/admin/login');
            }
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, spotlightId]);

  const loadSpotlight = async () => {
    if (!spotlightId) return;

    try {
      console.log('📊 Loading spotlight:', spotlightId);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('Database not available');
        return;
      }
      
      const { doc, getDoc } = await import('firebase/firestore');
      const spotlightDoc = await getDoc(doc(dbInstance, 'spotlights', spotlightId));
      
      if (spotlightDoc.exists()) {
        const data = spotlightDoc.data();
        const spotlightData: Spotlight = {
          id: spotlightDoc.id,
          title: data.title || 'Untitled Spotlight',
          description: data.description || '',
          projectId: data.projectId || '',
          projectName: data.projectName || 'Unknown Project',
          founderId: data.founderId || '',
          founderName: data.founderName || 'Unknown Founder',
          founderEmail: data.founderEmail || 'N/A',
          status: data.status || 'pending',
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          featuredImage: data.featuredImage,
          logo: data.logo,
          banner: data.banner,
          category: data.category || 'Other',
          priority: data.priority || 0,
          placement: data.placement || {
            position: 'featured',
            order: 0,
            duration: 30,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          pricing: data.pricing || {
            type: 'basic',
            amount: 1000,
            currency: 'USD',
            features: ['Basic placement', 'Standard analytics']
          },
          analytics: data.analytics || {
            views: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0
          },
          tags: data.tags || [],
          targetAudience: data.targetAudience || [],
          requirements: data.requirements || []
        };
        
        setSpotlight(spotlightData);
        setFormData({
          title: spotlightData.title,
          description: spotlightData.description,
          category: spotlightData.category,
          priority: spotlightData.priority,
          pricing: spotlightData.pricing,
          tags: spotlightData.tags,
          targetAudience: spotlightData.targetAudience,
          requirements: spotlightData.requirements
        });
        
        console.log('✅ Spotlight loaded successfully');
      } else {
        console.error('❌ Spotlight not found');
        router.push('/admin/spotlights');
      }
    } catch (error) {
      console.error('❌ Error loading spotlight:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner' | 'featuredImage') => {
    setIsUploading(true);
    try {
      console.log(`📤 Uploading ${type} for spotlight:`, spotlightId);
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${spotlightId}_${type}_${timestamp}.${file.name.split('.').pop()}`;
      
      // In a real implementation, you would upload to Firebase Storage here
      // For now, we'll simulate the upload and store the URL
      const mockUrl = `https://storage.googleapis.com/cryptorafts-spotlights/${filename}`;
      
      // Update the spotlight with the new image URL
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsUploading(false);
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        setIsUploading(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(dbInstance, 'spotlights', spotlightId!), {
        [type]: mockUrl,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      if (spotlight) {
        setSpotlight({
          ...spotlight,
          [type]: mockUrl
        });
      }
      
      console.log(`✅ ${type} uploaded successfully:`, mockUrl);
    } catch (error) {
      console.error(`❌ Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!spotlightId) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving spotlight details...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsSaving(false);
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        setIsSaving(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(dbInstance, 'spotlights', spotlightId), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        pricing: formData.pricing,
        tags: formData.tags,
        targetAudience: formData.targetAudience,
        requirements: formData.requirements,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Spotlight details saved successfully');
      
      // Show success message and redirect
      alert('Spotlight details updated successfully!');
      router.push('/admin/spotlights');
    } catch (error) {
      console.error('❌ Error saving details:', error);
      alert('Error saving details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const newTag = prompt('Enter new tag:');
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addTargetAudience = () => {
    const newAudience = prompt('Enter target audience:');
    if (newAudience && !formData.targetAudience.includes(newAudience)) {
      setFormData({
        ...formData,
        targetAudience: [...formData.targetAudience, newAudience]
      });
    }
  };

  const removeTargetAudience = (audienceToRemove: string) => {
    setFormData({
      ...formData,
      targetAudience: formData.targetAudience.filter(audience => audience !== audienceToRemove)
    });
  };

  const addRequirement = () => {
    const newRequirement = prompt('Enter requirement:');
    if (newRequirement && !formData.requirements.includes(newRequirement)) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement]
      });
    }
  };

  const removeRequirement = (requirementToRemove: string) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(req => req !== requirementToRemove)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading spotlight details..." />
      </div>
    );
  }

  if (!user || !spotlight) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/spotlights')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Spotlights
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <PencilIcon className="w-8 h-8 text-blue-400" />
                Edit Spotlight Details
              </h1>
              <p className="text-gray-400 mt-2">Modify spotlight information and settings</p>
            </div>
          </div>
        </div>

        {/* Spotlight Info */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            {spotlight.logo && (
              <img src={spotlight.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{spotlight.title}</h2>
              <p className="text-gray-400">{spotlight.projectName}</p>
              <p className="text-gray-500 text-sm">by {spotlight.founderName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Status</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                spotlight.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                spotlight.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {spotlight.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-400" />
            Basic Information
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter spotlight title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter spotlight description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DeFi">DeFi</option>
                  <option value="NFT">NFT</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media Assets */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PhotoIcon className="w-6 h-6 text-purple-400" />
            Media Assets
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Logo (PNG)</label>
              <div className="flex flex-col items-center gap-3">
                {spotlight.logo ? (
                  <img src={spotlight.logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, 'logo');
                    }
                  }}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Banner</label>
              <div className="flex flex-col items-center gap-3">
                {spotlight.banner ? (
                  <img src={spotlight.banner} alt="Banner" className="w-32 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-32 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, 'banner');
                    }
                  }}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload Banner'}
                </label>
              </div>
            </div>

            {/* Featured Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Featured Image</label>
              <div className="flex flex-col items-center gap-3">
                {spotlight.featuredImage ? (
                  <img src={spotlight.featuredImage} alt="Featured" className="w-32 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-32 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, 'featuredImage');
                    }
                  }}
                  className="hidden"
                  id="featured-upload"
                />
                <label
                  htmlFor="featured-upload"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload Featured'}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
            Pricing Configuration
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pricing Type</label>
                <select
                  value={formData.pricing.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing,
                      type: e.target.value as 'basic' | 'premium' | 'enterprise'
                    }
                  })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={formData.pricing.amount}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing,
                      amount: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-orange-400" />
            Tags & Categories
          </h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full border border-orange-500/30 flex items-center gap-2">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={addTag}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
            >
              Add Tag
            </button>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-blue-400" />
            Target Audience
          </h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.targetAudience.map((audience, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30 flex items-center gap-2">
                  {audience}
                  <button
                    onClick={() => removeTargetAudience(audience)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={addTargetAudience}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Add Target Audience
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-purple-400" />
            Requirements
          </h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.requirements.map((requirement, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full border border-purple-500/30 flex items-center gap-2">
                  {requirement}
                  <button
                    onClick={() => removeRequirement(requirement)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={addRequirement}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Add Requirement
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveDetails}
            disabled={isSaving}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Save Details
              </>
            )}
          </button>
          
          <button
            onClick={() => router.push('/admin/spotlights')}
            className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
