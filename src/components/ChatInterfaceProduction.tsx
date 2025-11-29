"use client";

import { useState, useEffect, useRef } from "react";
import { chatService } from "@/lib/chatService.production";
import type { ChatRoom, ChatMessage } from "@/lib/chatService.production";
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
import MessageBubbleProduction from "./MessageBubbleProduction";

interface Props {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  onClose?: () => void;
}

export default function ChatInterfaceProduction({ roomId, userId, userName, userAvatar, userRole, onClose }: Props) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load room
  useEffect(() => {
    let mounted = true;
    chatService.getRoom(roomId).then(roomData => {
      if (mounted && roomData) {
        setRoom(roomData);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [roomId]);

  // Subscribe to messages - REAL TIME
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsubscribe;
  }, [roomId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !room) return;

    const text = newMessage.trim();
    setNewMessage("");
    setReplyingTo(null);

    try {
      await chatService.sendMessage({
        roomId,
        userId,
        userName,
        userAvatar,
        text,
        replyTo: replyingTo?.id
      });
    } catch (error) {
      console.error('Error sending:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOwnerOrAdmin = room?.memberRoles[userId] === 'owner' || room?.memberRoles[userId] === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {room.founderLogo ? (
                <img src={room.founderLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-xl">{room.type === 'deal' ? '🤝' : '💬'}</span>
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
            <p className="text-white/60 text-xs">{room.members.length} members</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
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
                    chatService.report({ roomId, reportedBy: userId, reason: 'User report', details: 'Reported from menu' });
                    alert('Report submitted');
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
                      await chatService.removeMember(roomId, userId, userId, userName);
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
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-lg mb-1">No messages yet</p>
            <p className="text-sm opacity-75">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <MessageBubbleProduction
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === userId}
                showAvatar={idx === 0 || messages[idx - 1].senderId !== msg.senderId}
                canPin={isOwnerOrAdmin}
                onReaction={(emoji) => chatService.addReaction(roomId, msg.id, userId, emoji)}
                onReply={() => setReplyingTo(msg)}
                onPin={() => chatService.pinMessage(roomId, msg.id, userId)}
                onReport={() => chatService.report({ roomId, messageId: msg.id, reportedBy: userId, reason: 'User report', details: '' })}
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
            <ArrowUturnLeftIcon className="w-4 h-4 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-400">Replying to {replyingTo.senderName}</p>
              <p className="text-xs text-white/60 truncate">{replyingTo.text}</p>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 text-white/60 hover:text-white">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
            <PaperClipIcon className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

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
                  className="p-2 hover:bg-white/20 rounded text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

