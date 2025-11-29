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

export default function IDOMessagesPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const roomIdFromUrl = searchParams.get('room');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    console.log('📱 [IDO MESSAGES] Loading chat rooms for user:', user.uid);
    setLoadingRooms(true);

    let unsubscribeFn: (() => void) | null = null;
    let isMounted = true;

    (async () => {
      try {
        const unsubscribe = await enhancedChatService.subscribeToUserRooms(
          user.uid,
          'ido',
          (updatedRooms) => {
            if (!isMounted) return;
            console.log('📱 [IDO MESSAGES] Received', updatedRooms.length, 'chat rooms');
            setRooms(updatedRooms);
            setLoadingRooms(false);

            if (roomIdFromUrl) {
              const roomFromUrl = updatedRooms.find(r => r.id === roomIdFromUrl);
              if (roomFromUrl) {
                console.log('📱 [IDO MESSAGES] Auto-selecting room from URL:', roomIdFromUrl);
                setSelectedRoom(roomFromUrl);
              }
            }
          }
        );
        
        if (isMounted) {
          unsubscribeFn = unsubscribe;
        } else if (unsubscribe) {
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
      console.log('📱 [IDO MESSAGES] Unsubscribing from chat rooms');
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!roomIdFromUrl || rooms.length === 0) return;
    
    const roomFromUrl = rooms.find(r => r.id === roomIdFromUrl);
    if (roomFromUrl && roomFromUrl.id !== selectedRoom?.id) {
      console.log('📱 [IDO MESSAGES] Selecting room from URL change:', roomIdFromUrl);
      setTimeout(() => {
        setSelectedRoom(roomFromUrl);
      }, 0);
    }
  }, [roomIdFromUrl, rooms.length, selectedRoom?.id]);

  const handleBackToList = () => {
    setSelectedRoom(null);
    router.push('/ido/messages');
  };

  if (loading || loadingRooms) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-112px)] bg-black pt-28" style={{ marginTop: 0 }}>
      <div className={`${
        selectedRoom ? 'hidden lg:flex' : 'flex'
      } w-full lg:w-80 flex-col border-r border-gray-800 bg-black/50 relative z-[90]`}>
        <ChatRoomListProduction
          rooms={rooms}
          selectedRoomId={selectedRoom?.id || null}
          onRoomSelect={(room) => {
            setSelectedRoom(room);
            router.push(`/ido/messages?room=${room.id}`);
          }}
          currentUserId={user.uid}
        />
      </div>

      {selectedRoom && selectedRoom.id ? (
        <div className={`${
          selectedRoom ? 'block' : 'hidden lg:block'
        } flex-1 neo-glass-card relative z-[90]`} key={`chat-wrapper-${selectedRoom.id}`}>
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
        } flex-1 neo-glass-card relative z-[90]`}>
          <div className="hidden lg:flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-white mb-2">No Chat Selected</h2>
              <p className="text-white/60">Select a chat room to start messaging</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

