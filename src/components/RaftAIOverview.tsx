"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface RaftAIMetrics {
  totalAnalyses: number;
  averageScore: number;
  projectsAnalyzed: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export default function RaftAIOverview() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RaftAIMetrics>({
    totalAnalyses: 0,
    averageScore: 0,
    projectsAnalyzed: 0,
    riskDistribution: { low: 0, medium: 0, high: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMetrics = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        // Get projects analyzed by RaftAI for this VC
        const projectsQuery = query(
          collection(dbInstance, 'projects'),
          where('status', '==', 'accepted'),
          where('acceptedBy', '==', user.uid)
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          const projects = snapshot.docs.map(doc => doc.data());
          
          const analyses = projects.filter(p => p.raftai);
          const scores = analyses.map(p => p.raftai?.score || 0).filter(s => s > 0);
          const avgScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;

          // Risk distribution
          const risks = analyses.map(p => p.raftai?.riskLevel || 'medium');
          const riskDist = {
            low: risks.filter(r => r === 'low').length,
            medium: risks.filter(r => r === 'medium').length,
            high: risks.filter(r => r === 'high').length
          };

          setMetrics({
            totalAnalyses: analyses.length,
            averageScore: Math.round(avgScore),
            projectsAnalyzed: projects.length,
            riskDistribution: riskDist
          });
          setLoading(false);
        }, (error) => {
          console.error('Error loading RaftAI metrics:', error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up RaftAI metrics:', error);
        setLoading(false);
      }
    };

    loadMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <NeonCyanIcon type="sparkles" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">RaftAI Overview</h3>
            <p className="text-purple-300 text-sm">AI-Powered Project Intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium">Real-time</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Projects Analyzed</span>
            <NeonCyanIcon type="document" size={20} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.projectsAnalyzed}</div>
          <div className="text-xs text-gray-500 mt-1">Total accepted projects</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Average Score</span>
            <NeonCyanIcon type="chart" size={20} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.averageScore}</div>
          <div className="text-xs text-gray-500 mt-1">RaftAI quality score</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">AI Analyses</span>
            <NeonCyanIcon type="sparkles" size={20} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalAnalyses}</div>
          <div className="text-xs text-gray-500 mt-1">Complete RaftAI reports</div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 mb-6">
        <h4 className="text-white font-semibold mb-4 flex items-center">
          <NeonCyanIcon type="shield" size={20} className="mr-2 text-purple-400" />
          Risk Distribution
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Low Risk</span>
            </div>
            <span className="text-white font-semibold">{metrics.riskDistribution.low}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Medium Risk</span>
            </div>
            <span className="text-white font-semibold">{metrics.riskDistribution.medium}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">High Risk</span>
            </div>
            <span className="text-white font-semibold">{metrics.riskDistribution.high}</span>
          </div>
        </div>
      </div>

      {/* RaftAI Features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Project Analysis</span>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Risk Assessment</span>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Tokenomics Review</span>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Team Verification</span>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Market Prediction</span>
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 border border-purple-500/10">
          <div className="flex items-center space-x-2 mb-1">
            <NeonCyanIcon type="check" size={16} className="text-green-400" />
            <span className="text-white text-xs font-medium">Sentiment Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}

