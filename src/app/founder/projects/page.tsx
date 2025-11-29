'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  tokenSymbol: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  views: number;
  createdAt: any;
  updatedAt: any;
  website?: string;
  whitepaper?: string;
  stage?: string;
  teamSize?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  founderId: string;
  founderEmail: string;
}

export default function FounderProjectsPage() {
  const { user, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        // Real-time listener for user's projects - handle index error gracefully
        let unsubscribe: (() => void) | undefined;
        
        try {
          const projectsQuery = query(
            collection(dbInstance, 'projects'),
            where('founderId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          const projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: (doc.data().updatedAt?.toDate && typeof doc.data().updatedAt.toDate === 'function') 
              ? doc.data().updatedAt.toDate() 
              : (doc.data().updatedAt ? new Date(doc.data().updatedAt) : new Date()),
          })) as Project[];

            setProjects(projectsData);
            setLoading(false);
          }, (error: any) => {
            // Handle index error gracefully - fallback to query without orderBy
            if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
              console.log('⚠️ [PROJECTS] Index not found, using fallback query without orderBy');
              try {
                const fallbackQuery = query(
                  collection(dbInstance, 'projects'),
                  where('founderId', '==', user.uid)
                );
                
                unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
                  const projectsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: (doc.data().updatedAt?.toDate && typeof doc.data().updatedAt.toDate === 'function') 
              ? doc.data().updatedAt.toDate() 
              : (doc.data().updatedAt ? new Date(doc.data().updatedAt) : new Date()),
                  })) as Project[];
                  
                  // Sort client-side
                  projectsData.sort((a, b) => {
                    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                    return bTime - aTime;
                  });
                  
                  setProjects(projectsData);
                  setLoading(false);
                }, createSnapshotErrorHandler('founder projects fallback'));
              } catch (fallbackError) {
                console.error('❌ [PROJECTS] Fallback query also failed:', fallbackError);
                setLoading(false);
              }
            } else {
              createSnapshotErrorHandler('founder projects')(error);
              setLoading(false);
            }
          });
        } catch (setupError) {
          console.error('❌ [PROJECTS] Error setting up listener:', setupError);
          setLoading(false);
        }

        return () => {
          if (unsubscribe) unsubscribe();
        };
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

  if (!user) {
    return null;
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditing(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        if (!db) {
          alert('Database connection not available');
          return;
        }
        await deleteDoc(doc(db!, 'projects', projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      if (!db) {
        alert('Database connection not available');
        return;
      }
      await updateDoc(doc(db!, 'projects', projectId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-black/40 text-cyan-400/70 border-cyan-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return '✓';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '✗';
      default:
        return '?';
    }
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'approved').length;
  const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'pending_review').length;
  const totalFunding = projects.reduce((sum, p) => sum + (p.currentFunding || 0), 0);
  const totalViews = projects.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        {/* Main Content */}
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 mb-8 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <NeonCyanIcon type="analytics" className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
                  <p className="text-white/80 text-lg">Manage and track your submitted projects</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{totalProjects}</p>
                  <p className="text-cyan-400/70 text-sm">Total Projects</p>
                </div>
                <Link href="/founder/pitch">
                  <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/50 flex items-center">
                    <NeonCyanIcon type="rocket" className="text-white mr-2" size={20} />
                    New Project
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold text-white mt-2">{activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="chart" className="text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold text-white mt-2">{pendingProjects}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="shield" className="text-yellow-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Total Funding</p>
                  <p className="text-3xl font-bold text-white mt-2">${(totalFunding / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="dollar" className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Total Views</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalViews.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="users" className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 border-2 border-cyan-400/20 shadow-2xl shadow-cyan-500/10 text-center">
              <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-400/20">
                <NeonCyanIcon type="analytics" className="text-cyan-400/70" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Projects Yet</h3>
              <p className="text-cyan-400/70 text-lg mb-8">You haven't submitted any projects yet. Start by pitching your first project!</p>
              <Link href="/founder/pitch">
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20 border-2 border-cyan-400/50">
                  <NeonCyanIcon type="rocket" className="text-white mr-2" size={20} />
                  Pitch Your First Project
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 hover:border-cyan-400/50 shadow-lg shadow-cyan-500/10 hover:shadow-xl transition-all duration-300">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {/* Project Logo */}
                      {(() => {
                        const logoUrl = extractProjectLogoUrl(project);
                        return logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={project.name || 'Project'}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400/30"
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
                          <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center shadow-lg border border-cyan-400/30 ${hasLogo ? 'hidden' : 'flex'}`}>
                            <span className="text-white font-bold text-lg">
                              {(project.name || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        );
                      })()}
                      <div>
                        <h3 className="text-lg font-bold text-white">{project.name || (project as any).title || 'Untitled Project'}</h3>
                        <p className="text-cyan-400/70 text-sm">{(project as any).tokenSymbol || (project as any).tokenName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-2 text-cyan-400/70 hover:text-cyan-400 transition-colors"
                        title="Edit project"
                      >
                        <NeonCyanIcon type="analytics" className="text-current" size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 text-cyan-400/70 hover:text-red-400 transition-colors"
                        title="Delete project"
                      >
                        <NeonCyanIcon type="exclamation" className="text-current" size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Project Description */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.description}</p>

                  {/* Project Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                      <span className="mr-1">{getStatusIcon(project.status)}</span>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <span className="text-cyan-400/70 text-xs">{project.category}</span>
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">
                        ${((project as any).fundingGoal || (project as any).pitch?.fundingGoal || 0) > 0 
                          ? (((project as any).fundingGoal || (project as any).pitch?.fundingGoal) / 1000).toFixed(0) + 'K' 
                          : 'N/A'}
                      </p>
                      <p className="text-cyan-400/70 text-xs">Goal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-bold text-lg">
                        ${(project.currentFunding || 0) > 0 ? ((project.currentFunding / 1000).toFixed(0) + 'K') : '0K'}
                      </p>
                      <p className="text-cyan-400/70 text-xs">Raised</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {((project as any).fundingGoal || (project as any).pitch?.fundingGoal) && 
                   ((project as any).fundingGoal || (project as any).pitch?.fundingGoal) > 0 && (
                    <div className="mb-4">
                      <div className="w-full bg-black/40 rounded-full h-2 border border-cyan-400/20">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(
                              ((project.currentFunding || 0) / 
                               ((project as any).fundingGoal || (project as any).pitch?.fundingGoal || 1)) * 100, 
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-cyan-400/70 text-xs mt-1 text-center">
                        {(((project.currentFunding || 0) / 
                           ((project as any).fundingGoal || (project as any).pitch?.fundingGoal || 1)) * 100).toFixed(1)}% funded
                      </p>
                    </div>
                  )}

                  {/* Repitch Request Notice */}
                  {(project as any).repitchRequested && (project as any).repitchReasons && (
                    <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                      <p className="text-yellow-400 text-xs font-semibold mb-2 flex items-center gap-2">
                        <NeonCyanIcon type="exclamation" size={16} className="text-current" />
                        Repitch Requested
                      </p>
                      <ul className="text-yellow-300/80 text-xs space-y-1 list-disc list-inside">
                        {((project as any).repitchReasons || []).slice(0, 3).map((reason: string, idx: number) => (
                          <li key={idx}>{reason}</li>
                        ))}
                        {((project as any).repitchReasons || []).length > 3 && (
                          <li className="text-yellow-400/70">+{((project as any).repitchReasons || []).length - 3} more improvements needed</li>
                        )}
                      </ul>
                      <Link href="/founder/pitch">
                        <button className="mt-2 w-full px-3 py-1.5 bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-200 text-xs font-medium rounded-lg transition-all">
                          Update Pitch
                        </button>
                      </Link>
                    </div>
                  )}

                  {/* Project Documents */}
                  {(project as any).pitch?.documents || (project as any).documents ? (
                    <div className="mb-4 p-3 bg-black/40 rounded-lg border border-cyan-400/20">
                      <p className="text-cyan-400/70 text-xs font-semibold mb-2">Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {(project as any).pitch?.documents?.pitchDeck && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Pitch Deck</span>
                        )}
                        {(project as any).pitch?.documents?.whitepaper && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Whitepaper</span>
                        )}
                        {(project as any).pitch?.documents?.tokenomics && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Tokenomics</span>
                        )}
                        {(project as any).pitch?.documents?.roadmap && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Roadmap</span>
                        )}
                        {(project as any).documents?.pitchDeck && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Pitch Deck</span>
                        )}
                        {(project as any).documents?.whitepaper && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Whitepaper</span>
                        )}
                        {(project as any).documents?.tokenomics && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Tokenomics</span>
                        )}
                        {(project as any).documents?.roadmap && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Roadmap</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Project Logo */}
                  {(() => {
                    const extractLogoUrl = (proj: any): string | null => {
                      if (!proj) return null;
                      if (proj.logo) {
                        if (typeof proj.logo === 'string') return proj.logo;
                        if (proj.logo.url) return String(proj.logo.url);
                        if (proj.logo.downloadURL) return String(proj.logo.downloadURL);
                      }
                      const pitchLogo = proj.pitch?.documents?.projectLogo;
                      if (pitchLogo) {
                        if (typeof pitchLogo === 'string') return pitchLogo;
                        if (pitchLogo.url) return String(pitchLogo.url);
                        if (pitchLogo.downloadURL) return String(pitchLogo.downloadURL);
                      }
                      const docLogo = proj.documents?.projectLogo;
                      if (docLogo) {
                        if (typeof docLogo === 'string') return docLogo;
                        if (docLogo.url) return String(docLogo.url);
                        if (docLogo.downloadURL) return String(docLogo.downloadURL);
                      }
                      return null;
                    };
                    const logoUrl = extractLogoUrl(project);
                    return logoUrl ? (
                      <div className="mb-4 flex justify-center">
                        <img 
                          src={logoUrl} 
                          alt={project.name || 'Project'}
                          className="w-20 h-20 rounded-xl object-cover border-2 border-cyan-400/30"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* Team Members */}
                  {(project as any).pitch?.teamMembers && (project as any).pitch.teamMembers.length > 0 && (
                    <div className="mb-4 p-3 bg-black/40 rounded-lg border border-cyan-400/20">
                      <p className="text-cyan-400/70 text-xs font-semibold mb-2">Team ({((project as any).pitch.teamMembers || []).length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {((project as any).pitch.teamMembers || []).slice(0, 3).map((member: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                            {member.name || 'Team Member'}
                          </span>
                        ))}
                        {((project as any).pitch.teamMembers || []).length > 3 && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                            +{((project as any).pitch.teamMembers || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Project Meta */}
                  <div className="flex items-center justify-between text-xs text-cyan-400/70">
                    <div className="flex items-center">
                      <NeonCyanIcon type="users" className="text-current" size={16} />
                      {(project.views || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <NeonCyanIcon type="shield" className="text-current" size={16} />
                      {project.createdAt ? project.createdAt.toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    {project.website && (
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors text-center"
                      >
                        <NeonCyanIcon type="globe" className="text-current" size={16} />
                        Website
                      </a>
                    )}
                    {project.socialLinks?.twitter && (
                      <a
                        href={project.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors text-center"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
