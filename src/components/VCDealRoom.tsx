"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { dealRoomManager, DealRoom, DealRoomMessage } from '@/lib/deal-room-manager';
import { useRouter } from 'next/navigation';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface VCDealRoomProps {
  roomId: string;
  projectId: string;
}

export default function VCDealRoom({ roomId, projectId }: VCDealRoomProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<DealRoom | null>(null);
  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'tasks' | 'calls'>('chat');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const roomResult = await dealRoomManager.getDealRoom(roomId);
      if (roomResult.success && roomResult.dealRoom) {
        setRoom(roomResult.dealRoom);
        setMessages(roomResult.dealRoom.messages || []);
      } else {
        throw new Error(roomResult.error || 'Deal room not found');
      }
    } catch (err: any) {
      console.error('Error loading room data:', err);
      setError(err?.message || 'Failed to load deal room');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      const messageData = {
        content: newMessage,
        type: 'text' as const,
        senderId: user.uid,
        senderName: user.displayName || 'VC User'
      };
      await dealRoomManager.addMessage(roomId, messageData);
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        content: newMessage,
        type: 'text',
        senderId: user.uid,
        senderName: user.displayName || 'VC User',
        timestamp: new Date(),
        reactions: {},
        pinned: false
      }]);
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    
    try {
      const messageData = {
        content: `📎 ${file.name}`,
        type: 'file' as const,
        senderId: user.uid,
        senderName: user.displayName || 'VC User'
      };
      await dealRoomManager.addMessage(roomId, messageData);
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        content: `📎 ${file.name}`,
        type: 'file',
        senderId: user.uid,
        senderName: user.displayName || 'VC User',
        timestamp: new Date(),
        reactions: {},
        pinned: false,
        attachments: [
          {
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type,
            size: file.size
          }
        ]
      }]);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: DealRoomMessage) => {
    const isOwnMessage = message.senderId === user?.uid;
    
    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isOwnMessage 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/10 text-white'
          }`}>
            {!isOwnMessage && (
              <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
            )}
            <p className="text-sm">{message.content}</p>
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2">
                {message.attachments.map((attachment) => (
                  <a 
                    key={attachment.url}
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 text-xs underline"
                  >
                    📎 Download {attachment.name || 'file'}
                  </a>
                ))}
              </div>
            )}
          </div>
          <p className={`text-xs text-white/40 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <NeonCyanIcon type="chat" size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No messages yet</p>
            <p className="text-white/40 text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Attach file"
          >
            <NeonCyanIcon type="paper-clip" size={20} className="text-current" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Shared Files</h3>
      <div className="space-y-3">
        {messages
          .filter(msg => msg.type === 'file')
          .map((message, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
              <NeonCyanIcon type="document" size={32} className="text-blue-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{message.content.replace('📎 ', '')}</p>
                <p className="text-white/60 text-sm">
                  Shared by {message.senderName} • {formatTime(message.timestamp)}
                </p>
              </div>
              <a
                href={message.attachments?.[0]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                Download
              </a>
            </div>
          ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Tasks</h3>
        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Add Task
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Review project documentation</p>
              <p className="text-white/60 text-sm">Due: Tomorrow</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                In Progress
              </span>
              <button className="p-1 text-white/60 hover:text-white transition-colors">
                <NeonCyanIcon type="check" size={16} className="text-current" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Schedule follow-up call</p>
              <p className="text-white/60 text-sm">Due: Next week</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                Todo
              </span>
              <button className="p-1 text-white/60 hover:text-white transition-colors">
                <NeonCyanIcon type="check" size={16} className="text-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalls = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Calls & Meetings</h3>
        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Schedule Call
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <NeonCyanIcon type="video" size={32} className="text-blue-400" />
              <div>
                <p className="text-white font-medium">Initial Project Discussion</p>
                <p className="text-white/60 text-sm">Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm">
              Join
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <NeonCyanIcon type="phone" size={32} className="text-green-400" />
              <div>
                <p className="text-white font-medium">Quick Check-in</p>
                <p className="text-white/60 text-sm">Friday at 10:00 AM</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading deal room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] flex items-center justify-center">
        <div className="text-center">
          <NeonCyanIcon type="exclamation" size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/vc/dashboard')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/vc/dashboard')}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">Deal Room</h1>
              <p className="text-white/60 text-sm">Project discussion and collaboration</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-white/60 hover:text-white transition-colors" title="Video Call">
              <NeonCyanIcon type="video" size={20} className="text-current" />
            </button>
            <button className="p-2 text-white/60 hover:text-white transition-colors" title="Voice Call">
              <NeonCyanIcon type="phone" size={20} className="text-current" />
            </button>
            <button className="p-2 text-white/60 hover:text-white transition-colors" title="More options">
              <NeonCyanIcon type="ellipsis" size={20} className="text-current" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/10">
          <div className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'chat' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'files' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'tasks' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'calls' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Calls
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-96">
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'files' && renderFiles()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'calls' && renderCalls()}
        </div>
      </div>
    </div>
  );
}
