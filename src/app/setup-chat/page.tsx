"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase.client";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function SetupChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'creating' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking authentication...');
  const [createdRooms, setCreatedRooms] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setStatus('error');
      setMessage('Please login first');
      return;
    }

    createTestRooms();
  }, [user]);

  const createTestRooms = async () => {
    if (!user) return;

    try {
      if (!db) return;
      
      setStatus('creating');
      setMessage('Creating test chat rooms...');

      const rooms = [
        {
          type: 'deal',
          counterpartRole: 'vc',
          counterpartName: 'VentureVC Partners',
          projectName: 'DeFi Project',
          icon: '🤝'
        },
        {
          type: 'listing',
          counterpartRole: 'exchange',
          counterpartName: 'CryptoExchange',
          projectName: 'Token Listing',
          icon: '📈'
        },
        {
          type: 'ido',
          counterpartRole: 'ido',
          counterpartName: 'LaunchPad IDO',
          projectName: 'Token Sale',
          icon: '🚀'
        }
      ];

      const created: string[] = [];

      for (const room of rooms) {
        const roomId = `${room.type}_${user.uid}_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Create room
        await setDoc(doc(db!, 'groupChats', roomId), {
          name: `${room.projectName} - ${user.displayName || user.email || 'You'} / ${room.counterpartName}`,
          type: room.type as any,
          status: 'active',
          founderId: user.uid,
          founderName: user.displayName || user.email || 'You',
          founderLogo: user.photoURL || null,
          counterpartId: `test-${room.counterpartRole}-id`,
          counterpartName: room.counterpartName,
          counterpartRole: room.counterpartRole,
          counterpartLogo: null,
          members: [user.uid, 'raftai'],
          memberRoles: {
            [user.uid]: 'owner',
            'raftai': 'admin'
          },
          settings: {
            filesAllowed: true,
            maxFileSize: 100,
            allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'mp4', 'mp3'],
            requireFileReview: true
          },
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          lastActivityAt: Date.now(),
          pinnedMessages: [],
          mutedBy: [],
          raftaiMemory: {
            decisions: [],
            tasks: [],
            milestones: [],
            notePoints: []
          }
        });

        // Add RaftAI welcome message
        await addDoc(collection(db!, 'groupChats', roomId, 'messages'), {
          senderId: 'raftai',
          senderName: 'RaftAI',
          type: 'system',
          text: `RaftAI created this ${room.type} room for ${user.displayName || 'You'} / ${room.counterpartName}.`,
          reactions: {},
          readBy: [],
          isPinned: false,
          isEdited: false,
          isDeleted: false,
          createdAt: Date.now()
        });

        // Add test message from you
        await addDoc(collection(db!, 'groupChats', roomId, 'messages'), {
          senderId: user.uid,
          senderName: user.displayName || 'You',
          type: 'text',
          text: `Hello! This is a test message in the ${room.projectName} room.`,
          reactions: {},
          readBy: [user.uid],
          isPinned: false,
          isEdited: false,
          isDeleted: false,
          createdAt: Date.now() + 1000
        });

        // Add test message from counterpart
        await addDoc(collection(db!, 'groupChats', roomId, 'messages'), {
          senderId: `test-${room.counterpartRole}-id`,
          senderName: room.counterpartName,
          type: 'text',
          text: `Great to connect! Looking forward to working together on ${room.projectName}.`,
          reactions: {},
          readBy: [],
          isPinned: false,
          isEdited: false,
          isDeleted: false,
          createdAt: Date.now() + 2000
        });

        created.push(`${room.icon} ${room.projectName}`);
        console.log(`✅ Created: ${room.projectName}`);
      }

      setCreatedRooms(created);
      setStatus('success');
      setMessage('Test rooms created successfully!');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/messages');
      }, 3000);

    } catch (error: any) {
      console.error('Error creating rooms:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">{message}</p>
          </>
        )}

        {status === 'creating' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-white text-xl font-bold mb-2">Creating Test Rooms</h2>
            <p className="text-white/60">{message}</p>
            <div className="mt-6 space-y-2">
              {createdRooms.map((room, i) => (
                <div key={i} className="text-green-400 text-sm">
                  ✅ {room}
                </div>
              ))}
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Success!</h2>
            <p className="text-white/60 mb-4">{message}</p>
            
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <p className="text-white/80 text-sm font-medium mb-3">Created Rooms:</p>
              {createdRooms.map((room, i) => (
                <div key={i} className="text-green-400 text-sm py-1">
                  {room}
                </div>
              ))}
            </div>

            <p className="text-white/60 text-sm mb-4">
              Redirecting to /messages in 3 seconds...
            </p>

            <button
              onClick={() => router.push('/messages')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Messages Now →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Error</h2>
            <p className="text-white/60 mb-6">{message}</p>
            
            {!user && (
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Login
              </a>
            )}
            
            {user && (
              <button
                onClick={createTestRooms}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}



