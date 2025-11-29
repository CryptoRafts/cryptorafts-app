'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, getUserDocument, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import RoleAnalytics from '@/components/RoleAnalytics';
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
  listedAt: any;
  createdAt?: any;
  projectData?: any; // Full project data for logo extraction
}

export default function ExchangeDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>('pending');

  // Check onboarding status and redirect if needed
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
        if (!isReady || !isMounted) {
          if (!isReady) {
            console.error('❌ Firebase not initialized');
          }
          return;
        }

        const userData = await getUserDocument(user.uid);
        if (userData && isMounted) {
          // Step 1: Check if profile is completed
          if (!userData.profileCompleted) {
            console.log('🛡️ [EXCHANGE-DASHBOARD] Profile not completed, redirecting to register');
            router.push('/exchange/register');
            return;
          }

          // Step 2: Check KYB status from user document
          let status = (userData.kybStatus || userData.kyb?.status || userData.kyb_status || 'not_submitted').toLowerCase();
          
          // CRITICAL: Also check organization document as backup (organization is source of truth)
          // This prevents infinite loops when user doc hasn't updated yet but org doc shows approved
          if (status === 'pending' || status === 'submitted' || !status) {
            try {
              const firestoreDb = ensureDb();
              if (firestoreDb) {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const orgsQuery = query(
                  collection(firestoreDb, 'organizations'),
                  where('userId', '==', user.uid)
                );
                const orgsSnapshot = await getDocs(orgsQuery);
                
                if (!orgsSnapshot.empty) {
                  const orgData = orgsSnapshot.docs[0].data();
                  const orgStatus = (orgData.kybStatus || 'pending').toLowerCase();
                  
                  // If organization shows approved/verified, use that instead
                  if (orgStatus === 'approved' || orgStatus === 'verified') {
                    console.log('✅ [EXCHANGE-DASHBOARD] Organization shows approved, allowing dashboard access');
                    status = orgStatus;
                    setKybStatus(orgStatus);
                    // Don't redirect - allow dashboard access
                    return;
                  } else if (orgStatus === 'pending' || orgStatus === 'submitted') {
                    status = orgStatus;
                    setKybStatus(orgStatus);
                  }
                }
              }
            } catch (orgError) {
              console.error('Error checking organization document:', orgError);
            }
          }
          
          setKybStatus(status);

          // Step 3: Redirect based on KYB status
          if (status === 'not_submitted' || !status) {
            console.log('🛡️ [EXCHANGE-DASHBOARD] KYB not submitted, redirecting to KYB page');
            router.push('/exchange/kyb');
          } else if (status === 'pending' || status === 'submitted') {
            console.log('🛡️ [EXCHANGE-DASHBOARD] KYB pending approval, redirecting to pending approval');
            router.push('/exchange/pending-approval');
          } else if (status === 'rejected') {
            console.log('🛡️ [EXCHANGE-DASHBOARD] KYB rejected, redirecting to KYB page');
            router.push('/exchange/kyb');
          }
          // If approved/verified, allow access to dashboard
        }
      } catch (error: any) {
        if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
          console.log('⚠️ Onboarding status listener already exists, skipping...');
          return;
        }
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [user, router]);

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
        
        console.log('🔴 [EXCHANGE-DASHBOARD] Setting up REAL-TIME projects listener for:', user.email);

        // OPTIMIZED: Use server-side filtering to reduce data transfer
        // Query 1: Projects accepted by THIS user (user-specific, fast)
        const acceptedQuery = query(
          collection(dbInstance, 'projects'),
          where('exchangeAction', '==', 'accepted'),
          where('exchangeActionBy', '==', user.uid),
          limit(50) // Limit to reduce data transfer
        );

        // Query 2: Projects seeking listing (approved by admin, not accepted by anyone)
        const seekingQuery = query(
          collection(dbInstance, 'projects'),
          where('status', '==', 'approved'),
          where('seekingListing', '==', true),
          limit(50) // Limit to reduce data transfer
        );

        // Combine both queries using Promise.all for parallel fetching
        let acceptedProjects: Listing[] = [];
        let seekingProjects: Listing[] = [];

        // OPTIMIZED: Use two separate listeners for better performance
        const unsubscribeAccepted = onSnapshot(acceptedQuery, (snapshot) => {
          acceptedProjects = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              tokenName: data.name || data.title || 'Unknown',
              symbol: data.tokenSymbol || 'N/A',
              price: data.tokenPrice || 0,
              volume24h: data.volume24h || 0,
              marketCap: data.marketCap || data.fundingGoal || 0,
              status: 'active' as const, // Accepted by this user = active
              listedAt: data.exchangeActionAt || data.createdAt,
              createdAt: data.createdAt,
              projectData: data // Store full project data for logo extraction
            };
          }) as Listing[];

          // Merge, sort, and update
          const allProjects = [...acceptedProjects, ...seekingProjects];
          
          // Sort by createdAt descending (most recent first)
          allProjects.sort((a, b) => {
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
            
            return timeB - timeA; // Descending order (newest first)
          });
          
          console.log('✅ REAL-TIME [EXCHANGE-DASHBOARD]: Projects updated -', allProjects.length, 'listings');
          setListings(allProjects);
          setLoading(false);
        }, createSnapshotErrorHandler('exchange accepted projects'));

        const unsubscribeSeeking = onSnapshot(seekingQuery, (snapshot) => {
          seekingProjects = snapshot.docs.map(doc => {
            const data = doc.data();
            // Additional client-side filter: exclude if accepted by another user
            if (data.exchangeAction === 'accepted' && data.exchangeActionBy !== user.uid) {
              return null; // Exclude projects accepted by other users
            }
            return {
              id: doc.id,
              tokenName: data.name || data.title || 'Unknown',
              symbol: data.tokenSymbol || 'N/A',
              price: data.tokenPrice || 0,
              volume24h: data.volume24h || 0,
              marketCap: data.marketCap || data.fundingGoal || 0,
              status: 'pending' as const, // Seeking listing = pending
              listedAt: data.exchangeActionAt || data.createdAt,
              createdAt: data.createdAt,
              projectData: data // Store full project data for logo extraction
            };
          }).filter(p => p !== null) as Listing[];
            
          // Merge, sort, and update
          const allProjects = [...acceptedProjects, ...seekingProjects];

          // Sort by createdAt descending (most recent first)
          allProjects.sort((a, b) => {
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
            
            return timeB - timeA; // Descending order (newest first)
          });

          console.log('✅ REAL-TIME [EXCHANGE-DASHBOARD]: Projects updated -', allProjects.length, 'listings');
          setListings(allProjects);
          setLoading(false);
        }, createSnapshotErrorHandler('exchange seeking projects'));

        // Return combined unsubscribe function
        const unsubscribe = () => {
          unsubscribeAccepted();
          unsubscribeSeeking();
        };

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

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  const totalVolume = listings.reduce((sum, l) => sum + (l.volume24h || 0), 0);
  const totalMarketCap = listings.reduce((sum, l) => sum + (l.marketCap || 0), 0);
  const activeListings = listings.filter(l => l.status === 'active').length;

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="neo-glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
            <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome to Your Exchange Hub
            </h2>
            <p className="text-white/90 text-lg">
              Manage token listings, track trading volumes, and monitor market performance.
            </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg border border-cyan-400/30">
                  <NeonCyanIcon type="globe" size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/exchange/dealflow">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="listings" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Dealflow</h3>
                    <p className="text-cyan-400/70 text-sm">Review projects</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/exchange/listings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="globe" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Listings</h3>
                    <p className="text-cyan-400/70 text-sm">Manage tokens</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/exchange/analytics">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="analytics" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analytics</h3>
                    <p className="text-cyan-400/70 text-sm">Market insights</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/exchange/settings">
              <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-400/30">
                    <NeonCyanIcon type="listings" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                    <p className="text-cyan-400/70 text-sm">Exchange settings</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Analytics Section */}
          {user && (
            <div className="mb-8">
              <RoleAnalytics role="exchange" userId={user.uid} />
            </div>
          )}

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Portfolio</h3>
              <Link href="/exchange/listings" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="neo-glass-card rounded-xl p-12 text-center">
                <NeonCyanIcon type="globe" size={64} className="text-cyan-400/50 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">No Listings Yet</h4>
                <p className="text-cyan-400/70 mb-6">Start by reviewing projects in Dealflow</p>
                <Link href="/exchange/dealflow" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  Review Projects
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.slice(0, 6).map((listing) => {
                  const logoUrl = listing.projectData ? extractProjectLogoUrl(listing.projectData) : null;
                  return (
                  <Link key={listing.id} href={`/exchange/project/${listing.id}`}>
                    <div className="neo-glass-card rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={listing.tokenName} 
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${logoUrl ? 'hidden' : 'flex'}`}>
                            <span className="text-white font-bold text-lg">
                              {listing.symbol?.charAt(0)?.toUpperCase() || listing.tokenName?.charAt(0)?.toUpperCase() || 'L'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                            {listing.tokenName}
                          </h4>
                            <p className="text-cyan-400/70 text-sm">Symbol: {listing.symbol}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          listing.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' :
                          listing.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                          'bg-red-500/20 text-red-400 border-red-400/30'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                        <div>
                          <p className="text-cyan-400/70 text-xs">Price</p>
                          <p className="text-white font-semibold">${listing.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400/70 text-xs">24h Volume</p>
                          <p className="text-white font-semibold">${((listing.volume24h || 0) / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Listings */}
          <div className="neo-glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Listings</h3>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-cyan-400/70">No listings yet. Start by reviewing projects in Dealflow.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.slice(0, 5).map((listing) => {
                  const logoUrl = listing.projectData ? extractProjectLogoUrl(listing.projectData) : null;
                  return (
                  <Link key={listing.id} href={`/exchange/project/${listing.id}`}>
                    <div className="neo-glass-card rounded-lg p-4 hover:border-cyan-400/40 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={listing.tokenName} 
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 ${logoUrl ? 'hidden' : 'flex'}`}>
                            <span className="text-white font-bold text-sm">
                              {listing.symbol?.charAt(0)?.toUpperCase() || listing.tokenName?.charAt(0)?.toUpperCase() || 'L'}
                          </span>
                        </div>
                        <div>
                            <h4 className="text-white font-medium">{listing.tokenName}</h4>
                            <p className="text-cyan-400/70 text-sm">{listing.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${listing.price}</p>
                          <p className="text-cyan-400/70 text-sm">{listing.stage || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
