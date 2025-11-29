"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { chatService } from '@/lib/chatService';
import { ChatRoom as ChatRoomType, ChatMessage } from '@/lib/chatTypes';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical, 
  Pin, 
  GitBranch, 
  Check, 
  CheckCheck,
  X,
  Edit,
  Trash2,
  Reply,
  ThumbsUp,
  Heart,
  Laugh,
  Angry
} from 'lucide-react';

interface ChatRoomProps {
  roomId: string;
  onClose?: () => void;
}

export default function ChatRoom({ roomId, onClose }: ChatRoomProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoomType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showThread, setShowThread] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'tasks' | 'meetings' | 'ai'>('messages');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load room data
  useEffect(() => {
    const unsubscribe = chatService.subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      setPinnedMessages(roomData.pinnedMessages || []);
    });

    return unsubscribe;
  }, [roomId]);

  // Load messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(roomId, (messagesData) => {
      setMessages(messagesData);
      scrollToBottom();
    });

    return unsubscribe;
  }, [roomId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, []);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      await chatService.sendMessage(roomId, {
        senderId: user.uid,
        type: 'text',
        text: messageContent,
        threadOf: replyingTo?.id || undefined,
        reactions: {},
        readBy: [user.uid]
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle AI command
  const handleAICommand = async (command: string) => {
    if (!user) return;

    const aiCommand = command.startsWith('/raftai ') ? command.substring(8) : command;
    const [cmd, ...args] = aiCommand.split(' ');

    try {
      await chatService.processAICommand(roomId, {
        command: cmd as any,
        context: args.join(' '),
        messageIds: messages.slice(-10).map(m => m.id) // Last 10 messages for context
      }, user.uid);
    } catch (error) {
      console.error('AI command failed:', error);
    }
  };

  // Handle message input
  const handleMessageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.startsWith('/raftai ')) {
        handleAICommand(newMessage);
      } else {
        handleSendMessage();
      }
    } else {
      handleTyping();
    }
  };

  // Add reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      await chatService.addReaction(roomId, messageId, user.uid, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      await chatService.markAsRead(roomId, messageId, user.uid);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get user display info
  const getUserDisplayInfo = (userId: string) => {
    // This would integrate with your user service
    return {
      name: userId === 'system' ? 'System' : userId === 'raftai' ? 'RaftAI' : 'User',
      avatar: '/default-avatar.png',
      role: 'member'
    };
  };

  // Render message
  const renderMessage = (message: ChatMessage) => {
    const userInfo = getUserDisplayInfo(message.senderId);
    const isOwn = message.senderId === user?.uid;
    const isSystem = message.type === 'system';
    const isAI = message.senderId === 'raftai';
    const isPinned = pinnedMessages.includes(message.id);

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${
          isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400' : ''
        }`}
      >
        <div className="flex-shrink-0">
          <img
            src={userInfo.avatar}
            alt={userInfo.name}
            className="w-8 h-8 rounded-full"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium text-sm ${
              isSystem ? 'text-gray-500' : 
              isAI ? 'text-blue-600' : 
              'text-gray-900 dark:text-white'
            }`}>
              {userInfo.name}
            </span>
            {userInfo.role && (
              <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                {userInfo.role}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.createdAt)}
            </span>
            {isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
          </div>
          
          <div className="text-gray-900 dark:text-white">
            {message.text}
          </div>
          
          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex gap-1 mt-2">
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${
                    userIds.includes(user?.uid || '') 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Message actions */}
          {!isSystem && (
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleReaction(message.id, '👍')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReaction(message.id, '❤️')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReplyingTo(message)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <Reply className="w-4 h-4" />
              </button>
              {message.threadOf && (
                <button
                  onClick={() => setShowThread(message.threadOf || null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <GitBranch className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Read receipts */}
          {isOwn && message.readBy && message.readBy.length > 1 && (
            <div className="flex items-center gap-1 mt-1">
              {message.readBy.length === 2 ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs text-gray-500">
                {message.readBy.length - 1} read
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {room.name}
            </h2>
            <p className="text-sm text-gray-500">
              {room.members.length} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['messages', 'files', 'tasks', 'meetings', 'ai'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Messages */}
      {activeTab === 'messages' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map(renderMessage)}
            {isTyping && (
              <div className="flex gap-3 p-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply indicator */}
          {replyingTo && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Replying to {getUserDisplayInfo(replyingTo.senderId).name}
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-500 truncate">
                {replyingTo.text}
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleMessageInput}
                  placeholder="Type a message... (use /raftai for AI commands)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
                {newMessage.startsWith('/raftai ') && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    AI Command: {newMessage.substring(8)}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Other tabs content would go here */}
      {activeTab !== 'messages' && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          {activeTab} tab coming soon...
        </div>
      )}
    </div>
  );
}
