"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { globalRules, Role } from '@/lib/global-rules';
import { setUserRole } from '@/lib/role-persistence';
import { 
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RoleOption {
  id: Role;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    id: 'founder',
    name: 'Founder',
    description: 'Launch and grow your crypto project',
    icon: <RocketLaunchIcon className="h-8 w-8" />,
    color: 'from-blue-500 to-cyan-500',
    features: ['Pitch submission', 'KYC verification', 'Deal flow management', 'AI-powered insights']
  },
  {
    id: 'vc',
    name: 'VC',
    description: 'Invest in promising crypto projects',
    icon: <CurrencyDollarIcon className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-500',
    features: ['Deal sourcing', 'Due diligence', 'Portfolio management', 'Investment tracking']
  },
  {
    id: 'exchange',
    name: 'Exchange',
    description: 'List and trade crypto assets',
    icon: <BuildingOfficeIcon className="h-8 w-8" />,
    color: 'from-purple-500 to-violet-500',
    features: ['Token listing', 'Market making', 'Liquidity management', 'Trading analytics']
  },
  {
    id: 'ido',
    name: 'IDO Launchpad',
    description: 'Launch token sales and IDOs',
    icon: <RocketLaunchIcon className="h-8 w-8" />,
    color: 'from-orange-500 to-red-500',
    features: ['IDO management', 'Token launches', 'Community building', 'Sale analytics']
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Promote and market crypto projects',
    icon: <MegaphoneIcon className="h-8 w-8" />,
    color: 'from-pink-500 to-rose-500',
    features: ['Campaign management', 'Content creation', 'Audience engagement', 'Performance tracking']
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Provide services to crypto projects',
    icon: <BriefcaseIcon className="h-8 w-8" />,
    color: 'from-indigo-500 to-blue-500',
    features: ['Service delivery', 'Client management', 'Project tracking', 'Team collaboration']
  }
];

export default function RoleSelectorLocked() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      // Check if role is already locked
      globalRules.initialize().then(() => {
        if (globalRules.isRoleLocked()) {
          const role = globalRules.getCurrentRole();
          if (role) {
            if (role === 'vc') {
              router.push('/vc/onboarding');
            } else if (role === 'founder') {
              router.push('/founder/register');
            } else {
              router.push(`/${role}/dashboard`);
            }
          }
        }
      });
    }
  }, [user, isLoading, router]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setShowWarning(true);
    setError('');
  };

  const handleConfirmRole = async () => {
    if (!selectedRole || !user) return;

    setIsLocking(true);
    setError('');

    try {
      // Save role to persistent storage first
      const userClaims = setUserRole(selectedRole, {
        orgId: `demo-org-${Date.now()}`,
        userId: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      console.log('RoleSelectorLocked: Role saved to persistent storage:', selectedRole);

      // Lock the role permanently (with fallback)
      try {
        await globalRules.lockRole(selectedRole);
      } catch (globalRulesError) {
        console.warn('Global rules role locking failed, using persistent storage:', globalRulesError);
      }
      
      // Log audit event (with fallback)
      try {
        await globalRules.logAuditEvent('role_locked', selectedRole, { 
          userId: user.uid,
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.warn('Audit logging failed, continuing:', auditError);
      }

      // Redirect to role-specific dashboard or onboarding
      console.log('RoleSelectorLocked: Selected role:', selectedRole);
      if (selectedRole === 'vc') {
        console.log('RoleSelectorLocked: Redirecting VC to onboarding');
        router.push('/vc/onboarding');
      } else if (selectedRole === 'founder') {
        console.log('RoleSelectorLocked: Redirecting founder to register');
        router.push('/founder/register');
      } else {
        console.log('RoleSelectorLocked: Redirecting to dashboard for role:', selectedRole);
        router.push(`/${selectedRole}/dashboard`);
      }
      
    } catch (err: any) {
      console.error('Role selection failed:', err);
      setError(err?.message || 'Failed to select role. Please try again.');
      setIsLocking(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(null);
    setShowWarning(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen neo-blue-background pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Choose Your Role
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Select your role to access the platform. This choice is permanent and cannot be changed later.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="neo-glass-card border border-yellow-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-400 font-semibold">Important Notice</h3>
              <p className="text-yellow-200 text-sm mt-1">
                Your role selection is permanent and cannot be changed after confirmation. 
                Choose carefully as this will determine your access and permissions on the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Reselect Role Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              // Clear stored role data and reload with reselect parameter
              localStorage.removeItem('userRole');
              localStorage.removeItem('userClaims');
              localStorage.removeItem('globalRules');
              window.location.href = '/role?reselect=true';
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reselect Role (Clear Current Choice)
          </button>
        </div>

        {/* Role Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roleOptions.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`relative neo-glass-card rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl ${
                selectedRole === role.id 
                  ? 'border-blue-500 shadow-blue-500/25' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="p-6">
                {/* Role Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${role.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <div className="text-white" style={{ width: 'auto', height: 'auto' }}>
                      {role.icon}
                    </div>
                  </div>

                {/* Role Info */}
                <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
                <p className="text-white/70 text-sm mb-4">{role.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  {role.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-white/70 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Selection Indicator */}
                {selectedRole === role.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="neo-glass-card border border-red-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedRole && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRole}
              disabled={isLocking}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              {isLocking ? (
                <span className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Locking Role...</span>
                </span>
              ) : (
                `Confirm ${roleOptions.find(r => r.id === selectedRole)?.name} Role`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showWarning && selectedRole && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-glass-card rounded-2xl border border-white/10 p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Confirm Role Selection</h3>
              
              <p className="text-white/70 mb-6">
                You are about to select <span className="font-semibold text-blue-400">
                  {roleOptions.find(r => r.id === selectedRole)?.name}
                </span> as your permanent role.
              </p>
              
              <div className="neo-glass-card border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  ⚠️ This action cannot be undone. You will not be able to change your role later.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRole}
                  disabled={isLocking}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
                >
                  {isLocking ? 'Locking...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
