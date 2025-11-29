'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler, getUserDocument } from '@/lib/firebase-utils';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Client {
  id: string;
  name: string;
  project: string;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'pending';
  startDate?: any;
  endDate?: any;
  createdAt?: any;
}

export default function AgencyDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
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
            console.log('🛡️ [AGENCY-DASHBOARD] Profile not completed, redirecting to register');
            router.push('/agency/register');
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
                    console.log('✅ [AGENCY-DASHBOARD] Organization shows approved, allowing dashboard access');
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
            console.log('🛡️ [AGENCY-DASHBOARD] KYB not submitted, redirecting to KYB page');
            router.push('/agency/kyb');
          } else if (status === 'pending' || status === 'submitted') {
            console.log('🛡️ [AGENCY-DASHBOARD] KYB pending approval, redirecting to pending approval');
            router.push('/agency/pending-approval');
          } else if (status === 'rejected') {
            console.log('🛡️ [AGENCY-DASHBOARD] KYB rejected, redirecting to KYB page');
            router.push('/agency/kyb');
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
        
        // Real-time listener for projects - filter for accepted projects or seeking services
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          console.log(`🔴 [AGENCY-DASHBOARD] Raw projects from Firestore: ${snapshot.docs.length}`);
          
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Determine status correctly - check if accepted by THIS agency
            let clientStatus: 'active' | 'completed' | 'pending' = 'pending';
            
            if (data.agencyAction === 'accepted' && data.agencyActionBy === user.uid) {
              // Project accepted by this agency - active
              clientStatus = 'active';
            } else if (data.agencyAction === 'rejected' && data.agencyActionBy === user.uid) {
              // Project rejected by this agency - completed (don't show as active)
              clientStatus = 'completed';
            } else if (data.status === 'rejected' || data.reviewStatus === 'rejected') {
              // Project rejected by admin - completed
              clientStatus = 'completed';
            } else if (data.agencyAction === 'accepted') {
              // Accepted by another agency - show as active (they can still see it)
              clientStatus = 'active';
            } else if (data.status === 'approved' || data.reviewStatus === 'approved') {
              // Approved by admin but not yet accepted - pending
              clientStatus = 'pending';
            } else {
              // Default to pending for any other state
              clientStatus = 'pending';
            }
            
            return {
              id: doc.id,
              name: data.name || data.title || 'Unknown Project',
              project: data.name || data.title || 'Unknown',
              budget: data.fundingGoal || data.budget || 0,
              spent: data.currentFunding || 0,
              status: clientStatus,
              startDate: data.createdAt,
              endDate: data.endDate,
              createdAt: data.createdAt
            };
          }) as Client[];

          // Filter: VERY LENIENT - show all projects that aren't explicitly rejected
          // Similar to VC dashboard - show everything except rejected
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            
            // EXCLUDE only if explicitly rejected
            const status = (projectData.status || '').toLowerCase();
            const reviewStatus = (projectData.reviewStatus || '').toLowerCase();
            if (status === 'rejected' || reviewStatus === 'rejected' || projectData.agencyAction === 'rejected') {
              return false;
            }
            
            // Show ALL other projects (very lenient - like VC dashboard)
            // This includes:
            // - Accepted by this agency
            // - Seeking services
            // - Targeting agency
            // - Public visibility
            // - Any project with pending/active/approved/submitted/review status
            // - Any project without explicit rejection
            
            // CRITICAL: Only show projects approved by admin
            const isAdminApproved = projectData.status === 'approved' || 
                                   projectData.reviewStatus === 'approved' ||
                                   projectData.adminApproved === true ||
                                   projectData.adminStatus === 'approved';
            
            if (!isAdminApproved) {
              return false; // Don't show unapproved projects
            }
            
            const isAccepted = projectData.agencyAction === 'accepted' && projectData.agencyActionBy === user.uid;
            const isSeekingServices = projectData.seekingServices === true ||
                                     (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('agency'));
            
            // Show if approved AND (accepted OR seeking services)
            const shouldShow = isAccepted || isSeekingServices;
            
            if (!shouldShow) {
              console.log(`⚠️ [AGENCY-DASHBOARD] Filtered out project ${p.id}:`, {
                status: projectData.status,
                seekingServices: projectData.seekingServices,
                targetRoles: projectData.targetRoles,
                visibility: projectData.visibility,
                agencyAction: projectData.agencyAction
              });
            }
            
            return shouldShow;
          });
          
          console.log(`✅ [AGENCY-DASHBOARD] Filtered projects: ${projectsData.length} out of ${snapshot.docs.length} total projects`);

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

          console.log('🔴 [AGENCY-DASHBOARD] Real-time update: Total clients:', projectsData.length);
          setClients(projectsData);
          setLoading(false);
        }, (error: any) => {
          // Handle errors gracefully - show empty state instead of crashing
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [AGENCY-DASHBOARD] Index error, using fallback');
            setClients([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('agency projects')(error);
            setClients([]);
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

  const totalBudget = clients.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = clients.reduce((sum, c) => sum + c.spent, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;
  const completedProjects = clients.filter(c => c.status === 'completed').length;

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
                  Welcome to Your Agency Hub
                </h2>
                <p className="text-white/90 text-lg">
                  Manage client campaigns, track marketing performance, and grow your agency's impact in the Web3 ecosystem.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="campaigns" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/agency/dealflow">
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

            <Link href="/agency/campaigns">
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

            <Link href="/agency/clients">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="clients" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Clients</h3>
                    <p className="text-cyan-400/70 text-sm">Client management</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/agency/analytics">
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

            <Link href="/agency/settings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="clients" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                    <p className="text-cyan-400/70 text-sm">Agency settings</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="agency" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/agency/clients" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {clients.length === 0 ? (
              <div className="neo-glass-card rounded-xl p-12 text-center">
                <NeonCyanIcon type="building" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Clients Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start by accepting campaigns from projects</p>
                <Link href="/agency/campaigns" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  View Campaigns
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.slice(0, 6).map((client) => (
                  <Link key={client.id} href={`/agency/clients/${client.id}`}>
                    <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                            {client.name}
                          </h4>
                          <p className="text-cyan-400/70 text-sm">{client.project}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          client.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                          client.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-cyan-400/70 text-xs">Budget</p>
                          <p className="text-white font-semibold">${(client.budget / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400/70 text-xs">Spent</p>
                          <p className="text-white font-semibold">${(client.spent / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Client Projects */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Client Projects</h3>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-cyan-400/70">No client projects yet. Start by accepting campaigns from projects.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="neo-glass-card rounded-lg p-4 hover:border-cyan-400/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                          <span className="text-white font-bold text-sm">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{client.name}</h4>
                          <p className="text-cyan-400/70 text-sm">{client.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${(client.budget / 1000).toFixed(0)}K</p>
                        <p className="text-cyan-400/70 text-sm">{client.stage || 'N/A'}</p>
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
