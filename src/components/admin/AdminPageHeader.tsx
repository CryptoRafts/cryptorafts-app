"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  iconType?: string;
  showStats?: boolean;
  stats?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };
}

export default function AdminPageHeader({ 
  title, 
  description, 
  iconType = 'shield',
  showStats = false,
  stats = {}
}: AdminPageHeaderProps) {
  const pathname = usePathname();
  
  const getPageInfo = () => {
    switch (pathname) {
      case '/admin/dashboard':
        return { iconType: 'home', color: 'from-blue-500 to-purple-600' };
      case '/admin/users':
        return { iconType: 'users', color: 'from-blue-500 to-cyan-500' };
      case '/admin/kyc':
        return { iconType: 'shield', color: 'from-yellow-500 to-orange-500' };
      case '/admin/kyb':
        return { iconType: 'building', color: 'from-orange-500 to-red-500' };
      case '/admin/projects':
        return { iconType: 'rocket', color: 'from-purple-500 to-pink-500' };
      case '/admin/spotlights':
        return { iconType: 'star', color: 'from-pink-500 to-rose-500' };
      case '/admin/analytics':
        return { iconType: 'analytics', color: 'from-green-500 to-emerald-500' };
      case '/admin/settings':
        return { iconType: 'settings', color: 'from-gray-500 to-slate-500' };
      case '/admin/test':
        return { iconType: 'shield', color: 'from-red-500 to-pink-500' };
      default:
        return { iconType: iconType, color: 'from-blue-500 to-purple-600' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Left Section - Page Info */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-r ${pageInfo.color} rounded-2xl flex items-center justify-center shadow-xl`}>
              <NeonCyanIcon type={pageInfo.iconType as any} size={32} className="text-white" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                {title}
              </h1>
              {description && (
                <p className="text-gray-300 text-lg">{description}</p>
              )}
              
              {/* Page Status */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <NeonCyanIcon type="check" size={16} className="text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Page Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <NeonCyanIcon type="clock" size={16} className="text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Stats */}
          {showStats && (
            <div className="flex items-center gap-6">
              {stats.total !== undefined && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-gray-400 text-sm">Total</p>
                </div>
              )}
              {stats.pending !== undefined && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  <p className="text-gray-400 text-sm">Pending</p>
                </div>
              )}
              {stats.approved !== undefined && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                  <p className="text-gray-400 text-sm">Approved</p>
                </div>
              )}
              {stats.rejected !== undefined && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                  <p className="text-gray-400 text-sm">Rejected</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
