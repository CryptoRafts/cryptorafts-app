'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Client {
  id: string;
  name: string;
  project: string;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'pending';
  createdAt: any;
}

export default function AgencyClients() {
  const { user, isLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
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

        // Query projects collection instead of agencyClients
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.title || 'Unknown Project',
              project: data.name || data.title || 'Unknown',
              budget: data.fundingGoal || data.budget || 0,
              spent: data.currentFunding || 0,
              status: data.agencyAction === 'accepted' ? 'active' : 
                     data.status === 'approved' ? 'active' : 
                     data.status === 'pending' ? 'pending' : 'completed',
              createdAt: data.createdAt
            };
          }) as Client[];

          // Filter: Only show projects accepted by this agency or seeking services
          projectsData = projectsData.filter(p => {
            const projectDoc = snapshot.docs.find(d => d.id === p.id);
            if (!projectDoc) return false;
            const projectData = projectDoc.data();
            return (
              (projectData.agencyAction === 'accepted' && projectData.agencyActionBy === user.uid) ||
              projectData.seekingServices === true ||
              (projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('agency')) ||
              projectData.visibility === 'public'
            );
          });

          // Sort by createdAt in memory
          projectsData.sort((a, b) => {
            let aDate = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) {
                aDate = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                aDate = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                aDate = a.createdAt;
              } else if (a.createdAt instanceof Date) {
                aDate = a.createdAt.getTime();
              } else {
                aDate = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let bDate = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) {
                bDate = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                bDate = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                bDate = b.createdAt;
              } else if (b.createdAt instanceof Date) {
                bDate = b.createdAt.getTime();
              } else {
                bDate = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return bDate - aDate;
          });

          setClients(projectsData);
          setLoading(false);
        }, (error: any) => {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [AGENCY-CLIENTS] Index error, using fallback');
            setClients([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('agency clients')(error);
            setClients([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up clients listener:', error);
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

  const totalBudget = clients.reduce((sum, c) => sum + c.budget, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Clients</h2>
            <p className="text-white/90 text-lg">Manage your client relationships</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{clients.length}</p>
                </div>
                <NeonCyanIcon type="users" size={32} className="text-cyan-400" />
              </div>
            </div>

            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold text-white">{activeClients}</p>
                </div>
                <NeonCyanIcon type="check" size={32} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">All Clients</h3>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <NeonCyanIcon type="users" size={64} className="text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No clients yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{client.name}</h4>
                        <p className="text-gray-400 text-sm">{client.project}</p>
                        <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          client.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${(client.budget / 1000).toFixed(0)}K budget</p>
                        <p className="text-gray-400 text-sm">${(client.spent / 1000).toFixed(0)}K spent</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
