'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, where, onSnapshot, orderBy, doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface DealRoom {
  id: string;
  projectId: string;
  projectName: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  founderId: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  amount: number;
  message: string;
  createdAt: any;
  updatedAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
}

export default function FounderDealsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dealRooms, setDealRooms] = useState<DealRoom[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<DealRoom | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('pending');

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  // Check KYC status
  useEffect(() => {
    if (!user) return;

    const checkKYCStatus = async () => {
      try {
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const status = data.kycStatus || data.kyc?.status || 'pending';
          setKycStatus(status);

          // Redirect if KYC is not approved
          if (status !== 'verified' && status !== 'approved') {
            router.push('/founder/pending-approval');
          }
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      }
    };

    checkKYCStatus();
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    const setupListeners = async () => {
      try {
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        // Real-time listener for deal rooms - query groupChats where founder is a member
        let unsubscribeDeals: (() => void) | undefined;
        
        try {
          // Query groupChats where founderId matches OR founder is in members array
          const dealRoomsQuery = query(
            collection(dbInstance, 'groupChats'),
            where('founderId', '==', user.uid)
          );

          unsubscribeDeals = onSnapshot(dealRoomsQuery, (snapshot) => {
            const dealsData = snapshot.docs
              .map(doc => {
                const data = doc.data();
                // Only include deal-type rooms or rooms where founder is a member
                if (data.type === 'deal' || data.type === 'listing' || data.type === 'ido' || data.type === 'campaign' || 
                    (data.members && Array.isArray(data.members) && data.members.includes(user.uid))) {
                  return {
              id: doc.id,
                    projectId: data.projectId || '',
                    projectName: data.name || data.projectName || 'Untitled Project',
                    investorId: data.counterpartId || data.investorId || '',
                    investorName: data.counterpartName || data.investorName || data.memberNames?.[data.counterpartId] || 'Unknown',
                    investorEmail: data.counterpartEmail || data.investorEmail || '',
                    founderId: data.founderId || user.uid,
                    status: data.status || 'active',
                    amount: data.amount || 0,
                    message: data.lastMessage?.text || data.message || '',
                    createdAt: data.createdAt?.toDate?.() || (typeof data.createdAt === 'number' ? new Date(data.createdAt) : new Date()),
                    updatedAt: data.lastActivityAt?.toDate?.() || (typeof data.lastActivityAt === 'number' ? new Date(data.lastActivityAt) : new Date()) || new Date(),
                    lastMessage: data.lastMessage?.text || '',
                    lastMessageAt: data.lastMessage?.createdAt ? (typeof data.lastMessage.createdAt === 'number' ? new Date(data.lastMessage.createdAt) : data.lastMessage.createdAt.toDate?.() || null) : null,
                    unreadCount: data.unreadCount?.[user.uid] || 0,
                  } as DealRoom;
                }
                return null;
              })
              .filter((deal): deal is DealRoom => deal !== null);

            // Sort client-side by updatedAt descending
            dealsData.sort((a, b) => {
              const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
              const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
              return bTime - aTime;
            });

            console.log('✅ [DEALS] Loaded', dealsData.length, 'deal rooms');
            setDealRooms(dealsData);
            // Don't set loading to false here - let projects listener handle it
            // This prevents race conditions
          }, (error: any) => {
            console.error('❌ [DEALS] Error loading deal rooms:', error);
            // Try fallback: query by members array
              try {
                const fallbackQuery = query(
                collection(dbInstance, 'groupChats'),
                where('members', 'array-contains', user.uid)
                );
                
                unsubscribeDeals = onSnapshot(fallbackQuery, (snapshot) => {
                const dealsData = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    if (data.type === 'deal' || data.type === 'listing' || data.type === 'ido' || data.type === 'campaign') {
                      return {
                    id: doc.id,
                        projectId: data.projectId || '',
                        projectName: data.name || data.projectName || 'Untitled Project',
                        investorId: data.counterpartId || data.investorId || '',
                        investorName: data.counterpartName || data.investorName || data.memberNames?.[data.counterpartId] || 'Unknown',
                        investorEmail: data.counterpartEmail || data.investorEmail || '',
                        founderId: data.founderId || user.uid,
                        status: data.status || 'active',
                        amount: data.amount || 0,
                        message: data.lastMessage?.text || data.message || '',
                        createdAt: data.createdAt?.toDate?.() || (typeof data.createdAt === 'number' ? new Date(data.createdAt) : new Date()),
                        updatedAt: (data.lastActivityAt?.toDate && typeof data.lastActivityAt.toDate === 'function') 
                          ? data.lastActivityAt.toDate() 
                          : (typeof data.lastActivityAt === 'number' ? new Date(data.lastActivityAt) : (data.lastActivityAt ? new Date(data.lastActivityAt) : new Date())),
                        lastMessage: data.lastMessage?.text || '',
                        lastMessageAt: data.lastMessage?.createdAt ? (typeof data.lastMessage.createdAt === 'number' ? new Date(data.lastMessage.createdAt) : data.lastMessage.createdAt.toDate?.() || null) : null,
                        unreadCount: data.unreadCount?.[user.uid] || 0,
                      } as DealRoom;
                    }
                    return null;
                  })
                  .filter((deal): deal is DealRoom => deal !== null);

                  dealsData.sort((a, b) => {
                    const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
                    const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
                    return bTime - aTime;
                  });
                  
                console.log('✅ [DEALS] Fallback loaded', dealsData.length, 'deal rooms');
                  setDealRooms(dealsData);
                setLoading(false);
                }, createSnapshotErrorHandler('founder deal rooms fallback'));
              } catch (fallbackError) {
                console.error('❌ [DEALS] Fallback query also failed:', fallbackError);
              setDealRooms([]);
              setLoading(false);
            }
          });
        } catch (setupError) {
          console.error('❌ [DEALS] Error setting up listener:', setupError);
          setDealRooms([]);
          setLoading(false);
        }

        // Real-time listener for user's projects
        const projectsQuery = query(
          collection(dbInstance, 'projects'),
          where('founderId', '==', user.uid),
          where('status', 'in', ['approved', 'active'])
        );

        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
          const projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];

          setProjects(projectsData);
          // Set loading to false after both listeners have fired
          setLoading(false);
        }, createSnapshotErrorHandler('founder projects'));

        return () => {
          if (unsubscribeDeals) unsubscribeDeals();
          unsubscribeProjects();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-black/40 text-cyan-400/70 border-cyan-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <NeonCyanIcon type="check" className="text-current" size={16} />;
      case 'pending':
        return <NeonCyanIcon type="shield" className="text-current" size={16} />;
      case 'completed':
        return <NeonCyanIcon type="check" className="text-current" size={16} />;
      case 'declined':
        return <NeonCyanIcon type="exclamation" className="text-current" size={16} />;
      default:
        return <NeonCyanIcon type="shield" className="text-current" size={16} />;
    }
  };

  const handleAcceptDeal = async (dealId: string) => {
    try {
      const dbInstance = ensureDb();
      if (!dbInstance) return;
      await updateDoc(doc(dbInstance, 'groupChats', dealId), {
        status: 'active',
        lastActivityAt: Date.now(),
      });
    } catch (error) {
      console.error('Error accepting deal:', error);
      alert('Failed to accept deal. Please try again.');
    }
  };

  const handleDeclineDeal = async (dealId: string) => {
    try {
      const dbInstance = ensureDb();
      if (!dbInstance) return;
      await updateDoc(doc(dbInstance, 'groupChats', dealId), {
        status: 'declined',
        lastActivityAt: Date.now(),
      });
    } catch (error) {
      console.error('Error declining deal:', error);
      alert('Failed to decline deal. Please try again.');
    }
  };

  const totalDeals = dealRooms.length;
  const activeDeals = dealRooms.filter(deal => deal.status === 'active').length;
  const pendingDeals = dealRooms.filter(deal => deal.status === 'pending').length;
  const totalInvestment = dealRooms
    .filter(deal => deal.status === 'completed')
    .reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        {/* Main Content */}
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 mb-8 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <NeonCyanIcon type="globe" className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Deal Rooms</h1>
                  <p className="text-white/80 text-lg">Manage investor conversations and funding deals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{totalDeals}</p>
                <p className="text-cyan-400/70 text-sm">Total Deals</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Active Deals</p>
                  <p className="text-3xl font-bold text-white mt-2">{activeDeals}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="check" className="text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Pending Deals</p>
                  <p className="text-3xl font-bold text-white mt-2">{pendingDeals}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="clock" className="text-yellow-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Total Investment</p>
                  <p className="text-3xl font-bold text-white mt-2">${(totalInvestment / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="dollar" className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {totalDeals > 0 ? ((activeDeals + dealRooms.filter(d => d.status === 'completed').length) / totalDeals * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <NeonCyanIcon type="analytics" className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Deal Rooms */}
          {dealRooms.length === 0 ? (
            <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 border-2 border-cyan-400/20 shadow-2xl shadow-cyan-500/10 text-center">
              <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-400/20">
                <NeonCyanIcon type="globe" className="text-cyan-400/70" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Deal Rooms Yet</h3>
              <p className="text-cyan-400/70 text-lg mb-8">Investors will create deal rooms when they're interested in your projects. You'll see them here once they start conversations.</p>
              <div className="text-sm text-cyan-400/60">
                <p>Make sure your projects are approved and visible to investors.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Active Conversations</h3>
              {dealRooms.map((deal) => (
                <div key={deal.id} className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 hover:border-cyan-400/50 shadow-lg shadow-cyan-500/10 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <NeonCyanIcon type="chat" className="text-white" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{deal.projectName}</h4>
                        <p className="text-cyan-400/70 text-sm">with {deal.investorName}</p>
                        <p className="text-cyan-400/60 text-xs">{deal.investorEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center ${getStatusColor(deal.status)}`}>
                          {getStatusIcon(deal.status)}
                          <span className="ml-1">{deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}</span>
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">${(deal.amount / 1000).toFixed(0)}K</p>
                      <p className="text-cyan-400/70 text-sm">Investment</p>
                    </div>
                  </div>

                  {deal.message && (
                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-cyan-400/10">
                      <p className="text-gray-300 text-sm">{deal.message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-xs text-cyan-400/70">
                      <div className="flex items-center">
                        <NeonCyanIcon type="shield" className="text-current" size={16} />
                        {deal.createdAt.toLocaleDateString()}
                      </div>
                      {deal.lastMessageAt && (
                        <div className="flex items-center">
                          <NeonCyanIcon type="users" className="text-current" size={16} />
                          Last message: {deal.lastMessageAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => router.push(`/founder/messages?room=${deal.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                      >
                        View Messages
                      </button>
                      {deal.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAcceptDeal(deal.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 border border-green-400/30"
                          >
                            Accept Deal
                          </button>
                          <button 
                            onClick={() => handleDeclineDeal(deal.id)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-red-500/20 border border-red-400/30"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
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
