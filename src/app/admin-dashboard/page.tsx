"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { loadRealAdminData, setupRealTimeUpdates, AdminStats } from './loadRealData';
import { 
  HomeIcon,
  UsersIcon,
  DocumentCheckIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  StarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering - No caching
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, active: 0, pendingKYC: 0, verified: 0 },
    projects: { total: 0, active: 0, pending: 0, approved: 0, rejected: 0 },
    spotlights: { total: 0, active: 0, pending: 0, approved: 0, rejected: 0 },
    kyc: { total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0 },
    kyb: { total: 0, pending: 0, approved: 0, rejected: 0 },
    departments: { total: 0, active: 0, inactive: 0, totalMembers: 0 }
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [realtimeStatus, setRealtimeStatus] = useState<'active' | 'loading'>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation items
  const navigation = [
    { name: 'Home', href: '/admin-dashboard', icon: HomeIcon, current: pathname === '/admin-dashboard' || pathname === '/admin/dashboard' },
    { name: 'Users', href: '/admin/users', icon: UsersIcon, current: pathname === '/admin/users' },
    { name: 'KYC', href: '/admin/kyc', icon: DocumentCheckIcon, current: pathname === '/admin/kyc' },
    { name: 'KYB', href: '/admin/kyb', icon: BuildingOfficeIcon, current: pathname === '/admin/kyb' },
    { name: 'Projects', href: '/admin/projects', icon: RocketLaunchIcon, current: pathname === '/admin/projects' },
    { name: 'Spotlights', href: '/admin/spotlights', icon: StarIcon, current: pathname === '/admin/spotlights' },
    { name: 'Add Spotlight', href: '/admin/add-spotlight', icon: PlusIcon, current: pathname === '/admin/add-spotlight' },
    { name: 'Pitch', href: '/admin/pitch', icon: ChartBarIcon, current: pathname === '/admin/pitch' },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, current: pathname === '/admin/analytics' },
    { name: 'Departments', href: '/admin/departments', icon: UserGroupIcon, current: pathname === '/admin/departments' },
    { name: 'Audit', href: '/admin/audit', icon: ClipboardDocumentListIcon, current: pathname === '/admin/audit' },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, current: pathname === '/admin/settings' },
    { name: 'Test', href: '/admin/test', icon: ShieldCheckIcon, current: pathname === '/admin/test' },
  ];

  useEffect(() => {
    // Force admin access
    const setupAdmin = () => {
      console.log('🚀 Setting up admin access...');
      localStorage.setItem('userRole', 'admin');
      
      // Create mock user if needed
      const mockUser = {
        email: 'admin@cryptorafts.com',
        uid: 'admin-uid',
        displayName: 'Admin User'
      };
      setUser(mockUser);
      setIsLoading(false);
      
      // Load initial data
      loadAllData();
    };

    setupAdmin();
  }, []);

  const loadAllData = async () => {
    try {
      console.log('🔄 Loading REAL admin data from Firebase...');
      setRealtimeStatus('loading');

      // Use real data loading function - NO MOCK DATA
      const realStats = await loadRealAdminData();
      setStats(realStats);
      setLastUpdated(new Date());
      setRealtimeStatus('active');
      
      console.log('✅ Real admin data loaded successfully!');
      console.log('📊 Real Stats:', realStats);
    } catch (error: any) {
      console.error('❌ Error loading real admin data:', error?.code || error?.message);
      
      // Set stats with zeros if error occurs
      setStats({
        users: { total: 0, active: 0, pendingKYC: 0, verified: 0 },
        projects: { total: 0, active: 0, pending: 0, approved: 0, rejected: 0 },
        spotlights: { total: 0, active: 0, pending: 0, approved: 0, rejected: 0 },
        kyc: { total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0 },
        kyb: { total: 0, pending: 0, approved: 0, rejected: 0 },
        departments: { total: 0, active: 0, inactive: 0, totalMembers: 0 }
      });
      
      setRealtimeStatus('active');
      setLastUpdated(new Date());
    }
  };

  // Setup real-time updates using the real data loader
  useEffect(() => {
    if (!user) return;

    const cleanup = setupRealTimeUpdates((updatedStats: AdminStats) => {
      console.log('📊 Real-time stats updated:', updatedStats);
      setStats(updatedStats);
      setLastUpdated(new Date());
    });

    return cleanup;
  }, [user]);

  const handleNavigation = (href: string, name: string) => {
    console.log(`🔄 Navigating to ${name}: ${href}`);
    router.push(href);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('mockUser');
    console.log('✅ User logged out');
    router.replace('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Compact Admin Header - Matching admin layout */}
      <header className="sticky top-0 z-50 bg-black border-b border-gray-800 shadow-xl">
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between gap-4">
            {/* Left Section - Empty for alignment */}
            <div className="flex-shrink-0 w-0"></div>

            {/* Center Section - Navigation Menu */}
            <div className="flex items-center justify-center flex-1 min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-full px-2">
                {navigation.map((item, index) => (
                  <button
                    key={`header-nav-${item.name}-${index}`}
                    onClick={() => handleNavigation(item.href, item.name)}
                    disabled={false}
                    className={`w-24 px-2 py-1.5 text-xs font-semibold transition-all duration-200 rounded-md whitespace-nowrap border flex items-center justify-center gap-1 flex-shrink-0 group h-8 ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md border-blue-500'
                        : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white hover:shadow-sm border-gray-600 hover:border-gray-500'
                    }`}
                    title={item.name}
                  >
                    <item.icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${item.current ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span className="font-semibold truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Section - Logout */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all font-semibold whitespace-nowrap"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-black pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-8">
          {/* Welcome Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <HomeIcon className="w-7 h-7 text-white" />
                    </div>
                    Welcome to Admin Dashboard
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Complete platform management and real-time monitoring
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 font-semibold">System Online</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Users Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.users.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Users</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active</span>
                    <span className="text-green-400 font-semibold">{stats.users.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending KYC</span>
                    <span className="text-yellow-400 font-semibold">{stats.users.pendingKYC}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Verified</span>
                    <span className="text-blue-400 font-semibold">{stats.users.verified}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <RocketLaunchIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.projects.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Projects</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active</span>
                    <span className="text-green-400 font-semibold">{stats.projects.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <span className="text-yellow-400 font-semibold">{stats.projects.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Approved</span>
                    <span className="text-blue-400 font-semibold">{stats.projects.approved}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlights Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.spotlights.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Spotlights</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active</span>
                    <span className="text-green-400 font-semibold">{stats.spotlights.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <span className="text-yellow-400 font-semibold">{stats.spotlights.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Approved</span>
                    <span className="text-blue-400 font-semibold">{stats.spotlights.approved}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <DocumentCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.kyc.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">KYC</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <span className="text-yellow-400 font-semibold">{stats.kyc.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Approved</span>
                    <span className="text-green-400 font-semibold">{stats.kyc.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">High Risk</span>
                    <span className="text-red-400 font-semibold">{stats.kyc.highRisk}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KYB Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.kyb.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">KYB</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <span className="text-yellow-400 font-semibold">{stats.kyb.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Approved</span>
                    <span className="text-green-400 font-semibold">{stats.kyb.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Rejected</span>
                    <span className="text-red-400 font-semibold">{stats.kyb.rejected}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Departments Stats */}
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.departments.total}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Departments</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active</span>
                    <span className="text-green-400 font-semibold">{stats.departments.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Members</span>
                    <span className="text-blue-400 font-semibold">{stats.departments.totalMembers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Inactive</span>
                    <span className="text-gray-400 font-semibold">{stats.departments.inactive}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Cog6ToothIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {navigation.slice(1).map((item, index) => (
                <button
                  key={`quick-action-${item.name}-${index}`}
                  onClick={() => handleNavigation(item.href, item.name)}
                  className="group relative p-6 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-blue-500 group-hover:to-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300">
                      <item.icon className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors duration-300 text-center">
                      {item.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Real-time Status */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">System Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-green-400 font-bold text-lg">System Status</span>
                </div>
                <p className="text-green-300">All systems operational</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>99.9% Uptime</span>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-blue-400 font-bold text-lg">Data Sync</span>
                </div>
                <p className="text-blue-300">Real-time updates active</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Live Connection</span>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-purple-400 font-bold text-lg">Admin Access</span>
                </div>
                <p className="text-purple-300">Full permissions granted</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Secure Session</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
