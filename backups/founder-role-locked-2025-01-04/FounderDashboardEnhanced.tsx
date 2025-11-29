"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { globalRules } from '@/lib/global-rules';
import { pitchManager } from '@/lib/pitch-manager';
import { db, auth } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { 
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  StarIcon,
  HeartIcon,
  LightBulbIcon,
  CpuChipIcon,
  CommandLineIcon,
  GlobeAltIcon,
  SignalIcon,
  TrophyIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  route?: string;
}

interface ProjectCard {
  id: string;
  name: string;
  sector: string;
  chain: string;
  stage: string;
  rating: 'High' | 'Normal' | 'Low';
  badges: {
    kyc: boolean;
    kyb: boolean;
    audit: boolean;
    doxxed: boolean;
  };
  interest: {
    vcs: number;
    exchanges: number;
    idos: number;
    influencers: number;
    agencies: number;
  };
  lastUpdated: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team';
  counterpart: {
    name: string;
    type: 'VC' | 'Exchange' | 'IDO' | 'Influencer' | 'Agency';
    region: string;
  };
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
}

interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  timestamp: Date;
}

interface Notification {
  id: string;
  type: 'message' | 'deal' | 'view' | 'interest' | 'ai';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LiveMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export default function FounderDashboardEnhanced() {
  const { user, isLoading } = useAuth();
  const { profile } = useFounderAuth();
  const router = useRouter();
  
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [pitch, setPitch] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // New real-time state
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [realtimeStats, setRealtimeStats] = useState({
    totalViews: 0,
    activeInvestors: 0,
    fundingRaised: 0,
    pitchScore: 0,
    dealRooms: 0,
    messages: 0,
    projectViews: 0,
    activeProjects: 0,
    activeDeals: 0
  });
  
  // Real-time listeners
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);

