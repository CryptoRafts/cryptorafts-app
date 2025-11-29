"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import RoleGate from "@/components/RoleGate";

interface WatchlistItem {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  stage: string;
  sector: string;
  fundingRaised: number;
  teamSize: number;
  logoUrl?: string;
  status: 'active' | 'watching' | 'research';
  addedAt: any;
  notes?: string;
}

export default function WatchlistPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setDataLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        // Real-time watchlist subscription
        const watchlistQuery = query(
          collection(dbInstance, 'watchlist'),
          where('userId', '==', user.uid),
          orderBy('addedAt', 'desc')
        );

        const unsubscribe = onSnapshot(watchlistQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as WatchlistItem[];
          setWatchlistItems(items);
          setDataLoading(false);
        }, createSnapshotErrorHandler('VC watchlist'));

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setDataLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  const handleRemoveFromWatchlist = async (itemId: string) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      await deleteDoc(doc(dbInstance, 'watchlist', itemId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleViewDetails = (projectId: string) => {
    router.push(`/vc/project/${projectId}`);
  };

  const handleDiscoverProjects = () => {
    router.push('/vc/pipeline');
  };

  const handlePortfolioAnalytics = () => {
    router.push('/vc/portfolio');
  };

  const handleMarketTrends = () => {
    router.push('/vc/analytics');
  };

  const stats = {
    totalProjects: watchlistItems.length,
    activeDeals: watchlistItems.filter(item => item.status === 'active').length,
    researchPhase: watchlistItems.filter(item => item.status === 'research').length,
    avgDealSize: watchlistItems.length > 0 
      ? watchlistItems.reduce((sum, item) => sum + item.fundingRaised, 0) / watchlistItems.length / 1000000
      : 0
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Watchlist</h1>
            <p className="text-white/80 text-lg">Track projects you're interested in</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tracked Projects */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-6">Tracked Projects</h2>
                
                <div className="space-y-4">
                  {watchlistItems.length > 0 ? (
                    watchlistItems.map((item) => (
                      <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">
                                {item.projectName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{item.projectName}</h3>
                              <p className="text-white/70 text-sm">{item.sector} • {item.stage}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            item.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'watching' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.status === 'active' ? 'Active' : item.status === 'watching' ? 'Watching' : 'Research'}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mb-3 line-clamp-2">
                          {item.projectDescription}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex space-x-4">
                            <span className="text-white/60">${(item.fundingRaised / 1000000).toFixed(1)}M raised</span>
                            <span className="text-white/60">{item.teamSize} members</span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewDetails(item.projectId)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                            >
                              VIEW DETAILS
                            </button>
                            <button 
                              onClick={() => handleRemoveFromWatchlist(item.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white/70 text-lg mb-4">No projects in your watchlist yet</p>
                      <button 
                        onClick={handleDiscoverProjects}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      >
                        Discover Projects
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleDiscoverProjects}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">💎</span>
                    <div className="text-left">
                      <div className="font-medium">DISCOVER PROJECTS</div>
                      <div className="text-xs text-purple-200">FIND NEW INVESTMENT OPPORTUNITIES</div>
                    </div>
                  </button>
                  <button 
                    onClick={handlePortfolioAnalytics}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">📊</span>
                    <div className="text-left">
                      <div className="font-medium">PORTFOLIO ANALYTICS</div>
                      <div className="text-xs text-blue-200">VIEW PERFORMANCE METRICS</div>
                    </div>
                  </button>
                  <button 
                    onClick={handleMarketTrends}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">📈</span>
                    <div className="text-left">
                      <div className="font-medium">MARKET TRENDS</div>
                      <div className="text-xs text-green-200">INDUSTRY INSIGHTS AND ANALYSIS</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Watchlist Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Total Projects</span>
                    <span className="text-white font-medium">{stats.totalProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Active Deals</span>
                    <span className="text-white font-medium">{stats.activeDeals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Research Phase</span>
                    <span className="text-white font-medium">{stats.researchPhase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Avg. Deal Size</span>
                    <span className="text-white font-medium">${stats.avgDealSize.toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
