'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';

export default function IDOAnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [kybStatus, setKybStatus] = useState<string>('pending');

  // Check KYB status
  useEffect(() => {
    if (!user) return;

    const checkKYBStatus = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) return;
        
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const status = data.kybStatus || data.kyb?.status || 'pending';
          setKybStatus(status);

          if (status !== 'verified' && status !== 'approved') {
            router.push('/ido/pending-approval');
          }
        }
      } catch (error) {
        console.error('Error checking KYB status:', error);
      }
    };

    checkKYBStatus();
  }, [user, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  Real-time performance insights and metrics
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live data</span>
              </div>
            </div>
          </div>

          {/* Real-time Analytics */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="ido" userId={user.uid} />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
