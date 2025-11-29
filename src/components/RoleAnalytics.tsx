"use client";

import React, { useState, useEffect } from 'react';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface AnalyticsProps {
  role: 'founder' | 'vc' | 'exchange' | 'ido' | 'agency' | 'influencer';
  userId: string;
}

interface AnalyticsData {
  totalItems: number;
  activeItems: number;
  pendingItems: number;
  completedItems: number;
  totalValue: number;
  averageValue: number;
  growthRate: number;
  views: number;
  engagement: number;
  recentActivity: number;
}

export default function RoleAnalytics({ role, userId }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalItems: 0,
    activeItems: 0,
    pendingItems: 0,
    completedItems: 0,
    totalValue: 0,
    averageValue: 0,
    growthRate: 0,
    views: 0,
    engagement: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        // Load role-specific data
        let collectionName = '';
        let filterField: string | null = null;
        let valueField = '';

        switch (role) {
          case 'founder':
            collectionName = 'projects';
            filterField = 'founderId';
            valueField = 'fundingGoal';
            break;
          case 'vc':
            // VC can see all projects - no filter needed
            collectionName = 'projects';
            filterField = null;
            valueField = 'currentFunding';
            break;
          case 'exchange':
            // Exchange sees projects they've accepted or that are seeking listing
            collectionName = 'projects';
            filterField = null; // Will filter client-side for exchangeAction or seekingListing
            valueField = 'fundingGoal';
            break;
          case 'ido':
            // IDO sees projects they've accepted or that are seeking IDO
            collectionName = 'projects';
            filterField = null; // Will filter client-side for idoAction or seekingIDO
            valueField = 'fundingGoal';
            break;
          case 'agency':
            // Agency sees projects they've accepted or that are seeking services
            collectionName = 'projects';
            filterField = null; // Will filter client-side for agencyAction or seekingServices
            valueField = 'fundingGoal';
            break;
          case 'influencer':
            // Influencer sees projects they've accepted or that are seeking marketing
            collectionName = 'projects';
            filterField = null; // Will filter client-side for influencerAction or seekingMarketing
            valueField = 'fundingGoal';
            break;
        }

        // Set up real-time listener - NO orderBy to avoid index requirements
        // We'll sort client-side instead
        let itemsQuery;
        
        if (filterField) {
          itemsQuery = query(
            collection(dbInstance, collectionName),
            where(filterField, '==', userId)
          );
        } else {
          // For roles without specific filter (VC, IDO, Exchange, Agency, Influencer), show all items
          itemsQuery = query(
            collection(dbInstance, collectionName)
          );
        }

        const unsubscribe = onSnapshot(
          itemsQuery,
          async (snapshot) => {
            let items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Apply role-specific filtering for Exchange, IDO, Agency, and Influencer
            // CRITICAL: Complete user isolation - each user only sees their own data
            if (role === 'ido') {
              items = items.filter((item: any) => {
                // Check if accepted by THIS user
                const isAcceptedByThisUser = item.idoAction === 'accepted' && item.idoActionBy === userId;
                
                // Check if accepted by ANOTHER user - EXCLUDE these
                const isAcceptedByAnotherUser = item.idoAction === 'accepted' && 
                                                 item.idoActionBy && 
                                                 item.idoActionBy !== userId;
                
                // EXCLUDE projects accepted by other users (user isolation)
                if (isAcceptedByAnotherUser) {
                  return false;
                }
                
                // Must be approved by admin
                const isApproved = item.status === 'approved' || 
                                 item.reviewStatus === 'approved' ||
                                 item.adminApproved === true ||
                                 item.adminStatus === 'approved';
                
                if (!isApproved) {
                  return false;
                }
                
                // Show if: accepted by THIS user OR seeking IDO (and not accepted by anyone)
                const isSeekingIDO = item.seekingIDO === true ||
                                    (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('ido'));
                
                return isAcceptedByThisUser || (isSeekingIDO && !isAcceptedByAnotherUser);
              });
            } else if (role === 'exchange') {
              items = items.filter((item: any) => {
                // Check if accepted by THIS user (userId is unique for each user)
                const isAcceptedByThisUser = item.exchangeAction === 'accepted' && item.exchangeActionBy === userId;
                
                // Check if accepted by ANOTHER user (different userId) - EXCLUDE these
                const isAcceptedByAnotherUser = item.exchangeAction === 'accepted' && 
                                                 item.exchangeActionBy && 
                                                 item.exchangeActionBy !== userId;
                
                // EXCLUDE projects accepted by other users (user isolation)
                if (isAcceptedByAnotherUser) {
                  return false;
                }
                
                // Must be approved by admin
                const isApproved = item.status === 'approved' || 
                                 item.reviewStatus === 'approved' ||
                                 item.adminApproved === true ||
                                 item.adminStatus === 'approved';
                
                // Show if: accepted by THIS user OR (approved AND seeking listing)
                const isSeekingListing = item.seekingListing === true ||
                                        (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('exchange')) ||
                                        item.visibility === 'public';
                
                return isAcceptedByThisUser || (isApproved && isSeekingListing && !isAcceptedByAnotherUser);
              });
            } else if (role === 'agency') {
              items = items.filter((item: any) => {
                // Check if accepted by THIS user
                const isAcceptedByThisUser = item.agencyAction === 'accepted' && item.agencyActionBy === userId;
                
                // Check if accepted by ANOTHER user - EXCLUDE these
                const isAcceptedByAnotherUser = item.agencyAction === 'accepted' && 
                                                 item.agencyActionBy && 
                                                 item.agencyActionBy !== userId;
                
                // EXCLUDE projects accepted by other users
                if (isAcceptedByAnotherUser) {
                  return false;
                }
                
                // Must be approved by admin
                const isApproved = item.status === 'approved' || 
                                 item.reviewStatus === 'approved' ||
                                 item.adminApproved === true ||
                                 item.adminStatus === 'approved';
                
                const isSeekingServices = item.seekingServices === true ||
                                         (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('agency')) ||
                                         item.visibility === 'public';
                
                return isAcceptedByThisUser || (isApproved && isSeekingServices && !isAcceptedByAnotherUser);
              });
            } else if (role === 'influencer') {
              items = items.filter((item: any) => {
                // Check if accepted by THIS user
                const isAcceptedByThisUser = item.influencerAction === 'accepted' && item.influencerActionBy === userId;
                
                // Check if accepted by ANOTHER user - EXCLUDE these
                const isAcceptedByAnotherUser = item.influencerAction === 'accepted' && 
                                                 item.influencerActionBy && 
                                                 item.influencerActionBy !== userId;
                
                // EXCLUDE projects accepted by other users
                if (isAcceptedByAnotherUser) {
                  return false;
                }
                
                // Must be approved by admin
                const isApproved = item.status === 'approved' || 
                                 item.reviewStatus === 'approved' ||
                                 item.adminApproved === true ||
                                 item.adminStatus === 'approved';
                
                const isSeekingMarketing = item.seekingMarketing === true ||
                                          (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('influencer')) ||
                                          item.visibility === 'public';
                
                return isAcceptedByThisUser || (isApproved && isSeekingMarketing && !isAcceptedByAnotherUser);
              });
            }

            // Sort client-side by createdAt descending (most recent first)
            items.sort((a: any, b: any) => {
              const aTime = a.createdAt?.toDate?.()?.getTime() || 
                           (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 
                           (typeof a.createdAt === 'number' ? a.createdAt : 0) ||
                           (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
              const bTime = b.createdAt?.toDate?.()?.getTime() || 
                           (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 
                           (typeof b.createdAt === 'number' ? b.createdAt : 0) ||
                           (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
              return bTime - aTime; // Descending order
            });

            // Calculate analytics
            const totalItems = items.length;
            const activeItems = items.filter((item: any) => 
              item.status === 'active' || item.status === 'approved' || item.status === 'live'
            ).length;
            const pendingItems = items.filter((item: any) => 
              item.status === 'pending' || item.status === 'under_review'
            ).length;
            const completedItems = items.filter((item: any) => 
              item.status === 'completed' || item.status === 'closed'
            ).length;

            const totalValue = items.reduce((sum: number, item: any) => {
              const value = parseFloat(item[valueField]) || 0;
              return sum + value;
            }, 0);

            const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

            // Calculate growth rate (compare current month vs previous month)
            const now = new Date();
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const currentMonthItems = items.filter((item: any) => {
              const createdAt = item.createdAt?.toDate?.() || 
                              (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
              return createdAt >= currentMonthStart;
            }).length;

            const previousMonthItems = items.filter((item: any) => {
              const createdAt = item.createdAt?.toDate?.() || 
                              (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
              return createdAt >= previousMonthStart && createdAt < currentMonthStart;
            }).length;

            const growthRate = previousMonthItems > 0 
              ? ((currentMonthItems - previousMonthItems) / previousMonthItems) * 100 
              : 0;

            // Calculate views and engagement
            const views = items.reduce((sum: number, item: any) => {
              return sum + (item.analytics?.views || item.views || 0);
            }, 0);

            const engagement = items.reduce((sum: number, item: any) => {
              return sum + (item.analytics?.interestedInvestors || item.interestedInvestors || 0);
            }, 0);

            // Recent activity (items created in last 7 days)
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recentActivity = items.filter((item: any) => {
              const createdAt = item.createdAt?.toDate?.() || 
                              (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
              return createdAt >= sevenDaysAgo;
            }).length;

            setAnalytics({
              totalItems,
              activeItems,
              pendingItems,
              completedItems,
              totalValue,
              averageValue,
              growthRate: Math.round(growthRate * 10) / 10,
              views,
              engagement,
              recentActivity
            });

            setLoading(false);
          },
          (error: any) => {
            // Handle index errors gracefully - fallback to query without orderBy
            if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
              console.warn(`⚠️ Index not found for ${role} analytics, using fallback query without orderBy`);
              
              // Retry with query without orderBy
              let fallbackQuery;
              if (filterField) {
                fallbackQuery = query(
                  collection(dbInstance, collectionName),
                  where(filterField, '==', userId)
                );
              } else {
                fallbackQuery = query(
                  collection(dbInstance, collectionName)
                );
              }
              
              const fallbackUnsubscribe = onSnapshot(
                fallbackQuery,
                async (snapshot) => {
                  let items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));

                  // Apply role-specific filtering for Exchange, IDO, Agency, and Influencer
                  if (role === 'ido') {
                    items = items.filter((item: any) => {
                      const isAcceptedByThisUser = item.idoAction === 'accepted' && item.idoActionBy === userId;
                      const isAcceptedByAnotherUser = item.idoAction === 'accepted' && 
                                                       item.idoActionBy && 
                                                       item.idoActionBy !== userId;
                      if (isAcceptedByAnotherUser) return false;
                      
                      const isApproved = item.status === 'approved' || 
                                       item.reviewStatus === 'approved' ||
                                       item.adminApproved === true ||
                                       item.adminStatus === 'approved';
                      const isSeekingIDO = item.seekingIDO === true ||
                                          (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('ido'));
                      return isAcceptedByThisUser || (isApproved && isSeekingIDO && !isAcceptedByAnotherUser);
                    });
                  } else if (role === 'exchange') {
                    items = items.filter((item: any) => {
                      const isAcceptedByThisUser = item.exchangeAction === 'accepted' && item.exchangeActionBy === userId;
                      const isAcceptedByAnotherUser = item.exchangeAction === 'accepted' && 
                                                       item.exchangeActionBy && 
                                                       item.exchangeActionBy !== userId;
                      if (isAcceptedByAnotherUser) return false;
                      
                      const isApproved = item.status === 'approved' || 
                                       item.reviewStatus === 'approved' ||
                                       item.adminApproved === true ||
                                       item.adminStatus === 'approved';
                      const isSeekingListing = item.seekingListing === true ||
                                              (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('exchange')) ||
                                              item.visibility === 'public';
                      return isAcceptedByThisUser || (isApproved && isSeekingListing && !isAcceptedByAnotherUser);
                    });
                  } else if (role === 'agency') {
                    items = items.filter((item: any) => {
                      const isAcceptedByThisUser = item.agencyAction === 'accepted' && item.agencyActionBy === userId;
                      const isAcceptedByAnotherUser = item.agencyAction === 'accepted' && 
                                                       item.agencyActionBy && 
                                                       item.agencyActionBy !== userId;
                      if (isAcceptedByAnotherUser) return false;
                      
                      const isApproved = item.status === 'approved' || 
                                       item.reviewStatus === 'approved' ||
                                       item.adminApproved === true ||
                                       item.adminStatus === 'approved';
                      const isSeekingServices = item.seekingServices === true ||
                                               (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('agency')) ||
                                               item.visibility === 'public';
                      return isAcceptedByThisUser || (isApproved && isSeekingServices && !isAcceptedByAnotherUser);
                    });
                  } else if (role === 'influencer') {
                    items = items.filter((item: any) => {
                      const isAcceptedByThisUser = item.influencerAction === 'accepted' && item.influencerActionBy === userId;
                      const isAcceptedByAnotherUser = item.influencerAction === 'accepted' && 
                                                       item.influencerActionBy && 
                                                       item.influencerActionBy !== userId;
                      if (isAcceptedByAnotherUser) return false;
                      
                      const isApproved = item.status === 'approved' || 
                                       item.reviewStatus === 'approved' ||
                                       item.adminApproved === true ||
                                       item.adminStatus === 'approved';
                      const isSeekingMarketing = item.seekingMarketing === true ||
                                                (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes('influencer')) ||
                                                item.visibility === 'public';
                      return isAcceptedByThisUser || (isApproved && isSeekingMarketing && !isAcceptedByAnotherUser);
                    });
                  }

                  // Sort client-side by createdAt descending
                  items.sort((a: any, b: any) => {
                    const aTime = a.createdAt?.toDate?.()?.getTime() || 
                                 (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 
                                 (typeof a.createdAt === 'number' ? a.createdAt : 0) ||
                                 (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
                    const bTime = b.createdAt?.toDate?.()?.getTime() || 
                                 (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 
                                 (typeof b.createdAt === 'number' ? b.createdAt : 0) ||
                                 (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
                    return bTime - aTime;
                  });

                  // Calculate analytics (same logic as above)
                  const totalItems = items.length;
                  const activeItems = items.filter((item: any) => 
                    item.status === 'active' || item.status === 'approved' || item.status === 'live'
                  ).length;
                  const pendingItems = items.filter((item: any) => 
                    item.status === 'pending' || item.status === 'under_review'
                  ).length;
                  const completedItems = items.filter((item: any) => 
                    item.status === 'completed' || item.status === 'closed'
                  ).length;

                  const totalValue = items.reduce((sum: number, item: any) => {
                    const value = parseFloat(item[valueField]) || 0;
                    return sum + value;
                  }, 0);

                  const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

                  const now = new Date();
                  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

                  const currentMonthItems = items.filter((item: any) => {
                    const createdAt = item.createdAt?.toDate?.() || 
                                    (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
                    return createdAt >= currentMonthStart;
                  }).length;

                  const previousMonthItems = items.filter((item: any) => {
                    const createdAt = item.createdAt?.toDate?.() || 
                                    (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
                    return createdAt >= previousMonthStart && createdAt < currentMonthStart;
                  }).length;

                  const growthRate = previousMonthItems > 0 
                    ? ((currentMonthItems - previousMonthItems) / previousMonthItems) * 100 
                    : 0;

                  const views = items.reduce((sum: number, item: any) => {
                    return sum + (item.analytics?.views || item.views || 0);
                  }, 0);

                  const engagement = items.reduce((sum: number, item: any) => {
                    return sum + (item.analytics?.interestedInvestors || item.interestedInvestors || 0);
                  }, 0);

                  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const recentActivity = items.filter((item: any) => {
                    const createdAt = item.createdAt?.toDate?.() || 
                                    (item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt));
                    return createdAt >= sevenDaysAgo;
                  }).length;

                  setAnalytics({
                    totalItems,
                    activeItems,
                    pendingItems,
                    completedItems,
                    totalValue,
                    averageValue,
                    growthRate: Math.round(growthRate * 10) / 10,
                    views,
                    engagement,
                    recentActivity
                  });

                  setLoading(false);
                },
                (fallbackError) => {
                  console.error(`❌ Error in fallback query for ${role} analytics:`, fallbackError);
                  setLoading(false);
                }
              );
              
              return () => fallbackUnsubscribe();
            } else {
              // For other errors, use the standard error handler
              createSnapshotErrorHandler(`role analytics ${role}`)(error);
            }
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error(`❌ Error loading ${role} analytics:`, error);
        setLoading(false);
      }
    };

    if (userId) {
      loadAnalytics();
    }
  }, [role, userId]);

  if (loading) {
    return (
      <div className="neo-glass-card rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <NeonCyanIcon type="settings" size={24} className="text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Analytics Overview</h3>
        </div>
        <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/50 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-cyan-400 text-xs font-medium">Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Total</p>
            <NeonCyanIcon type="plus" size={16} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.totalItems}</p>
        </div>

        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Active</p>
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.activeItems}</p>
        </div>

        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Pending</p>
            <NeonCyanIcon type="clock" size={16} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.pendingItems}</p>
        </div>

        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Completed</p>
            <NeonCyanIcon type="check" size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.completedItems}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Total Value</p>
            <NeonCyanIcon type="dollar" size={16} className="text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">
            ${(analytics.totalValue / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-white/60 mt-1">
            Avg: ${(analytics.averageValue / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Growth Rate</p>
            {analytics.growthRate >= 0 ? (
              <NeonCyanIcon type="arrow-up" size={16} className="text-green-400" />
            ) : (
              <NeonCyanIcon type="arrow-down" size={16} className="text-red-400" />
            )}
          </div>
          <p className={`text-xl font-bold ${analytics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate}%
          </p>
          <p className="text-xs text-white/60 mt-1">vs last month</p>
        </div>

        <div className="neo-glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">Engagement</p>
            <NeonCyanIcon type="users" size={16} className="text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white">{analytics.views}</p>
          <p className="text-xs text-white/60 mt-1">
            {analytics.engagement} interested
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-cyan-400/20">
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm">Recent Activity (7 days)</p>
          <p className="text-white font-semibold">{analytics.recentActivity} new items</p>
        </div>
      </div>
    </div>
  );
}

