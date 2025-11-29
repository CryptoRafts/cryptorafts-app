"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PitchDocument {
  id: string;
  title: string;
  description: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  projectName: string;
  fundingGoal: number;
  currentFunding: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  rejectionReason?: string;
  raftAIReview?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
    marketPotential: 'low' | 'medium' | 'high';
    technicalFeasibility: 'low' | 'medium' | 'high';
    teamStrength: 'low' | 'medium' | 'high';
    fundingAsk: 'reasonable' | 'high' | 'excessive';
    overallRating: number;
    reviewDate: any;
  };
  tags: string[];
  teamSize: number;
  stage: string;
  location: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
  };
  documents: {
    pitchDeck?: any;
    whitepaper?: any;
    tokenomics?: any;
    roadmap?: any;
  };
  analytics: {
    views: number;
    interestedInvestors: number;
    meetingsScheduled: number;
    lastViewed?: any;
  };
}

export default function AdminPitchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pitches, setPitches] = useState<PitchDocument[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<PitchDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPitch, setSelectedPitch] = useState<PitchDocument | null>(null);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
    totalFunding: 0,
    averageScore: 0,
    highPriority: 0
  });

  useEffect(() => {
    // Check authentication
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
                setupRealtimeUpdates();
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

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...pitches];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(pitch => 
        pitch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.founderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.founderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt?.toDate?.() || 0).getTime() - new Date(a.submittedAt?.toDate?.() || 0).getTime();
        case 'oldest':
          return new Date(a.submittedAt?.toDate?.() || 0).getTime() - new Date(b.submittedAt?.toDate?.() || 0).getTime();
        case 'score':
          return (b.raftAIReview?.score || 0) - (a.raftAIReview?.score || 0);
        case 'funding':
          return (b.fundingGoal || 0) - (a.fundingGoal || 0);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    setFilteredPitches(filtered);
  }, [pitches, searchTerm, statusFilter, priorityFilter, sortBy]);

  const setupRealtimeUpdates = async () => {
    try {
      console.log('🔄 Setting up real-time pitch updates...');
      
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
      
      const { onSnapshot, collection, query, orderBy, where } = await import('firebase/firestore');
      
      // Listen for pitch changes from projects collection
      const pitchesUnsubscribe = onSnapshot(
        query(collection(dbInstance, 'projects'), orderBy('submittedAt', 'desc')), 
        (snapshot) => {
          console.log('📊 [PITCH] Real-time update received:', snapshot.docs.length, 'documents');
          console.log('📊 [PITCH] Sample data:', snapshot.docs[0]?.data());
          
          const pitchesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.projectName || data.title || 'Untitled Project',
              description: data.description || data.valueProposition || '',
              founderId: data.founderId || data.userId || '',
              founderName: data.founderName || data.name || 'Unknown Founder',
              founderEmail: data.founderEmail || data.email || '',
              projectName: data.projectName || '',
              fundingGoal: data.fundingGoal || data.targetRaise || 0,
              currentFunding: data.currentFunding || 0,
              category: data.category || data.sector || 'Uncategorized',
              status: data.status || data.reviewStatus || 'pending',
              priority: data.priority || 'normal',
              submittedAt: data.submittedAt || data.createdAt,
              reviewedAt: data.reviewedAt,
              reviewedBy: data.reviewedBy,
              rejectionReason: data.rejectionReason,
              raftAIReview: data.raftAIReview,
              raftai: data.raftai, // CRITICAL: Include RaftAI analysis
              tags: data.tags || [],
              teamSize: data.teamSize || 1,
              stage: data.stage || 'Early Stage',
              location: data.location || data.geography || 'Unknown',
              website: data.website,
              socialMedia: data.socialMedia || {},
              documents: data.documents || {},
              pitch: data.pitch || {}, // CRITICAL: Include pitch data with documents and team
              repitchRequested: data.repitchRequested || false,
              repitchReasons: data.repitchReasons || [],
              logo: data.logo,
              analytics: data.analytics || { views: 0, interestedInvestors: 0, meetingsScheduled: 0 }
            } as PitchDocument & { pitch?: any; raftai?: any; repitchRequested?: boolean; repitchReasons?: string[]; logo?: string };
          });
          
          setPitches(pitchesData);
          
          // Update stats
          const total = pitchesData.length;
          const pending = pitchesData.filter(p => p.status === 'pending').length;
          const approved = pitchesData.filter(p => p.status === 'approved').length;
          const rejected = pitchesData.filter(p => p.status === 'rejected').length;
          const underReview = pitchesData.filter(p => p.status === 'under_review').length;
          const totalFunding = pitchesData.reduce((sum, p) => sum + (p.fundingGoal || 0), 0);
          const averageScore = pitchesData.reduce((sum, p) => sum + (p.raftAIReview?.score || 0), 0) / total || 0;
          const highPriority = pitchesData.filter(p => p.priority === 'high' || p.priority === 'urgent').length;
          
          setStats({ 
            total, 
            pending, 
            approved, 
            rejected, 
            underReview,
            totalFunding,
            averageScore: Math.round(averageScore * 10) / 10,
            highPriority
          });
          
          console.log('✅ [PITCH] Real-time updates active -', total, 'pitches loaded');
        },
        createSnapshotErrorHandler('admin pitches')
      );

      return () => {
        pitchesUnsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  };

  const generateRaftAIReview = async (pitchId: string) => {
    setIsGeneratingReview(true);
    try {
      console.log('🤖 Generating RaftAI review for pitch:', pitchId);
      
      // Find the pitch data to analyze
      const pitch = pitches.find(p => p.id === pitchId);
      if (!pitch) {
        console.error('Pitch not found for review');
        setIsGeneratingReview(false);
        return;
      }

      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsGeneratingReview(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('Database not available');
        alert('Database not available. Please refresh and try again.');
        setIsGeneratingReview(false);
        return;
      }

      // Try to use the real RaftAI pitch engine
      try {
        const { PitchEngine } = await import('@/lib/raftai/pitch-engine');
        const pitchEngine = PitchEngine.getInstance();
        
        const analysisRequest = {
          projectId: pitchId,
          founderId: pitch.founderId,
          pitch: {
            title: pitch.title || pitch.projectName,
            description: pitch.description || '',
            problem: pitch.description || '',
            solution: pitch.description || '',
            targetMarket: pitch.category || '',
            businessModel: pitch.description || '',
            tokenomics: {},
            team: [],
            roadmap: [],
            financials: {
              fundingTarget: pitch.fundingGoal || 0,
              currentFunding: pitch.currentFunding || 0
            }
          },
          documents: pitch.documents || {}
        };

        console.log('📊 Calling RaftAI Pitch Engine...');
        const analysisResult = await pitchEngine.analyzePitch(analysisRequest);
        
        const raftAIReview = {
          score: analysisResult.score,
          strengths: analysisResult.strengths || [],
          weaknesses: analysisResult.risks?.map(r => r.description) || [],
          recommendations: analysisResult.recommendations?.map(r => r.action) || [],
          riskLevel: analysisResult.risks?.find(r => r.severity === 'high') ? 'high' : 
                     analysisResult.risks?.find(r => r.severity === 'medium') ? 'medium' : 'low',
          marketPotential: analysisResult.categories?.marketOpportunity >= 70 ? 'high' :
                          analysisResult.categories?.marketOpportunity >= 50 ? 'medium' : 'low',
          technicalFeasibility: analysisResult.categories?.technicalFeasibility >= 70 ? 'high' :
                                analysisResult.categories?.technicalFeasibility >= 50 ? 'medium' : 'low',
          teamStrength: analysisResult.categories?.teamStrength >= 70 ? 'high' :
                       analysisResult.categories?.teamStrength >= 50 ? 'medium' : 'low',
          fundingAsk: pitch.fundingGoal > 5000000 ? 'excessive' :
                     pitch.fundingGoal >= 100000 ? 'reasonable' : 'high',
          overallRating: analysisResult.score,
          reviewDate: new Date(),
          confidence: analysisResult.confidence || 85,
          processingTime: analysisResult.processingTime || 0,
          rating: analysisResult.rating,
          summary: analysisResult.summary,
          categories: analysisResult.categories
        };

        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        await updateDoc(doc(dbInstance, 'projects', pitchId), {
          raftAIReview: raftAIReview,
          status: 'under_review',
          reviewedAt: serverTimestamp(),
          reviewedBy: 'RaftAI',
          updatedAt: serverTimestamp()
        });

        console.log('✅ RaftAI review generated successfully with score:', analysisResult.score);
        alert(`RaftAI analysis complete! Score: ${analysisResult.score}/100`);
      } catch (raftaiError) {
        console.warn('⚠️ RaftAI engine not available, using fallback analysis:', raftaiError);
        
        // Fallback to enhanced local analysis
        const analysis = analyzePitchData(pitch);
        
        const raftAIReview = {
          score: analysis.score,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          riskLevel: analysis.riskLevel,
          marketPotential: analysis.marketPotential,
          technicalFeasibility: analysis.technicalFeasibility,
          teamStrength: analysis.teamStrength,
          fundingAsk: analysis.fundingAsk,
          overallRating: analysis.score,
          reviewDate: new Date(),
          confidence: analysis.confidence,
          processingTime: analysis.processingTime
        };

        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        await updateDoc(doc(dbInstance, 'projects', pitchId), {
          raftAIReview: raftAIReview,
          status: 'under_review',
          reviewedAt: serverTimestamp(),
          reviewedBy: 'RaftAI',
          updatedAt: serverTimestamp()
        });

        console.log('✅ Fallback RaftAI review generated successfully with score:', analysis.score);
      }
    } catch (error: any) {
      console.error('❌ Error generating RaftAI review:', error);
      alert(`Error generating review: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const analyzePitchData = (pitch: PitchDocument) => {
    let score = 50; // Base score
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze project name and description
    if (pitch.title && pitch.title.length > 10) {
      score += 5;
      strengths.push('Clear and descriptive project name');
    } else {
      weaknesses.push('Project name could be more descriptive');
    }

    if (pitch.description && pitch.description.length > 100) {
      score += 10;
      strengths.push('Comprehensive project description');
    } else {
      weaknesses.push('Project description needs more detail');
      recommendations.push('Expand project description with more details');
    }

    // Analyze funding goal
    if (pitch.fundingGoal > 0) {
      if (pitch.fundingGoal >= 100000 && pitch.fundingGoal <= 5000000) {
        score += 8;
        strengths.push('Reasonable funding ask');
      } else if (pitch.fundingGoal > 5000000) {
        score -= 5;
        weaknesses.push('Very high funding ask may be difficult to achieve');
        recommendations.push('Consider breaking down funding into smaller rounds');
      } else {
        score += 3;
        strengths.push('Conservative funding approach');
      }
    } else {
      weaknesses.push('No clear funding goal specified');
      recommendations.push('Define specific funding requirements');
    }

    // Analyze category/sector
    if (pitch.category && pitch.category !== 'Uncategorized') {
      score += 5;
      strengths.push('Clear market sector identification');
    } else {
      weaknesses.push('Unclear market sector');
      recommendations.push('Specify target market and sector');
    }

    // Analyze team size
    if (pitch.teamSize > 1) {
      score += 5;
      strengths.push('Team-based approach');
    } else {
      weaknesses.push('Single founder may face execution challenges');
      recommendations.push('Consider building a core team');
    }

    // Analyze stage
    if (pitch.stage && pitch.stage !== 'Early Stage') {
      score += 3;
      strengths.push('Clear development stage');
    }

    // Analyze tags
    if (pitch.tags && pitch.tags.length > 0) {
      score += 3;
      strengths.push('Well-categorized project');
    } else {
      recommendations.push('Add relevant tags for better categorization');
    }

    // Analyze documents
    if (pitch.documents) {
      let docCount = 0;
      if (pitch.documents.pitchDeck) docCount++;
      if (pitch.documents.whitepaper) docCount++;
      if (pitch.documents.tokenomics) docCount++;
      if (pitch.documents.roadmap) docCount++;

      if (docCount >= 3) {
        score += 10;
        strengths.push('Comprehensive documentation provided');
      } else if (docCount >= 1) {
        score += 5;
        strengths.push('Some documentation provided');
      } else {
        weaknesses.push('Limited documentation provided');
        recommendations.push('Provide pitch deck, whitepaper, and tokenomics documents');
      }
    }

    // Determine risk level based on score
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (score >= 80) riskLevel = 'low';
    else if (score <= 60) riskLevel = 'high';

    // Determine market potential
    let marketPotential: 'low' | 'medium' | 'high' = 'medium';
    if (pitch.fundingGoal > 2000000) marketPotential = 'high';
    else if (pitch.fundingGoal < 500000) marketPotential = 'low';

    // Determine technical feasibility
    let technicalFeasibility: 'low' | 'medium' | 'high' = 'medium';
    if (pitch.documents && Object.keys(pitch.documents).length >= 3) technicalFeasibility = 'high';
    else if (!pitch.documents || Object.keys(pitch.documents).length === 0) technicalFeasibility = 'low';

    // Determine team strength
    let teamStrength: 'low' | 'medium' | 'high' = 'medium';
    if (pitch.teamSize >= 3) teamStrength = 'high';
    else if (pitch.teamSize === 1) teamStrength = 'low';

    // Determine funding ask reasonableness
    let fundingAsk: 'reasonable' | 'high' | 'excessive' = 'reasonable';
    if (pitch.fundingGoal > 10000000) fundingAsk = 'excessive';
    else if (pitch.fundingGoal > 5000000) fundingAsk = 'high';

    // Add general recommendations based on score
    if (score < 70) {
      recommendations.push('Focus on strengthening core value proposition');
      recommendations.push('Provide more detailed business model');
    }

    // Ensure score is within bounds
    score = Math.max(30, Math.min(95, score));

    return {
      score: Math.round(score),
      strengths,
      weaknesses,
      recommendations,
      riskLevel,
      marketPotential,
      technicalFeasibility,
      teamStrength,
      fundingAsk,
      confidence: Math.min(0.95, Math.max(0.6, score / 100)),
      processingTime: Math.floor(Math.random() * 3) + 2 // 2-4 seconds
    };
  };

  const handleRequestRepitch = async (pitchId: string, reasons: string) => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Get current pitch data
      const pitchDoc = await getDoc(doc(dbInstance, 'projects', pitchId));
      const pitchData = pitchDoc.data();
      
      // Parse reasons (split by newline)
      const reasonList = reasons.split('\n').filter(r => r.trim().length > 0);
      
      await updateDoc(doc(dbInstance, 'projects', pitchId), {
        status: 'needs_revision',
        reviewStatus: 'needs_revision',
        repitchRequested: true,
        repitchReasons: reasonList,
        repitchRequestedAt: serverTimestamp(),
        repitchRequestedBy: user.email,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Pitch ${pitchId} marked for repitch with ${reasonList.length} improvement areas`);
      alert(`Repitch requested! Founder will see ${reasonList.length} improvement areas.`);
    } catch (error) {
      console.error('❌ Error requesting repitch:', error);
      alert('Failed to request repitch. Please try again.');
    }
  };

  const handleStatusChange = async (pitchId: string, newStatus: string, rejectionReason?: string) => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      const updateData: any = {
        status: newStatus,
        reviewStatus: newStatus, // Also update reviewStatus for consistency
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email,
        updatedAt: serverTimestamp()
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      // CRITICAL: When approved, ensure project is visible to all target roles
      if (newStatus === 'approved') {
        // Get current project data to preserve targetRoles
        const projectDoc = await getDoc(doc(dbInstance, 'projects', pitchId));
        const projectData = projectDoc.data();
        
        // Ensure targetRoles exists and includes all relevant roles
        updateData.targetRoles = projectData?.targetRoles || ['vc', 'exchange', 'ido', 'agency', 'influencer'];
        
        // Mark as visible to all roles
        updateData.visibleToRoles = ['vc', 'exchange', 'ido', 'agency', 'influencer'];
        
        // Ensure documents are accessible
        if (projectData?.pitch?.documents) {
          updateData.documents = projectData.pitch.documents;
        }
        
        // CRITICAL: Ensure logo is at top level for easy access
        if (projectData?.logo) {
          updateData.logo = projectData.logo;
        } else if (projectData?.projectLogo) {
          updateData.logo = projectData.projectLogo;
        } else if (projectData?.pitch?.documents?.projectLogo) {
          const logo = projectData.pitch.documents.projectLogo;
          updateData.logo = typeof logo === 'string' ? logo : (logo.url || logo.downloadURL || null);
          updateData.projectLogo = updateData.logo;
        }
        
        // Set visibility flags
        updateData.visibility = {
          discoverable: true,
          public: true
        };
        
        console.log(`✅ Pitch ${pitchId} approved - making visible to all roles with logo:`, updateData.logo);
      }

      await updateDoc(doc(dbInstance, 'projects', pitchId), updateData);
      
      console.log(`✅ Pitch ${pitchId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating pitch status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'under_review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-black/40 text-cyan-400/70 border-cyan-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <NeonCyanIcon type="clock" size={16} className="text-current" />;
      case 'under_review': return <NeonCyanIcon type="eye" size={16} className="text-current" />;
      case 'approved': return <NeonCyanIcon type="check" size={16} className="text-current" />;
      case 'rejected': return <NeonCyanIcon type="x-circle" size={16} className="text-current" />;
      default: return <NeonCyanIcon type="clock" size={16} className="text-current" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-black/40 text-cyan-400/70 border-cyan-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-cyan-400/70';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading pitch management..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <NeonCyanIcon type="rocket" size={32} className="text-purple-400" />
              Pitch Management
            </h1>
            <p className="text-cyan-400/70 mt-2">Review and manage all pitch submissions with RaftAI insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-cyan-400/70">Total Funding Requests</p>
              <p className="text-2xl font-bold text-white">${(stats.totalFunding / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-400/70">Average Score</p>
              <p className="text-2xl font-bold text-white">{stats.averageScore}/100</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400/70 text-sm font-medium">Total Pitches</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="document" size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400/70 text-sm font-medium">Pending Review</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="clock" size={24} className="text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400/70 text-sm font-medium">Approved</p>
                <p className="text-white text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="check" size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400/70 text-sm font-medium">High Priority</p>
                <p className="text-white text-2xl font-bold">{stats.highPriority}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="exclamation" size={24} className="text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <NeonCyanIcon type="search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70" />
              <input
                type="text"
                placeholder="Search pitches by title, founder, project, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Highest Score</option>
              <option value="funding">Highest Funding</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          {searchTerm && (
            <p className="mt-3 text-sm text-cyan-400/70">
              Showing {filteredPitches.length} of {pitches.length} pitches
            </p>
          )}
        </div>

        {/* Pitches List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-white mb-2">Loading pitches...</h3>
              <p className="text-gray-400">Fetching real-time data from database</p>
            </div>
          ) : filteredPitches.length === 0 ? (
            <div className="text-center py-12 bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl">
              <NeonCyanIcon type="document" size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'No pitches match your search' : 'No pitches found'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'No pitch submissions have been made yet.'}
              </p>
              {!searchTerm && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Pitches will appear here once founders submit their projects through the pitch form.
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredPitches.map((pitch) => (
              <div key={pitch.id} className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-cyan-500/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {pitch.title || pitch.projectName || 'Untitled Pitch'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(pitch.status)}`}>
                        {getStatusIcon(pitch.status)}
                        {pitch.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getPriorityColor(pitch.priority)}`}>
                        {pitch.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Founder</p>
                        <p className="text-white font-medium">{pitch.founderName}</p>
                        <p className="text-gray-400 text-sm">{pitch.founderEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Funding Goal</p>
                        <p className="text-white font-medium">${(pitch.fundingGoal / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Category</p>
                        <p className="text-white font-medium">{pitch.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Submitted</p>
                        <p className="text-white font-medium">
                          {pitch.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* RaftAI Review Section */}
                    {pitch.raftAIReview ? (
                      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <NeonCyanIcon type="sparkles" size={20} className="text-purple-400" />
                          <h4 className="text-lg font-semibold text-white">RaftAI Review</h4>
                          <div className="flex items-center gap-1">
                            <NeonCyanIcon type="star" size={16} className="text-yellow-400" />
                            <span className="text-yellow-400 font-bold">{pitch.raftAIReview.score}/100</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Risk Level</p>
                            <p className={`font-medium ${getRiskColor(pitch.raftAIReview.riskLevel)}`}>
                              {pitch.raftAIReview.riskLevel.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Market Potential</p>
                            <p className={`font-medium ${getRiskColor(pitch.raftAIReview.marketPotential)}`}>
                              {pitch.raftAIReview.marketPotential.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Team Strength</p>
                            <p className={`font-medium ${getRiskColor(pitch.raftAIReview.teamStrength)}`}>
                              {pitch.raftAIReview.teamStrength.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Strengths</p>
                            <ul className="text-sm text-green-400 space-y-1">
                              {pitch.raftAIReview.strengths.slice(0, 2).map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-400 mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Areas for Improvement</p>
                            <ul className="text-sm text-yellow-400 space-y-1">
                              {pitch.raftAIReview.weaknesses.slice(0, 2).map((weakness, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-yellow-400 mt-1">•</span>
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 rounded-lg p-4 mb-4 border border-dashed border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <NeonCyanIcon type="sparkles" size={20} className="text-purple-400" />
                            <span className="text-gray-400">No RaftAI review available</span>
                          </div>
                          <button
                            onClick={() => generateRaftAIReview(pitch.id)}
                            disabled={isGeneratingReview}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                          >
                            {isGeneratingReview ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <NeonCyanIcon type="sparkles" size={16} className="text-current" />
                                Generate Review
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {pitch.description && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Description</p>
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {pitch.description}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {pitch.tags && pitch.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pitch.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => {
                        router.push(`/admin/project/${pitch.id}`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                    >
                      <NeonCyanIcon type="eye" size={16} className="text-current" />
                      View Full Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPitch(pitch);
                        setShowPitchModal(true);
                      }}
                      className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 border border-cyan-400/20"
                    >
                      <NeonCyanIcon type="document" size={16} className="text-current" />
                      Quick View
                    </button>
                    
                    {pitch.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(pitch.id, 'approved')}
                          className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 border border-green-400/30"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) {
                              handleStatusChange(pitch.id, 'rejected', reason);
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-red-500/20 border border-red-400/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            const reasons = prompt('Request repitch - provide specific reasons and improvements needed (one per line):');
                            if (reasons) {
                              handleRequestRepitch(pitch.id, reasons);
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-yellow-500/20 border border-yellow-400/30"
                          title="Request founder to improve and resubmit pitch"
                        >
                          Request Repitch
                        </button>
                      </div>
                    )}

                    {pitch.status === 'under_review' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(pitch.id, 'approved')}
                          className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 border border-green-400/30"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) {
                              handleStatusChange(pitch.id, 'rejected', reason);
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-red-500/20 border border-red-400/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            const reasons = prompt('Request repitch - provide specific reasons and improvements needed (one per line):');
                            if (reasons) {
                              handleRequestRepitch(pitch.id, reasons);
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-yellow-500/20 border border-yellow-400/30"
                          title="Request founder to improve and resubmit pitch"
                        >
                          Request Repitch
                        </button>
                      </div>
                    )}
                    
                    {(pitch.status === 'needs_revision' || (pitch as any).repitchRequested) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(pitch.id, 'approved')}
                          className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 border border-green-400/30"
                        >
                          Approve After Revision
                        </button>
                        <button
                          onClick={() => {
                            const reasons = prompt('Additional improvements needed (one per line):');
                            if (reasons) {
                              handleRequestRepitch(pitch.id, reasons);
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-yellow-500/20 border border-yellow-400/30"
                        >
                          Request More Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pitch Details Modal */}
      {showPitchModal && selectedPitch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
          <div className="bg-gray-900 border-2 border-gray-600 rounded-2xl p-6 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{selectedPitch.title}</h2>
                <p className="text-gray-400 text-sm">Project: {selectedPitch.projectName}</p>
              </div>
              <button
                onClick={() => {
                  setShowPitchModal(false);
                  setSelectedPitch(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <NeonCyanIcon type="close" size={24} className="text-white" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Founder</label>
                  <p className="text-white">{selectedPitch.founderName} ({selectedPitch.founderEmail})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Funding Goal</label>
                  <p className="text-white">${selectedPitch.fundingGoal ? (selectedPitch.fundingGoal / 1000).toFixed(0) + 'K' : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <p className="text-white">{selectedPitch.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPitch.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    selectedPitch.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    selectedPitch.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedPitch.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <p className="text-white whitespace-pre-wrap">{selectedPitch.description}</p>
              </div>
              
              {/* Documents Section */}
              {((selectedPitch as any).pitch?.documents || selectedPitch.documents) && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <NeonCyanIcon type="document" size={24} className="text-cyan-400" />
                    Project Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((selectedPitch as any).pitch?.documents?.pitchDeck || selectedPitch.documents?.pitchDeck) && (
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-400/20">
                        <p className="text-cyan-400 font-semibold mb-2">Pitch Deck</p>
                        <p className="text-white/70 text-sm">✓ Provided</p>
                      </div>
                    )}
                    {((selectedPitch as any).pitch?.documents?.whitepaper || selectedPitch.documents?.whitepaper) && (
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-400/20">
                        <p className="text-cyan-400 font-semibold mb-2">Whitepaper</p>
                        <p className="text-white/70 text-sm">✓ Provided</p>
                      </div>
                    )}
                    {((selectedPitch as any).pitch?.documents?.tokenomics || selectedPitch.documents?.tokenomics) && (
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-400/20">
                        <p className="text-cyan-400 font-semibold mb-2">Tokenomics</p>
                        <p className="text-white/70 text-sm">✓ Provided</p>
                      </div>
                    )}
                    {((selectedPitch as any).pitch?.documents?.roadmap || selectedPitch.documents?.roadmap) && (
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-400/20">
                        <p className="text-cyan-400 font-semibold mb-2">Roadmap</p>
                        <p className="text-white/70 text-sm">✓ Provided</p>
                      </div>
                    )}
                    {((selectedPitch as any).pitch?.documents?.projectLogo || (selectedPitch as any).logo) && (
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-cyan-400/20">
                        <p className="text-cyan-400 font-semibold mb-2">Project Logo</p>
                        <img 
                          src={((selectedPitch as any).pitch?.documents?.projectLogo?.url || (selectedPitch as any).logo || (selectedPitch as any).pitch?.documents?.projectLogo)} 
                          alt="Project Logo"
                          className="w-16 h-16 rounded-lg object-cover border border-cyan-400/30 mt-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Team Section */}
              {((selectedPitch as any).pitch?.teamMembers && ((selectedPitch as any).pitch.teamMembers.length > 0)) && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <NeonCyanIcon type="users" size={24} className="text-purple-400" />
                    Team Members ({((selectedPitch as any).pitch.teamMembers || []).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((selectedPitch as any).pitch.teamMembers || []).map((member: any, idx: number) => (
                      <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-purple-400/20">
                        <p className="text-purple-400 font-semibold">{member.name || 'Team Member'}</p>
                        <p className="text-white/70 text-sm">{member.position || 'Position not specified'}</p>
                        {member.bio && (
                          <p className="text-white/60 text-xs mt-2">{member.bio}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* RaftAI Analysis - Enhanced Comprehensive */}
              {((selectedPitch as any).raftai || selectedPitch.raftAIReview) && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <NeonCyanIcon type="sparkles" size={24} className="text-purple-400" />
                    RaftAI Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Score</label>
                      <p className="text-2xl font-bold text-white">
                        {((selectedPitch as any).raftai?.score || selectedPitch.raftAIReview?.score || 0)}/100
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                      <p className="text-white font-semibold">
                        {((selectedPitch as any).raftai?.rating || 'Normal')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confidence</label>
                      <p className="text-white">
                        {((selectedPitch as any).raftai?.confidence || selectedPitch.raftAIReview?.confidence || 0)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Document Analysis */}
                  {((selectedPitch as any).raftai?.documentAnalysis) && (
                    <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-cyan-400/20">
                      <p className="text-cyan-400 font-semibold mb-3">Document Analysis</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Pitch Deck:</span>
                          <span className={`ml-2 ${((selectedPitch as any).raftai.documentAnalysis.pitchDeck === 'Provided' ? 'text-green-400' : 'text-red-400')}`}>
                            {((selectedPitch as any).raftai.documentAnalysis.pitchDeck || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Whitepaper:</span>
                          <span className={`ml-2 ${((selectedPitch as any).raftai.documentAnalysis.whitepaper === 'Provided' ? 'text-green-400' : 'text-red-400')}`}>
                            {((selectedPitch as any).raftai.documentAnalysis.whitepaper || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Tokenomics:</span>
                          <span className={`ml-2 ${((selectedPitch as any).raftai.documentAnalysis.tokenomics === 'Provided' ? 'text-green-400' : 'text-red-400')}`}>
                            {((selectedPitch as any).raftai.documentAnalysis.tokenomics || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Roadmap:</span>
                          <span className={`ml-2 ${((selectedPitch as any).raftai.documentAnalysis.roadmap === 'Provided' ? 'text-green-400' : 'text-red-400')}`}>
                            {((selectedPitch as any).raftai.documentAnalysis.roadmap || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Logo:</span>
                          <span className={`ml-2 ${((selectedPitch as any).raftai.documentAnalysis.projectLogo === 'Provided' ? 'text-green-400' : 'text-red-400')}`}>
                            {((selectedPitch as any).raftai.documentAnalysis.projectLogo || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Team:</span>
                          <span className="ml-2 text-cyan-400">
                            {((selectedPitch as any).raftai.documentAnalysis.team || 'Unknown')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Summary */}
                  {((selectedPitch as any).raftai?.summary) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Summary</label>
                      <p className="text-white/80 whitespace-pre-wrap">{((selectedPitch as any).raftai.summary)}</p>
                    </div>
                  )}
                  
                  {/* Strengths */}
                  {((selectedPitch as any).raftai?.strengths && ((selectedPitch as any).raftai.strengths.length > 0)) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Strengths</label>
                      <ul className="list-disc list-inside space-y-1">
                        {((selectedPitch as any).raftai.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-green-400">{strength}</li>
                        )))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Risks */}
                  {((selectedPitch as any).raftai?.risks && ((selectedPitch as any).raftai.risks.length > 0)) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Risks & Concerns</label>
                      <ul className="list-disc list-inside space-y-1">
                        {((selectedPitch as any).raftai.risks.map((risk: string, idx: number) => (
                          <li key={idx} className="text-yellow-400">{risk}</li>
                        )))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {((selectedPitch as any).raftai?.recommendations && ((selectedPitch as any).raftai.recommendations.length > 0)) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Recommendations</label>
                      <ul className="list-disc list-inside space-y-1">
                        {((selectedPitch as any).raftai.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-cyan-400">{rec}</li>
                        )))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {selectedPitch.raftAIReview && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <NeonCyanIcon type="sparkles" size={24} className="text-purple-400" />
                    RaftAI Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Score</label>
                      <p className="text-2xl font-bold text-white">{selectedPitch.raftAIReview.score}/100</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
                      <p className="text-white capitalize">{selectedPitch.raftAIReview.riskLevel}</p>
                    </div>
                  </div>
                  {selectedPitch.raftAIReview.strengths && selectedPitch.raftAIReview.strengths.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Strengths</label>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPitch.raftAIReview.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-green-400">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {!selectedPitch.raftAIReview && (
                  <button
                    onClick={() => generateRaftAIReview(selectedPitch.id)}
                    disabled={isGeneratingReview}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                  >
                    <NeonCyanIcon type="sparkles" size={20} className="text-current" />
                    {isGeneratingReview ? 'Generating...' : 'Generate RaftAI Review'}
                  </button>
                )}
                {selectedPitch.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedPitch.id, 'approved');
                        setShowPitchModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-green-500/20 border border-green-400/30"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) {
                          handleStatusChange(selectedPitch.id, 'rejected', reason);
                          setShowPitchModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-500/20 border border-red-400/30"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        const reasons = prompt('Request repitch - provide specific reasons and improvements needed (one per line):');
                        if (reasons) {
                          handleRequestRepitch(selectedPitch.id, reasons);
                          setShowPitchModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-yellow-500/20 border border-yellow-400/30"
                      title="Request founder to improve and resubmit pitch"
                    >
                      Request Repitch
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowPitchModal(false);
                    setSelectedPitch(null);
                  }}
                  className="ml-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}