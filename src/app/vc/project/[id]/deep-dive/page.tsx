"use client";

import { useAuth } from "@/providers/AuthProvider";
import { db, doc, getDoc, setDoc, addDoc, collection } from "@/lib/firebase.client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProjectDeepDivePage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshingAI, setRefreshingAI] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || claims?.role !== 'vc') {
      router.push('/login');
      return;
    }

    if (projectId) {
      loadProject();
    }
  }, [user, claims, authLoading, projectId, router]);

  const loadProject = async () => {
    if (!projectId || !db) return;

    try {
      setLoading(true);
      const projectDoc = await getDoc(doc(db!, 'projects', projectId));
      
      if (!projectDoc.exists()) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      const rawData = projectDoc.data();
      const projectData: any = { id: projectDoc.id, ...rawData };
      
      // Normalize RaftAI data - check multiple possible field names
      if (!projectData.raftai || !projectData.raftai.score) {
        if (rawData?.raftAI) {
          projectData.raftai = rawData.raftAI;
        } else if (rawData?.aiAnalysis) {
          projectData.raftai = rawData.aiAnalysis;
        } else if (rawData?.pitch?.raftai) {
          projectData.raftai = rawData.pitch.raftai;
        } else if (rawData?.pitch?.raftAI) {
          projectData.raftai = rawData.pitch.raftAI;
        }
      }
      
      setProject(projectData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Failed to load project');
      setLoading(false);
    }
  };

  const refreshRaftAI = async () => {
    if (!project || !user || !db) return;

    try {
      setRefreshingAI(true);
      
      // In production, this would call RaftAI API
      // For now, we'll just show it's refreshing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('RaftAI analysis refreshed! (In production, this would call the AI service)');
      await loadProject();
      
    } catch (error) {
      console.error('Error refreshing RaftAI:', error);
      alert('Failed to refresh AI analysis');
    } finally {
      setRefreshingAI(false);
    }
  };

  const handleAccept = async () => {
    if (!project || !user || !db) return;

    setActionLoading(true);
    try {
      // Accept logic (same as before)
      await setDoc(doc(db!, 'projects', projectId), {
        status: 'accepted',
        vcAction: 'accepted',
        acceptedBy: user.uid,
        acceptedAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      router.push('/vc/pipeline');
    } catch (error) {
      console.error('Error accepting project:', error);
      alert('Failed to accept project');
    } finally {
      setActionLoading(false);
    }
  };

  const requestMeeting = async () => {
    if (!project || !user || !db) return;

    try {
      await addDoc(collection(db!, 'notifications'), {
        userId: project.founderId,
        type: 'meeting_request',
        title: 'Meeting Request',
        message: `A VC partner has requested a meeting about "${project.title || project.name}"`,
        projectId: project.id,
        requestedBy: user.uid,
        read: false,
        createdAt: Date.now()
      });
      alert('Meeting request sent!');
    } catch (error) {
      console.error('Error requesting meeting:', error);
    }
  };

  const addToPipeline = async (stage: string = 'screening') => {
    if (!project || !user || !db) return;

    try {
      await setDoc(doc(db!, 'pipeline', `${user.uid}_${projectId}`), {
        userId: user.uid,
        projectId: project.id,
        projectName: project.title || project.name,
        stage,
        addedAt: Date.now(),
        ...project
      });
      alert('Added to pipeline!');
    } catch (error) {
      console.error('Error adding to pipeline:', error);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <NeonCyanIcon type="exclamation" size={64} className="text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/vc/dealflow')}
            className="btn btn-primary"
          >
            Back to Dealflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/vc/dealflow')}
            className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <NeonCyanIcon type="arrow-left" size={20} className="mr-2" />
            Back to Dealflow
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {project.title || project.name || 'Untitled Project'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-300">
                <span className="flex items-center gap-1">
                  <NeonCyanIcon type="tag" size={16} className="text-current" />
                  {project.sector || 'Sector not specified'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <NeonCyanIcon type="code" size={16} className="text-current" />
                  {project.chain || 'Chain not specified'}
                </span>
                {project.geography && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <NeonCyanIcon type="globe" size={16} className="text-current" />
                      {project.geography}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {project.raftai?.rating && (
              <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                project.raftai.rating === 'High' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                project.raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {project.raftai.rating} Rating
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', iconType: 'document' as const },
              { id: 'docs', label: 'Documents', iconType: 'document' as const },
              { id: 'tokenomics', label: 'Tokenomics', iconType: 'dollar' as const },
              { id: 'team', label: 'Team', iconType: 'users' as const },
              { id: 'roadmap', label: 'Roadmap', iconType: 'calendar' as const },
              { id: 'traction', label: 'Traction', iconType: 'chart' as const },
              { id: 'risks', label: 'Risks', iconType: 'exclamation' as const },
              { id: 'compliance', label: 'Compliance', iconType: 'shield' as const }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-cyan-400/70 hover:text-white'
                }`}
              >
                <NeonCyanIcon type={tab.iconType} size={20} className="text-current" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Description */}
                <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">Project Description</h2>
                  <p className="text-white/80 leading-relaxed text-lg whitespace-pre-wrap">
                    {project.description || project.tagline || 'No description available'}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-6">Key Metrics</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-cyan-400/70 text-sm mb-1">Stage</p>
                      <p className="text-white font-semibold text-xl">{project.stage || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-cyan-400/70 text-sm mb-1">Funding Goal</p>
                      <p className="text-white font-semibold text-xl">
                        ${project.fundingGoal ? project.fundingGoal.toLocaleString() : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-cyan-400/70 text-sm mb-1">Team Size</p>
                      <p className="text-white font-semibold text-xl">{project.teamSize || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-cyan-400/70 text-sm mb-1">Founded</p>
                      <p className="text-white font-semibold text-xl">
                        {project.foundedDate || project.incorporationDate || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'team' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Team Members</h2>
                {project.team && project.team.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.team.map((member: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white font-bold text-lg">{member.name || 'Team Member'}</p>
                        <p className="text-cyan-400/70 text-sm">{member.role || 'Role not specified'}</p>
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm mt-2 inline-flex items-center gap-1"
                          >
                            <NeonCyanIcon type="link" size={16} className="text-current" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-cyan-400/70">No team information available</p>
                )}
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Documents Checklist</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Whitepaper', key: 'whitepaper', required: true },
                    { name: 'Pitch Deck', key: 'pitchDeck', required: true },
                    { name: 'Financial Projections', key: 'financials', required: true },
                    { name: 'Smart Contract Audit', key: 'auditReport', required: false },
                    { name: 'Token Economics', key: 'tokenomics', required: true },
                    { name: 'Legal Opinion', key: 'legalOpinion', required: false }
                  ].map(doc => (
                    <div key={doc.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        {project.documents?.[doc.key] ? (
                          <NeonCyanIcon type="check" size={20} className="text-green-400" />
                        ) : (
                          <NeonCyanIcon type="x-circle" size={20} className="text-cyan-400/50" />
                        )}
                        <span className="text-white font-medium">{doc.name}</span>
                        {doc.required && <span className="text-xs text-red-400">(Required)</span>}
                      </div>
                      {project.documents?.[doc.key] && (
                        <a
                          href={project.documents[doc.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-sm hover:text-blue-300"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Risk Analysis</h2>
                {project.raftai?.risks && project.raftai.risks.length > 0 ? (
                  <div className="space-y-3">
                    {project.raftai.risks.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <NeonCyanIcon type="exclamation" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/80">{risk}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-cyan-400/70">No risks identified yet</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RaftAI Analysis */}
            <div className="neo-glass-card rounded-xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 max-h-[600px] overflow-y-auto overflow-x-hidden raftai-scroll">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <NeonCyanIcon type="cpu" size={24} className="text-purple-400" />
                  <h2 className="text-xl font-bold text-white">RaftAI Analysis</h2>
                </div>
                <button
                  onClick={refreshRaftAI}
                  disabled={refreshingAI}
                  className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                  {refreshingAI ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {project.raftai?.score && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-cyan-400/70 text-xs">Score</span>
                    <p className="text-white font-bold text-2xl">{project.raftai.score}/100</p>
                  </div>
                  <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-cyan-400/70 text-xs">Risk Level</span>
                    <p className="text-white font-bold text-lg">
                      {project.raftai.score >= 80 ? 'Low' : project.raftai.score >= 60 ? 'Medium' : 'High'}
                    </p>
                  </div>
                </div>
              )}

              {project.raftai?.summary && (
                <p className="text-white/80 text-sm leading-relaxed mb-4">{project.raftai.summary}</p>
              )}

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-xs text-center">
                  ⚠️ AI analysis is preliminary. Always conduct manual due diligence.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <NeonCyanIcon type="check" size={24} className="text-current" />
                {actionLoading ? 'Processing...' : 'Accept Project'}
              </button>
              <button
                onClick={() => router.push(`/messages?projectId=${projectId}`)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
              >
                <NeonCyanIcon type="chat" size={20} className="text-current" />
                Send Message
              </button>
              <button
                onClick={() => addToPipeline()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 border border-purple-400/30"
              >
                <NeonCyanIcon type="rocket" size={20} className="text-current" />
                Add to Pipeline
              </button>
              <button
                onClick={requestMeeting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 border border-orange-400/30"
              >
                <NeonCyanIcon type="video" size={20} className="text-current" />
                Request Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

