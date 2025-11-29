"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AnalyticsData {
  users: {
    total: number;
    founders: number;
    investors: number;
    admins: number;
    active: number;
    pending: number;
    suspended: number;
    growth: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
    totalFunding: number;
    averageFunding: number;
    growth: number;
  };
  kyc: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
    averageProcessingTime: number;
  };
  kyb: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
    averageProcessingTime: number;
  };
  spotlights: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    totalRevenue: number;
    averageCtr: number;
    totalViews: number;
    totalClicks: number;
  };
  departments: {
    total: number;
    active: number;
    totalMembers: number;
    totalBudget: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    sources: {
      spotlights: number;
      fees: number;
      subscriptions: number;
      other: number;
    };
  };
  performance: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionTime: number;
    conversionRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    users: { total: 0, founders: 0, investors: 0, admins: 0, active: 0, pending: 0, suspended: 0, growth: 0 },
    projects: { total: 0, active: 0, pending: 0, approved: 0, rejected: 0, totalFunding: 0, averageFunding: 0, growth: 0 },
    kyc: { total: 0, approved: 0, pending: 0, rejected: 0, approvalRate: 0, averageProcessingTime: 0 },
    kyb: { total: 0, approved: 0, pending: 0, rejected: 0, approvalRate: 0, averageProcessingTime: 0 },
    spotlights: { total: 0, active: 0, pending: 0, expired: 0, totalRevenue: 0, averageCtr: 0, totalViews: 0, totalClicks: 0 },
    departments: { total: 0, active: 0, totalMembers: 0, totalBudget: 0 },
    revenue: { total: 0, monthly: 0, growth: 0, sources: { spotlights: 0, fees: 0, subscriptions: 0, other: 0 } },
    performance: { pageViews: 0, uniqueVisitors: 0, bounceRate: 0, averageSessionTime: 0, conversionRate: 0 }
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
                loadAnalyticsData();
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

  const loadAnalyticsData = async () => {
    try {
      console.log('📊 Loading comprehensive analytics data...');
      
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
      
      const { getDocs, collection, query, where, orderBy } = await import('firebase/firestore');
      
      // Load all collections in parallel
      const [
        usersSnapshot,
        projectsSnapshot,
        kycSnapshot,
        kybSnapshot,
        spotlightsSnapshot,
        departmentsSnapshot
      ] = await Promise.all([
        getDocs(collection(dbInstance, 'users')),
        getDocs(collection(dbInstance, 'projects')),
        getDocs(collection(dbInstance, 'kyc_documents')),
        getDocs(collection(dbInstance, 'organizations')),
        getDocs(collection(dbInstance, 'spotlights')),
        getDocs(collection(dbInstance, 'departments'))
      ]);

      // Process users data
      const usersData = usersSnapshot.docs.map(doc => doc.data());
      // Calculate real growth: compare current month vs previous month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const currentMonthUsers = usersData.filter(u => {
        const createdAt = u.createdAt?.toDate?.() || (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt));
        return createdAt >= currentMonthStart;
      }).length;
      const previousMonthUsers = usersData.filter(u => {
        const createdAt = u.createdAt?.toDate?.() || (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt));
        return createdAt >= previousMonthStart && createdAt < currentMonthStart;
      }).length;
      const userGrowth = previousMonthUsers > 0 ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100 : 0;
      
      const users = {
        total: usersData.length,
        founders: usersData.filter(u => u.role === 'founder').length,
        investors: usersData.filter(u => u.role === 'investor' || u.role === 'vc').length,
        admins: usersData.filter(u => u.role === 'admin').length,
        active: usersData.filter(u => u.status === 'active' || u.isActive !== false).length,
        pending: usersData.filter(u => u.status === 'pending').length,
        suspended: usersData.filter(u => u.status === 'suspended').length,
        growth: Math.round(userGrowth * 10) / 10 // Real growth percentage
      };

      // Process projects data
      const projectsData = projectsSnapshot.docs.map(doc => doc.data());
      // Calculate real growth: compare current month vs previous month
      const currentMonthProjects = projectsData.filter(p => {
        const createdAt = p.createdAt?.toDate?.() || (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt));
        return createdAt >= currentMonthStart;
      }).length;
      const previousMonthProjects = projectsData.filter(p => {
        const createdAt = p.createdAt?.toDate?.() || (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt));
        return createdAt >= previousMonthStart && createdAt < currentMonthStart;
      }).length;
      const projectGrowth = previousMonthProjects > 0 ? ((currentMonthProjects - previousMonthProjects) / previousMonthProjects) * 100 : 0;
      
      const projects = {
        total: projectsData.length,
        active: projectsData.filter(p => p.status === 'active' || p.status === 'live').length,
        pending: projectsData.filter(p => p.status === 'pending').length,
        approved: projectsData.filter(p => p.status === 'approved').length,
        rejected: projectsData.filter(p => p.status === 'rejected').length,
        totalFunding: projectsData.reduce((sum, p) => sum + (parseFloat(p.currentFunding) || 0), 0),
        averageFunding: projectsData.length > 0 ? projectsData.reduce((sum, p) => sum + (parseFloat(p.currentFunding) || 0), 0) / projectsData.length : 0,
        growth: Math.round(projectGrowth * 10) / 10 // Real growth percentage
      };

      // Process KYC data
      const kycData = kycSnapshot.docs.map(doc => doc.data());
      // Calculate real average processing time from reviewed documents
      const reviewedKyc = kycData.filter(k => k.reviewedAt && (k.status === 'approved' || k.status === 'rejected'));
      const processingTimes = reviewedKyc.map(k => {
        const submitted = k.submittedAt?.toDate?.() || (k.submittedAt instanceof Date ? k.submittedAt : new Date(k.submittedAt));
        const reviewed = k.reviewedAt?.toDate?.() || (k.reviewedAt instanceof Date ? k.reviewedAt : new Date(k.reviewedAt));
        const diffMs = reviewed.getTime() - submitted.getTime();
        return diffMs / (1000 * 60 * 60 * 24); // Convert to days
      }).filter(t => t > 0 && t < 365); // Filter out invalid dates
      const avgProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length 
        : 0;
      
      const kyc = {
        total: kycData.length,
        approved: kycData.filter(k => k.status === 'approved').length,
        pending: kycData.filter(k => k.status === 'pending').length,
        rejected: kycData.filter(k => k.status === 'rejected').length,
        approvalRate: kycData.length > 0 ? (kycData.filter(k => k.status === 'approved').length / kycData.length) * 100 : 0,
        averageProcessingTime: Math.round(avgProcessingTime * 10) / 10 // Real processing time in days
      };

      // Process KYB data
      const kybData = kybSnapshot.docs.map(doc => doc.data());
      // Calculate real average processing time from reviewed documents
      const reviewedKyb = kybData.filter(k => k.reviewedAt && (k.kybStatus === 'approved' || k.kybStatus === 'rejected'));
      const kybProcessingTimes = reviewedKyb.map(k => {
        const submitted = k.submittedAt?.toDate?.() || (k.submittedAt instanceof Date ? k.submittedAt : new Date(k.submittedAt));
        const reviewed = k.reviewedAt?.toDate?.() || (k.reviewedAt instanceof Date ? k.reviewedAt : new Date(k.reviewedAt));
        const diffMs = reviewed.getTime() - submitted.getTime();
        return diffMs / (1000 * 60 * 60 * 24); // Convert to days
      }).filter(t => t > 0 && t < 365); // Filter out invalid dates
      const avgKybProcessingTime = kybProcessingTimes.length > 0 
        ? kybProcessingTimes.reduce((sum, t) => sum + t, 0) / kybProcessingTimes.length 
        : 0;
      
      const kyb = {
        total: kybData.length,
        approved: kybData.filter(k => k.kybStatus === 'approved').length,
        pending: kybData.filter(k => k.kybStatus === 'pending').length,
        rejected: kybData.filter(k => k.kybStatus === 'rejected').length,
        approvalRate: kybData.length > 0 ? (kybData.filter(k => k.kybStatus === 'approved').length / kybData.length) * 100 : 0,
        averageProcessingTime: Math.round(avgKybProcessingTime * 10) / 10 // Real processing time in days
      };

      // Process spotlights data
      const spotlightsData = spotlightsSnapshot.docs.map(doc => doc.data());
      const spotlights = {
        total: spotlightsData.length,
        active: spotlightsData.filter(s => s.status === 'active').length,
        pending: spotlightsData.filter(s => s.status === 'pending').length,
        expired: spotlightsData.filter(s => s.status === 'expired').length,
        totalRevenue: spotlightsData.reduce((sum, s) => sum + (s.pricing?.amount || 0), 0),
        averageCtr: spotlightsData.length > 0 ? spotlightsData.reduce((sum, s) => sum + (s.analytics?.ctr || 0), 0) / spotlightsData.length : 0,
        totalViews: spotlightsData.reduce((sum, s) => sum + (s.analytics?.views || 0), 0),
        totalClicks: spotlightsData.reduce((sum, s) => sum + (s.analytics?.clicks || 0), 0)
      };

      // Process departments data
      const departmentsData = departmentsSnapshot.docs.map(doc => doc.data());
      const departments = {
        total: departmentsData.length,
        active: departmentsData.filter(d => d.status === 'active').length,
        totalMembers: departmentsData.reduce((sum, d) => sum + (d.memberCount || 0), 0),
        totalBudget: departmentsData.reduce((sum, d) => sum + (d.budget || 0), 0)
      };

      // Calculate revenue data - REAL DATA ONLY
      // Calculate real growth: compare current month vs previous month revenue
      const currentMonthRevenue = spotlightsData.filter(s => {
        const createdAt = s.createdAt?.toDate?.() || (s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt));
        return createdAt >= currentMonthStart && s.status === 'active';
      }).reduce((sum, s) => sum + (s.pricing?.amount || 0), 0);
      const previousMonthRevenue = spotlightsData.filter(s => {
        const createdAt = s.createdAt?.toDate?.() || (s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt));
        return createdAt >= previousMonthStart && createdAt < currentMonthStart && s.status === 'active';
      }).reduce((sum, s) => sum + (s.pricing?.amount || 0), 0);
      const revenueGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
      
      const revenue = {
        total: spotlights.totalRevenue, // Real revenue from spotlights only
        monthly: spotlights.totalRevenue / 12, // Average monthly revenue
        growth: Math.round(revenueGrowth * 10) / 10, // Real growth percentage
        sources: {
          spotlights: spotlights.totalRevenue,
          fees: 0, // No mock data - calculate from real transactions if available
          subscriptions: 0, // No mock data - calculate from real subscriptions if available
          other: 0 // No mock data
        }
      };

      // Calculate performance metrics - REAL DATA ONLY
      // Use actual analytics data from spotlights and projects if available
      const performance = {
        pageViews: spotlights.totalViews || 0, // Real views from spotlights
        uniqueVisitors: users.total, // Use total users as unique visitors proxy
        bounceRate: 0, // Calculate from real analytics if available
        averageSessionTime: 0, // Calculate from real analytics if available
        conversionRate: projects.total > 0 ? (projects.approved / projects.total) * 100 : 0 // Real conversion rate
      };

      setAnalyticsData({
        users,
        projects,
        kyc,
        kyb,
        spotlights,
        departments,
        revenue,
        performance
      });

      console.log('✅ Analytics data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
    }
  };

  const setupRealtimeUpdates = async () => {
    try {
      console.log('🔄 Setting up real-time analytics updates...');
      
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
      
      // Set up listeners for all collections
      const collections = ['users', 'projects', 'kyc_documents', 'organizations', 'spotlights', 'departments'];
      
      const unsubscribes = collections.map(collectionName => 
        onSnapshot(
          query(collection(dbInstance, collectionName), orderBy('createdAt', 'desc')), 
          () => {
            console.log(`📊 [ANALYTICS] ${collectionName} updated`);
            loadAnalyticsData(); // Reload data when any collection changes
          },
          createSnapshotErrorHandler(`admin analytics ${collectionName}`)
        )
      );

      return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpIcon className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 text-red-400" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-400' : 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading analytics dashboard..." />
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
              <ChartBarIcon className="w-8 h-8 text-blue-400" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Comprehensive platform analytics and insights</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowUpIcon className="w-4 h-4" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-white text-2xl font-bold">{analyticsData.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analyticsData.users.growth)}
                  <span className={`text-sm ${getGrowthColor(analyticsData.users.growth)}`}>
                    {analyticsData.users.growth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Projects</p>
                <p className="text-white text-2xl font-bold">{analyticsData.projects.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analyticsData.projects.growth)}
                  <span className={`text-sm ${getGrowthColor(analyticsData.projects.growth)}`}>
                    {analyticsData.projects.growth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <RocketLaunchIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                <p className="text-white text-2xl font-bold">${(analyticsData.revenue.total / 1000).toFixed(0)}K</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analyticsData.revenue.growth)}
                  <span className={`text-sm ${getGrowthColor(analyticsData.revenue.growth)}`}>
                    {analyticsData.revenue.growth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Conversion Rate</p>
                <p className="text-white text-2xl font-bold">{analyticsData.performance.conversionRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">+2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-blue-400" />
              User Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Founders</p>
                  <p className="text-white text-xl font-bold">{analyticsData.users.founders}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Investors</p>
                  <p className="text-white text-xl font-bold">{analyticsData.users.investors}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Active</p>
                  <p className="text-white text-xl font-bold">{analyticsData.users.active}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-white text-xl font-bold">{analyticsData.users.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6 text-green-400" />
              Project Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Active Projects</p>
                  <p className="text-white text-xl font-bold">{analyticsData.projects.active}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Pending Review</p>
                  <p className="text-white text-xl font-bold">{analyticsData.projects.pending}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Funding</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.projects.totalFunding / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Avg Funding</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.projects.averageFunding / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>
          </div>

          {/* KYC/KYB Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
              KYC/KYB Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">KYC Approved</p>
                  <p className="text-white text-xl font-bold">{analyticsData.kyc.approved}</p>
                  <p className="text-green-400 text-xs">{analyticsData.kyc.approvalRate.toFixed(1)}% rate</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">KYB Approved</p>
                  <p className="text-white text-xl font-bold">{analyticsData.kyb.approved}</p>
                  <p className="text-green-400 text-xs">{analyticsData.kyb.approvalRate.toFixed(1)}% rate</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">KYC Pending</p>
                  <p className="text-white text-xl font-bold">{analyticsData.kyc.pending}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">KYB Pending</p>
                  <p className="text-white text-xl font-bold">{analyticsData.kyb.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spotlight Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              Spotlight Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Active Spotlights</p>
                  <p className="text-white text-xl font-bold">{analyticsData.spotlights.active}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.spotlights.totalRevenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-white text-xl font-bold">{analyticsData.spotlights.totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Avg CTR</p>
                  <p className="text-white text-xl font-bold">{analyticsData.spotlights.averageCtr.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BanknotesIcon className="w-6 h-6 text-green-400" />
              Revenue Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.revenue.monthly / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Spotlight Revenue</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.revenue.sources.spotlights / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Fees Revenue</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.revenue.sources.fees / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Subscriptions</p>
                  <p className="text-white text-xl font-bold">${(analyticsData.revenue.sources.subscriptions / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-orange-400" />
              Performance Analytics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Page Views</p>
                  <p className="text-white text-xl font-bold">{analyticsData.performance.pageViews.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Unique Visitors</p>
                  <p className="text-white text-xl font-bold">{analyticsData.performance.uniqueVisitors.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Bounce Rate</p>
                  <p className="text-white text-xl font-bold">{analyticsData.performance.bounceRate}%</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Avg Session</p>
                  <p className="text-white text-xl font-bold">{analyticsData.performance.averageSessionTime}m</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Analytics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BuildingOffice2Icon className="w-6 h-6 text-indigo-400" />
            Department Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Departments</p>
              <p className="text-white text-2xl font-bold">{analyticsData.departments.total}</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Active Departments</p>
              <p className="text-white text-2xl font-bold">{analyticsData.departments.active}</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Members</p>
              <p className="text-white text-2xl font-bold">{analyticsData.departments.totalMembers}</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Budget</p>
              <p className="text-white text-2xl font-bold">${(analyticsData.departments.totalBudget / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}