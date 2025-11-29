/**
 * RaftAI Analysis Display Component
 * 
 * This component displays comprehensive RaftAI analysis results with
 * interactive insights, metrics, and recommendations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { RaftAIAnalysisResult, RaftAIInsight, RaftAIMetrics } from '@/lib/raftai-core';

interface RaftAIAnalysisProps {
  analysis: RaftAIAnalysisResult;
  showDetails?: boolean;
  onInsightClick?: (insight: RaftAIInsight) => void;
  className?: string;
}

export default function RaftAIAnalysis({ 
  analysis, 
  showDetails = true, 
  onInsightClick,
  className = '' 
}: RaftAIAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [selectedInsight, setSelectedInsight] = useState<RaftAIInsight | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check';
      case 'processing': return 'clock';
      case 'pending': return 'clock';
      case 'error': return 'x-circle';
      default: return 'info';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve': return 'text-green-500 bg-green-50 border-green-200';
      case 'conditional': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'review_required': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'reject': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance': return 'shield';
      case 'risk': return 'exclamation';
      case 'opportunity': return 'arrow-up';
      case 'warning': return 'exclamation';
      case 'recommendation': return 'info';
      default: return 'info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kyc': return 'document';
      case 'kyb': return 'document';
      case 'pitch': return 'chart';
      case 'tokenomics': return 'dollar';
      case 'project_overview': return 'eye';
      default: return 'document';
    }
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore <= 25) return { level: 'Low', color: 'text-green-600' };
    if (riskScore <= 50) return { level: 'Medium', color: 'text-yellow-600' };
    if (riskScore <= 75) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Critical', color: 'text-red-600' };
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleInsightClick = (insight: RaftAIInsight) => {
    setSelectedInsight(insight);
    onInsightClick?.(insight);
  };

  const statusIconType = getStatusIcon(analysis.status);
  const typeIconType = getTypeIcon(analysis.type);
  const riskLevel = getRiskLevel(analysis.riskScore);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <NeonCyanIcon type={typeIconType as any} size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                RaftAI {analysis.type.replace('_', ' ')} Analysis
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <NeonCyanIcon type={statusIconType as any} size={16} className={getStatusColor(analysis.status)} />
                  <span className="capitalize">{analysis.status}</span>
                </div>
                <span>•</span>
                <span>{analysis.processingTime}ms</span>
                <span>•</span>
                <span>v{analysis.version}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Overall Score</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(analysis.metrics.overallScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(analysis.confidence)}%</div>
            <div className="text-sm text-gray-600">Confidence</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${riskLevel.color}`}>
              {Math.round(analysis.riskScore)}
            </div>
            <div className="text-sm text-gray-600">Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analysis.metrics.greenFlags}
            </div>
            <div className="text-sm text-gray-600">Green Flags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analysis.metrics.redFlags}
            </div>
            <div className="text-sm text-gray-600">Red Flags</div>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`px-6 py-3 border-b border-gray-200 ${getRecommendationColor(analysis.recommendation)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {analysis.recommendation === 'approve' && <NeonCyanIcon type="check" size={20} />}
            {analysis.recommendation === 'conditional' && <NeonCyanIcon type="exclamation" size={20} />}
            {analysis.recommendation === 'review_required' && <NeonCyanIcon type="info" size={20} />}
            {analysis.recommendation === 'reject' && <NeonCyanIcon type="x-circle" size={20} />}
            <span className="font-semibold capitalize">
              Recommendation: {analysis.recommendation.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm opacity-75">
            Risk Level: <span className={riskLevel.color}>{riskLevel.level}</span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="p-6 space-y-6">
          {/* Category Scores */}
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('scores')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-gray-900">Category Scores</h4>
              {expandedSections.has('scores') ? (
                <NeonCyanIcon type="chevron-down" size={20} className="text-gray-500 rotate-180" />
              ) : (
                <NeonCyanIcon type="chevron-down" size={20} className="text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('scores') && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.metrics.categoryScores).map(([category, score]) => (
                  <div key={category} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 capitalize mb-1">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {Math.round(score)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          score >= 90 ? 'bg-green-500' :
                          score >= 75 ? 'bg-yellow-500' :
                          score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('insights')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Key Insights ({analysis.insights.length})
              </h4>
              {expandedSections.has('insights') ? (
                <NeonCyanIcon type="chevron-down" size={20} className="text-gray-500 rotate-180" />
              ) : (
                <NeonCyanIcon type="chevron-down" size={20} className="text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('insights') && (
              <div className="mt-4 space-y-3">
                {analysis.insights.map((insight) => {
                  const categoryIconType = getCategoryIcon(insight.category);
                  return (
                    <div
                      key={insight.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleInsightClick(insight)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
                          <NeonCyanIcon type={categoryIconType as any} size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {insight.title}
                            </h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                              {insight.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {insight.description}
                          </p>
                          <div className="text-xs text-gray-500">
                            <strong>Impact:</strong> {insight.impact}
                          </div>
                          {insight.suggestedAction && (
                            <div className="text-xs text-blue-600 mt-1">
                              <strong>Suggested Action:</strong> {insight.suggestedAction}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Analysis Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Analysis Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Analysis ID</div>
                <div className="font-mono text-xs text-gray-900">{analysis.id}</div>
              </div>
              <div>
                <div className="text-gray-600">Timestamp</div>
                <div className="text-gray-900">{analysis.timestamp.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Processing Time</div>
                <div className="text-gray-900">{analysis.processingTime}ms</div>
              </div>
              <div>
                <div className="text-gray-600">Version</div>
                <div className="text-gray-900">v{analysis.version}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedInsight.title}
                </h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <NeonCyanIcon type="close" size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedInsight.severity)}`}>
                    {selectedInsight.severity} severity
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {selectedInsight.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {Math.round(selectedInsight.confidence)}% confidence
                  </span>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedInsight.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Impact</h4>
                  <p className="text-gray-700">{selectedInsight.impact}</p>
                </div>
                
                {selectedInsight.suggestedAction && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Suggested Action</h4>
                    <p className="text-gray-700">{selectedInsight.suggestedAction}</p>
                  </div>
                )}
                
                {selectedInsight.references && selectedInsight.references.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">References</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {selectedInsight.references.map((ref, index) => (
                        <li key={index}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
