/**
 * VC ROLE GUARD WRAPPER - LOCKED & SECURED
 * 
 * ⚠️ DO NOT MODIFY THIS FILE
 * ⚠️ Wraps VC pages with strict role verification
 * 
 * Usage:
 * ```tsx
 * export default function MyVCPage() {
 *   return (
 *     <VCRoleGuardWrapper>
 *       <MyPageContent />
 *     </VCRoleGuardWrapper>
 *   );
 * }
 * ```
 */

'use client';

import React from 'react';
import { useVCRoleGuard } from '@/hooks/useVCRoleGuard';
import { VC_CONFIG } from '@/config/vc-role-lock';

interface VCRoleGuardWrapperProps {
  children: React.ReactNode;
  requireKYB?: boolean;
  redirectOnFail?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

/**
 * 🔒 LOCKED VC ROLE GUARD WRAPPER
 * 
 * Wraps any VC page component to enforce role-based access
 * Automatically handles:
 * - Authentication verification
 * - VC role validation
 * - KYB requirement checks
 * - Unauthorized access redirects
 */
export function VCRoleGuardWrapper({
  children,
  requireKYB = true,
  redirectOnFail = true,
  loadingComponent,
  errorComponent,
}: VCRoleGuardWrapperProps) {
  const vcGuard = useVCRoleGuard({ requireKYB, redirectOnFail });

  // Show loading state
  if (vcGuard.isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            {/* Animated VC Logo */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Loading Animation */}
            <div className="flex space-x-2 justify-center mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              🔒 Verifying VC Access
            </h3>
            <p className="text-white/70">
              Authenticating your VC credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (!vcGuard.isAuthorized) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">
              🔒 Access Denied
            </h3>
            
            {vcGuard.error === 'AUTHENTICATION_REQUIRED' && (
              <p className="text-white/70 mb-4">
                You must be logged in to access VC features.
              </p>
            )}
            
            {vcGuard.error === 'VC_ROLE_REQUIRED' && (
              <p className="text-white/70 mb-4">
                This page is restricted to Venture Capital role users only.
                Please select the VC role or contact support if you believe this is an error.
              </p>
            )}

            <div className="text-sm text-white/50 mt-4">
              <p>🔒 Protected by {VC_CONFIG.ROLE_NAME} Security</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

export default VCRoleGuardWrapper;

