"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  StarIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
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

export default function ManagePlacementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotlightId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [placementData, setPlacementData] = useState({
    position: 'featured' as 'hero' | 'featured' | 'trending' | 'new' | 'custom',
    order: 0,
    duration: 30,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    customPosition: {
      x: 0,
      y: 0,
      width: 300,
      height: 200
    }
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
      
      if (!db) {
        console.error('Database not available');
        return;
      }
      
      const { doc, getDoc } = await import('firebase/firestore');
      const spotlightDoc = await getDoc(doc(db!, 'spotlights', spotlightId));
      
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
        setPlacementData({
          position: spotlightData.placement?.position || 'hero',
          order: spotlightData.placement?.order || 1,
          duration: spotlightData.placement?.duration || 7,
          startDate: spotlightData.placement?.startDate ? new Date(spotlightData.placement.startDate) : new Date(),
          endDate: spotlightData.placement?.endDate ? new Date(spotlightData.placement.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          customPosition: spotlightData.placement?.customPosition || { x: 0, y: 0, width: 100, height: 100 }
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

  const handleSavePlacement = async () => {
    if (!spotlightId) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving placement data...');
      
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
        placement: placementData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Placement saved successfully');
      
      // Show success message and redirect
      alert('Placement updated successfully!');
      router.push('/admin/spotlights');
    } catch (error) {
      console.error('❌ Error saving placement:', error);
      alert('Error saving placement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPositionDescription = (position: string) => {
    switch (position) {
      case 'hero': return 'Top of the homepage - maximum visibility';
      case 'featured': return 'Featured projects section - high visibility';
      case 'trending': return 'Trending projects section - good visibility';
      case 'new': return 'New projects section - moderate visibility';
      case 'custom': return 'Custom position - precise control';
      default: return 'Standard placement';
    }
  };

  const getPositionPrice = (position: string) => {
    switch (position) {
      case 'hero': return 5000;
      case 'featured': return 3000;
      case 'trending': return 2000;
      case 'new': return 1000;
      case 'custom': return 4000;
      default: return 1000;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading placement management..." />
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
                <AdjustmentsHorizontalIcon className="w-8 h-8 text-purple-400" />
                Manage Placement
              </h1>
              <p className="text-gray-400 mt-2">Configure spotlight placement and positioning</p>
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

        {/* Placement Configuration */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPinIcon className="w-6 h-6 text-blue-400" />
            Placement Configuration
          </h3>

          <div className="space-y-6">
            {/* Position Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Position Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['hero', 'featured', 'trending', 'new', 'custom'].map((position) => (
                  <div
                    key={position}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      placementData.position === position
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setPlacementData({
                      ...placementData,
                      position: position as any,
                      customPosition: position === 'custom' ? placementData.customPosition : { x: 0, y: 0, width: 100, height: 100 }
                    })}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white capitalize">{position}</h4>
                      <span className="text-sm text-gray-400">${getPositionPrice(position).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-400">{getPositionDescription(position)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  value={placementData.order}
                  onChange={(e) => setPlacementData({
                    ...placementData,
                    order: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
                <input
                  type="number"
                  value={placementData.duration}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value) || 30;
                    setPlacementData({
                      ...placementData,
                      duration,
                      endDate: new Date(placementData.startDate.getTime() + duration * 24 * 60 * 60 * 1000)
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="30"
                />
                <p className="text-xs text-gray-400 mt-1">How long the spotlight will be active</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={placementData.startDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const startDate = new Date(e.target.value);
                    setPlacementData({
                      ...placementData,
                      startDate,
                      endDate: new Date(startDate.getTime() + placementData.duration * 24 * 60 * 60 * 1000)
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={placementData.endDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const endDate = new Date(e.target.value);
                    const duration = Math.ceil((endDate.getTime() - placementData.startDate.getTime()) / (24 * 60 * 60 * 1000));
                    setPlacementData({
                      ...placementData,
                      endDate,
                      duration: Math.max(1, duration)
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Custom Position Controls */}
            {placementData.position === 'custom' && (
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-400" />
                  Custom Position Settings
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">X Position (px)</label>
                    <input
                      type="number"
                      value={placementData.customPosition.x}
                      onChange={(e) => setPlacementData({
                        ...placementData,
                        customPosition: {
                          ...placementData.customPosition,
                          x: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Y Position (px)</label>
                    <input
                      type="number"
                      value={placementData.customPosition.y}
                      onChange={(e) => setPlacementData({
                        ...placementData,
                        customPosition: {
                          ...placementData.customPosition,
                          y: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (px)</label>
                    <input
                      type="number"
                      value={placementData.customPosition.width}
                      onChange={(e) => setPlacementData({
                        ...placementData,
                        customPosition: {
                          ...placementData.customPosition,
                          width: parseInt(e.target.value) || 300
                        }
                      })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Height (px)</label>
                    <input
                      type="number"
                      value={placementData.customPosition.height}
                      onChange={(e) => setPlacementData({
                        ...placementData,
                        customPosition: {
                          ...placementData.customPosition,
                          height: parseInt(e.target.value) || 200
                        }
                      })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                Pricing Summary
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Position: <span className="text-white font-medium capitalize">{placementData.position}</span></p>
                  <p className="text-gray-400">Duration: <span className="text-white font-medium">{placementData.duration} days</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">${getPositionPrice(placementData.position).toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSavePlacement}
            disabled={isSaving}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Save Placement
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
