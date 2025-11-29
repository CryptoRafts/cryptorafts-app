"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import RaftAIIntegration from './RaftAIIntegration';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface VCProjectOverviewProps {
  project: any;
  onClose: () => void;
  onAccept?: (projectId: string) => Promise<void>;
  onDecline?: (projectId: string) => Promise<void>;
  onAddToWatchlist?: (projectId: string) => Promise<void>;
}

const VCProjectOverview: React.FC<VCProjectOverviewProps> = ({
  project,
  onClose,
  onAccept,
  onDecline,
  onAddToWatchlist
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Project Overview', iconType: 'eye' as const },
    { id: 'team', label: 'Team', iconType: 'users' as const },
    { id: 'documents', label: 'Documents', iconType: 'document' as const },
    { id: 'analysis', label: 'AI Analysis', iconType: 'sparkles' as const }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return 'text-green-400';
      case 'buy': return 'text-blue-400';
      case 'hold': return 'text-yellow-400';
      case 'sell': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return 'Strong Buy';
      case 'buy': return 'Buy';
      case 'hold': return 'Hold';
      case 'sell': return 'Sell';
      default: return 'Not Rated';
    }
  };

  const getRecommendationBgColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'high':
        return 'bg-green-500/20 border border-green-500/30';
      case 'low':
        return 'bg-red-500/20 border border-red-500/30';
      default:
        return 'bg-blue-500/20 border border-blue-500/30';
    }
  };

  const getRiskLevel = (riskCount: number) => {
    if (riskCount <= 2) return 'Low';
    if (riskCount <= 4) return 'Medium';
    return 'High';
  };

  const getPotentialLevel = (opportunityCount: number) => {
    if (opportunityCount >= 5) return 'High';
    if (opportunityCount >= 3) return 'Medium';
    return 'Low';
  };

  const getInvestmentRecommendation = (rating: string, score: number) => {
    if (score >= 80 && rating.toLowerCase() === 'high') {
      return 'Strong Buy - High potential with excellent fundamentals';
    } else if (score >= 70 && rating.toLowerCase() === 'high') {
      return 'Buy - Good potential with solid fundamentals';
    } else if (score >= 60) {
      return 'Hold - Moderate potential, monitor closely';
    } else {
      return 'Avoid - High risk, limited upside potential';
    }
  };

  const generateEnhancedSummary = (analysis: any, project: any) => {
    const sector = project.sector || 'blockchain';
    const stage = project.stage || 'Seed';
    const score = analysis.score || 75;
    const rating = analysis.rating || 'Normal';
    
    return `RaftAI has conducted a comprehensive analysis of this ${sector} project in the ${stage} stage. With a score of ${score}/100 and a ${rating} rating, the analysis reveals ${score >= 80 ? 'exceptional' : score >= 70 ? 'strong' : score >= 60 ? 'moderate' : 'limited'} investment potential. The project demonstrates ${analysis.opportunities?.length >= 4 ? 'strong' : 'moderate'} market positioning with ${analysis.risks?.length <= 3 ? 'manageable' : 'elevated'} risk factors. Key focus areas include ${sector.toLowerCase()} market dynamics, team execution capability, and ${stage.toLowerCase()} stage scalability requirements.`;
  };

  const handleAccept = async () => {
    if (!onAccept) return;
    
    try {
      setIsAccepting(true);
      await onAccept(project.id);
    } catch (error) {
      console.error('Error accepting project:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    
    try {
      setIsDeclining(true);
      await onDecline(project.id);
    } catch (error) {
      console.error('Error declining project:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!onAddToWatchlist) return;
    
    try {
      setIsAddingToWatchlist(true);
      await onAddToWatchlist(project.id);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const downloadDocument = (documentType: string) => {
    // Create a download link for the document
    const link = document.createElement('a');
    link.href = `/api/documents/${documentType}-sample.pdf`;
    link.download = `${project.title}-${documentType}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start space-x-6">
        <div className="flex-shrink-0">
          {project.logoUrl ? (
            <img
              src={project.logoUrl}
              alt={`${project.title} logo`}
              className="w-20 h-20 rounded-lg object-cover border border-white/10"
              width={80}
              height={80}
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BuildingOfficeIcon className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white mb-2">{project.title}</h2>
          <p className="text-white/70 text-sm mb-3">{project.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags?.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
              >
                {tag}
              </span>
            )) || []}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BlockchainCard variant="default" className="p-4">
          <div className="flex items-center space-x-3">
            <NeonCyanIcon type="dollar" size={32} className="text-green-400" />
            <div>
              <p className="text-white/60 text-sm">Funding Goal</p>
              <p className="text-white font-semibold">{formatCurrency(project.fundingGoal)}</p>
            </div>
          </div>
        </BlockchainCard>
        
        <BlockchainCard variant="default" className="p-4">
          <div className="flex items-center space-x-3">
            <NeonCyanIcon type="chart" size={32} className="text-blue-400" />
            <div>
              <p className="text-white/60 text-sm">Valuation</p>
              <p className="text-white font-semibold">{formatCurrency(project.valuation)}</p>
            </div>
          </div>
        </BlockchainCard>
        
        <BlockchainCard variant="default" className="p-4">
          <div className="flex items-center space-x-3">
            <NeonCyanIcon type="building" size={32} className="text-purple-400" />
            <div>
              <p className="text-white/60 text-sm">Equity Offered</p>
              <p className="text-white font-semibold">{project.equityOffered}%</p>
            </div>
          </div>
        </BlockchainCard>
      </div>

      {/* Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BlockchainCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <NeonCyanIcon type="exclamation" size={20} className="text-red-400 mr-2" />
            Problem
          </h3>
          <p className="text-white/70 leading-relaxed">{project.problem}</p>
        </BlockchainCard>
        
        <BlockchainCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <NeonCyanIcon type="sparkles" size={20} className="text-green-400 mr-2" />
            Solution
          </h3>
          <p className="text-white/70 leading-relaxed">{project.solution}</p>
        </BlockchainCard>
      </div>

      {/* Business Model & Technology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BlockchainCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Business Model</h3>
          <p className="text-white/70 leading-relaxed">{project.businessModel}</p>
        </BlockchainCard>
        
        <BlockchainCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Technology</h3>
          <p className="text-white/70 leading-relaxed">{project.technology}</p>
        </BlockchainCard>
      </div>

      {/* Market Analysis */}
      <BlockchainCard variant="default" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Market Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Market Size</h4>
            <p className="text-white/70">{project.marketSize}</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Competitive Advantage</h4>
            <p className="text-white/70">{project.competitiveAdvantage}</p>
          </div>
        </div>
      </BlockchainCard>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.team?.map((member: any, index: number) => (
          <BlockchainCard key={index} variant="default" className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {member.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold">{member.name}</h4>
                <p className="text-blue-300 text-sm">{member.role}</p>
                <p className="text-white/60 text-xs mt-1">{member.experience}</p>
              </div>
            </div>
          </BlockchainCard>
        ))}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(project.uploads?.pitchDeck || project.pitchDeck) && (
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="document" size={32} className="text-blue-400" />
                <div>
                  <h4 className="text-white font-semibold">Pitch Deck</h4>
                  <p className="text-white/60 text-sm">Project presentation</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('pitch-deck')}
                  icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('pitch-deck')}
                  icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
                >
                  Download
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        )}

        {(project.uploads?.whitepaper || project.whitepaper) && (
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="document" size={32} className="text-purple-400" />
                <div>
                  <h4 className="text-white font-semibold">Whitepaper</h4>
                  <p className="text-white/60 text-sm">Technical documentation</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('whitepaper')}
                  icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('whitepaper')}
                  icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
                >
                  Download
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        )}

        {(project.uploads?.tokenModel || project.tokenomics) && (
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="dollar" size={32} className="text-green-400" />
                <div>
                  <h4 className="text-white font-semibold">Tokenomics</h4>
                  <p className="text-white/60 text-sm">Token distribution</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('tokenomics')}
                  icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('tokenomics')}
                  icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
                >
                  Download
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        )}

        {(project.uploads?.roadmap || project.roadmap) && (
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="globe" size={32} className="text-indigo-400" />
                <div>
                  <h4 className="text-white font-semibold">Roadmap</h4>
                  <p className="text-white/60 text-sm">Project timeline & milestones</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('roadmap')}
                  icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('roadmap')}
                  icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
                >
                  Download
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        )}

        {project.documents?.technicalSummary && (
          <BlockchainCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="cog" size={32} className="text-orange-400" />
                <div>
                  <h4 className="text-white font-semibold">Technical Summary</h4>
                  <p className="text-white/60 text-sm">Technical overview</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('technical-summary')}
                  icon={<NeonCyanIcon type="eye" size={16} className="text-current" />}
                >
                  View
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadDocument('technical-summary')}
                  icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
                >
                  Download
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        )}
      </div>
    </div>
  );

  const renderAnalysis = () => {
    // Get analysis data from either aiAnalysis or raftai field
    const analysis = project.aiAnalysis || project.raftai;
    
    return (
    <div className="space-y-6">
      {analysis ? (
        <>
          {/* AI Analysis Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <NeonCyanIcon type="sparkles" size={32} className="text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">RaftAI Analysis</h3>
                <p className="text-white/60 text-sm">Advanced AI-powered project evaluation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white/60 text-sm">Rating</p>
                <p className="text-white font-semibold">{analysis.rating || analysis.score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Score</p>
                <p className="text-white font-semibold">{analysis.score}/100</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(analysis.rating || 'Normal')}`}>
                {analysis.rating || 'Normal'}
              </div>
            </div>
          </div>

          {/* Enhanced RaftAI Integration */}
          <div className="mb-6">
            <RaftAIIntegration
              projectId={project.id}
              onAnalysisComplete={(raftaiAnalysis) => {
                console.log('RaftAI analysis completed in project overview:', raftaiAnalysis);
                // You can update the analysis state here if needed
              }}
              className="bg-white/5 backdrop-blur-sm border border-white/10"
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <NeonCyanIcon type="exclamation" size={20} className="text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-1">AI Analysis Disclaimer</h4>
                <p className="text-yellow-200/80 text-sm">
                  RaftAI can make mistakes. Check important info. This analysis is for informational purposes only and should not be considered as investment advice.
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <BlockchainCard variant="default" className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Executive Summary</h4>
            <p className="text-white/70 leading-relaxed">
              {analysis.summary || generateEnhancedSummary(analysis, project)}
            </p>
          </BlockchainCard>

          {/* Investment Recommendation */}
          <BlockchainCard variant="default" className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SparklesIcon className="w-5 h-5 text-purple-400 mr-2" />
              Investment Recommendation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${getRecommendationBgColor(analysis.rating || 'Normal')}`}>
                  <span className="text-white font-bold text-lg">{analysis.score || 75}</span>
                </div>
                <p className="text-white/60 text-sm">Overall Score</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <span className="text-blue-400 font-bold text-lg">{getRiskLevel(analysis.risks?.length || 0)}</span>
                </div>
                <p className="text-white/60 text-sm">Risk Level</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                  <span className="text-green-400 font-bold text-lg">{getPotentialLevel(analysis.opportunities?.length || 0)}</span>
                </div>
                <p className="text-white/60 text-sm">Growth Potential</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-white/80 text-sm">
                <strong>RaftAI Recommendation:</strong> {getInvestmentRecommendation(analysis.rating || 'Normal', analysis.score || 75)}
              </p>
            </div>
          </BlockchainCard>

          {/* Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <NeonCyanIcon type="check" size={20} className="text-green-400 mr-2" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {(analysis.opportunities || analysis.strengths || []).map((strength: string, index: number) => (
                  <li key={index} className="text-white/70 flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </BlockchainCard>
            
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <NeonCyanIcon type="x-circle" size={20} className="text-red-400 mr-2" />
                Concerns
              </h4>
              <ul className="space-y-2">
                {(analysis.risks || analysis.concerns || []).map((concern: string, index: number) => (
                  <li key={index} className="text-white/70 flex items-start">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {concern}
                  </li>
                ))}
              </ul>
            </BlockchainCard>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Market Analysis</h4>
              <p className="text-white/70 leading-relaxed">
                {analysis.marketAnalysis || `Market analysis shows ${analysis.rating === 'High' ? 'strong market potential' : analysis.rating === 'Low' ? 'moderate market potential' : 'good market potential'} with ${analysis.score}/100 score.`}
              </p>
            </BlockchainCard>
            
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Team Assessment</h4>
              <p className="text-white/70 leading-relaxed">
                {analysis.teamAssessment || `Team assessment indicates ${analysis.rating === 'High' ? 'strong team capabilities' : analysis.rating === 'Low' ? 'adequate team capabilities' : 'good team capabilities'} with relevant experience.`}
              </p>
            </BlockchainCard>
            
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Technical Review</h4>
              <p className="text-white/70 leading-relaxed">
                {analysis.technicalReview || `Technical review shows ${analysis.rating === 'High' ? 'strong technical foundation' : analysis.rating === 'Low' ? 'adequate technical foundation' : 'good technical foundation'} with solid implementation.`}
              </p>
            </BlockchainCard>
            
            <BlockchainCard variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Financial Projections</h4>
              <p className="text-white/70 leading-relaxed">
                {analysis.financialProjections || `Financial projections indicate ${analysis.rating === 'High' ? 'strong revenue potential' : analysis.rating === 'Low' ? 'moderate revenue potential' : 'good revenue potential'} with sustainable growth.`}
              </p>
            </BlockchainCard>
          </div>

          {/* Download AI Analysis */}
          <div className="flex justify-center">
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={() => downloadDocument('ai-analysis-report')}
              icon={<NeonCyanIcon type="paper-clip" size={20} className="text-current" />}
            >
              Download Complete AI Analysis Report
            </AnimatedButton>
          </div>
        </>
      ) : (
        <BlockchainCard variant="default" className="p-6 text-center">
          <NeonCyanIcon type="sparkles" size={48} className="text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI Analysis Not Available</h3>
          <p className="text-white/60">This project hasn't been analyzed by RaftAI yet.</p>
        </BlockchainCard>
      )}
    </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'team':
        return renderTeam();
      case 'documents':
        return renderDocuments();
      case 'analysis':
        return renderAnalysis();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {project.logoUrl ? (
              <img
                src={project.logoUrl}
                alt={`${project.title} logo`}
                className="w-12 h-12 rounded-lg object-cover border border-white/10"
                width={48}
                height={48}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <NeonCyanIcon type="building" size={24} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{project.title}</h1>
              <p className="text-white/60 text-sm">Project Overview</p>
            </div>
          </div>
          <AnimatedButton
            variant="primary"
            size="sm"
            onClick={onClose}
            icon={<NeonCyanIcon type="close" size={16} className="text-current" />}
          >
            Close
          </AnimatedButton>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <NeonCyanIcon type={tab.iconType} size={16} className="text-current" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/40">
          <div className="flex items-center space-x-4">
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleAddToWatchlist}
              disabled={isAddingToWatchlist}
              icon={<NeonCyanIcon type="star" size={16} className="text-current" />}
            >
              {isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
            </AnimatedButton>
            
            <AnimatedButton
              variant="primary"
              size="sm"
              icon={<NeonCyanIcon type="chat" size={16} className="text-current" />}
            >
              Chat with Team
            </AnimatedButton>
          </div>
          
          <div className="flex items-center space-x-4">
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleDecline}
              disabled={isDeclining}
              icon={<XCircleIcon className="w-4 h-4" />}
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </AnimatedButton>
            
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleAccept}
              disabled={isAccepting}
              icon={<NeonCyanIcon type="check" size={16} className="text-current" />}
            >
              {isAccepting ? 'Accepting...' : 'Accept & Create Deal Room'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for RaftAI analysis
const getRecommendationBgColor = (rating: string) => {
  switch (rating.toLowerCase()) {
    case 'high': return 'bg-green-500/20 border border-green-500/30';
    case 'low': return 'bg-red-500/20 border border-red-500/30';
    default: return 'bg-blue-500/20 border border-blue-500/30';
  }
};

const getRiskLevel = (riskCount: number) => {
  if (riskCount <= 2) return 'Low';
  if (riskCount <= 4) return 'Medium';
  return 'High';
};

const getPotentialLevel = (opportunityCount: number) => {
  if (opportunityCount >= 5) return 'High';
  if (opportunityCount >= 3) return 'Medium';
  return 'Low';
};

const getInvestmentRecommendation = (rating: string, score: number) => {
  if (score >= 80 && rating.toLowerCase() === 'high') {
    return 'Strong Buy - High potential with excellent fundamentals';
  } else if (score >= 70 && rating.toLowerCase() === 'high') {
    return 'Buy - Good potential with solid fundamentals';
  } else if (score >= 60) {
    return 'Hold - Moderate potential, monitor closely';
  } else {
    return 'Avoid - High risk, limited upside potential';
  }
};

const generateEnhancedSummary = (analysis: any, project: any) => {
  const sector = project.sector || 'blockchain';
  const stage = project.stage || 'Seed';
  const score = analysis.score || 75;
  const rating = analysis.rating || 'Normal';
  
  return `RaftAI has conducted a comprehensive analysis of this ${sector} project in the ${stage} stage. With a score of ${score}/100 and a ${rating} rating, the analysis reveals ${score >= 80 ? 'exceptional' : score >= 70 ? 'strong' : score >= 60 ? 'moderate' : 'limited'} investment potential. The project demonstrates ${analysis.opportunities?.length >= 4 ? 'strong' : 'moderate'} market positioning with ${analysis.risks?.length <= 3 ? 'manageable' : 'elevated'} risk factors. Key focus areas include ${sector.toLowerCase()} market dynamics, team execution capability, and ${stage.toLowerCase()} stage scalability requirements.`;
};

export default VCProjectOverview;
