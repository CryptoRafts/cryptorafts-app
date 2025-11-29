'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Campaign {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'completed' | 'paused';
  budget: number;
  spent: number;
  startDate: any;
  endDate: any;
  createdAt: any;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  title?: string;
  description: string;
  status?: string;
  seekingServices?: boolean;
  targetRoles?: string[];
  visibility?: string;
  fundingGoal?: number;
  currentFunding?: number;
  logo?: string;
  founderId?: string;
  createdAt: any;
}

export default function AgencyCampaigns() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

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

        // Real-time listener for agency campaigns
        const campaignsQuery = query(
          collection(dbInstance, 'agencyCampaigns'),
          where('agencyId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
          const campaignsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Campaign[];

          // Sort by createdAt in memory (if it exists)
          campaignsData.sort((a, b) => {
            const aDate = a.createdAt?.toMillis?.() || 0;
            const bDate = b.createdAt?.toMillis?.() || 0;
            return bDate - aDate;
          });

          console.log('🔴 [AGENCY-CAMPAIGNS] Real-time update: Total campaigns:', campaignsData.length);
          setCampaigns(campaignsData);
          setLoading(false);
        }, createSnapshotErrorHandler('agency campaigns'));

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

  // Load available projects seeking services
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
          let projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];

          // Filter projects seeking services
          projectsData = projectsData.filter(p => {
            const status = (p.status || '').toLowerCase();
            const isApproved = status === 'approved';
            const isSeekingServices = p.seekingServices === true ||
                                     (p.targetRoles && Array.isArray(p.targetRoles) && p.targetRoles.includes('agency')) ||
                                     p.visibility === 'public';
            return isApproved && isSeekingServices;
          });

          // Sort by createdAt descending
          projectsData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });

          setProjects(projectsData);
          setLoadingProjects(false);
        }, createSnapshotErrorHandler('agency projects'));

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

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Campaigns
                </h2>
                <p className="text-white/90 text-lg">
                  Manage and track your marketing campaigns
                </p>
              </div>
              <button
                onClick={() => router.push('/agency/campaigns/new')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center space-x-2 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
              >
                <NeonCyanIcon type="plus" size={20} className="text-current" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Campaigns</p>
                  <p className="text-2xl font-bold text-white">{activeCampaigns}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="megaphone" size={20} className="text-green-400" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Budget</p>
                  <p className="text-2xl font-bold text-white">${(totalBudget / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="dollar" size={20} className="text-blue-400" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${(totalSpent / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="chart" size={20} className="text-cyan-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Available Projects Seeking Services */}
          <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Available Projects Seeking Services</h3>
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="text-white/60 mt-4">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No projects seeking services at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => (
                  <div 
                    key={project.id} 
                    className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all cursor-pointer"
                    onClick={() => {
                      if (project.id) {
                        router.push(`/agency/project/${project.id}`);
                      } else {
                        console.error('❌ [AGENCY-CAMPAIGNS] Project ID is missing:', project);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-2">{project.name || project.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                          Seeking Services
                        </span>
                      </div>
                      {project.logo && (
                        <img src={project.logo} alt={project.name} className="w-12 h-12 rounded-lg object-cover ml-4" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                    <button 
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/agency/project/${project.id}`);
                      }}
                    >
                      View Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns List */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6">Your Campaigns</h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <NeonCyanIcon type="megaphone" size={64} className="text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">No campaigns yet</p>
                <button
                  onClick={() => router.push('/agency/campaigns/new')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">{campaign.name}</h4>
                        <p className="text-gray-400 text-sm mt-1">{campaign.clientName}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {campaign.status}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Budget: ${(campaign.budget / 1000).toFixed(0)}K
                          </span>
                          <span className="text-gray-500 text-xs">
                            Spent: ${(campaign.spent / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-32 bg-gray-600 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-sm">{((campaign.spent / campaign.budget) * 100).toFixed(0)}% used</p>
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
