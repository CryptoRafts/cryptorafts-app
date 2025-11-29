"use client";

import { useState, useEffect, useRef } from "react";
import { chatService } from "@/lib/chat/chatService";
import type { ChatRoom, ChatMessage } from "@/lib/chat/types";
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  FlagIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import MessageBubble from "./MessageBubble";
import FileUploadModal from "./FileUploadModal";
import InviteModal from "./InviteModal";

interface ChatInterfaceProps {
  roomId: string;
  userId: string;
  userRole: string;
  onClose?: () => void;
}

export default function ChatInterface({ roomId, userId, userRole, onClose }: ChatInterfaceProps) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load room
  useEffect(() => {
    let mounted = true;

    (async () => {
      const roomData = await chatService.getRoom(roomId);
      if (mounted && roomData) {
        setRoom(roomData);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [roomId]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return unsubscribe;
  }, [roomId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !room) return;

    const text = newMessage.trim();
    setNewMessage("");
    setReplyingTo(null);

    try {
      // Check for /raftai commands
      if (text.startsWith('/raftai ')) {
        await handleAICommand(text);
        return;
      }

      await chatService.sendMessage({
        roomId,
        userId,
        userName: room.members.includes(userId) ? 
          (userId === room.founderId ? room.founderName : room.counterpartName) : 
          'User',
        text,
        replyTo: replyingTo?.id
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // Handle AI command
  const handleAICommand = async (command: string) => {
    // Extract command
    const cmd = command.substring(8).trim();
    
    // Add command message
    await chatService.sendMessage({
      roomId,
      userId,
      userName: 'You',
      text: command
    });

    // Process via API
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          command: cmd,
          userId,
          context: messages.slice(-10).map(m => m.text).join('\n')
        })
      });

      const data = await response.json();
      
      // RaftAI response will be added via webhook/realtime
    } catch (error) {
      console.error('❌ AI command error:', error);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Actions
  const handleReaction = async (messageId: string, emoji: string) => {
    await chatService.addReaction(roomId, messageId, userId, emoji);
  };

  const handlePin = async (messageId: string) => {
    await chatService.pinMessage(roomId, messageId, userId);
  };

  const handleReport = async (messageId?: string) => {
    const reason = prompt('Report reason:');
    if (!reason) return;

    await chatService.report({
      roomId,
      messageId,
      reportedBy: userId,
      reason,
      details: 'Reported from chat'
    });

    alert('Report submitted. Our team will review it.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
        <p className="text-white/60">Room not found</p>
      </div>
    );
  }

  const isOwnerOrAdmin = room.memberRoles[userId] === 'owner' || room.memberRoles[userId] === 'admin';

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      {/* Header - Telegram Style */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Dual Logos */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {room.founderLogo ? (
                <img src={room.founderLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-xl">🤝</span>
              )}
            </div>
            {room.counterpartLogo && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-gray-900 overflow-hidden">
                <img src={room.counterpartLogo} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate text-sm">{room.name}</h3>
            <p className="text-white/60 text-xs">
              {room.members.length} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10">
                {isOwnerOrAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setShowInvite(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 flex items-center gap-2 text-sm"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Add Members
                    </button>
                    <button
                      onClick={async () => {
                        const newName = prompt('New room name:', room.name);
                        if (newName && newName !== room.name) {
                          await chatService.renameRoom(roomId, userId, newName);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 text-sm"
                    >
                      ✏️ Rename Room
                    </button>
                    <div className="border-t border-white/10 my-1"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    handleReport();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 flex items-center gap-2 text-sm"
                >
                  <FlagIcon className="w-4 h-4" />
                  Report Room
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Leave this room?')) {
                      await chatService.removeMember(roomId, userId, userId, 'You');
                      onClose?.();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 text-sm"
                >
                  🚪 Leave Room
                </button>
              </div>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages - Telegram Style Bubbles */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-lg mb-1">No messages yet</p>
            <p className="text-sm opacity-75">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === userId}
                showAvatar={index === 0 || messages[index - 1].senderId !== message.senderId}
                room={room}
                onReaction={(emoji) => handleReaction(message.id, emoji)}
                onReply={() => setReplyingTo(message)}
                onPin={() => handlePin(message.id)}
                onReport={() => handleReport(message.id)}
                canPin={isOwnerOrAdmin}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ArrowUturnLeftIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-400">Replying to {replyingTo.senderName}</p>
              <p className="text-xs text-white/60 truncate">{replyingTo.text}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-white/60 hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input - Telegram Style */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            onClick={() => setShowFileUpload(true)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message... (use /raftai for AI commands)"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            
            {/* AI command indicator */}
            {newMessage.startsWith('/raftai ') && (
              <div className="absolute -top-8 left-0 right-0 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                🤖 AI Command: {newMessage.substring(8)}
              </div>
            )}
          </div>

          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors flex-shrink-0 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-white/10 rounded-lg border border-white/20">
            <div className="grid grid-cols-8 gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯', '✅', '❌', '👀', '🤔', '💪', '🚀', '💡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="p-2 hover:bg-white/20 rounded text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFileUpload && (
        <FileUploadModal
          roomId={roomId}
          userId={userId}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {showInvite && (
        <InviteModal
          roomId={roomId}
          userId={userId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

