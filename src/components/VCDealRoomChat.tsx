"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcDealflowManager } from '@/lib/vc-dealflow-manager';
import { DealRoom, DealRoomMessage } from '@/lib/vc-data-models';
import BlockchainCard from '@/components/ui/BlockchainCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface VCDealRoomChatProps {
  roomId: string;
  room: DealRoom;
  onClose: () => void;
}

export default function VCDealRoomChat({ roomId, room, onClose }: VCDealRoomChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const messagesData = await vcDealflowManager.getDealRoomMessages(roomId);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId]);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = vcDealflowManager.subscribeToDealRoomMessages(roomId, (newMessages) => {
      setMessages(newMessages);
    });

    return unsubscribe;
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await vcDealflowManager.sendDealRoomMessage(roomId, {
        content: newMessage.trim(),
        authorId: user?.uid || 'user1',
        type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserDisplayName = (authorId: string) => {
    if (authorId === 'system') return 'System';
    if (authorId === user?.uid) return 'You';
    return 'Team Member';
  };

  const getUserInitials = (authorId: string) => {
    if (authorId === 'system') return 'S';
    if (authorId === user?.uid) return 'Y';
    return 'T';
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <NeonCyanIcon type="document" size={16} className="text-current" />;
      case 'image':
        return <NeonCyanIcon type="photo" size={16} className="text-current" />;
      case 'video':
        return <NeonCyanIcon type="video" size={16} className="text-current" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {room.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{room.name}</h3>
            <p className="text-white/60 text-sm">
              {room.members.length} members • {room.status}
            </p>
          </div>
        </div>
        <AnimatedButton
          variant="secondary"
          size="sm"
          onClick={onClose}
        >
          Close
        </AnimatedButton>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <NeonCyanIcon type="user" size={32} className="text-white/60" />
            </div>
            <p className="text-white/60">No messages yet</p>
            <p className="text-white/40 text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.authorId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.authorId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {getUserInitials(message.authorId)}
                  </span>
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${message.authorId === user?.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl ${
                    message.authorId === 'system' 
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : message.authorId === user?.uid
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}>
                    {message.type !== 'text' && (
                      <div className="flex items-center space-x-1 mb-1">
                        {getMessageTypeIcon(message.type)}
                        <span className="text-xs opacity-75">
                          {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Message Info */}
                  <div className={`flex items-center space-x-1 mt-1 text-xs text-white/40 ${
                    message.authorId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <span>{getUserDisplayName(message.authorId)}</span>
                    <span>•</span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {message.authorId === user?.uid && (
                      <>
                        <span>•</span>
                        <NeonCyanIcon type="check" size={12} className="text-blue-400" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-2">
          {/* File Upload Button */}
          <AnimatedButton
            variant="secondary"
            size="sm"
            onClick={handleFileUpload}
            icon={<NeonCyanIcon type="paper-clip" size={16} className="text-current" />}
          >
            Attach
          </AnimatedButton>
          
          {/* Message Input */}
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <AnimatedButton
            variant="primary"
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            loading={sending}
            icon={<NeonCyanIcon type="paper-airplane" size={16} className="text-current" />}
          >
            Send
          </AnimatedButton>
        </div>

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mov"
          onChange={(e) => {
            // Handle file upload
            console.log('File selected:', e.target.files?.[0]);
          }}
        />
      </div>
    </div>
  );
}
