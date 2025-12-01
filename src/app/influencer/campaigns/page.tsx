'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { extractProjectLogoUrl } from '@/lib/project-utils';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Campaign {
  id: string;
  projectName: string;
  description: string;
  budget: number;
  status: string;
  createdAt: any;
  startDate?: any;
  endDate?: any;
  requirements?: string;
  deliverables?: string[];
}

interface Project {
  id: string;
  name: string;
  title?: string;
  description: string;
  status?: string;
  seekingMarketing?: boolean;
  targetRoles?: string[];
  visibility?: string;
  fundingGoal?: number;
  currentFunding?: number;
  logo?: string;
  founderId?: string;
  createdAt: any;
}

export default function InfluencerCampaigns() {
  const { user } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
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

        console.log('🔴 [INFLUENCER-CAMPAIGNS] Setting up REAL-TIME projects listener');

        // Real-time listener for projects - filter for accepted campaigns or seeking marketing
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              projectName: data.name || data.title || 'Unknown Project',
              description: data.description || '',
              budget: data.fundingGoal || data.budget || 0,
              status: data.influencerAction === 'accepted' ? 'active' : 
                     data.status === 'approved' ? 'active' : 
                     data.status === 'pending' ? 'pending' : 'completed',
              createdAt: data.createdAt,
              startDate: data.createdAt,
              endDate: data.endDate,
              requirements: data.requirements,
              deliverables: data.deliverables,
              logo: extractProjectLogoUrl({ ...data, id: doc.id }) || null
            };
          }) as Campaign[];

          // Filter: Only show projects accepted by this influencer or seeking marketing
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            return (
              (projectData.influencerAction === 'accepted' && projectData.influencerActionBy === user.uid) ||
              projectData.seekingMarketing === true ||
              (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('influencer')) ||
              projectData.visibility === 'public'
            );
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

          console.log('🔴 [INFLUENCER-CAMPAIGNS] Real-time update:', projectsData.length, 'campaigns');
          setCampaigns(projectsData);
          setLoading(false);
        }, (error: any) => {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [INFLUENCER-CAMPAIGNS] Index error, using fallback');
            setCampaigns([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('influencer campaigns')(error);
            setCampaigns([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up campaigns listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  // Load available projects seeking marketing
  useEffect(() => {
    if (!user) return;

    const setupProjectsListener = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          setLoadingProjects(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoadingProjects(false);
          return;
        }

        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              logo: extractProjectLogoUrl({ ...data, id: doc.id }) || null
            };
          }) as Project[];

          // Filter projects seeking marketing
          projectsData = projectsData.filter(p => {
            const status = (p.status || '').toLowerCase();
            const isApproved = status === 'approved';
            const isSeekingMarketing = p.seekingMarketing === true ||
                                     (p.targetRoles && Array.isArray(p.targetRoles) && p.targetRoles.includes('influencer')) ||
                                     p.visibility === 'public';
            return isApproved && isSeekingMarketing;
          });

          // Sort by createdAt descending
          projectsData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });

          setProjects(projectsData);
          setLoadingProjects(false);
        }, createSnapshotErrorHandler('influencer projects'));

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up projects listener:', error);
        setLoadingProjects(false);
        return () => {};
      }
    };

    const cleanup = setupProjectsListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending').length;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Campaigns</h2>
                <p className="text-white/90 text-lg">Manage your influencer campaigns</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            </div>
            
            {/* Campaign Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{activeCampaigns}</p>
                <p className="text-gray-400 text-sm">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{completedCampaigns}</p>
                <p className="text-gray-400 text-sm">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{pendingCampaigns}</p>
                <p className="text-gray-400 text-sm">Pending</p>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {(['all', 'active', 'completed', 'pending'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Available Projects Seeking Marketing */}
          <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Available Projects Seeking Marketing</h3>
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="text-white/60 mt-4">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No projects seeking marketing at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <div 
                    key={project.id} 
                    className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all cursor-pointer"
                    onClick={() => {
                      if (project.id) {
                        router.push(`/influencer/project/${project.id}`);
                      } else {
                        console.error('❌ [INFLUENCER-CAMPAIGNS] Project ID is missing:', project);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {project.logo ? (
                          <img 
                            src={project.logo} 
                            alt={project.name || project.title} 
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                            <span className="text-white font-bold text-lg">
                              {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-lg mb-2">{project.name || project.title}</h4>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-cyan-400">
                            Seeking Marketing
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                    <button 
                      className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/influencer/project/${project.id}`);
                      }}
                    >
                      View Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns Grid */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">Your Campaigns</h3>
          </div>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 neo-glass-card rounded-xl">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📢</span>
              </div>
              <h3 className="text-white font-medium mb-2">No {filter === 'all' ? '' : filter} campaigns</h3>
              <p className="text-gray-400 text-sm">
                {filter === 'all' 
                  ? "You haven't been assigned any campaigns yet. Check back later!" 
                  : `No ${filter} campaigns found. Try selecting a different filter.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => {
                const logoUrl = (campaign as any).logo || null;
                return (
                <div 
                  key={campaign.id} 
                  className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all group cursor-pointer"
                  onClick={() => router.push(`/influencer/project/${campaign.id}`)}
                >
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
                        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-300 transition-colors">
                          {campaign.projectName}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Budget</span>
                      <span className="text-white font-medium">${(campaign.budget / 1000).toFixed(0)}K</span>
                    </div>
                    
                    {campaign.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Start Date</span>
                        <span className="text-gray-300 text-sm">
                          {campaign.startDate?.toMillis 
                            ? new Date(campaign.startDate.toMillis()).toLocaleDateString()
                            : campaign.startDate?.seconds 
                            ? new Date(campaign.startDate.seconds * 1000).toLocaleDateString()
                            : campaign.startDate instanceof Date
                            ? campaign.startDate.toLocaleDateString()
                            : campaign.startDate
                            ? new Date(campaign.startDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    )}
                    
                    {campaign.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">End Date</span>
                        <span className="text-gray-300 text-sm">
                          {campaign.endDate?.toMillis 
                            ? new Date(campaign.endDate.toMillis()).toLocaleDateString()
                            : campaign.endDate?.seconds 
                            ? new Date(campaign.endDate.seconds * 1000).toLocaleDateString()
                            : campaign.endDate instanceof Date
                            ? campaign.endDate.toLocaleDateString()
                            : campaign.endDate
                            ? new Date(campaign.endDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button 
                      className="w-full px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-cyan-300 rounded-lg font-medium transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/influencer/project/${campaign.id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
