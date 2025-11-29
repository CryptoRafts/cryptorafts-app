"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatRoomListProduction from '@/components/ChatRoomListProduction';
import ChatInterfaceTelegramFixed from '@/components/ChatInterfaceTelegramFixed';
import { enhancedChatService } from '@/lib/chatService.enhanced';
import type { ChatRoom } from '@/lib/chatService.enhanced';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function FounderMessagesPage() {
  const { user, isLoading: loading, claims } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Get room ID from URL query parameter
  const roomIdFromUrl = searchParams.get('room');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load chat rooms
  useEffect(() => {
    if (!user?.uid) return;

    console.log('📱 [FOUNDER MESSAGES] Loading chat rooms for user:', user.uid);
    setLoadingRooms(true);

    // FIXED: Capture unsubscribe function from subscribeToUserRooms
    let unsubscribeFn: (() => void) | null = null;
    let isMounted = true;

    // Handle async subscribeToUserRooms
    (async () => {
      try {
        const unsubscribe = await enhancedChatService.subscribeToUserRooms(
          user.uid,
          'founder',
          (updatedRooms) => {
            if (!isMounted) return;
            console.log('📱 [FOUNDER MESSAGES] Received', updatedRooms.length, 'chat rooms');
            setRooms(updatedRooms);
            setLoadingRooms(false);

            // If room ID in URL, select that room (only on initial load)
            if (roomIdFromUrl) {
              const roomFromUrl = updatedRooms.find(r => r.id === roomIdFromUrl);
              if (roomFromUrl) {
                console.log('📱 [FOUNDER MESSAGES] Auto-selecting room from URL:', roomIdFromUrl);
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
      console.log('📱 [FOUNDER MESSAGES] Unsubscribing from chat rooms');
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [user?.uid]); // Removed roomIdFromUrl and selectedRoom from dependencies

  // Handle URL room ID changes (when user navigates to a specific room)
  useEffect(() => {
    if (!roomIdFromUrl || rooms.length === 0) return;
    
    const roomFromUrl = rooms.find(r => r.id === roomIdFromUrl);
    if (roomFromUrl && roomFromUrl.id !== selectedRoom?.id) {
      console.log('📱 [FOUNDER MESSAGES] Selecting room from URL change:', roomIdFromUrl);
      // Use setTimeout to ensure state updates happen after render
      setTimeout(() => {
        setSelectedRoom(roomFromUrl);
      }, 0);
    }
  }, [roomIdFromUrl, rooms.length, selectedRoom?.id]);

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    if (room?.id && room?.name) {
      console.log('📱 [FOUNDER MESSAGES] Selected room:', room.id, room.name);
      setSelectedRoom(room);
    } else {
      console.warn('📱 [FOUNDER MESSAGES] Invalid room object:', room);
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

  if (loading || !user) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
                        Chat rooms appear when investors accept your pitch. Keep checking after submissions!
                      </p>
                      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-4 mb-6 text-left">
                        <p className="text-sm text-white/80">
                          <strong className="text-cyan-400">💡 Tip:</strong> {' '}
                          Chat rooms are created automatically when investors accept your projects.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push('/founder/dashboard')}
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
              {/* FIXED: Only render one chat interface at a time */}
              {selectedRoom && selectedRoom.id ? (
                <div className={`${
                  selectedRoom ? 'block' : 'hidden lg:block'
                } flex-1 neo-glass-card relative z-10`} key={`chat-wrapper-${selectedRoom.id}`}>
                  <ErrorBoundary key={`error-boundary-${selectedRoom.id}`}>
                    <ChatInterfaceTelegramFixed
                      key={`chat-interface-${selectedRoom.id}`}
                      room={selectedRoom}
                      currentUserId={user.uid}
                      onBack={handleBackToList}
                    />
                  </ErrorBoundary>
                </div>
              ) : (
                <div className={`${
                  selectedRoom ? 'block' : 'hidden lg:block'
                } flex-1 neo-glass-card relative z-10`}>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}