'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  createdAt: any;
}

export default function IDOLaunchpadPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<IDOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>('pending');

  // Check KYB status
  useEffect(() => {
    if (!user) return;

    const checkKYBStatus = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) return;
        
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const status = data.kybStatus || data.kyb?.status || 'pending';
          setKybStatus(status);

          if (status !== 'verified' && status !== 'approved') {
            router.push('/ido/pending-approval');
          }
        }
      } catch (error) {
        console.error('Error checking KYB status:', error);
      }
    };

    checkKYBStatus();
  }, [user, router]);

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

        console.log('🔴 [IDO-LAUNCHPAD] Setting up REAL-TIME projects listener');

        // Real-time listener for projects - filter for accepted IDO projects or seeking IDO
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.title || 'Unknown Project',
              description: data.description || '',
              tokenPrice: data.tokenPrice || 0,
              totalRaise: data.fundingGoal || 0,
              currentRaise: data.currentFunding || 0,
              participants: data.participants || data.interestedInvestors || 0,
              status: data.idoAction === 'accepted' ? 'active' : 
                     data.status === 'approved' ? 'active' : 
                     data.status === 'pending' ? 'upcoming' : 'completed',
              createdAt: data.createdAt
            };
          }) as IDOProject[];

          // Filter: Only show projects accepted by this IDO or seeking IDO
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            return (
              (projectData.idoAction === 'accepted' && projectData.idoActionBy === user.uid) ||
              projectData.seekingIDO === true ||
              (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('ido')) ||
              projectData.visibility === 'public'
            );
          });

          // Sort client-side by createdAt descending
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

          console.log('🔴 [IDO-LAUNCHPAD] Real-time update:', projectsData.length, 'projects');
          setProjects(projectsData);
          setLoading(false);
        }, (error: any) => {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [IDO-LAUNCHPAD] Index error, using fallback');
            setProjects([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('IDO launchpad projects')(error);
            setProjects([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up projects listener:', error);
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Launchpad</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  Launch and manage IDO projects
                </p>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 neo-glass-card rounded-xl p-8">
              <NeonCyanIcon type="rocket" size={64} className="text-cyan-400/50 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">No IDO Projects Yet</h4>
              <p className="text-cyan-400/70 mb-6">Start by reviewing projects in Dealflow</p>
              <Link href="/ido/dealflow" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                Review Projects
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="neo-glass-card rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-500/20 cursor-pointer"
                  onClick={() => {
                    if (project.id) {
                      router.push(`/ido/project/${project.id}`);
                    } else {
                      console.error('❌ [IDO-LAUNCHPAD] Project ID is missing:', project);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {(() => {
                        const logoUrl = extractProjectLogoUrl({ name: project.name, logo: (project as any).logo });
                        return logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={project.name || 'Project'} 
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null;
                      })()}
                      <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${extractProjectLogoUrl({ name: project.name, logo: (project as any).logo }) ? 'hidden' : 'flex'}`}>
                        <span className="text-white font-bold text-lg">
                          {(project.name || 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {project.name || "Untitled Project"}
                        </h3>
                        <span className={`text-xs rounded-full px-2 py-1 border font-medium mt-1 inline-block ${
                          project.status === 'active' ? 'border-green-500/30 bg-green-500/20 text-green-400' : 
                          project.status === 'upcoming' ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400' : 
                          project.status === 'completed' ? 'border-blue-500/30 bg-blue-500/20 text-blue-400' : 
                          'border-red-500/30 bg-red-500/20 text-red-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/60 text-sm line-clamp-3 mb-4 leading-relaxed">{project.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-400/70">Token Price</span>
                      <span className="text-white font-semibold">${project.tokenPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-400/70">Raised</span>
                      <span className="text-cyan-400 font-semibold">${(project.currentRaise / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 border border-cyan-400/20 mt-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((project.currentRaise / project.totalRaise) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <button 
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (project.id) {
                        router.push(`/ido/project/${project.id}`);
                      } else {
                        console.error('❌ [IDO-LAUNCHPAD] Project ID is missing:', project);
                      }
                    }}
                  >
                    View Project
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
