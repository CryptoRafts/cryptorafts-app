"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  StarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  ChartBarIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CogIcon,
  TrashIcon,
  PencilIcon
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
  logo?: string;
  banner?: string;
  category: string;
  priority: number;
  placement: {
    position: 'hero' | 'featured' | 'trending' | 'new' | 'custom';
    order: number;
    duration: number; // days
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

export default function AdminSpotlightsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [filteredSpotlights, setFilteredSpotlights] = useState<Spotlight[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [selectedSpotlight, setSelectedSpotlight] = useState<Spotlight | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    totalRevenue: 0,
    averageCtr: 0
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
                setupRealtimeUpdates();
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
  }, [router]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...spotlights];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(spotlight => 
        spotlight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.founderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(spotlight => spotlight.status === statusFilter);
    }

    // Placement filter
    if (placementFilter !== 'all') {
      filtered = filtered.filter(spotlight => spotlight.placement.position === placementFilter);
    }

    setFilteredSpotlights(filtered);
  }, [spotlights, searchTerm, statusFilter, placementFilter]);

  const setupRealtimeUpdates = async () => {
    try {
      console.log('🔄 Setting up real-time spotlight updates...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        return;
      }
      
      const { onSnapshot, collection, query, orderBy } = await import('firebase/firestore');
      
      // Listen for spotlight changes
      const spotlightsUnsubscribe = onSnapshot(
        query(collection(dbInstance, 'spotlights'), orderBy('createdAt', 'desc')), 
        (snapshot) => {
          console.log('📊 [SPOTLIGHT] Real-time update received:', snapshot.docs.length, 'documents');
          
          const spotlightsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
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
            } as Spotlight;
          });
          
          setSpotlights(spotlightsData);
          
          // Update stats
          const total = spotlightsData.length;
          const active = spotlightsData.filter(s => s.status === 'active').length;
          const pending = spotlightsData.filter(s => s.status === 'pending').length;
          const expired = spotlightsData.filter(s => s.status === 'expired').length;
          const totalRevenue = spotlightsData.reduce((sum, s) => sum + (s.pricing?.amount || 0), 0);
          const averageCtr = spotlightsData.reduce((sum, s) => sum + (s.analytics?.ctr || 0), 0) / total || 0;
          
          setStats({ 
            total, 
            active, 
            pending, 
            expired,
            totalRevenue,
            averageCtr: Math.round(averageCtr * 100) / 100
          });
          
          console.log('✅ [SPOTLIGHT] Real-time updates active -', total, 'spotlights loaded');
        },
        createSnapshotErrorHandler('admin spotlights')
      );

      return () => {
        spotlightsUnsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner', spotlightId: string) => {
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
      await updateDoc(doc(dbInstance, 'spotlights', spotlightId), {
        [type]: mockUrl,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ ${type} uploaded successfully:`, mockUrl);
    } catch (error) {
      console.error(`❌ Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlacementUpdate = async (spotlightId: string, placementData: any) => {
    try {
      console.log('📍 Updating placement for spotlight:', spotlightId);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(dbInstance, 'spotlights', spotlightId), {
        placement: placementData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Placement updated successfully');
    } catch (error) {
      console.error('❌ Error updating placement:', error);
    }
  };

  const handleStatusChange = async (spotlightId: string, newStatus: string) => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      await updateDoc(doc(dbInstance, 'spotlights', spotlightId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Spotlight ${spotlightId} status updated to ${newStatus}`);
      alert(`Spotlight status updated to ${newStatus}!`);
    } catch (error: any) {
      console.error('❌ Error updating spotlight status:', error);
      alert(`Error updating spotlight status: ${error?.message || 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paused': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'paused': return <XCircleIcon className="w-4 h-4" />;
      case 'expired': return <ClockIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPlacementColor = (position: string) => {
    switch (position) {
      case 'hero': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'featured': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'trending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'new': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'custom': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading spotlight management..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <StarIcon className="w-8 h-8 text-yellow-400" />
              Spotlight Management
            </h1>
            <p className="text-gray-400 mt-2">Manage project spotlights with complete placement control</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Avg CTR</p>
              <p className="text-2xl font-bold text-white">{stats.averageCtr}%</p>
            </div>
            <button
              onClick={() => router.push('/admin/add-spotlight')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Spotlight
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Spotlights</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active</p>
                <p className="text-white text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Expired</p>
                <p className="text-white text-2xl font-bold">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search spotlights by title, project, founder, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Placement Filter */}
            <select
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="all">All Placements</option>
              <option value="hero">Hero Section</option>
              <option value="featured">Featured</option>
              <option value="trending">Trending</option>
              <option value="new">New Projects</option>
              <option value="custom">Custom Position</option>
            </select>
          </div>

          {searchTerm && (
            <p className="mt-3 text-sm text-gray-400">
              Showing {filteredSpotlights.length} of {spotlights.length} spotlights
            </p>
          )}
        </div>

        {/* Spotlights List */}
        <div className="space-y-4">
          {filteredSpotlights.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
              <StarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'No spotlights match your search' : 'No spotlights found'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'No spotlight submissions have been made yet.'}
              </p>
            </div>
          ) : (
            filteredSpotlights.map((spotlight) => (
              <div key={spotlight.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {spotlight.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(spotlight.status)}`}>
                        {getStatusIcon(spotlight.status)}
                        {spotlight.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getPlacementColor(spotlight.placement.position)}`}>
                        <MapPinIcon className="w-4 h-4" />
                        {spotlight.placement.position.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Project</p>
                        <p className="text-white font-medium">{spotlight.projectName}</p>
                        <p className="text-gray-400 text-sm">{spotlight.founderName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Pricing</p>
                        <p className="text-white font-medium">${spotlight.pricing.amount.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">{spotlight.pricing.type.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Duration</p>
                        <p className="text-white font-medium">{spotlight.placement.duration} days</p>
                        <p className="text-gray-400 text-sm">
                          {spotlight.placement.startDate?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Analytics</p>
                        <p className="text-white font-medium">{spotlight.analytics.views.toLocaleString()} views</p>
                        <p className="text-gray-400 text-sm">{spotlight.analytics.ctr}% CTR</p>
                      </div>
                    </div>

                    {/* Media Assets */}
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-purple-400" />
                        Media Assets
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Logo Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Logo (PNG)</label>
                          <div className="flex items-center gap-2">
                            {spotlight.logo ? (
                              <img src={spotlight.logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                <PhotoIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, 'logo', spotlight.id);
                                }
                              }}
                              className="hidden"
                              id={`logo-${spotlight.id}`}
                            />
                            <label
                              htmlFor={`logo-${spotlight.id}`}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                            >
                              {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        </div>

                        {/* Banner Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Banner</label>
                          <div className="flex items-center gap-2">
                            {spotlight.banner ? (
                              <img src={spotlight.banner} alt="Banner" className="w-16 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-16 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                <PhotoIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, 'banner', spotlight.id);
                                }
                              }}
                              className="hidden"
                              id={`banner-${spotlight.id}`}
                            />
                            <label
                              htmlFor={`banner-${spotlight.id}`}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                            >
                              {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        </div>

                        {/* Featured Image */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Featured Image</label>
                          <div className="flex items-center gap-2">
                            {spotlight.logo ? (
                              <img src={spotlight.logo} alt="Logo" className="w-16 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-16 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                <PhotoIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, 'logo', spotlight.id);
                                }
                              }}
                              className="hidden"
                              id={`featured-${spotlight.id}`}
                            />
                            <label
                              htmlFor={`featured-${spotlight.id}`}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
                            >
                              {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {spotlight.tags && spotlight.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {spotlight.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => window.open(`/admin/manage-placement?id=${spotlight.id}`, '_blank')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      Manage Placement
                    </button>
                    
                    <button
                      onClick={() => window.open(`/admin/edit-details?id=${spotlight.id}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Details
                    </button>
                    
                    {spotlight.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(spotlight.id, 'active')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleStatusChange(spotlight.id, 'rejected')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {spotlight.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(spotlight.id, 'paused')}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}