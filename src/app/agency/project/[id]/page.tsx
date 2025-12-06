"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { normalizeProjectData } from '@/lib/project-data-normalizer';
import { extractProjectLogoUrl } from '@/lib/project-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering to prevent 404s
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';

export default function AgencyProjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // FIXED: Don't return early if projectId is missing - show loading instead
    if (!projectId) {
      setError('Project ID is missing');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    
    loadProject().then((cleanup) => {
      unsubscribe = cleanup || null;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, projectId, router]);

  const loadProject = async () => {
    if (!projectId || !user) return;

    try {
      setLoading(true);
      
      const isReady = await waitForFirebase(10000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available.');
        setLoading(false);
        return;
      }

      const projectRef = doc(dbInstance, 'projects', projectId);
      
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        setError('Project not found.');
        setLoading(false);
        return;
      }

      const rawData = projectDoc.data();
      console.log('📋 [AGENCY-PROJECT] Raw project data:', rawData);
      const normalized = normalizeProjectData(rawData, projectId);
      console.log('📋 [AGENCY-PROJECT] Normalized project data:', {
        id: normalized.id,
        name: normalized.name || normalized.title,
        documentsCount: Object.keys(normalized.documents || {}).length,
        teamCount: (normalized.team || []).length,
        hasRaftAI: !!normalized.raftai
      });
      setProject(normalized);
      setLoading(false);

      const unsubscribe = onSnapshot(projectRef, (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data();
          const normalized = normalizeProjectData(rawData, snapshot.id);
          setProject(normalized);
        }
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('Error loading project:', error);
      setError(error.message || 'Failed to load project.');
      setLoading(false);
      return null;
    }
  };

  const handleAccept = async () => {
    if (!projectId || !user) return;
    
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/agency/accept-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectId })
      });
      
      console.log('📋 [AGENCY-PROJECT] Accept pitch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        alert('Pitch accepted! Chat room created.');
        router.push(`/agency/messages?room=${data.chatId || data.roomId || `deal_${project.founderId}_${user.uid}_${projectId}`}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details 
          ? `${errorData.error || 'Error'}: ${errorData.details}`
          : errorData.error || errorData.message || 'Failed to accept pitch. Please try again.';
        console.error('❌ [AGENCY] Accept pitch error:', errorData);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ [AGENCY] Error accepting pitch:', error);
      const errorMessage = error?.message || 'Failed to accept pitch. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!projectId || !user) return;
    
    if (!confirm('Are you sure you want to reject this project?')) return;
    
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/agency/reject-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectId })
      });
      
      if (response.ok) {
        alert('Project rejected.');
        router.push('/agency/dealflow');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || errorData.message || 'Failed to reject pitch. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting pitch:', error);
      alert('Failed to reject pitch. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error || !project) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
            <p className="text-white/60 mb-6">{error || 'The project you are looking for does not exist.'}</p>
            <Link href="/agency/dealflow" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              Back to Dealflow
            </Link>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const documents = project.documents || {};
  const team = project.team || [];
  const raftai = project.raftai;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/agency/dealflow" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dealflow
            </Link>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-4">{project.name || project.title}</h1>
                  <p className="text-white/90 text-lg mb-4">{project.description}</p>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                      project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {project.status || 'pending'}
                    </span>
                    {project.seekingServices && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                        Seeking Services
                      </span>
                    )}
                    {raftai?.rating && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        raftai.rating === 'High' ? 'bg-green-500/20 text-green-400' :
                        raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        RaftAI: {raftai.rating}
                      </span>
                    )}
                  </div>
                </div>
                {(() => {
                  const logoUrl = extractProjectLogoUrl(project);
                  return logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={project.name || project.title || 'Project'} 
                      className="w-24 h-24 rounded-xl object-cover ml-6 border-2 border-cyan-400/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center ml-6 border border-cyan-400/30">
                      <span className="text-white font-bold text-2xl">
                        {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-black/40 backdrop-blur-lg rounded-xl mb-6 border border-white/10">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: 'dashboard' },
                { id: 'documents', label: 'Documents', icon: 'document' },
                { id: 'team', label: 'Team', icon: 'users' },
                { id: 'raftai', label: 'RaftAI Analysis', icon: 'cpu' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <NeonCyanIcon type={tab.icon as any} size={20} className="text-current" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <div className="neo-glass-card rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white/60 text-sm font-medium">Project Name</label>
                        <p className="text-white mt-1 font-semibold text-lg">{project.name || project.title || 'Unknown Project'}</p>
                      </div>
                      {project.description && (
                        <div>
                          <label className="text-white/60 text-sm font-medium">Description</label>
                          <p className="text-white mt-1 whitespace-pre-wrap">{project.description}</p>
                        </div>
                      )}
                      {!project.description && (
                        <div>
                          <label className="text-white/60 text-sm font-medium">Description</label>
                          <p className="text-white/50 mt-1 italic">No description provided</p>
                        </div>
                      )}
                      {project.website && (
                        <div>
                          <label className="text-white/60 text-sm font-medium">Website</label>
                          <p className="text-white mt-1">
                            <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                              {project.website}
                            </a>
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {project.category && (
                          <div>
                            <label className="text-white/60 text-sm font-medium">Category</label>
                            <p className="text-white mt-1">{project.category}</p>
                          </div>
                        )}
                        {project.stage && (
                          <div>
                            <label className="text-white/60 text-sm font-medium">Stage</label>
                            <p className="text-white mt-1">{project.stage}</p>
                          </div>
                        )}
                      </div>
                      {project.tokenSymbol && (
                        <div>
                          <label className="text-white/60 text-sm font-medium">Token Symbol</label>
                          <p className="text-white mt-1">{project.tokenSymbol}</p>
                        </div>
                      )}
                      {project.blockchain && (
                        <div>
                          <label className="text-white/60 text-sm font-medium">Blockchain</label>
                          <p className="text-white mt-1">{project.blockchain}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="neo-glass-card rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Funding Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/60 text-sm">Funding Goal</label>
                        <p className="text-2xl font-bold text-white">${((project.fundingGoal || 0) / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">Current Funding</label>
                        <p className="text-2xl font-bold text-cyan-400">${((project.currentFunding || 0) / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Project Documents</h2>
                  {Object.keys(documents).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(documents).map(([key, url]: [string, any]) => {
                        const docNames: Record<string, string> = {
                          whitepaper: 'Whitepaper',
                          pitchdeck: 'Pitch Deck',
                          pitchDeck: 'Pitch Deck',
                          financials: 'Financial Projections',
                          auditreport: 'Smart Contract Audit',
                          auditReport: 'Smart Contract Audit',
                          tokenomics: 'Token Economics',
                          roadmap: 'Roadmap'
                        };
                        
                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all group"
                          >
                            <NeonCyanIcon type="document" size={24} className="text-cyan-400 group-hover:text-cyan-300" />
                            <span className="text-white font-medium group-hover:text-cyan-300 flex-1">
                              {docNames[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                            <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <NeonCyanIcon type="document" size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No documents available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Team Members</h2>
                  {team.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team.map((member: any, index: number) => {
                        const memberName = member.name || member.fullName || member.memberName || 'Team Member';
                        const memberRole = member.role || member.position || member.title || 'Role not specified';
                        const memberBio = member.bio || member.description || member.about || '';
                        const memberLinkedIn = member.linkedin || member.linkedIn || member.linkedInUrl || '';
                        const memberImage = member.image || member.photo || member.photoURL || member.avatar || null;
                        
                        return (
                          <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all">
                            <div className="flex items-start gap-3">
                              {memberImage ? (
                                <img 
                                  src={memberImage} 
                                  alt={memberName}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                                  <span className="text-white font-bold text-sm">
                                    {memberName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white font-bold text-lg">{memberName}</p>
                                <p className="text-white/60 text-sm mb-1">{memberRole}</p>
                                {memberBio && (
                                  <p className="text-white/50 text-xs mb-2 line-clamp-2">{memberBio}</p>
                                )}
                                {memberLinkedIn && (
                                  <a 
                                    href={memberLinkedIn.startsWith('http') ? memberLinkedIn : `https://linkedin.com/in/${memberLinkedIn}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-cyan-400 text-sm hover:text-cyan-300 inline-flex items-center gap-1"
                                  >
                                    <NeonCyanIcon type="users" size={14} className="text-current" />
                                    LinkedIn →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <NeonCyanIcon type="users" size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No team information available</p>
                    </div>
                  )}
                </div>
              )}

              {/* RaftAI Tab */}
              {activeTab === 'raftai' && (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
                  <h2 className="text-2xl font-bold text-white mb-6">RaftAI Analysis</h2>
                  {raftai && raftai !== null && typeof raftai === 'object' && Object.keys(raftai).length > 0 ? (
                    <div className="space-y-6">
                      {(raftai.score || raftai.rating) && (
                        <div className="grid grid-cols-2 gap-4">
                          {raftai.score && (
                            <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10">
                              <span className="text-white/60 text-sm">Score</span>
                              <p className="text-white font-bold text-2xl">{raftai.score}/100</p>
                            </div>
                          )}
                          <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10">
                            <span className="text-white/60 text-sm">Rating</span>
                            <p className={`font-bold text-lg ${
                              raftai.rating === 'High' ? 'text-green-400' :
                              raftai.rating === 'Normal' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {raftai.rating || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {raftai.summary && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-2">Summary</h3>
                          <p className="text-white/70 leading-relaxed">{raftai.summary}</p>
                        </div>
                      )}

                      {raftai.insights && Array.isArray(raftai.insights) && raftai.insights.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-3">Key Insights</h3>
                          <div className="space-y-2">
                            {raftai.insights.map((insight: any, idx: number) => (
                              <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-white/80 text-sm">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {raftai.risks && Array.isArray(raftai.risks) && raftai.risks.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-3">Risks</h3>
                          <div className="space-y-2">
                            {raftai.risks.map((risk: any, idx: number) => (
                              <div key={idx} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-red-300 text-sm">{risk}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {raftai.recommendations && Array.isArray(raftai.recommendations) && raftai.recommendations.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-3">Recommendations</h3>
                          <div className="space-y-2">
                            {raftai.recommendations.map((rec: any, idx: number) => (
                              <div key={idx} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <p className="text-blue-300 text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-xs text-center">
                          ⚠️ Preliminary assessment. Conduct full due diligence.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <NeonCyanIcon type="cpu" size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No RaftAI Analysis Available</p>
                      <p className="text-white/40 text-sm mt-2">Analysis will appear here once available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* RaftAI Summary */}
              {raftai && (
                <div className="neo-glass-card rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <NeonCyanIcon type="cpu" size={24} className="text-purple-400" />
                    <h3 className="text-xl font-bold text-white">RaftAI Analysis</h3>
                  </div>
                  {raftai.score && (
                    <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                      <span className="text-white/60 text-xs">Score</span>
                      <p className="text-white font-bold text-2xl">{raftai.score}/100</p>
                    </div>
                  )}
                  {raftai.rating && (
                    <div className="text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        raftai.rating === 'High' ? 'bg-green-500/20 text-green-400' :
                        raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {raftai.rating} Potential
                      </span>
                    </div>
                  )}
                  {raftai.summary && (
                    <p className="text-white/70 text-sm mt-3 line-clamp-3">{raftai.summary}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
                <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                {project.agencyAction !== 'accepted' && (
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium mb-3"
                    >
                      {actionLoading ? 'Processing...' : 'Accept Project'}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium mb-3"
                    >
                      {actionLoading ? 'Processing...' : 'Reject Project'}
                    </button>
                  </>
                )}
                {project.agencyAction === 'accepted' && user && (
                  <button
                    onClick={() => router.push(`/agency/messages?room=deal_${project.founderId}_${user.uid}_${projectId}`)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                  >
                    Open Chat Room
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
