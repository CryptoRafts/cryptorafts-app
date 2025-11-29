"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Stat card component - Enhanced with subtitle
const StatCard = ({ title, value, subtitle, iconType, color, link, router, trend, trendValue }: any) => (
  <div 
    className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 hover:scale-105 transition-all cursor-pointer group"
    onClick={() => link && router.push(link)}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg`}>
        <NeonCyanIcon type={iconType} size={28} className="text-white" />
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-green-500/20 text-green-400' : 
            trend === 'down' ? 'bg-red-500/20 text-red-400' : 
            'bg-black/40 text-cyan-400/70 border border-cyan-400/20'
          }`}>
            {trend === 'up' ? <NeonCyanIcon type="arrow-up" size={12} className="text-current" /> : 
             trend === 'down' ? <NeonCyanIcon type="arrow-down" size={12} className="text-current" /> : 
             <NeonCyanIcon type="clock" size={12} className="text-current" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
    <div className="text-white text-4xl font-bold mb-1">{value}</div>
    <div className="text-white/90 text-lg font-semibold mb-1">{title}</div>
    {subtitle && (
      <div className="text-cyan-400/70 text-xs mt-2">{subtitle}</div>
    )}
    <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
      <span>View details</span>
      <NeonCyanIcon type="arrow-right" size={16} className="text-current ml-1" />
    </div>
  </div>
);

// Quick action button component
const QuickActionButton = ({ title, iconType, link, color, router, description }: any) => (
  <button
    onClick={() => router.push(link)}
    className={`${color} text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center gap-3 group`}
  >
    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
      <NeonCyanIcon type={iconType} size={24} className="text-white" />
    </div>
    <div className="text-center">
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  </button>
);

