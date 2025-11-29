"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase.client';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { 
  RocketLaunchIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Project {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  tagline?: string;
  stage: string;
  sector: string;
  chain?: string;
  fundingGoal?: number;
  founderName?: string;
  founderId: string;
  status: string;
  website?: string;
  whitepaper?: string;
  pitchDeck?: string;
  team?: Array<{
    name: string;
    role: string;
    bio?: string;
  }>;
  traction?: {
    revenue?: number;
    users?: number;
    partnerships?: string[];
  };
  roadmap?: Array<{
    phase: string;
    timeline: string;
    milestones: string[];
  }>;
  createdAt: any;
  updatedAt: any;
  reviewedBy?: string;
  acceptedBy?: string;
  acceptedAt?: any;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, claims } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!params.id || typeof params.id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        if (!db) return;
        const projectDoc = await getDoc(doc(db!, 'projects', params.id));
        
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
        } else {
          console.log('Project not found');
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [params.id]);

  const handleReview = async (decision: 'approved' | 'rejected') => {
    if (!project || !user || !db) return;

    try {
      setSubmitting(true);
      console.log('📝 Submitting review...', { decision, rating, projectId: project.id });

      // Update project status
      await updateDoc(doc(db!, 'projects', project.id), {
        status: decision === 'approved' ? 'accepted' : 'rejected',
        reviewedBy: user.uid,
        reviewedByName: user.email,
        reviewedAt: serverTimestamp(),
        acceptedBy: decision === 'approved' ? user.uid : null,
        acceptedAt: decision === 'approved' ? serverTimestamp() : null,
        rejectedBy: decision === 'rejected' ? user.uid : null,
        rejectedAt: decision === 'rejected' ? serverTimestamp() : null,
        reviewRating: rating,
        reviewFeedback: feedback,
        updatedAt: serverTimestamp()
      });

      // Create review record
      await addDoc(collection(db!, 'reviews'), {
        projectId: project.id,
        projectName: project.name || project.title || 'Untitled',
        reviewerId: user.uid,
        reviewerName: user.email,
        reviewerRole: claims?.role || 'vc',
        decision,
        rating,
        feedback,
        createdAt: serverTimestamp()
      });

      // Create notification for founder
      await addDoc(collection(db!, 'notifications'), {
        userId: project.founderId,
        type: decision === 'approved' ? 'project_accepted' : 'project_rejected',
        title: decision === 'approved' ? 'Project Accepted!' : 'Project Reviewed',
        message: decision === 'approved' 
          ? `Your project "${project.name || project.title}" has been accepted!`
          : `Your project "${project.name || project.title}" has been reviewed. Check the feedback.`,
        projectId: project.id,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log(`✅ Project ${decision} successfully!`);
      console.log('✅ Review record created');
      console.log('✅ Notification sent to founder');
      
      setReviewModal(false);
      
      // Show success message
      alert(`Project ${decision === 'approved' ? 'approved' : 'rejected'} successfully!`);
      
      // Redirect to portfolio or reviews
      setTimeout(() => {
        if (decision === 'approved') {
          router.push('/vc/portfolio');
        } else {
          router.push('/vc/reviews');
        }
      }, 500);
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      console.error('Error details:', error.message, error.code);
      
      let errorMessage = 'Failed to submit review. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please ensure you have the VC role assigned.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-fluid-base">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-fluid-3xl font-bold text-white mb-4">404 - Project Not Found</h1>
          <p className="text-gray-300 text-fluid-base mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/vc/reviews')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-fluid-base"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  const displayName = project.name || project.title || 'Untitled Project';
  const isVC = claims?.role === 'vc';
  const canReview = isVC && ['pending', 'submitted', 'under_review'].includes(project.status);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors text-fluid-sm"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-fluid-3xl font-bold text-white mb-2 break-words">{displayName}</h1>
              <p className="text-gray-300 text-fluid-base mb-4 leading-relaxed">
                {project.description || project.tagline || 'No description available'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-fluid-xs rounded-full whitespace-nowrap">
                  {project.stage || 'Unknown Stage'}
                </span>
                <span className="px-3 py-1 bg-purple-600 text-white text-fluid-xs rounded-full whitespace-nowrap">
                  {project.sector || 'Unknown Sector'}
                </span>
                <span className={`px-3 py-1 text-fluid-xs rounded-full whitespace-nowrap ${
                  project.status === 'accepted' ? 'bg-green-600 text-white' :
                  project.status === 'rejected' ? 'bg-red-600 text-white' :
                  'bg-yellow-600 text-white'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>

            {canReview && (
              <button
                onClick={() => setReviewModal(true)}
                className="w-full lg:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-fluid-sm whitespace-nowrap"
              >
                Review Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Overview */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h2 className="text-fluid-xl font-bold text-white mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400 flex-shrink-0" />
                <span>Project Overview</span>
              </h2>
              <p className="text-gray-300 text-fluid-base leading-relaxed">
                {project.description || project.tagline || 'No detailed description available.'}
              </p>
            </div>

            {/* Team */}
            {project.team && project.team.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h2 className="text-fluid-xl font-bold text-white mb-4 flex items-center">
                  <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400 flex-shrink-0" />
                  <span>Team</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.team.map((member, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-fluid-lg font-semibold text-white break-words">{member.name}</h3>
                      <p className="text-blue-400 text-fluid-sm">{member.role}</p>
                      {member.bio && <p className="text-gray-300 text-fluid-sm mt-2 leading-relaxed">{member.bio}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traction */}
            {project.traction && (
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h2 className="text-fluid-xl font-bold text-white mb-4 flex items-center">
                  <RocketLaunchIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400 flex-shrink-0" />
                  <span>Traction</span>
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.traction.revenue && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-fluid-sm">Revenue</p>
                      <p className="text-fluid-2xl font-bold text-white">${(project.traction.revenue / 1000).toFixed(0)}K</p>
                    </div>
                  )}
                  {project.traction.users && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-fluid-sm">Users</p>
                      <p className="text-fluid-2xl font-bold text-white">{project.traction.users.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Roadmap */}
            {project.roadmap && project.roadmap.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h2 className="text-fluid-xl font-bold text-white mb-4">Roadmap</h2>
                <div className="space-y-4">
                  {project.roadmap.map((phase, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-fluid-lg font-semibold text-white">{phase.phase}</h3>
                      <p className="text-blue-400 text-fluid-sm mb-2">{phase.timeline}</p>
                      <ul className="list-disc list-inside text-gray-300 text-fluid-sm space-y-1 leading-relaxed">
                        {phase.milestones.map((milestone, idx) => (
                          <li key={idx} className="break-words">{milestone}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Info */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-fluid-xl font-bold text-white mb-4">Key Information</h3>
              <div className="space-y-3">
                {project.fundingGoal && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-fluid-sm">Funding Goal:</span>
                    <span className="text-white font-semibold text-fluid-sm">${(project.fundingGoal / 1000).toFixed(0)}K</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-fluid-sm">Stage:</span>
                  <span className="text-white text-fluid-sm">{project.stage || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-fluid-sm">Sector:</span>
                  <span className="text-white text-fluid-sm">{project.sector || 'N/A'}</span>
                </div>
                {project.chain && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-fluid-sm">Blockchain:</span>
                    <span className="text-white text-fluid-sm">{project.chain}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-fluid-sm">Founder:</span>
                  <span className="text-white text-fluid-sm truncate">{project.founderName || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-fluid-xl font-bold text-white mb-4">Resources</h3>
              <div className="space-y-3">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-fluid-sm"
                  >
                    <GlobeAltIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Website</span>
                  </a>
                )}
                {project.whitepaper && (
                  <a
                    href={project.whitepaper}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-fluid-sm"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Whitepaper</span>
                  </a>
                )}
                {project.pitchDeck && (
                  <a
                    href={project.pitchDeck}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-fluid-sm"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Pitch Deck</span>
                  </a>
                )}
              </div>
            </div>

            {/* Contact */}
            {isVC && (
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-fluid-xl font-bold text-white mb-4">Contact Founder</h3>
                <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center text-fluid-sm">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>Start Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal - Mobile-Optimized */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl p-6 sm:p-8 border-t sm:border border-gray-700 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            <h2 className="text-fluid-2xl font-bold text-white mb-6 break-words pr-8">
              Review: {displayName}
            </h2>

            <div className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-gray-300 text-fluid-sm font-medium mb-3">
                  Rating *
                </label>
                <div className="flex flex-wrap gap-2 sm:space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      {star <= rating ? (
                        <StarIconSolid className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-gray-300 text-fluid-sm font-medium mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition text-fluid-base resize-none"
                  placeholder="Provide feedback to the founder..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
                <button
                  onClick={() => {
                    setReviewModal(false);
                    setRating(0);
                    setFeedback('');
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-fluid-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={rating === 0 || submitting}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-fluid-sm"
                >
                  <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleReview('approved')}
                  disabled={rating === 0 || submitting}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-fluid-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white flex-shrink-0"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
