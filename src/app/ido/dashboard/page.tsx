'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler, getUserDocument } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface IDOProject {
  id: string;
  name: string;
  description: string;
  tokenPrice: number;
  totalRaise: number;
  currentRaise: number;
  participants: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDate: any;
  endDate: any;
  createdAt?: any;
  projectData?: any; // Full project data for logo extraction
}

export default function IDODashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<IDOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>('pending');

  // Check onboarding status and redirect if needed
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady || !isMounted) {
          if (!isReady) {
            console.error('❌ Firebase not initialized');
          }
          return;
        }

        const userData = await getUserDocument(user.uid);
        if (userData && isMounted) {
          // Step 1: Check if profile is completed
          if (!userData.profileCompleted) {
            console.log('🛡️ [IDO-DASHBOARD] Profile not completed, redirecting to register');
            router.push('/ido/register');
            return;
          }

          // Step 2: Check KYB status from user document
          let status = (userData.kybStatus || userData.kyb?.status || userData.kyb_status || 'not_submitted').toLowerCase();
          
          // CRITICAL: Also check organization document as backup (organization is source of truth)
          // This prevents infinite loops when user doc hasn't updated yet but org doc shows approved
          if (status === 'pending' || status === 'submitted' || !status) {
            try {
              const firestoreDb = ensureDb();
              if (firestoreDb) {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const orgsQuery = query(
                  collection(firestoreDb, 'organizations'),
                  where('userId', '==', user.uid)
                );
                const orgsSnapshot = await getDocs(orgsQuery);
                
                if (!orgsSnapshot.empty) {
                  const orgData = orgsSnapshot.docs[0].data();
                  const orgStatus = (orgData.kybStatus || 'pending').toLowerCase();
                  
                  // If organization shows approved/verified, use that instead
                  if (orgStatus === 'approved' || orgStatus === 'verified') {
                    console.log('✅ [IDO-DASHBOARD] Organization shows approved, allowing dashboard access');
                    status = orgStatus;
                    setKybStatus(orgStatus);
                    // Don't redirect - allow dashboard access
                    return;
                  } else if (orgStatus === 'pending' || orgStatus === 'submitted') {
                    status = orgStatus;
                    setKybStatus(orgStatus);
                  }
                }
              }
            } catch (orgError) {
              console.error('Error checking organization document:', orgError);
            }
          }
          
          setKybStatus(status);

          // Step 3: Redirect based on KYB status
          if (status === 'not_submitted' || !status) {
            console.log('🛡️ [IDO-DASHBOARD] KYB not submitted, redirecting to KYB page');
            router.push('/ido/kyb');
          } else if (status === 'pending' || status === 'submitted') {
            console.log('🛡️ [IDO-DASHBOARD] KYB pending approval, redirecting to pending approval');
            router.push('/ido/pending-approval');
          } else if (status === 'rejected') {
            console.log('🛡️ [IDO-DASHBOARD] KYB rejected, redirecting to KYB page');
            router.push('/ido/kyb');
          }
          // If approved/verified, allow access to dashboard
        }
      } catch (error: any) {
        if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
          console.log('⚠️ Onboarding status listener already exists, skipping...');
          return;
        }
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        
        console.log('🔴 [IDO-DASHBOARD] Setting up REAL-TIME projects listener');

        // Real-time listener for projects - filter for accepted IDO projects or seeking IDO
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Determine status correctly - check if accepted by THIS IDO
            let projectStatus: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming';
            
            if (data.idoAction === 'accepted' && data.idoActionBy === user.uid) {
              // Project accepted by this IDO - active
              projectStatus = 'active';
            } else if (data.idoAction === 'rejected' && data.idoActionBy === user.uid) {
              // Project rejected by this IDO - cancelled
              projectStatus = 'cancelled';
            } else if (data.status === 'rejected' || data.reviewStatus === 'rejected') {
              // Project rejected by admin - cancelled
              projectStatus = 'cancelled';
            } else if (data.idoAction === 'accepted') {
              // Accepted by another IDO - show as active (they can still see it)
              projectStatus = 'active';
            } else if (data.status === 'approved' || data.reviewStatus === 'approved') {
              // Approved by admin but not yet accepted - upcoming
              projectStatus = 'upcoming';
            } else {
              // Default to upcoming for any other state
              projectStatus = 'upcoming';
            }
            
            return {
              id: doc.id,
              name: data.name || data.title || 'Unknown Project',
              description: data.description || '',
              tokenPrice: data.tokenPrice || 0,
              totalRaise: data.fundingGoal || 0,
              currentRaise: data.currentFunding || 0,
              participants: data.participants || data.interestedInvestors || 0,
              status: projectStatus,
              startDate: data.createdAt,
              endDate: data.endDate,
              createdAt: data.createdAt,
              projectData: data // Store full project data for logo extraction
            };
          }) as IDOProject[];

          // Filter: Show projects accepted by this IDO OR seeking IDO OR targeting IDO OR public
          // Match dealflow filtering logic but also include accepted projects
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            
            // EXCLUDE rejected projects
            const status = (projectData.status || '').toLowerCase();
            const reviewStatus = (projectData.reviewStatus || '').toLowerCase();
            if (status === 'rejected' || reviewStatus === 'rejected' || projectData.idoAction === 'rejected') {
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
            // 1. Already accepted by this IDO (show on dashboard as "My IDOs")
            // 2. Seeking IDO (same as dealflow)
            // 3. Target roles includes IDO
            const isAccepted = projectData.idoAction === 'accepted' && projectData.idoActionBy === user.uid;
            const isSeekingIDO = projectData.seekingIDO === true ||
                                 (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('ido'));
            
            // Show if approved AND (accepted OR seeking IDO)
            return isAccepted || isSeekingIDO;
          });

          // Sort by createdAt descending (most recent first) - client-side
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
            
            return timeB - timeA; // Descending order (newest first)
          });

          console.log('✅ REAL-TIME [IDO-DASHBOARD]: Projects updated -', projectsData.length, 'projects');
          setProjects(projectsData);
          setLoading(false);
        }, (error: any) => {
          // Handle errors gracefully - show empty state instead of crashing
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [IDO-DASHBOARD] Index error, using fallback');
            setProjects([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('IDO dashboard projects')(error);
            setProjects([]);
            setLoading(false);
          }
        });

        return unsubscribe;
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

  const totalRaised = projects.reduce((sum, p) => sum + p.currentRaise, 0);
  const totalParticipants = projects.reduce((sum, p) => sum + p.participants, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              IDO Platform Dashboard
            </h2>
            <p className="text-white/90 text-lg">
              Launch and manage Initial DEX Offerings, track fundraising progress, and engage with the community.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/ido/dealflow">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="dealflow" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Dealflow</h3>
                    <p className="text-cyan-400/70 text-sm">Review projects</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/ido/launchpad">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="launchpad" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Launchpad</h3>
                    <p className="text-cyan-400/70 text-sm">Launch IDOs</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/ido/analytics">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="dollar" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analytics</h3>
                    <p className="text-cyan-400/70 text-sm">Performance insights</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/ido/settings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="dealflow" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                    <p className="text-cyan-400/70 text-sm">Platform settings</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Projects</p>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                </div>
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="chart" className="text-cyan-400" size={20} />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Active IDOs</p>
                  <p className="text-2xl font-bold text-white">{activeProjects}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="check" size={20} className="text-green-400" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Raised</p>
                  <p className="text-2xl font-bold text-white">${(totalRaised / 1000000).toFixed(1)}M</p>
                </div>
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="dollar" size={20} className="text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Participants</p>
                  <p className="text-2xl font-bold text-white">{totalParticipants.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <NeonCyanIcon type="users" size={20} className="text-cyan-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="ido" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/ido/launchpad" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="neo-glass-card rounded-xl p-12 text-center">
                <NeonCyanIcon type="rocket" size={64} className="text-white/40 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No IDO Projects Yet</h4>
                <p className="text-white/60 mb-6">Start by reviewing projects in Dealflow</p>
                <Link href="/ido/dealflow" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  Review Projects
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((project) => {
                  const logoUrl = project.projectData ? extractProjectLogoUrl(project.projectData) : null;
                  return (
                  <Link key={project.id} href={`/ido/project/${project.id}`}>
                    <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={project.name} 
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${logoUrl ? 'hidden' : 'flex'}`}>
                            <span className="text-white font-bold text-lg">
                              {project.name?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                              {project.name}
                            </h4>
                            <p className="text-white/60 text-sm line-clamp-2">{project.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          project.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-white/60 text-xs">Total Raise</p>
                          <p className="text-white font-semibold">${(project.totalRaise / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-xs">Raised</p>
                          <p className="text-white font-semibold">${(project.currentRaise / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-black/40 rounded-full h-2 border border-cyan-400/20">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((project.currentRaise / project.totalRaise) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* IDO Projects */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">IDO Projects</h3>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No IDO projects yet. Start by creating a new project in Launchpad.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const logoUrl = project.projectData ? extractProjectLogoUrl(project.projectData) : null;
                  return (
                <div key={project.id} className="neo-glass-card rounded-lg p-6 hover:border-cyan-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={project.name} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 ${logoUrl ? 'hidden' : 'flex'}`}>
                        <span className="text-white font-bold text-lg">
                          {project.name?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">{project.name}</h4>
                        <p className="text-white/60 text-sm">{project.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            project.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' : 
                            project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {project.status}
                          </span>
                          <span className="text-white/60 text-xs">
                            {project.participants} participants
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${project.tokenPrice} per token</p>
                      <p className="text-white/60 text-sm">${(project.currentRaise / 1000).toFixed(0)}K / ${(project.totalRaise / 1000).toFixed(0)}K</p>
                      <div className="w-24 bg-black/40 rounded-full h-2 border border-cyan-400/20 mt-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${(project.currentRaise / project.totalRaise) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
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
