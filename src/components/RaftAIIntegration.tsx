/**
 * RaftAI Integration Component for VC Dashboard
 * 
 * This component provides a comprehensive RaftAI analysis interface
 * for VCs to analyze projects, KYC/KYB documents, and get AI insights.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  PresentationChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ArrowPathIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { raftAI, RaftAIAnalysisResult } from '@/lib/raftai-core';
import RaftAIAnalysis from './RaftAIAnalysis';

interface RaftAIIntegrationProps {
  projectId?: string;
  userId?: string;
  orgId?: string;
  onAnalysisComplete?: (analysis: RaftAIAnalysisResult) => void;
  className?: string;
}

interface AnalysisQueue {
  id: string;
  type: 'kyc' | 'kyb' | 'pitch' | 'tokenomics' | 'project_overview';
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime: Date;
  result?: RaftAIAnalysisResult;
  error?: string;
}

export default function RaftAIIntegration({ 
  projectId, 
  userId, 
  orgId, 
  onAnalysisComplete,
  className = '' 
}: RaftAIIntegrationProps) {
  const [analyses, setAnalyses] = useState<RaftAIAnalysisResult[]>([]);
  const [queue, setQueue] = useState<AnalysisQueue[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<RaftAIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const analysisTypes = [
    {
      id: 'kyc' as const,
      name: 'KYC Analysis',
      description: 'Verify individual identity and compliance',
      icon: DocumentTextIcon,
      color: 'blue',
      available: !!userId,
    },
    {
      id: 'kyb' as const,
      name: 'KYB Analysis',
      description: 'Verify business registration and compliance',
      icon: BuildingOfficeIcon,
      color: 'green',
      available: !!orgId,
    },
    {
      id: 'pitch' as const,
      name: 'Pitch Analysis',
      description: 'Analyze pitch deck and presentation',
      icon: PresentationChartBarIcon,
      color: 'purple',
      available: !!projectId,
    },
    {
      id: 'tokenomics' as const,
      name: 'Tokenomics Analysis',
      description: 'Evaluate token economics and model',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      available: !!projectId,
    },
    {
      id: 'project_overview' as const,
      name: 'Project Overview',
      description: 'Comprehensive project analysis',
      icon: EyeIcon,
      color: 'indigo',
      available: !!projectId,
    },
  ];

  useEffect(() => {
    // Load existing analyses if available
    if (projectId) {
      const history = raftAI.getAnalysisHistory(projectId);
      setAnalyses(history);
    }
    if (userId) {
      const history = raftAI.getAnalysisHistory(userId);
      setAnalyses(prev => [...prev, ...history]);
    }
    if (orgId) {
      const history = raftAI.getAnalysisHistory(orgId);
      setAnalyses(prev => [...prev, ...history]);
    }
  }, [projectId, userId, orgId]);

  const runAnalysis = async (type: 'kyc' | 'kyb' | 'pitch' | 'tokenomics' | 'project_overview') => {
    const entityId = type === 'kyc' ? userId : type === 'kyb' ? orgId : projectId;
    if (!entityId) return;

    const queueId = `${type}_${entityId}_${Date.now()}`;
    const newQueueItem: AnalysisQueue = {
      id: queueId,
      type,
      status: 'pending',
      startTime: new Date(),
    };

    setQueue(prev => [...prev, newQueueItem]);
    setIsLoading(true);

    try {
      // Update queue status
      setQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: 'processing' } : item
      ));

      let result: RaftAIAnalysisResult;
      
      switch (type) {
        case 'kyc':
          result = await raftAI.analyzeKYC(entityId, {});
          break;
        case 'kyb':
          result = await raftAI.analyzeKYB(entityId, {});
          break;
        case 'pitch':
          result = await raftAI.analyzePitch(entityId, {});
          break;
        case 'tokenomics':
          result = await raftAI.analyzeTokenomics(entityId, {});
          break;
        case 'project_overview':
          result = await raftAI.analyzeProjectOverview(entityId, {});
          break;
        default:
          throw new Error(`Unknown analysis type: ${type}`);
      }

      // Update queue with result
      setQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: 'completed', result } : item
      ));

      // Add to analyses
      setAnalyses(prev => [result, ...prev]);
      
      // Set as selected analysis
      setSelectedAnalysis(result);
      
      // Notify parent component
      onAnalysisComplete?.(result);

      console.log(`✅ RaftAI: ${type} analysis completed for ${entityId}`);

    } catch (error) {
      console.error(`❌ RaftAI: ${type} analysis failed:`, error);
      
      // Update queue with error
      setQueue(prev => prev.map(item => 
        item.id === queueId ? { 
          ...item, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : item
      ));
    } finally {
      setIsLoading(false);
      
      // Remove completed/error items from queue after 5 seconds
      setTimeout(() => {
        setQueue(prev => prev.filter(item => item.id !== queueId));
      }, 5000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'processing': return ClockIcon;
      case 'pending': return ClockIcon;
      case 'error': return XCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'green': return 'bg-green-100 text-green-600 border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">RaftAI Analysis</h2>
            <p className="text-sm text-gray-600">Advanced AI-powered project and compliance analysis</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Analysis Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {analysisTypes.map((analysisType) => {
            const Icon = analysisType.icon;
            const isAvailable = analysisType.available;
            const isProcessing = queue.some(item => item.type === analysisType.id && item.status === 'processing');
            const isPending = queue.some(item => item.type === analysisType.id && item.status === 'pending');
            
            return (
              <div
                key={analysisType.id}
                className={`rounded-lg border-2 p-4 transition-all duration-200 ${
                  isAvailable 
                    ? 'cursor-pointer hover:shadow-md hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                } ${getColorClasses(analysisType.color)}`}
                onClick={() => isAvailable && !isProcessing && !isPending && runAnalysis(analysisType.id)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Icon className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{analysisType.name}</h3>
                    <p className="text-sm text-gray-600">{analysisType.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isProcessing && (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-xs text-blue-600">Processing...</span>
                      </>
                    )}
                    {isPending && (
                      <>
                        <ClockIcon className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-600">Queued...</span>
                      </>
                    )}
                    {!isAvailable && (
                      <span className="text-xs text-gray-500">Not Available</span>
                    )}
                    {isAvailable && !isProcessing && !isPending && (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        <span className="text-xs">Run Analysis</span>
                      </>
                    )}
                  </div>
                  
                  {isAvailable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runAnalysis(analysisType.id);
                      }}
                      disabled={isProcessing || isPending}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isProcessing || isPending
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {isProcessing ? 'Running...' : isPending ? 'Queued' : 'Analyze'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Processing Queue */}
        {queue.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Queue</h3>
            <div className="space-y-2">
              {queue.map((item) => {
                const StatusIcon = getStatusIcon(item.status);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(item.status).split(' ')[0]}`} />
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {item.type.replace('_', ' ')} Analysis
                        </div>
                        <div className="text-sm text-gray-600">
                          Started: {item.startTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.error && (
                        <span className="text-xs text-red-600">{item.error}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis History Toggle */}
        {analyses.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>Analysis History ({analyses.length})</span>
              {showHistory ? (
                <ArrowPathIcon className="w-4 h-4 transform rotate-180" />
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Analysis History */}
        {showHistory && analyses.length > 0 && (
          <div className="mb-6">
            <div className="space-y-3">
              {analyses.slice(0, 5).map((analysis, index) => (
                <div
                  key={analysis.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnalysis?.id === analysis.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {analysis.type.replace('_', ' ')} Analysis
                      </div>
                      <div className="text-sm text-gray-600">
                        Score: {Math.round(analysis.metrics.overallScore)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Risk: {Math.round(analysis.riskScore)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.recommendation === 'approve' ? 'bg-green-100 text-green-800' :
                        analysis.recommendation === 'conditional' ? 'bg-yellow-100 text-yellow-800' :
                        analysis.recommendation === 'review_required' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.recommendation.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Analysis Display */}
        {selectedAnalysis && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
            <RaftAIAnalysis 
              analysis={selectedAnalysis} 
              showDetails={true}
              onInsightClick={(insight) => {
                console.log('Insight clicked:', insight);
              }}
            />
          </div>
        )}

        {/* No Analysis Selected */}
        {!selectedAnalysis && analyses.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-600 mb-4">
              Run your first RaftAI analysis to get started with AI-powered insights.
            </p>
            <div className="text-sm text-gray-500">
              Select an analysis type above to begin.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
