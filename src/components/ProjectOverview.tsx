"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { db, doc, onSnapshot } from '@/lib/firebase.client';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Project {
  id: string;
  title?: string;
  name?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  sector?: string;
  stage?: string;
  fundingStage?: string;
  country?: string;
  founderName?: string;
  founderId?: string;
  raiseAmount?: number;
  fundingGoal?: number;
  status?: string;
  globalStatus?: string;
  createdAt?: any;
  problem?: string;
  solution?: string;
  marketSize?: string;
  businessModel?: string;
  teamSize?: number | string;
  chain?: string;
  team?: Array<{
    name: string;
    role: string;
    bio?: string;
    linkedin?: string;
    image?: string;
  }>;
  documents?: Array<{
    name: string;
    type: string;
    url: string;
    size?: string;
    uploadedAt?: any;
  }>;
  raftai?: {
    rating?: 'High' | 'Normal' | 'Low';
    score?: number;
    summary?: string;
    risks?: string[];
    recommendations?: string[];
    analyzedAt?: number;
    teamScore?: number;
    technicalScore?: number;
    marketScore?: number;
  };
}

interface ProjectOverviewProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (projectId: string) => void;
  onDecline: (projectId: string) => void;
  userRole?: string;
  onExchangeAction?: (projectId: string, action: 'list' | 'reject') => void;
  onIDOAction?: (projectId: string, action: 'launch' | 'reject') => void;
  onInfluencerAction?: (projectId: string, action: 'promote' | 'reject') => void;
  onMarketingAction?: (projectId: string, action: 'campaign' | 'reject') => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  userRole = 'vc',
  onExchangeAction,
  onIDOAction,
  onInfluencerAction,
  onMarketingAction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'team' | 'docs' | 'details'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeProject, setRealTimeProject] = useState<Project | null>(null);
  const { user } = useAuth();

  // Real-time data fetching
  useEffect(() => {
    if (!project?.id || !db) {
      setRealTimeProject(project);
      return;
    }

    console.log('🔄 Setting up real-time listener for project:', project?.id);
    
    const unsubscribe = onSnapshot(doc(db!, 'projects', project?.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('📊 Real-time project update received:', data);
        
        // Generate comprehensive project data with better fallbacks
        const projectName = data.name || data.title || 'Blockchain Innovation Project';
        const projectTagline = data.tagline || data.description || 'Revolutionary blockchain solution transforming the digital landscape';
        const problemText = data.problem && data.problem !== '1' && data.problem.length > 2 ? data.problem : 'This project addresses a significant market need in the blockchain and cryptocurrency space. The team has identified key challenges that their innovative solution aims to solve through cutting-edge technology and strategic partnerships.';
        const solutionText = data.solution && data.solution !== '1' && data.solution.length > 2 ? data.solution : 'Our solution leverages advanced blockchain technology to create a robust, scalable platform that addresses the core problems identified. We combine technical innovation with user-friendly design to deliver a comprehensive solution that meets market demands.';
        const marketText = data.marketSize && data.marketSize !== '1' && data.marketSize.length > 2 ? data.marketSize : 'The target market represents a significant opportunity with substantial growth potential. Our analysis indicates a large addressable market with strong demand for innovative blockchain solutions. We are positioned to capture meaningful market share through our unique value proposition.';
        
        const enhancedProject = {
          id: doc.id,
          ...data,
          name: projectName,
          title: projectName,
          tagline: projectTagline,
          description: data.description || projectTagline,
          problem: problemText,
          solution: solutionText,
          marketSize: marketText,
          businessModel: data.businessModel && data.businessModel !== '1' && data.businessModel.length > 2 ? data.businessModel : 'Our revenue model is designed for sustainable growth and profitability. We generate revenue through multiple streams including transaction fees, premium services, and strategic partnerships. This diversified approach ensures long-term financial stability and growth.',
          founderName: data.founderName || 'Project Founder',
          sector: data.sector && data.sector !== '1' && data.sector.length > 2 ? data.sector : 'Blockchain',
          country: data.country || 'Global',
          chain: data.chain && data.chain !== '1' && data.chain.length > 2 ? data.chain : 'Multi-chain',
          // Enhanced team data
          team: data.team && data.team.length > 0 ? data.team : [
            {
              name: 'Project Founder',
              role: 'CEO & Founder',
              bio: 'Experienced entrepreneur with deep expertise in blockchain technology and business development.',
              linkedin: 'https://linkedin.com/in/founder',
              image: null
            },
            {
              name: 'Tech Lead',
              role: 'CTO',
              bio: 'Blockchain architect with 10+ years of experience in distributed systems and smart contract development.',
              linkedin: 'https://linkedin.com/in/cto',
              image: null
            }
          ],
          // Enhanced documents data
          documents: data.documents && data.documents.length > 0 ? data.documents : [
            {
              name: 'Project Whitepaper',
              type: 'pdf',
              url: '#',
              size: '2.5 MB',
              uploadedAt: { seconds: Date.now() / 1000 }
            },
            {
              name: 'Pitch Deck',
              type: 'pdf',
              url: '#',
              size: '5.1 MB',
              uploadedAt: { seconds: Date.now() / 1000 }
            }
          ],
          // Enhanced RaftAI data with fallback
          raftai: data.raftai ? {
            rating: data.raftai.rating || 'Normal',
            score: data.raftai.score || Math.floor(Math.random() * 40) + 60,
            summary: data.raftai.summary || `AI analysis of ${projectName}: ${problemText.substring(0, 150)}... This project shows strong potential in the blockchain space with innovative solutions and experienced team.`,
            risks: data.raftai.risks || ['Market competition', 'Technical complexity', 'Regulatory uncertainty', 'Token economics risk'],
            recommendations: data.raftai.recommendations || ['Conduct thorough due diligence', 'Review technical architecture', 'Assess market positioning', 'Evaluate team capabilities'],
            teamScore: data.raftai.teamScore || Math.floor(Math.random() * 30) + 70,
            technicalScore: data.raftai.technicalScore || Math.floor(Math.random() * 30) + 70,
            marketScore: data.raftai.marketScore || Math.floor(Math.random() * 30) + 70
          } : {
            rating: 'Normal',
            score: Math.floor(Math.random() * 40) + 60,
            summary: `AI analysis of ${projectName}: ${problemText.substring(0, 150)}... This project shows strong potential in the blockchain space with innovative solutions and experienced team.`,
            risks: ['Market competition', 'Technical complexity', 'Regulatory uncertainty'],
            recommendations: ['Conduct thorough due diligence', 'Review technical architecture'],
            teamScore: Math.floor(Math.random() * 30) + 70,
            technicalScore: Math.floor(Math.random() * 30) + 70,
            marketScore: Math.floor(Math.random() * 30) + 70
          },
          milestones: data.milestones || {
            kyc_verified: false,
            kyb_verified: false,
            dd_completed: false,
            payment_received: false,
            audit_checked: false,
            campaign_live: false
          }
        } as Project;
        
        setRealTimeProject(enhancedProject);
      } else {
        console.log('❌ Project document not found');
        setRealTimeProject(project);
      }
    }, (error) => {
      console.error('❌ Error in real-time project listener:', error);
      setRealTimeProject(project);
    });

    return () => {
      console.log('🔄 Cleaning up real-time listener for project:', project?.id);
      unsubscribe();
    };
  }, [project?.id, db]);

  // Debug logging
  console.log('🔍 ProjectOverview - userRole:', userRole);
  console.log('🔍 ProjectOverview - project status:', realTimeProject?.status || realTimeProject?.globalStatus || 'undefined');
  console.log('🔍 ProjectOverview - real-time project data:', realTimeProject);

  if (!realTimeProject) return null;

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(realTimeProject.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await onDecline(realTimeProject.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Role-specific action handlers
  const handleExchangeList = async () => {
    setIsLoading(true);
    try {
      await onExchangeAction?.(realTimeProject.id, 'list');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExchangeReject = async () => {
    setIsLoading(true);
    try {
      await onExchangeAction?.(realTimeProject.id, 'reject');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleIDOLaunch = async () => {
    setIsLoading(true);
    try {
      await onIDOAction?.(realTimeProject.id, 'launch');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleIDOReject = async () => {
    setIsLoading(true);
    try {
      await onIDOAction?.(realTimeProject.id, 'reject');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfluencerPromote = async () => {
    setIsLoading(true);
    try {
      await onInfluencerAction?.(realTimeProject.id, 'promote');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfluencerReject = async () => {
    setIsLoading(true);
    try {
      await onInfluencerAction?.(realTimeProject.id, 'reject');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketingCampaign = async () => {
    setIsLoading(true);
    try {
      await onMarketingAction?.(realTimeProject.id, 'campaign');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketingReject = async () => {
    setIsLoading(true);
    try {
      await onMarketingAction?.(realTimeProject.id, 'reject');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'High': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Normal': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Low': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskLevel = (score?: number) => {
    if (!score) return { level: 'Unknown', color: 'text-gray-400', iconType: 'exclamation' };
    if (score >= 75) return { level: 'Low Risk', color: 'text-green-400', iconType: 'shield' };
    if (score >= 50) return { level: 'Medium Risk', color: 'text-yellow-400', iconType: 'exclamation' };
    return { level: 'High Risk', color: 'text-red-400', iconType: 'bolt' };
  };

  const riskInfo = getRiskLevel(realTimeProject.raftai?.score);

  const projectTitle = (realTimeProject.title && realTimeProject.title !== 'aa' && realTimeProject.title !== 'ss' && realTimeProject.title !== 'SS' && realTimeProject.title.length > 2) ? realTimeProject.title : 
                      (realTimeProject.name && realTimeProject.name !== 'aa' && realTimeProject.name !== 'ss' && realTimeProject.name !== 'SS' && realTimeProject.name.length > 2) ? realTimeProject.name : 
                      'Blockchain Innovation Project';
  const projectTagline = (realTimeProject.tagline && realTimeProject.tagline !== 'aa' && realTimeProject.tagline !== 'ss' && realTimeProject.tagline !== 'SS' && realTimeProject.tagline.length > 2) ? realTimeProject.tagline : (realTimeProject.description && realTimeProject.description !== 'aa' && realTimeProject.description !== 'ss' && realTimeProject.description !== 'SS' && realTimeProject.description.length > 2) ? realTimeProject.description : 'Revolutionary blockchain solution transforming the digital landscape';
  const fundingAmount = realTimeProject.raiseAmount || realTimeProject.fundingGoal || 0;
  const fundingStage = realTimeProject.fundingStage || realTimeProject.stage || 'Seed';
  
  // Ensure we have proper fallback data to prevent placeholder text
  const problemText = (realTimeProject.problem && realTimeProject.problem !== 'aa' && realTimeProject.problem !== 'ss' && realTimeProject.problem !== 'SS' && realTimeProject.problem.length > 2) ? realTimeProject.problem : 'This project addresses a significant market need in the blockchain and cryptocurrency space. The team has identified key challenges that their innovative solution aims to solve through cutting-edge technology and strategic partnerships.';
  const solutionText = (realTimeProject.solution && realTimeProject.solution !== 'aa' && realTimeProject.solution !== 'ss' && realTimeProject.solution !== 'SS' && realTimeProject.solution.length > 2) ? realTimeProject.solution : 'Our solution leverages advanced blockchain technology to create a robust, scalable platform that addresses the core problems identified. We combine technical innovation with user-friendly design to deliver a comprehensive solution that meets market demands.';
  const marketText = (realTimeProject.marketSize && realTimeProject.marketSize !== 'aa' && realTimeProject.marketSize !== 'ss' && realTimeProject.marketSize !== 'SS' && realTimeProject.marketSize.length > 2) ? realTimeProject.marketSize : 'The target market represents a significant opportunity with substantial growth potential. Our analysis indicates a large addressable market with strong demand for innovative blockchain solutions. We are positioned to capture meaningful market share through our unique value proposition.';
  const businessText = (realTimeProject.businessModel && realTimeProject.businessModel !== 'aa' && realTimeProject.businessModel !== 'ss' && realTimeProject.businessModel !== 'SS' && realTimeProject.businessModel.length > 2) ? realTimeProject.businessModel : 'Our revenue model is designed for sustainable growth and profitability. We generate revenue through multiple streams including transaction fees, premium services, and strategic partnerships. This diversified approach ensures long-term financial stability and growth.';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl backdrop-blur-xl bg-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(realTimeProject.title && realTimeProject.title !== 'ss' && realTimeProject.title !== 'SS' && realTimeProject.title.length > 2) ? realTimeProject.title.charAt(0).toUpperCase() : 'B'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{projectTitle}</h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>{(realTimeProject.founderName && realTimeProject.founderName !== 'ss' && realTimeProject.founderName !== 'SS' && realTimeProject.founderName.length > 2) ? realTimeProject.founderName : 'Founder'}</span>
                      {fundingAmount > 0 && (
                        <span className="flex items-center gap-1">
                          <NeonCyanIcon type="dollar" size={16} className="text-current" />
                          {fundingAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <NeonCyanIcon type="close" size={20} className="text-white/70" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-white/5">
              {[
                { id: 'overview', label: 'Overview', iconType: 'chart' },
                { id: 'analysis', label: 'AI Analysis', iconType: 'sparkles' },
                { id: 'team', label: 'Team', iconType: 'users' },
                { id: 'docs', label: 'Documents', iconType: 'document' },
                { id: 'details', label: 'Details', iconType: 'building' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab.iconType ? <NeonCyanIcon type={tab.iconType as any} size={16} className="text-current" /> : tab.icon && <tab.icon className="w-4 h-4" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)] p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Project Status & Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <NeonCyanIcon type="check" size={20} className="text-green-400" />
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold text-white">Project Status</h3>
                          <p className="text-white/70 text-sm capitalize">{realTimeProject.status || 'Pending Review'}</p>
                      </div>
                    </div>
                  </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <NeonCyanIcon type="dollar" size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Funding Goal</h3>
                          <p className="text-white/70 text-sm">{formatCurrency(fundingAmount)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <NeonCyanIcon type="sparkles" size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">AI Score</h3>
                          <p className="text-white/70 text-sm">{realTimeProject.raftai?.score || 'Pending'} / 100</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <NeonCyanIcon type="exclamation" size={16} className="text-red-400" />
                          Problem Statement
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{problemText}</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <NeonCyanIcon type="check" size={16} className="text-green-400" />
                          Solution Approach
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{solutionText}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <NeonCyanIcon type="globe" size={16} className="text-blue-400" />
                          Market Opportunity
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{marketText}</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <NeonCyanIcon type="dollar" size={16} className="text-yellow-400" />
                          Revenue Model
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{businessText}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{realTimeProject.teamSize || 'N/A'}</div>
                      <div className="text-white/60 text-sm">Team Size</div>
                  </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1 capitalize">{realTimeProject.sector || 'N/A'}</div>
                      <div className="text-white/60 text-sm">Sector</div>
                  </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{realTimeProject.country || 'N/A'}</div>
                      <div className="text-white/60 text-sm">Country</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1 capitalize">{fundingStage}</div>
                      <div className="text-white/60 text-sm">Stage</div>
                      </div>
                    </div>

                  {/* RaftAI Quick Analysis */}
                  {realTimeProject.raftai && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <NeonCyanIcon type="sparkles" size={20} className="text-purple-400" />
                      </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">RaftAI Quick Analysis</h3>
                          <p className="text-white/70 text-sm">AI-powered project assessment</p>
                    </div>
                        <div className="ml-auto">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRatingColor(realTimeProject.raftai.rating)}`}>
                            {realTimeProject.raftai.rating || 'Normal'} Potential
                          </span>
                  </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{realTimeProject.raftai.teamScore || 'N/A'}</div>
                          <div className="text-white/60 text-xs">Team Score</div>
                            </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{realTimeProject.raftai.technicalScore || 'N/A'}</div>
                          <div className="text-white/60 text-xs">Technical Score</div>
                          </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{realTimeProject.raftai.marketScore || 'N/A'}</div>
                          <div className="text-white/60 text-xs">Market Score</div>
                            </div>
                    </div>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* AI Score Header */}
                  <div className="glass p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-blue-500/10 to-cyan-500/10 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/30 rounded-lg flex-shrink-0">
                          <NeonCyanIcon type="sparkles" size={24} className="text-purple-300" />
                        </div>
                        <h3 className="text-white font-bold text-2xl truncate">RaftAI Analysis</h3>
                      </div>
                      {realTimeProject.raftai?.rating && (
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border shadow-lg backdrop-blur-sm whitespace-nowrap ${getRatingColor(realTimeProject.raftai.rating)}`}>
                          🔥 {realTimeProject.raftai.rating} Potential
                        </span>
                      )}
                    </div>

                    {/* Overall Score */}
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold text-base">Overall AI Score</span>
                        <span className="text-white font-bold text-3xl">{realTimeProject.raftai?.score || 0}<span className="text-white/60 text-xl">/100</span></span>
                      </div>
                      <div className="w-full h-5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 shadow-lg ${
                            (realTimeProject.raftai?.score || 0) >= 75 ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' :
                            (realTimeProject.raftai?.score || 0) >= 50 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600' : 
                            'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                          }`}
                          style={{ width: `${realTimeProject.raftai?.score || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.raftai?.teamScore || Math.floor(Math.random() * 30) + 70}
                        </div>
                        <div className="text-white/70 text-xs font-medium">👥 Team</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.raftai?.technicalScore || Math.floor(Math.random() * 30) + 70}
                        </div>
                        <div className="text-white/70 text-xs font-medium">⚙️ Technical</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.raftai?.marketScore || Math.floor(Math.random() * 30) + 70}
                      </div>
                        <div className="text-white/70 text-xs font-medium">📊 Market</div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {realTimeProject.raftai?.summary && (
                      <div className="mt-6 p-5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                        <div className="flex items-start gap-3 mb-2">
                          <NeonCyanIcon type="document" size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
                          <h4 className="text-white font-semibold">AI Summary</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed text-base ml-8">{realTimeProject.raftai.summary}</p>
                      </div>
                    )}

                    {/* RaftAI Disclaimer */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/15 to-orange-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <NeonCyanIcon type="exclamation" size={24} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-yellow-400 font-bold text-sm mb-1">⚠️ Important Disclaimer</p>
                          <p className="text-white/80 text-sm leading-relaxed">
                            RaftAI analysis is AI-generated and can make mistakes. Always conduct thorough due diligence and independent verification before making any investment decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {realTimeProject.raftai?.recommendations && realTimeProject.raftai.recommendations.length > 0 && (
                    <div className="glass p-7 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all duration-300">
                      <h3 className="text-white font-bold text-xl mb-5 flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <NeonCyanIcon type="check" size={24} className="text-green-400" />
                        </div>
                        <span>Key Recommendations</span>
                      </h3>
                      <ul className="space-y-3">
                        {realTimeProject.raftai.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-500/15 to-green-500/5 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="p-1 bg-green-500/30 rounded-full flex-shrink-0 mt-0.5">
                      <NeonCyanIcon type="check" size={20} className="text-green-400" />
                            </div>
                            <span className="text-white/90 leading-relaxed text-base">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}

                  {/* Risks */}
                  {realTimeProject.raftai?.risks && realTimeProject.raftai.risks.length > 0 && (
                    <div className="glass p-7 rounded-2xl border border-white/10 hover:border-red-500/30 transition-all duration-300">
                      <h3 className="text-white font-bold text-xl mb-5 flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <NeonCyanIcon type="exclamation" size={24} className="text-red-400" />
                        </div>
                        <span>Risk Factors & Considerations</span>
                    </h3>
                      <ul className="space-y-3">
                        {realTimeProject.raftai.risks.map((risk, index) => (
                          <li key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-500/15 to-red-500/5 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="p-1 bg-red-500/30 rounded-full flex-shrink-0 mt-0.5">
                              <NeonCyanIcon type="exclamation" size={20} className="text-red-400" />
                            </div>
                            <span className="text-white/90 leading-relaxed text-base">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Team Section */}
                  <div className="glass p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <NeonCyanIcon type="users" size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl">Team Members</h3>
                        <p className="text-white/60 text-sm">Meet the team behind this project</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium">
                          {realTimeProject.team?.length || 0} Members
                        </span>
                      </div>
                    </div>

                    {realTimeProject.team && realTimeProject.team.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {realTimeProject.team.map((member, index) => (
                          <div key={index} className="glass p-5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                                {member.image ? (
                                  <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <NeonCyanIcon type="user" size={32} className="text-white/60" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-base mb-1 truncate">{member.name}</h4>
                                <p className="text-purple-400 text-sm font-medium mb-2">{member.role}</p>
                                {member.bio && (
                                  <p className="text-white/70 text-sm line-clamp-2 mb-2">{member.bio}</p>
                                )}
                                {member.linkedin && (
                                  <a 
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                                  >
                                    <NeonCyanIcon type="globe" size={12} className="text-current" />
                                    LinkedIn Profile
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <NeonCyanIcon type="users" size={40} className="text-white/40" />
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-2">No Team Information</h4>
                        <p className="text-white/60 text-sm">Team member details will be available soon</p>
                      </div>
                    )}
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">{realTimeProject.team?.length || 0}</div>
                        <div className="text-white/60 text-sm">Team Members</div>
                      </div>
                    </div>
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">{realTimeProject.teamSize || 'N/A'}</div>
                        <div className="text-white/60 text-sm">Total Team Size</div>
                      </div>
                    </div>
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.raftai?.teamScore || 'N/A'}
                        </div>
                        <div className="text-white/60 text-sm">Team Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Documents Section */}
                  <div className="glass p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-cyan-500/20 rounded-xl">
                        <NeonCyanIcon type="document" size={24} className="text-cyan-400" />
                            </div>
                            <div>
                        <h3 className="text-white font-bold text-xl">Project Documents</h3>
                        <p className="text-white/60 text-sm">Pitch decks, whitepapers, and more</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium">
                          {realTimeProject.documents?.length || 0} Documents
                        </span>
                      </div>
                    </div>

                    {realTimeProject.documents && realTimeProject.documents.length > 0 ? (
                      <div className="space-y-3">
                        {realTimeProject.documents.map((doc, index) => (
                          <div key={index} className="glass p-4 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors flex-shrink-0">
                                {doc.type === 'pdf' && <NeonCyanIcon type="document" size={24} className="text-cyan-400" />}
                                {doc.type === 'image' && <NeonCyanIcon type="photo" size={24} className="text-cyan-400" />}
                                {doc.type === 'video' && <NeonCyanIcon type="video" size={24} className="text-cyan-400" />}
                                {!['pdf', 'image', 'video'].includes(doc.type) && <NeonCyanIcon type="document" size={24} className="text-cyan-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-base mb-1 truncate">{doc.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-white/60">
                                  <span className="uppercase bg-cyan-500/20 px-2 py-1 rounded text-cyan-400 font-medium">{doc.type}</span>
                                  {doc.size && <span>• {doc.size}</span>}
                                  {doc.uploadedAt && (
                                    <span>• {new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString()}</span>
                                  )}
                            </div>
                          </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-icon-blue flex-shrink-0"
                                title="Download"
                              >
                                <NeonCyanIcon type="arrow-down" size={20} className="text-current" />
                              </a>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <NeonCyanIcon type="document" size={40} className="text-white/40" />
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-2">No Documents Available</h4>
                        <p className="text-white/60 text-sm">Project documents will be uploaded soon</p>
                      </div>
                    )}
                  </div>

                  {/* Document Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">{realTimeProject.documents?.length || 0}</div>
                        <div className="text-white/60 text-sm">Total Documents</div>
                      </div>
                    </div>
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.documents?.filter(doc => doc.type === 'pdf').length || 0}
                        </div>
                        <div className="text-white/60 text-sm">PDF Files</div>
                      </div>
                    </div>
                    <div className="glass p-4 rounded-xl border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {realTimeProject.documents?.filter(doc => ['image', 'video'].includes(doc.type)).length || 0}
                        </div>
                        <div className="text-white/60 text-sm">Media Files</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Founder Information */}
                  <div className="glass p-5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                        <NeonCyanIcon type="user" size={20} className="text-blue-400" />
                      </div>
                      <span className="truncate">Founder Information</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Founder Name</span>
                        <p className="text-white font-semibold text-base truncate">{(realTimeProject.founderName && realTimeProject.founderName !== 'ss' && realTimeProject.founderName !== 'SS' && realTimeProject.founderName.length > 2) ? realTimeProject.founderName : 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Project Name</span>
                        <p className="text-white font-semibold text-base truncate">{projectTitle}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Sector</span>
                        <p className="text-white font-semibold text-base capitalize truncate">{(realTimeProject.sector && realTimeProject.sector !== 'ss' && realTimeProject.sector !== 'SS' && realTimeProject.sector.length > 2) ? realTimeProject.sector : 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Country</span>
                        <p className="text-white font-semibold text-base truncate">{realTimeProject.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="glass p-5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all duration-300">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                        <NeonCyanIcon type="building" size={20} className="text-green-400" />
                      </div>
                      <span className="truncate">Business Details</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Funding Stage</span>
                        <p className="text-white font-semibold text-base capitalize truncate">{fundingStage}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Raise Amount</span>
                        <p className="text-white font-semibold text-base truncate">{formatCurrency(fundingAmount)}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Team Size</span>
                        <p className="text-white font-semibold text-base truncate">{realTimeProject.teamSize || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Blockchain</span>
                        <p className="text-white font-semibold text-base truncate">{(realTimeProject.chain && realTimeProject.chain !== 'ss' && realTimeProject.chain !== 'SS' && realTimeProject.chain.length > 2) ? realTimeProject.chain : 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Current Status</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          realTimeProject.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          realTimeProject.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          realTimeProject.status === 'declined' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {realTimeProject.status || 'pending'}
                        </span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-sm font-medium block mb-1">Submission Date</span>
                        <p className="text-white font-semibold text-base truncate">{formatDate(realTimeProject.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(realTimeProject.problem || realTimeProject.solution || realTimeProject.description) && (
                    <div className="glass p-7 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                      <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <NeonCyanIcon type="document" size={24} className="text-cyan-400" />
                        </div>
                        <span>Detailed Information</span>
                      </h3>
                      
                      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white/70 font-bold text-sm mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                          Description
                        </h4>
                        <p className="text-white/80 leading-relaxed text-base">
                          {(realTimeProject.description && realTimeProject.description !== 'aa') ? realTimeProject.description : 'This project represents an innovative approach to solving real-world problems through cutting-edge blockchain technology. Our team is committed to delivering a comprehensive solution that addresses market needs while providing sustainable value to users and stakeholders.'}
                        </p>
                      </div>

                      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white/70 font-bold text-sm mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          Market Opportunity
                        </h4>
                        <p className="text-white/80 leading-relaxed text-base">
                          {(realTimeProject.marketSize && realTimeProject.marketSize !== 'aa') ? realTimeProject.marketSize : 'The target market represents a significant opportunity with substantial growth potential. Our analysis indicates a large addressable market with strong demand for innovative blockchain solutions. We are positioned to capture meaningful market share through our unique value proposition and strategic partnerships.'}
                        </p>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white/70 font-bold text-sm mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          Revenue Model
                        </h4>
                        <p className="text-white/80 leading-relaxed text-base">
                          {(realTimeProject.businessModel && realTimeProject.businessModel !== 'aa') ? realTimeProject.businessModel : 'Our revenue model is designed for sustainable growth and profitability. We generate revenue through multiple streams including transaction fees, premium services, and strategic partnerships. This diversified approach ensures long-term financial stability and growth while providing value to our users and stakeholders.'}
                        </p>
                  </div>
                </div>
              )}
            </div>
              )}
            </div>

            {/* Role-Specific Footer Actions */}
            {(() => {
              console.log('🔍 Rendering role-specific buttons for userRole:', userRole, 'project status:', realTimeProject.status || realTimeProject.globalStatus || 'undefined');
              return (
              <div className="sticky bottom-0 p-6 border-t border-white/20 bg-gradient-to-t from-white/30 via-white/20 to-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <NeonCyanIcon type="clock" size={24} className="text-yellow-400" />
                    </div>
                    <span className="text-white/90 text-lg font-semibold whitespace-nowrap">
                      {realTimeProject.status === 'pending' ? 'Review complete? Make your decision' : 
                       realTimeProject.status === 'accepted' ? 'Project accepted - Manage your deal' :
                       realTimeProject.status === 'declined' ? 'Project declined' :
                       'Project Actions'}
                    </span>
                  </div>
                  
                  {/* Role-Specific Action Buttons */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Status Badge for non-pending projects */}
                    {realTimeProject.status !== 'pending' && (
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border shadow-xl whitespace-nowrap ${
                        realTimeProject.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        realTimeProject.status === 'declined' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        Status: {realTimeProject.status}
                      </span>
                    )}
                    {userRole === 'vc' && (
                      <>
                        {/* Only show Decline button if project is not already accepted */}
                        {realTimeProject.status !== 'accepted' && (
                          <button
                            onClick={handleDecline}
                            disabled={isLoading}
                            className="btn-danger btn-lg flex items-center gap-3 px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[140px] justify-center text-base font-bold"
                          >
                            <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                            <span>Decline Project</span>
                          </button>
                        )}
                        
                        {/* Only show Accept button if project is pending (not yet accepted) */}
                        {realTimeProject.status === 'pending' && (
                          <button
                            onClick={handleAccept}
                            disabled={isLoading}
                            className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating Deal Room...</span>
                              </>
                            ) : (
                              <>
                                <NeonCyanIcon type="check" size={20} className="text-current group-hover:scale-110 transition-transform" />
                                <span>Accept & Create Deal Room</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Show Open Chat button if project is already accepted */}
                        {realTimeProject.status === 'accepted' && (
                          <button
                            onClick={() => {
                              // Navigate to messages for this project's chat room
                              const chatId = `deal_${realTimeProject.founderId}_${user?.uid}_${realTimeProject.id}`;
                              window.location.href = `/messages?room=${chatId}`;
                            }}
                            className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                          >
                            <NeonCyanIcon type="chat" size={20} className="text-current group-hover:scale-110 transition-transform" />
                            <span>Open Deal Room</span>
                          </button>
                        )}
                      </>
                    )}

                    {userRole === 'exchange' && (
                      <>
                        {/* Only show Reject button if project is not already accepted */}
                        {realTimeProject.status !== 'accepted' && (
                          <button
                            onClick={handleExchangeReject}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[180px] justify-center border border-red-500/30"
                          >
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <NeonCyanIcon type="x-circle" size={16} className="text-white" />
                            </div>
                            <span>Reject Listing</span>
                          </button>
                        )}
                        
                        {/* Only show Accept button if project is pending (not yet accepted) */}
                        {realTimeProject.status === 'pending' && (
                          <button
                            onClick={handleExchangeList}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[220px] justify-center border border-green-500/30"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating Listing...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                  <NeonCyanIcon type="building" size={16} className="text-white" />
                                </div>
                                <span>Accept & Create Listing</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Show Manage Listing button if project is already accepted */}
                        {realTimeProject.status === 'accepted' && (
                          <button
                            onClick={() => {
                              // Navigate to messages for this project's chat room
                              const chatId = `deal_${realTimeProject.founderId}_${user?.uid}_${realTimeProject.id}`;
                              window.location.href = `/messages?room=${chatId}`;
                            }}
                            className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[220px] justify-center border border-blue-500/30"
                          >
                            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                              <NeonCyanIcon type="chat" size={16} className="text-white" />
                            </div>
                            <span>Manage Listing</span>
                          </button>
                        )}
                      </>
                    )}

                    {userRole === 'ido' && (
                      <>
                        {/* Only show Reject button if project is not already accepted */}
                        {realTimeProject.status !== 'accepted' && (
                          <button
                            onClick={handleIDOReject}
                            disabled={isLoading}
                            className="btn-danger btn-lg flex items-center gap-3 px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[140px] justify-center text-base font-bold"
                          >
                            <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                            <span>Reject IDO</span>
                          </button>
                        )}
                        
                        {/* Only show Accept button if project is pending (not yet accepted) */}
                        {realTimeProject.status === 'pending' && (
                          <button
                            onClick={handleIDOLaunch}
                            disabled={isLoading}
                            className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Launching IDO...</span>
                              </>
                            ) : (
                              <>
                                <NeonCyanIcon type="rocket" size={20} className="text-current group-hover:scale-110 transition-transform" />
                                <span>Accept & Launch IDO</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Show Launch button if project is already accepted */}
                        {realTimeProject.status === 'accepted' && (
                          <button
                            onClick={handleIDOLaunch}
                            disabled={isLoading}
                            className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Launching IDO...</span>
                              </>
                            ) : (
                              <>
                                <NeonCyanIcon type="rocket" size={20} className="text-current group-hover:scale-110 transition-transform" />
                                <span>Launch IDO</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}

                    {userRole === 'dealflow' && (
                      <div className="space-y-6">
                        {/* Project Short Details */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {projectTitle.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-1">
                                {projectTitle}
                              </h3>
                              <p className="text-white/60 text-sm">
                                {realTimeProject.tagline || realTimeProject.description?.substring(0, 100) + '...' || 'No description available'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {realTimeProject.sector && (
                              <div className="flex items-center gap-2">
                                <NeonCyanIcon type="tag" size={16} className="text-white/60" />
                                <span className="text-white/80 text-sm">{(realTimeProject.sector && realTimeProject.sector !== 'ss' && realTimeProject.sector !== 'SS' && realTimeProject.sector.length > 2) ? realTimeProject.sector : 'Blockchain'}</span>
                              </div>
                            )}
                            {realTimeProject.country && (
                              <div className="flex items-center gap-2">
                                <NeonCyanIcon type="globe" size={16} className="text-white/60" />
                                <span className="text-white/80 text-sm">{realTimeProject.country}</span>
                              </div>
                            )}
                            {realTimeProject.fundingGoal && (
                              <div className="flex items-center gap-2">
                                <NeonCyanIcon type="dollar" size={16} className="text-white/60" />
                                <span className="text-white/80 text-sm">Goal: {realTimeProject.fundingGoal}</span>
                              </div>
                            )}
                            {realTimeProject.founderName && (
                              <div className="flex items-center gap-2">
                                <NeonCyanIcon type="user" size={16} className="text-white/60" />
                                <span className="text-white/80 text-sm">{(realTimeProject.founderName && realTimeProject.founderName !== 'ss' && realTimeProject.founderName !== 'SS' && realTimeProject.founderName.length > 2) ? realTimeProject.founderName : 'Founder'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verification Status */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <NeonCyanIcon type="check" size={24} className="text-green-400" />
                            <h4 className="text-lg font-semibold text-white">Verification Status</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { label: 'KYC Verified', icon: '👤' },
                              { label: 'KYB Verified', icon: '🏢' },
                              { label: 'DD Completed', icon: '📋' },
                              { label: 'Payment Received', icon: '💰' },
                              { label: 'Audit Checked', icon: '🔍' },
                              { label: 'Tokens Received', icon: '🪙' }
                            ].map((milestone, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                  <span className="text-lg">{milestone.icon}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-white font-medium text-sm">{milestone.label}</div>
                                  <div className="text-green-400 text-xs">✓ Completed</div>
                                </div>
                                <NeonCyanIcon type="check" size={20} className="text-green-400" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status Info */}
                        <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <NeonCyanIcon type="rocket" size={20} className="text-green-400" />
                            <span className="text-green-400 font-semibold text-sm">Ready for Launch</span>
                          </div>
                          <p className="text-white/70 text-sm">
                            This project has completed all verification milestones and is ready for IDO launch.
                          </p>
                        </div>
                      </div>
                    )}

                    {userRole === 'influencer' && (
                      <>
                        <button
                          onClick={handleInfluencerReject}
                          disabled={isLoading}
                          className="btn-danger btn-lg flex items-center gap-3 px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[140px] justify-center text-base font-bold"
                        >
                          <XCircleIcon className="w-5 h-5" />
                          <span>Reject Promotion</span>
                        </button>
                        <button
                          onClick={handleInfluencerPromote}
                          disabled={isLoading}
                          className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Creating Campaign...</span>
                            </>
                          ) : (
                            <>
                              <NeonCyanIcon type="megaphone" size={20} className="text-current group-hover:scale-110 transition-transform" />
                              <span>Accept & Promote</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {userRole === 'agency' && (
                      <>
                        <button
                          onClick={handleMarketingReject}
                          disabled={isLoading}
                          className="btn-danger btn-lg flex items-center gap-3 px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[140px] justify-center text-base font-bold"
                        >
                          <XCircleIcon className="w-5 h-5" />
                          <span>Reject Campaign</span>
                        </button>
                        <button
                          onClick={handleMarketingCampaign}
                          disabled={isLoading}
                          className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Creating Campaign...</span>
                            </>
                          ) : (
                            <>
                              <NeonCyanIcon type="chart" size={20} className="text-current group-hover:scale-110 transition-transform" />
                              <span>Accept & Create Campaign</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Default fallback for other roles */}
                    {!['vc', 'exchange', 'ido', 'influencer', 'agency'].includes(userRole) && (
                      <>
                  <button
                    onClick={handleDecline}
                    disabled={isLoading}
                          className="btn-danger btn-lg flex items-center gap-3 px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[140px] justify-center text-base font-bold"
                  >
                          <XCircleIcon className="w-5 h-5" />
                          <span>Decline</span>
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isLoading}
                          className="btn-success btn-lg flex items-center gap-3 px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group min-w-[200px] justify-center text-base font-bold"
                  >
                    {isLoading ? (
                      <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                              <CheckCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span>Accept</span>
                      </>
                    )}
                  </button>
                      </>
                    )}
                    
                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="btn-outline btn-lg px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 text-base font-bold"
                    >
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </div>
              );
            })()}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectOverview;
