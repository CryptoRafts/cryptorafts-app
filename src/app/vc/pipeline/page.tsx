"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db, getDb } from '@/lib/firebase.client';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Investment stages with milestones
const PIPELINE_STAGES = [
  { 
    id: 'screening',
    label: 'Initial Screening',
    color: 'blue',
    description: 'Review project basics'
  },
  { 
    id: 'due_diligence',
    label: 'Due Diligence',
    color: 'purple',
    description: 'Deep dive analysis'
  },
  { 
    id: 'ic_review',
    label: 'IC Review',
    color: 'yellow',
    description: 'Investment Committee'
  },
  { 
    id: 'term_sheet',
    label: 'Term Sheet',
    color: 'orange',
    description: 'Negotiate terms'
  },
  { 
    id: 'closing',
    label: 'Closing',
    color: 'green',
    description: 'Finalize investment'
  },
  { 
    id: 'portfolio',
    label: 'Portfolio',
    color: 'emerald',
    description: 'Active investment'
  }
];

// Milestones for each project
const MILESTONE_CHECKLIST = [
  { id: 'kyb_check', label: 'KYB Verification', icon: () => <NeonCyanIcon type="shield" size={20} className="text-current" />, stage: 'screening' },
  { id: 'dd_started', label: 'Due Diligence Started', icon: () => <NeonCyanIcon type="search" size={20} className="text-current" />, stage: 'due_diligence' },
  { id: 'company_check', label: 'Company Background Check', icon: () => <NeonCyanIcon type="building" size={20} className="text-current" />, stage: 'due_diligence' },
  { id: 'docs_verified', label: 'All Documents Verified', icon: () => <NeonCyanIcon type="document" size={20} className="text-current" />, stage: 'due_diligence' },
  { id: 'token_audit', label: 'Smart Contract Audit', icon: () => <NeonCyanIcon type="code" size={20} className="text-current" />, stage: 'due_diligence' },
  { id: 'ic_approval', label: 'IC Approval Received', icon: () => <NeonCyanIcon type="check" size={20} className="text-current" />, stage: 'ic_review' },
  { id: 'term_sheet_sent', label: 'Term Sheet Sent', icon: () => <NeonCyanIcon type="document" size={20} className="text-current" />, stage: 'term_sheet' },
  { id: 'term_sheet_signed', label: 'Term Sheet Signed', icon: () => <NeonCyanIcon type="check" size={20} className="text-current" />, stage: 'term_sheet' },
  { id: 'payment_sent', label: 'Payment Sent', icon: () => <NeonCyanIcon type="dollar" size={20} className="text-current" />, stage: 'closing' },
  { id: 'tokens_received', label: 'Tokens Received', icon: () => <NeonCyanIcon type="dollar" size={20} className="text-current" />, stage: 'closing' },
  { id: 'portfolio_added', label: 'Added to Portfolio', icon: () => <NeonCyanIcon type="portfolio" size={20} className="text-current" />, stage: 'portfolio' }
];

interface PipelineProject {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  stage: string;
  milestones: Record<string, boolean>;
  notes: string;
  addedAt: number;
  updatedAt: number;
  sector?: string;
  fundingGoal?: number;
  founderName?: string;
  raftai?: any;
  paymentAmount?: number;
  paymentChain?: string;
  paymentContractAddress?: string;
  paymentStatus?: string;
  paymentProof?: string;
}

