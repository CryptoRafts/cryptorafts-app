"use client";

import React from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { DashboardSkeleton } from './FirebaseSkeleton';

interface RoleAwareWrapperProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

const RoleAwareWrapper: React.FC<RoleAwareWrapperProps> = ({
  children,
  allowedRoles,
  fallback,
  loadingComponent
}) => {
  const { claims, isLoading } = useAuth();

  if (isLoading) {
    return loadingComponent || <DashboardSkeleton />;
  }

  const userRole = claims?.role;
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-white/70">
            You don't have permission to access this page. 
            {userRole && ` Your current role: ${userRole}`}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Role-specific wrappers for convenience
export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['admin']}>{children}</RoleAwareWrapper>
);

export const FounderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['founder']}>{children}</RoleAwareWrapper>
);

export const VCOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['vc']}>{children}</RoleAwareWrapper>
);

export const ExchangeOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['exchange']}>{children}</RoleAwareWrapper>
);

export const IDOOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['ido']}>{children}</RoleAwareWrapper>
);

export const InfluencerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['influencer']}>{children}</RoleAwareWrapper>
);

export const AgencyOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['agency']}>{children}</RoleAwareWrapper>
);

// Combined role access
export const InvestorRoles: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['vc', 'exchange', 'ido']}>{children}</RoleAwareWrapper>
);

export const ServiceProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['agency', 'influencer']}>{children}</RoleAwareWrapper>
);

export const AllRoles: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleAwareWrapper allowedRoles={['admin', 'founder', 'vc', 'exchange', 'ido', 'influencer', 'agency']}>
    {children}
  </RoleAwareWrapper>
);

// Role Badge Component
export const RoleBadge: React.FC<{ role?: string; className?: string }> = ({ role, className = '' }) => {
  if (!role) return null;

  const roleColors = {
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    founder: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    vc: 'bg-green-500/20 text-green-400 border-green-500/30',
    exchange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ido: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    influencer: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    agency: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  const colorClass = roleColors[role as keyof typeof roleColors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span 
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
        border backdrop-blur-sm
        ${colorClass}
        ${className}
      `}
    >
      {role.toUpperCase()}
    </span>
  );
};

export default RoleAwareWrapper;

