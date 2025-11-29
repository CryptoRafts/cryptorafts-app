"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { 
  EyeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ClockIcon,
  RocketLaunchIcon,
  DocumentTextIcon
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
  fundingGoal?: number;
  founderName?: string;
  founderId: string;
  status: string;
  createdAt: any;
  website?: string;
  pitchDeck?: string;
  team?: any[];
  traction?: any;
}

export default function VCReviews() {
  const { user, claims } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review'>('pending');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        console.log('📊 Loading LIVE projects for VC review...');

        // Query for projects that need review (pending status)
        const q = query(
          collection(dbInstance, 'projects'),
          where('status', 'in', ['pending', 'under_review', 'submitted']),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
          (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Project[];

            console.log(`📊 Loaded ${projectsData.length} projects for review`);
            setProjects(projectsData);
            setLoading(false);
          },
          createSnapshotErrorHandler('VC reviews')
        );

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  const handleStartReview = (project: Project) => {
    setSelectedProject(project);
    setReviewModal(true);
    setRating(0);
    setFeedback('');
  };

  const handleSubmitReview = async (decision: 'approved' | 'rejected') => {
    if (!selectedProject || !user) return;

    try {
      setSubmitting(true);
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        throw new Error('Firebase not initialized. Please refresh the page and try again.');
      }

      const dbInstance = ensureDb();

      // Update project status
      const timestamp = Date.now();
      await updateDoc(doc(dbInstance, 'projects', selectedProject.id), {
        status: decision === 'approved' ? 'accepted' : 'rejected',
        vcAction: decision === 'approved' ? 'accepted' : 'rejected',
        reviewedBy: user.uid,
        reviewedByName: user.email,
        reviewedAt: timestamp,
        acceptedBy: decision === 'approved' ? user.uid : null,
        acceptedAt: decision === 'approved' ? timestamp : null,
        rejectedBy: decision === 'rejected' ? user.uid : null,
        rejectedAt: decision === 'rejected' ? timestamp : null,
        declinedBy: decision === 'rejected' ? user.uid : null,
        declinedAt: decision === 'rejected' ? timestamp : null,
        reviewRating: rating,
        reviewFeedback: feedback,
        updatedAt: timestamp
      });

      // Create review record
      await addDoc(collection(dbInstance, 'reviews'), {
        projectId: selectedProject.id,
        projectName: selectedProject.name || selectedProject.title || 'Untitled',
        reviewerId: user.uid,
        reviewerName: user.email,
        reviewerRole: claims?.role || 'vc',
        decision,
        rating,
        feedback,
        createdAt: timestamp
      });

      // Create notification for founder
      await addDoc(collection(dbInstance, 'notifications'), {
        userId: selectedProject.founderId,
        type: decision === 'approved' ? 'project_accepted' : 'project_rejected',
        title: decision === 'approved' ? 'Project Accepted!' : 'Project Reviewed',
        message: decision === 'approved' 
          ? `Your project "${selectedProject.name || selectedProject.title}" has been accepted!`
          : `Your project "${selectedProject.name || selectedProject.title}" has been reviewed. Check the feedback.`,
        projectId: selectedProject.id,
        read: false,
        createdAt: timestamp
      });

      console.log(`✅ Project ${decision}:`, selectedProject.id);
      
      setReviewModal(false);
      setSelectedProject(null);
      setRating(0);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    if (filter === 'pending') return project.status === 'pending' || project.status === 'submitted';
    if (filter === 'under_review') return project.status === 'under_review';
    return true;
  });

  if (!user || claims?.role !== 'vc') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-white text-fluid-lg">Access denied. VC role required.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-fluid-base">Loading projects for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-fluid-3xl font-bold text-white mb-2">Review Projects</h1>
              <p className="text-gray-300 text-fluid-sm">Review and evaluate project submissions from founders</p>
            </div>
            <div className="flex items-center justify-start sm:justify-end">
              <div className="bg-green-500/20 text-green-400 px-3 sm:px-4 py-2 rounded-full text-fluid-xs font-medium whitespace-nowrap">
                🔴 {projects.length} Live Projects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-fluid-xs font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-fluid-xs font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pending ({projects.filter(p => p.status === 'pending' || p.status === 'submitted').length})
            </button>
            <button
              onClick={() => setFilter('under_review')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-fluid-xs font-medium transition-colors whitespace-nowrap ${
                filter === 'under_review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Under Review ({projects.filter(p => p.status === 'under_review').length})
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-fluid-xl font-semibold text-gray-300 mb-2">No projects to review</h3>
            <p className="text-gray-400 text-fluid-sm">
              {filter === 'all' 
                ? 'No project submissions available at the moment.'
                : `No ${filter} projects found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-fluid-lg font-bold text-white mb-2 break-words">
                      {project.name || project.title || 'Untitled Project'}
                    </h3>
                    <p className="text-gray-300 text-fluid-sm line-clamp-2 mb-3 leading-relaxed">
                      {project.description || project.tagline || 'No description available'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-fluid-xs">
                    <span className="text-gray-400">Founder:</span>
                    <span className="text-white truncate ml-2">{project.founderName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-fluid-xs">
                    <span className="text-gray-400">Stage:</span>
                    <span className="text-white">{project.stage || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-fluid-xs">
                    <span className="text-gray-400">Sector:</span>
                    <span className="text-white truncate ml-2">{project.sector || 'N/A'}</span>
                  </div>
                  {project.fundingGoal && (
                    <div className="flex items-center justify-between text-fluid-xs">
                      <span className="text-gray-400">Funding Goal:</span>
                      <span className="text-white font-medium">${(project.fundingGoal / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-fluid-xs">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white">
                      {project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-fluid-xs"
                  >
                    <EyeIcon className="w-4 h-4 flex-shrink-0" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleStartReview(project)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-fluid-xs"
                  >
                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal - Mobile-Optimized */}
      {reviewModal && selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl p-6 sm:p-8 border-t sm:border border-gray-700 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            <h2 className="text-fluid-2xl font-bold text-white mb-6 break-words pr-4">
              Review: {selectedProject.name || selectedProject.title}
            </h2>

            <div className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-gray-300 text-fluid-sm font-medium mb-3">
                  Rating *
                </label>
                <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setReviewModal(false);
                    setSelectedProject(null);
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-fluid-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitReview('rejected')}
                  disabled={rating === 0 || submitting}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-fluid-sm"
                >
                  <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleSubmitReview('approved')}
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
