'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
// Icons replaced with NeonCyanIcon

interface Review {
  id: string;
  projectId: string;
  projectName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewerName?: string;
}

export default function ExchangeReviewsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
        if (!isReady) {
          console.error('❌ Firebase not initialized');
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        console.log('🔴 [EXCHANGE-REVIEWS] Setting up REAL-TIME reviews listener');

        // Query reviews for this exchange
        const reviewsQuery = query(
          collection(dbInstance, 'reviews'),
          where('exchangeId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Review[];

          // Sort by createdAt descending
          reviewsData.sort((a, b) => {
            let timeA = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) timeA = a.createdAt.toMillis();
              else if (a.createdAt.seconds) timeA = a.createdAt.seconds * 1000;
              else if (typeof a.createdAt === 'number') timeA = a.createdAt;
              else if (a.createdAt instanceof Date) timeA = a.createdAt.getTime();
              else timeA = new Date(a.createdAt).getTime() || 0;
            }
            
            let timeB = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) timeB = b.createdAt.toMillis();
              else if (b.createdAt.seconds) timeB = b.createdAt.seconds * 1000;
              else if (typeof b.createdAt === 'number') timeB = b.createdAt;
              else if (b.createdAt instanceof Date) timeB = b.createdAt.getTime();
              else timeB = new Date(b.createdAt).getTime() || 0;
            }
            
            return timeB - timeA;
          });

          console.log('✅ [EXCHANGE-REVIEWS] Real-time update:', reviewsData.length, 'reviews');
          setReviews(reviewsData);
          setLoading(false);
        }, (error: any) => {
          // If collection doesn't exist or no reviews, show empty state
          if (error?.code === 'failed-precondition' || error?.code === 'not-found') {
            console.log('⚠️ [EXCHANGE-REVIEWS] No reviews collection or index');
            setReviews([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('exchange reviews')(error);
            setReviews([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up reviews listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.status === filter);

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Project Reviews</h2>
                <p className="text-white/90 text-lg">Review and manage project evaluations</p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="star" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Reviews</p>
                  <p className="text-2xl font-bold text-white">{reviews.length}</p>
                </div>
                <NeonCyanIcon type="chat" size={32} className="text-cyan-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Average Rating</p>
                  <p className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</p>
                </div>
                <NeonCyanIcon type="star" size={32} className="text-yellow-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                </div>
                <NeonCyanIcon type="clock" size={32} className="text-yellow-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-white">{approvedCount}</p>
                </div>
                <NeonCyanIcon type="check" size={32} className="text-green-400" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  filter === filterOption
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'neo-glass-card text-white/60 hover:text-white hover:border-cyan-400/30'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 neo-glass-card rounded-xl">
                <NeonCyanIcon type="star" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Reviews Yet</h4>
                <p className="text-cyan-400/70">Project reviews will appear here when available</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold text-lg">{review.projectName}</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <NeonCyanIcon type="star"
                              key={i}
                              className={`w-5 h-5 ${
                                i < (review.rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                          review.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      {review.reviewerName && (
                        <p className="text-cyan-400/70 text-sm mb-2">By: {review.reviewerName}</p>
                      )}
                      <p className="text-white/80 text-sm">{review.comment}</p>
                    </div>
                  </div>
                  {review.projectId && (
                    <button
                      onClick={() => router.push(`/exchange/project/${review.projectId}`)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      View Project →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

