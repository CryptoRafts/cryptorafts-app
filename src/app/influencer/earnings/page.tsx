'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Earning {
  id: string;
  amount: number;
  campaignName: string;
  date: any;
}

export default function InfluencerEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        const isReady = await waitForFirebase(5000);
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

        console.log('🔴 [INFLUENCER-EARNINGS] Setting up REAL-TIME projects listener');

        // Query projects collection - earnings can be derived from accepted projects
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          // Filter projects accepted by this influencer and derive earnings
          let earningsData: Earning[] = [];
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Only include projects accepted by this influencer
            if (data.influencerAction === 'accepted' && data.influencerActionBy === user.uid) {
              // Derive earnings from project funding
              const amount = data.currentFunding || data.fundingGoal || 0;
              if (amount > 0) {
                earningsData.push({
                  id: doc.id,
                  amount: amount,
                  campaignName: data.name || data.title || 'Unknown Campaign',
                  date: data.influencerActionAt || data.createdAt
                });
              }
            }
          });

          // Sort client-side by date descending
          earningsData.sort((a, b) => {
            let aTime = 0;
            if (a.date) {
              if (a.date.toMillis) {
                aTime = a.date.toMillis();
              } else if (a.date.seconds) {
                aTime = a.date.seconds * 1000;
              } else if (typeof a.date === 'number') {
                aTime = a.date;
              } else if (a.date instanceof Date) {
                aTime = a.date.getTime();
              } else {
                aTime = new Date(a.date).getTime() || 0;
              }
            }
            
            let bTime = 0;
            if (b.date) {
              if (b.date.toMillis) {
                bTime = b.date.toMillis();
              } else if (b.date.seconds) {
                bTime = b.date.seconds * 1000;
              } else if (typeof b.date === 'number') {
                bTime = b.date;
              } else if (b.date instanceof Date) {
                bTime = b.date.getTime();
              } else {
                bTime = new Date(b.date).getTime() || 0;
              }
            }
            
            return bTime - aTime;
          });

          console.log('🔴 [INFLUENCER-EARNINGS] Real-time update:', earningsData.length, 'earnings');
          setEarnings(earningsData);
          setLoading(false);
        }, (error: any) => {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [INFLUENCER-EARNINGS] Index error, using fallback');
            setEarnings([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('influencer earnings')(error);
            setEarnings([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up earnings listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Earnings</h2>
            <p className="text-white/90 text-lg">Track your income and payments</p>
          </div>

          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-white">${(totalEarnings / 1000).toFixed(1)}K</p>
              </div>
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="dollar" size={32} className="text-green-400" />
              </div>
            </div>
          </div>

          {earnings.length === 0 ? (
            <div className="text-center py-12 neo-glass-card rounded-xl">
              <p className="text-gray-400">No earnings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div key={earning.id} className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{earning.campaignName}</h3>
                      <p className="text-gray-400 text-sm">{new Date(earning.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-green-400 font-bold text-xl">${earning.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
