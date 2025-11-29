'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where, limit, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Listing {
  id: string;
  tokenName: string;
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: any;
}

export default function ExchangeListingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>('pending');

  // Check KYB status
  useEffect(() => {
    if (!user) return;

    const checkKYBStatus = async () => {
      try {
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const status = data.kybStatus || data.kyb?.status || 'pending';
          setKybStatus(status);

          if (status !== 'verified' && status !== 'approved') {
            router.push('/exchange/pending-approval');
          }
        }
      } catch (error) {
        console.error('Error checking KYB status:', error);
      }
    };

    checkKYBStatus();
  }, [user, router]);

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

        console.log('🔴 [EXCHANGE-LISTINGS] Setting up REAL-TIME projects listener');

        // OPTIMIZED: Server-side filtering - only fetch projects accepted by THIS user
        // This is MUCH faster than fetching all projects and filtering client-side
        const projectsQuery = query(
          collection(dbInstance, 'projects'),
          where('exchangeAction', '==', 'accepted'),
          where('exchangeActionBy', '==', user.uid),
          limit(100) // Limit to reduce data transfer and improve speed
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          let projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            // Determine status correctly
            let listingStatus: 'active' | 'pending' | 'suspended' = 'pending';
            
            if (data.exchangeAction === 'accepted' && data.exchangeActionBy === user.uid) {
              // Project accepted by this exchange - should be active
              listingStatus = 'active';
            } else if (data.exchangeAction === 'rejected' && data.exchangeActionBy === user.uid) {
              // Project rejected by this exchange - suspended
              listingStatus = 'suspended';
            } else if (data.status === 'rejected' || data.reviewStatus === 'rejected') {
              // Project rejected by admin - suspended
              listingStatus = 'suspended';
            } else if (data.exchangeAction === 'accepted') {
              // Accepted by another exchange - show as active (they can still see it)
              listingStatus = 'active';
            } else if (data.status === 'approved' || data.reviewStatus === 'approved') {
              // Approved by admin but not yet accepted - pending
              listingStatus = 'pending';
            } else {
              // Default to pending for any other state
              listingStatus = 'pending';
            }
            
            return {
              id: doc.id,
              tokenName: data.name || data.title || 'Unknown',
              symbol: data.tokenSymbol || 'N/A',
              price: data.tokenPrice || 0,
              volume24h: data.volume24h || 0,
              marketCap: data.marketCap || data.fundingGoal || 0,
              status: listingStatus,
              createdAt: data.createdAt,
              projectData: data // Store full project data for logo extraction
            };
          }) as Listing[];

          // OPTIMIZED: Server-side filtering already done - all projects are accepted by THIS user
          // No need for additional client-side filtering - much faster!
          // User isolation is guaranteed by the where() clause

          // Sort client-side by createdAt descending
          projectsData.sort((a, b) => {
            let timeA = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) {
                timeA = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                timeA = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                timeA = a.createdAt;
              } else if (a.createdAt instanceof Date) {
                timeA = a.createdAt.getTime();
              } else {
                timeA = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let timeB = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) {
                timeB = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                timeB = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                timeB = b.createdAt;
              } else if (b.createdAt instanceof Date) {
                timeB = b.createdAt.getTime();
              } else {
                timeB = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return timeB - timeA;
          });

          console.log('🔴 [EXCHANGE-LISTINGS] Real-time update:', projectsData.length, 'listings');
          setListings(projectsData);
          setLoading(false);
        }, (error: any) => {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ [EXCHANGE-LISTINGS] Index error, using fallback');
            setListings([]);
            setLoading(false);
          } else {
            createSnapshotErrorHandler('exchange listings')(error);
            setListings([]);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up listings listener:', error);
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

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Token Listings</h2>
            <p className="text-white/90 text-lg">Manage your exchange token listings</p>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12 neo-glass-card rounded-xl">
              <NeonCyanIcon type="globe" size={64} className="text-cyan-400/50 mx-auto mb-4" />
              <p className="text-cyan-400/70">No listings yet</p>
            </div>
          ) : (
            <div className="neo-glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Token</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">24h Volume</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Market Cap</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {listings.map((listing) => (
                      <tr 
                        key={listing.id} 
                        className="hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/exchange/project/${listing.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {(() => {
                              const logoUrl = (listing as any).projectData ? extractProjectLogoUrl((listing as any).projectData) : null;
                              return logoUrl ? (
                                <img 
                                  src={logoUrl} 
                                  alt={listing.tokenName} 
                                  className="w-10 h-10 rounded-lg object-cover mr-3 border border-cyan-400/30"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 border border-cyan-400/30">
                                  <span className="text-white font-bold text-sm">{listing.symbol?.charAt(0)?.toUpperCase() || 'L'}</span>
                                </div>
                              );
                            })()}
                            <div>
                              <div className="text-white font-medium">{listing.tokenName}</div>
                              <div className="text-cyan-400/70 text-sm">{listing.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">${listing.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">${((listing.volume24h || 0) / 1000).toFixed(0)}K</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">${((listing.marketCap || 0) / 1000000).toFixed(1)}M</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            listing.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-blue-400 hover:text-blue-300 mr-4"
                            onClick={() => router.push(`/exchange/project/${listing.id}`)}
                          >
                            <NeonCyanIcon type="edit" size={20} className="text-current" />
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            <NeonCyanIcon type="trash" size={20} className="text-current" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
