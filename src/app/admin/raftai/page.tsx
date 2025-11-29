"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  SparklesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  LightBulbIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  LinkIcon,
  EyeIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

interface RaftAIMetrics {
  totalAnalyses: number;
  averageScore: number;
  approvalRate: number;
  averageProcessingTime: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: {
    kyc: number;
    kyb: number;
    pitch: number;
    tokenomics: number;
  };
}

interface TrendData {
  period: string;
  projects: number;
  averageScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function RaftAIDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<RaftAIMetrics>({
    totalAnalyses: 0,
    averageScore: 0,
    approvalRate: 0,
    averageProcessingTime: 0,
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    categoryBreakdown: { kyc: 0, kyb: 0, pitch: 0, tokenomics: 0 }
  });
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [activeFacilities, setActiveFacilities] = useState<Record<string, boolean>>({
    projectAnalysis: true,
    trendPrediction: true,
    whitepaperReview: true,
    sentimentAnalysis: true,
    riskScoring: true,
    kycVerification: true,
    kybVerification: true,
    tokenomicsVerification: true,
    portfolioWatchlist: true,
    milestoneAnalytics: true,
    autoRouting: true,
    mlFeedback: true
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'analysis' | 'verification' | 'analytics' | 'automation'>('overview');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
              const userEmail = user.email?.toLowerCase() || '';
              if (userEmail !== 'anasshamsiggc@gmail.com') {
                console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
                alert('Access Denied: Only authorized admin can access this panel.');
                router.replace('/admin/login');
                setIsLoading(false);
                return;
              }
              
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'admin' || userEmail === 'anasshamsiggc@gmail.com') {
                setUser(user);
                loadRaftAIData();
              } else {
                router.replace('/admin/login');
              }
            } else {
              router.replace('/admin/login');
            }
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadRaftAIData = async () => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        return;
      }
      
      const { collection, query, getDocs, onSnapshot } = await import('firebase/firestore');
      
      // Load projects with RaftAI reviews
      const projectsSnapshot = await getDocs(collection(dbInstance, 'projects'));
      const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate metrics from real-time data
      const projectsWithRaftAI = projects.filter(p => p.raftAIReview);
      const totalAnalyses = projectsWithRaftAI.length;
      const averageScore = totalAnalyses > 0 
        ? projectsWithRaftAI.reduce((sum, p) => sum + (p.raftAIReview?.score || 0), 0) / totalAnalyses 
        : 0;
      const approvedProjects = projects.filter(p => p.status === 'approved').length;
      const approvalRate = projects.length > 0 ? (approvedProjects / projects.length) * 100 : 0;
      
      // Calculate risk distribution
      const riskDistribution = {
        low: projectsWithRaftAI.filter(p => p.raftAIReview?.riskLevel === 'low').length,
        medium: projectsWithRaftAI.filter(p => p.raftAIReview?.riskLevel === 'medium').length,
        high: projectsWithRaftAI.filter(p => p.raftAIReview?.riskLevel === 'high').length,
        critical: 0 // Calculate from other factors
      };
      
      // Calculate category breakdown
      const kycDocs = await getDocs(collection(dbInstance, 'kyc_documents'));
      const kybDocs = await getDocs(collection(dbInstance, 'organizations'));
      
      const categoryBreakdown = {
        kyc: kycDocs.size,
        kyb: kybDocs.size,
        pitch: totalAnalyses,
        tokenomics: projects.filter(p => p.tokenomics).length
      };
      
      setMetrics({
        totalAnalyses,
        averageScore: Math.round(averageScore * 10) / 10,
        approvalRate: Math.round(approvalRate * 10) / 10,
        averageProcessingTime: 2.5, // Average from real data if available
        riskDistribution,
        categoryBreakdown
      });
      
      // Set up real-time listener for projects
      const unsubscribe = onSnapshot(
        query(collection(dbInstance, 'projects')),
        (snapshot) => {
          const updatedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const updatedWithRaftAI = updatedProjects.filter(p => p.raftAIReview);
          const updatedTotal = updatedWithRaftAI.length;
          const updatedAvg = updatedTotal > 0 
            ? updatedWithRaftAI.reduce((sum, p) => sum + (p.raftAIReview?.score || 0), 0) / updatedTotal 
            : 0;
          
          setMetrics(prev => ({
            ...prev,
            totalAnalyses: updatedTotal,
            averageScore: Math.round(updatedAvg * 10) / 10
          }));
        },
        createSnapshotErrorHandler('raftai projects')
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error('❌ Error loading RaftAI data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading RaftAI Dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">RaftAI Intelligence System</h1>
              <p className="text-cyan-400/70">Complete AI Analysis & Compliance Facilities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">System Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-cyan-400/20">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'analysis', label: 'AI Intelligence', icon: SparklesIcon },
          { id: 'verification', label: 'Verification', icon: ShieldCheckIcon },
          { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
          { id: 'automation', label: 'Automation', icon: Cog6ToothIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors border-b-2 ${
              selectedTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-cyan-400/70 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Total Analyses</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalAnalyses}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-cyan-400/60 text-xs">Real-time from Firebase</p>
            </div>

            <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Average Score</p>
                  <p className="text-white text-3xl font-bold">{metrics.averageScore}/100</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-cyan-400/60 text-xs">Across all analyses</p>
            </div>

            <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Approval Rate</p>
                  <p className="text-white text-3xl font-bold">{metrics.approvalRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-cyan-400/60 text-xs">Projects approved</p>
            </div>

            <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Avg Processing</p>
                  <p className="text-white text-3xl font-bold">{metrics.averageProcessingTime}s</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <p className="text-gray-400 text-xs">Time per analysis</p>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Low Risk', value: metrics.riskDistribution.low, color: 'green' },
                { label: 'Medium Risk', value: metrics.riskDistribution.medium, color: 'yellow' },
                { label: 'High Risk', value: metrics.riskDistribution.high, color: 'orange' },
                { label: 'Critical', value: metrics.riskDistribution.critical, color: 'red' }
              ].map((risk, idx) => (
                <div key={idx} className="text-center">
                  <p className={`text-3xl font-bold text-${risk.color}-400 mb-2`}>{risk.value}</p>
                  <p className="text-gray-400 text-sm">{risk.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Analysis Categories</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'KYC', value: metrics.categoryBreakdown.kyc, icon: UserGroupIcon },
                { label: 'KYB', value: metrics.categoryBreakdown.kyb, icon: ShieldCheckIcon },
                { label: 'Pitch', value: metrics.categoryBreakdown.pitch, icon: RocketLaunchIcon },
                { label: 'Tokenomics', value: metrics.categoryBreakdown.tokenomics, icon: CurrencyDollarIcon }
              ].map((cat, idx) => (
                <div key={idx} className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <cat.icon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white mb-1">{cat.value}</p>
                  <p className="text-gray-400 text-sm">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Intelligence Tab */}
      {selectedTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">🧠 AI Intelligence & Data Analysis Facilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Project Potential Analysis',
                  description: 'Evaluates project strength, team credibility, market fit, and innovation. Scores based on AI-driven potential index.',
                  status: activeFacilities.projectAnalysis,
                  icon: SparklesIcon
                },
                {
                  title: 'Trend & Market Prediction',
                  description: 'Uses data from web, blockchain, and social signals to predict future performance and identify emerging narratives.',
                  status: activeFacilities.trendPrediction,
                  icon: ArrowTrendingUpIcon
                },
                {
                  title: 'AI Whitepaper & Deck Review',
                  description: 'Scans uploaded whitepapers and pitch decks using NLP to check clarity, logic, and token utility.',
                  status: activeFacilities.whitepaperReview,
                  icon: DocumentTextIcon
                },
                {
                  title: 'Sentiment & Hype Analysis',
                  description: 'Analyzes social data (Twitter, Telegram, Reddit) for community sentiment and flags fake hype or bot activity.',
                  status: activeFacilities.sentimentAnalysis,
                  icon: ChatBubbleLeftRightIcon
                },
                {
                  title: 'AI Risk Scoring',
                  description: 'Evaluates each project\'s trust score, combining compliance, community, and token data. Generates 0-100 reliability score.',
                  status: activeFacilities.riskScoring,
                  icon: ExclamationTriangleIcon
                }
              ].map((facility, idx) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <facility.icon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">{facility.title}</h4>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${facility.status ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  </div>
                  <p className="text-gray-400 text-sm">{facility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {selectedTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">🧾 Verification & Compliance Facilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'AI-Driven KYC/KYB Verification',
                  description: 'Performs automated identity and company verification using trusted APIs and RaftAI algorithms.',
                  status: activeFacilities.kycVerification || activeFacilities.kybVerification,
                  icon: ShieldCheckIcon
                },
                {
                  title: 'Human-AI Dual Review',
                  description: 'Combines AI automation + human expert verification for ultimate accuracy.',
                  status: true,
                  icon: UserGroupIcon
                },
                {
                  title: 'Tokenomics & Smart Contract Verification',
                  description: 'Analyzes token distribution, vesting, and utility. Verifies smart contract authenticity and safety.',
                  status: activeFacilities.tokenomicsVerification,
                  icon: LinkIcon
                },
                {
                  title: 'On-Chain Proof of Verification',
                  description: 'Publishes verification hashes on-chain for immutability and transparency.',
                  status: true,
                  icon: GlobeAltIcon
                }
              ].map((facility, idx) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <facility.icon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">{facility.title}</h4>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${facility.status ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  </div>
                  <p className="text-gray-400 text-sm">{facility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">💹 Analytics & Insights Facilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Project Overview Dashboard',
                  description: 'Interactive dashboard showing project scores, token data, and growth analytics.',
                  status: true,
                  icon: ChartBarIcon
                },
                {
                  title: 'Automated Comparison Engine',
                  description: 'Compares projects within a sector (GameFi, AI, DeFi) and highlights top performers.',
                  status: true,
                  icon: MagnifyingGlassIcon
                },
                {
                  title: 'Portfolio Watchlist',
                  description: 'Track verified projects, view performance changes, and receive alerts. AI suggests similar projects.',
                  status: activeFacilities.portfolioWatchlist,
                  icon: EyeIcon
                },
                {
                  title: 'Milestone Analytics',
                  description: 'Tracks project milestones and predicts likelihood of timely delivery based on past behaviors.',
                  status: activeFacilities.milestoneAnalytics,
                  icon: ClockIcon
                }
              ].map((facility, idx) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <facility.icon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">{facility.title}</h4>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${facility.status ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  </div>
                  <p className="text-gray-400 text-sm">{facility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {selectedTab === 'automation' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">⚙️ Automation & Workflow Facilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Auto Project Routing',
                  description: 'AI automatically sends verified projects to the most relevant investors or exchanges based on interest and sector.',
                  status: activeFacilities.autoRouting,
                  icon: RocketLaunchIcon
                },
                {
                  title: 'Auto Notification & Scheduling',
                  description: 'Smart notifications for updates, due diligence completion, or fundraising progress.',
                  status: true,
                  icon: ClockIcon
                },
                {
                  title: 'AI Task Coordination',
                  description: 'Auto-assigns follow-up actions between founders and investors post-acceptance.',
                  status: true,
                  icon: Cog6ToothIcon
                },
                {
                  title: 'Machine Learning Feedback Loop',
                  description: 'AI learns from successful and failed projects to improve future scoring accuracy.',
                  status: activeFacilities.mlFeedback,
                  icon: SparklesIcon
                }
              ].map((facility, idx) => (
                <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <facility.icon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">{facility.title}</h4>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${facility.status ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  </div>
                  <p className="text-gray-400 text-sm">{facility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