export default function VCPipelinePage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PipelineProject | null>(null);
  const [showMilestones, setShowMilestones] = useState(false);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || claims?.role !== 'vc') {
      router.push('/login');
      return;
    }

    const cleanup = loadPipeline();
    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [user, claims, authLoading, router]);

  const loadPipeline = async () => {
    if (!user) return;

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

      const pipelineQuery = query(
        collection(dbInstance, 'pipeline'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(pipelineQuery, (snapshot) => {
        const pipelineData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PipelineProject[];
        setProjects(pipelineData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading pipeline:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up pipeline listener:', error);
      setLoading(false);
      return () => {};
    }
  };

  const updateProjectStage = async (projectId: string, newStage: string) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      await updateDoc(doc(dbInstance, 'pipeline', projectId), {
        stage: newStage,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const toggleMilestone = async (projectId: string, milestoneId: string, currentValue: boolean) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedMilestones = {
        ...project.milestones,
        [milestoneId]: !currentValue
      };

      await updateDoc(doc(dbInstance, 'pipeline', projectId), {
        milestones: updatedMilestones,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  const addNote = async (projectId: string, note: string) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      await updateDoc(doc(dbInstance, 'pipeline', projectId), {
        notes: note,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const removeFromPipeline = async (projectId: string) => {
    if (!user || !confirm('Remove this project from pipeline?')) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      await updateDoc(doc(dbInstance, 'pipeline', projectId), {
        deleted: true,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error removing project:', error);
    }
  };

  const handleDragStart = (projectId: string) => {
    setDraggedProject(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (draggedProject) {
      await updateProjectStage(draggedProject, newStage);
      setDraggedProject(null);
    }
  };

  const getStageColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400',
      emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
    };
    return colors[color] || colors.blue;
  };

  const getMilestoneProgress = (project: PipelineProject) => {
    const stageMilestones = MILESTONE_CHECKLIST.filter(m => m.stage === project.stage);
    if (stageMilestones.length === 0) return 0;
    const completed = stageMilestones.filter(m => project.milestones?.[m.id]).length;
    return Math.round((completed / stageMilestones.length) * 100);
  };

  if (authLoading || loading) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <LoadingSpinner size="lg" message="Loading pipeline..." />
      </div>
    );
  }

  return (
      <div 
        className="min-h-screen bg-black"
      >
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold text-white mb-2">Investment Pipeline</h1>
              <p className="text-white/70">Track deals from screening to portfolio</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <span className="text-white/60 text-sm">Total Deals:</span>
                <span className="text-white font-bold text-lg ml-2">{projects.length}</span>
              </div>
                <AnimatedButton
                  variant="primary"
                onClick={() => router.push('/vc/dealflow')}
                icon={<NeonCyanIcon type="rocket" size={20} className="text-current" />}
              >
                Browse Dealflow
                </AnimatedButton>
            </div>
          </div>
                </div>
              </div>
              
      {/* Pipeline Board */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <NeonCyanIcon type="pipeline" size={64} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No deals in pipeline yet</h3>
            <p className="text-white/60 mb-6">Start adding projects from dealflow to track them here</p>
            <AnimatedButton
              variant="primary"
              onClick={() => router.push('/vc/dealflow')}
            >
              Go to Dealflow
            </AnimatedButton>
              </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map(stage => {
                const stageProjects = projects.filter(p => p.stage === stage.id);
                
                return (
                  <div
                    key={stage.id}
                    className="w-80 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    {/* Stage Header */}
                    <div className={`${getStageColor(stage.color)} border rounded-xl p-4 mb-4`}>
                      <h3 className="font-bold text-lg mb-1">{stage.label}</h3>
                      <p className="text-sm opacity-80">{stage.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium">{stageProjects.length} deals</span>
                        {stageProjects.length > 0 && (
                          <span className="text-xs">
                            ${stageProjects.reduce((sum, p) => sum + (p.fundingGoal || 0), 0).toLocaleString()}
                          </span>
                        )}
            </div>
          </div>

                    {/* Projects in Stage */}
                    <div className="space-y-3">
                      {stageProjects.map(project => {
                        const progress = getMilestoneProgress(project);
                        const stageMilestones = MILESTONE_CHECKLIST.filter(m => m.stage === stage.id);
                        const completedMilestones = stageMilestones.filter(m => project.milestones?.[m.id]).length;

                        return (
                          <div
                            key={project.id}
                            draggable
                            onDragStart={() => handleDragStart(project.id)}
                            className="neo-glass-card rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-all cursor-move group"
                          >
                            {/* Project Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
                                  {project.projectName}
                                </h4>
                                {project.sector && (
                                  <span className="text-xs text-white/60">{project.sector}</span>
                                )}
              </div>
                              {project.raftai?.rating && (
                                <span className={`text-xs px-2 py-1 rounded-full border ml-2 ${
                                  project.raftai.rating === 'High' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  project.raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}>
                                  {project.raftai.rating}
                                </span>
                              )}
            </div>
            
                            {/* Milestones Progress */}
                            {stageMilestones.length > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                                  <span>Milestones</span>
                                  <span className="font-medium text-white">{completedMilestones}/{stageMilestones.length}</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
              </div>
                            )}

                            {/* Quick Info */}
                            {project.fundingGoal && (
                              <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                                <span>Funding Goal:</span>
                                <span className="text-white font-medium">${project.fundingGoal.toLocaleString()}</span>
            </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowMilestones(true);
                                }}
                                className="flex-1 px-2 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                              >
                                <NeonCyanIcon type="check" size={12} className="text-current" />
                                Milestones
                              </button>
                              <button
                                onClick={() => router.push(`/vc/project/${project.projectId}`)}
                                className="flex-1 px-2 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                              >
                                <NeonCyanIcon type="users" size={12} className="text-current" />
                                View
                              </button>
                            </div>
              </div>
                        );
                      })}
            </div>
              </div>
                );
              })}
            </div>
          </div>
        )}
          </div>

      {/* Milestones Modal */}
      {showMilestones && selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/95 backdrop-blur-lg rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedProject.projectName}</h2>
                <p className="text-white/60 text-sm">{selectedProject.projectDescription || 'Investment Pipeline'}</p>
              </div>
              <button
                onClick={() => setShowMilestones(false)}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Stage */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">Current Stage</label>
              <select
                value={selectedProject.stage}
                onChange={(e) => updateProjectStage(selectedProject.id, e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PIPELINE_STAGES.map(stage => (
                  <option key={stage.id} value={stage.id} className="bg-black">
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* All Milestones */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Investment Milestones</h3>
              <div className="space-y-3">
                {MILESTONE_CHECKLIST.map(milestone => {
                  const isCompleted = selectedProject.milestones?.[milestone.id] || false;
                  const MilestoneIcon = milestone.icon;

                  return (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                  <button
                        onClick={() => toggleMilestone(selectedProject.id, milestone.id, isCompleted)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/30 hover:border-blue-500'
                        }`}
                      >
                        {isCompleted && <NeonCyanIcon type="check" size={16} className="text-white" />}
                  </button>
                      {typeof MilestoneIcon === 'function' ? (
                        <MilestoneIcon className={isCompleted ? 'text-green-400' : 'text-white/60'} />
                      ) : (
                        <MilestoneIcon className={`h-5 w-5 ${isCompleted ? 'text-green-400' : 'text-white/60'}`} />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-white' : 'text-white/80'}`}>
                          {milestone.label}
                        </p>
                        <p className="text-xs text-white/50">Stage: {PIPELINE_STAGES.find(s => s.id === milestone.stage)?.label}</p>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>

            {/* Payment Details (for Closing stage) */}
            {selectedProject.stage === 'closing' && (
                <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <NeonCyanIcon type="dollar" size={24} className="text-green-400" />
                  Payment Details
                </h3>
                <div className="space-y-4 p-5 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Investment Amount ($)</label>
                    <input
                      type="number"
                      defaultValue={selectedProject.paymentAmount || ''}
                      onBlur={async (e) => {
                        if (!user) return;
                        try {
                          const isReady = await waitForFirebase(5000);
                          if (!isReady) {
                            console.error('❌ Firebase not initialized');
                            return;
                          }
                          const dbInstance = ensureDb();
                          if (!dbInstance) return;
                          await updateDoc(doc(dbInstance, 'pipeline', selectedProject.id), {
                            paymentAmount: parseFloat(e.target.value) || 0,
                            updatedAt: Date.now()
                          });
                        } catch (error) {
                          console.error('Error updating payment amount:', error);
                        }
                      }}
                      placeholder="500000"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Blockchain</label>
                    <input
                      type="text"
                      defaultValue={selectedProject.paymentChain || ''}
                      onBlur={async (e) => {
                        if (!user) return;
                        try {
                          const isReady = await waitForFirebase(5000);
                          if (!isReady) return;
                          const dbInstance = ensureDb();
                          await updateDoc(doc(dbInstance, 'pipeline', selectedProject.id), {
                            paymentChain: e.target.value,
                            updatedAt: Date.now()
                          });
                        } catch (error) {
                          console.error('Error updating payment chain:', error);
                        }
                      }}
                      placeholder="Ethereum, Polygon, BSC..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Contract Address</label>
                    <input
                      type="text"
                      defaultValue={selectedProject.paymentContractAddress || ''}
                      onBlur={async (e) => {
                        if (!user) return;
                        try {
                          const isReady = await waitForFirebase(5000);
                          if (!isReady) return;
                          const dbInstance = ensureDb();
                          await updateDoc(doc(dbInstance, 'pipeline', selectedProject.id), {
                            paymentContractAddress: e.target.value,
                            updatedAt: Date.now()
                          });
                        } catch (error) {
                          console.error('Error updating contract address:', error);
                        }
                      }}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Transaction Proof / Explorer Link</label>
                    <input
                      type="url"
                      defaultValue={selectedProject.paymentProof || ''}
                      onBlur={async (e) => {
                        if (!user) return;
                        try {
                          const isReady = await waitForFirebase(5000);
                          if (!isReady) return;
                          const dbInstance = ensureDb();
                          await updateDoc(doc(dbInstance, 'pipeline', selectedProject.id), {
                            paymentProof: e.target.value,
                            updatedAt: Date.now()
                          });
                        } catch (error) {
                          console.error('Error updating payment proof:', error);
                        }
                      }}
                      placeholder="https://etherscan.io/tx/0x..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-xs text-center">
                      💡 These details will be visible to the founder so they can verify the payment
                    </p>
                    </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">IC Notes & DD Findings</label>
              <textarea
                value={selectedProject.notes || ''}
                onChange={(e) => addNote(selectedProject.id, e.target.value)}
                placeholder="Add IC notes, DD findings, or next steps..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
                </div>

                {/* Actions */}
            <div className="flex gap-3">
                  <AnimatedButton
                variant="secondary"
                onClick={() => router.push(`/vc/project/${selectedProject.projectId}`)}
                icon={<NeonCyanIcon type="users" size={20} className="text-current" />}
                    fullWidth
                  >
                View Project
                  </AnimatedButton>
                  <AnimatedButton
                variant="danger"
                onClick={() => {
                  removeFromPipeline(selectedProject.id);
                  setShowMilestones(false);
                }}
                icon={<NeonCyanIcon type="exclamation" className="text-current" size={20} />}
                    fullWidth
                  >
                Remove
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}
        </div>
  );
}
