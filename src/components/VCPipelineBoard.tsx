"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcDealflowManager } from '@/lib/vc-dealflow-manager';
import { VCPipelineItem, Project } from '@/lib/vc-data-models';
import BlockchainCard from '@/components/ui/BlockchainCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface VCPipelineBoardProps {
  orgId: string;
}

const PIPELINE_STAGES = [
  { id: 'new', name: 'New', color: 'bg-blue-600', description: 'Recently added projects' },
  { id: 'under_review', name: 'Under Review', color: 'bg-yellow-600', description: 'Due diligence in progress' },
  { id: 'approved', name: 'Approved', color: 'bg-green-600', description: 'Investment committee approved' },
  { id: 'ongoing', name: 'Ongoing', color: 'bg-purple-600', description: 'Deal in progress' },
  { id: 'on_hold', name: 'On Hold', color: 'bg-orange-600', description: 'Deal paused' },
  { id: 'archived', name: 'Archived', color: 'bg-gray-600', description: 'Deal completed or declined' }
];

export default function VCPipelineBoard({ orgId }: VCPipelineBoardProps) {
  const { user } = useAuth();
  const [pipeline, setPipeline] = useState<VCPipelineItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<VCPipelineItem | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);

  // Load pipeline and projects
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pipelineResult, projectsResult] = await Promise.all([
          vcDealflowManager.getPipeline(orgId),
          vcDealflowManager.getProjects(orgId)
        ]);

        if (Array.isArray(pipelineResult)) {
          setPipeline(pipelineResult);
        } else if (pipelineResult?.success) {
          setPipeline(pipelineResult.data || []);
        }
        if (Array.isArray(projectsResult)) {
          setProjects(projectsResult);
        } else if (projectsResult?.success) {
          setProjects(projectsResult.data || []);
        }
      } catch (error) {
        console.error('Error loading pipeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  // Subscribe to real-time pipeline updates
  useEffect(() => {
    const unsubscribe = vcDealflowManager.subscribeToPipeline(orgId, (newPipeline) => {
      setPipeline(newPipeline);
    });

    return unsubscribe;
  }, [orgId]);

  const handleDragStart = (e: React.DragEvent, item: VCPipelineItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.stage === targetStage) {
      setDraggedItem(null);
      return;
    }

    try {
      await vcDealflowManager.updatePipelineStage(
        orgId,
        draggedItem.projectId,
        targetStage as VCPipelineItem['stage'],
        user?.uid || 'user1'
      );
      
      console.log(`Moved ${draggedItem.projectId} to ${targetStage}`);
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
    } finally {
      setDraggedItem(null);
    }
  };

  const getProjectsInStage = (stageId: string) => {
    return pipeline.filter(item => item.stage === stageId);
  };

  const getProjectDetails = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'new':
        return <PlusIcon className="w-4 h-4" />;
      case 'under_review':
        return <EyeIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'ongoing':
        return <ArrowRightIcon className="w-4 h-4" />;
      case 'on_hold':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'archived':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white">Investment Pipeline</h2>
          <p className="text-white/60 text-sm">Drag and drop to move projects between stages</p>
        </div>
        <AnimatedButton
          variant="primary"
          size="sm"
          onClick={() => setShowAddProject(true)}
          icon={<PlusIcon className="w-4 h-4" />}
        >
          Add Project
        </AnimatedButton>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex space-x-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const stageItems = getProjectsInStage(stage.id);
            
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className={`${stage.color} rounded-t-xl p-3 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStageIcon(stage.id)}
                      <h3 className="font-semibold">{stage.name}</h3>
                    </div>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                      {stageItems.length}
                    </span>
                  </div>
                  <p className="text-white/80 text-xs mt-1">{stage.description}</p>
                </div>

                {/* Stage Items */}
                <div className="bg-black/40 rounded-b-xl p-3 min-h-96">
                  <div className="space-y-3">
                    {stageItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          {getStageIcon(stage.id)}
                        </div>
                        <p className="text-white/40 text-sm">No projects</p>
                      </div>
                    ) : (
                      stageItems.map((item) => {
                        const project = getProjectDetails(item.projectId);
                        
                        return (
                          <BlockchainCard
                            key={item.id}
                            className="p-3 cursor-move hover:bg-white/10 transition-colors"
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                          >
                            <div className="space-y-2">
                              {/* Project Title */}
                              <div className="flex items-start justify-between">
                                <h4 className="text-white font-medium text-sm line-clamp-2">
                                  {project?.title || item.projectTitle || 'Unknown Project'}
                                </h4>
                                <div className="flex items-center space-x-1 text-white/40">
                                  <UserGroupIcon className="w-3 h-3" />
                                  <span className="text-xs">{item.watchers.length}</span>
                                </div>
                              </div>

                              {/* Project Info */}
                              {project && (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2 text-xs text-white/60">
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                      {project.sector}
                                    </span>
                                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                                      {project.stage}
                                    </span>
                                  </div>
                                  
                                  {project.raftai && (
                                    <div className="flex items-center space-x-1 text-xs">
                                      <span className="text-white/60">RaftAI Score:</span>
                                      <span className={`font-medium ${
                                        project.raftai.score >= 80 ? 'text-green-400' :
                                        project.raftai.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                      }`}>
                                        {project.raftai.score}/100
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Timeline */}
                              <div className="flex items-center space-x-1 text-xs text-white/40">
                                <ClockIcon className="w-3 h-3" />
                                <span>Added {formatDate(item.addedAt)}</span>
                              </div>

                              {/* Notes Count */}
                              {item.notes.length > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-white/40">
                                  <DocumentTextIcon className="w-3 h-3" />
                                  <span>{item.notes.length} notes</span>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <div className="flex items-center space-x-1">
                                  {(item.watchers || []).map((watcherId, index) => (
                                    <div
                                      key={watcherId}
                                      className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                                      title={`Watcher ${index + 1}`}
                                    >
                                      <span className="text-white text-xs font-semibold">
                                        {watcherId.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <AnimatedButton
                                    variant="primary"
                                    size="xs"
                                    icon={<EyeIcon className="w-3 h-3" />}
                                    onClick={() => console.log('Viewing project', item.projectId)}
                                  >
                                    View
                                  </AnimatedButton>
                                  <AnimatedButton
                                    variant="primary"
                                    size="xs"
                                    icon={<PencilIcon className="w-3 h-3" />}
                                    onClick={() => console.log('Editing notes for', item.projectId)}
                                  >
                                    Edit
                                  </AnimatedButton>
                                </div>
                              </div>
                            </div>
                          </BlockchainCard>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Project Modal (Placeholder) */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <BlockchainCard className="w-96 p-6">
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">Add Project to Pipeline</h3>
              <p className="text-white/60 text-sm mb-6">
                Select a project from your dealflow to add to the pipeline.
              </p>
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => {
                      // Add project to pipeline
                      console.log('Adding project to pipeline:', project.id);
                      setShowAddProject(false);
                    }}
                  >
                    <h4 className="text-white font-medium text-sm">{project.title}</h4>
                    <p className="text-white/60 text-xs">{project.sector} • {project.stage}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-6">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddProject(false)}
                  fullWidth
                >
                  Cancel
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        </div>
      )}
    </div>
  );
}
