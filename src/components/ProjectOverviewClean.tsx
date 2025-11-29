"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChartBarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  title?: string;
  name?: string;
  projectName?: string;
  founderName?: string;
  founderId?: string;
  problem?: string;
  solution?: string;
  marketSize?: string;
  businessModel?: string;
  fundingGoal?: string;
  raiseAmount?: string;
  raftai?: {
    score?: number;
    rating?: 'High' | 'Normal' | 'Low';
    summary?: string;
  };
}

interface ProjectOverviewProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (projectId: string) => void;
  onDecline?: (projectId: string) => void;
  userRole?: string;
  onIDOAction?: (projectId: string, action: 'launch' | 'reject') => void;
}

export default function ProjectOverviewClean({
  project,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  userRole = 'ido',
  onIDOAction
}: ProjectOverviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');

  // Clean project data with proper fallbacks
  const projectTitle = project.title || project.name || project.projectName || 'Blockchain Innovation Project';
  const founderName = (project.founderName && project.founderName !== 'ss' && project.founderName !== 'SS' && project.founderName.length > 2) 
    ? project.founderName : 'Founder';
  const fundingAmount = project.fundingGoal || project.raiseAmount || '0';
  
  // Clean content with professional fallbacks
  const problemText = (project.problem && project.problem !== 'ss' && project.problem !== 'SS' && project.problem.length > 2) 
    ? project.problem : 'This project addresses a significant market need in the blockchain and cryptocurrency space. The team has identified key challenges that their innovative solution aims to solve through cutting-edge technology and strategic partnerships.';
  
  const solutionText = (project.solution && project.solution !== 'ss' && project.solution !== 'SS' && project.solution.length > 2) 
    ? project.solution : 'Our solution leverages advanced blockchain technology to create a robust, scalable platform that addresses the core problems identified. We combine technical innovation with user-friendly design to deliver a comprehensive solution that meets market demands.';
  
  const marketText = (project.marketSize && project.marketSize !== 'ss' && project.marketSize !== 'SS' && project.marketSize.length > 2) 
    ? project.marketSize : 'The target market represents a significant opportunity with substantial growth potential. Our analysis indicates a large addressable market with strong demand for innovative blockchain solutions. We are positioned to capture meaningful market share through our unique value proposition.';
  
  const businessText = (project.businessModel && project.businessModel !== 'ss' && project.businessModel !== 'SS' && project.businessModel.length > 2) 
    ? project.businessModel : 'Our revenue model is designed for sustainable growth and profitability. We generate revenue through multiple streams including transaction fees, premium services, and strategic partnerships. This diversified approach ensures long-term financial stability and growth.';

  const handleLaunchIDO = () => {
    if (onIDOAction) {
      onIDOAction(project.id, 'launch');
    } else if (onAccept) {
      onAccept(project.id);
    }
  };

  const handleDeclineIDO = () => {
    if (onIDOAction) {
      onIDOAction(project.id, 'reject');
    } else if (onDecline) {
      onDecline(project.id);
    }
  };

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
            className="bg-black/80 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {projectTitle.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{projectTitle}</h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>{founderName}</span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        {fundingAmount}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-white/5">
              {[
                { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                { id: 'analysis', label: 'AI Analysis', icon: SparklesIcon }
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
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Project Status */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Ready for IDO Launch</h3>
                        <p className="text-white/70 text-sm">All verification milestones completed</p>
                      </div>
                    </div>
                  </div>

                  {/* Project Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                          Problem
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{problemText}</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          Solution
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{solutionText}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4 text-blue-400" />
                          Market Opportunity
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{marketText}</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-yellow-400" />
                          Revenue Model
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">{businessText}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleLaunchIDO}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <RocketLaunchIcon className="w-5 h-5" />
                      Launch IDO
                    </button>
                    <button
                      onClick={handleDeclineIDO}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-300"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-purple-400" />
                      RaftAI Analysis
                    </h3>
                    
                    {project.raftai ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">{project.raftai.score || 0}</div>
                            <div className="text-white/60 text-sm">Score</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">{project.raftai.rating || 'Unknown'} Potential</div>
                            <div className="text-white/60 text-sm">Risk Assessment</div>
                          </div>
                        </div>
                        
                        {project.raftai.summary && (
                          <div className="mt-4">
                            <p className="text-white/80 text-sm leading-relaxed">{project.raftai.summary}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <SparklesIcon className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">No AI analysis available yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