// Recent activity item component
const RecentActivityItem = ({ type, title, time, status, iconType }: any) => (
  <div className="flex items-center gap-4 p-4 bg-black/60 rounded-lg hover:bg-black/80 transition-colors border border-cyan-400/10">
    <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-cyan-400/20">
      <NeonCyanIcon type={iconType} size={20} className="text-cyan-400/70" />
    </div>
    <div className="flex-1">
      <div className="text-white font-medium text-sm">{title}</div>
      <div className="text-cyan-400/70 text-xs">{time}</div>
    </div>
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
      status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
      status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
      'bg-white/10 text-white/80 border border-cyan-400/20'
    }`}>
      {status}
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    approvedKYC: 0,
    rejectedKYC: 0,
    pendingKYB: 0,
    approvedKYB: 0,
    rejectedKYB: 0,
    totalProjects: 0,
    activeProjects: 0,
    pendingProjects: 0,
    activeSpotlights: 0,
    totalDepartments: 0,
    totalFunding: 0,
    recentSignups: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (!auth) {
          setIsLoading(false);
          return;
        }
        
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
              loadDashboardStats();
              // Don't call setupRealtimeUpdates here - it's handled in separate useEffect
            } else {
              router.replace('/admin/login');
            }
          } else {
            router.replace('/admin/login');
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Separate useEffect for real-time updates with proper cleanup
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    let cleanup: (() => void) | undefined;
    
    const initRealtime = async () => {
      try {
        cleanup = await setupRealtimeUpdates();
      } catch (error) {
        console.error('Error initializing real-time updates:', error);
      }
    };
    
    initRealtime();
    
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [user]);

  // Setup real-time updates for admin dashboard
  const setupRealtimeUpdates = async (): Promise<(() => void) | undefined> => {
    try {
      console.log('🔄 Setting up real-time dashboard updates...');
      
      const { ensureDb, waitForFirebase, createSnapshotErrorHandler } = await import('@/lib/firebase-utils');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return undefined;
      }
      
      const firestoreDb = ensureDb();
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        return undefined;
      }
      
      // Dynamic imports to avoid chunk loading errors
      const { collection, onSnapshot, query, where } = await import('firebase/firestore');

      // Listen for user count changes with detailed breakdown
      const usersUnsubscribe = onSnapshot(collection(firestoreDb, 'users'), (snapshot) => {
        console.log('✅ REAL-TIME: Users updated -', snapshot.size, 'total users');
        const users = snapshot.docs.map(doc => doc.data());
        const verifiedUsers = users.filter(u => u.kycStatus === 'approved' || u.kyc_status === 'approved').length;
        const unverifiedUsers = users.filter(u => !u.kycStatus || (u.kycStatus !== 'approved' && u.kyc_status !== 'approved')).length;
        
        setStats(prev => ({ 
          ...prev, 
          totalUsers: snapshot.size,
          verifiedUsers,
          unverifiedUsers
        }));
        setLastUpdated(new Date());
      }, createSnapshotErrorHandler('admin dashboard users'));

      // Listen for KYC status changes - get all statuses
      const kycUnsubscribe = onSnapshot(collection(firestoreDb, 'kyc_documents'), (snapshot) => {
        console.log('✅ REAL-TIME: KYC documents updated -', snapshot.size, 'total KYC documents');
        const docs = snapshot.docs.map(doc => doc.data());
        const pendingKYC = docs.filter(d => d.status === 'pending').length;
        const approvedKYC = docs.filter(d => d.status === 'approved').length;
        const rejectedKYC = docs.filter(d => d.status === 'rejected').length;
        
        setStats(prev => ({ 
          ...prev, 
          pendingKYC,
          approvedKYC,
          rejectedKYC
        }));
        setLastUpdated(new Date());
      }, createSnapshotErrorHandler('admin dashboard KYC'));

      // Listen for KYB status changes - check organizations collection
      const kybUnsubscribe = onSnapshot(collection(firestoreDb, 'organizations'), (snapshot) => {
        console.log('✅ REAL-TIME: KYB organizations updated -', snapshot.size, 'total organizations');
        const docs = snapshot.docs.map(doc => doc.data());
        const pendingKYB = docs.filter(d => d.kybStatus === 'pending').length;
        const approvedKYB = docs.filter(d => d.kybStatus === 'approved').length;
        const rejectedKYB = docs.filter(d => d.kybStatus === 'rejected').length;
        
        setStats(prev => ({ 
          ...prev, 
          pendingKYB,
          approvedKYB,
          rejectedKYB
        }));
        setLastUpdated(new Date());
      }, createSnapshotErrorHandler('admin dashboard KYB'));

      // Listen for project count changes with funding and status
      const projectsUnsubscribe = onSnapshot(collection(firestoreDb, 'projects'), (snapshot) => {
        console.log('✅ REAL-TIME: Projects updated -', snapshot.size, 'total projects');
        const projects = snapshot.docs.map(doc => doc.data());
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'live').length;
        const pendingProjects = projects.filter(p => p.status === 'pending').length;
        const totalFunding = projects.reduce((sum, p) => sum + (parseFloat(p.currentFunding) || 0), 0);
        
        setStats(prev => ({ 
          ...prev, 
          totalProjects: snapshot.size,
          activeProjects,
          pendingProjects,
          totalFunding
        }));
        setLastUpdated(new Date());
      }, createSnapshotErrorHandler('admin dashboard projects'));

      // Listen for active spotlights
      const spotlightsUnsubscribe = onSnapshot(
        query(collection(firestoreDb, 'spotlights'), where('status', '==', 'active')),
        (snapshot) => {
          console.log('✅ REAL-TIME: Active spotlights updated -', snapshot.size, 'active spotlights');
          setStats(prev => ({ ...prev, activeSpotlights: snapshot.size }));
          setLastUpdated(new Date());
        },
        createSnapshotErrorHandler('admin dashboard spotlights')
      );

      // Store unsubscribe functions for cleanup
      const unsubscribes = [usersUnsubscribe, kycUnsubscribe, kybUnsubscribe, projectsUnsubscribe, spotlightsUnsubscribe];
      
      console.log('✅ Real-time dashboard updates initialized successfully');

      // Return cleanup function
      return () => {
        console.log('🔄 Cleaning up real-time dashboard listeners...');
        unsubscribes.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            // Ignore cleanup errors
          }
        });
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
      return undefined;
    }
  };

  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading dashboard stats...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      
      // Use dynamic imports to avoid chunk loading errors
      const { collection, getDocs, query, where } = await import('firebase/firestore');

      // Parallel Firestore queries with graceful fallbacks
      const [usersSnapshot, kycSnapshot, kybSnapshot, projectsSnapshot, spotlightsSnapshot] = await Promise.allSettled([
        getDocs(collection(dbInstance, 'users')),
        getDocs(collection(dbInstance, 'kyc_documents')),
        getDocs(collection(dbInstance, 'organizations')),
        getDocs(collection(dbInstance, 'projects')),
        getDocs(query(collection(dbInstance, 'spotlights'), where('status', '==', 'active')))
      ]);

      // Extract data with fallbacks and detailed calculations
      const users = usersSnapshot.status === 'fulfilled' ? usersSnapshot.value.docs.map(d => d.data()) : [];
      const kycDocs = kycSnapshot.status === 'fulfilled' ? kycSnapshot.value.docs.map(d => d.data()) : [];
      const kybDocs = kybSnapshot.status === 'fulfilled' ? kybSnapshot.value.docs.map(d => d.data()) : [];
      const projects = projectsSnapshot.status === 'fulfilled' ? projectsSnapshot.value.docs.map(d => d.data()) : [];
      const spotlightsDocs = spotlightsSnapshot.status === 'fulfilled' ? spotlightsSnapshot.value.docs : [];

      // Detailed calculations
      const verifiedUsers = users.filter(u => u.kycStatus === 'approved' || u.kyc_status === 'approved').length;
      const unverifiedUsers = users.length - verifiedUsers;
      
      const pendingKYC = kycDocs.filter(d => d.status === 'pending').length;
      const approvedKYC = kycDocs.filter(d => d.status === 'approved').length;
      const rejectedKYC = kycDocs.filter(d => d.status === 'rejected').length;
      
      const pendingKYB = kybDocs.filter(d => d.kybStatus === 'pending').length;
      const approvedKYB = kybDocs.filter(d => d.kybStatus === 'approved').length;
      const rejectedKYB = kybDocs.filter(d => d.kybStatus === 'rejected').length;
      
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'live').length;
      const pendingProjects = projects.filter(p => p.status === 'pending').length;
      const totalFunding = projects.reduce((sum, p) => sum + (parseFloat(p.currentFunding) || 0), 0);

      setStats({
        totalUsers: users.length,
        verifiedUsers,
        unverifiedUsers,
        pendingKYC,
        approvedKYC,
        rejectedKYC,
        pendingKYB,
        approvedKYB,
        rejectedKYB,
        totalProjects: projects.length,
        activeProjects,
        pendingProjects,
        activeSpotlights: spotlightsDocs.length,
        totalFunding,
        totalDepartments: 5, // Static for now
        recentSignups: 0
      });

      setLastUpdated(new Date());
      console.log('✅ Dashboard stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      // Set fallback stats
      setStats({
        totalUsers: 0,
        pendingKYC: 0,
        approvedKYC: 0,
        rejectedKYC: 0,
        pendingKYB: 0,
        approvedKYB: 0,
        rejectedKYB: 0,
        totalProjects: 0,
        activeProjects: 0,
        pendingProjects: 0,
        activeSpotlights: 0,
        totalFunding: 0,
        totalDepartments: 0,
        recentSignups: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0
      });
    }
  };

  const loadRecentActivity = async () => {
    try {
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
      
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      
      // Get recent users
      const recentUsersSnapshot = await getDocs(
        query(collection(dbInstance, 'users'), orderBy('createdAt', 'desc'), limit(3))
      );
      
      // Get recent projects
      const recentProjectsSnapshot = await getDocs(
        query(collection(dbInstance, 'projects'), orderBy('createdAt', 'desc'), limit(2))
      );

      const activities: any[] = [];

      // Add user registrations
      recentUsersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        activities.push({
          type: 'user',
          title: `New user registered: ${userData.email}`,
          time: userData.createdAt?.toDate?.()?.toLocaleString() || 'Recently',
          status: 'approved',
          iconType: 'users'
        });
      });

      // Add project submissions
      recentProjectsSnapshot.docs.forEach(doc => {
        const projectData = doc.data();
        activities.push({
          type: 'project',
          title: `Project submitted: ${projectData.name}`,
          time: projectData.createdAt?.toDate?.()?.toLocaleString() || 'Recently',
          status: 'pending',
          iconType: 'rocket'
        });
      });

      // Sort by time and take latest 5
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('❌ Error loading recent activity:', error);
    }
  };

  // Stat cards configuration - Enhanced with more details
  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      subtitle: `${stats.verifiedUsers} verified, ${stats.unverifiedUsers} pending`, 
      iconType: 'users', 
      color: 'bg-blue-600', 
      trend: 'up', 
      trendValue: 'Growing', 
      link: '/admin/users' 
    },
    { 
      title: 'KYC Status', 
      value: `${stats.approvedKYC} approved`, 
      subtitle: `${stats.pendingKYC} pending, ${stats.rejectedKYC} rejected`, 
      iconType: 'shield', 
      color: stats.pendingKYC > 0 ? 'bg-yellow-600' : 'bg-green-600', 
      trend: stats.pendingKYC > 0 ? 'down' : 'neutral', 
      trendValue: stats.pendingKYC > 0 ? 'Action needed' : 'All clear', 
      link: '/admin/kyc' 
    },
    { 
      title: 'KYB Status', 
      value: `${stats.approvedKYB} approved`, 
      subtitle: `${stats.pendingKYB} pending, ${stats.rejectedKYB} rejected`, 
      iconType: 'building', 
      color: stats.pendingKYB > 0 ? 'bg-orange-600' : 'bg-green-600', 
      trend: stats.pendingKYB > 0 ? 'down' : 'neutral', 
      trendValue: stats.pendingKYB > 0 ? 'Action needed' : 'All clear', 
      link: '/admin/kyb' 
    },
    { 
      title: 'Total Projects', 
      value: stats.totalProjects, 
      subtitle: `${stats.activeProjects} active, ${stats.pendingProjects} pending`, 
      iconType: 'rocket', 
      color: 'bg-purple-600', 
      trend: 'up', 
      trendValue: `${stats.activeProjects} live`, 
      link: '/admin/projects' 
    },
    { 
      title: 'Total Funding', 
      value: stats.totalFunding > 1000000 ? `$${(stats.totalFunding / 1000000).toFixed(1)}M` : stats.totalFunding > 1000 ? `$${(stats.totalFunding / 1000).toFixed(0)}K` : `$${stats.totalFunding.toFixed(0)}`, 
      subtitle: 'Platform-wide raised', 
      iconType: 'chart', 
      color: 'bg-green-600', 
      trend: 'up', 
      trendValue: 'Rising', 
      link: '/admin/projects' 
    },
    { 
      title: 'Active Spotlights', 
      value: stats.activeSpotlights, 
      subtitle: 'Featured projects', 
      iconType: 'star', 
      color: 'bg-pink-600', 
      trend: 'up', 
      trendValue: 'Featured', 
      link: '/admin/spotlights' 
    }
  ];

  // Quick actions configuration
  const quickActions = [
    { title: 'Users', iconType: 'users', link: '/admin/users', color: 'bg-blue-600', description: 'Manage users' },
    { title: 'KYC', iconType: 'shield', link: '/admin/kyc', color: 'bg-yellow-600', description: 'Review KYC' },
    { title: 'KYB', iconType: 'building', link: '/admin/kyb', color: 'bg-orange-600', description: 'Review KYB' },
    { title: 'Projects', iconType: 'rocket', link: '/admin/projects', color: 'bg-purple-600', description: 'Manage projects' },
    { title: 'Spotlights', iconType: 'star', link: '/admin/spotlights', color: 'bg-pink-600', description: 'Manage spotlights' },
    { title: 'Analytics', iconType: 'analytics', link: '/admin/analytics', color: 'bg-green-600', description: 'View analytics' },
    { title: 'Settings', iconType: 'settings', link: '/admin/settings', color: 'bg-cyan-600', description: 'System settings' },
    { title: 'Test', iconType: 'shield', link: '/admin/test', color: 'bg-red-600', description: 'Test system' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading admin dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

      return (
        <div className="relative w-full">
          <div className="w-full space-y-6">
            {/* Complete Page Header */}
            <AdminPageHeader
              title="Admin Dashboard"
              description={`Welcome back, ${user.email}`}
              iconType="bolt"
              showStats={true}
              stats={{
                total: stats.totalUsers + stats.totalProjects + stats.activeSpotlights,
                pending: stats.pendingKYC + stats.pendingKYB,
                approved: stats.totalUsers - stats.pendingKYC,
                rejected: 0
              }}
            />

            {/* Overview Section Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <NeonCyanIcon type="eye" size={32} className="text-blue-400" />
                Overview
              </h1>
              <p className="text-cyan-400/70">Complete platform statistics and real-time data insights</p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <NeonCyanIcon type="chart" size={24} className="text-blue-400" />
                Platform Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                  <StatCard key={index} {...stat} router={router} />
                ))}
              </div>
            </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <NeonCyanIcon type="bolt" size={24} className="text-yellow-400" />
          Quick Actions
        </h2>
        <div className="neo-glass-card rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionButton key={index} {...action} router={router} />
            ))}
          </div>
        </div>
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Status */}
        <div className="neo-glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <NeonCyanIcon type="check" size={24} className="text-green-400" />
            System Status
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Platform</span>
              </div>
              <span className="text-green-400 font-semibold">Online</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Database</span>
              </div>
              <span className="text-green-400 font-semibold">Connected</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Real-time Updates</span>
              </div>
              <span className="text-blue-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-white font-medium">Pending Reviews</span>
              </div>
              <span className="text-yellow-400 font-semibold">{stats.pendingKYC + stats.pendingKYB}</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-white font-medium">Total Users</span>
              </div>
              <span className="text-purple-400 font-semibold">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white font-medium">Verified Users</span>
              </div>
              <span className="text-green-400 font-semibold">{stats.verifiedUsers}</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white font-medium">Active Projects</span>
              </div>
              <span className="text-blue-400 font-semibold">{stats.activeProjects}</span>
            </div>
            <div className="flex items-center justify-between p-4 neo-glass-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <span className="text-white font-medium">Active Spotlights</span>
              </div>
              <span className="text-pink-400 font-semibold">{stats.activeSpotlights}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="neo-glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <NeonCyanIcon type="clock" size={24} className="text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <RecentActivityItem key={index} {...activity} />
              ))
            ) : (
              <div className="text-center py-8">
                <NeonCyanIcon type="clock" size={48} className="text-cyan-400/50 mx-auto mb-4" />
                <p className="text-cyan-400/70">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

          {/* Last Updated Info */}
          <div className="mt-8 text-center">
            <p className="text-cyan-400/60 text-sm">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
  );
}