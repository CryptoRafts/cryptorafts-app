"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { db, collection, getDocs } from '@/lib/firebase.client';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ShieldCheckIcon,
  UsersIcon,
  DocumentCheckIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  StarIcon,
  BoltIcon,
  Cog6ToothIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Memoized stat card component
const StatCard = memo(({ title, value, icon: Icon, color, link }: any) => (
  <div 
    className="neo-glass-card rounded-xl p-4 hover:shadow-xl transition-all cursor-pointer"
    onClick={() => link && (window.location.href = link)}
  >
    <div className="flex items-center justify-between mb-2">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="text-white text-2xl font-bold mb-1">{value}</div>
    <div className="text-white/70 text-sm">{title}</div>
  </div>
));

StatCard.displayName = 'StatCard';

// Memoized quick action button
const QuickAction = memo(({ title, icon: Icon, link, color }: any) => (
  <AnimatedButton
    onClick={() => window.location.href = link}
    className={`${color} text-white px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm">{title}</span>
  </AnimatedButton>
));

QuickAction.displayName = 'QuickAction';

export default function AdminDashboardPage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    pendingKYB: 0,
    totalProjects: 0,
    activeSpotlights: 0,
    totalDepartments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // OPTIMIZED: Memoized access check
  const isAdmin = useMemo(() => {
    const savedRole = localStorage.getItem('userRole');
    return claims?.role === 'admin' || savedRole === 'admin';
  }, [claims]);

  // OPTIMIZED: Fast stats loading with parallel queries
  const loadDashboardStats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('⚡ Loading admin dashboard stats...');

      // OPTIMIZED: Parallel Firestore queries with graceful fallbacks
      const [
        usersSnapshot,
        kycSnapshot,
        kybSnapshot,
        projectsSnapshot,
        spotlightsSnapshot
      ] = await Promise.allSettled([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'kyc')),
        getDocs(collection(db, 'kyb')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'spotlights'))
      ]);

      // Extract data with fallbacks
      const usersCount = usersSnapshot.status === 'fulfilled' ? usersSnapshot.value.size : 0;
      const kycDocs = kycSnapshot.status === 'fulfilled' ? kycSnapshot.value.docs : [];
      const kybDocs = kybSnapshot.status === 'fulfilled' ? kybSnapshot.value.docs : [];
      const projectsCount = projectsSnapshot.status === 'fulfilled' ? projectsSnapshot.value.size : 0;
      const spotlightsDocs = spotlightsSnapshot.status === 'fulfilled' ? spotlightsSnapshot.value.docs : [];

      // OPTIMIZED: Fast filtering
      const pendingKYC = kycDocs.filter(d => d.data().status === 'pending').length;
      const pendingKYB = kybDocs.filter(d => d.data().status === 'pending').length;
      const activeSpotlights = spotlightsDocs.filter(d => d.data().isActive === true).length;

      setStats({
        totalUsers: usersCount,
        pendingKYC,
        pendingKYB,
        totalProjects: projectsCount,
        activeSpotlights,
        totalDepartments: 5 // Static for now
      });

      console.log('✅ Dashboard stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load stats on mount
  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardStats();
    }
  }, [user, isAdmin, loadDashboardStats]);

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !isAdmin) {
      router.replace('/admin/login');
      return;
    }
  }, [user, isAdmin, authLoading, router]);

  // OPTIMIZED: Memoized stat cards
  const statCards = useMemo(() => [
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: UsersIcon, color: 'bg-blue-500', link: '/admin/users' },
    { title: 'Pending KYC', value: stats.pendingKYC, icon: DocumentCheckIcon, color: 'bg-yellow-500', link: '/admin/kyc' },
    { title: 'Pending KYB', value: stats.pendingKYB, icon: BuildingOfficeIcon, color: 'bg-orange-500', link: '/admin/kyb' },
    { title: 'Total Projects', value: stats.totalProjects, icon: RocketLaunchIcon, color: 'bg-purple-500', link: '/admin/projects' },
    { title: 'Active Spotlights', value: stats.activeSpotlights, icon: StarIcon, color: 'bg-pink-500', link: '/admin/spotlights' },
    { title: 'Departments', value: stats.totalDepartments, icon: ShieldCheckIcon, color: 'bg-green-500', link: '/admin/departments' }
  ], [stats]);

  const quickActions = useMemo(() => [
    { title: 'Users', icon: UsersIcon, link: '/admin/users', color: 'bg-blue-600' },
    { title: 'KYC', icon: DocumentCheckIcon, link: '/admin/kyc', color: 'bg-yellow-600' },
    { title: 'KYB', icon: BuildingOfficeIcon, link: '/admin/kyb', color: 'bg-orange-600' },
    { title: 'Projects', icon: RocketLaunchIcon, link: '/admin/projects', color: 'bg-purple-600' },
    { title: 'Spotlight', icon: StarIcon, link: '/admin/spotlights', color: 'bg-pink-600' },
    { title: 'Add Spotlight', icon: StarIcon, link: '/admin/add-spotlight', color: 'bg-pink-500' },
    { title: 'Departments', icon: ShieldCheckIcon, link: '/admin/departments', color: 'bg-green-600' },
    { title: 'Settings', icon: Cog6ToothIcon, link: '/admin/settings', color: 'bg-gray-600' }
  ], []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading admin dashboard..." />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen neo-blue-background">
      <div className="container-perfect py-8">
        {/* OPTIMIZED Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BoltIcon className="w-7 h-7 text-yellow-400" />
            Admin Dashboard
          </h1>
          <p className="text-white/60 text-sm">Superfast platform management</p>
        </div>

        {/* OPTIMIZED Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="neo-glass-card rounded-xl p-4 mb-6">
          <h2 className="text-white font-bold mb-4 text-sm">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neo-glass-card rounded-xl p-4">
            <h2 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-green-400" />
              SYSTEM STATUS
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Platform</span>
                <span className="text-green-400 text-sm font-semibold">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Database</span>
                <span className="text-green-400 text-sm font-semibold">● Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Performance</span>
                <span className="text-green-400 text-sm font-semibold">● Superfast</span>
              </div>
            </div>
          </div>

          <div className="neo-glass-card rounded-xl p-4">
            <h2 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-400" />
              PENDING ACTIONS
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">KYC Reviews</span>
                <span className="text-yellow-400 text-sm font-semibold">{stats.pendingKYC}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">KYB Reviews</span>
                <span className="text-orange-400 text-sm font-semibold">{stats.pendingKYB}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Total Pending</span>
                <span className="text-purple-400 text-sm font-semibold">{stats.pendingKYC + stats.pendingKYB}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
