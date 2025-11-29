"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import VCProjectOverview from "./VCProjectOverview";
import { vcDealflowManager, vcAuthManager, dealRoomManager } from '@/lib/vc-complete-fix';
import { roleFlowManager } from '@/lib/role-flow-manager';
import { raftaiCollaborationManager } from '@/lib/raftai-collaboration-manager';
import { chatRoomManager } from '@/lib/chat-room-manager';
import { auditLogger } from '@/lib/audit-logger';
import RaftAIIntegration from './RaftAIIntegration';
import DealRoomInterface from '@/components/DealRoomInterface';
// Removed DemoDataGenerator - using real Firebase data only
import { Project } from '@/lib/vc-data-models';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface VCDealflowDashboardProps {}

const VCDealflowDashboard: React.FC<VCDealflowDashboardProps> = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [dealRooms, setDealRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [kybStatus, setKybStatus] = useState<string>('pending');
  // Removed isDemoMode - using real Firebase data only
  const [activeTab, setActiveTab] = useState<'feed' | 'pipeline' | 'chat' | 'raftai'>('feed');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectOverview, setShowProjectOverview] = useState(false);
  const [showEnhancedChat, setShowEnhancedChat] = useState(false);
  const [showRaftAICollaboration, setShowRaftAICollaboration] = useState(false);
  const [currentDealRoom, setCurrentDealRoom] = useState<any>(null);
  const [currentCollaborationGroup, setCurrentCollaborationGroup] = useState<any>(null);
  const [showDealRoomInterface, setShowDealRoomInterface] = useState(false);
  const [currentDealRoomId, setCurrentDealRoomId] = useState<string | null>(null);
  const [acceptingProject, setAcceptingProject] = useState<string | null>(null);
  const [decliningProject, setDecliningProject] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showRaftAI, setShowRaftAI] = useState(false);
  const [selectedProjectForRaftAI, setSelectedProjectForRaftAI] = useState<Project | null>(null);

  // Load data function
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError('');

      // Check if onboarding is completed
      const isOnboardingComplete = await roleFlowManager.isStepCompleted('onboarding');
      console.log('VC Dashboard: Onboarding complete check:', isOnboardingComplete);
      
      if (!isOnboardingComplete) {
        console.warn('Onboarding not completed, redirecting to correct step');
        const correctRoute = await roleFlowManager.getCorrectRoute();
        console.log('VC Dashboard: Redirecting to:', correctRoute);
        router.push(correctRoute);
        return;
      }

      // Get organization ID - must have real org ID
      const orgIdResult = await vcAuthManager.getUserOrgId(user.uid);
      
      if (!orgIdResult) {
        console.error('No organization ID found, user needs to complete onboarding');
        setError('Please complete your organization setup first');
        setLoading(false);
        // Redirect to onboarding
        router.push('/vc/onboarding');
        return;
      }

      setOrgId(orgIdResult);
      // Always use real Firebase data
      
      // Always load real Firebase data - no demo data
      console.log('Loading real-time Firebase data for org:', orgIdResult);
      
      if (true) { // Always use real data
        // Load real data without timeout delays
        const [projectsResult, pipelineResult, metricsResult, dealRoomsResult] = await Promise.all([
          vcDealflowManager.getProjects(orgIdResult),
          vcDealflowManager.getPipeline(orgIdResult),
          vcDealflowManager.getMetrics(orgIdResult),
          vcDealflowManager.getDealRooms(orgIdResult)
        ]);

        if (projectsResult.success) {
          setProjects(projectsResult.data || []);
        } else {
          console.error('Failed to load projects:', projectsResult.error);
        }
        const pipelineData: any = pipelineResult;
        if (Array.isArray(pipelineData)) {
          setPipeline(pipelineData);
        } else if (pipelineData?.success) {
          setPipeline(pipelineData.data || []);
        } else {
          console.error('Failed to load pipeline:', pipelineData?.error);
        }
        const metricsData: any = metricsResult;
        if (metricsData?.success) {
          setMetrics(metricsData.data || {
            totalProjects: 0,
            projectsThisMonth: 0,
            fundingAmount: 0,
            fundingGrowth: 0,
            avgRating: 0,
            activeDeals: 0,
          });
        } else {
          console.error('Failed to load metrics:', metricsData?.error);
          setMetrics({
            totalProjects: 0,
            projectsThisMonth: 0,
            fundingAmount: 0,
            fundingGrowth: 0,
            avgRating: 0,
            activeDeals: 0,
          });
        }
        const dealRoomsData: any = dealRoomsResult;
        if (Array.isArray(dealRoomsData)) {
          setDealRooms(dealRoomsData);
        } else {
          setDealRooms(dealRoomsData?.data || []);
        }
      }

      // Check KYB status
      try {
        const kybResult: any = await vcAuthManager.getKYBStatus(user.uid);
        if (kybResult) {
          if (kybResult.success) {
            setKybStatus(kybResult.data || 'pending');
          } else if (typeof kybResult === 'string') {
            setKybStatus(kybResult);
          } else if (kybResult.status) {
            setKybStatus(kybResult.status);
          }
        }
      } catch (kybError) {
        console.warn('Failed to get KYB status:', kybError);
        setKybStatus('pending');
      }

      // Set up real-time listeners for live updates
      setupRealtimeListeners(orgIdResult);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, router]);

  // Set up real-time listeners for live updates
  const setupRealtimeListeners = useCallback(async (orgId: string) => {
    try {
      console.log('Setting up real-time listeners for org:', orgId);
      
      // Set up real-time project updates
      const unsubscribeProjects = vcDealflowManager.subscribeToProjects(orgId, {}, (projects) => {
        console.log('Real-time projects update:', projects?.length || 0);
        setProjects(projects || []);
      });
      
      // Set up real-time pipeline updates
      const unsubscribePipeline = vcDealflowManager.subscribeToPipeline(orgId, (pipeline) => {
        console.log('Real-time pipeline update:', pipeline?.length || 0);
        setPipeline(pipeline || []);
      });
      
      // Set up real-time metrics updates
      const unsubscribeMetrics = vcDealflowManager.subscribeToMetrics(orgId, (metrics) => {
        console.log('Real-time metrics update:', metrics);
        setMetrics(metrics || {});
      });
      
      // Set up real-time deal rooms updates
      const unsubscribeDealRooms = vcDealflowManager.subscribeToDealRooms(orgId, (dealRooms) => {
        console.log('Real-time deal rooms update:', dealRooms?.length || 0);
        setDealRooms(dealRooms || []);
      });
      
      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeProjects?.();
        unsubscribePipeline?.();
        unsubscribeMetrics?.();
        unsubscribeDealRooms?.();
      };
      
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Project handlers
  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectOverview(true);
  }, []);

  const handleCloseOverview = useCallback(() => {
    setShowProjectOverview(false);
    setSelectedProject(null);
  }, []);

  const handleProjectAccept = useCallback(async (projectId: string) => {
    if (acceptingProject === projectId) return;
    
    try {
      setAcceptingProject(projectId);
      setError('');
      setSuccessMessage('');
      console.log('🚀 ACCEPT BUTTON CLICKED - Accepting project:', projectId);
      
      if (!orgId) {
        console.error('Organization ID not available');
        return;
      }

      const result: any = await (vcDealflowManager as any).acceptProject(projectId, orgId);
      if (!result || result.success !== false) {
        console.log('Project accepted successfully');
        setSuccessMessage('Project accepted! Creating chat room...');
        
        // Get project details for collaboration group creation
        // In demo mode, use the project from our demo data
        let project = projects.find(p => p.id === projectId);
        
        // If not found in demo data, try to get from database
        if (!project) {
          const projectResult: any = await vcDealflowManager.getProject(projectId);
          if (projectResult?.success && projectResult.data) {
            project = projectResult.data;
          }
        }
        
        if (project) {
          
          // Create RaftAI collaboration group
          const collaborationResult = await raftaiCollaborationManager.createCollaborationGroup(
            projectId,
            project.title || 'Unknown Project',
            user?.uid || '',
            user?.displayName || 'VC User',
            project.founderId || 'founder-123',
            project.founderName || 'Project Founder'
          );
          
          if (collaborationResult.success && collaborationResult.groupId) {
            console.log('RaftAI collaboration group created:', collaborationResult.groupId);
            
            // Get the created group from database
            const groupResult = await raftaiCollaborationManager.getCollaborationGroup(collaborationResult.groupId);
            if (groupResult.success && groupResult.group) {
              setCurrentCollaborationGroup(groupResult.group);
              setShowRaftAICollaboration(true);
            }
          } else {
            console.error('Failed to create RaftAI collaboration group:', collaborationResult.error);
            setError(collaborationResult.error || 'Failed to create collaboration group');
          }

          // Create enhanced deal room
          const dealRoomCreationResult = await dealRoomManager.createDealRoom(
            projectId,
            project.founderId || 'founder-123',
            project.founderName || 'Project Founder',
            user?.uid || '',
            user?.displayName || 'VC User',
            project.logoUrl,
            '/vc-logo.png' // VC logo placeholder
          );

          if (dealRoomCreationResult.success && dealRoomCreationResult.dealRoomId) {
                    console.log('Enhanced deal room created:', dealRoomCreationResult.dealRoomId);
                    
                    // Create deal room with proper naming: {FOUNDER_NAME} / {VC_NAME}
                    const founderName = project.founderName || 'Project Founder';
                    const vcName = user?.displayName || 'VC User';
                    const roomName = `${founderName} / ${vcName}`;
                    
                    // Create chat room for the accepted project using the same ID as the deal room
                    const chatRoom = chatRoomManager.createDealRoomFromProject(
                      {
                        id: projectId,
                        title: project.title || 'Unknown Project',
                        logoUrl: project.logoUrl || '/cryptorafts.logo.png', // Placeholder if missing
                        founderName: founderName,
                        founderLogo: project.logoUrl || '/cryptorafts.logo.png'
                      },
                      {
                        name: vcName,
                        logo: '/cryptorafts.logo.png' // VC logo placeholder
                      }
                    );
                    
                    // Use the same ID as the deal room for consistency
                    chatRoom.id = dealRoomCreationResult.dealRoomId;
                    chatRoom.name = roomName; // Set the proper name format
                    
                    // Add system message from RaftAI
                    chatRoom.lastMessage = {
                      content: `RaftAI created this deal room for ${founderName} / ${vcName}.`,
                      sender: 'RaftAI',
                      timestamp: new Date(),
                      isRead: false
                    };
                    
                    // Add the chat room to the manager
                    chatRoomManager.addChatRoom(chatRoom);
                    console.log('Deal room created with name:', roomName);
                    console.log('Chat room added to manager:', chatRoom.id);
                    console.log('Chat room details:', chatRoom);
                    
                    // Force a refresh of the chat room list
                    const currentRooms = chatRoomManager.getChatRooms();
                    console.log('Current chat rooms after adding:', currentRooms.length);
                    
                    // Log audit event for room creation
                    auditLogger.logRoomCreated(
                      user?.uid || 'demo-vc',
                      vcName,
                      chatRoom.id,
                      roomName,
                      {
                        projectId: projectId,
                        founderName: founderName,
                        vcName: vcName,
                        members: chatRoom.members,
                        roomType: 'deal_room'
                      }
                    );
                    
                    // Add notification for project acceptance
                    if (typeof window !== 'undefined' && (window as any).notificationManager) {
                      (window as any).notificationManager.addNotification({
                        title: 'Project Accepted',
                        message: `${project.title} has been accepted and deal room created`,
                        type: 'success',
                        isRead: false,
                        source: 'project',
                        metadata: { projectId, roomId: chatRoom.id }
                      });
                    }
                    
                    // Set up deal room interface and auto-open it
                    setCurrentDealRoomId(dealRoomCreationResult.dealRoomId);
                    setShowDealRoomInterface(true);
                    
                    // Auto-redirect to chat room after successful creation
                    setSuccessMessage('Chat room created! Redirecting to chat...');
                    setTimeout(() => {
                      router.push(`/chat?room=${dealRoomCreationResult.dealRoomId}`);
                    }, 1500); // Small delay to show success message
                    
                    // Also add to dealRooms list for the chat tab
                    // Deal room is automatically added to the list via real-time listeners
                    const newDealRoom = await dealRoomManager.getDealRoom(dealRoomCreationResult.dealRoomId);
                    if (newDealRoom.success && newDealRoom.dealRoom) {
                      setDealRooms(prev => [...prev, newDealRoom.dealRoom]);
                    }
                    setSuccessMessage(`🎉 Project "${project.title}" accepted! Opening deal room...`);
                    
                    // Switch to chat tab and show the deal room
                    setActiveTab('chat');
                    
                    // Auto-scroll to deal room interface after a short delay
                    setTimeout(() => {
                      const dealRoomElement = document.querySelector('[data-deal-room-interface]');
                      if (dealRoomElement) {
                        dealRoomElement.scrollIntoView({ behavior: 'smooth' });
                      }
                                        }, 1000);
                  } else {
                    console.error('Failed to create enhanced deal room:', dealRoomCreationResult.error);
                    setError(dealRoomCreationResult.error || 'Failed to create deal room');
                  }
          
          // Clear success message after a delay
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      } else {
        console.error('Failed to accept project:', result?.error);
        setError(result?.error || 'Failed to accept project');
      }
    } catch (error) {
      console.error('Error accepting project:', error);
      setError('Failed to accept project. Please try again.');
      setSuccessMessage('');
    } finally {
      setAcceptingProject(null);
    }
  }, [acceptingProject, orgId, user?.uid, user?.displayName, loadData]);

  const handleProjectDecline = useCallback(async (projectId: string) => {
    if (decliningProject === projectId) return;
    
    try {
      setDecliningProject(projectId);
      setError('');
      console.log('❌ DECLINE BUTTON CLICKED - Declining project:', projectId);
      
      if (!orgId) {
        console.error('Organization ID not available');
        return;
      }

      const result: any = await (vcDealflowManager as any).declineProject(projectId, orgId);
      if (!result || result.success !== false) {
        console.log('Project declined successfully');
        setSuccessMessage('Project declined successfully.');
        setTimeout(() => {
          loadData();
          setSuccessMessage('');
        }, 100);
      } else {
        console.error('Failed to decline project:', result?.error);
        setError(result?.error || 'Failed to decline project');
      }
    } catch (error) {
      console.error('Error declining project:', error);
      setError('Error declining project');
    } finally {
      setDecliningProject(null);
    }
  }, [decliningProject, orgId, loadData]);

  const openProjectChat = useCallback((project: Project) => {
    console.log('Opening chat for project:', project.title);
    // Find or create a deal room for this project
    const existingDealRoom = dealRooms.find(room => room.projectId === project.id);
    if (existingDealRoom) {
      setCurrentDealRoom(existingDealRoom);
      setShowEnhancedChat(true);
    } else {
      // Create a new deal room for this project
      console.log('Creating new deal room for project:', project.title);
      setShowEnhancedChat(true);
    }
  }, [dealRooms]);

  // Render functions
  const renderKPICards = useCallback(() => {
    const safeMetrics = {
      totalProjects: metrics.totalProjects || 0,
      projectsThisMonth: metrics.projectsThisMonth || 0,
      activePipeline: metrics.activePipeline || 0,
      pipelineGrowth: metrics.pipelineGrowth || 0,
      dealRooms: metrics.dealRooms || 0,
      dealRoomGrowth: metrics.dealRoomGrowth || 0,
      totalFunding: metrics.totalFunding || 0,
      fundingGrowth: metrics.fundingGrowth || 0
    };
    
    return (
      <div className="perfect-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 gap-6">
        <div className="neo-glass-card rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-2 font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-white">{safeMetrics.totalProjects}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <NeonCyanIcon type="document" size={28} className="text-white" />
            </div>
          </div>
          <div className="flex items-center text-green-400 text-sm font-medium">
            <NeonCyanIcon type="arrow-up" size={16} className="mr-2 flex-shrink-0 text-current" />
            <span>+{safeMetrics.projectsThisMonth} this month</span>
          </div>
        </div>

        <div className="neo-glass-card rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-2 font-medium">Active Pipeline</p>
              <p className="text-3xl font-bold text-white">{safeMetrics.activePipeline}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <NeonCyanIcon type="chart" size={28} className="text-white" />
            </div>
          </div>
          <div className="flex items-center text-green-400 text-sm font-medium">
            <NeonCyanIcon type="arrow-up" size={16} className="mr-2 flex-shrink-0 text-current" />
            <span>+{safeMetrics.pipelineGrowth}% growth</span>
          </div>
        </div>

        <div className="neo-glass-card rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-2 font-medium">Deal Rooms</p>
              <p className="text-3xl font-bold text-white">{safeMetrics.dealRooms}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <NeonCyanIcon type="chat" size={28} className="text-white" />
            </div>
          </div>
          <div className="flex items-center text-green-400 text-sm font-medium">
            <NeonCyanIcon type="arrow-up" size={16} className="mr-2 flex-shrink-0 text-current" />
            <span>+{safeMetrics.dealRoomGrowth}% growth</span>
          </div>
        </div>

        <div className="neo-glass-card rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-2 font-medium">Total Funding</p>
              <p className="text-3xl font-bold text-white">${(safeMetrics.totalFunding / 1000000).toFixed(1)}M</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <NeonCyanIcon type="dollar" size={28} className="text-white" />
            </div>
          </div>
            <div className="flex items-center text-green-400 text-sm font-medium">
            <NeonCyanIcon type="arrow-up" size={16} className="mr-2 flex-shrink-0 text-current" />
            <span>+{safeMetrics.fundingGrowth}% growth</span>
          </div>
        </div>
      </div>
    );
  }, [metrics]);

  const handleToggleWatchlist = useCallback((projectId: string) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(projectId)) {
        newWatchlist.delete(projectId);
        setSuccessMessage('Removed from watchlist');
      } else {
        newWatchlist.add(projectId);
        setSuccessMessage('Added to watchlist');
      }
      
      // Clear success message after delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
      
      return newWatchlist;
    });
  }, []);

  const renderProjectCard = useCallback((project: Project) => {
    return (
      <div key={project.id} className="neo-glass-card rounded-xl p-4 hover:border-cyan-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-xl relative overflow-hidden cursor-pointer h-56 flex flex-col" onClick={() => handleProjectClick(project)}>
        <div className="flex flex-col space-y-3 flex-1">
          {/* Header with Logo and Name */}
          <div className="flex items-start space-x-3">
            {/* Project Logo - Bigger */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-cyan-400/20 flex-shrink-0">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.title} className="w-10 h-10 rounded-lg object-cover" width={40} height={40} />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{project.title?.charAt(0) || 'P'}</span>
          </div>
              )}
      </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white mb-2 line-clamp-1">{project.title}</h3>
              <div className="flex flex-wrap gap-1.5 text-xs text-white/60">
                <span className="flex items-center bg-white/5 border border-cyan-400/20 px-2.5 py-1 rounded-full">
                  <NeonCyanIcon type="building" size={12} className="mr-1.5 flex-shrink-0 text-current" />
                  <span className="truncate">{project.sector}</span>
                </span>
                <span className="flex items-center bg-white/5 border border-cyan-400/20 px-2.5 py-1 rounded-full">
                  <NeonCyanIcon type="dollar" size={12} className="mr-1.5 flex-shrink-0 text-current" />
                  <span className="truncate">${project.traction?.revenue?.toLocaleString() || '0'}</span>
                </span>
                <span className="flex items-center bg-white/5 border border-cyan-400/20 px-2.5 py-1 rounded-full">
                  <NeonCyanIcon type="star" size={12} className="mr-1.5 flex-shrink-0 text-current" />
                  <span className="truncate">{project.raftai?.rating || 'Normal'}</span>
                </span>
          </div>
        </div>
      </div>

          {/* Project Description */}
          {project.description && (
            <p className="text-white/70 text-sm line-clamp-3 flex-1 leading-relaxed">{project.description}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between space-x-2 mt-auto pt-2">
            {/* Watchlist Button */}
          <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWatchlist(project.id);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                watchlist.has(project.id) 
                  ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400' 
                  : 'bg-white/5 border border-cyan-400/20 text-cyan-400/70 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-400/40'
              }`}
            >
              <NeonCyanIcon type="star" size={16} className={`${watchlist.has(project.id) ? 'text-yellow-400' : 'text-current'}`} />
          </button>
            
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProject(project);
                setShowProjectOverview(true);
              }}
              icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
              className="flex-1 text-xs font-medium"
            >
              Overview
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProjectForRaftAI(project);
                setActiveTab('raftai');
              }}
              icon={<NeonCyanIcon type="sparkles" size={16} className="text-current" />}
              className="flex-1 text-xs font-medium"
            >
              RaftAI
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectAccept(project.id);
              }}
              icon={<NeonCyanIcon type="check" size={16} className="text-current" />}
              className="flex-1 text-xs font-medium"
              loading={acceptingProject === project.id}
              disabled={acceptingProject === project.id || decliningProject === project.id}
            >
              {acceptingProject === project.id ? 'Accepting...' : 'Accept'}
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectDecline(project.id);
              }}
              icon={<NeonCyanIcon type="x-circle" size={16} className="text-current" />}
              className="flex-1 text-xs font-medium"
              loading={decliningProject === project.id}
              disabled={acceptingProject === project.id || decliningProject === project.id}
            >
              {decliningProject === project.id ? 'Declining...' : 'Decline'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }, [handleProjectClick, handleProjectAccept, handleProjectDecline, handleToggleWatchlist, acceptingProject, decliningProject, watchlist]);

  const renderFilters = useCallback(() => {
  return (
      <div className="neo-glass-card rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
            <label className="block text-white/70 text-sm mb-2">Search</label>
            <div className="relative">
              <NeonCyanIcon type="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-cyan-400/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              </div>
            </div>
            <div>
            <label className="block text-white/70 text-sm mb-2">Stage</label>
            <select className="w-full px-4 py-2 bg-white/5 border border-cyan-400/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
              <option value="all">All Stages</option>
              <option value="pre-seed">Pre-Seed</option>
              <option value="seed">Seed</option>
              <option value="series-a">Series A</option>
            </select>
                  </div>
                  <div>
            <label className="block text-white/70 text-sm mb-2">Sector</label>
            <select className="w-full px-4 py-2 bg-white/5 border border-cyan-400/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
              <option value="all">All Sectors</option>
              <option value="defi">DeFi</option>
              <option value="gaming">Gaming</option>
              <option value="ai-ml">AI/ML</option>
            </select>
                  </div>
                  <div>
            <label className="block text-white/70 text-sm mb-2">Rating</label>
            <select className="w-full px-4 py-2 bg-white/5 border border-cyan-400/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
              <option value="all">All Ratings</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
                  </div>
                </div>
              </div>
    );
  }, []);

  const renderPipelineBoard = useCallback(() => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Pipeline Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BlockchainCard variant="default" size="lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Discovery</h3>
              <div className="space-y-2">
                {pipeline.filter(p => p.stage === 'discovery').map(project => (
                  <div key={project.id} className="p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-white text-sm">{project.title}</p>
            </div>
                ))}
          </div>
        </div>
          </BlockchainCard>
          <BlockchainCard variant="default" size="lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Due Diligence</h3>
              <div className="space-y-2">
                {pipeline.filter(p => p.stage === 'due-diligence').map(project => (
                  <div key={project.id} className="p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-white text-sm">{project.title}</p>
        </div>
                ))}
            </div>
                </div>
          </BlockchainCard>
          <BlockchainCard variant="default" size="lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Investment</h3>
              <div className="space-y-2">
                {pipeline.filter(p => p.stage === 'investment').map(project => (
                  <div key={project.id} className="p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-white text-sm">{project.title}</p>
            </div>
                ))}
          </div>
            </div>
          </BlockchainCard>
            </div>
          </div>
    );
  }, [pipeline]);

  const renderChat = useCallback(() => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Deal Rooms & Chat</h2>
        
        {dealRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealRooms.map((room) => (
              <div key={room.id} className="neo-glass-card rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                    <p className="text-white/60 text-sm">{room.type}</p>
                </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white/60 text-sm">Active</span>
                </div>
              </div>

                <p className="text-white/70 text-sm mb-4 line-clamp-2">{room.description}</p>
                
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-white/60">Members:</span>
                  <span className="text-white font-medium">{room.members?.length || 0}</span>
                    </div>
                
                        <AnimatedButton
                          variant="primary"
                          size="xs"
                          onClick={() => {
                            setCurrentDealRoomId(room.id);
                            setShowDealRoomInterface(true);
                          }}
                          icon={<NeonCyanIcon type="chat" size={16} className="text-current" />}
                          className="w-full"
                        >
                          Open Chat
                        </AnimatedButton>
                    </div>
            ))}
                  </div>
        ) : (
          <BlockchainCard variant="default" size="xl">
            <div className="p-6 text-center">
              <NeonCyanIcon type="chat" size={64} className="text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Deal Rooms Yet</h3>
              <p className="text-white/60 mb-4">Start by accepting projects to create deal rooms and begin chatting with founders.</p>
              <AnimatedButton
                variant="primary"
                size="xs"
                onClick={() => setActiveTab('feed')}
                icon={<NeonCyanIcon type="eye" size={20} className="text-current" />}
              >
                Browse Projects
              </AnimatedButton>
                    </div>
          </BlockchainCard>
        )}
                  </div>
    );
  }, [dealRooms, setCurrentDealRoom, setShowEnhancedChat, setActiveTab]);

  // Loading state
  if (loading) {
    return <StandardLoading title="Loading Dashboard" message="Preparing your VC workspace..." />;
  }

  return (
    <div className="min-h-screen relative neo-blue-background">
      <div className="container-perfect relative z-10">
        {/* Header */}
        <div className="neo-glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">VC Dealflow Dashboard</h1>
              <p className="text-white/70 text-sm">Real-time project feed and pipeline management</p>
                    </div>
            
                    <div className="flex items-center space-x-3">
              <AnimatedButton
                variant="primary"
                size="xs"
                onClick={() => setShowFilters(!showFilters)}
                icon={<NeonCyanIcon type="funnel" size={12} className="text-current" />}
              >
                Filters
              </AnimatedButton>
                  </div>
                </div>
              </div>

        {/* Real-time Firebase data - no demo mode */}

        {/* Success Message */}
        {successMessage && (
          <div className="neo-glass-card rounded-2xl p-6 mb-6 border border-green-500/30">
                    <div className="flex items-center space-x-3">
              <NeonCyanIcon type="check" size={24} className="text-green-400" />
                      <div>
                <h3 className="text-white font-semibold">Success!</h3>
                <p className="text-white/60 text-sm">{successMessage}</p>
                      </div>
                    </div>
                  </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="neo-glass-card rounded-lg p-3 mb-3 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <NeonCyanIcon type="exclamation" size={16} className="text-red-400" />
                      <div>
                  <h3 className="text-white font-semibold text-sm">Error</h3>
                  <p className="text-white/60 text-xs">{error}</p>
                      </div>
                    </div>
              {error.includes('onboarding') && (
                <AnimatedButton
                  variant="primary"
                  size="xs"
                  onClick={async () => {
                    const correctRoute = await roleFlowManager.getCorrectRoute();
                    router.push(correctRoute);
                  }}
                >
                  Complete Setup
                </AnimatedButton>
              )}
                      </div>
                      </div>
        )}

        {/* Filters */}
        {showFilters && renderFilters()}

        {/* KPI Cards */}
        {renderKPICards()}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { id: 'feed', label: 'Project Feed', iconType: 'eye' as const },
            { id: 'pipeline', label: 'Pipeline', iconType: 'chart' as const },
            { id: 'chat', label: 'Chat', iconType: 'chat' as const },
            { id: 'raftai', label: 'RaftAI', iconType: 'sparkles' as const }
          ].map(tab => (
            <AnimatedButton
              key={tab.id}
              variant="primary"
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              icon={<NeonCyanIcon type={tab.iconType} size={20} className="text-current" />}
              className={`font-medium ${activeTab === tab.id ? 'opacity-100 shadow-lg' : 'opacity-70'}`}
            >
              {tab.label}
            </AnimatedButton>
          ))}
          </div>
          
        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Project Feed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(renderProjectCard)}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && renderPipelineBoard()}
        {activeTab === 'chat' && renderChat()}
        
        {activeTab === 'raftai' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">RaftAI Analysis</h2>
              {selectedProjectForRaftAI && (
                <div className="text-sm text-gray-300">
                  Analyzing: <span className="font-semibold text-blue-400">{selectedProjectForRaftAI.title}</span>
                </div>
              )}
            </div>
            <RaftAIIntegration
              projectId={selectedProjectForRaftAI?.id}
              userId={user?.uid}
              orgId={orgId || undefined}
              onAnalysisComplete={(analysis) => {
                console.log('RaftAI analysis completed:', analysis);
                // You can add additional handling here
              }}
              className="bg-white/5 backdrop-blur-sm border border-cyan-400/20"
            />
          </div>
        )}

        {/* Project Overview Modal */}
        {showProjectOverview && selectedProject && (
          <VCProjectOverview
            project={selectedProject}
            onClose={handleCloseOverview}
            onAccept={handleProjectAccept}
            onDecline={handleProjectDecline}
          />
        )}

        {/* Deal Room Interface */}
        {showDealRoomInterface && currentDealRoomId && (
          <div data-deal-room-interface className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
            <div className="flex justify-end p-4">
              <button
                onClick={() => {
                  setShowDealRoomInterface(false);
                  setCurrentDealRoomId(null);
                }}
                className="text-white hover:text-blue-400 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DealRoomInterface roomId={currentDealRoomId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VCDealflowDashboard;
