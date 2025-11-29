'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, collection, onSnapshot, query, where, doc, getDoc } from '@/lib/firebase.client';
import { ensureDb, waitForFirebase, getUserDocument, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Project {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  tagline?: string;
  stage?: string;
  status?: string;
  fundingGoal?: number;
  currentFunding?: number;
  logo?: string;
  logoUrl?: string;
  image?: string;
  createdAt?: any;
  acceptedBy?: string;
}

export default function VCDashboard() {
  const { user, isLoading, claims } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
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
            console.log('🛡️ [VC-DASHBOARD] Profile not completed, redirecting to register');
            router.push('/vc/register');
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
                    console.log('✅ [VC-DASHBOARD] Organization shows approved, allowing dashboard access');
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
              console.warn('⚠️ Could not check organization status:', orgError);
            }
          }
          
          setKybStatus(status);

          // Step 3: Redirect based on KYB status
          if (status === 'not_submitted' || !status) {
            console.log('🛡️ [VC-DASHBOARD] KYB not submitted, redirecting to KYB page');
            router.push('/vc/kyb');
          } else if (status === 'pending' || status === 'submitted') {
            console.log('🛡️ [VC-DASHBOARD] KYB pending approval, redirecting to pending approval');
            router.push('/vc/pending-approval');
          } else if (status === 'rejected') {
            console.log('🛡️ [VC-DASHBOARD] KYB rejected, redirecting to KYB page');
            router.push('/vc/kyb');
          }
          // If approved/verified, allow access to dashboard
        }
      } catch (error: any) {
        // Suppress "Target ID already exists" errors
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

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // Enhanced Firebase initialization with retry
        let isReady = await waitForFirebase(10000);
        if (!isReady) {
          console.warn('⚠️ Firebase not ready, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          isReady = await waitForFirebase(10000);
        }
        
        if (!isReady || !isMounted) {
          if (!isReady) {
            console.error('❌ Firebase not initialized after retries');
          }
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance || !isMounted) {
          console.error('❌ Database instance not available');
          setLoading(false);
          return;
        }
        
        console.log('🔴 [VC-DASHBOARD] Setting up REAL-TIME project listeners for:', user.email);
        
        // Query without orderBy to avoid index requirements - sort client-side
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          if (!isMounted) return;
          
          const projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];

          // Sort by createdAt descending (most recent first) - client-side
          projectsData.sort((a, b) => {
            // Handle Firestore Timestamp objects
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

          console.log('✅ REAL-TIME [VC-DASHBOARD]: Projects updated -', projectsData.length, 'total projects');
          setProjects(projectsData);
          setLoading(false);
        }, (error: any) => {
          if (!isMounted) return;
          
          // Suppress "Target ID already exists" errors
          if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
            console.log('⚠️ Project listener already exists, skipping...');
            setLoading(false);
            return;
          }
          
          // Handle index errors gracefully
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ Index error, retrying with simple query:', error);
            // Retry with simple query
            try {
              const simpleQuery = query(collection(dbInstance, 'projects'));
              unsubscribe = onSnapshot(simpleQuery, (snapshot) => {
                if (!isMounted) return;
                const projectsData = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Project[];
                projectsData.sort((a, b) => {
                  const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
                  const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
                  return timeB - timeA;
                });
                setProjects(projectsData);
                setLoading(false);
              });
            } catch (retryError) {
              console.error('❌ Error retrying with simple query:', retryError);
              setLoading(false);
            }
            return;
          }
          
          console.error('❌ Error [VC-DASHBOARD] listening to projects:', error);
          setLoading(false);
        });
      } catch (error: any) {
        if (!isMounted) return;
        
        // Suppress "Target ID already exists" errors
        if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
          console.log('⚠️ Project listener already exists, skipping...');
          setLoading(false);
          return;
        }
        console.error('❌ Error setting up Firebase listener:', error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const pendingProjects = projects.filter(p => {
    const status = (p.status || p.stage || '').toLowerCase();
    return status === 'pending' || status === 'submitted' || status === 'review';
  });
  
  // Normalize accepted projects - check multiple fields for consistency
  const acceptedProjects = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    const stage = (p.stage || '').toLowerCase();
    const acceptedBy = p.acceptedBy || (p as any).accepted_by;
    
    // Accepted if:
    // 1. status is 'accepted' AND acceptedBy matches current user
    // 2. stage is 'accepted' AND acceptedBy matches current user
    // 3. status is 'accepted' (even without acceptedBy for admin view)
    return (status === 'accepted' && (acceptedBy === user?.uid || !acceptedBy)) ||
           (stage === 'accepted' && acceptedBy === user?.uid);
  }).map(p => ({
    ...p,
    // Normalize fields for consistent display
    name: p.name || p.title || 'Untitled Project',
    title: p.title || p.name || 'Untitled Project',
    description: p.description || p.tagline || (p as any).valueProposition || '',
    logo: p.logo || p.logoUrl || p.image || null,
    logoUrl: p.logoUrl || p.logo || p.image || null,
    status: p.status || 'accepted',
    acceptedBy: p.acceptedBy || (p as any).accepted_by || user?.uid
  }));

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome to Your Investment Hub
              </h2>
              <p className="text-white/90 text-lg">
                Discover, evaluate, and invest in the next generation of Web3 projects.
              </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Apply for Spotlight */}
            <Link href="/vc/spotlight/apply">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="check" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Apply for Spotlight</h3>
                    <p className="text-cyan-400/70 text-sm">Get featured on our platform</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Add Team */}
            <Link href="/vc/team">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="user-plus" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Add Team</h3>
                    <p className="text-cyan-400/70 text-sm">Manage your team members</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Portfolio */}
            <Link href="/vc/portfolio">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="briefcase" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Portfolio</h3>
                    <p className="text-cyan-400/70 text-sm">View your investments</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* RaftAI Overview Section */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <NeonCyanIcon type="robot" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">RaftAI Overview</h3>
                  <p className="text-cyan-400/70 text-sm">AI-Powered Investment Intelligence</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-400 text-sm font-medium">Active</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI Analysis */}
              <div className="neo-glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">AI Analysis</h4>
                  <NeonCyanIcon type="chart" size={24} className="text-cyan-400" />
                </div>
                <p className="text-white/70 text-sm mb-4">
                  Real-time project analysis with risk assessment, market fit evaluation, and investment recommendations.
                </p>
                <div className="flex items-center space-x-2 text-cyan-400 text-sm">
                  <NeonCyanIcon type="check" size={16} className="text-cyan-400" />
                  <span>Active on all projects</span>
                </div>
              </div>

              {/* Risk Scoring */}
              <div className="neo-glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Risk Scoring</h4>
                  <NeonCyanIcon type="shield" size={24} className="text-cyan-400" />
                </div>
                <p className="text-white/70 text-sm mb-4">
                  Automated risk assessment combining compliance, community sentiment, and token data analysis.
                </p>
                <div className="flex items-center space-x-2 text-cyan-400 text-sm">
                  <span>✓</span>
                  <span>0-100 reliability score</span>
                </div>
              </div>

              {/* Smart Recommendations */}
              <div className="neo-glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Smart Recommendations</h4>
                  <NeonCyanIcon type="lightbulb" size={24} className="text-cyan-400" />
                </div>
                <p className="text-white/70 text-sm mb-4">
                  AI-driven insights on project potential, team credibility, and market readiness for informed decisions.
                </p>
                <div className="flex items-center space-x-2 text-cyan-400 text-sm">
                  <span>✓</span>
                  <span>Real-time insights</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold mb-2">RaftAI Features Available</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Project Analysis</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Risk Assessment</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Market Prediction</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Sentiment Analysis</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Tokenomics Review</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-400/30">Team Verification</span>
                  </div>
                </div>
                {claims?.role === 'admin' ? (
                  <Link href="/admin/raftai" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                    View RaftAI Dashboard
                  </Link>
                ) : (
                  <Link href="/vc/dealflow" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                    View Projects
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="vc" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/vc/portfolio" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {acceptedProjects.length === 0 ? (
              <div className="neo-glass-card rounded-xl p-12 text-center">
                <span className="text-6xl mb-4 block">📊</span>
                <h4 className="text-xl font-bold text-white mb-2">No Investments Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start exploring projects to build your portfolio</p>
                <Link href="/vc/dealflow" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  Explore Projects
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedProjects.slice(0, 6).map((project) => (
                  <Link key={project.id} href={`/vc/project/${project.id}`}>
                    <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Project Logo */}
                          {(project.logo || project.logoUrl || project.image || (project as any).image) ? (
                            <img 
                              src={project.logo || project.logoUrl || project.image || (project as any).image} 
                              alt={project.name || project.title || 'Project'} 
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Show fallback
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 ${(project.logo || project.logoUrl || project.image || (project as any).image) ? 'hidden' : 'flex'}`}>
                            <span className="text-white font-bold text-lg">
                              {(project.name || project.title || project.tagline || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2 line-clamp-1">
                              {project.name || (project as any).title || 'Untitled Project'}
                            </h4>
                            <p className="text-cyan-400/70 text-sm line-clamp-2">{project.description || (project as any).tagline || ''}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 flex-shrink-0 border border-cyan-400/30">
                          Accepted
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-cyan-400/70 text-xs">Funding Goal</p>
                          <p className="text-white font-semibold">${((project.fundingGoal || 0) / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400/70 text-xs">Stage</p>
                          <p className="text-white font-semibold">{project.stage || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Investment Pipeline */}
          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Investment Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pipeline Stages */}
              <div className="neo-glass-card rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">KYB</h4>
                <div className="text-2xl font-bold text-green-400 mb-1">✅</div>
                <p className="text-cyan-400/70 text-xs">Completed</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/20">
                <h4 className="text-sm font-medium text-white mb-2">Due Diligence</h4>
                <div className="text-2xl font-bold text-yellow-400 mb-1">⏳</div>
                <p className="text-cyan-400/70 text-xs">In Progress</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/20">
                <h4 className="text-sm font-medium text-white mb-2">Company Check</h4>
                <div className="text-2xl font-bold text-cyan-400/70 mb-1">⏸️</div>
                <p className="text-cyan-400/70 text-xs">Pending</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/20">
                <h4 className="text-sm font-medium text-white mb-2">Token Audit</h4>
                <div className="text-2xl font-bold text-cyan-400/70 mb-1">⏸️</div>
                <p className="text-cyan-400/70 text-xs">Pending</p>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Projects</h3>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="neo-glass-card rounded-lg p-4 hover:border-cyan-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                        <span className="text-white font-bold text-sm">
                          {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{project.name || project.title || 'Untitled'}</h4>
                        <p className="text-cyan-400/70 text-sm">{project.description || project.tagline || ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${project.fundingGoal}M</p>
                      <p className="text-cyan-400/70 text-sm">{project.stage}</p>
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