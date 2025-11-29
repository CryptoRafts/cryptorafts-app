"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatRoomListProduction from '@/components/ChatRoomListProduction';
import ChatInterfaceTelegramFixed from '@/components/ChatInterfaceTelegramFixed';
import { enhancedChatService } from '@/lib/chatService.enhanced';
import type { ChatRoom } from '@/lib/chatService.enhanced';

export default function MessagesPage() {
  const { user, isLoading: loading, claims } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isCheckingKYB, setIsCheckingKYB] = useState(true);

  // Get room ID from URL query parameter
  const roomIdFromUrl = searchParams.get('room');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check KYC/KYB status for all roles
  useEffect(() => {
    async function checkVerificationStatus() {
      if (loading || !user) return;

      try {
        const { ensureDb } = await import('@/lib/firebase-utils');
        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        
        if (userDoc.exists()) {
          const profile = userDoc.data();
          const role = claims?.role || profile?.role;
          
          // Check verification status based on role
          let verificationStatus = '';
          if (role === 'founder' || role === 'influencer') {
            verificationStatus = profile?.kycStatus || profile?.kyc?.status || '';
          } else if (['vc', 'exchange', 'ido', 'agency'].includes(role)) {
            // Check user document first
            verificationStatus = profile?.kybStatus || profile?.kyb?.status || profile?.kyb_status || '';
            
            // CRITICAL: Also check organization document as backup (organization is source of truth)
            // This prevents blocking access when user doc hasn't updated yet but org doc shows approved
            if ((!verificationStatus || verificationStatus.toLowerCase() === 'pending' || verificationStatus.toLowerCase() === 'not_submitted')) {
              try {
                const orgsQuery = query(
                  collection(dbInstance, 'organizations'),
                  where('userId', '==', user.uid)
                );
                const orgsSnapshot = await getDocs(orgsQuery);
                
                if (!orgsSnapshot.empty) {
                  const orgData = orgsSnapshot.docs[0].data();
                  const orgStatus = (orgData.kybStatus || '').toLowerCase();
                  
                  // If organization shows approved/verified, use that instead
                  if (orgStatus === 'approved' || orgStatus === 'verified') {
                    console.log('✅ [MESSAGES] Organization shows approved, allowing chat access');
                    verificationStatus = orgStatus;
                  }
                }
              } catch (orgError) {
                console.warn('⚠️ Could not check organization status:', orgError);
              }
            }
          }
          
          const statusLower = String(verificationStatus || '').toLowerCase();
          
          console.log('🔍 [MESSAGES] Verification check for', role, ':', verificationStatus);
          
          // Block if verification not approved
          if (statusLower !== 'approved' && statusLower !== 'verified') {
            console.log('🔒 [MESSAGES] Verification not approved, redirecting to verification page');
            if (role === 'founder' || role === 'influencer') {
              router.push(`/${role}/kyc`);
            } else if (['vc', 'exchange', 'ido', 'agency'].includes(role)) {
              router.push(`/${role}/kyb`);
            }
            return;
          }
          
          console.log('✅ [MESSAGES] Verification approved for', role);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
      
      setIsCheckingKYB(false);
    }

    checkVerificationStatus();
  }, [loading, user, claims, router]);

  // Load chat rooms
  useEffect(() => {
    if (!user?.uid) return;

    console.log('📱 [MESSAGES] Loading chat rooms for user:', user.uid);
    setLoadingRooms(true);

    // FIXED: Capture unsubscribe function from subscribeToUserRooms
    let unsubscribeFn: (() => void) | null = null;
    let isMounted = true;

    // Handle async subscribeToUserRooms
    (async () => {
      try {
        const unsubscribe = await enhancedChatService.subscribeToUserRooms(
          user.uid,
          claims?.role || 'vc',
          (updatedRooms) => {
            if (!isMounted) return;
            console.log('📱 [MESSAGES] Received', updatedRooms.length, 'chat rooms');
            setRooms(updatedRooms);
            setLoadingRooms(false);

            // If room ID in URL, select that room (only on initial load)
            if (roomIdFromUrl) {
              const roomFromUrl = updatedRooms.find(r => r.id === roomIdFromUrl);
              if (roomFromUrl) {
                console.log('📱 [MESSAGES] Auto-selecting room from URL:', roomIdFromUrl);
                setSelectedRoom(roomFromUrl);
              }
            }
          }
        );
        
        if (isMounted) {
          unsubscribeFn = unsubscribe;
        } else if (unsubscribe) {
          // If component unmounted before subscription completed, unsubscribe immediately
          unsubscribe();
        }
      } catch (error) {
        console.error('❌ Error subscribing to rooms:', error);
        if (isMounted) {
          setLoadingRooms(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      console.log('📱 [MESSAGES] Unsubscribing from chat rooms');
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [user?.uid, claims?.role]); // Removed roomIdFromUrl and selectedRoom from dependencies

  // Handle URL room ID changes (when user navigates to a specific room)
  useEffect(() => {
    if (roomIdFromUrl && rooms.length > 0) {
      const roomFromUrl = rooms.find(r => r.id === roomIdFromUrl);
      if (roomFromUrl && roomFromUrl.id !== selectedRoom?.id) {
        console.log('📱 [MESSAGES] Selecting room from URL change:', roomIdFromUrl);
        setSelectedRoom(roomFromUrl);
      }
    } else if (!roomIdFromUrl && selectedRoom) {
      // If URL has no room param but we have a selected room, keep it (don't clear)
      // This prevents clearing the room when doing internal navigation
    }
  }, [roomIdFromUrl, rooms]);

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    if (room?.id && room?.name) {
      console.log('📱 [MESSAGES] Selected room:', room.id, room.name);
      setSelectedRoom(room);
    } else {
      console.warn('📱 [MESSAGES] Invalid room object:', room);
    }
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.id);
    window.history.pushState({}, '', url.toString());
  };

  // Handle back to room list (mobile)
  const handleBackToList = () => {
    setSelectedRoom(null);
    
    // Remove room parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  if (loading || !user || isCheckingKYB) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/80">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-black"
    >
      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
      
      {/* Header */}
      <div className="neo-glass-header border-b border-cyan-400/20 px-4 py-3 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center ring-2 ring-cyan-400/40">
              <span className="text-cyan-400 text-lg">💬</span>
            </div>
            <h1 className="text-xl font-bold text-white">Chat</h1>
            {selectedRoom && (
              <>
                <span className="text-cyan-400/60">→</span>
                <span className="text-white/80 font-medium">{selectedRoom.name || 'Unnamed Room'}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 text-sm font-medium">Real-time</span>
            </div>
            {rooms.length > 0 && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium border border-cyan-400/30">
                {rooms.length} {rooms.length === 1 ? 'Chat' : 'Chats'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="h-full flex">
            {/* Chat Room List - Hidden on mobile when room selected */}
            <div className={`${
              selectedRoom ? 'hidden lg:block' : 'block'
            } w-full lg:w-80 xl:w-96 border-r border-cyan-400/20 neo-glass-card overflow-y-auto relative z-10`}>
              {loadingRooms ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-white/60 text-sm">Loading chats...</p>
                  </div>
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center max-w-sm">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl"></div>
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center ring-4 ring-cyan-400/30 mx-auto mb-4 relative">
                        <span className="text-cyan-400 text-3xl">💬</span>
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-4">No Active Chats</h3>
                    <p className="text-white/70 text-sm mb-6 leading-relaxed">
                      {claims?.role === 'vc' 
                        ? "Chat rooms appear when you accept pitch proposals. Review projects on your dashboard to get started!"
                        : claims?.role === 'founder'
                        ? "Chat rooms appear when investors accept your pitch. Keep checking after submissions!"
                        : claims?.role === 'exchange'
                        ? "Chat rooms appear when you interact with projects or users. Start by exploring listings!"
                        : claims?.role === 'ido'
                        ? "Chat rooms appear when you interact with IDO projects. Launch your first IDO to get started!"
                        : claims?.role === 'agency'
                        ? "Chat rooms appear when you collaborate with clients. Start by creating campaigns!"
                        : claims?.role === 'influencer'
                        ? "Chat rooms appear when you collaborate with projects. Start by applying to campaigns!"
                        : "Your chat rooms will appear here once you start collaborating"
                      }
                    </p>
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-4 mb-6 text-left">
                      <p className="text-sm text-white/80">
                        <strong className="text-cyan-400">💡 Tip:</strong> {' '}
                        {claims?.role === 'vc' 
                          ? "Each accepted pitch creates a chat room with the founder and RaftAI."
                          : claims?.role === 'founder'
                          ? "Chat rooms are created automatically when investors accept your projects."
                          : claims?.role === 'exchange'
                          ? "Chat rooms are created when you interact with projects or users on the platform."
                          : claims?.role === 'ido'
                          ? "Chat rooms are created when you launch IDOs or interact with projects."
                          : claims?.role === 'agency'
                          ? "Chat rooms are created when you collaborate with clients and projects."
                          : claims?.role === 'influencer'
                          ? "Chat rooms are created when you collaborate with campaigns and projects."
                          : "Chat rooms are created automatically when you interact with projects."
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/${claims?.role}/dashboard`)}
                      className="btn-neon-large px-8 py-3 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:scale-105"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <ChatRoomListProduction
                  rooms={rooms}
                  currentUserId={user.uid}
                  selectedRoomId={selectedRoom?.id}
                  onRoomSelect={handleRoomSelect}
                />
              )}
            </div>

            {/* Chat Interface - Full width on mobile when room selected */}
            <div className={`${
              selectedRoom ? 'block' : 'hidden lg:block'
            } flex-1 neo-glass-card relative z-10`}>
              {selectedRoom ? (
                <ChatInterfaceTelegramFixed
                  room={selectedRoom}
                  currentUserId={user.uid}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="hidden lg:flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl"></div>
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center ring-4 ring-cyan-400/30 mx-auto mb-6 relative">
                        <span className="text-cyan-400 text-4xl">💬</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      Select a Chat
                    </h3>
                    <p className="text-white/70 max-w-md text-lg">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

