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

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'high' | 'medium' | 'low';
  dueDate?: any;
  createdAt: any;
}

export default function ExchangeCompliancePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
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

        console.log('🔴 [EXCHANGE-COMPLIANCE] Setting up REAL-TIME compliance listener');

        // Query compliance items for this exchange
        const complianceQuery = query(
          collection(dbInstance, 'compliance_items'),
          where('exchangeId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(complianceQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ComplianceItem[];

          // Sort by priority and createdAt
          items.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            
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

          console.log('✅ [EXCHANGE-COMPLIANCE] Real-time update:', items.length, 'items');
          setComplianceItems(items);
          setLoading(false);
        }, (error: any) => {
          // If collection doesn't exist or no items, show empty state
          if (error?.code === 'failed-precondition' || error?.code === 'not-found') {
            console.log('⚠️ [EXCHANGE-COMPLIANCE] No compliance items collection or index');
            setComplianceItems([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('exchange compliance items')(error);
            setComplianceItems([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up compliance listener:', error);
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

  const filteredItems = filter === 'all' 
    ? complianceItems 
    : complianceItems.filter(item => item.status === filter);

  const pendingCount = complianceItems.filter(i => i.status === 'pending' || i.status === 'in_review').length;
  const approvedCount = complianceItems.filter(i => i.status === 'approved').length;
  const rejectedCount = complianceItems.filter(i => i.status === 'rejected').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Compliance Center</h2>
                <p className="text-white/90 text-lg">Manage regulatory compliance and requirements</p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="shield" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Items</p>
                  <p className="text-2xl font-bold text-white">{complianceItems.length}</p>
                </div>
                <NeonCyanIcon type="shield" size={32} className="text-cyan-400" />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending Review</p>
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
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-white">{rejectedCount}</p>
                </div>
                <NeonCyanIcon type="exclamation" size={32} className="text-red-400" />
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

          {/* Compliance Items List */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 neo-glass-card rounded-xl">
                <NeonCyanIcon type="shield" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Compliance Items</h4>
                <p className="text-cyan-400/70">Compliance requirements will appear here when available</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold text-lg">{item.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                          item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                        }`}>
                          {item.priority} priority
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                          item.status === 'rejected' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                          item.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-cyan-400/70 text-sm mb-3">{item.description}</p>
                      {item.dueDate && (
                        <p className="text-cyan-400/50 text-xs">
                          Due: {item.dueDate instanceof Date ? item.dueDate.toLocaleDateString() : 
                                item.dueDate?.toDate ? item.dueDate.toDate().toLocaleDateString() : 
                                'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

