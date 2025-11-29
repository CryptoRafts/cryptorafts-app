"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { 
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BellIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  EyeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  SignalIcon,
  BoltIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AnimatedHeader from '@/components/ui/AnimatedHeader';
import BlockchainCard from '@/components/ui/BlockchainCard';
import AnimatedButton from '@/components/ui/AnimatedButton';

interface LiveMetrics {
  liveViews: number;
  interestRate: number;
  engagement: number;
  liveViewsChange: number;
  interestRateChange: number;
  engagementChange: number;
}

interface FirebaseData {
  activeProjects: number;
  dealRooms: number;
  messages: number;
  totalViews: number;
  activeInvestors: number;
  fundingRaised: number;
}

const FounderDashboardNew: React.FC = () => {
  const { user } = useAuth();
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    liveViews: 0,
    interestRate: 0,
    engagement: 0,
    liveViewsChange: 0,
    interestRateChange: 0,
    engagementChange: 0
  });
  
  const [firebaseData, setFirebaseData] = useState<FirebaseData>({
    activeProjects: 0,
    dealRooms: 0,
    messages: 0,
    totalViews: 0,
    activeInvestors: 0,
    fundingRaised: 0
  });
  
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Update last updated time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [user, db]);

  // Fetch real-time data
  useEffect(() => {
    if (!user || !db) return;

    console.log('🔄 Setting up real-time founder dashboard data...');

    // Fetch projects with comprehensive data
    const projectsQuery = query(
      collection(db!, 'projects'),
      where('founderId', '==', user.uid)
    );
    
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs;
      const totalViews = projects.reduce((sum, doc) => sum + (doc.data().views || 0), 0);
      const fundingRaised = projects.reduce((sum, doc) => sum + (doc.data().currentFunding || 0), 0);
      
      setFirebaseData(prev => ({
        ...prev,
        activeProjects: projects.length,
        totalViews,
        fundingRaised
      }));

      // Calculate live metrics from project data
      const totalInterest = projects.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.interest?.vcs || 0) + (data.interest?.exchanges || 0) + 
               (data.interest?.idos || 0) + (data.interest?.influencers || 0) + 
               (data.interest?.agencies || 0);
      }, 0);
      
      const avgInterestRate = projects.length > 0 ? Math.round(totalInterest / projects.length) : 0;
      const engagement = projects.length > 0 ? Math.round((totalViews / projects.length) * 0.1) : 0;

      setLiveMetrics(prev => ({
        ...prev,
        liveViews: totalViews,
        interestRate: avgInterestRate,
        engagement: Math.min(engagement, 100)
      }));

      console.log('✅ Real-time projects update:', { 
        projects: projects.length, 
        totalViews, 
        fundingRaised,
        avgInterestRate,
        engagement 
      });
    });

    // Fetch deal rooms
    const dealRoomsQuery = query(
      collection(db!, 'dealRooms'),
      where('participants', 'array-contains', user.uid)
    );
    
    const unsubscribeDealRooms = onSnapshot(dealRoomsQuery, (snapshot) => {
      setFirebaseData(prev => ({
        ...prev,
        dealRooms: snapshot.docs.length
      }));
      console.log('✅ Real-time deal rooms update:', snapshot.docs.length);
    });

    // Fetch messages
    const messagesQuery = query(
      collection(db!, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const totalMessages = snapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().messageCount || 0);
      }, 0);
      
      setFirebaseData(prev => ({
        ...prev,
        messages: totalMessages
      }));
      console.log('✅ Real-time messages update:', totalMessages);
    });

    // Fetch active investors (VCs, Exchanges, IDOs interested in projects)
    const investorsQuery = query(
      collection(db!, 'users'),
      where('role', 'in', ['vc', 'exchange', 'ido'])
    );
    
    const unsubscribeInvestors = onSnapshot(investorsQuery, (snapshot) => {
      setFirebaseData(prev => ({
        ...prev,
        activeInvestors: snapshot.docs.length
      }));
      console.log('✅ Real-time investors update:', snapshot.docs.length);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeDealRooms();
      unsubscribeMessages();
      unsubscribeInvestors();
    };
  }, [user]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen neo-blue-background">
      {/* Animated Header */}
      <AnimatedHeader
        title="CRYPTORAFTS"
        subtitle="Founder Dashboard"
        navigation={[
          { label: 'Dashboard', href: '/founder/dashboard', active: true },
          { label: 'Projects', href: '/founder/projects' },
          { label: 'Deal Rooms', href: '/founder/deal-rooms' },
          { label: 'Settings', href: '/founder/settings' }
        ]}
        showUserInfo={true}
        showNotifications={true}
        showSettings={true}
        showSignOut={true}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <BlockchainCard className="mb-8" variant="glass" size="lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Founder Dashboard</h1>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Live</span>
              </div>
              <p className="text-white/60">Welcome back, {user?.displayName || user?.email?.split('@')[0]}.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/60">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">Last updated: {formatTime(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </BlockchainCard>

        {/* Live Metrics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <SignalIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Live Metrics</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Real-time</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Views */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex items-center space-x-2">
                  {liveMetrics.liveViewsChange >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${liveMetrics.liveViewsChange >= 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {liveMetrics.liveViewsChange >= 0 ? '+' : ''}{liveMetrics.liveViewsChange}%
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-1">{liveMetrics.liveViews}</h3>
              <p className="text-white/60 text-sm">Live Views</p>
            </BlockchainCard>

            {/* Interest Rate */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center space-x-2">
                  {liveMetrics.interestRateChange >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${liveMetrics.interestRateChange >= 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {liveMetrics.interestRateChange >= 0 ? '+' : ''}{liveMetrics.interestRateChange}%
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-1">{liveMetrics.interestRate}</h3>
              <p className="text-white/60 text-sm">Interest Rate</p>
            </BlockchainCard>

            {/* Engagement */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <HeartIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center space-x-2">
                  {liveMetrics.engagementChange >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${liveMetrics.engagementChange >= 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {liveMetrics.engagementChange >= 0 ? '+' : ''}{liveMetrics.engagementChange}%
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-1">{liveMetrics.engagement}</h3>
              <p className="text-white/60 text-sm">Engagement</p>
            </BlockchainCard>
          </div>
        </div>

        {/* Real-time Firebase Data Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BoltIcon className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Real-time Firebase Data</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Projects */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{firebaseData.activeProjects}</h3>
              <p className="text-white/60 text-sm">Active Projects</p>
            </BlockchainCard>

            {/* Deal Rooms */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{firebaseData.dealRooms}</h3>
              <p className="text-white/60 text-sm">Deal Rooms</p>
            </BlockchainCard>

            {/* Messages */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{firebaseData.messages}</h3>
              <p className="text-white/60 text-sm">Messages</p>
            </BlockchainCard>

            {/* Total Views */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-1">{formatNumber(firebaseData.totalViews)}</h3>
              <p className="text-white/60 text-sm">Total Views</p>
            </BlockchainCard>

            {/* Active Investors */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{firebaseData.activeInvestors}</h3>
              <p className="text-white/60 text-sm">Active Investors</p>
            </BlockchainCard>

            {/* Funding Raised */}
            <BlockchainCard hoverable={true} clickable={true}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-1">{formatCurrency(firebaseData.fundingRaised)}</h3>
              <p className="text-white/60 text-sm">Funding Raised</p>
            </BlockchainCard>
          </div>
        </div>

        {/* Additional Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Project Performance */}
          <BlockchainCard hoverable={true} clickable={true}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center space-x-2">
                <ArrowUpIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">+12%</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Project Performance</h3>
            <p className="text-white/60 text-sm">Growing steadily</p>
          </BlockchainCard>

          {/* Revenue Growth */}
          <BlockchainCard hoverable={true} clickable={true}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Revenue Growth</h3>
            <p className="text-white/60 text-sm">Track your earnings</p>
          </BlockchainCard>

          {/* Community Engagement */}
          <BlockchainCard hoverable={true} clickable={true}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Community Engagement</h3>
            <p className="text-white/60 text-sm">Active discussions</p>
          </BlockchainCard>

          {/* Market Visibility */}
          <BlockchainCard hoverable={true} clickable={true}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <EyeIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex items-center space-x-2">
                <ArrowUpIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">+12%</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Market Visibility</h3>
            <p className="text-white/60 text-sm">Increasing reach</p>
          </BlockchainCard>
        </div>
      </div>
    </div>
  );
};

export default FounderDashboardNew;
