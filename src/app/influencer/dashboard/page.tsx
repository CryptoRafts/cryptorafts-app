'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Campaign {
  id: string;
  projectName: string;
  description: string;
  budget: number;
  earned: number;
  reach: number;
  engagement: number;
  status: 'active' | 'completed' | 'pending';
  startDate: any;
  endDate: any;
  createdAt: any;
}

interface Earning {
  id: string;
  amount: number;
  campaignName: string;
  date: any;
}

interface InfluencerProfile {
  name: string;
  bio: string;
  niche: string;
  followerCount: number;
  country: string;
  city: string;
}

export default function InfluencerDashboard() {
  const { user, isLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListeners = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          console.error('❌ Firebase not initialized');
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        console.log('🔴 [INFLUENCER-DASHBOARD] Setting up REAL-TIME listeners');

        // Real-time listener for projects - filter for accepted campaigns or seeking marketing
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribeCampaigns = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Determine status correctly - check if accepted by THIS influencer
            let campaignStatus: 'active' | 'completed' | 'pending' = 'pending';
            
            if (data.influencerAction === 'accepted' && data.influencerActionBy === user.uid) {
              // Campaign accepted by this influencer - active
              campaignStatus = 'active';
            } else if (data.influencerAction === 'rejected' && data.influencerActionBy === user.uid) {
              // Campaign rejected by this influencer - completed (don't show as active)
              campaignStatus = 'completed';
            } else if (data.status === 'rejected' || data.reviewStatus === 'rejected') {
              // Campaign rejected by admin - completed
              campaignStatus = 'completed';
            } else if (data.influencerAction === 'accepted') {
              // Accepted by another influencer - show as active (they can still see it)
              campaignStatus = 'active';
            } else if (data.status === 'approved' || data.reviewStatus === 'approved') {
              // Approved by admin but not yet accepted - pending
              campaignStatus = 'pending';
            } else {
              // Default to pending for any other state
              campaignStatus = 'pending';
            }
            
            return {
              id: doc.id,
              projectName: data.name || data.title || 'Unknown Project',
              description: data.description || '',
              budget: data.fundingGoal || data.budget || 0,
              earned: data.currentFunding || 0,
              reach: data.analytics?.views || data.views || 0,
              engagement: data.analytics?.interestedInvestors || data.interestedInvestors || 0,
              status: campaignStatus,
              startDate: data.createdAt,
              endDate: data.endDate,
              createdAt: data.createdAt,
              logo: extractProjectLogoUrl({ ...data, id: doc.id }) || null
            };
          }) as Campaign[];

          // Filter: Show projects accepted by this influencer OR seeking marketing OR targeting influencer OR public
          // Match dealflow filtering logic but also include accepted projects
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            
            // EXCLUDE rejected projects
            const status = (projectData.status || '').toLowerCase();
            const reviewStatus = (projectData.reviewStatus || '').toLowerCase();
            if (status === 'rejected' || reviewStatus === 'rejected' || projectData.influencerAction === 'rejected') {
              return false;
            }
            
            // CRITICAL: Only show projects approved by admin
            const isAdminApproved = projectData.status === 'approved' || 
                                   projectData.reviewStatus === 'approved' ||
                                   projectData.adminApproved === true ||
                                   projectData.adminStatus === 'approved';
            
            if (!isAdminApproved) {
              return false; // Don't show unapproved projects
            }
            
            // Show if:
            // 1. Already accepted by this influencer (show on dashboard as "My Campaigns")
            // 2. Seeking marketing (same as dealflow)
            // 3. Target roles includes influencer
            const isAccepted = projectData.influencerAction === 'accepted' && projectData.influencerActionBy === user.uid;
            const isSeekingMarketing = projectData.seekingMarketing === true ||
                                      (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('influencer'));
            
            // Show if approved AND (accepted OR seeking marketing)
            return isAccepted || isSeekingMarketing;
          });

          // Sort client-side by createdAt descending
          projectsData.sort((a, b) => {
            let aTime = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) {
                aTime = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                aTime = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                aTime = a.createdAt;
              } else if (a.createdAt instanceof Date) {
                aTime = a.createdAt.getTime();
              } else {
                aTime = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let bTime = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) {
                bTime = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                bTime = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                bTime = b.createdAt;
              } else if (b.createdAt instanceof Date) {
                bTime = b.createdAt.getTime();
              } else {
                bTime = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return bTime - aTime;
          });

          console.log('🔴 [INFLUENCER-DASHBOARD] Real-time campaigns update:', projectsData.length, 'campaigns');
          setCampaigns(projectsData);
        }, (error: any) => {
          // Handle errors gracefully
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [INFLUENCER-DASHBOARD] Index error, using fallback');
            setCampaigns([]);
          } else {
            createSnapshotErrorHandler('influencer campaigns')(error);
            setCampaigns([]);
          }
        });

        // Earnings - use empty array for now (can be populated from projects later)
        const unsubscribeEarnings = () => {
          setEarnings([]);
        };

        // Load profile data
        const loadProfile = async () => {
          try {
            const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setProfile({
                name: userData.name || '',
                bio: userData.bio || '',
                niche: userData.niche || '',
                followerCount: userData.followerCount || 0,
                country: userData.country || '',
                city: userData.city || ''
              });
            }
          } catch (error) {
            console.error('Error loading profile:', error);
          } finally {
            setLoading(false);
          }
        };

        loadProfile();

        return () => {
          unsubscribeCampaigns();
          unsubscribeEarnings();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalEngagement = campaigns.reduce((sum, c) => sum + c.engagement, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending').length;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {profile?.name || 'Influencer'}! 👋
                </h2>
                <p className="text-white/90 text-lg">
                  Manage your campaigns, track performance metrics, and grow your influence in the Web3 space.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="megaphone" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/influencer/dealflow">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="dealflow" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Dealflow</h3>
                    <p className="text-cyan-400/70 text-sm">Discover projects</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/influencer/campaigns">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="campaigns" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Campaigns</h3>
                    <p className="text-cyan-400/70 text-sm">Manage campaigns</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/influencer/analytics">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="earnings" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analytics</h3>
                    <p className="text-cyan-400/70 text-sm">Performance insights</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/influencer/earnings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="earnings" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Earnings</h3>
                    <p className="text-cyan-400/70 text-sm">Track income</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/influencer/settings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="analytics" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                    <p className="text-cyan-400/70 text-sm">Profile settings</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Campaigns</p>
                  <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                  <p className="text-xs text-cyan-400/70 mt-1">
                    {activeCampaigns} active • {completedCampaigns} completed • {pendingCampaigns} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="users" className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-white">${(totalEarned / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-cyan-400/70 mt-1">
                    {earnings.length} payments received
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="dollar" className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Reach</p>
                  <p className="text-2xl font-bold text-white">{(totalReach / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-cyan-400/70 mt-1">
                    Across all campaigns
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="eye" className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Engagement</p>
                  <p className="text-2xl font-bold text-white">{totalEngagement.toLocaleString()}</p>
                  <p className="text-xs text-cyan-400/70 mt-1">
                    Total interactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="users" className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="influencer" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/influencer/campaigns" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {campaigns.length === 0 ? (
              <div className="neo-glass-card rounded-xl p-12 text-center">
                <NeonCyanIcon type="megaphone" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Campaigns Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start by accepting campaign offers</p>
                <Link href="/influencer/campaigns" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  View Offers
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.slice(0, 6).map((campaign) => {
                  const logoUrl = (campaign as any).logo || null;
                  
                  return (
                  <Link key={campaign.id} href={`/influencer/project/${campaign.id}`}>
                    <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={campaign.projectName} 
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                              <span className="text-white font-bold text-lg">
                                {campaign.projectName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                              {campaign.projectName}
                            </h4>
                            <p className="text-cyan-400/70 text-sm line-clamp-2">{campaign.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          campaign.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                          campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-cyan-400/70 text-xs">Budget</p>
                          <p className="text-white font-semibold">${(campaign.budget / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400/70 text-xs">Earned</p>
                          <p className="text-white font-semibold">${(campaign.earned / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campaign Performance */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Campaign Performance</h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-cyan-400/70">No campaigns yet. Start promoting projects to see your performance here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="neo-glass-card rounded-lg p-4 hover:border-cyan-400/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                          <span className="text-white font-bold text-sm">
                            {campaign.projectName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{campaign.projectName}</h4>
                          <p className="text-cyan-400/70 text-sm">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${campaign.budget}M</p>
                        <p className="text-cyan-400/70 text-sm">{campaign.stage || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
