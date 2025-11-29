"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import ChatInterfaceTelegramFixed from '@/components/ChatInterfaceTelegramFixed';
import { enhancedChatService, type ChatRoom } from '@/lib/chatService.enhanced';

export default function ChatRoomPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.cid as string;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load specific chat room
  useEffect(() => {
    if (!user?.uid || !chatId) return;

    console.log('📱 [CHAT ROOM] Loading room:', chatId);
    setLoadingRoom(true);
    setError(null);

    const unsubscribe = enhancedChatService.subscribeToUserRooms(
      user.uid,
      'vc', // Default to vc, will be filtered by membership anyway
      (rooms) => {
        const foundRoom = rooms.find(r => r.id === chatId);
        
        if (foundRoom) {
          console.log('📱 [CHAT ROOM] Room loaded:', foundRoom.name);
          setRoom(foundRoom);
          setError(null);
        } else {
          console.warn('📱 [CHAT ROOM] Room not found or no access:', chatId);
          setError('Chat room not found or you don\'t have access');
        }
        
        setLoadingRoom(false);
      }
    );

    return () => {
      console.log('📱 [CHAT ROOM] Unsubscribing from room');
      unsubscribe();
    };
  }, [user?.uid, chatId]);

  // Handle back navigation
  const handleBack = () => {
    router.push('/messages');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (loadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/80">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {error || 'Chat Room Not Found'}
          </h2>
          <p className="text-white/60 mb-6 max-w-md">
            This chat room doesn't exist or you don't have permission to access it.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:scale-105"
          >
            ← Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <ChatInterfaceTelegramFixed
        room={room}
        currentUserId={user.uid}
        onBack={handleBack}
      />
    </div>
  );
}

