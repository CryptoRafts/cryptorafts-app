'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface PipelineProject {
  id: string;
  name: string;
  title?: string;
  description: string;
  status: string;
  exchangeAction?: string;
  exchangeActionBy?: string;
  createdAt: any;
}

export default function ExchangePipelinePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
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

        console.log('🔴 [EXCHANGE-PIPELINE] Setting up REAL-TIME projects listener');

        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.title || 'Unknown',
              title: data.title,
              description: data.description || '',
              status: data.status || 'pending',
              exchangeAction: data.exchangeAction,
              exchangeActionBy: data.exchangeActionBy,
              createdAt: data.createdAt
            };
          }) as PipelineProject[];

          // Filter: Only show projects accepted by this exchange
          projectsData = projectsData.filter(p => {
            return p.exchangeAction === 'accepted' && p.exchangeActionBy === user.uid;
          });

          // Sort by createdAt descending
          projectsData.sort((a, b) => {
            let timeA = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) {
                timeA = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                timeA = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                timeA = a.createdAt;
              } else if (a.createdAt instanceof Date) {
                timeA = a.createdAt.getTime();
              } else {
                timeA = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let timeB = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) {
                timeB = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                timeB = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                timeB = b.createdAt;
              } else if (b.createdAt instanceof Date) {
                timeB = b.createdAt.getTime();
              } else {
                timeB = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return timeB - timeA;
          });

          console.log('✅ [EXCHANGE-PIPELINE] Real-time update:', projectsData.length, 'projects');
          setProjects(projectsData);
          setLoading(false);
        }, createSnapshotErrorHandler('exchange pipeline projects'));

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up pipeline listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const activeProjects = projects.filter(p => p.status === 'active' || p.exchangeAction === 'accepted').length;
  const pendingProjects = projects.filter(p => p.status === 'pending').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Listing Pipeline</h2>
            <p className="text-white/90 text-lg">Manage your accepted listing projects</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Projects</p>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                </div>
                <NeonCyanIcon type="listings" size={32} className="text-cyan-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Active Listings</p>
                  <p className="text-2xl font-bold text-white">{activeProjects}</p>
                </div>
                <NeonCyanIcon type="globe" size={32} className="text-green-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingProjects}</p>
                </div>
                <NeonCyanIcon type="clock" size={32} className="text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Pipeline Projects</h3>
            {projects.length === 0 ? (
              <div className="text-center py-12 neo-glass-card rounded-xl">
                <NeonCyanIcon type="listings" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Projects in Pipeline</h4>
                <p className="text-cyan-400/70 mb-6">Accept projects from Dealflow to add them to your pipeline</p>
                <Link href="/exchange/dealflow" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  Go to Dealflow
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                  const logoUrl = extractProjectLogoUrl(project);
                  return (
                    <div 
                      key={project.id} 
                      className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/exchange/project/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-lg mb-2">{project.name || project.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'active' || project.exchangeAction === 'accepted' ? 'bg-green-500/20 text-green-400 border border-green-400/30' : 
                            project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' : 
                            'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                          }`}>
                            {project.status || 'pending'}
                          </span>
                        </div>
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={project.name || project.title} 
                            className="w-12 h-12 rounded-lg object-cover ml-4 border border-cyan-400/30"
                            onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center ml-4 border border-cyan-400/30">
                            <span className="text-white font-bold text-sm">
                              {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-cyan-400/70 text-sm mb-4 line-clamp-3">{project.description}</p>
                      <button 
                        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/exchange/project/${project.id}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

