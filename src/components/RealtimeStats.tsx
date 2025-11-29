"use client";

import React, { useState, useEffect } from 'react';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface PlatformStats {
  activeProjects: number;
  totalFunding: number;
  activeVCs: number;
  activeExchanges: number;
  activeIDOs: number;
  activeInfluencers: number;
  activeAgencies: number;
  totalUsers: number;
}

// OPTIMIZED: Memoized component to prevent unnecessary re-renders
const RealtimeStats = React.memo(function RealtimeStats() {
  const [stats, setStats] = useState<PlatformStats>({
    activeProjects: 0,
    totalFunding: 0,
    activeVCs: 0,
    activeExchanges: 0,
    activeIDOs: 0,
    activeInfluencers: 0,
    activeAgencies: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // OPTIMIZED: Set loading to false immediately - show UI instantly
    setLoading(false);
    setError(null);
    
    // OPTIMIZED: Reduced timeout and removed retry logic for faster failure
    let timeoutId: NodeJS.Timeout | undefined;
    
    timeoutId = setTimeout(() => {
      console.warn('⏱️ Stats loading timeout - showing fallback');
      setLoading(false);
      setError(null);
    }, 10000); // Reduced to 10 seconds for faster failure

    const unsubscribeFunctions: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        // FIXED: Longer timeout and retry logic for Firebase initialization
        let isReady = await waitForFirebase(15000);
        
        // Retry once if not ready
        if (!isReady) {
          console.warn('⚠️ Firebase not ready, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          isReady = await waitForFirebase(10000);
        }
        
        if (!isReady) {
          console.warn('⚠️ Firebase not initialized after retries. Showing default stats.');
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.warn('⚠️ Database not initialized. Showing default stats.');
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        // OPTIMIZED: Don't set loading to true - keep UI visible
        console.log('📊 Setting up real-time platform statistics...');
        setError(null);

        // Users collection - real-time listener
        console.log('📊 Setting up users listener...');
        const usersUnsubscribe = onSnapshot(
          collection(dbInstance, 'users'),
          (snapshot) => {
            const users = snapshot.docs;
            const totalUsers = users.length;
            
            console.log(`📊 Users listener fired: ${totalUsers} users found`);
            
            // Count users by role
            const activeVCs = users.filter(doc => doc.data().role === 'vc').length;
            const activeExchanges = users.filter(doc => doc.data().role === 'exchange').length;
            const activeIDOs = users.filter(doc => doc.data().role === 'ido').length;
            const activeInfluencers = users.filter(doc => doc.data().role === 'influencer').length;
            const activeAgencies = users.filter(doc => doc.data().role === 'agency').length;

            setStats(prev => ({
              ...prev,
              totalUsers,
              activeVCs,
              activeExchanges,
              activeIDOs,
              activeInfluencers,
              activeAgencies
            }));

            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
            console.log('✅ Stats updated:', { totalUsers, activeVCs, activeExchanges, activeIDOs, activeInfluencers, activeAgencies });
          },
          createSnapshotErrorHandler('homepage users stats')
        );
        unsubscribeFunctions.push(usersUnsubscribe);

        // Projects collection - real-time listener
        console.log('📊 Setting up projects listener...');
        const projectsUnsubscribe = onSnapshot(
          collection(dbInstance, 'projects'),
          (snapshot) => {
            const projects = snapshot.docs;
            const activeProjects = projects.length;
            
            console.log(`📊 Projects listener fired: ${activeProjects} projects found`);
            
            // Calculate total funding from actual raised amounts, not goals
            let totalFunding = 0;
            projects.forEach(doc => {
              const data = doc.data();
              // Use currentFunding if available (actual raised), otherwise 0
              if (data.currentFunding && typeof data.currentFunding === 'number' && data.currentFunding > 0) {
                totalFunding += data.currentFunding;
              }
              // Don't use fundingGoal as that's just a target, not actual funding
            });

            setStats(prev => ({
              ...prev,
              activeProjects,
              totalFunding
            }));

            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
            console.log('✅ Projects stats updated:', { activeProjects, totalFunding });
          },
          createSnapshotErrorHandler('homepage projects stats')
        );
        unsubscribeFunctions.push(projectsUnsubscribe);
      } catch (error: any) {
        console.error('❌ Error setting up real-time listeners:', error);
        if (timeoutId) clearTimeout(timeoutId);
        setError('Failed to setup real-time statistics');
        // OPTIMIZED: Keep UI visible even on error
      }
    };
    
    setupListeners();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      console.log('📊 Real-time statistics listeners cleaned up');
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-8 bg-gray-600 rounded mb-1"></div>
              <div className="h-3 bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">Failed to load statistics</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      {/* Active Projects */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="rocket" size={20} className="text-blue-400" />
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active Projects</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeProjects}
        </div>
        <p className="text-white text-xs sm:text-sm">Blockchain projects</p>
      </div>

      {/* Total Funding */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="chart" size={20} className="text-green-400" />
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Total Funding</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.totalFunding === 0 
            ? '$0' 
            : stats.totalFunding < 1000000 
              ? `$${(stats.totalFunding / 1000).toFixed(0)}K`
              : `$${(stats.totalFunding / 1000000).toFixed(1)}M`
          }
        </div>
        <p className="text-white text-xs sm:text-sm">Capital raised</p>
      </div>

      {/* Total Users */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="users" size={20} className="text-orange-400" />
          </div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Total Users</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.totalUsers}
        </div>
        <p className="text-white text-xs sm:text-sm">Platform members</p>
      </div>

      {/* Active VCs */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="building" size={20} className="text-purple-400" />
          </div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active VCs</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeVCs}
        </div>
        <p className="text-white text-xs sm:text-sm">Investment firms</p>
      </div>

      {/* Active Exchanges */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="chart" size={20} className="text-cyan-400" />
          </div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active Exchanges</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeExchanges}
        </div>
        <p className="text-white text-xs sm:text-sm">Trading platforms</p>
      </div>

      {/* Active IDO Platforms */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="rocket" size={20} className="text-emerald-400" />
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active IDO Platforms</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeIDOs}
        </div>
        <p className="text-white text-xs sm:text-sm">Launch platforms</p>
      </div>

      {/* Active Influencers */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="users" size={20} className="text-pink-400" />
          </div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active Influencers</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeInfluencers}
        </div>
        <p className="text-white text-xs sm:text-sm">Content creators</p>
      </div>

      {/* Active Agencies */}
      <div className="bg-black/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-gray-600 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <NeonCyanIcon type="briefcase" size={20} className="text-indigo-400" />
          </div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-white text-sm sm:text-base font-medium mb-1">Active Agencies</h3>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
          {stats.activeAgencies}
        </div>
        <p className="text-white text-xs sm:text-sm">Marketing agencies</p>
      </div>
    </div>
  );
});

export default RealtimeStats;
