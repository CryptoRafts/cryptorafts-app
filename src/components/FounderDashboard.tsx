"use client";

import React, { useState } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  BellIcon,
  EyeIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function FounderDashboard() {
  const { profile, projects, dealRooms, currentStep, progressPercentage } = useFounderAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockStats = {
    activeProjects: projects.length || 1,
    totalFunding: 2500000,
    activeDeals: dealRooms.length || 2,
    pendingApprovals: 1,
    interest: {
      vcs: 12,
      exchanges: 3,
      idos: 2,
      influencers: 8,
      agencies: 4
    }
  };

  const mockProjects = [
    {
      id: '1',
      name: 'DeFi Protocol',
      sector: 'DeFi',
      chain: 'Ethereum',
      rating: 'High',
      badges: { kyc: true, kyb: true, audit: true, doxxed: true },
      lastUpdated: '2 hours ago',
      interest: { vcs: 5, exchanges: 2, idos: 1, influencers: 3, agencies: 2 }
    }
  ];

  const mockInsights = {
    summary: "Your DeFi protocol shows strong potential with solid tokenomics and experienced team.",
    risks: [
      "Market volatility in DeFi sector",
      "Regulatory uncertainty",
      "Competition from established protocols"
    ],
    recommendations: [
      "Strengthen partnerships with major DeFi protocols",
      "Consider multi-chain expansion",
      "Enhance security audits"
    ],
    lastAnalyzed: "2 hours ago"
  };

  const mockDeals = [
    {
      id: '1',
      type: 'deal',
      counterparty: 'Andreessen Horowitz',
      stage: 'term_sheet',
      amount: '$2M',
      status: 'active'
    },
    {
      id: '2',
      type: 'listing',
      counterparty: 'Binance',
      stage: 'integration',
      amount: 'Tier 1',
      status: 'active'
    }
  ];

  const mockChats = [
    {
      id: '1',
      type: 'deal',
      counterparty: 'Andreessen Horowitz',
      lastMessage: 'Looking forward to the due diligence call',
      timestamp: '2 hours ago',
      unread: 2
    },
    {
      id: '2',
      type: 'listing',
      counterparty: 'Binance',
      lastMessage: 'Integration timeline confirmed',
      timestamp: '1 day ago',
      unread: 0
    }
  ];

  const renderProgressBanner = () => {
    if (currentStep === 'home') return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <RocketLaunchIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Complete Your Founder Journey</h3>
              <p className="text-gray-300">You're {progressPercentage}% complete with onboarding</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <Link
              href={`/founder/${currentStep}`}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Continue
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Projects</p>
              <p className="text-2xl font-bold text-white">{mockStats.activeProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <RocketLaunchIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Funding</p>
              <p className="text-2xl font-bold text-white">${(mockStats.totalFunding / 1000000).toFixed(1)}M</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Deals</p>
              <p className="text-2xl font-bold text-white">{mockStats.activeDeals}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{mockStats.pendingApprovals}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* My Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">My Projects</h2>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.rating === 'High' ? 'bg-green-500/20 text-green-400' :
                          project.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {project.rating}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span>{project.sector}</span>
                        <span>•</span>
                        <span>{project.chain}</span>
                        <span>•</span>
                        <span>Updated {project.lastUpdated}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        {project.badges.kyc && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">KYC</span>
                        )}
                        {project.badges.kyb && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">KYB</span>
                        )}
                        {project.badges.audit && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">Audit</span>
                        )}
                        {project.badges.doxxed && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">Doxxed</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{project.interest.vcs} VCs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChartBarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{project.interest.exchanges} Exchanges</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RocketLaunchIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{project.interest.idos} IDOs</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                        <ShareIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* AI Insights */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">{mockInsights.summary}</p>
              
              <div>
                <h4 className="font-medium text-white mb-2">Top Risks:</h4>
                <ul className="space-y-1">
                  {mockInsights.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {mockInsights.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                      <CheckCircleIcon className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded-lg transition-colors duration-200">
                Re-run Analysis
              </button>
            </div>
          </div>

          {/* Deals Snapshot */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Deals Snapshot</h3>
              <Link href="/founder/deals" className="text-blue-400 hover:text-blue-300 text-sm">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {mockDeals.map((deal) => (
                <div key={deal.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{deal.counterparty}</p>
                      <p className="text-gray-400 text-sm">{deal.stage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{deal.amount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        deal.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {deal.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Chats</h3>
              <Link href="/founder/messages" className="text-blue-400 hover:text-blue-300 text-sm">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {mockChats.map((chat) => (
                <div key={chat.id} className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{chat.counterparty}</p>
                      <p className="text-gray-400 text-sm truncate">{chat.lastMessage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{chat.timestamp}</p>
                      {chat.unread > 0 && (
                        <span className="inline-flex w-5 h-5 bg-blue-500 text-white text-xs rounded-full items-center justify-center mt-1">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Projects</h2>
        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Create New Project</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <div key={project.id} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.rating === 'High' ? 'bg-green-500/20 text-green-400' :
                project.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {project.rating}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{project.sector}</span>
                <span>•</span>
                <span>{project.chain}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {project.badges.kyc && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">KYC</span>
                )}
                {project.badges.kyb && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">KYB</span>
                )}
                {project.badges.audit && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">Audit</span>
                )}
                {project.badges.doxxed && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">Doxxed</span>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{project.interest.vcs} VCs</span>
                  <span>{project.interest.exchanges} Exchanges</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                    <ShareIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {profile?.displayName || 'Founder'}!
          </h1>
          <p className="text-gray-300">
            Here's what's happening with your projects and deals
          </p>
        </div>

        {/* Progress Banner */}
        {renderProgressBanner()}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'projects', label: 'Projects' },
            { id: 'deals', label: 'Deals' },
            { id: 'messages', label: 'Messages' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'deals' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Deals view coming soon...</p>
          </div>
        )}
        {activeTab === 'messages' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Messages view coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
