'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, collection, onSnapshot, query, where } from '@/lib/firebase.client';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  fundingGoal: number;
  currentFunding: number;
  createdAt: any;
  views: number;
}

// Using shared utility function from project-utils

export default function FounderDashboard() {
  const { user, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      // Wait for Firebase to be initialized
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        
        // Real-time listener for user's projects - no orderBy to avoid index requirements
        const projectsQuery = query(
          collection(dbInstance, 'projects'),
          where('founderId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          const projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: (doc.data().updatedAt?.toDate && typeof doc.data().updatedAt.toDate === 'function') 
              ? doc.data().updatedAt.toDate() 
              : (doc.data().updatedAt ? new Date(doc.data().updatedAt) : new Date()),
          })) as unknown as Project[];

          // Sort by createdAt descending (most recent first) - client-side
          projectsData.sort((a, b) => {
            let timeA = 0;
            if (a.createdAt) {
              if (a.createdAt instanceof Date) {
                timeA = a.createdAt.getTime();
              } else if (a.createdAt.toMillis) {
                timeA = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                timeA = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                timeA = a.createdAt;
              } else {
                timeA = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let timeB = 0;
            if (b.createdAt) {
              if (b.createdAt instanceof Date) {
                timeB = b.createdAt.getTime();
              } else if (b.createdAt.toMillis) {
                timeB = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                timeB = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                timeB = b.createdAt;
              } else {
                timeB = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return timeB - timeA; // Descending order (newest first)
          });

          console.log('✅ REAL-TIME [FOUNDER-DASHBOARD]: Projects updated -', projectsData.length, 'projects');
          setProjects(projectsData);
          setLoading(false);
        }, (error: any) => {
          // Suppress Firestore internal assertion errors
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('FIRESTORE') && 
              errorMessage.includes('INTERNAL ASSERTION FAILED') &&
              (errorMessage.includes('Unexpected state') || 
               errorMessage.includes('ID: ca9') || 
               errorMessage.includes('ID: b815'))) {
            // Silently suppress - these are internal SDK errors
            setLoading(false);
            return;
          }
          console.error('❌ Error [FOUNDER-DASHBOARD] listening to projects:', error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const totalFunding = projects.reduce((sum, p: any) => sum + (p.currentFunding || 0), 0);
  const totalViews = projects.reduce((sum, p: any) => sum + (p.views || 0), 0);
  const activeProjects = projects.filter((p: any) => p.status === 'active' || p.status === 'approved').length;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black"
      >
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="neo-glass-card rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-white mb-3">
                  Welcome back, Founder
                </h2>
                <p className="text-white/80 text-lg max-w-2xl">
                  Manage your projects, track funding progress, and connect with investors in the crypto ecosystem.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="rocket" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/founder/pitch">
                <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-cyan-400/30">
                      <NeonCyanIcon type="rocket" size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Pitch Project</h3>
                      <p className="text-cyan-400/70 text-sm">Submit new project</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/founder/projects">
                <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-cyan-400/30">
                      <NeonCyanIcon type="analytics" size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">My Projects</h3>
                      <p className="text-cyan-400/70 text-sm">Manage projects</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/founder/messages">
                <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-cyan-400/30">
                      <NeonCyanIcon type="chat" size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Messages</h3>
                      <p className="text-cyan-400/70 text-sm">Chat with investors</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/founder/settings">
                <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-cyan-400/30">
                      <NeonCyanIcon type="settings" size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Settings</h3>
                      <p className="text-cyan-400/70 text-sm">Account settings</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="founder" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/founder/projects" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="neo-glass-card rounded-2xl p-12 text-center">
                <NeonCyanIcon type="rocket" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Projects Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start by creating your first project pitch</p>
                <Link href="/founder/pitch" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project: any) => (
                  <Link key={project.id} href="/founder/projects">
                    <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      {/* Project Logo */}
                      {(() => {
                        const logoUrl = extractProjectLogoUrl(project);
                        return logoUrl ? (
                          <div className="mb-4 flex justify-center">
                            <img 
                              src={logoUrl} 
                              alt={project.name || 'Project'}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-400/30"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center shadow-lg border border-cyan-400/30 mb-4 mx-auto">
                            <span className="text-white font-bold text-xl">
                              {project.name?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                        );
                      })()}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                            {project.name || project.title || 'Untitled Project'}
                          </h4>
                          <p className="text-cyan-400/70 text-sm line-clamp-2">{project.description || 'No description'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          project.status === 'active' || project.status === 'approved' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                          project.status === 'pending' || project.status === 'pending_review' || project.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                          'bg-black/40 text-cyan-400/70 border-cyan-400/20'
                        }`}>
                          {project.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </div>
                      
                      {/* Documents Badge */}
                      {(project.pitch?.documents || project.documents) && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {project.pitch?.documents?.pitchDeck || project.documents?.pitchDeck ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Deck</span>
                          ) : null}
                          {project.pitch?.documents?.whitepaper || project.documents?.whitepaper ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">WP</span>
                          ) : null}
                          {project.pitch?.documents?.tokenomics || project.documents?.tokenomics ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Token</span>
                          ) : null}
                          {project.pitch?.documents?.roadmap || project.documents?.roadmap ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Roadmap</span>
                          ) : null}
                        </div>
                      )}
                      
                      {/* Team Badge */}
                      {project.pitch?.teamMembers && project.pitch.teamMembers.length > 0 && (
                        <div className="mb-3">
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            Team: {project.pitch.teamMembers.length}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-cyan-400/70 text-xs">Funding Goal</p>
                          <p className="text-white font-semibold">
                            ${project.fundingGoal ? (project.fundingGoal / 1000).toFixed(0) + 'K' : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400/70 text-xs">Raised</p>
                          <p className="text-white font-semibold">
                            ${project.currentFunding ? (project.currentFunding / 1000).toFixed(0) + 'K' : '0K'}
                          </p>
                        </div>
                      </div>
                      {project.fundingGoal && project.fundingGoal > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-black/40 rounded-full h-2 border border-cyan-400/20">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(((project.currentFunding || 0) / project.fundingGoal) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Projects */}
          <div className="neo-glass-card rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Recent Projects</h3>
              <Link href="/founder/projects" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                View All →
              </Link>
            </div>
            <div className="space-y-6">
              {projects.map((project: any) => (
                <div key={project.id} className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Project Logo */}
                      {(() => {
                        const logoUrl = extractProjectLogoUrl(project);
                        return logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={project.name || 'Project'}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-400/30"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null;
                      })()}
                      {(() => {
                        const hasLogo = !!extractProjectLogoUrl(project);
                        return (
                          <div className={`w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30 ${hasLogo ? 'hidden' : ''}`}>
                            <span className="text-white font-bold text-xl">
                              {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-2">{project.name || project.title || 'Untitled Project'}</h4>
                        <p className="text-white/70 text-sm mb-3 max-w-md">{project.description || 'No description'}</p>
                        
                        {/* Documents & Team Info */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {(project.pitch?.documents || project.documents) && (
                            <>
                              {project.pitch?.documents?.pitchDeck || project.documents?.pitchDeck ? (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Pitch Deck</span>
                              ) : null}
                              {project.pitch?.documents?.whitepaper || project.documents?.whitepaper ? (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Whitepaper</span>
                              ) : null}
                              {project.pitch?.documents?.tokenomics || project.documents?.tokenomics ? (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Tokenomics</span>
                              ) : null}
                              {project.pitch?.documents?.roadmap || project.documents?.roadmap ? (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">Roadmap</span>
                              ) : null}
                            </>
                          )}
                          {project.pitch?.teamMembers && project.pitch.teamMembers.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                              Team: {project.pitch.teamMembers.length}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            project.status === 'active' || project.status === 'approved'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : project.status === 'pending' || project.status === 'pending_review' || project.status === 'under_review'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-black/40 text-cyan-400/70 border-cyan-400/20'
                          }`}>
                            {(project.status || 'pending').replace('_', ' ').charAt(0).toUpperCase() + (project.status || 'pending').replace('_', ' ').slice(1)}
                          </span>
                          <span className="text-cyan-400/70 text-xs flex items-center">
                            <NeonCyanIcon type="eye" size={16} className="text-current mr-1" />
                            {(project.views || 0).toLocaleString()} views
                          </span>
                          <span className="text-cyan-400/70 text-xs flex items-center">
                            <NeonCyanIcon type="clock" size={16} className="text-current mr-1" />
                            {project.createdAt ? (project.createdAt instanceof Date ? project.createdAt.toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()) : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-white font-bold text-lg">
                          ${project.fundingGoal ? ((project.fundingGoal / 1000).toFixed(0) + 'K') : 'N/A'}
                        </p>
                        <p className="text-cyan-400/70 text-sm">Funding Goal</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-cyan-400 font-semibold">
                          ${project.currentFunding ? ((project.currentFunding / 1000).toFixed(0) + 'K') : '0K'}
                        </p>
                        <p className="text-cyan-400/70 text-sm">Raised</p>
                      </div>
                      {project.fundingGoal && project.fundingGoal > 0 && (
                        <>
                          <div className="w-32 bg-black/40 rounded-full h-3 border border-cyan-400/20">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((project.currentFunding || 0) / project.fundingGoal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-cyan-400/70 text-xs mt-1">
                            {(((project.currentFunding || 0) / project.fundingGoal) * 100).toFixed(1)}% funded
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
