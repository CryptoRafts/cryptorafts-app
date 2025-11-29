"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { 
  db,
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc,
  setDoc,
  addDoc,
  Timestamp,
  serverTimestamp
} from '@/lib/firebase.client';
import { limit as firestoreLimit, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import ProjectOverview from './ProjectOverview';
import SpotlightApplication from './SpotlightApplication';
// import PageLoader from './PageLoader';

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
  founderEmail?: string;
  raiseAmount?: number;
  fundingGoal?: number;
  status?: string;
  globalStatus?: string;
  targetRoles?: string[];
  createdAt?: any;
  updatedAt?: any;
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
  milestones?: {
    kyc_verified?: boolean;
    kyb_verified?: boolean;
    dd_completed?: boolean;
    payment_received?: boolean;
    audit_checked?: boolean;
    tokens_received?: boolean;
    campaign_live?: boolean;
  };
  idoAction?: string;
  idoOrgId?: string;
  agencyAction?: string;
  agencyOrgId?: string;
}

interface DashboardMetrics {
  totalProjects: number;
  activePipeline: number;
  totalFunding: number;
  pipelineGrowth: number;
  fundingGrowth: number;
  projectsThisMonth: number;
}

interface BaseRoleDashboardProps {
  roleType: 'exchange' | 'ido' | 'influencer' | 'marketing' | 'agency' | 'vc';
  user: any;
  orgId: string | null;
}

