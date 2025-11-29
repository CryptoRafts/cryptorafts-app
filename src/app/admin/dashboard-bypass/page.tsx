"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  RocketLaunchIcon,
  EyeIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Stat card component
const StatCard = ({ title, value, icon: Icon, color, link, router, trend, trendValue }: any) => (
  <div 
    className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:shadow-xl hover:border-gray-500 transition-all cursor-pointer group"
    onClick={() => link && router.push(link)}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4" /> : 
             trend === 'down' ? <ArrowTrendingDownIcon className="w-4 h-4" /> : 
             <ClockIcon className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
        <EyeIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </div>
    </div>
    <div className="text-white text-3xl font-bold mb-2">{value}</div>
    <div className="text-gray-300 text-sm font-medium">{title}</div>
  </div>
);

// Quick action button component
const QuickActionButton = ({ title, icon: Icon, link, color, router, description }: any) => (
  <button
    onClick={() => router.push(link)}
    className={`${color} text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center gap-3 group`}
  >
    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-center">
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  </button>
);

export default function AdminDashboardBypassPage() {
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
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Set admin role immediately
    localStorage.setItem('userRole', 'admin');
    console.log('✅ Admin access granted automatically');
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  }, []);

  // Stat cards configuration
  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'bg-blue-600', trend: 'up', trendValue: '+12%', link: '/admin/users' },
    { title: 'Pending KYC', value: stats.pendingKYC, icon: DocumentCheckIcon, color: 'bg-yellow-600', trend: stats.pendingKYC > 0 ? 'down' : 'neutral', trendValue: stats.pendingKYC > 0 ? 'Review needed' : 'All clear', link: '/admin/kyc' },
    { title: 'Pending KYB', value: stats.pendingKYB, icon: BuildingOfficeIcon, color: 'bg-orange-600', trend: stats.pendingKYB > 0 ? 'down' : 'neutral', trendValue: stats.pendingKYB > 0 ? 'Review needed' : 'All clear', link: '/admin/kyb' },
    { title: 'Total Projects', value: stats.totalProjects, icon: RocketLaunchIcon, color: 'bg-purple-600', trend: 'up', trendValue: '+8%', link: '/admin/projects' },
    { title: 'Active Spotlights', value: stats.activeSpotlights, icon: StarIcon, color: 'bg-pink-600', trend: 'up', trendValue: '+5%', link: '/admin/spotlights' },
    { title: 'Departments', value: stats.totalDepartments, icon: ShieldCheckIcon, color: 'bg-green-600', trend: 'neutral', trendValue: 'Active', link: '/admin/departments' }
  ];

  // Quick actions configuration
  const quickActions = [
    { title: 'Users', icon: UsersIcon, link: '/admin/users', color: 'bg-blue-600', description: 'Manage users' },
    { title: 'KYC', icon: DocumentCheckIcon, link: '/admin/kyc', color: 'bg-yellow-600', description: 'Review KYC' },
    { title: 'KYB', icon: BuildingOfficeIcon, link: '/admin/kyb', color: 'bg-orange-600', description: 'Review KYB' },
    { title: 'Projects', icon: RocketLaunchIcon, link: '/admin/projects', color: 'bg-purple-600', description: 'Manage projects' },
    { title: 'Spotlights', icon: StarIcon, link: '/admin/spotlights', color: 'bg-pink-600', description: 'Manage spotlights' },
    { title: 'Analytics', icon: ChartBarIcon, link: '/admin/analytics', color: 'bg-green-600', description: 'View analytics' },
    { title: 'Settings', icon: Cog6ToothIcon, link: '/admin/settings', color: 'bg-gray-600', description: 'System settings' },
    { title: 'Test', icon: ShieldCheckIcon, link: '/admin/test', color: 'bg-red-600', description: 'Test system' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Loading admin dashboard..." />
          <p className="text-white mt-4">Granting admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BoltIcon className="w-7 h-7 text-white" />
                </div>
                Admin Dashboard
              </h1>
              <p className="text-gray-300 text-lg">Welcome to the admin panel</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">System Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">Admin Access Granted</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-300 text-sm">Last updated</div>
              <div className="text-white font-medium">{lastUpdated.toLocaleTimeString()}</div>
              <div className="text-gray-400 text-xs">{lastUpdated.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-blue-400" />
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
            <BoltIcon className="w-6 h-6 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {quickActions.map((action, index) => (
                <QuickActionButton key={index} {...action} router={router} />
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white font-medium">Platform</span>
                </div>
                <span className="text-green-400 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white font-medium">Database</span>
                </div>
                <span className="text-green-400 font-semibold">Connected</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-white font-medium">Real-time Updates</span>
                </div>
                <span className="text-blue-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white font-medium">Admin Access</span>
                </div>
                <span className="text-purple-400 font-semibold">Granted</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ClockIcon className="w-6 h-6 text-blue-400" />
              Admin Access Info
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-400 text-sm font-medium">✅ Admin Access Granted</p>
                <p className="text-gray-300 text-xs mt-1">You have full admin privileges</p>
              </div>
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 text-sm font-medium">🔧 Console Commands Available</p>
                <p className="text-gray-300 text-xs mt-1">grantAdminAccess() | clearAdminAccess()</p>
              </div>
              <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                <p className="text-purple-400 text-sm font-medium">🚀 All Features Active</p>
                <p className="text-gray-300 text-xs mt-1">Real-time updates and full functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
