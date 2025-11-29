"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function AdminProjectDetailPage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (authLoading) return;

    // Check admin access
    const userEmail = user?.email?.toLowerCase() || '';
    if (!user || (claims?.role !== 'admin' && userEmail !== 'anasshamsiggc@gmail.com')) {
      router.push('/admin/login');
      return;
    }

    if (!projectId) return;

    let unsubscribe: (() => void) | null = null;
    
    loadProject().then((cleanup) => {
      unsubscribe = cleanup || null;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, claims, authLoading, projectId, router]);

  const loadProject = async () => {
    if (!projectId || !user) return;

    try {
      setLoading(true);
      
      const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
      let isReady = await waitForFirebase(10000);
      if (!isReady) {
        console.warn('⚠️ Firebase not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        isReady = await waitForFirebase(10000);
      }
      
      if (!isReady) {
        setError('Firebase not initialized. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available');
        setLoading(false);
        return;
      }

      // Set up real-time listener
      const projectRef = doc(dbInstance, 'projects', projectId);
      const unsubscribe = onSnapshot(projectRef, async (docSnapshot) => {
        if (!docSnapshot.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const projectData = docSnapshot.data();
        
        // Normalize project data (same as VC role)
        const normalizedProject = {
          id: docSnapshot.id,
          ...projectData,
          founderLogo: await normalizeFounderLogo(projectData, projectData.founderId),
          raftai: normalizeRaftAIData(projectData),
          documents: normalizeDocuments(projectData),
          team: normalizeTeamData(projectData),
          socials: normalizeSocials(projectData)
        };
        
        setProject(normalizedProject);
        setLoading(false);
      }, (error) => {
        console.error('Error loading project:', error);
        setError('Failed to load project');
        setLoading(false);
      });

      return unsubscribe;
    } catch (err: any) {
      console.error('Error setting up project listener:', err);
      setError(err.message || 'Failed to load project');
      setLoading(false);
      return null;
    }
  };

  // Normalization functions (same as VC role)
  const normalizeFounderLogo = async (projectData: any, userId: string): Promise<string | null> => {
    try {
      // First, try to get from project data directly
      if (projectData.founderAvatar && typeof projectData.founderAvatar === 'string' && projectData.founderAvatar.startsWith('https://')) {
        return projectData.founderAvatar;
      }
      
      if (projectData.logo && typeof projectData.logo === 'string' && projectData.logo.startsWith('https://')) {
        return projectData.logo;
      }
      
      // Try to get from user profile
      if (userId) {
        const { ensureDb } = await import('@/lib/firebase-utils');
        const { doc, getDoc } = await import('firebase/firestore');
        const dbInstance = ensureDb();
        if (dbInstance) {
          const userDoc = await getDoc(doc(dbInstance, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.photoURL && typeof userData.photoURL === 'string' && userData.photoURL.startsWith('https://')) {
              return userData.photoURL;
            }
          }
        }
      }
      
      // Fallback: try storage path only if we have a valid path
      const logoPath = projectData.founderLogo || projectData.founder_logo;
      if (logoPath && typeof logoPath === 'string' && !logoPath.startsWith('https://')) {
        const { ensureStorage } = await import('@/lib/firebase-utils');
        const { ref, getDownloadURL } = await import('firebase/storage');
        const storageInstance = ensureStorage();
        if (storageInstance) {
          const storageRef = ref(storageInstance, logoPath);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        }
      }
    } catch (error: any) {
      // Silently fail - avatar is optional
      if (error?.code !== 'storage/object-not-found' && !error?.message?.includes('404')) {
        console.log('⚠️ Error normalizing founder logo:', error);
      }
    }
    return null;
  };

  const normalizeRaftAIData = (projectData: any): any => {
    const raftai = projectData.raftai || 
                   projectData.raftAI || 
                   projectData.raft_ai ||
                   projectData.analysis ||
                   projectData.aiAnalysis;
    
    if (!raftai) return null;
    
    if (typeof raftai === 'string') {
      try {
        return JSON.parse(raftai);
      } catch {
        return { summary: raftai };
      }
    }
    
    return raftai;
  };

  const normalizeDocuments = (projectData: any): any[] => {
    const docs: any[] = [];
    const documents = projectData.documents || projectData.docs || projectData.files || {};
    
    if (typeof documents === 'object' && !Array.isArray(documents)) {
      Object.entries(documents).forEach(([key, value]: [string, any]) => {
        if (value) {
          const url = typeof value === 'string' ? value : (value.downloadURL || value.url || value.path);
          if (url && typeof url === 'string' && url.trim().length > 0) {
            docs.push({ name: key, url: url.trim() });
          }
        }
      });
    } else if (Array.isArray(documents)) {
      documents.forEach((doc: any) => {
        const url = typeof doc === 'string' ? doc : (doc.downloadURL || doc.url || doc.path);
        if (url && typeof url === 'string' && url.trim().length > 0) {
          docs.push({ name: doc.name || 'Document', url: url.trim() });
        }
      });
    }
    
    return docs;
  };

  const normalizeTeamData = (projectData: any): any[] => {
    const team: any[] = [];
    const teamData = projectData.team || projectData.teamMembers || projectData.members || projectData.founders || [];
    
    if (Array.isArray(teamData)) {
      teamData.forEach((member: any) => {
        if (member && typeof member === 'object') {
          team.push({
            name: member.name || member.fullName || 'Unknown',
            role: member.role || member.position || 'Team Member',
            bio: member.bio || member.description || '',
            linkedin: member.linkedin || member.linkedIn || '',
            twitter: member.twitter || '',
            avatar: member.avatar || member.image || ''
          });
        }
      });
    } else if (teamData && typeof teamData === 'object') {
      Object.entries(teamData).forEach(([key, member]: [string, any]) => {
        if (member && typeof member === 'object') {
          team.push({
            name: member.name || member.fullName || key,
            role: member.role || member.position || 'Team Member',
            bio: member.bio || member.description || '',
            linkedin: member.linkedin || member.linkedIn || '',
            twitter: member.twitter || '',
            avatar: member.avatar || member.image || ''
          });
        }
      });
    }
    
    return team;
  };

  const normalizeSocials = (projectData: any): any => {
    return {
      website: projectData.website || projectData.url || '',
      twitter: projectData.twitter || projectData.socialMedia?.twitter || '',
      linkedin: projectData.linkedin || projectData.socialMedia?.linkedin || '',
      telegram: projectData.telegram || projectData.socialMedia?.telegram || '',
      discord: projectData.discord || projectData.socialMedia?.discord || '',
      github: projectData.github || projectData.socialMedia?.github || ''
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading project details..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <NeonCyanIcon type="exclamation" size={64} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/60 mb-6">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/admin/projects')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all font-semibold"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/projects')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <NeonCyanIcon type="arrow-left" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{project.name || project.projectName || 'Untitled Project'}</h1>
              <p className="text-cyan-400/70">{project.description || project.valueProposition || 'No description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {project.status && (
              <span className={`px-4 py-2 rounded-lg font-semibold ${
                project.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                'bg-gray-500/20 text-gray-400 border border-gray-400/30'
              }`}>
                {project.status}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-cyan-400/20">
          {['overview', 'raftai', 'team', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Project Info */}
                <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
                  <h3 className="text-2xl font-bold text-white mb-4">Project Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Description</p>
                      <p className="text-white">{project.description || project.valueProposition || 'No description'}</p>
                    </div>
                    {project.category && (
                      <div>
                        <p className="text-white/60 text-sm mb-1">Category</p>
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm border border-cyan-400/30">
                          {project.category}
                        </span>
                      </div>
                    )}
                    {project.fundingGoal && (
                      <div>
                        <p className="text-white/60 text-sm mb-1">Funding Goal</p>
                        <p className="text-white font-semibold text-xl">${(project.fundingGoal / 1000).toFixed(0)}K</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {project.socials && (project.socials.website || project.socials.twitter || project.socials.linkedin) && (
                  <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <NeonCyanIcon type="globe" size={24} className="text-cyan-400" />
                      Social Links
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {project.socials.website && (
                        <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-400/30 hover:bg-cyan-500/30 transition-all">
                          Website
                        </a>
                      )}
                      {project.socials.twitter && (
                        <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-all">
                          Twitter
                        </a>
                      )}
                      {project.socials.linkedin && (
                        <a href={project.socials.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition-all">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'raftai' && (
              <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <NeonCyanIcon type="cpu" size={24} className="text-purple-400" />
                  RaftAI Analysis
                </h3>
                {project.raftai ? (
                  <div className="space-y-4">
                    {project.raftai.score && (
                      <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Score</p>
                        <p className="text-white font-bold text-4xl">{project.raftai.score}/100</p>
                      </div>
                    )}
                    {project.raftai.summary && (
                      <p className="text-white/80">{project.raftai.summary}</p>
                    )}
                    {project.raftai.insights && Array.isArray(project.raftai.insights) && project.raftai.insights.length > 0 && (
                      <div>
                        <p className="text-white/60 text-sm font-medium mb-2">Key Insights:</p>
                        <ul className="space-y-2">
                          {project.raftai.insights.map((insight: string, idx: number) => (
                            <li key={idx} className="text-cyan-400 flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No RaftAI analysis available</p>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <NeonCyanIcon type="users" size={24} className="text-blue-400" />
                  Team
                </h3>
                {project.team && Array.isArray(project.team) && project.team.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.team.map((member: any, idx: number) => (
                      <div key={idx} className="bg-black/60 rounded-lg p-4 border border-cyan-400/10">
                        <div className="flex items-center gap-3 mb-2">
                          {member.avatar && (
                            <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="text-white font-semibold">{member.name}</p>
                            <p className="text-cyan-400/70 text-sm">{member.role}</p>
                          </div>
                        </div>
                        {member.bio && <p className="text-white/60 text-sm mt-2">{member.bio}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No team information available</p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <NeonCyanIcon type="document" size={24} className="text-green-400" />
                  Documents
                </h3>
                {project.documents && Array.isArray(project.documents) && project.documents.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {project.documents.map((doc: any, idx: number) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/60 rounded-lg p-4 border border-cyan-400/10 hover:border-cyan-400/30 transition-all flex items-center gap-2"
                      >
                        <NeonCyanIcon type="document" size={20} className="text-cyan-400" />
                        <span className="text-white text-sm truncate">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No documents available</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder Info */}
            <div className="neo-glass-card rounded-xl p-6 border border-cyan-400/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <NeonCyanIcon type="user" size={20} className="text-cyan-400" />
                Founder
              </h3>
              <div className="space-y-3">
                {project.founderLogo && typeof project.founderLogo === 'string' && project.founderLogo.startsWith('https://') ? (
                  <img 
                    src={project.founderLogo} 
                    alt={project.founderName || 'Founder'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/30 mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border-2 border-cyan-400/30 mx-auto">
                    <span className="text-white font-bold text-2xl">
                      {(project.founderName || 'F').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white/60 text-sm">Name</p>
                  <p className="text-white font-semibold">{project.founderName || 'Not specified'}</p>
                </div>
                {project.founderEmail && (
                  <div>
                    <p className="text-white/60 text-sm">Email</p>
                    <p className="text-white font-semibold text-sm">{project.founderEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

