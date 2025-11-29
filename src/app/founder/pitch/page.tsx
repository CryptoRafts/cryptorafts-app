'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProjectPitchWizard from '@/components/ProjectPitchWizard';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { ensureDb, ensureStorage, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { auth } from '@/lib/firebase.client';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getIdToken } from 'firebase/auth';

export default function FounderPitchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pitchStats, setPitchStats] = useState({
    totalPitches: 0,
    pendingReviews: 0,
    approvedProjects: 0,
    lastSubmission: null as string | null
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Load pitch statistics from real-time Firestore
  useEffect(() => {
    if (!user?.uid) return;

    console.log('📊 [PITCH] Loading real-time pitch statistics...');

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ [PITCH] Database not initialized');
        return;
      }

      // Real-time listener for user's projects - handle index error gracefully
      try {
        unsubscribe = onSnapshot(
            query(
              collection(dbInstance, 'projects'),
              where('founderId', '==', user.uid),
              orderBy('submittedAt', 'desc')
            ),
            (snapshot) => {
              const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
              
              const stats = {
                totalPitches: projects.length,
                pendingReviews: projects.filter((p: any) => p.status === 'pending_review').length,
                approvedProjects: projects.filter((p: any) => p.status === 'approved').length,
                lastSubmission: projects.length > 0 
                  ? (() => {
                      const lastProject = projects.sort((a: any, b: any) => b.submittedAt - a.submittedAt)[0];
                      const date = lastProject.submittedAt?.toDate ? lastProject.submittedAt.toDate() : new Date(lastProject.submittedAt);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - date.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 1) return 'Yesterday';
                      if (diffDays < 7) return `${diffDays} days ago`;
                      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
                      return `${Math.ceil(diffDays / 30)} months ago`;
                    })()
                  : null
              };

              setPitchStats(stats);
              console.log('📊 [PITCH] Real-time stats updated:', stats);
            },
            (error: any) => {
              // Handle index error gracefully - fallback to query without orderBy
              if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
                console.log('⚠️ [PITCH] Index not found, using fallback query without orderBy');
                try {
                  unsubscribe = onSnapshot(
                    query(
                      collection(dbInstance, 'projects'),
                      where('founderId', '==', user.uid)
                    ),
                    (snapshot) => {
                      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                      // Sort client-side
                      projects.sort((a: any, b: any) => {
                        const aTime = a.submittedAt?.toDate?.()?.getTime() || a.submittedAt || 0;
                        const bTime = b.submittedAt?.toDate?.()?.getTime() || b.submittedAt || 0;
                        return bTime - aTime;
                      });
                      
                      const stats = {
                        totalPitches: projects.length,
                        pendingReviews: projects.filter((p: any) => p.status === 'pending_review' || p.status === 'pending').length,
                        approvedProjects: projects.filter((p: any) => p.status === 'approved').length,
                        lastSubmission: projects.length > 0 
                          ? (() => {
                              const lastProject = projects[0];
                              const date = lastProject.submittedAt?.toDate ? lastProject.submittedAt.toDate() : new Date(lastProject.submittedAt);
                              const now = new Date();
                              const diffTime = Math.abs(now.getTime() - date.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays === 1) return 'Yesterday';
                              if (diffDays < 7) return `${diffDays} days ago`;
                              if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
                              return `${Math.ceil(diffDays / 30)} months ago`;
                            })()
                          : null
                      };

                      setPitchStats(stats);
                      console.log('📊 [PITCH] Real-time stats updated (fallback):', stats);
                    },
                    createSnapshotErrorHandler('pitch stats fallback')
                  );
                } catch (fallbackError) {
                  console.error('❌ [PITCH] Fallback query also failed:', fallbackError);
                }
              } else {
                createSnapshotErrorHandler('pitch stats')(error);
              }
            }
          );
      } catch (setupError) {
        console.error('❌ [PITCH] Error setting up listener:', setupError);
      }
    };

      setupListener();
      
      return () => {
        console.log('📊 [PITCH] Unsubscribing from pitch stats');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [user?.uid]);

  const handlePitchComplete = async (data: any) => {
    if (!user?.uid) return;

    setSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('🚀 [PITCH] Starting pitch submission...');
      console.log('👤 [PITCH] User:', user.uid);
      console.log('🔑 [PITCH] User email:', user.email);
      
      // Get current ID token to check claims
      if (auth && auth.currentUser) {
        const token = await getIdToken(auth.currentUser);
        const claims = JSON.parse(atob(token.split('.')[1]));
        console.log('🎫 [PITCH] Token claims:', claims);
      }

      // CRITICAL: Upload all files to Firebase Storage first and get downloadURLs
      console.log('📤 [PITCH] Uploading files to Firebase Storage...');
      const storage = await ensureStorage();
      if (!storage) throw new Error('Storage not available');
      
      const uploadedFiles: any = {};
      
      // Helper function to upload a file
      const uploadFile = async (file: File | null, fieldName: string): Promise<string | null> => {
        if (!file) return null;
        
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `pitch-documents/${user.uid}/${fieldName}-${Date.now()}-${safeName}`;
          const storageRef = ref(storage, storagePath);
          
          console.log(`📤 [PITCH] Uploading ${fieldName}...`);
          const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
            cacheControl: "public,max-age=3600"
          });
          
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log(`✅ [PITCH] ${fieldName} uploaded:`, downloadURL.substring(0, 50) + '...');
          
          return downloadURL;
        } catch (error: any) {
          console.error(`❌ [PITCH] Error uploading ${fieldName}:`, error);
          // Don't block submission if file upload fails
          return null;
        }
      };
      
      // Upload all files in parallel
      const [logoUrl, pitchDeckUrl, whitepaperUrl, tokenomicsUrl, roadmapUrl] = await Promise.all([
        uploadFile(data.projectLogo, 'projectLogo'),
        uploadFile(data.pitchDeck, 'pitchDeck'),
        uploadFile(data.whitepaper, 'whitepaper'),
        uploadFile(data.tokenomics, 'tokenomics'),
        uploadFile(data.roadmap, 'roadmap')
      ]);
      
      // Upload team member photos
      const teamMembersWithPhotos = await Promise.all(
        (data.teamMembers || []).map(async (member: any) => {
          if (member.photo && member.photo instanceof File) {
            const photoUrl = await uploadFile(member.photo, `team-${member.name || 'member'}`);
            return { ...member, photoUrl };
          }
          return member;
        })
      );
      
      // Parse funding goal as number
      const fundingGoalNum = data.fundingGoal || data.targetRaise || data.pitch?.fundingGoal || 0;
      const fundingGoal = typeof fundingGoalNum === 'string' ? parseFloat(fundingGoalNum.replace(/[^0-9.]/g, '')) || 0 : (fundingGoalNum || 0);
      
      console.log('✅ [PITCH] All files uploaded, preparing pitch data...');
      
      // Enhanced pitch data with real-time tracking
      const pitchData = {
        // Core project data
        founderId: user.uid,
        ownerId: user.uid,  // Required by Firestore rules
        userId: user.uid,   // Required by Firestore rules
        founderEmail: user.email,
        founderName: user.displayName || user.email?.split('@')[0] || 'Founder',
        founderAvatar: user.photoURL || null,
        
        // Project details
        title: data.projectName || data.title || 'Untitled Project',
        name: data.projectName || data.name || 'Untitled Project',
        description: data.projectDescription || data.description || data.solution || 'No description available',
        
        // Funding information - extract from pitch data
        fundingGoal: fundingGoal,
        currentFunding: 0,
        category: data.sector || data.category || 'Uncategorized',
        tokenSymbol: data.tokenName || data.tokenSymbol || 'N/A',
        
        // Logo URL - use uploaded URL
        logo: logoUrl || null,
        
        // Social media links
        website: data.website || '',
        socialMedia: {
          linkedin: data.linkedin || '',
          twitter: data.twitter || ''
        },
        
        // Detailed pitch information
        pitch: {
          // Step 1: Project Basics
          projectName: data.projectName,
          projectDescription: data.projectDescription,
          sector: data.sector,
          chain: data.chain,
          stage: data.stage,
          website: data.website || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          
          // Step 2: Problem & Market
          problem: data.problem,
          targetAudience: data.targetAudience,
          marketSize: data.marketSize,
          
          // Step 3: Product & Solution
          solution: data.solution,
          keyFeatures: data.keyFeatures,
          competitiveAdvantage: data.competitiveAdvantage,
          
          // Step 4: Tokenomics
          tokenName: data.tokenName,
          totalSupply: data.totalSupply,
          tokenomicsFile: data.tokenomicsFile ? {
            name: data.tokenomicsFile.name,
            size: data.tokenomicsFile.size,
            type: data.tokenomicsFile.type,
            lastModified: data.tokenomicsFile.lastModified
          } : null,
          tokenomicsUrl: data.tokenomicsUrl,
          
          // Step 5: Team
          teamMembers: teamMembersWithPhotos.map((member: any) => ({
            name: member.name || '',
            position: member.position || '',
            bio: member.bio || '',
            linkedin: member.linkedin || '',
            twitter: member.twitter || '',
            photo: member.photo ? {
              name: member.photo.name,
              size: member.photo.size,
              type: member.photo.type,
              lastModified: member.photo.lastModified
            } : null,
            photoUrl: member.photoUrl || null
          })),
          advisors: Array.isArray(data.advisors) ? data.advisors : (data.advisors ? [data.advisors] : []),
          experience: data.experience || '',
          
          // Step 6: Documents - store both metadata and URLs from uploaded files
          documents: {
            projectLogo: logoUrl ? {
              name: data.projectLogo?.name || 'projectLogo',
              size: data.projectLogo?.size || 0,
              type: data.projectLogo?.type || 'image/png',
              lastModified: data.projectLogo?.lastModified || Date.now(),
              url: logoUrl,
              downloadURL: logoUrl
            } : null,
            pitchDeck: pitchDeckUrl ? {
              name: data.pitchDeck?.name || 'pitchDeck',
              size: data.pitchDeck?.size || 0,
              type: data.pitchDeck?.type || 'application/pdf',
              lastModified: data.pitchDeck?.lastModified || Date.now(),
              url: pitchDeckUrl,
              downloadURL: pitchDeckUrl
            } : null,
            whitepaper: whitepaperUrl ? {
              name: data.whitepaper?.name || 'whitepaper',
              size: data.whitepaper?.size || 0,
              type: data.whitepaper?.type || 'application/pdf',
              lastModified: data.whitepaper?.lastModified || Date.now(),
              url: whitepaperUrl,
              downloadURL: whitepaperUrl
            } : null,
            tokenomics: tokenomicsUrl ? {
              name: data.tokenomics?.name || 'tokenomics',
              size: data.tokenomics?.size || 0,
              type: data.tokenomics?.type || 'application/pdf',
              lastModified: data.tokenomics?.lastModified || Date.now(),
              url: tokenomicsUrl,
              downloadURL: tokenomicsUrl
            } : null,
            roadmap: roadmapUrl ? {
              name: data.roadmap?.name || 'roadmap',
              size: data.roadmap?.size || 0,
              type: data.roadmap?.type || 'application/pdf',
              lastModified: data.roadmap?.lastModified || Date.now(),
              url: roadmapUrl,
              downloadURL: roadmapUrl
            } : null
          },
          
          // Funding information
          fundingGoal: fundingGoal,
          
          // Submission metadata
          submitted: true,
          submittedAt: new Date().toISOString(),
          version: '1.0'
        },
        
        // Status and workflow
        status: 'pending_review',
        reviewStatus: 'pending',
        priority: 'normal',
        
        // Target roles for filtering
        targetRoles: ['vc', 'exchange', 'ido', 'agency', 'influencer'],
        // Visibility flags for role-based filtering
        seekingListing: true,  // For exchanges
        seekingIDO: true,      // For IDO platforms
        seekingMarketing: true, // For influencers
        seekingServices: true,  // For marketing agencies
        visibility: 'public',   // For general visibility
        
        // Documents at top level for easy access - use uploaded URLs
        documents: {
          projectLogo: logoUrl || null,
          pitchDeck: pitchDeckUrl || null,
          whitepaper: whitepaperUrl || null,
          tokenomics: tokenomicsUrl || null,
          roadmap: roadmapUrl || null
        },
        
        // CRITICAL: Also store logo at top level for immediate access
        projectLogo: logoUrl || null,
        
        // Real-time tracking
        analytics: {
          views: 0,
          interestedInvestors: 0,
          meetingsScheduled: 0,
          lastViewed: null,
          submissionSource: 'founder_pitch_page',
          submissionTimestamp: Date.now()
        },
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submittedAt: serverTimestamp()
      };

      console.log('📝 [PITCH] Submitting to Firestore...');

      // Submit to projects collection
      const dbInstance = ensureDb();
      if (!dbInstance) throw new Error('Database not available');
      
      const docRef = await addDoc(collection(dbInstance, 'projects'), pitchData);
      
      console.log('✅ [PITCH] Pitch submitted successfully:', docRef.id);

      // CRITICAL: Run RaftAI analysis on pitch submission
      try {
        console.log('🤖 [PITCH] Starting RaftAI analysis...');
        const { raftai } = await import('@/lib/raftai');
        
        // Sanitize data for RaftAI - remove File objects and only keep URLs
        const sanitizedPitchData = {
          projectId: docRef.id,
          ...pitchData,
          // Override with uploaded URLs only (no File objects)
          projectLogo: logoUrl || null,
          pitchDeck: pitchDeckUrl || null,
          whitepaper: whitepaperUrl || null,
          tokenomics: tokenomicsUrl || null,
          roadmap: roadmapUrl || null,
          // Include team members with photo URLs only (no File objects)
          teamMembers: teamMembersWithPhotos.map((member: any) => ({
            name: member.name || '',
            position: member.position || '',
            bio: member.bio || '',
            linkedin: member.linkedin || '',
            twitter: member.twitter || '',
            photoUrl: member.photoUrl || null
            // Don't include File objects
          }))
        };
        
        const analysisResult = await raftai.analyzePitch(user.uid, sanitizedPitchData);
        
        console.log('✅ [PITCH] RaftAI analysis complete:', analysisResult);
        
        // Update project with comprehensive RaftAI analysis (all enhanced fields)
        await updateDoc(doc(dbInstance, 'projects', docRef.id), {
          raftai: {
            rating: analysisResult.rating || 'Normal',
            score: analysisResult.score || 0,
            summary: analysisResult.summary || '',
            executiveSummary: analysisResult.executiveSummary || analysisResult.summary || '',
            risks: analysisResult.risks || [],
            recommendations: analysisResult.recommendations || [],
            strengths: analysisResult.strengths || [],
            nextSteps: analysisResult.nextSteps || [],
            confidence: analysisResult.confidence || 0,
            viability: analysisResult.viability || 'medium',
            riskScore: analysisResult.riskScore || (100 - (analysisResult.score || 50)),
            // Enhanced comprehensive analysis fields
            findings: analysisResult.findings || [],
            riskDrivers: analysisResult.riskDrivers || [],
            comparableProjects: analysisResult.comparableProjects || [],
            marketOutlook: analysisResult.marketOutlook || null,
            tokenomicsReview: analysisResult.tokenomicsReview || null,
            teamAnalysis: analysisResult.teamAnalysis || null,
            auditHistory: analysisResult.auditHistory || null,
            onChainActivity: analysisResult.onChainActivity || null,
            unverifiableClaims: analysisResult.unverifiableClaims || [],
            documentAnalysis: analysisResult.documentAnalysis || {},
            analyzedAt: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ [PITCH] RaftAI analysis saved to project');
      } catch (analysisError: any) {
        console.error('⚠️ [PITCH] RaftAI analysis error (non-blocking):', analysisError);
        // Don't block submission if analysis fails - admin can trigger it manually
      }

      // Update founder's pitch count with real-time data
      const founderRef = doc(dbInstance, 'users', user.uid);
      const founderDoc = await getDoc(founderRef);
      const currentPitchCount = founderDoc.exists() ? (founderDoc.data().pitchCount || 0) : 0;
      
      await updateDoc(founderRef, {
        pitchCount: currentPitchCount + 1,
        lastPitchSubmitted: serverTimestamp(),
        lastPitchId: docRef.id,
        updatedAt: serverTimestamp()
      });

      setSubmitStatus('success');
      
      // Redirect to pending approval page
      setTimeout(() => {
        router.push('/founder/pending-approval');
      }, 2000);

    } catch (error) {
      console.error('❌ [PITCH] Error submitting pitch:', error);
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Should redirect to login via useEffect
  }

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen bg-black"
      >
        {/* Header */}
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 mb-8 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <NeonCyanIcon type="rocket" size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Pitch Your Project</h1>
                  <p className="text-white/80 text-lg">Submit your project to attract investors and partners</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{pitchStats.totalPitches}</p>
                <p className="text-cyan-400/70 text-sm">Total Pitches</p>
              </div>
            </div>
          </div>

          {/* Pitch Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Total Pitches</p>
                  <p className="text-3xl font-bold text-white mt-2">{pitchStats.totalPitches}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="analytics" size={24} className="text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold text-white mt-2">{pitchStats.pendingReviews}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="clock" size={24} className="text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold text-white mt-2">{pitchStats.approvedProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="check" size={24} className="text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Last Submission</p>
                  <p className="text-lg font-bold text-white mt-2">{pitchStats.lastSubmission || 'Never'}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="analytics" className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Submission Status */}
          {submitStatus === 'success' && (
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="check" className="text-green-400" size={32} />
                <div>
                  <h3 className="text-xl font-bold text-green-400">Pitch Submitted Successfully!</h3>
                  <p className="text-green-300">Your project is now under review. Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <NeonCyanIcon type="exclamation" size={32} className="text-red-400" />
                <div>
                  <h3 className="text-xl font-bold text-red-400">Submission Failed</h3>
                  <p className="text-red-300">There was an error submitting your pitch. Please try again.</p>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Wizard */}
          <div className="neo-glass-card rounded-3xl border border-cyan-400/20 shadow-2xl overflow-hidden">
            {submitting ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <h3 className="text-2xl font-bold text-white mb-2">Submitting Your Pitch...</h3>
                <p className="text-white/60">Please wait while we process your submission</p>
              </div>
            ) : (
              <ProjectPitchWizard onComplete={handlePitchComplete} />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