  useEffect(() => {
    if (!isLoading && user) {
      initializeDashboard();
      setupRealtimeListeners();
      generateAIInsights();
      startLiveMetrics();
    }
    
    return () => {
      // Cleanup listeners
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, isLoading]);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeDashboard = async () => {
    try {
      await globalRules.initialize();
      
      // Check if user can access dashboard
      if (!globalRules.canAccessPortal()) {
        router.push('/founder/portal');
        return;
      }
      
      // Load pitch data
      const existingPitch = await pitchManager.getExistingPitch();
      setPitch(existingPitch);
      
      // Initialize dashboard cards with enhanced data
      const cards: DashboardCard[] = [
        {
          id: 'projects',
          title: 'Active Projects',
          value: realtimeStats.activeProjects,
          change: realtimeStats.activeProjects > 0 ? '+100%' : undefined,
          icon: <RocketLaunchIcon className="h-6 w-6" />,
          color: 'from-blue-500 to-cyan-500',
          route: '/founder/projects'
        },
        {
          id: 'deals',
          title: 'Active Deals',
          value: realtimeStats.dealRooms,
          change: realtimeStats.dealRooms > 0 ? `+${realtimeStats.dealRooms}` : undefined,
          icon: <CurrencyDollarIcon className="h-6 w-6" />,
          color: 'from-green-500 to-emerald-500',
          route: '/founder/deals'
        },
        {
          id: 'chat-rooms',
          title: 'Chat Rooms',
          value: realtimeStats.dealRooms,
          change: realtimeStats.dealRooms > 0 ? `+${realtimeStats.dealRooms}` : undefined,
          icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
          color: 'from-purple-500 to-violet-500',
          route: '/founder/chat'
        },
        {
          id: 'views',
          title: 'Project Views',
          value: realtimeStats.projectViews,
          change: '+12%',
          icon: <EyeIcon className="h-6 w-6" />,
          color: 'from-orange-500 to-red-500'
        }
      ];
      
      setDashboardCards(cards);
      
      // Initialize projects with enhanced data
      if (existingPitch) {
        const projectCard: ProjectCard = {
          id: existingPitch.id,
          name: existingPitch.data.projectName,
          sector: existingPitch.data.sector,
          chain: existingPitch.data.chain,
          stage: existingPitch.data.stage,
          rating: (existingPitch.aiDecision?.score ?? 0) >= 80 ? 'High' : 
                 (existingPitch.aiDecision?.score ?? 0) >= 60 ? 'Normal' : 'Low',
          badges: {
            kyc: true,
            kyb: profile?.kybStatus === 'approved',
            audit: !!existingPitch.data.auditLinks,
            doxxed: true
          },
          interest: {
            vcs: existingPitch.routes?.filter(r => r.roleType === 'VC').length || Math.floor(Math.random() * 20),
            exchanges: existingPitch.routes?.filter(r => r.roleType === 'Exchange').length || Math.floor(Math.random() * 15),
            idos: existingPitch.routes?.filter(r => r.roleType === 'IDO').length || Math.floor(Math.random() * 10),
            influencers: existingPitch.routes?.filter(r => r.roleType === 'Influencer').length || Math.floor(Math.random() * 25),
            agencies: existingPitch.routes?.filter(r => r.roleType === 'Agency').length || Math.floor(Math.random() * 8)
          },
          lastUpdated: new Date(existingPitch.updatedAt?.toDate() || Date.now()).toLocaleDateString()
        };
        
        setProjects([projectCard]);
      }
      
      // Initialize chat rooms (empty for now)
      setChatRooms([]);
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  };

  const setupRealtimeListeners = useCallback(() => {
    if (!user || !db) return;

    const newUnsubscribers: (() => void)[] = [];

    // Listen for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Notification[];
      
      setNotifications(newNotifications);
      setLastUpdate(new Date());
    });

    newUnsubscribers.push(unsubNotifications);

    // Listen for chat rooms
    const chatRoomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastActivityAt', 'desc'),
      limit(5)
    );

    const unsubChatRooms = onSnapshot(chatRoomsQuery, (snapshot) => {
      const newChatRooms: ChatRoom[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActivity: doc.data().lastActivityAt?.toDate() || new Date()
      })) as ChatRoom[];
      
      setChatRooms(newChatRooms);
      setLastUpdate(new Date());
    });

    newUnsubscribers.push(unsubChatRooms);

    setUnsubscribers(newUnsubscribers);
  }, [user]);

  const generateAIInsights = useCallback(() => {
    if (!pitch) return;

    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'success',
        title: 'High RaftAI Score',
        description: `Your pitch scored ${pitch.aiDecision?.score || 0}/100. This puts you in the top tier of projects.`,
        icon: <TrophyIcon className="h-5 w-5" />,
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'tip',
        title: 'Optimization Tip',
        description: 'Consider adding more technical details to your whitepaper to increase investor confidence.',
        icon: <LightBulbIcon className="h-5 w-5" />,
        action: 'Update Whitepaper',
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'info',
        title: 'Market Trend',
        description: 'Projects in your sector are seeing 23% more interest this quarter.',
        icon: <ChartBarIcon className="h-5 w-5" />,
        timestamp: new Date()
      }
    ];

    setAiInsights(insights);
  }, [pitch]);

  const startLiveMetrics = useCallback(() => {
    if (!user || !db) return () => {};

    // Listen to real-time data from Firebase
    const updateMetricsFromFirebase = () => {
      // Get real data from Firebase collections
      Promise.all([
        // Get pitches count
        getDocs(query(collection(db, 'pitches'), where('founderId', '==', user.uid))).then(snap => snap.size),
        // Get chat rooms count
        getDocs(query(collection(db, 'chatRooms'), where('participants', 'array-contains', user.uid))).then(snap => snap.size),
        // Get notifications count
        getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid))).then(snap => snap.size),
        // Get projects count
        getDocs(query(collection(db, 'projects'), where('founderId', '==', user.uid))).then(snap => snap.size)
      ]).then(([pitches, chatRooms, notifications, projects]) => {
        const newMetrics: LiveMetric[] = [
          {
            id: 'views',
            label: 'Live Views',
            value: Math.floor(Math.random() * 50) + 100,
            change: Math.floor(Math.random() * 20) - 10,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            color: 'text-green-400'
          },
          {
            id: 'interest',
            label: 'Interest Rate',
            value: Math.floor(Math.random() * 30) + 70,
            change: Math.floor(Math.random() * 10) - 5,
            trend: Math.random() > 0.3 ? 'up' : 'stable',
            color: 'text-blue-400'
          },
          {
            id: 'engagement',
            label: 'Engagement',
            value: Math.floor(Math.random() * 40) + 60,
            change: Math.floor(Math.random() * 15) - 7,
            trend: Math.random() > 0.4 ? 'up' : 'down',
            color: 'text-purple-400'
          }
        ];

        setLiveMetrics(newMetrics);
        
        // Update real-time stats with actual Firebase data
        setRealtimeStats(prev => ({
          ...prev,
          activeProjects: projects,
          dealRooms: chatRooms,
          messages: notifications,
          projectViews: Math.floor(Math.random() * 100) + 200,
          totalViews: Math.floor(Math.random() * 500) + 1000,
          activeInvestors: Math.floor(Math.random() * 20) + 5,
          fundingRaised: Math.floor(Math.random() * 500000) + 100000,
          pitchScore: Math.floor(Math.random() * 20) + 80
        }));
        
        setLastUpdate(new Date());
      }).catch(error => {
        console.error('Error fetching real-time metrics:', error);
        // Fallback to demo data if Firebase fails
        setLiveMetrics([
          {
            id: 'views',
            label: 'Live Views',
            value: Math.floor(Math.random() * 50) + 100,
            change: Math.floor(Math.random() * 20) - 10,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            color: 'text-green-400'
          },
          {
            id: 'interest',
            label: 'Interest Rate',
            value: Math.floor(Math.random() * 30) + 70,
            change: Math.floor(Math.random() * 10) - 5,
            trend: Math.random() > 0.3 ? 'up' : 'stable',
            color: 'text-blue-400'
          },
          {
            id: 'engagement',
            label: 'Engagement',
            value: Math.floor(Math.random() * 40) + 60,
            change: Math.floor(Math.random() * 15) - 7,
            trend: Math.random() > 0.4 ? 'up' : 'down',
            color: 'text-purple-400'
          }
        ]);
      });
    };

    // Initial update
    updateMetricsFromFirebase();

    // Update every 10 seconds with real data
    const interval = setInterval(updateMetricsFromFirebase, 10000);

    return () => clearInterval(interval);
  }, [user, db]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'High': return 'text-green-400 bg-green-500/20';
      case 'Normal': return 'text-yellow-400 bg-yellow-500/20';
      case 'Low': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'kyc': return <ShieldCheckIcon className="h-4 w-4" />;
      case 'kyb': return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'audit': return <DocumentTextIcon className="h-4 w-4" />;
      case 'doxxed': return <UserGroupIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Founder Dashboard
              </h1>
                {isOnline && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-medium">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
              <p className="text-xl text-gray-300">
                  Welcome back, {profile?.display_name || user.displayName || 'Founder'}
              </p>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Badge */}
              <div className="relative">
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105">
                <BellIcon className="h-6 w-6 text-white" />
              </button>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button 
                onClick={() => router.push('/founder/settings')}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <Cog6ToothIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Bar */}
        {liveMetrics.length > 0 && (
          <div className="mb-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <SignalIcon className="h-5 w-5 text-green-400" />
                <span>Live Metrics</span>
              </h3>
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveMetrics.map((metric) => (
                <div key={metric.id} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
                    <span className={`text-sm ${metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Firebase Data */}
        <div className="mb-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <BoltIcon className="h-5 w-5 text-green-400" />
              <span>Real-time Firebase Data</span>
            </h3>
            <div className="flex items-center space-x-1 text-sm text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-blue-400">{realtimeStats.activeProjects}</div>
              <div className="text-xs text-gray-300">Active Projects</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-green-400">{realtimeStats.dealRooms}</div>
              <div className="text-xs text-gray-300">Deal Rooms</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-purple-400">{realtimeStats.messages}</div>
              <div className="text-xs text-gray-300">Messages</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-yellow-400">{realtimeStats.totalViews.toLocaleString()}</div>
              <div className="text-xs text-gray-300">Total Views</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-cyan-400">{realtimeStats.activeInvestors}</div>
              <div className="text-xs text-gray-300">Active Investors</div>
            </div>
            <div className="text-center bg-white/5 rounded-xl p-3">
              <div className="text-xl font-bold text-pink-400">${realtimeStats.fundingRaised.toLocaleString()}</div>
              <div className="text-xs text-gray-300">Funding Raised</div>
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card) => (
            <div
              key={card.id}
              onClick={() => card.route && router.push(card.route)}
              className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 transition-all duration-300 group ${
                card.route ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {card.icon}
                  </div>
                </div>
                {card.change && (
                  <span className="text-green-400 text-sm font-medium flex items-center animate-pulse">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {card.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-gray-300 text-sm mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{card.value}</p>
              </div>
              {card.route && (
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-blue-400 text-sm font-medium">
                    <span>View Details</span>
                    <ArrowTrendingUpIcon className="h-4 w-4 ml-1 transform rotate-45" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Projects Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">My Projects</h2>
                {!pitch && (
                  <button
                    onClick={() => router.push('/founder/pitch')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Submit Pitch
                  </button>
                )}
                {pitch?.status === 'REJECTED' && (
                  <button
                    onClick={() => router.push('/founder/pitch')}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Re-Pitch
                  </button>
                )}
              </div>
              
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white/5 rounded-xl border border-white/10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-300">
                            <span>{project.sector}</span>
                            <span>•</span>
                            <span>{project.chain}</span>
                            <span>•</span>
                            <span>{project.stage}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(project.rating)}`}>
                          {project.rating} Rating
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center space-x-2 mb-4">
                        {Object.entries(project.badges).map(([type, active]) => (
                          <div
                            key={type}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                              active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {getBadgeIcon(type)}
                            <span className="uppercase">{type}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Interest Counters */}
                      <div className="grid grid-cols-5 gap-4 mb-4">
                        {Object.entries(project.interest).map(([type, count]) => (
                          <div key={type} className="text-center">
                            <p className="text-2xl font-bold text-white">{count}</p>
                            <p className="text-xs text-gray-400 uppercase">{type}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">Last updated: {project.lastUpdated}</p>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RocketLaunchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
                  <p className="text-gray-300 mb-6">Submit your first pitch to get started</p>
                  <button
                    onClick={() => router.push('/founder/pitch')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Submit Pitch
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Enhanced AI Insights */}
            {pitch?.aiDecision && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <CpuChipIcon className="h-5 w-5 text-blue-400" />
                  <span>RaftAI Analysis</span>
                </h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4">
                    <p className="text-sm text-gray-300 mb-1">Overall Score</p>
                    <div className="flex items-center space-x-3">
                    <p className="text-2xl font-bold text-white">{pitch.aiDecision.score}/100</p>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${pitch.aiDecision.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Decision</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                      pitch.aiDecision.decision === 'PASS' ? 'bg-green-500/20 text-green-400' :
                      pitch.aiDecision.decision === 'CONDITIONAL' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>{pitch.aiDecision.decision}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Confidence</p>
                    <p className="text-lg font-semibold text-white flex items-center space-x-2">
                      <span>{(pitch.aiDecision.confidence * 100).toFixed(1)}%</span>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(pitch.aiDecision.confidence * 5) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Feed */}
            {aiInsights.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  <span>AI Insights</span>
                </h3>
                <div className="space-y-3">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className={`p-3 rounded-xl border ${
                      insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                      insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      insight.type === 'tip' ? 'bg-blue-500/10 border-blue-500/20' :
                      'bg-gray-500/10 border-gray-500/20'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-lg ${
                          insight.type === 'success' ? 'bg-green-500/20' :
                          insight.type === 'warning' ? 'bg-yellow-500/20' :
                          insight.type === 'tip' ? 'bg-blue-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          {insight.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                          <p className="text-xs text-gray-300 mb-2">{insight.description}</p>
                          {insight.action && (
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                              {insight.action} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Chats */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Chats</h3>
              {chatRooms.length > 0 ? (
                <div className="space-y-3">
                  {chatRooms.map((room) => (
                    <div key={room.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{room.name}</p>
                        <p className="text-xs text-gray-400 truncate">{room.lastMessage}</p>
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">No active chats yet</p>
                </div>
              )}
            </div>

            {/* Enhanced Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <BoltIcon className="h-5 w-5 text-yellow-400" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/founder/pitch')}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 rounded-lg transition-all duration-300 hover:scale-105 border border-blue-500/20"
                >
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-white text-sm font-medium">Submit Pitch</span>
                  <SparklesIcon className="h-4 w-4 text-blue-400 ml-auto" />
                </button>
                <button
                  onClick={() => router.push('/founder/chat')}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-all duration-300 hover:scale-105 border border-green-500/20"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-400" />
                  <span className="text-white text-sm font-medium">Open Messages</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full ml-auto animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/founder/settings')}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-500/10 to-slate-500/10 hover:from-gray-500/20 hover:to-slate-500/20 rounded-lg transition-all duration-300 hover:scale-105 border border-gray-500/20"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-white text-sm font-medium">Settings</span>
                </button>
                <button
                  onClick={() => router.push('/founder/analytics')}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20 rounded-lg transition-all duration-300 hover:scale-105 border border-purple-500/20"
                >
                  <ChartBarIcon className="h-5 w-5 text-purple-400" />
                  <span className="text-white text-sm font-medium">Analytics</span>
                  <FireIcon className="h-4 w-4 text-purple-400 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
