"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeftIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  currentPage?: string;
}

export default function AdminHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backButtonText = "Back to Dashboard",
  currentPage = "dashboard"
}: AdminHeaderProps) {
  const router = useRouter();
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
    { name: 'Dashboard', href: '/admin-dashboard', icon: HomeIcon, current: currentPage === 'dashboard' },
    { name: 'Users', href: '/admin/users', icon: UsersIcon, current: currentPage === 'users' },
    { name: 'KYC', href: '/admin/kyc', icon: DocumentCheckIcon, current: currentPage === 'kyc' },
    { name: 'KYB', href: '/admin/kyb', icon: BuildingOfficeIcon, current: currentPage === 'kyb' },
    { name: 'Projects', href: '/admin/projects', icon: RocketLaunchIcon, current: currentPage === 'projects' },
    { name: 'Spotlights', href: '/admin/spotlights', icon: StarIcon, current: currentPage === 'spotlights' },
    { name: 'Add Spotlight', href: '/admin/add-spotlight', icon: PlusIcon, current: currentPage === 'add-spotlight' },
    { name: 'Pitch', href: '/admin/pitch', icon: ChartBarIcon, current: currentPage === 'pitch' },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, current: currentPage === 'analytics' },
    { name: 'Departments', href: '/admin/departments', icon: UserGroupIcon, current: currentPage === 'departments' },
    { name: 'Audit', href: '/admin/audit', icon: ClipboardDocumentListIcon, current: currentPage === 'audit' },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, current: currentPage === 'settings' },
    { name: 'Test', href: '/admin/test', icon: ShieldCheckIcon, current: currentPage === 'test' },
  ];

  const handleNavigation = (href: string, name: string) => {
    console.log(`🔄 Navigating to ${name}: ${href}`);
    router.push(href);
  };

  const handleBack = () => {
    router.push('/admin-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('mockUser');
    console.log('✅ User logged out');
    router.replace('/admin/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      {/* Complete Admin Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-2xl backdrop-blur-sm">
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Left Section - Brand */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <ShieldCheckIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                  <p className="text-sm text-gray-400 font-medium">CryptoRafts Management</p>
                </div>
              </div>
              
              {/* Real-time Status Indicator */}
              <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl border border-gray-600 shadow-lg">
                <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-sm text-gray-200 font-bold">LIVE</span>
              </div>
            </div>

            {/* Center Section - Navigation Menu - ALL OPTIONS VISIBLE */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 justify-center px-4">
              <div className="flex items-center gap-2 min-w-max">
                {navigation.map((item, index) => (
                  <button
                    key={`header-nav-${item.name}-${index}`}
                    onClick={() => handleNavigation(item.href, item.name)}
                    className={`px-5 py-3 text-sm font-bold transition-all duration-300 rounded-2xl whitespace-nowrap border-2 group ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl border-blue-500 shadow-blue-500/30'
                        : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white hover:shadow-lg border-gray-600 hover:border-gray-500'
                    }`}
                    title={item.name}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${item.current ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="font-bold">{item.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Section - User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm text-left">
                  <p className="text-white font-bold">Anas Shamsi</p>
                  <p className="text-gray-400 text-xs">Administrator</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Enhanced Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl shadow-2xl z-50 backdrop-blur-sm">
                  <div className="p-4">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-600 mb-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl">
                      <p className="text-white font-bold text-lg">Anas Shamsi</p>
                      <p className="text-gray-400 text-sm">admin@cryptorafts.com</p>
                      <p className="text-blue-400 text-xs font-semibold">Administrator</p>
                    </div>

                    {/* Admin Navigation Options */}
                    <div className="space-y-1">
                      {navigation.map((item, index) => (
                        <button
                          key={`dropdown-nav-${item.name}-${index}`}
                          onClick={() => {
                            handleNavigation(item.href, item.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 group ${
                            item.current
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                              : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white hover:shadow-md'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 transition-transform duration-300 ${item.current ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span className="font-semibold">{item.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-600 my-3"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20 hover:text-red-300 rounded-xl transition-all duration-300 group"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Page Header with Back Button */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl mx-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="font-bold">{backButtonText}</span>
              </button>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              {subtitle && (
                <p className="text-gray-300 text-lg">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl">
              <ClockIcon className="w-4 h-4" />
              <span>Last Updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-semibold">Live Data</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