const BaseRoleDashboard: React.FC<BaseRoleDashboardProps> = ({
  roleType,
  user,
  orgId
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dealRooms, setDealRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectOverview, setShowProjectOverview] = useState(false);
  const [showSpotlightApplication, setShowSpotlightApplication] = useState(false);

  // Role-specific configurations
  const roleConfig = {
    vc: {
      title: 'VC Dashboard',
      primaryAction: 'Accept Pitch',
      secondaryAction: 'Decline Pitch',
      teamManagement: true
    },
    exchange: {
      title: 'Exchange Dashboard',
      primaryAction: 'List Token',
      secondaryAction: 'Reject Listing',
      teamManagement: true
    },
    ido: {
      title: 'IDO Dashboard',
      primaryAction: 'Launch IDO',
      secondaryAction: 'Reject IDO',
      teamManagement: true
    },
    agency: {
      title: 'Marketing Agency Dashboard',
      primaryAction: 'Accept Campaign',
      secondaryAction: 'Decline Campaign',
      teamManagement: true
    },
    influencer: {
      title: 'Influencer Dashboard',
      primaryAction: 'Promote Project',
      secondaryAction: 'Reject Promotion',
      teamManagement: false
    },
    marketing: {
      title: 'Marketing Dashboard',
      primaryAction: 'Create Campaign',
      secondaryAction: 'Reject Campaign',
      teamManagement: false
    }
  };

  const config = roleConfig[roleType];

  // Function to fix existing projects missing targetRoles
  const fixExistingProjects = async () => {
    if (!db) {
      console.error('Firestore not available');
      return;
    }
    
    try {
      console.log('🔧 Fixing existing projects...');
      const projectsRef = collection(db!, 'projects');
      const snapshot = await getDocs(projectsRef);
      
      const batch = writeBatch(db);
      let fixedCount = 0;
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Add targetRoles if missing
        if (!data.targetRoles || data.targetRoles.length === 0) {
          batch.update(doc.ref, {
            targetRoles: ['exchange', 'vc', 'ido'],
            updatedAt: serverTimestamp()
          });
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        await batch.commit();
        console.log(`✅ Fixed ${fixedCount} projects with missing targetRoles`);
      } else {
        console.log('✅ No projects needed fixing');
      }
    } catch (error) {
      console.error('❌ Error fixing projects:', error);
    }
  };

  // Log project data for debugging real-time updates
  useEffect(() => {
    if (projects.length > 0) {
      console.log('📊 Real-Time Projects Loaded:', projects.length);
      console.log('📋 Projects for', roleType, ':', projects.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        founderId: p.founderId,
        targetRoles: p.targetRoles
      })));
    }
  }, [projects, roleType]);

  // Set up real-time projects listener
  useEffect(() => {
    if (!user || !orgId) return;

    console.log('BaseRoleDashboard: Setting up projects query for role:', roleType);
    if (!db) return;
    
    const projectsQuery = query(
      collection(db!, 'projects'),
      where('targetRoles', 'array-contains', roleType),
      firestoreLimit(100)
    );
    
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      console.log('BaseRoleDashboard: Raw snapshot docs:', snapshot.docs.length);
      
        const projects = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Ensure unique project ID and proper data structure with role-specific status
          const roleSpecificAction = data[`${roleType}Action`] || 'pending';
          
          // Use real RaftAI data or minimal defaults
          const raftaiData = data.raftai || {
            rating: 'Pending',
            score: 0,
            summary: 'RaftAI analysis pending',
            risks: [],
            recommendations: [],
            teamScore: 0,
            technicalScore: 0,
            marketScore: 0
          };

          // Use real milestones data
          const milestonesData = data.milestones || {
            kyc_verified: false,
            kyb_verified: false,
            dd_completed: false,
            payment_received: false,
            audit_checked: false,
            tokens_received: false,
            campaign_live: false
          };
          
          const project = {
            id: doc.id,
            title: data.title || data.name || 'Untitled Project',
            name: data.name || data.title,
            tagline: data.tagline || data.description,
            description: data.description || data.tagline || data.solution || 'No description available',
            logoUrl: data.logoUrl || data.logo || '/cryptorafts.logo.png',
            sector: data.sector || data.category || 'Other',
            stage: data.stage || data.fundingStage || 'Seed',
            fundingStage: data.fundingStage || data.stage || 'Seed',
            country: data.country || 'Unknown',
            founderName: data.founderName || data.founder?.displayName || data.founderEmail?.split('@')[0] || 'Unknown Founder',
            founderId: data.founderId || 'unknown',
            founderEmail: data.founderEmail || '',
            raiseAmount: data.fundingGoal || data.raiseAmount || 0,
            fundingGoal: data.fundingGoal || data.raiseAmount || 0,
            status: roleSpecificAction, // Use role-specific status instead of global
            globalStatus: data.status || 'pending', // Keep global status for reference
            targetRoles: data.targetRoles || [],
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date()),
            problem: data.problem || '',
            solution: data.solution || '',
            marketSize: data.marketSize || '',
            businessModel: data.businessModel || '',
            teamSize: data.teamSize || 'N/A',
            chain: data.chain || data.blockchain || 'Ethereum',
            team: data.team || [
              {
                name: data.founderName || 'Project Founder',
                role: 'Founder & CEO',
                bio: 'Project founder with expertise in blockchain technology',
                linkedin: '',
                image: ''
              }
            ],
            documents: data.documents || [
              {
                name: 'Project Whitepaper',
                type: 'pdf',
                url: '#',
                size: '2.1 MB',
                uploadedAt: { seconds: Date.now() / 1000 - 86400 }
              }
            ],
            raftai: raftaiData,
            milestones: milestonesData // Add milestones
          };
          
          return project;
        });
        
        setProjects(projects);
        console.log('BaseRoleDashboard: Projects updated in real-time:', projects.length);
        console.log('BaseRoleDashboard: Processed project data:', projects);
        console.log('BaseRoleDashboard: Role type:', roleType);
      }, (error) => {
        console.error('BaseRoleDashboard: Error in projects listener:', error);
      });

    return () => {
      unsubscribeProjects();
    };
  }, [user, orgId, roleType]);

  // Set up real-time deal rooms listener
  useEffect(() => {
    if (!user || !orgId) return;

    if (!db) return;
    
    const dealRoomsQuery = query(
      collection(db!, 'dealRooms'),
      where('participants', 'array-contains', user.uid),
      firestoreLimit(50)
    );
    
    const unsubscribeDealRooms = onSnapshot(dealRoomsQuery, (snapshot) => {
      const dealRooms = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled Deal Room',
          projectName: data.projectName || 'Unknown Project',
          founderName: data.founderName || 'Unknown Founder',
          vcName: data.vcName || 'Unknown VC',
          vcLogo: data.vcLogo || '/cryptorafts.logo.png',
          status: data.status || 'active',
          lastMessage: data.lastMessage || 'No messages yet',
          unreadCount: data.unreadCount || 0,
          members: data.participants || [],
          createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
          lastActivity: data.lastActivity?.toDate?.() || (data.lastActivity ? new Date(data.lastActivity) : new Date())
        };
      }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()); // Sort by last activity in memory
      
      setDealRooms(dealRooms);
      console.log('BaseRoleDashboard: Deal rooms updated in real-time:', dealRooms.length);
    });
    
    return unsubscribeDealRooms;
  }, [orgId]);

  // Calculate metrics
  useEffect(() => {
    if (projects.length === 0) return;

    const allProjects = projects;
    
    // Calculate time-based metrics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Projects this month
    const projectsThisMonth = allProjects.filter(project => {
      const createdAt = project.createdAt?.toDate?.() || new Date(project.createdAt);
      return createdAt >= thisMonth;
    }).length;
    
    // Projects last month for growth calculation
    const projectsLastMonth = allProjects.filter(project => {
      const createdAt = project.createdAt?.toDate?.() || new Date(project.createdAt);
      return createdAt >= lastMonth && createdAt < thisMonth;
    }).length;
    
    // Active pipeline (pending + in_progress)
    const activePipeline = allProjects.filter(project => 
      project.status === 'pending' || project.status === 'in_progress'
    ).length;
    
    // Calculate pipeline growth
    const pipelineGrowth = projectsLastMonth > 0 
      ? Math.round(((projectsThisMonth - projectsLastMonth) / projectsLastMonth) * 100)
      : projectsThisMonth > 0 ? 100 : 0;
    
    // Total funding (sum of all funding goals)
    const totalFunding = allProjects.reduce((sum, project) => {
      return sum + (project.fundingGoal || 0);
    }, 0);
    
    // Calculate funding growth (approximation based on this month's projects)
    const fundingThisMonth = allProjects.filter(project => {
      const createdAt = project.createdAt?.toDate?.() || new Date(project.createdAt);
      return createdAt >= thisMonth;
    }).reduce((sum, project) => sum + (project.fundingGoal || 0), 0);
    
    const fundingLastMonth = totalFunding - fundingThisMonth;
    const fundingGrowth = fundingLastMonth > 0 
      ? Math.round((fundingThisMonth / fundingLastMonth) * 100)
      : fundingThisMonth > 0 ? 100 : 0;
    
    setMetrics({
      totalProjects: allProjects.length,
      activePipeline,
      totalFunding,
      pipelineGrowth,
      fundingGrowth,
      projectsThisMonth
    });
  }, [projects]);

  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      if (!user || !orgId) return;
      
      setIsLoading(true);
      
      try {
        // Fix existing projects first
        await fixExistingProjects();
        
        // Set up real-time listeners (already done in other useEffects)
        // The listeners will update the state automatically
        
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, orgId]);

  const handleProjectOverview = (project: Project) => {
    setSelectedProject(project);
    setShowProjectOverview(true);
  };

  const handleAcceptProject = async (projectId: string) => {
    if (!user) return;
    
    try {
      console.log(`✅ [BASE-DASHBOARD] Accepting project: ${projectId}`);
      console.log(`✅ [BASE-DASHBOARD] Role: ${roleType}`);
      console.log(`🔄 [BASE-DASHBOARD] Using client-side Firebase for ${roleType}...`);
      
      // Get the project data first
      if (!db) {
        console.error('❌ Database not available');
        alert('❌ Database not available');
        return;
      }
      
      const projectRef = doc(db!, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.error('❌ Project not found');
        alert('❌ Project not found');
        return;
      }
      
      const projectData = projectSnap.data();
      
      // Update project status in Firestore
      await updateDoc(projectRef, {
        [`${roleType}Action`]: 'accepted',
        [`${roleType}ActionAt`]: Timestamp.now(),
        [`${roleType}OrgId`]: orgId,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ [BASE-DASHBOARD] Project ${projectId} accepted successfully`);
      
      // Create deal room/chat group directly with client-side Firebase
      try {
        console.log(`🔄 [BASE-DASHBOARD] Creating chat room for project ${projectId}...`);
        
        // Get user profile for names
        if (!db) return;
        
        const userDoc = await getDoc(doc(db!, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const founderDoc = await getDoc(doc(db!, 'users', projectData.founderId));
        const founderData = founderDoc.exists() ? founderDoc.data() : {};
        
        const yourOrgName = userData.displayName || userData.companyName || userData.organizationName || `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Partner`;
        const founderName = founderData.displayName || founderData.companyName || projectData.founderName || 'Founder';
        const yourLogo = userData.photoURL || userData.logo || null;
        const founderLogo = founderData.photoURL || founderData.logo || null;
        
        // Create unique chat room ID
        const chatId = `deal_${projectData.founderId}_${user.uid}_${projectId}`;
        const chatRef = doc(db!, 'groupChats', chatId);
        
        // Check if room already exists
        const existingChat = await getDoc(chatRef);
        
        if (!existingChat.exists()) {
          // Determine room type based on role
          let roomType = 'deal';
          if (roleType === 'exchange') roomType = 'listing';
          else if (roleType === 'ido') roomType = 'ido';
          else if (roleType === 'influencer' || roleType === 'marketing') roomType = 'campaign';
          
          // Role-specific welcome messages
          const welcomeMessages = {
            'vc': `🤖 RaftAI initialized this deal room for ${founderName} and ${yourOrgName}. I'll be monitoring this conversation and providing insights!`,
            'exchange': `🎉 RaftAI created this listing room for ${founderName} and ${yourOrgName}. Discuss your token listing here!`,
            'ido': `🚀 RaftAI created this IDO room for ${founderName} and ${yourOrgName}. Plan your token sale here!`,
            'influencer': `📢 RaftAI created this campaign room for ${founderName} and ${yourOrgName}. Plan your marketing campaign here!`,
            'marketing': `🎯 RaftAI created this collaboration room for ${founderName} and ${yourOrgName}. Let's build something amazing together!`
          };
          
          await setDoc(chatRef, {
            name: `${projectData.title || projectData.name || 'Project'} - ${founderName} / ${yourOrgName}`,
            type: roomType,
            status: 'active',
            
            founderId: projectData.founderId,
            founderName,
            founderLogo,
            
            counterpartId: user.uid,
            counterpartName: yourOrgName,
            counterpartRole: roleType,
            counterpartLogo: yourLogo,
            
            projectId,
            members: [projectData.founderId, user.uid, 'raftai'],
            memberRoles: {
              [projectData.founderId]: 'owner',
              [user.uid]: 'member',
              'raftai': 'admin'
            },
            memberNames: {
              [projectData.founderId]: founderName,
              [user.uid]: yourOrgName,
              'raftai': 'RaftAI'
            },
            memberAvatars: {
              [projectData.founderId]: founderLogo,
              [user.uid]: yourLogo,
              'raftai': null
            },
            
            settings: {
              filesAllowed: true,
              maxFileSize: 100,
              voiceNotesAllowed: true,
              videoCallAllowed: true
            },
            
            createdAt: Date.now(),
            createdBy: user.uid,
            lastActivityAt: Date.now(),
            lastMessage: {
              senderId: 'raftai',
              senderName: 'RaftAI',
              text: 'Deal room created!',
              createdAt: Date.now()
            },
            pinnedMessages: [],
            mutedBy: [],
            
            // Initialize unread counts for all members
            unreadCount: {
              [projectData.founderId]: 0,
              [user.uid]: 0,
              'raftai': 0
            },
            
            raftaiMemory: {
              decisions: [],
              tasks: [],
              milestones: [],
              notePoints: []
            }
          });
          
          // Add welcome message with role-specific text
          if (!db) return;
          const messagesRef = collection(db!, 'groupChats', chatId, 'messages');
          await addDoc(messagesRef, {
            senderId: 'raftai',
            senderName: 'RaftAI',
            senderAvatar: null,
            type: 'system',
            text: welcomeMessages[roleType as keyof typeof welcomeMessages] || welcomeMessages['vc'],
            reactions: {},
            readBy: [],
            isPinned: false,
            isEdited: false,
            isDeleted: false,
            createdAt: Date.now()
          });
          
          console.log(`✅ Chat room created successfully: ${chatId}`);
        } else {
          console.log(`✅ Chat room already exists: ${chatId}`);
        }
        
        // Redirect to messages page with the chat room
        console.log(`🚀 Redirecting to chat room: ${chatId}`);
        if (typeof window !== 'undefined') {
          window.location.href = `/messages?room=${chatId}`;
        }
        return; // Exit early after redirect
        
      } catch (chatError: any) {
        console.error('❌ Error creating chat room:', chatError);
        console.error('❌ Error details:', chatError?.message);
        console.error('❌ Error code:', chatError?.code);
        console.error('❌ Full error:', JSON.stringify(chatError, null, 2));
        
        const errorMsg = chatError?.message || chatError?.code || 'Unknown error';
        alert(`⚠️ Project accepted, but chat room creation failed.\n\nError: ${errorMsg}\n\nPlease check console or try again.`);
      }
      
    } catch (error) {
      console.error('❌ Error accepting project:', error);
      alert(`❌ Failed to accept project. Please try again.`);
    }
  };

  const handleDeclineProject = async (projectId: string) => {
    if (!db) return;
    
    try {
      console.log(`🔄 Declining project: ${projectId}`);
      const projectRef = doc(db!, 'projects', projectId);
      
      await updateDoc(projectRef, {
        [`${roleType}Action`]: 'declined',
        [`${roleType}ActionAt`]: Timestamp.now(),
        [`${roleType}OrgId`]: orgId,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ Project ${projectId} declined successfully`);
    } catch (error) {
      console.error('❌ Error declining project:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    // Filter out only obvious test/demo projects
    const isDemoOrTestProject = 
      project.title?.toLowerCase().includes('test') ||
      project.title?.toLowerCase().includes('demo') ||
      project.title?.toLowerCase().includes('mock') ||
      project.founderName?.toLowerCase().includes('test') ||
      project.founderName?.toLowerCase().includes('demo') ||
      project.founderId?.toLowerCase().includes('test') ||
      project.founderId?.toLowerCase().includes('demo') ||
      project.founderId?.includes('founder_'); // Only demo IDs starting with founder_
    
    // EXCLUDE demo/test projects - ONLY SHOW REAL PROJECTS
    if (isDemoOrTestProject) {
      console.log('Filtering out demo project:', project.title, project.founderId);
      return false;
    }
    
    // Show projects that target the current role
    const targetsCurrentRole = project.targetRoles && 
                               project.targetRoles.length > 0 && 
                               project.targetRoles.includes(roleType);
    
    if (!targetsCurrentRole) {
      console.log('Project does not target role', roleType, ':', project.title, 'targetRoles:', project.targetRoles);
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        project.title?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.founderName?.toLowerCase().includes(searchLower) ||
        project.sector?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      if (project.status !== filterStatus) return false;
    }
    
    return true;
  });

  console.log(`\n📊 ${roleType.toUpperCase()} DASHBOARD - Project Summary:`);
  console.log(`📋 Total projects fetched: ${projects.length}`);
  console.log(`✅ Filtered projects (real only): ${filteredProjects.length}`);
  console.log(`⏳ Pending: ${filteredProjects.filter(p => p.status === 'pending').length}`);
  console.log(`✓ Accepted: ${filteredProjects.filter(p => p.status === 'accepted').length}`);
  console.log(`✗ Declined: ${filteredProjects.filter(p => p.status === 'declined').length}`);
  
  if (projects.length > 0) {
    console.log(`\n📁 All Projects (before filtering):`);
    projects.forEach(p => {
      console.log(`  - ${p.title} | Founder: ${p.founderId?.substring(0, 8)}... | Targets: [${p.targetRoles?.join(', ')}]`);
    });
  }
  
  if (filteredProjects.length > 0) {
    console.log(`\n✅ Filtered Projects (showing):`);
    filteredProjects.forEach(p => {
      console.log(`  - ${p.title} | Status: ${p.status} | Score: ${p.raftai?.score}`);
    });
  } else {
    console.log(`\n⚠️ No projects showing. Waiting for founders to submit projects with targetRoles: ['${roleType}']`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/20 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/20">

      {/* Navigation Tabs */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: () => <NeonCyanIcon type="dashboard" size={20} className="text-current" /> },
              ...(roleType !== 'ido' ? [{ id: 'projects', label: 'Projects', icon: () => <NeonCyanIcon type="analytics" size={20} className="text-current" /> }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
            {/* For IDO, add link to Projects page instead of tab */}
            {roleType === 'ido' && (
              <Link
                href="/ido/projects"
                className="flex items-center space-x-2 py-4 border-b-2 border-transparent text-white/60 hover:text-white transition-colors"
              >
                <NeonCyanIcon type="analytics" size={20} className="text-current" />
                <span className="font-medium">Projects</span>
              </Link>
            )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Refresh page"
              >
                <NeonCyanIcon type="arrow-right" size={20} className="text-white" />
              </button>

              {/* Team Management Button */}
              {config.teamManagement && (
                <Link 
                  href={`/${roleType}/settings/team`}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <NeonCyanIcon type="users" size={20} className="text-current" />
                  <span>Team</span>
                </Link>
              )}

              {/* Spotlight Application Button */}
              <button
                onClick={() => setShowSpotlightApplication(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
              >
                <NeonCyanIcon type="star" size={20} className="text-current" />
                <span>Apply for Spotlight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-xl p-6 border border-white/10 bg-black/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Total Projects</p>
                      <p className="text-2xl font-bold text-white">{filteredProjects.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <NeonCyanIcon type="analytics" size={24} className="text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-white/10 bg-black/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Active Pipeline</p>
                      <p className="text-2xl font-bold text-white">{filteredProjects.filter(p => p.status === 'pending').length}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <NeonCyanIcon type="clock" size={24} className="text-yellow-400" />
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-white/10 bg-black/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Accepted</p>
                      <p className="text-2xl font-bold text-white">{filteredProjects.filter(p => p.status === 'accepted').length}</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <NeonCyanIcon type="check" size={24} className="text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-white/10 bg-black/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">This Month</p>
                      <p className="text-2xl font-bold text-white">{filteredProjects.filter(p => {
                        const now = new Date();
                        const projectDate = new Date(p.createdAt?.toDate?.() || p.createdAt || now);
                        return projectDate.getMonth() === now.getMonth() && projectDate.getFullYear() === now.getFullYear();
                      }).length}</p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <NeonCyanIcon type="chart" size={24} className="text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* New Pitch Projects Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {roleType === 'exchange' ? 'New Listing Requests' :
                       roleType === 'ido' ? 'New IDO Applications' :
                       roleType === 'agency' ? 'New Campaign Requests' :
                       roleType === 'influencer' ? 'New Promotion Requests' :
                       'New Pitch Projects'}
                    </h2>
                    <p className="text-white/70">
                      {roleType === 'exchange' ? 'Recent token listing submissions awaiting your review' :
                       roleType === 'ido' ? 'Recent IDO launch applications awaiting your review' :
                       roleType === 'agency' ? 'Recent marketing campaign requests awaiting your review' :
                       roleType === 'influencer' ? 'Recent promotion requests awaiting your review' :
                       'Recent project submissions awaiting your review'}
                    </p>
                  </div>
                  <div className="text-white/50 text-sm">
                    {filteredProjects.filter(p => p.status === 'pending').length} pending review
                  </div>
                </div>

                {filteredProjects.filter(p => p.status === 'pending').length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center border border-white/10 bg-black/20 backdrop-blur-sm">
                    <div className="text-white/50 text-lg mb-2">
                      {roleType === 'exchange' ? 'No new listing requests' :
                       roleType === 'ido' ? 'No new IDO applications' :
                       roleType === 'agency' ? 'No new campaign requests' :
                       roleType === 'influencer' ? 'No new promotion requests' :
                       'No new pitch projects'}
                    </div>
                    <p className="text-white/30">
                      All caught up! Check back later for new submissions.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.filter(p => p.status === 'pending').slice(0, 6).map((project) => {
                      const getRatingColor = (rating?: string) => {
                        switch (rating) {
                          case 'High': return 'text-green-400 bg-green-500/20 border-green-500/30';
                          case 'Normal': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
                          case 'Low': return 'text-red-400 bg-red-500/20 border-red-500/30';
                          default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
                        }
                      };

                      const getRiskLevel = (score?: number) => {
                        if (!score) return { level: 'Unknown', color: 'text-gray-400' };
                        if (score >= 75) return { level: 'Low Risk', color: 'text-green-400' };
                        if (score >= 50) return { level: 'Medium Risk', color: 'text-yellow-400' };
                        return { level: 'High Risk', color: 'text-red-400' };
                      };

                      const riskInfo = getRiskLevel(project.raftai?.score);

                      return (
                        <div key={project.id} className="glass rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 border border-white/10 shadow-lg hover:shadow-xl bg-black/20 backdrop-blur-sm">
                          {/* Project Header */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-white font-bold text-xl flex-1 leading-tight">
                                {project.title || 'Untitled Project'}
                              </h3>
                              {project.raftai?.rating && (
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getRatingColor(project.raftai.rating)}`}>
                                  {project.raftai.rating}
                                </span>
                              )}
                            </div>
                            <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
                              {project.description || 'No description provided'}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                              <NeonCyanIcon type="clock" size={16} className="text-current mr-1" />
                              Pending Review
                            </span>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-white/50 text-sm">Sector</span>
                              <span className="text-white text-sm font-medium">{project.sector || 'Other'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-white/50 text-sm">Funding Goal</span>
                              <span className="text-white text-sm font-medium">
                                ${project.fundingGoal ? (project.fundingGoal / 1000000).toFixed(1) + 'M' : 'N/A'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-white/50 text-sm">Founder</span>
                              <span className="text-white text-sm font-medium">{project.founderName || 'Unknown'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-white/50 text-sm">AI Score</span>
                              <span className={`text-sm font-bold ${riskInfo.color}`}>
                                {project.raftai?.score || 0}/100
                              </span>
                            </div>
                          </div>

                          {/* RaftAI Analysis Preview */}
                          {project.raftai && (
                            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-center space-x-2 mb-2">
                                <NeonCyanIcon type="sparkles" size={16} className="text-blue-400" />
                                <span className="text-white text-sm font-medium">RaftAI Analysis</span>
                              </div>
                              <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                                {project.raftai.summary || 'Analysis available in project details'}
                              </p>
                            </div>
                          )}

                          {/* Milestones Progress - Show for pending projects */}
                          {project.milestones && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-xs font-semibold">Campaign Readiness</span>
                                <span className="text-white/60 text-xs">
                                  {Object.values(project.milestones).filter(Boolean).length}/{Object.keys(project.milestones).length}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className={`text-center px-2 py-1 rounded text-xs ${project.milestones.kyc_verified ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                                  {project.milestones.kyc_verified ? '✓' : '○'} KYC
                                </div>
                                <div className={`text-center px-2 py-1 rounded text-xs ${project.milestones.kyb_verified ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                                  {project.milestones.kyb_verified ? '✓' : '○'} KYB
                                </div>
                                <div className={`text-center px-2 py-1 rounded text-xs ${project.milestones.payment_received ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                                  {project.milestones.payment_received ? '✓' : '○'} Payment
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleProjectOverview(project)}
                              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                            >
                              {roleType === 'exchange' ? 'Review Listing' :
                               roleType === 'ido' ? 'Review IDO' :
                               roleType === 'agency' ? 'Review Campaign' :
                               roleType === 'influencer' ? 'Review Promotion' :
                               'Review'}
                            </button>
                            
                            <button
                              onClick={() => handleAcceptProject(project.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
                              title={roleType === 'exchange' ? 'List Token' :
                                     roleType === 'ido' ? 'Launch IDO' :
                                     roleType === 'agency' ? 'Accept Campaign' :
                                     roleType === 'influencer' ? 'Accept Promotion' :
                                     'Accept'}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeclineProject(project.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                              title={roleType === 'exchange' ? 'Reject Listing' :
                                     roleType === 'ido' ? 'Reject IDO' :
                                     roleType === 'agency' ? 'Reject Campaign' :
                                     roleType === 'influencer' ? 'Reject Promotion' :
                                     'Decline'}
                            >
                              <NeonCyanIcon type="close" size={16} className="text-current" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* View All Link - Show if there are any pending projects */}
                {filteredProjects.filter(p => p.status === 'pending').length > 0 && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        setFilterStatus('pending');
                        setActiveTab('projects');
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      View All {filteredProjects.filter(p => p.status === 'pending').length} {
                        roleType === 'exchange' ? 'Pending Applications' :
                        roleType === 'ido' ? 'Pending IDO Applications' :
                        roleType === 'agency' ? 'Pending Applications' :
                        roleType === 'influencer' ? 'Pending Promotion Requests' :
                        'Pending Projects'
                      }
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Projects Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {filterStatus === 'pending' ? (
                      roleType === 'exchange' ? 'Pending Listing Requests' :
                      roleType === 'ido' ? 'Pending IDO Applications' :
                      roleType === 'agency' ? 'Pending Campaign Requests' :
                      roleType === 'influencer' ? 'Pending Promotion Requests' :
                      'Pending Projects'
                    ) : filterStatus === 'accepted' ? (
                      roleType === 'exchange' ? 'Listed Tokens' :
                      roleType === 'ido' ? 'Active IDOs' :
                      roleType === 'agency' ? 'Active Campaigns' :
                      roleType === 'influencer' ? 'Promoted Projects' :
                      'Accepted Projects'
                    ) : filterStatus === 'declined' ? (
                      'Declined Projects'
                    ) : (
                      'All Projects'
                    )}
                  </h2>
                  <p className="text-white/70">
                    {filterStatus === 'pending' ? (
                      'Review and manage pending submissions'
                    ) : filterStatus === 'accepted' ? (
                      roleType === 'exchange' ? 'Tokens you\'ve listed and are managing' :
                      roleType === 'ido' ? 'IDOs you\'ve launched and are managing' :
                      roleType === 'agency' ? 'Campaigns you\'ve accepted and are managing' :
                      roleType === 'influencer' ? 'Projects you\'re promoting' :
                      'Projects you\'ve approved and are working with'
                    ) : filterStatus === 'declined' ? (
                      'Projects you\'ve declined'
                    ) : (
                      'All projects across all statuses'
                    )}
                  </p>
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all" className="bg-gray-800 text-white">All Projects</option>
                    <option value="pending" className="bg-gray-800 text-white">Pending</option>
                    <option value="accepted" className="bg-gray-800 text-white">Accepted</option>
                    <option value="declined" className="bg-gray-800 text-white">Declined</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Projects Grid - Show filtered projects based on status filter */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-white/50 text-lg mb-4">
                    {filterStatus === 'pending' ? 'No pending projects' :
                     filterStatus === 'accepted' ? (
                       roleType === 'exchange' ? 'No listed tokens yet' :
                       roleType === 'ido' ? 'No active IDOs yet' :
                       roleType === 'agency' ? 'No active campaigns yet' :
                       roleType === 'influencer' ? 'No promoted projects yet' :
                       'No accepted projects yet'
                     ) :
                     filterStatus === 'declined' ? 'No declined projects' :
                     'No projects found'}
                  </div>
                  <p className="text-white/30">
                    {filterStatus === 'pending' ? 'All caught up! Check back later for new submissions.' :
                     filterStatus === 'accepted' ? (
                       roleType === 'exchange' ? 'Go to the Dashboard tab to review and accept new listing requests' :
                       roleType === 'ido' ? 'Go to the Dashboard tab to review and accept new IDO applications' :
                       roleType === 'agency' ? 'Go to the Dashboard tab to review and accept new campaign requests' :
                       roleType === 'influencer' ? 'Go to the Dashboard tab to review and accept new promotion requests' :
                       'Go to the Dashboard tab to review and accept new project submissions'
                     ) :
                     'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const getRatingColor = (rating?: string) => {
                      switch (rating) {
                        case 'High': return 'text-green-400 bg-green-500/20 border-green-500/30';
                        case 'Normal': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
                        case 'Low': return 'text-red-400 bg-red-500/20 border-red-500/30';
                        default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
                      }
                    };

                    const getRiskLevel = (score?: number) => {
                      if (!score) return { level: 'Unknown', color: 'text-gray-400' };
                      if (score >= 75) return { level: 'Low Risk', color: 'text-green-400' };
                      if (score >= 50) return { level: 'Medium Risk', color: 'text-yellow-400' };
                      return { level: 'High Risk', color: 'text-red-400' };
                    };

                    const riskInfo = getRiskLevel(project.raftai?.score);

                    return (
                      <div key={project.id} className="glass rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 border border-white/10 shadow-lg hover:shadow-xl bg-black/20 backdrop-blur-sm">
                        {/* Project Header */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-white font-bold text-xl flex-1 leading-tight">
                              {project.title || 'Untitled Project'}
                            </h3>
                            {project.raftai?.rating && (
                              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getRatingColor(project.raftai.rating)}`}>
                                {project.raftai.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
                            {project.description || 'No description provided'}
                          </p>
                        </div>

                        {/* Project Details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-white/50 text-sm">Sector</span>
                            <span className="text-white text-sm font-medium">{project.sector || 'Other'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white/50 text-sm">Stage</span>
                            <span className="text-white text-sm font-medium">{project.fundingStage || project.stage || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white/50 text-sm">Funding Goal</span>
                            <span className="text-white text-sm font-medium">
                              ${project.fundingGoal ? (project.fundingGoal / 1000000).toFixed(1) + 'M' : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white/50 text-sm">Founder</span>
                            <span className="text-white text-sm font-medium">{project.founderName || 'Unknown'}</span>
                          </div>
                        </div>

                        {/* RaftAI Analysis */}
                        {project.raftai && (
                          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <SparklesIcon className="w-5 h-5 text-blue-400" />
                                <span className="text-white font-medium">RaftAI Analysis</span>
                              </div>
                              <span className={`text-sm font-bold ${riskInfo.color}`}>
                                {project.raftai.score}/100
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/70">Risk Level</span>
                                <span className={riskInfo.color}>{riskInfo.level}</span>
                              </div>
                              
                              {project.raftai.summary && (
                                <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                                  {project.raftai.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Milestones - Show for accepted projects */}
                        {project.status === 'accepted' && project.milestones && (
                          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              <span className="text-white font-semibold text-sm">Campaign Milestones</span>
                            </div>
                            
                            <div className="space-y-2">
                              {[
                                { key: 'kyc_verified', label: 'KYC Verified', icon: '🔐' },
                                { key: 'kyb_verified', label: 'KYB Verified', icon: '🏢' },
                                { key: 'dd_completed', label: 'Due Diligence', icon: '📋' },
                                { key: 'payment_received', label: 'Payment Received', icon: '💰' },
                                { key: 'audit_checked', label: 'Audit Completed', icon: '✅' },
                                { key: 'campaign_live', label: 'Campaign Live', icon: '🚀' }
                              ].map(({ key, label, icon }) => (
                                <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span>{icon}</span>
                                    <span className="text-white/80 text-xs">{label}</span>
                                  </div>
                                  {project.milestones && project.milestones[key as keyof typeof project.milestones] ? (
                                    <span className="text-green-400 text-xs font-bold">✓ Done</span>
                                  ) : (
                                    <span className="text-white/40 text-xs">Pending</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-white/70 text-xs font-medium">Progress</span>
                                <span className="text-white/60 text-xs">
                                  {Math.round((Object.values(project.milestones).filter(Boolean).length / Object.keys(project.milestones).length) * 100)}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                                  style={{ width: `${(Object.values(project.milestones).filter(Boolean).length / Object.keys(project.milestones).length) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleProjectOverview(project)}
                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                          >
                            View Details
                          </button>
                          
                          {project.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptProject(project.id)}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Accept</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeclineProject(project.id)}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <NeonCyanIcon type="close" size={16} className="text-current" />
                                <span>Decline</span>
                              </button>
                            </>
                          )}
                          
                          {project.status === 'accepted' && (
                            <button
                              onClick={() => {
                                // Navigate to messages for this project's chat room
                                const chatId = `deal_${project.founderId}_${user.uid}_${project.id}`;
                                window.location.href = `/messages?room=${chatId}`;
                              }}
                              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Open Chat</span>
                            </button>
                          )}
                          
                          {project.status === 'declined' && (
                            <div className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-center">
                              Declined
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Project Overview Modal */}
      {showProjectOverview && selectedProject && (
        <ProjectOverview
          project={selectedProject}
          isOpen={showProjectOverview}
          onClose={() => {
            setShowProjectOverview(false);
            setSelectedProject(null);
          }}
          onAccept={handleAcceptProject}
          onDecline={handleDeclineProject}
          userRole={roleType}
          onExchangeAction={roleType === 'exchange' ? (projectId: string, action: 'list' | 'reject') => {
            if (action === 'list') {
              handleAcceptProject(projectId);
            } else {
              handleDeclineProject(projectId);
            }
          } : undefined}
          onIDOAction={roleType === 'ido' ? (projectId: string, action: 'launch' | 'reject') => {
            if (action === 'launch') {
              handleAcceptProject(projectId);
            } else {
              handleDeclineProject(projectId);
            }
          } : undefined}
          onInfluencerAction={undefined}
          onMarketingAction={undefined}
        />
      )}

      {/* Spotlight Application Modal */}
      {showSpotlightApplication && (
        <SpotlightApplication
          onClose={() => setShowSpotlightApplication(false)}
          onSuccess={() => {
            setShowSpotlightApplication(false);
            alert('✅ Spotlight application submitted! Admin will review it shortly.');
          }}
        />
      )}
    </div>
  );
};

export default BaseRoleDashboard;
