"use client";
import React, { useState, useRef, useEffect } from 'react';
import { db, doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from '@/lib/firebase.client';
import { useAuth } from '@/providers/SimpleAuthProvider';

interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'file' | 'image' | 'video' | 'voice' | 'poll' | 'task' | 'event' | 'aiReply' | 'system';
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  poll?: {
    question: string;
    options: string[];
    multiple: boolean;
    closesAt: number;
    results?: Record<string, number>;
  };
  task?: {
    title: string;
    assigneeUid: string;
    dueAt: number;
    state: 'todo' | 'doing' | 'done';
  };
  event?: {
    title: string;
    startAt: number;
    endAt: number;
    attendees: string[];
  };
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  replyTo?: string;
  createdAt: number;
  metadata?: any;
}

interface ChatInterfaceProps {
  roomId: string;
  room: any;
}

export default function EnhancedChatInterface({ roomId, room }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages
  useEffect(() => {
    if (!roomId || !user || !db) return;

    const messagesQuery = query(
      collection(db!, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [roomId, user, db]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !room?.members?.includes(user.uid) || !db) return;

    // Check for AI commands
    if (newMessage.startsWith('/raftai')) {
      await handleAICommand(newMessage);
      return;
    }

    const messageData = {
      senderId: user.uid,
      type: 'text' as const,
      text: newMessage.trim(),
      replyTo: replyTo || null,
      reactions: {},
      createdAt: Date.now(),
      createdAtServer: serverTimestamp()
    };

    try {
      await addDoc(collection(db!, 'rooms', roomId, 'messages'), messageData);
      setNewMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAICommand = async (command: string) => {
    if (!user) return;

    setIsProcessingAI(true);
    
    // Add processing message
    const processingMessage = {
      senderId: 'system',
      type: 'system' as const,
      text: '🤖 Processing AI command...',
      createdAt: Date.now()
    };

    if (!db) return;
    const dbInstance = db; // Capture for type narrowing
    try {
      await addDoc(collection(dbInstance, 'rooms', roomId, 'messages'), processingMessage);

      // Call RaftAI service
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          command,
          userId: user.uid,
          projectId: room.projectId,
          roomType: room.type
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add AI response
        const aiMessage = {
          senderId: 'raftai',
          type: 'aiReply' as const,
          text: result.response,
          metadata: result.metadata,
          createdAt: Date.now()
        };

        await addDoc(collection(dbInstance, 'rooms', roomId, 'messages'), aiMessage);
      } else {
        throw new Error('AI command failed');
      }
    } catch (error) {
      console.error('AI command error:', error);
      
      // Add error message
      const errorMessage = {
        senderId: 'system',
        type: 'system' as const,
        text: '❌ AI command failed. Please try again.',
        createdAt: Date.now()
      };

      await addDoc(collection(dbInstance, 'rooms', roomId, 'messages'), errorMessage);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user || !db) return;

    setUploading(true);
    try {
      // Upload file to storage (implementation depends on your storage solution)
      const fileUrl = await uploadFileToStorage(file);
      
      const messageData = {
        senderId: user.uid,
        type: 'file' as const,
        text: file.name,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp()
      };

      await addDoc(collection(db!, 'rooms', roomId, 'messages'), messageData);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    // Implement file upload to your storage solution
    // This is a placeholder - you'll need to implement actual storage upload
    return `https://example.com/files/${file.name}`;
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user || !db) return;

    const messageRef = doc(db!, 'rooms', roomId, 'messages', messageId);
    // Implementation would update the reactions field
    // This is simplified for the example
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeIcon = (type: string) => {
    const icons = {
      text: '💬',
      file: '📎',
      image: '🖼️',
      video: '🎥',
      voice: '🎤',
      poll: '📊',
      task: '✅',
      event: '📅',
      aiReply: '🤖',
      system: '⚙️'
    };
    return icons[type as keyof typeof icons] || '💬';
  };

  if (!user || !room?.members?.includes(user.uid)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60">You don't have access to this room.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Room Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{room.name}</h2>
            <p className="text-sm text-gray-400">Project: {room.metadata?.projectTitle}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              {room.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              {room.members?.length || 0} members
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === user.uid
                  ? 'bg-blue-600 text-white'
                  : message.senderId === 'raftai'
                  ? 'bg-purple-600 text-white'
                  : message.senderId === 'system'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs">
                  {getMessageTypeIcon(message.type)}
                </span>
                <span className="text-xs opacity-70">
                  {message.senderId === user.uid 
                    ? 'You' 
                    : message.senderId === 'raftai' 
                    ? 'RaftAI' 
                    : message.senderId === 'system'
                    ? 'System'
                    : message.senderId
                  }
                </span>
                <span className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>

              {/* Message Content */}
              <div className="whitespace-pre-wrap">
                {message.text}
              </div>

              {/* File Content */}
              {message.type === 'file' && message.fileUrl && (
                <div className="mt-2 p-2 bg-white/10 rounded">
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    📎 {message.fileName} ({(message.fileSize! / 1024).toFixed(1)} KB)
                  </a>
                </div>
              )}

              {/* AI Metadata */}
              {message.type === 'aiReply' && message.metadata && (
                <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                  <div className="text-purple-300">
                    AI Analysis: {message.metadata.analysisType}
                  </div>
                  {message.metadata.confidence && (
                    <div className="text-purple-300">
                      Confidence: {message.metadata.confidence}%
                    </div>
                  )}
                </div>
              )}

              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex space-x-1 mt-2">
                  {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(message.id, emoji)}
                      className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
                    >
                      {emoji} {userIds.length}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessingAI && (
          <div className="flex justify-start">
            <div className="bg-purple-600 text-white rounded-lg p-3 max-w-[70%]">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>🤖 RaftAI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        {replyTo && (
          <div className="mb-2 p-2 bg-blue-600/20 rounded text-sm">
            <span className="text-blue-300">Replying to message...</span>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-2 text-blue-400 hover:text-blue-300"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? '⏳' : '📎'}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              newMessage.startsWith('/raftai') 
                ? 'AI command detected...' 
                : 'Type a message... (use /raftai help for AI commands)'
            }
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isProcessingAI}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          AI Commands: /raftai help, /raftai summarize, /raftai risks, /raftai draft, /raftai action-items
        </div>
      </div>
    </div>
  );
}
